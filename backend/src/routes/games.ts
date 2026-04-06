import { Router } from "express";
import { z } from "zod";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";

export const gamesRouter = Router();

const listSchema = z.object({
  q: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minSizeGB: z.coerce.number().positive().optional(),
  year: z.coerce.number().int().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
  sort: z.enum(["latest", "trending", "popular"]).optional().default("latest"),
});

gamesRouter.get("/categories", async (_req, res) => {
  const rows = await query<{ id: number; name: string }>("SELECT id, name FROM categories ORDER BY name");
  return res.json({ categories: rows });
});

gamesRouter.get("/", async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { q, categoryId, minSizeGB, year, page, pageSize, sort } = parsed.data;
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: any = {};

  if (q) {
    where.push("(g.title LIKE :q OR g.description LIKE :q)");
    params.q = `%${q}%`;
  }
  if (categoryId) {
    where.push("g.category_id = :categoryId");
    params.categoryId = categoryId;
  }
  if (typeof minSizeGB === "number") {
    where.push("g.size_gb >= :minSizeGB");
    params.minSizeGB = minSizeGB;
  }
  if (typeof year === "number") {
    where.push("YEAR(g.release_date) = :year");
    params.year = year;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortSql =
    sort === "trending"
      ? "ORDER BY (IFNULL(r.rating_avg,0) * LOG10(1+IFNULL(d.downloads_count,0))) DESC"
      : sort === "popular"
        ? "ORDER BY IFNULL(d.downloads_count,0) DESC"
        : "ORDER BY g.created_at DESC";

  const rows = await query<any>(
    `
    SELECT
      g.id, g.title, g.version, g.size_gb, g.release_date, g.publisher,
      c.name AS category_name,
      g.cover_image_url,
      IFNULL(r.rating_avg,0) AS rating_avg,
      IFNULL(d.downloads_count,0) AS downloads_count
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    LEFT JOIN (
      SELECT game_id, AVG(rating) AS rating_avg
      FROM ratings
      GROUP BY game_id
    ) r ON r.game_id = g.id
    LEFT JOIN (
      SELECT game_id, COUNT(*) AS downloads_count
      FROM downloads
      GROUP BY game_id
    ) d ON d.game_id = g.id
    ${whereSql}
    ${sortSql}
    LIMIT :limit OFFSET :offset
    `,
    { ...params, limit: pageSize, offset },
  );

  return res.json({ games: rows, page, pageSize });
});

// 🔥 මෙතන තමයි වෙනස කළේ!
gamesRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const game = await query<any>(
    `
    SELECT
      g.*,
      c.name AS category_name,
      IFNULL(r.rating_avg,0) AS rating_avg,
      IFNULL(r.rating_count,0) AS rating_count,
      dl.telegram_file_id AS legacy_download_link
    FROM games g
    LEFT JOIN categories c ON c.id = g.category_id
    LEFT JOIN (
      SELECT game_id, AVG(rating) AS rating_avg, COUNT(*) AS rating_count
      FROM ratings
      GROUP BY game_id
    ) r ON r.game_id = g.id
    LEFT JOIN downloads dl ON dl.game_id = g.id 
    WHERE g.id = :id
    LIMIT 1
    `,
    { id },
  );

  if (!game.length) return res.status(404).json({ error: "Not found" });

  const screenshots = await query<any>(
    `SELECT id, image_url, caption
     FROM game_images
     WHERE game_id = :id AND type = 'screenshot'
     ORDER BY sort_order ASC`,
    { id },
  );

  const bannerCover = await query<any>(
    `SELECT type, image_url
     FROM game_images
     WHERE game_id = :id AND (type='banner' OR type='cover')
     ORDER BY type`,
    { id },
  );

  const banner = bannerCover.find((x: any) => x.type === "banner")?.image_url ?? game[0].banner_image_url ?? null;
  const cover = bannerCover.find((x: any) => x.type === "cover")?.image_url ?? game[0].cover_image_url ?? null;

  const tags = await query<any>(
    `SELECT t.name
     FROM game_tags gt
     JOIN tags t ON t.id = gt.tag_id
     WHERE gt.game_id = :id`,
    { id },
  );

  return res.json({
    game: {
      ...game[0],
      banner_image_url: banner,
      cover_image_url: cover,
      // 🔥 අලුත් ලින්ක් එක හරි පරණ එක හරි මොකක් තිබ්බත් download_url විදිහට යවනවා
      download_url: game[0].download_url || game[0].legacy_download_link || "",
      screenshots,
      tags: tags.map((t: any) => t.name),
    },
  });
});

gamesRouter.post("/:id/rate", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const rating = Number(req.body?.rating);
  if (!Number.isFinite(id) || rating < 1 || rating > 5) return res.status(400).json({ error: "Invalid rating" });

  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  await query(
    `
    INSERT INTO ratings (user_id, game_id, rating, created_at)
    VALUES (:userId, :gameId, :rating, UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      created_at = UTC_TIMESTAMP()
    `,
    { userId: req.user.id, gameId: id, rating },
  );

  res.json({ ok: true });
});