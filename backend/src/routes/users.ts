import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";
import { config } from "../config";

export const usersRouter = Router();

const avatarUploadDir = path.join(process.cwd(), config.uploadsDir, "avatars");
fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `user-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.mimetype);
    cb(null, ok);
  },
});

usersRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await query<any>(
    "SELECT id, username, email, avatar, role, followers_count AS followers FROM users WHERE id = :id",
    { id: req.user.id },
  );
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json({ user: rows[0] });
});

usersRouter.get("/me/saved", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await query<any>(
    `
    SELECT
      g.id, g.title, g.cover_image_url, g.version, g.size_gb, g.release_date
    FROM saved_games sg
    JOIN games g ON g.id = sg.game_id
    WHERE sg.user_id = :userId
    ORDER BY sg.created_at DESC
    LIMIT 50
    `,
    { userId: req.user.id },
  );
  res.json({ games: rows });
});

usersRouter.get("/me/comments", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await query<any>(
    `
    SELECT
      cm.id, cm.content, cm.created_at AS createdAt, cm.parent_id AS parentId,
      g.id AS gameId, g.title AS gameTitle
    FROM comments cm
    JOIN games g ON g.id = cm.game_id
    WHERE cm.user_id = :userId
    ORDER BY cm.created_at DESC
    LIMIT 50
    `,
    { userId: req.user.id },
  );
  res.json({ comments: rows });
});

usersRouter.get("/me/uploads", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await query<any>(
    `
    SELECT
      g.id, g.title, g.cover_image_url, g.version, g.size_gb, g.release_date, c.name AS categoryName
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    WHERE g.uploaded_by = :userId
    ORDER BY g.created_at DESC
    LIMIT 50
    `,
    { userId: req.user.id },
  );
  res.json({ games: rows });
});

usersRouter.get("/is-following/:targetId", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const targetId = Number(req.params.targetId);
  if (!Number.isFinite(targetId) || targetId <= 0) return res.status(400).json({ error: "Invalid targetId" });
  const existing = await query<any>(
    "SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :targetId LIMIT 1",
    { followerId: req.user.id, targetId },
  );
  res.json({ following: existing.length > 0 });
});

usersRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const rows = await query<any>(
    "SELECT id, username, avatar, role, followers_count AS followers FROM users WHERE id = :id",
    { id },
  );
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json({ user: rows[0] });
});

usersRouter.post("/:id/follow", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const followingId = Number(req.params.id);
  if (!Number.isFinite(followingId) || followingId <= 0) return res.status(400).json({ error: "Invalid id" });
  if (followingId === req.user.id) return res.status(400).json({ error: "Cannot follow yourself" });

  const existing = await query<any>(
    "SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :followingId LIMIT 1",
    { followerId: req.user.id, followingId },
  );
  if (existing.length) return res.json({ followed: true });

  await query("INSERT INTO follows (follower_id, following_id, created_at) VALUES (:f,:to,UTC_TIMESTAMP())", {
    f: req.user.id,
    to: followingId,
  });

  await query("UPDATE users SET followers_count = followers_count + 1 WHERE id = :id", { id: followingId });
  res.json({ followed: true });
});

usersRouter.delete("/:id/follow", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const followingId = Number(req.params.id);
  if (!Number.isFinite(followingId) || followingId <= 0) return res.status(400).json({ error: "Invalid id" });

  const existing = await query<any>(
    "SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :followingId LIMIT 1",
    { followerId: req.user.id, followingId },
  );
  if (!existing.length) return res.json({ followed: false });

  await query("DELETE FROM follows WHERE follower_id = :followerId AND following_id = :followingId", {
    followerId: req.user.id,
    followingId,
  });
  await query(
    "UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = :id",
    { id: followingId },
  );

  res.json({ followed: false });
});

usersRouter.post("/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Missing avatar file" });
  const avatarUrl = `/uploads/avatars/${path.basename(file.filename)}`;

  await query("UPDATE users SET avatar = :avatar WHERE id = :id", { avatar: avatarUrl, id: req.user.id });
  res.json({ ok: true, avatar: avatarUrl });
});

// Wishlist / saved games
usersRouter.post("/saved/:gameId", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const gameId = Number(req.params.gameId);
  if (!Number.isFinite(gameId) || gameId <= 0) return res.status(400).json({ error: "Invalid gameId" });

  const existing = await query<any>(
    "SELECT 1 FROM saved_games WHERE user_id = :userId AND game_id = :gameId LIMIT 1",
    { userId: req.user.id, gameId },
  );
  if (existing.length) return res.json({ saved: true });

  await query("INSERT INTO saved_games (user_id, game_id, created_at) VALUES (:u,:g,UTC_TIMESTAMP())", {
    u: req.user.id,
    g: gameId,
  });
  res.json({ saved: true });
});

usersRouter.delete("/saved/:gameId", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const gameId = Number(req.params.gameId);
  if (!Number.isFinite(gameId) || gameId <= 0) return res.status(400).json({ error: "Invalid gameId" });
  await query("DELETE FROM saved_games WHERE user_id = :userId AND game_id = :gameId", {
    userId: req.user.id,
    gameId,
  });
  res.json({ saved: false });
});

