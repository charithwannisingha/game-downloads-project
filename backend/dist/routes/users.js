"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const config_1 = require("../config");
exports.usersRouter = (0, express_1.Router)();
const avatarUploadDir = path_1.default.join(process.cwd(), config_1.config.uploadsDir, "avatars");
fs_1.default.mkdirSync(avatarUploadDir, { recursive: true });
const avatarStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarUploadDir),
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase() || ".png";
        cb(null, `user-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    fileFilter: (_req, file, cb) => {
        const ok = ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.mimetype);
        cb(null, ok);
    },
});
exports.usersRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const rows = await (0, db_1.query)("SELECT id, username, email, avatar, role, followers_count AS followers FROM users WHERE id = :id", { id: req.user.id });
    if (!rows.length)
        return res.status(404).json({ error: "User not found" });
    res.json({ user: rows[0] });
});
exports.usersRouter.get("/me/saved", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const rows = await (0, db_1.query)(`
    SELECT
      g.id, g.title, g.cover_image_url, g.version, g.size_gb, g.release_date
    FROM saved_games sg
    JOIN games g ON g.id = sg.game_id
    WHERE sg.user_id = :userId
    ORDER BY sg.created_at DESC
    LIMIT 50
    `, { userId: req.user.id });
    res.json({ games: rows });
});
exports.usersRouter.get("/me/comments", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const rows = await (0, db_1.query)(`
    SELECT
      cm.id, cm.content, cm.created_at AS createdAt, cm.parent_id AS parentId,
      g.id AS gameId, g.title AS gameTitle
    FROM comments cm
    JOIN games g ON g.id = cm.game_id
    WHERE cm.user_id = :userId
    ORDER BY cm.created_at DESC
    LIMIT 50
    `, { userId: req.user.id });
    res.json({ comments: rows });
});
exports.usersRouter.get("/me/uploads", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const rows = await (0, db_1.query)(`
    SELECT
      g.id, g.title, g.cover_image_url, g.version, g.size_gb, g.release_date, c.name AS categoryName
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    WHERE g.uploaded_by = :userId
    ORDER BY g.created_at DESC
    LIMIT 50
    `, { userId: req.user.id });
    res.json({ games: rows });
});
exports.usersRouter.get("/is-following/:targetId", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const targetId = Number(req.params.targetId);
    if (!Number.isFinite(targetId) || targetId <= 0)
        return res.status(400).json({ error: "Invalid targetId" });
    const existing = await (0, db_1.query)("SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :targetId LIMIT 1", { followerId: req.user.id, targetId });
    res.json({ following: existing.length > 0 });
});
exports.usersRouter.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0)
        return res.status(400).json({ error: "Invalid id" });
    const rows = await (0, db_1.query)("SELECT id, username, avatar, role, followers_count AS followers FROM users WHERE id = :id", { id });
    if (!rows.length)
        return res.status(404).json({ error: "User not found" });
    res.json({ user: rows[0] });
});
exports.usersRouter.post("/:id/follow", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const followingId = Number(req.params.id);
    if (!Number.isFinite(followingId) || followingId <= 0)
        return res.status(400).json({ error: "Invalid id" });
    if (followingId === req.user.id)
        return res.status(400).json({ error: "Cannot follow yourself" });
    const existing = await (0, db_1.query)("SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :followingId LIMIT 1", { followerId: req.user.id, followingId });
    if (existing.length)
        return res.json({ followed: true });
    await (0, db_1.query)("INSERT INTO follows (follower_id, following_id, created_at) VALUES (:f,:to,UTC_TIMESTAMP())", {
        f: req.user.id,
        to: followingId,
    });
    await (0, db_1.query)("UPDATE users SET followers_count = followers_count + 1 WHERE id = :id", { id: followingId });
    res.json({ followed: true });
});
exports.usersRouter.delete("/:id/follow", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const followingId = Number(req.params.id);
    if (!Number.isFinite(followingId) || followingId <= 0)
        return res.status(400).json({ error: "Invalid id" });
    const existing = await (0, db_1.query)("SELECT 1 FROM follows WHERE follower_id = :followerId AND following_id = :followingId LIMIT 1", { followerId: req.user.id, followingId });
    if (!existing.length)
        return res.json({ followed: false });
    await (0, db_1.query)("DELETE FROM follows WHERE follower_id = :followerId AND following_id = :followingId", {
        followerId: req.user.id,
        followingId,
    });
    await (0, db_1.query)("UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = :id", { id: followingId });
    res.json({ followed: false });
});
exports.usersRouter.post("/avatar", auth_1.requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "Missing avatar file" });
    const avatarUrl = `/uploads/avatars/${path_1.default.basename(file.filename)}`;
    await (0, db_1.query)("UPDATE users SET avatar = :avatar WHERE id = :id", { avatar: avatarUrl, id: req.user.id });
    res.json({ ok: true, avatar: avatarUrl });
});
// Wishlist / saved games
exports.usersRouter.post("/saved/:gameId", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const gameId = Number(req.params.gameId);
    if (!Number.isFinite(gameId) || gameId <= 0)
        return res.status(400).json({ error: "Invalid gameId" });
    const existing = await (0, db_1.query)("SELECT 1 FROM saved_games WHERE user_id = :userId AND game_id = :gameId LIMIT 1", { userId: req.user.id, gameId });
    if (existing.length)
        return res.json({ saved: true });
    await (0, db_1.query)("INSERT INTO saved_games (user_id, game_id, created_at) VALUES (:u,:g,UTC_TIMESTAMP())", {
        u: req.user.id,
        g: gameId,
    });
    res.json({ saved: true });
});
exports.usersRouter.delete("/saved/:gameId", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const gameId = Number(req.params.gameId);
    if (!Number.isFinite(gameId) || gameId <= 0)
        return res.status(400).json({ error: "Invalid gameId" });
    await (0, db_1.query)("DELETE FROM saved_games WHERE user_id = :userId AND game_id = :gameId", {
        userId: req.user.id,
        gameId,
    });
    res.json({ saved: false });
});
