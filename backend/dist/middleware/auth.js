"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function requireAuth(req, res, next) {
    const token = req.cookies?.access_token;
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtAccessSecret);
        req.user = { id: payload.userId, role: payload.role };
        return next();
    }
    catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
function requireAdmin(req, res, next) {
    if (!req.user)
        return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Forbidden" });
    return next();
}
