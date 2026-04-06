import { Router } from "express";
import { z } from "zod";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";

export const commentsRouter = Router();

const createCommentSchema = z.object({
  gameId: z.coerce.number().int().positive(),
  content: z.string().min(1).max(2000),
  parentId: z.coerce.number().int().positive().optional().nullable(),
});

commentsRouter.get("/:gameId", async (req, res) => {
  const gameId = Number(req.params.gameId);
  if (!Number.isFinite(gameId)) return res.status(400).json({ error: "Invalid gameId" });

  const comments = await query<any>(
    `
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
    `,
    { gameId },
  );

  res.json({ comments });
});

commentsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { gameId, content, parentId } = parsed.data;
  await query(
    "INSERT INTO comments (user_id, game_id, content, parent_id, created_at) VALUES (:userId,:gameId,:content,:parentId,UTC_TIMESTAMP())",
    { userId: req.user.id, gameId, content, parentId: parentId ?? null },
  );
  res.status(201).json({ ok: true });
});

commentsRouter.post("/:commentId/like", requireAuth, async (req, res) => {
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.status(400).json({ error: "Invalid commentId" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const existing = await query<any>(
    "SELECT 1 FROM comment_likes WHERE user_id = :userId AND comment_id = :commentId LIMIT 1",
    { userId: req.user.id, commentId },
  );

  if (existing.length) {
    await query("DELETE FROM comment_likes WHERE user_id = :userId AND comment_id = :commentId", {
      userId: req.user.id,
      commentId,
    });
    return res.json({ liked: false });
  }

  await query("INSERT INTO comment_likes (user_id, comment_id) VALUES (:userId,:commentId)", {
    userId: req.user.id,
    commentId,
  });
  return res.json({ liked: true });
});

// Admin moderation
commentsRouter.delete("/:commentId", requireAuth, async (req, res) => {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const commentId = Number(req.params.commentId);
  if (!Number.isFinite(commentId)) return res.status(400).json({ error: "Invalid commentId" });
  await query("DELETE FROM comments WHERE id = :commentId", { commentId });
  return res.json({ ok: true });
});

