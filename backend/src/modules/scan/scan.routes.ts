import { Router } from "express";
import { checkIn, getPublicScannerSession, getSessionShareLink, publicCheckIn } from "./scan.controller";

const scanRouter = Router();
const publicScanRouter = Router();

publicScanRouter.get("/:token", getPublicScannerSession);
publicScanRouter.post("/:token/check-in", publicCheckIn);

scanRouter.get("/sessions/:eventSessionId/share-link", getSessionShareLink);
scanRouter.post("/check-in", checkIn);

export { publicScanRouter, scanRouter };
