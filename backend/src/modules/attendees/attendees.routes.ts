import { Router } from "express";
import { attendeeImageUpload } from "./attendees.upload";
import {
  createAttendee,
  deleteAttendee,
  getAttendee,
  listAttendees,
  updateAttendee,
} from "./attendees.controller";

const attendeesRouter = Router();

attendeesRouter.get("/", listAttendees);
attendeesRouter.post("/", attendeeImageUpload.single("profileImage"), createAttendee);
attendeesRouter.get("/:id", getAttendee);
attendeesRouter.patch("/:id", attendeeImageUpload.single("profileImage"), updateAttendee);
attendeesRouter.delete("/:id", deleteAttendee);

export { attendeesRouter };
