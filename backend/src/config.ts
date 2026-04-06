import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  backendPort: Number(process.env.BACKEND_PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "7d",

  downloadSecret: required("DOWNLOAD_SECRET"),
  downloadExpiresIn: process.env.DOWNLOAD_EXPIRES_IN ?? "10m",

  db: {
    host: required("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER"),
    password: process.env.DB_PASSWORD || '',
    database: required("DB_NAME"),
  },

  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
};

