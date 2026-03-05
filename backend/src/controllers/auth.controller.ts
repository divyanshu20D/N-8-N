import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { sendError } from "../utils/errorResponse";

export const register = async (req: Request, res: Response) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json(data);
  } catch (error: any) {
    console.error("[AUTH_REGISTER_ERROR]", {
      email: req.body?.email,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 400, {
      code: "AUTH_REGISTER_FAILED",
      message: error.message || "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json(data);
  } catch (error: any) {
    console.error("[AUTH_LOGIN_ERROR]", {
      email: req.body?.email,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 400, {
      code: "AUTH_LOGIN_FAILED",
      message: error.message || "Login failed",
    });
  }
};
