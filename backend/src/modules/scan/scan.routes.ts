import { Router } from "express";
import {
  checkIn,
  getPublicScannerSession,
  getSessionShareLink,
  lookupAttendee,
  publicCheckIn,
  publicCheckInWithPhoto,
  publicLookupAttendee,
} from "./scan.controller";
import { checkInPhotoUpload } from "./scan.upload";

const scanRouter = Router();
const publicScanRouter = Router();

publicScanRouter.get("/:token", getPublicScannerSession);
publicScanRouter.post("/:token/lookup", publicLookupAttendee);
publicScanRouter.post("/:token/check-in", publicCheckIn);
publicScanRouter.post("/:token/check-in-with-photo", checkInPhotoUpload.single("photo"), publicCheckInWithPhoto);

scanRouter.get("/sessions/:eventSessionId/share-link", getSessionShareLink);
scanRouter.post("/lookup", lookupAttendee);
scanRouter.post("/check-in", checkIn);

export { publicScanRouter, scanRouter };
