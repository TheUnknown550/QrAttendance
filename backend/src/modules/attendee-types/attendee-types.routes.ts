import { Router } from "express";
import { createAttendeeType, deleteAttendeeType, listAttendeeTypes } from "./attendee-types.controller";

const attendeeTypesRouter = Router();

attendeeTypesRouter.get("/", listAttendeeTypes);
attendeeTypesRouter.post("/", createAttendeeType);
attendeeTypesRouter.delete("/:id", deleteAttendeeType);

export { attendeeTypesRouter };
