import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/errorResponse";

interface RequestLifecycleOptions {
  requestTimeoutMs: number;
}

const getClientIp = (req: Request) => {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || req.ip;
  }
  return req.ip;
};

export const requestLifecycle = (options: RequestLifecycleOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.header("x-request-id")?.trim() || crypto.randomUUID();
    const startedAt = Date.now();
    let timedOut = false;

    res.setHeader("x-request-id", requestId);

    const timeoutTimer = setTimeout(() => {
      if (res.headersSent) return;
      timedOut = true;
      sendError(res, 408, {
        code: "REQUEST_TIMEOUT",
        message: "Request timed out",
        details: {
          requestId,
          timeoutMs: options.requestTimeoutMs,
        },
      });
    }, options.requestTimeoutMs);

    const clearTimer = () => {
      clearTimeout(timeoutTimer);
    };

    res.on("finish", () => {
      clearTimer();
      const durationMs = Date.now() - startedAt;
      const userId = (req as any)?.user?.userId;
      const log = {
        type: "http_request",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: getClientIp(req),
        userId: typeof userId === "string" ? userId : undefined,
        timedOut,
        timestamp: new Date().toISOString(),
      };
      console.log(JSON.stringify(log));
    });

    res.on("close", clearTimer);

    next();
  };
};
