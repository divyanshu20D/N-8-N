import Execution, {
  type ExecutionStatus,
  type IExecution,
  type IExecutionNodeLog,
  type TriggerType,
} from "../models/Execution";

export interface ExecutionMetadataDto {
  id: string;
  workflowId: string;
  userId: string;
  triggerType: TriggerType;
  status: ExecutionStatus;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  errorSummary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionDto extends ExecutionMetadataDto {
  inputSnapshot?: Record<string, unknown>;
  finalOutput?: Record<string, unknown>;
  nodeLogs: IExecution["nodeLogs"];
}

export interface ExecutionListQuery {
  workflowId?: string;
  status?: ExecutionStatus;
  page?: number;
  limit?: number;
}

const toMetadataDto = (execution: IExecution): ExecutionMetadataDto => ({
  id: execution._id.toString(),
  workflowId: execution.workflowId.toString(),
  userId: execution.userId.toString(),
  triggerType: execution.triggerType,
  status: execution.status,
  startedAt: execution.startedAt.getTime(),
  finishedAt: execution.finishedAt?.getTime(),
  durationMs: execution.durationMs,
  errorSummary: execution.errorSummary,
  createdAt: execution.createdAt.getTime(),
  updatedAt: execution.updatedAt.getTime(),
});

const toExecutionDto = (execution: IExecution): ExecutionDto => ({
  ...toMetadataDto(execution),
  inputSnapshot: execution.inputSnapshot,
  finalOutput: execution.finalOutput,
  nodeLogs: execution.nodeLogs,
});

export const createExecution = async (params: {
  workflowId: string;
  userId: string;
  triggerType?: TriggerType;
  inputSnapshot?: Record<string, unknown>;
}) => {
  const execution = new Execution({
    workflowId: params.workflowId,
    userId: params.userId,
    triggerType: params.triggerType ?? "manual",
    status: "running",
    startedAt: new Date(),
    inputSnapshot: params.inputSnapshot ?? {},
  });

  const saved = await execution.save();
  return toExecutionDto(saved);
};

export const completeExecution = async (
  id: string,
  userId: string,
  payload: {
    finalOutput?: Record<string, unknown>;
    nodeLogs?: IExecutionNodeLog[];
  },
) => {
  const execution = await Execution.findOne({ _id: id, userId });
  if (!execution) return null;

  const finishedAt = new Date();
  execution.status = "success";
  execution.finishedAt = finishedAt;
  execution.durationMs = finishedAt.getTime() - execution.startedAt.getTime();
  execution.errorSummary = undefined;
  execution.finalOutput = payload.finalOutput ?? {};
  execution.nodeLogs = payload.nodeLogs ?? [];

  await execution.save();
  return toExecutionDto(execution);
};

export const failExecution = async (
  id: string,
  userId: string,
  payload: {
    errorSummary: string;
    finalOutput?: Record<string, unknown>;
    nodeLogs?: IExecutionNodeLog[];
  },
) => {
  const execution = await Execution.findOne({ _id: id, userId });
  if (!execution) return null;

  const finishedAt = new Date();
  execution.status = "failed";
  execution.finishedAt = finishedAt;
  execution.durationMs = finishedAt.getTime() - execution.startedAt.getTime();
  execution.errorSummary = payload.errorSummary;
  execution.finalOutput = payload.finalOutput ?? {};
  execution.nodeLogs = payload.nodeLogs ?? [];

  await execution.save();
  return toExecutionDto(execution);
};

export const getExecutionById = async (id: string, userId: string) => {
  const execution = await Execution.findOne({ _id: id, userId });
  return execution ? toExecutionDto(execution) : null;
};

export const getUserExecutions = async (userId: string, query: ExecutionListQuery) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (query.workflowId) filter.workflowId = query.workflowId;
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Execution.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Execution.countDocuments(filter),
  ]);

  return {
    items: items.map(toMetadataDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
