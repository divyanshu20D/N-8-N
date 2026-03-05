import type { Request, Response } from "express";
import { runWebhookTrigger } from "../services/trigger.service";
import { sendError } from "../utils/errorResponse";

const readWebhookToken = (req: Request) => {
  const fromHeader = req.header("x-webhook-token");
  if (fromHeader) return fromHeader;

  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const queryToken = req.query.token;
  return typeof queryToken === "string" ? queryToken : undefined;
};

export const handleWebhookTrigger = async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.workflowId as string;
    const nodeId = req.params.nodeId as string;

    const result = await runWebhookTrigger({
      workflowId,
      nodeId,
      httpMethod: req.method,
      authToken: readWebhookToken(req),
      payload:
        req.body && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : {},
      headers: req.headers,
      query: req.query as Record<string, unknown>,
    });

    res.status(result.status).json(result);
  } catch (error: any) {
    console.error("[WEBHOOK_TRIGGER_ERROR]", {
      workflowId: req.params.workflowId,
      nodeId: req.params.nodeId,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WEBHOOK_TRIGGER_ERROR",
      message: error?.message || "Webhook trigger failed",
    });
  }
};
