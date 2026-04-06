"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("../db");
const config_1 = require("../config");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).max(30),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(72),
});
const loginSchema = zod_1.z.object({
    emailOrUsername: zod_1.z.string().min(1).max(60),
    password: zod_1.z.string().min(1).max(72),
});
exports.authRouter.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { username, email, password } = parsed.data;
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    try {
        const existing = await (0, db_1.query)("SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1", { username, email });
        if (existing.length)
            return res.status(409).json({ error: "Username/email already in use" });
        const role = "user";
        await (0, db_1.query)("INSERT INTO users (username, email, password, avatar, role, followers_count, created_at) VALUES (:username,:email,:password,:avatar,:role,0,UTC_TIMESTAMP())", { username, email, password: passwordHash, avatar: null, role });
        return res.status(201).json({ ok: true });
    }
    catch (e) {
        return res.status(500).json({ error: "Failed to register" });
    }
});
exports.authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { emailOrUsername, password } = parsed.data;
    try {
        const rows = await (0, db_1.query)("SELECT id, username, email, password AS password_hash, role, avatar FROM users WHERE username = :v OR email = :v LIMIT 1", { v: emailOrUsername });
        if (!rows.length)
            return res.status(401).json({ error: "Invalid credentials" });
        const user = rows[0];
        const ok = await bcrypt_1.default.compare(password, user.password_hash);
        if (!ok)
            return res.status(401).json({ error: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, config_1.config.jwtAccessSecret, { expiresIn: config_1.config.jwtAccessExpiresIn });
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: config_1.config.nodeEnv === "production",
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
    }
    catch {
        return res.status(500).json({ error: "Failed to login" });
    }
});
exports.authRouter.post("/logout", (_req, res) => {
    res.clearCookie("access_token");
    res.json({ ok: true });
});
exports.authRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const rows = await (0, db_1.query)("SELECT id, username, email, avatar, role, followers_count AS followers FROM users WHERE id = :id", {
        id: req.user.id,
    });
    if (!rows.length)
        return res.status(404).json({ error: "User not found" });
    res.json({ user: { ...rows[0], followers: rows[0].followers } });
});
