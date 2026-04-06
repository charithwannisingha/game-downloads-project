import fs from "fs";
import path from "path";
import { config } from "./config";
import { app } from "./app";

// Ensure uploads dir exists for image storage.
const uploadsPath = path.join(process.cwd(), config.uploadsDir);
fs.mkdirSync(uploadsPath, { recursive: true });

app.listen(config.backendPort, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${config.backendPort}`);
});

