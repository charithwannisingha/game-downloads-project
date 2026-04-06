import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/auth";
import { query } from "../db";
import { z } from "zod";
import multer from "multer";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

const categoriesSchema = z.object({
  name: z.string().min(2).max(60),
});

adminRouter.get("/categories", async (_req, res) => {
  const rows = await query<any>("SELECT id, name FROM categories ORDER BY name");
  res.json({ categories: rows });
});

adminRouter.post("/categories", async (req, res) => {
  const parsed = categoriesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name } = parsed.data;
  const exists = await query<any>("SELECT 1 FROM categories WHERE name = :name LIMIT 1", { name });
  if (exists.length) return res.status(409).json({ error: "Category already exists" });
  await query<any>("INSERT INTO categories (name) VALUES (:name)", { name });
  res.status(201).json({ ok: true });
});

adminRouter.delete("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  await query("DELETE FROM categories WHERE id = :id", { id });
  res.json({ ok: true });
});

const gameCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(10000),
  sizeGB: z.coerce.number().positive(),
  version: z.string().min(1).max(40),
  releaseDate: z.coerce.date().or(z.string().min(1)),
  publisher: z.string().min(1).max(100).optional().default(""),
  categoryId: z.coerce.number().int().positive(),
  trailerUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  os: z.string().optional().nullable(),
  processor: z.string().optional().nullable(),
  memory: z.string().optional().nullable(),
  graphics: z.string().optional().nullable(),
  directx: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
});

const formParser = multer().none();

adminRouter.get("/games", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const rows = await query<any>(
    `
    SELECT g.id, g.title, g.size_gb AS sizeGB, g.version, g.release_date AS releaseDate, c.name AS categoryName, g.publisher
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    WHERE (:q = '' OR g.title LIKE :likeQ)
    ORDER BY g.created_at DESC
    LIMIT 50
    `,
    { q, likeQ: `%${q}%` },
  );
  res.json({ games: rows });
});

// --- ADD NEW GAME ---
adminRouter.post("/games", formParser, async (req, res) => {
  const parsed = gameCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, sizeGB, version, releaseDate, publisher, categoryId, trailerUrl, bannerUrl, coverUrl, os, processor, memory, graphics, directx, storage } = parsed.data;

  let screenshotUrls: string[] = [];
  try {
      if (req.body.screenshotsStr) {
          screenshotUrls = JSON.parse(req.body.screenshotsStr);
      }
  } catch (e) {
      console.error("Screenshot parse error:", e);
  }

  try {
    const result: any = await query<any>(
      `
      INSERT INTO games
        (title, description, size_gb, version, release_date, publisher, category_id, banner_image_url, cover_image_url, trailer_youtube_url, os, processor, memory, graphics, directx, storage, uploaded_by, created_at, updated_at)
      VALUES
        (:title,:description,:sizeGB,:version,:releaseDate,:publisher,:categoryId,:bannerUrl,:coverUrl,:trailerUrl,:os,:processor,:memory,:graphics,:directx,:storage,:uploadedBy,UTC_TIMESTAMP(),UTC_TIMESTAMP())
      `,
      {
        title, description, sizeGB, version, releaseDate: new Date(releaseDate).toISOString().slice(0, 10), publisher, categoryId,
        bannerUrl: bannerUrl || null, coverUrl: coverUrl || null, trailerUrl: trailerUrl || null,
        os: os || null, processor: processor || null, memory: memory || null, graphics: graphics || null, directx: directx || null, storage: storage || null,
        uploadedBy: req.user?.id,
      },
    );

    const idResult = await query<any>("SELECT LAST_INSERT_ID() AS id");
    const gameId = idResult[0]?.id || (result as any)?.insertId;
    
    if (gameId && screenshotUrls.length > 0) {
      for (let i = 0; i < screenshotUrls.length; i++) {
        await query(
          `INSERT INTO game_images (game_id, type, image_url, sort_order, created_at) VALUES (:gameId,'screenshot',:imageUrl,:sortOrder,UTC_TIMESTAMP())`,
          { gameId, imageUrl: screenshotUrls[i], sortOrder: i + 1 }
        );
      }
    }

    res.status(201).json({ ok: true, insertedId: gameId ?? null });
  } catch (error: any) {
    console.error("Game Insert Error:", error);
    res.status(500).json({ error: "Database error occurred" });
  }
});

// --- EDIT (UPDATE) GAME ---
adminRouter.put("/games/:id", formParser, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const parsed = gameCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, sizeGB, version, releaseDate, publisher, categoryId, trailerUrl, bannerUrl, coverUrl, os, processor, memory, graphics, directx, storage } = parsed.data;

  let screenshotUrls: string[] = [];
  try {
      if (req.body.screenshotsStr) {
          screenshotUrls = JSON.parse(req.body.screenshotsStr);
      }
  } catch (e) {}

  try {
    // 1. Update Game Details
    await query(
      `
      UPDATE games SET
        title=:title, description=:description, size_gb=:sizeGB, version=:version,
        release_date=:releaseDate, publisher=:publisher, category_id=:categoryId,
        banner_image_url=:bannerUrl, cover_image_url=:coverUrl, trailer_youtube_url=:trailerUrl,
        os=:os, processor=:processor, memory=:memory, graphics=:graphics, directx=:directx, storage=:storage,
        updated_at=UTC_TIMESTAMP()
      WHERE id=:id
      `,
      {
        id, title, description, sizeGB, version, releaseDate: new Date(releaseDate).toISOString().slice(0, 10), publisher, categoryId,
        bannerUrl: bannerUrl || null, coverUrl: coverUrl || null, trailerUrl: trailerUrl || null,
        os: os || null, processor: processor || null, memory: memory || null, graphics: graphics || null, directx: directx || null, storage: storage || null
      }
    );

    // 2. Update Screenshots (Delete old ones and add new ones)
    await query("DELETE FROM game_images WHERE game_id = :id AND type = 'screenshot'", { id });

    if (screenshotUrls.length > 0) {
      for (let i = 0; i < screenshotUrls.length; i++) {
        await query(
          `INSERT INTO game_images (game_id, type, image_url, sort_order, created_at) VALUES (:id,'screenshot',:imageUrl,:sortOrder,UTC_TIMESTAMP())`,
          { id, imageUrl: screenshotUrls[i], sortOrder: i + 1 }
        );
      }
    }

    res.json({ ok: true });
  } catch (error: any) {
    console.error("Game Update Error:", error);
    res.status(500).json({ error: "Database error occurred" });
  }
});

adminRouter.delete("/games/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
  await query("DELETE FROM games WHERE id = :id", { id });
  res.json({ ok: true });
});

adminRouter.post("/games/:id/download", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const schema = z.object({ telegramFileId: z.string().min(1).max(200) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { telegramFileId } = parsed.data;

  await query(
    `
    INSERT INTO downloads (game_id, telegram_file_id, created_at)
    VALUES (:gameId,:telegramFileId,UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE telegram_file_id = VALUES(telegram_file_id)
    `,
    { gameId: id, telegramFileId },
  );
  res.json({ ok: true });
});