import type { Request, Response } from "express";
import { errorResponse } from "../utils/api-response";

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).json(errorResponse("Route not found"));
}
