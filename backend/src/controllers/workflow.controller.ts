import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import * as workflowService from "../services/workflow.service";
import { runWorkflowDocument } from "../services/workflowRunner.service";
import {
  removeWorkflowScheduleTriggers,
  syncWorkflowScheduleTriggers,
} from "../services/trigger.service";
import { sendError } from "../utils/errorResponse";

export const createWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.createWorkflow(userId, req.body);
    await syncWorkflowScheduleTriggers(workflow.id);
    res.status(201).json(workflow);
  } catch (error: any) {
    console.error("[CREATE_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_CREATE_ERROR",
      message: error.message || "Error creating workflow",
    });
  }
};

export const getWorkflows = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflows = await workflowService.getUserWorkflows(userId);
    res.status(200).json(workflows);
  } catch (error: any) {
    console.error("[GET_WORKFLOWS_ERROR]", {
      userId: (req.user as any)?.userId,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_LIST_ERROR",
      message: error.message || "Error fetching workflows",
    });
  }
};

export const getWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.getWorkflowById(
      req.params.id as string,
      userId,
    );
    if (!workflow) {
      sendError(res, 404, {
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found",
      });
      return;
    }
    await syncWorkflowScheduleTriggers(workflow.id);
    res.status(200).json(workflow);
  } catch (error: any) {
    console.error("[GET_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      workflowId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_GET_ERROR",
      message: error.message || "Error fetching workflow",
    });
  }
};

export const updateWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.updateWorkflow(
      req.params.id as string,
      userId,
      req.body,
    );
    if (!workflow) {
      sendError(res, 404, {
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found",
      });
      return;
    }
    res.status(200).json(workflow);
  } catch (error: any) {
    console.error("[UPDATE_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      workflowId: req.params.id,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_UPDATE_ERROR",
      message: error.message || "Error updating workflow",
    });
  }
};

export const deleteWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.deleteWorkflow(
      req.params.id as string,
      userId,
    );
    if (!workflow) {
      sendError(res, 404, {
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found",
      });
      return;
    }
    removeWorkflowScheduleTriggers(req.params.id as string);
    res.status(200).json({ message: "Workflow deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      workflowId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_DELETE_ERROR",
      message: error.message || "Error deleting workflow",
    });
  }
};

export const runWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.getWorkflowDocumentForExecution(
      req.params.id as string,
      userId,
    );

    if (!workflow) {
      sendError(res, 404, {
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found",
      });
      return;
    }

    const result = await runWorkflowDocument(workflow, {
      triggerType: "manual",
      inputSnapshot: req.body ?? {},
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("[RUN_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      workflowId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_RUN_ERROR",
      message: error.message || "Error executing workflow",
    });
  }
};

export const duplicateWorkflow = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId;
    const workflow = await workflowService.duplicateWorkflow(
      req.params.id as string,
      userId,
    );
    if (!workflow) {
      sendError(res, 404, {
        code: "WORKFLOW_NOT_FOUND",
        message: "Workflow not found",
      });
      return;
    }
    await syncWorkflowScheduleTriggers(workflow.id);
    res.status(201).json(workflow);
  } catch (error: any) {
    console.error("[DUPLICATE_WORKFLOW_ERROR]", {
      userId: (req.user as any)?.userId,
      workflowId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "WORKFLOW_DUPLICATE_ERROR",
      message: error.message || "Error duplicating workflow",
    });
  }
};
