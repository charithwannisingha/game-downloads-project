"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const db_1 = require("../db");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
exports.adminRouter = (0, express_1.Router)();

// Admin always requires auth+role.
exports.adminRouter.use(auth_1.requireAuth, auth_2.requireAdmin);

const categoriesSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60),
});

exports.adminRouter.get("/categories", async (_req, res) => {
    const rows = await (0, db_1.query)("SELECT id, name FROM categories ORDER BY name");
    res.json({ categories: rows });
});

exports.adminRouter.post("/categories", async (req, res) => {
    const parsed = categoriesSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { name } = parsed.data;
    const exists = await (0, db_1.query)("SELECT 1 FROM categories WHERE name = :name LIMIT 1", { name });
    if (exists.length)
        return res.status(409).json({ error: "Category already exists" });
    const result = await (0, db_1.query)("INSERT INTO categories (name) VALUES (:name)", { name });
    res.status(201).json({ ok: true });
});

exports.adminRouter.delete("/categories/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
        return res.status(400).json({ error: "Invalid id" });
    await (0, db_1.query)("DELETE FROM categories WHERE id = :id", { id });
    res.json({ ok: true });
});

// ---- Games (CRUD) ----
const gameCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120),
    description: zod_1.z.string().min(1).max(10000),
    sizeGB: zod_1.z.coerce.number().positive(),
    version: zod_1.z.string().min(1).max(40),
    releaseDate: zod_1.z.coerce.date().or(zod_1.z.string().min(1)),
    publisher: zod_1.z.string().min(1).max(100).optional().default(""),
    categoryId: zod_1.z.coerce.number().int().positive(),
    trailerUrl: zod_1.z.string().min(1).max(255).optional().nullable(),
});

const gamesImagesDir = path_1.default.join(process.cwd(), config_1.config.uploadsDir, "games");
fs_1.default.mkdirSync(gamesImagesDir, { recursive: true });

const gameUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, gamesImagesDir),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase() || ".png";
            cb(null, `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

exports.adminRouter.get("/games", async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    // 🔥 මෙතන SELECT එකට අපි අලුත් download_url එකත් දැම්මා
    const rows = await (0, db_1.query)(`
    SELECT g.id, g.title, g.size_gb AS sizeGB, g.version, g.release_date AS releaseDate, c.name AS categoryName, g.publisher, g.download_url
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    WHERE (:q = '' OR g.title LIKE :likeQ)
    ORDER BY g.created_at DESC
    LIMIT 50
    `, { q, likeQ: `%${q}%` });
    res.json({ games: rows });
});

exports.adminRouter.post("/games", gameUpload.fields([
    { name: "banner", maxCount: 1 },
    { name: "cover", maxCount: 1 },
    { name: "screenshot", maxCount: 1 },
]), async (req, res) => {
    const parsed = gameCreateSchema.safeParse({
        title: req.body.title,
        description: req.body.description,
        sizeGB: req.body.sizeGB,
        version: req.body.version,
        releaseDate: req.body.releaseDate,
        publisher: req.body.publisher ?? "",
        categoryId: req.body.categoryId,
        trailerUrl: req.body.trailerUrl ?? null,
    });
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { title, description, sizeGB, version, releaseDate, publisher, categoryId, trailerUrl } = parsed.data;
    const [insertResult] = await (async () => {
        const files = req.files;
        const banner = files?.banner?.[0];
        const cover = files?.cover?.[0];
        const screenshot = files?.screenshot?.[0];
        const bannerUrl = banner ? `/uploads/games/${path_1.default.basename(banner.filename)}` : null;
        const coverUrl = cover ? `/uploads/games/${path_1.default.basename(cover.filename)}` : null;
        const screenshotUrl = screenshot ? `/uploads/games/${path_1.default.basename(screenshot.filename)}` : null;
        const result = await (0, db_1.query)(`
        INSERT INTO games
          (title, description, size_gb, version, release_date, publisher, category_id, banner_image_url, cover_image_url, trailer_youtube_url, uploaded_by, created_at, updated_at)
        VALUES
          (:title,:description,:sizeGB,:version,:releaseDate,:publisher,:categoryId,:bannerUrl,:coverUrl,:trailerUrl,:uploadedBy,UTC_TIMESTAMP(),UTC_TIMESTAMP())
        `, {
            title,
            description,
            sizeGB,
            version,
            releaseDate: new Date(releaseDate).toISOString().slice(0, 10),
            publisher,
            categoryId,
            bannerUrl,
            coverUrl,
            trailerUrl: trailerUrl ?? null,
            uploadedBy: req.user?.id,
        });
        const gameId = result?.insertId;
        if (gameId && screenshotUrl) {
            await (0, db_1.query)(`
          INSERT INTO game_images (game_id, type, image_url, sort_order, created_at)
          VALUES (:gameId,'screenshot',:imageUrl,1,UTC_TIMESTAMP())
          `, { gameId, imageUrl: screenshotUrl });
        }
        return result;
    })();
    res.status(201).json({ ok: true, insertedId: insertResult?.insertId ?? null });
});

exports.adminRouter.put("/games/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
        return res.status(400).json({ error: "Invalid id" });
    const parsed = gameCreateSchema
        .partial()
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const data = parsed.data;
    const keys = Object.keys(data);
    if (!keys.length)
        return res.status(400).json({ error: "No fields provided" });
    const setSql = keys.map((k) => {
        if (k === "sizeGB")
            return "size_gb = :sizeGB";
        if (k === "releaseDate")
            return "release_date = :releaseDate";
        if (k === "categoryId")
            return "category_id = :categoryId";
        if (k === "trailerUrl")
            return "trailer_youtube_url = :trailerUrl";
        return `${k} = :${k}`;
    });
    await (0, db_1.query)(`UPDATE games SET ${setSql.join(",")}, updated_at = UTC_TIMESTAMP() WHERE id = :id`, {
        ...data,
        releaseDate: data.releaseDate ? new Date(data.releaseDate).toISOString().slice(0, 10) : undefined,
        id,
    });
    res.json({ ok: true });
});

exports.adminRouter.delete("/games/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0)
        return res.status(400).json({ error: "Invalid id" });
    await (0, db_1.query)("DELETE FROM games WHERE id = :id", { id });
    res.json({ ok: true });
});

// ---- 🔥 Telegram download config (100% Fixed) ----
exports.adminRouter.post("/games/:id/download", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0)
        return res.status(400).json({ error: "Invalid id" });
    
    // Frontend එකෙන් එවන download_url එක ගන්නවා (Zod Validation එක අයින් කළා ලිහිල් වෙන්න)
    const link = req.body.download_url || req.body.telegramFileId || "";

    try {
        // 1. අලුතින් හදපු games ටේබල් එකේ download_url එකට ලින්ක් එක දානවා
        await (0, db_1.query)(`UPDATE games SET download_url = :link WHERE id = :id`, { id, link });

        // 2. පරණ downloads ටේබල් එකෙත් අප්ඩේට් කරනවා (Error ආවොත් අවුලක් නෑ)
        if (link) {
            await (0, db_1.query)(`
            INSERT INTO downloads (game_id, telegram_file_id, created_at)
            VALUES (:gameId,:link,UTC_TIMESTAMP())
            ON DUPLICATE KEY UPDATE telegram_file_id = VALUES(telegram_file_id)
            `, { gameId: id, link }).catch(() => {});
        } else {
            await (0, db_1.query)(`DELETE FROM downloads WHERE game_id = :gameId`, { gameId: id }).catch(() => {});
        }

        res.json({ ok: true });
    } catch (err) {
        console.error("Error saving download link:", err);
        res.status(500).json({ error: "Failed to save download link" });
    }
});