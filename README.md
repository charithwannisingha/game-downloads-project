# NeonPC Games Downloads (Next.js + Express + MySQL + Telegram)
 <img width="1366" height="949" alt="jijijop" src="https://github.com/user-attachments/assets/f02376b8-3e43-434e-8f62-235b04f0dfce" />




World-class PC game downloading platform with:
JWT auth, Telegram-based secure download links (expiring tokens), comments w/ nested replies, ratings, follows, wishlist, and an admin panel to manage games + Telegram download links.

## 1) Requirements
- MySQL 8+
- Node.js 18+ (or 20+ recommended)
- A Telegram Bot Token (Bot API)
- Two ports:
  - Frontend: `3000`
  - Backend: `4000`

## 2) Database
1. Create the database:
   - `CREATE DATABASE game_downloads;`
2. Run:
   - `database/schema.sql`

## 3) Backend configuration
Edit `backend/.env.example` and copy to `backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_ACCESS_SECRET` (random strong secret)
- `DOWNLOAD_SECRET` (random strong secret)
- `TELEGRAM_BOT_TOKEN` (your bot token)
- `FRONTEND_ORIGIN` (usually `http://localhost:3000`)
- `BACKEND_PORT` (default `4000`)

## 4) Create your first admin user
Registration creates `role='user'` by default.
After creating the first account, promote it in MySQL, for example:
- `UPDATE users SET role='admin' WHERE username='your_username';`

## 5) Telegram `telegram_file_id` (download linking)
Admin “Download” config stores Telegram `file_id` (not the direct file URL).
To obtain a `file_id`:
1. Open a chat with your bot in Telegram.
2. Send a document (zip/exe/whatever) to the bot.
3. Fetch updates and extract `message.document.file_id`.

Example (PowerShell) to read latest updates:
```powershell
Invoke-RestMethod "https://api.telegram.org/bot<TG_BOT_TOKEN>/getUpdates"
```
Then search the response for:
- `file_id`

Use that `file_id` in the Admin panel “Set Download” input.

## 6) Run the servers
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend expects:
- `frontend/.env.local` => `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`

## 7) API endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/games`
- `GET /api/games/:id`
- `POST /api/comments`
- `GET /api/comments/:gameId`
- `POST /api/comments/:commentId/like`
- `POST /api/games/:id/rate`
- `POST /api/download/:gameId` (returns expiring download token)
- `GET /api/download/stream?token=...` (streams file after token validation)

## 8) Security notes (implemented)
- Password hashing: `bcrypt`
- Auth: JWT stored in HttpOnly cookie (`access_token`)
- Download tokens:
  - stateless JWT signed with `DOWNLOAD_SECRET`
  - short expiration (`DOWNLOAD_EXPIRES_IN`, default `10m`)
  - stream endpoint validates token before downloading from Telegram
- Rate limiting: basic Express rate limit enabled globally

## 9) Next improvements (optional)
If you want the “best in world” version, the next steps are:
- Add server-side caching (API + DB query caching)
- Add one-time-use download tokens (store `jti` in DB)
- Add admin UI for tags + screenshot caption management
- Add PWA + offline caching
- Add sitemap generation
- Add AI recommendations endpoint (hybrid keyword + rating-based)

