"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const api_1 = require("./routes/api");
exports.app = (0, express_1.default)();
exports.app.disable("x-powered-by");
exports.app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // keep simple; you can tighten later
}));
exports.app.use((0, cors_1.default)({
    origin: config_1.config.frontendOrigin,
    credentials: true,
}));
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use(express_1.default.json({ limit: "1mb" }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Serve uploaded images (admin uploads).
exports.app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), config_1.config.uploadsDir)));
exports.app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
exports.app.use("/api", api_1.apiRouter);
exports.default = exports.app;
