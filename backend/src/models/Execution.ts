import mongoose, { Schema, type Document } from "mongoose";

export type ExecutionStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export type TriggerType = "manual" | "webhook" | "schedule";

export interface IExecutionNodeLog {
  nodeId: string;
  nodeType: string;
  status: "success" | "failed";
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  output?: unknown;
  error?: string;
}

export interface IExecution extends Document {
  workflowId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  triggerType: TriggerType;
  status: ExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  errorSummary?: string;
  inputSnapshot?: Record<string, unknown>;
  finalOutput?: Record<string, unknown>;
  nodeLogs: IExecutionNodeLog[];
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionNodeLogSchema = new Schema(
  {
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    output: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  { _id: false },
);

const ExecutionSchema: Schema = new Schema(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    triggerType: {
      type: String,
      enum: ["manual", "webhook", "schedule"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["queued", "running", "success", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    finishedAt: { type: Date },
    durationMs: { type: Number },
    errorSummary: { type: String },
    inputSnapshot: { type: Schema.Types.Mixed },
    finalOutput: { type: Schema.Types.Mixed },
    nodeLogs: { type: [ExecutionNodeLogSchema], default: [] },
  },
  { timestamps: true },
);

ExecutionSchema.index({ userId: 1, createdAt: -1 });
ExecutionSchema.index({ workflowId: 1, createdAt: -1 });

export default mongoose.model<IExecution>("Execution", ExecutionSchema);
