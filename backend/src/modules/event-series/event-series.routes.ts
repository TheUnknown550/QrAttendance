import { Router } from "express";
import {
  addSessionAttendance,
  createEventSeries,
  createEventSession,
  deleteEventSeries,
  deleteEventSession,
  getEventSession,
  getEventSeries,
  listEventSeries,
  removeSessionAttendance,
  updateEventSeries,
  updateEventSession,
} from "./event-series.controller";

const eventSeriesRouter = Router();

eventSeriesRouter.get("/", listEventSeries);
eventSeriesRouter.post("/", createEventSeries);
eventSeriesRouter.get("/:id", getEventSeries);
eventSeriesRouter.patch("/:id", updateEventSeries);
eventSeriesRouter.delete("/:id", deleteEventSeries);
eventSeriesRouter.post("/:id/sessions", createEventSession);
eventSeriesRouter.get("/:id/sessions/:sessionId", getEventSession);
eventSeriesRouter.patch("/:id/sessions/:sessionId", updateEventSession);
eventSeriesRouter.delete("/:id/sessions/:sessionId", deleteEventSession);
eventSeriesRouter.post("/:id/sessions/:sessionId/attendance", addSessionAttendance);
eventSeriesRouter.delete("/:id/sessions/:sessionId/attendance/:attendeeId", removeSessionAttendance);

export { eventSeriesRouter };
