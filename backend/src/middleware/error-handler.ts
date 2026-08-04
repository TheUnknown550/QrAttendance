import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { errorResponse } from "../utils/api-response";
import { ApiError } from "../utils/api-error";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(400).json(errorResponse("Validation failed", error.flatten()));
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json(errorResponse(error.message, error.details));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return response.status(400).json(errorResponse("Database request failed", error.message));
  }

  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const httpErr = error as { statusCode: number; message: string };
    if (httpErr.statusCode >= 400 && httpErr.statusCode < 500) {
      return response.status(httpErr.statusCode).json(errorResponse(httpErr.message));
    }
  }

  console.error(error);
  return response.status(500).json(errorResponse("Internal server error"));
}
