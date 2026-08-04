import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireActiveOrganization, requireAuth } from "../middleware/auth";
import { attendeesRouter } from "../modules/attendees/attendees.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { eventSeriesRouter } from "../modules/event-series/event-series.routes";
import {
  organizationsRouter,
  publicOrganizationsRouter,
} from "../modules/organizations/organizations.routes";
import { reportsRouter } from "../modules/reports/reports.routes";
import { publicScanRouter, scanRouter } from "../modules/scan/scan.routes";
import { successResponse } from "../utils/api-response";

const router = Router();

router.get("/health", (_request, response) => {
  response.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

router.get("/health/ready", async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json(
      successResponse({
        status: "ready",
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.use("/auth", authRouter);
router.use("/organizations", publicOrganizationsRouter);
router.use("/public/scan", publicScanRouter);
router.use(requireAuth);
router.use("/organizations", organizationsRouter);
router.use(requireActiveOrganization);
router.use("/event-series", eventSeriesRouter);
router.use("/attendees", attendeesRouter);
router.use("/scan", scanRouter);
router.use("/reports", reportsRouter);

export { router };
