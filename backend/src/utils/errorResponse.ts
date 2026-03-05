import type { Response } from "express";

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export const sendError = (
  res: Response,
  status: number,
  payload: ErrorPayload,
) => {
  return res.status(status).json({
    success: false,
    message: payload.message,
    error: payload,
  });
};
