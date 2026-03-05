import type { IWorkflow } from "../models/Workflow";
import { executeWorkflow } from "./executor.service";
import * as executionService from "./execution.service";
import type { TriggerType } from "../models/Execution";

export interface RunWorkflowOptions {
  triggerType: TriggerType;
  inputSnapshot?: Record<string, unknown>;
  startNodeIds?: string[];
}

export const runWorkflowDocument = async (
  workflow: IWorkflow,
  options: RunWorkflowOptions,
) => {
  const userId = workflow.userId.toString();
  const execution = await executionService.createExecution({
    workflowId: workflow._id.toString(),
    userId,
    triggerType: options.triggerType,
    inputSnapshot: options.inputSnapshot ?? {},
  });

  try {
    const result = await executeWorkflow(workflow, {
      startNodeIds: options.startNodeIds,
    });

    await executionService.completeExecution(execution.id, userId, {
      finalOutput: result.finalContext as Record<string, unknown>,
      nodeLogs: result.nodeLogs,
    });

    return {
      executionId: execution.id,
      ...result,
    };
  } catch (error: any) {
    await executionService.failExecution(execution.id, userId, {
      errorSummary: error?.message || "Workflow execution failed",
    });
    throw error;
  }
};
