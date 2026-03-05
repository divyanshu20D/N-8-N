import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import * as executionService from "../services/execution.service";
import { sendError } from "../utils/errorResponse";

export const getExecutions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const workflowId = req.query.workflowId as string | undefined;
    const status = req.query.status as
      | "queued"
      | "running"
      | "success"
      | "failed"
      | "cancelled"
      | undefined;

    const data = await executionService.getUserExecutions(userId, {
      workflowId,
      status,
      page,
      limit,
    });
    res.status(200).json(data);
  } catch (error: any) {
    console.error("[GET_EXECUTIONS_ERROR]", {
      userId: (req.user as any)?.userId,
      query: req.query,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "EXECUTION_LIST_ERROR",
      message: error.message || "Error fetching executions",
    });
  }
};

export const getExecution = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const execution = await executionService.getExecutionById(
      req.params.id as string,
      userId,
    );
    if (!execution) {
      sendError(res, 404, {
        code: "EXECUTION_NOT_FOUND",
        message: "Execution not found",
      });
      return;
    }
    res.status(200).json(execution);
  } catch (error: any) {
    console.error("[GET_EXECUTION_ERROR]", {
      userId: (req.user as any)?.userId,
      executionId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "EXECUTION_GET_ERROR",
      message: error.message || "Error fetching execution",
    });
  }
};
