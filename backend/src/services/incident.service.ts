import mongoose from "mongoose";
import Incident, {
  type IIncident,
  type IncidentSeverity,
  type IncidentStatus,
  type IIncidentTimelineEvent,
  type IRemediationAttempt,
} from "../models/Incident";

export interface IncidentTimelineEventDto {
  type: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface IncidentRemediationAttemptDto {
  action: string;
  status: "pending" | "success" | "failed";
  detail?: string;
  createdAt: number;
  verifiedAt?: number;
}

export interface IncidentDto {
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
  timeline: IncidentTimelineEventDto[];
  remediationAttempts: IncidentRemediationAttemptDto[];
  createdAt: number;
  updatedAt: number;
}

export interface IncidentListQuery {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  page?: number;
  limit?: number;
}

export interface IncidentIngestInput {
  workflowId?: string;
  title: string;
  summary?: string;
  severity?: IncidentSeverity;
  source: string;
  service?: string;
  environment?: string;
  dedupeKey: string;
  symptoms?: string[];
  timelineEvent?: {
    type: string;
    title: string;
    detail?: string;
    metadata?: Record<string, unknown>;
  };
}

const toTimelineDto = (
  event: IIncidentTimelineEvent,
): IncidentTimelineEventDto => ({
  type: event.type,
  title: event.title,
  detail: event.detail,
  metadata:
    event.metadata && typeof event.metadata === "object"
      ? (event.metadata as Record<string, unknown>)
      : undefined,
  createdAt: event.createdAt.getTime(),
});

const toRemediationDto = (
  attempt: IRemediationAttempt,
): IncidentRemediationAttemptDto => ({
  action: attempt.action,
  status: attempt.status,
  detail: attempt.detail,
  createdAt: attempt.createdAt.getTime(),
  verifiedAt: attempt.verifiedAt?.getTime(),
});

const toIncidentDto = (incident: IIncident): IncidentDto => ({
  id: incident._id.toString(),
  userId: incident.userId.toString(),
  workflowId: incident.workflowId?.toString(),
  title: incident.title,
  summary: incident.summary,
  severity: incident.severity,
  status: incident.status,
  source: incident.source,
  service: incident.service,
  environment: incident.environment,
  dedupeKey: incident.dedupeKey,
  signalCount: incident.signalCount,
  currentSymptoms: incident.currentSymptoms,
  notionPageId: incident.notionPageId,
  aiSummary: incident.aiSummary,
  timeline: incident.timeline.map(toTimelineDto),
  remediationAttempts: incident.remediationAttempts.map(toRemediationDto),
  createdAt: incident.createdAt.getTime(),
  updatedAt: incident.updatedAt.getTime(),
});

const buildTimelineEvent = (
  input: IncidentIngestInput["timelineEvent"],
  fallbackTitle: string,
): IIncidentTimelineEvent => ({
  type: input?.type ?? "signal.ingested",
  title: input?.title ?? fallbackTitle,
  detail: input?.detail,
  metadata: input?.metadata,
  createdAt: new Date(),
});

export const ingestIncidentSignal = async (
  userId: string,
  input: IncidentIngestInput,
) => {
  const existing = await Incident.findOne({
    userId,
    dedupeKey: input.dedupeKey,
    status: { $ne: "resolved" },
  }).sort({ updatedAt: -1 });

  const symptoms = Array.from(
    new Set((input.symptoms ?? []).map((symptom) => symptom.trim()).filter(Boolean)),
  );
  const timelineEvent = buildTimelineEvent(input.timelineEvent, "Signal ingested");

  if (existing) {
    existing.title = input.title;
    existing.summary = input.summary ?? existing.summary;
    existing.severity = input.severity ?? existing.severity;
    existing.source = input.source;
    existing.service = input.service ?? existing.service;
    existing.environment = input.environment ?? existing.environment;
    existing.signalCount += 1;
    existing.currentSymptoms = Array.from(
      new Set([...existing.currentSymptoms, ...symptoms]),
    );
    existing.timeline.push(timelineEvent);

    await existing.save();

    return {
      incident: toIncidentDto(existing),
      created: false,
    };
  }

  const incident = new Incident({
    userId,
    workflowId:
      input.workflowId && mongoose.Types.ObjectId.isValid(input.workflowId)
        ? new mongoose.Types.ObjectId(input.workflowId)
        : undefined,
    title: input.title,
    summary: input.summary,
    severity: input.severity ?? "warning",
    status: "open",
    source: input.source,
    service: input.service,
    environment: input.environment,
    dedupeKey: input.dedupeKey,
    signalCount: 1,
    currentSymptoms: symptoms,
    timeline: [
      {
        type: "incident.opened",
        title: "Incident opened",
        detail: input.summary,
        createdAt: new Date(),
      },
      timelineEvent,
    ],
    remediationAttempts: [],
  });

  const saved = await incident.save();
  return {
    incident: toIncidentDto(saved),
    created: true,
  };
};

export const getIncidentById = async (id: string, userId: string) => {
  const incident = await Incident.findOne({ _id: id, userId });
  return incident ? toIncidentDto(incident) : null;
};

export const getUserIncidents = async (userId: string, query: IncidentListQuery) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (query.status) filter.status = query.status;
  if (query.severity) filter.severity = query.severity;

  const [items, total] = await Promise.all([
    Incident.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Incident.countDocuments(filter),
  ]);

  return {
    items: items.map(toIncidentDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const recordRemediationCheck = async (
  id: string,
  userId: string,
  payload: {
    action: string;
    status: "pending" | "success" | "failed";
    detail?: string;
  },
) => {
  const incident = await Incident.findOne({ _id: id, userId });
  if (!incident) return null;

  const now = new Date();
  incident.remediationAttempts.push({
    action: payload.action,
    status: payload.status,
    detail: payload.detail,
    createdAt: now,
    verifiedAt: payload.status === "pending" ? undefined : now,
  });

  incident.timeline.push({
    type: "remediation.checked",
    title: `Remediation ${payload.status}`,
    detail: payload.detail ?? payload.action,
    metadata: { action: payload.action, status: payload.status },
    createdAt: now,
  });

  if (payload.status === "success") {
    incident.status = "monitoring";
  } else if (payload.status === "failed") {
    incident.status = incident.severity === "critical" ? "investigating" : incident.status;
  }

  await incident.save();
  return toIncidentDto(incident);
};

export const updateIncidentAutomationState = async (
  id: string,
  userId: string,
  payload: {
    notionPageId?: string;
    aiSummary?: string;
    status?: IncidentStatus;
    timelineEvent?: {
      type: string;
      title: string;
      detail?: string;
      metadata?: Record<string, unknown>;
    };
  },
) => {
  const incident = await Incident.findOne({ _id: id, userId });
  if (!incident) return null;

  if (payload.notionPageId) {
    incident.notionPageId = payload.notionPageId;
  }

  if (payload.aiSummary) {
    incident.aiSummary = payload.aiSummary;
  }

  if (payload.status) {
    incident.status = payload.status;
  }

  if (payload.timelineEvent) {
    incident.timeline.push({
      type: payload.timelineEvent.type,
      title: payload.timelineEvent.title,
      detail: payload.timelineEvent.detail,
      metadata: payload.timelineEvent.metadata,
      createdAt: new Date(),
    });
  }

  await incident.save();
  return toIncidentDto(incident);
};
