import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db";
import { config } from "../config";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1).max(60),
  password: z.string().min(1).max(72),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { username, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const existing = await query<any>(
      "SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1",
      { username, email },
    );
    if (existing.length) return res.status(409).json({ error: "Username/email already in use" });

    const role: "user" | "admin" = "user";
    await query(
      "INSERT INTO users (username, email, password, avatar, role, followers_count, created_at) VALUES (:username,:email,:password,:avatar,:role,0,UTC_TIMESTAMP())",
      { username, email, password: passwordHash, avatar: null, role },
    );

    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to register" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { emailOrUsername, password } = parsed.data;

  try {
    const rows = await query<any>(
      "SELECT id, username, email, password AS password_hash, role, avatar FROM users WHERE username = :v OR email = :v LIMIT 1",
      { v: emailOrUsername },
    );
    if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, role: user.role as "user" | "admin" } as any,
      config.jwtAccessSecret as any,
      { expiresIn: config.jwtAccessExpiresIn } as any,
    );

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // match default in env (can be refined)
    });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to login" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("access_token");
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await query<any>("SELECT id, username, email, avatar, role, followers_count AS followers FROM users WHERE id = :id", {
    id: req.user.id,
  });
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json({ user: { ...rows[0], followers: rows[0].followers } });
});

