import mongoose, { Schema, type Document } from "mongoose";

export type IncidentSeverity = "warning" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "monitoring"
  | "resolved";

export interface IIncidentTimelineEvent {
  type: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IRemediationAttempt {
  action: string;
  status: "pending" | "success" | "failed";
  detail?: string;
  createdAt: Date;
  verifiedAt?: Date;
}

export interface IIncident extends Document {
  userId: mongoose.Types.ObjectId;
  workflowId?: mongoose.Types.ObjectId;
  title: string;
  summary?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: string;
  service?: string;
  environment?: string;
  dedupeKey: string;
  signalCount: number;
  currentSymptoms: string[];
  notionPageId?: string;
  aiSummary?: string;
  timeline: IIncidentTimelineEvent[];
  remediationAttempts: IRemediationAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

const IncidentTimelineEventSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    detail: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const RemediationAttemptSchema = new Schema(
  {
    action: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      required: true,
    },
    detail: { type: String },
    createdAt: { type: Date, required: true, default: Date.now },
    verifiedAt: { type: Date },
  },
  { _id: false },
);

const IncidentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    summary: { type: String },
    severity: {
      type: String,
      enum: ["warning", "high", "critical"],
      default: "warning",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "investigating", "monitoring", "resolved"],
      default: "open",
      index: true,
    },
    source: { type: String, required: true, trim: true },
    service: { type: String, trim: true },
    environment: { type: String, trim: true },
    dedupeKey: { type: String, required: true, trim: true, index: true },
    signalCount: { type: Number, default: 1, min: 1 },
    currentSymptoms: { type: [String], default: [] },
    notionPageId: { type: String },
    aiSummary: { type: String },
    timeline: { type: [IncidentTimelineEventSchema], default: [] },
    remediationAttempts: { type: [RemediationAttemptSchema], default: [] },
  },
  { timestamps: true },
);

IncidentSchema.index({ userId: 1, dedupeKey: 1, status: 1 });
IncidentSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IIncident>("Incident", IncidentSchema);
