"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
exports.commentsRouter = (0, express_1.Router)();
const createCommentSchema = zod_1.z.object({
    gameId: zod_1.z.coerce.number().int().positive(),
    content: zod_1.z.string().min(1).max(2000),
    parentId: zod_1.z.coerce.number().int().positive().optional().nullable(),
});
exports.commentsRouter.get("/:gameId", async (req, res) => {
    const gameId = Number(req.params.gameId);
    if (!Number.isFinite(gameId))
        return res.status(400).json({ error: "Invalid gameId" });
    const comments = await (0, db_1.query)(`
    SELECT
      cm.id, cm.user_id AS userId, cm.game_id AS gameId, cm.parent_id AS parentId,
      cm.content, cm.created_at AS createdAt,
      u.username,
      (
        SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = cm.id
      ) AS likeCount
    FROM comments cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.game_id = :gameId
    ORDER BY cm.created_at ASC
    `, { gameId });
    res.json({ comments });
});
exports.commentsRouter.post("/", auth_1.requireAuth, async (req, res) => {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const { gameId, content, parentId } = parsed.data;
    await (0, db_1.query)("INSERT INTO comments (user_id, game_id, content, parent_id, created_at) VALUES (:userId,:gameId,:content,:parentId,UTC_TIMESTAMP())", { userId: req.user.id, gameId, content, parentId: parentId ?? null });
    res.status(201).json({ ok: true });
});
exports.commentsRouter.post("/:commentId/like", auth_1.requireAuth, async (req, res) => {
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId))
        return res.status(400).json({ error: "Invalid commentId" });
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const existing = await (0, db_1.query)("SELECT 1 FROM comment_likes WHERE user_id = :userId AND comment_id = :commentId LIMIT 1", { userId: req.user.id, commentId });
    if (existing.length) {
        await (0, db_1.query)("DELETE FROM comment_likes WHERE user_id = :userId AND comment_id = :commentId", {
            userId: req.user.id,
            commentId,
        });
        return res.json({ liked: false });
    }
    await (0, db_1.query)("INSERT INTO comment_likes (user_id, comment_id) VALUES (:userId,:commentId)", {
        userId: req.user.id,
        commentId,
    });
    return res.json({ liked: true });
});
// Admin moderation
exports.commentsRouter.delete("/:commentId", auth_1.requireAuth, async (req, res) => {
    if (!req.user || req.user.role !== "admin")
        return res.status(403).json({ error: "Forbidden" });
    const commentId = Number(req.params.commentId);
    if (!Number.isFinite(commentId))
        return res.status(400).json({ error: "Invalid commentId" });
    await (0, db_1.query)("DELETE FROM comments WHERE id = :commentId", { commentId });
    return res.json({ ok: true });
});
