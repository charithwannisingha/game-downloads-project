"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const app_1 = require("./app");
// Ensure uploads dir exists for image storage.
const uploadsPath = path_1.default.join(process.cwd(), config_1.config.uploadsDir);
fs_1.default.mkdirSync(uploadsPath, { recursive: true });
app_1.app.listen(config_1.config.backendPort, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on :${config_1.config.backendPort}`);
});
