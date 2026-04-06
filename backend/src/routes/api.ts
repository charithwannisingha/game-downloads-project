import { Router } from "express";
import { authRouter } from "./auth";
import { gamesRouter } from "./games";
import { commentsRouter } from "./comments";
import { downloadRouter } from "./download";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/comments", commentsRouter);
apiRouter.use("/download", downloadRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/admin", adminRouter);

