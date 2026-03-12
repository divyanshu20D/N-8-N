import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import * as incidentService from "../services/incident.service";
import { sendError } from "../utils/errorResponse";

export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const status = req.query.status as
      | "open"
      | "investigating"
      | "monitoring"
      | "resolved"
      | undefined;
    const severity = req.query.severity as
      | "warning"
      | "high"
      | "critical"
      | undefined;

    const data = await incidentService.getUserIncidents(userId, {
      page,
      limit,
      status,
      severity,
    });

    res.status(200).json(data);
  } catch (error: any) {
    console.error("[GET_INCIDENTS_ERROR]", {
      userId: (req.user as any)?.userId,
      query: req.query,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "INCIDENT_LIST_ERROR",
      message: error?.message || "Error fetching incidents",
    });
  }
};

export const getIncident = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const incident = await incidentService.getIncidentById(
      req.params.id as string,
      userId,
    );

    if (!incident) {
      sendError(res, 404, {
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
      return;
    }

    res.status(200).json(incident);
  } catch (error: any) {
    console.error("[GET_INCIDENT_ERROR]", {
      userId: (req.user as any)?.userId,
      incidentId: req.params.id,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "INCIDENT_GET_ERROR",
      message: error?.message || "Error fetching incident",
    });
  }
};

export const ingestIncident = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (
      typeof body.title !== "string" ||
      typeof body.source !== "string" ||
      typeof body.dedupeKey !== "string"
    ) {
      sendError(res, 400, {
        code: "INCIDENT_INGEST_INVALID",
        message: "title, source, and dedupeKey are required",
      });
      return;
    }

    const result = await incidentService.ingestIncidentSignal(userId, {
      workflowId:
        typeof body.workflowId === "string" ? body.workflowId : undefined,
      title: body.title,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      severity:
        body.severity === "warning" ||
        body.severity === "high" ||
        body.severity === "critical"
          ? body.severity
          : undefined,
      source: body.source,
      service: typeof body.service === "string" ? body.service : undefined,
      environment:
        typeof body.environment === "string" ? body.environment : undefined,
      dedupeKey: body.dedupeKey,
      symptoms: Array.isArray(body.symptoms)
        ? body.symptoms.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
      timelineEvent:
        body.timelineEvent &&
        typeof body.timelineEvent === "object" &&
        !Array.isArray(body.timelineEvent)
          ? {
              type:
                typeof (body.timelineEvent as Record<string, unknown>).type ===
                "string"
                  ? ((body.timelineEvent as Record<string, unknown>).type as string)
                  : "signal.ingested",
              title:
                typeof (body.timelineEvent as Record<string, unknown>).title ===
                "string"
                  ? ((body.timelineEvent as Record<string, unknown>).title as string)
                  : "Signal ingested",
              detail:
                typeof (body.timelineEvent as Record<string, unknown>).detail ===
                "string"
                  ? ((body.timelineEvent as Record<string, unknown>).detail as string)
                  : undefined,
              metadata:
                (body.timelineEvent as Record<string, unknown>).metadata &&
                typeof (body.timelineEvent as Record<string, unknown>).metadata ===
                  "object" &&
                !Array.isArray(
                  (body.timelineEvent as Record<string, unknown>).metadata,
                )
                  ? ((body.timelineEvent as Record<string, unknown>)
                      .metadata as Record<string, unknown>)
                  : undefined,
            }
          : undefined,
    });

    res.status(result.created ? 201 : 200).json(result);
  } catch (error: any) {
    console.error("[INGEST_INCIDENT_ERROR]", {
      userId: (req.user as any)?.userId,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "INCIDENT_INGEST_ERROR",
      message: error?.message || "Error ingesting incident",
    });
  }
};

export const remediationCheck = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any).userId as string;
    const body = (req.body ?? {}) as Record<string, unknown>;

    if (
      typeof body.action !== "string" ||
      (body.status !== "pending" &&
        body.status !== "success" &&
        body.status !== "failed")
    ) {
      sendError(res, 400, {
        code: "INCIDENT_REMEDIATION_INVALID",
        message: "action and valid status are required",
      });
      return;
    }

    const incident = await incidentService.recordRemediationCheck(
      req.params.id as string,
      userId,
      {
        action: body.action,
        status: body.status,
        detail: typeof body.detail === "string" ? body.detail : undefined,
      },
    );

    if (!incident) {
      sendError(res, 404, {
        code: "INCIDENT_NOT_FOUND",
        message: "Incident not found",
      });
      return;
    }

    res.status(200).json(incident);
  } catch (error: any) {
    console.error("[INCIDENT_REMEDIATION_ERROR]", {
      userId: (req.user as any)?.userId,
      incidentId: req.params.id,
      body: req.body,
      message: error?.message,
      stack: error?.stack,
    });
    sendError(res, 500, {
      code: "INCIDENT_REMEDIATION_ERROR",
      message: error?.message || "Error recording remediation result",
    });
  }
};
