import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/errorResponse";

export interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    sendError(res, 401, {
      code: "AUTH_REQUIRED",
      message: "No token provided, authorization denied",
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[AUTH_MIDDLEWARE_TOKEN_ERROR]", error);
    sendError(res, 401, {
      code: "AUTH_INVALID_TOKEN",
      message: "Token is not valid",
    });
  }
};
