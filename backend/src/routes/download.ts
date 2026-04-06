import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";
import fetch from "node-fetch";

export const downloadRouter = Router();

const tokenRequestSchema = z.object({
  // Optional: allow downloading a specific file if you add variants later.
});

downloadRouter.post("/:gameId", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const parsed = tokenRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const gameId = Number(req.params.gameId);
  if (!Number.isFinite(gameId) || gameId <= 0) return res.status(400).json({ error: "Invalid gameId" });

  // Ensure game exists and has an associated Telegram file id.
  const rows = await query<any>(
    `
    SELECT d.telegram_file_id
    FROM downloads d
    WHERE d.game_id = :gameId
    LIMIT 1
    `,
    { gameId },
  );
  if (!rows.length || !rows[0].telegram_file_id) return res.status(404).json({ error: "Download not configured" });

  const token = jwt.sign(
    { userId: req.user.id, gameId },
    config.downloadSecret as any,
    { expiresIn: config.downloadExpiresIn } as any,
  );

  return res.json({
    ok: true,
    downloadToken: token,
    expiresIn: config.downloadExpiresIn,
  });
});

downloadRouter.get("/stream", async (req, res) => {
  const token = String(req.query.token ?? "");
  if (!token) return res.status(400).json({ error: "Missing token" });

  let payload: any;
  try {
    payload = jwt.verify(token, config.downloadSecret) as { userId: number; gameId: number };
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const gameId = Number(payload.gameId);
  const userId = Number(payload.userId);
  if (!Number.isFinite(gameId) || !Number.isFinite(userId))
    return res.status(400).json({ error: "Invalid token payload" });

  // Validate the download config for this game.
  const dlRows = await query<any>(
    `
    SELECT telegram_file_id
    FROM downloads
    WHERE game_id = :gameId
    LIMIT 1
    `,
    { gameId },
  );
  if (!dlRows.length || !dlRows[0].telegram_file_id)
    return res.status(404).json({ error: "Download not configured" });

  const telegramFileId = dlRows[0].telegram_file_id as string;

  // 1) Resolve file_path using Telegram getFile.
  const getFileUrl = `https://api.telegram.org/bot${encodeURIComponent(config.telegramBotToken)}/getFile?file_id=${encodeURIComponent(
    telegramFileId,
  )}`;

  const getFileRes = await fetch(getFileUrl);
  const getFileJson: any = await getFileRes.json();
  if (!getFileJson?.ok || !getFileJson?.result?.file_path) {
    return res.status(502).json({ error: "Telegram file resolution failed" });
  }
  const filePath = getFileJson.result.file_path as string;

  // 2) Stream the file directly to the client.
  const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${filePath}`;

  const tgRes = await fetch(fileUrl);
  if (!tgRes.ok || !tgRes.body) return res.status(502).json({ error: "Telegram download failed" });

  const contentLength = tgRes.headers.get("content-length");
  const contentType = tgRes.headers.get("content-type") ?? "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  if (contentLength) res.setHeader("Content-Length", contentLength);

  // Give browsers a deterministic filename.
  res.setHeader("Content-Disposition", `attachment; filename=\"game-${gameId}.zip\"`);

  // Pipe stream for best performance + progress tracking.
  tgRes.body.pipe(res);
});

