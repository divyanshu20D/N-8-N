import cron, { type ScheduledTask } from "node-cron";
import Workflow from "../models/Workflow";
import { runWorkflowDocument } from "./workflowRunner.service";
import { verifyWebhookToken } from "../utils/webhookToken";

const scheduleTaskMap = new Map<string, ScheduledTask>();

const scheduleTaskKey = (workflowId: string, nodeId: string) =>
  `${workflowId}:${nodeId}`;

const stopWorkflowScheduleTasks = (workflowId: string) => {
  for (const [key, task] of scheduleTaskMap.entries()) {
    if (key.startsWith(`${workflowId}:`)) {
      task.stop();
      task.destroy();
      scheduleTaskMap.delete(key);
    }
  }
};

const registerWorkflowScheduleTasks = async (workflowId: string) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow || !workflow.active) return;

  const scheduleNodes = workflow.nodes.filter(
    (node) => node.type === "schedule-trigger",
  );

  for (const node of scheduleNodes) {
    const cronExpression = String(node.config?.cronExpression ?? "").trim();
    if (!cronExpression) continue;
    if (!cron.validate(cronExpression)) {
      console.error(
        `[SCHEDULER] Invalid cron expression for workflow=${workflowId} node=${node.id}: ${cronExpression}`,
      );
      continue;
    }

    const key = scheduleTaskKey(workflowId, node.id);
    const task = cron.schedule(cronExpression, async () => {
      try {
        const freshWorkflow = await Workflow.findById(workflowId);
        if (!freshWorkflow || !freshWorkflow.active) return;

        await runWorkflowDocument(freshWorkflow, {
          triggerType: "schedule",
          startNodeIds: [node.id],
          inputSnapshot: { scheduler: { workflowId, nodeId: node.id } },
        });
      } catch (error) {
        console.error(
          `[SCHEDULER_RUN_ERROR] workflow=${workflowId} node=${node.id}`,
          error,
        );
      }
    });

    scheduleTaskMap.set(key, task);
  }
};

export const rebuildAllScheduleTriggers = async () => {
  for (const task of scheduleTaskMap.values()) {
    task.stop();
    task.destroy();
  }
  scheduleTaskMap.clear();

  const activeWorkflows = await Workflow.find({ active: true });
  for (const workflow of activeWorkflows) {
    await registerWorkflowScheduleTasks(workflow._id.toString());
  }
};

export const syncWorkflowScheduleTriggers = async (workflowId: string) => {
  stopWorkflowScheduleTasks(workflowId);
  await registerWorkflowScheduleTasks(workflowId);
};

export const removeWorkflowScheduleTriggers = (workflowId: string) => {
  stopWorkflowScheduleTasks(workflowId);
};

export const initializeTriggerInfrastructure = async () => {
  await rebuildAllScheduleTriggers();
  console.log(
    `[TRIGGER_INIT] Schedule triggers loaded: ${scheduleTaskMap.size} tasks`,
  );
};

export const runWebhookTrigger = async (params: {
  workflowId: string;
  nodeId: string;
  httpMethod: string;
  authToken?: string;
  payload: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
}) => {
  const workflow = await Workflow.findById(params.workflowId);
  if (!workflow || !workflow.active) {
    return { status: 404 as const, message: "Workflow not found or inactive" };
  }

  const webhookNode = workflow.nodes.find(
    (node) => node.id === params.nodeId && node.type === "webhook-trigger",
  );

  if (!webhookNode) {
    return { status: 404 as const, message: "Webhook trigger node not found" };
  }

  const expectedMethod = String(webhookNode.config?.httpMethod ?? "POST")
    .toUpperCase()
    .trim();
  const receivedMethod = params.httpMethod.toUpperCase().trim();
  if (expectedMethod !== receivedMethod) {
    return { status: 405 as const, message: "HTTP method not allowed" };
  }

  const expectedToken = String(webhookNode.config?.authToken ?? "").trim();
  if (expectedToken) {
    const providedToken = (params.authToken ?? "").trim();
    if (
      !providedToken ||
      !verifyWebhookToken({
        providedToken,
        storedToken: expectedToken,
      })
    ) {
      return { status: 401 as const, message: "Unauthorized webhook token" };
    }
  }

  const runResult = await runWorkflowDocument(workflow, {
    triggerType: "webhook",
    startNodeIds: [webhookNode.id],
    inputSnapshot: {
      webhook: {
        workflowId: params.workflowId,
        nodeId: params.nodeId,
        method: receivedMethod,
        headers: params.headers,
        query: params.query,
      },
      body: params.payload,
    },
  });

  return {
    status: 200 as const,
    message: "Webhook accepted",
    executionId: runResult.executionId,
  };
};
