"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const node_fetch_1 = __importDefault(require("node-fetch"));
exports.downloadRouter = (0, express_1.Router)();
const tokenRequestSchema = zod_1.z.object({
// Optional: allow downloading a specific file if you add variants later.
});
exports.downloadRouter.post("/:gameId", auth_1.requireAuth, async (req, res) => {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    const parsed = tokenRequestSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const gameId = Number(req.params.gameId);
    if (!Number.isFinite(gameId) || gameId <= 0)
        return res.status(400).json({ error: "Invalid gameId" });
    // Ensure game exists and has an associated Telegram file id.
    const rows = await (0, db_1.query)(`
    SELECT d.telegram_file_id
    FROM downloads d
    WHERE d.game_id = :gameId
    LIMIT 1
    `, { gameId });
    if (!rows.length || !rows[0].telegram_file_id)
        return res.status(404).json({ error: "Download not configured" });
    const token = jsonwebtoken_1.default.sign({ userId: req.user.id, gameId }, config_1.config.downloadSecret, { expiresIn: config_1.config.downloadExpiresIn });
    return res.json({
        ok: true,
        downloadToken: token,
        expiresIn: config_1.config.downloadExpiresIn,
    });
});
exports.downloadRouter.get("/stream", async (req, res) => {
    const token = String(req.query.token ?? "");
    if (!token)
        return res.status(400).json({ error: "Missing token" });
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.config.downloadSecret);
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    const gameId = Number(payload.gameId);
    const userId = Number(payload.userId);
    if (!Number.isFinite(gameId) || !Number.isFinite(userId))
        return res.status(400).json({ error: "Invalid token payload" });
    // Validate the download config for this game.
    const dlRows = await (0, db_1.query)(`
    SELECT telegram_file_id
    FROM downloads
    WHERE game_id = :gameId
    LIMIT 1
    `, { gameId });
    if (!dlRows.length || !dlRows[0].telegram_file_id)
        return res.status(404).json({ error: "Download not configured" });
    const telegramFileId = dlRows[0].telegram_file_id;
    // 1) Resolve file_path using Telegram getFile.
    const getFileUrl = `https://api.telegram.org/bot${encodeURIComponent(config_1.config.telegramBotToken)}/getFile?file_id=${encodeURIComponent(telegramFileId)}`;
    const getFileRes = await (0, node_fetch_1.default)(getFileUrl);
    const getFileJson = await getFileRes.json();
    if (!getFileJson?.ok || !getFileJson?.result?.file_path) {
        return res.status(502).json({ error: "Telegram file resolution failed" });
    }
    const filePath = getFileJson.result.file_path;
    // 2) Stream the file directly to the client.
    const fileUrl = `https://api.telegram.org/file/bot${config_1.config.telegramBotToken}/${filePath}`;
    const tgRes = await (0, node_fetch_1.default)(fileUrl);
    if (!tgRes.ok || !tgRes.body)
        return res.status(502).json({ error: "Telegram download failed" });
    const contentLength = tgRes.headers.get("content-length");
    const contentType = tgRes.headers.get("content-type") ?? "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    if (contentLength)
        res.setHeader("Content-Length", contentLength);
    // Give browsers a deterministic filename.
    res.setHeader("Content-Disposition", `attachment; filename=\"game-${gameId}.zip\"`);
    // Pipe stream for best performance + progress tracking.
    tgRes.body.pipe(res);
});
