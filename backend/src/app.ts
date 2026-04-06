import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { config } from "./config";
import { apiRouter } from "./routes/api";

export const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false, // keep simple; you can tighten later
  }),
);

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Serve uploaded images (admin uploads).
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), config.uploadsDir)),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", apiRouter);

export default app;

