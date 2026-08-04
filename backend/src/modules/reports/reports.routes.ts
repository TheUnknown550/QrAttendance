import { Router } from "express";
import {
  exportSeriesReportCsv,
  exportSeriesReportExcel,
  getSeriesReport,
} from "./reports.controller";

const reportsRouter = Router();

reportsRouter.get("/event-series/:id", getSeriesReport);
reportsRouter.get("/event-series/:id/export.csv", exportSeriesReportCsv);
reportsRouter.get("/event-series/:id/export.xlsx", exportSeriesReportExcel);

export { reportsRouter };
