"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(name) {
    const v = process.env[name];
    if (!v)
        throw new Error(`Missing env var: ${name}`);
    return v;
}
exports.config = {
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
        password: required("DB_PASSWORD"),
        database: required("DB_NAME"),
    },
    telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
    uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
};
