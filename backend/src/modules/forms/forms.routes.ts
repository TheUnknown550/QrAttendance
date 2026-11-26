import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit";
import {
  createForm,
  deleteForm,
  getForm,
  listForms,
  syncFormItems,
  updateForm,
  uploadFormImage,
} from "./forms.controller";
import { getPublicForm, submitPublicForm } from "./forms.public";
import { deleteFormResponse, exportFormResponses, listFormResponses } from "./forms.responses";
import { formImageUpload, formResponsePhotoUpload } from "./forms.upload";

const formsRouter = Router();
const publicFormsRouter = Router();

const submitRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  maxRequests: 30,
  keyPrefix: "public-form-submit",
  message: "Too many submissions. Please wait a few minutes and try again.",
});

publicFormsRouter.get("/:token", getPublicForm);
publicFormsRouter.post("/:token/submit", submitRateLimit, formResponsePhotoUpload, submitPublicForm);

formsRouter.get("/", listForms);
formsRouter.post("/", createForm);
formsRouter.get("/:id", getForm);
formsRouter.patch("/:id", updateForm);
formsRouter.delete("/:id", deleteForm);
formsRouter.put("/:id/items", syncFormItems);
formsRouter.post("/:id/images", formImageUpload.single("image"), uploadFormImage);
formsRouter.get("/:id/responses", listFormResponses);
formsRouter.get("/:id/responses/export.xlsx", exportFormResponses);
formsRouter.delete("/:id/responses/:responseId", deleteFormResponse);

export { formsRouter, publicFormsRouter };
