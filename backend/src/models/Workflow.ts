import mongoose, { Schema, type Document } from "mongoose";

export interface INode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  label?: string;
}

export interface IConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  nodes: INode[];
  connections: IConnection[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NodeSchema = new Schema(
  {
    id: String,
    type: String,
    position: {
      x: Number,
      y: Number,
    },
    config: { type: Schema.Types.Mixed, default: {} },
    label: { type: String },
  },
  { _id: false },
);

const ConnectionSchema = new Schema(
  {
    id: String,
    source: String,
    target: String,
    sourceHandle: String,
    targetHandle: String,
  },
  { _id: false },
);

const WorkflowSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nodes: { type: [NodeSchema], default: [] },
    connections: { type: [ConnectionSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
