/**
 * Core workflow types.
 * These define the shape of data throughout the frontend.
 * When we build the backend, it will use identical types.
 */

// ─── Node Instance ────────────────────────────────
export interface NodeInstance {
  id: string;
  type: string; // e.g. 'http-request', 'discord', 'manual-trigger'
  position: { x: number; y: number };
  config: NodeConfig; // Node-specific key-value configuration
  label?: string; // User-facing display label
}

export type NodeConfig = Record<string, unknown>;

// ─── Connection (Edge) ────────────────────────────
export interface Connection {
  id: string;
  source: string; // Node ID that outputs data
  target: string; // Node ID that receives data
  sourceHandle?: string; // For nodes with multiple outputs (e.g., conditional true/false)
  targetHandle?: string; // For nodes with multiple inputs
}

// ─── Workflow Definition ──────────────────────────
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: NodeInstance[];
  connections: Connection[];
  active: boolean;
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
}

// ─── Workflow Metadata (list view) ────────────────
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── Node Type Definition (from registry) ─────────
export type NodeCategory = "trigger" | "action" | "utility";

export interface NodeTypeDefinition {
  type: string;
  category: NodeCategory;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color for the node header
  inputs: number; // Number of input handles
  outputs: number; // Number of output handles
}

// ─── Execution Types ──────────────────────────────
export type ExecutionStatus = "pending" | "running" | "success" | "error";
export type TriggerType = "manual" | "schedule" | "webhook";

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: "success" | "error";
  startedAt: number;
  completedAt: number;
  duration: number;
  triggerType: TriggerType;
  triggerData?: unknown;
  error?: string;
  logs: NodeExecutionLog[];
}

export interface NodeExecutionLog {
  nodeId: string;
  nodeType: string;
  status: ExecutionStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: number;
  completedAt: number;
  duration: number;
}

export interface ExecutionUpdate {
  nodeId: string;
  status: ExecutionStatus;
  output?: unknown;
  error?: string;
  timestamp: number;
}

export type IncidentSeverity = "warning" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "monitoring"
  | "resolved";

export interface IncidentTimelineEvent {
  type: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface IncidentRemediationAttempt {
  action: string;
  status: "pending" | "success" | "failed";
  detail?: string;
  createdAt: number;
  verifiedAt?: number;
}

export interface IncidentItem {
  id: string;
  userId: string;
  workflowId?: string;
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
  timeline: IncidentTimelineEvent[];
  remediationAttempts: IncidentRemediationAttempt[];
  createdAt: number;
  updatedAt: number;
}

export interface IncidentListResponse {
  items: IncidentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
