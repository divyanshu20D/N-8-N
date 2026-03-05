import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { sendError } from "../utils/errorResponse";

type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

type BodyValidator = (body: unknown) => ValidationResult;

export const validateBody = (validator: BodyValidator) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validator(req.body);
    if (!result.valid) {
      sendError(res, 400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: result.message,
      });
      return;
    }
    next();
  };
};

export const validateObjectIdParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawValue = req.params[paramName];
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (!value || typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
      sendError(res, 400, {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: `Invalid '${paramName}' parameter`,
      });
      return;
    }
    next();
  };
};
