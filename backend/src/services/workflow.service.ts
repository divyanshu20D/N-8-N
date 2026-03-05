import Workflow, { type IWorkflow } from "../models/Workflow";

export interface WorkflowMetadataDto {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowDto extends WorkflowMetadataDto {
  nodes: IWorkflow["nodes"];
  connections: IWorkflow["connections"];
}

type WorkflowWriteInput = {
  name?: string;
  description?: string;
  nodes?: IWorkflow["nodes"];
  connections?: IWorkflow["connections"];
  active?: boolean;
};

const toMetadataDto = (workflow: IWorkflow): WorkflowMetadataDto => ({
  id: workflow._id.toString(),
  name: workflow.name,
  description: workflow.description ?? "",
  active: workflow.active,
  createdAt: workflow.createdAt.getTime(),
  updatedAt: workflow.updatedAt.getTime(),
});

const toWorkflowDto = (workflow: IWorkflow): WorkflowDto => ({
  ...toMetadataDto(workflow),
  nodes: workflow.nodes,
  connections: workflow.connections,
});

export const createWorkflow = async (
  userId: string,
  data: WorkflowWriteInput,
) => {
  const workflow = new Workflow({
    name: data.name ?? "Untitled Workflow",
    description: data.description ?? "",
    nodes: data.nodes ?? [],
    connections: data.connections ?? [],
    active: data.active ?? true,
    userId,
  });
  const saved = await workflow.save();
  return toWorkflowDto(saved);
};

export const getUserWorkflows = async (userId: string) => {
  const workflows = await Workflow.find({ userId }).sort({ updatedAt: -1 });
  return workflows.map(toMetadataDto);
};

export const getWorkflowById = async (id: string, userId: string) => {
  const workflow = await Workflow.findOne({ _id: id, userId });
  return workflow ? toWorkflowDto(workflow) : null;
};

export const updateWorkflow = async (
  id: string,
  userId: string,
  data: WorkflowWriteInput,
) => {
  const workflow = await Workflow.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true },
  );
  return workflow ? toWorkflowDto(workflow) : null;
};

export const deleteWorkflow = async (id: string, userId: string) => {
  const workflow = await Workflow.findOneAndDelete({ _id: id, userId });
  return workflow ? toWorkflowDto(workflow) : null;
};

export const duplicateWorkflow = async (id: string, userId: string) => {
  const original = await Workflow.findOne({ _id: id, userId });
  if (!original) return null;

  const copy = new Workflow({
    name: `${original.name} (Copy)`,
    description: original.description ?? "",
    nodes: original.nodes,
    connections: original.connections,
    active: false,
    userId,
  });

  const saved = await copy.save();
  return toWorkflowDto(saved);
};

export const getWorkflowDocumentForExecution = async (
  id: string,
  userId: string,
) => {
  return Workflow.findOne({ _id: id, userId });
};
