import type { WorkflowDefinition, WorkflowMetadata } from "../types/workflow";
import { api } from "./api";

export interface RunWorkflowResult {
  executionId?: string;
  success: boolean;
  finalContext: Record<string, unknown>;
  nodeLogs: Array<{
    nodeId: string;
    nodeType: string;
    status: "success" | "failed";
    output?: unknown;
    error?: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
  }>;
}

export interface WorkflowSavePayload {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowDefinition["nodes"];
  connections: WorkflowDefinition["connections"];
  active: boolean;
}

export async function listWorkflows(): Promise<WorkflowMetadata[]> {
  const { data } = await api.get<WorkflowMetadata[]>("/workflows");
  return data;
}

export async function getWorkflow(id: string): Promise<WorkflowDefinition | null> {
  try {
    const { data } = await api.get<WorkflowDefinition>(`/workflows/${id}`);
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function createWorkflow(name: string): Promise<WorkflowDefinition> {
  const { data } = await api.post<WorkflowDefinition>("/workflows", { name });
  return data;
}

export async function saveWorkflow(
  workflow: WorkflowSavePayload,
): Promise<WorkflowDefinition> {
  const { data } = await api.put<WorkflowDefinition>(
    `/workflows/${workflow.id}`,
    {
      name: workflow.name,
      description: workflow.description ?? "",
      nodes: workflow.nodes,
      connections: workflow.connections,
      active: workflow.active,
    },
  );
  return data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await api.delete(`/workflows/${id}`);
}

export async function duplicateWorkflow(
  id: string,
): Promise<WorkflowDefinition | null> {
  try {
    const { data } = await api.post<WorkflowDefinition>(
      `/workflows/${id}/duplicate`,
    );
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function runWorkflow(id: string): Promise<RunWorkflowResult> {
  const { data } = await api.post<RunWorkflowResult>(`/workflows/${id}/run`, {});
  return data;
}
