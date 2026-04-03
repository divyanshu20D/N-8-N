import type { IWorkflow, INode, IConnection } from "../models/Workflow";
import axios from "axios";
import {
  ingestIncidentSignal,
  recordRemediationCheck,
  updateIncidentAutomationState,
} from "./incident.service";
import { getDecryptedCredential } from "./credential.service";

type ExecutionContext = Record<string, unknown>;

export interface NodeExecutionLog {
  nodeId: string;
  nodeType: string;
  status: "success" | "failed";
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  output?: unknown;
  error?: string;
}

export interface ExecuteWorkflowOptions {
  startNodeIds?: string[];
  initialContext?: ExecutionContext;
}

export const executeWorkflow = async (
  workflow: IWorkflow,
  options: ExecuteWorkflowOptions = {},
) => {
  console.log(`Starting execution for workflow: ${workflow.name}`);

  const { nodes, connections } = workflow;

  const triggerNodes = options.startNodeIds?.length
    ? nodes.filter((node) => options.startNodeIds?.includes(node.id))
    : (() => {
        // Find trigger nodes (nodes that have no incoming edges)
        const incomingEdgesCount: Record<string, number> = {};
        connections.forEach((connection) => {
          incomingEdgesCount[connection.target] =
            (incomingEdgesCount[connection.target] || 0) + 1;
        });
        return nodes.filter((node) => !incomingEdgesCount[node.id]);
      })();

  if (triggerNodes.length === 0) {
    throw new Error("No trigger nodes found in workflow.");
  }

  // Basic sequential execution (for more complex flows, a queue or DAG solver is needed)
  const context: ExecutionContext = { ...(options.initialContext ?? {}) };
  const nodeLogs: NodeExecutionLog[] = [];
  const userId = workflow.userId.toString();
  const workflowId = workflow._id.toString();

  for (const triggerNode of triggerNodes) {
    await executeNode(
      triggerNode,
      nodes,
      connections,
      context,
      nodeLogs,
      userId,
      workflowId,
    );
  }

  return { success: true, finalContext: context, nodeLogs };
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const parseSymptoms = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.trim().length > 0,
    );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const getValueByPath = (input: unknown, path: string): unknown => {
  if (!path.trim()) return undefined;

  return path
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, input);
};

const compareThreshold = (
  observedValue: number,
  threshold: number,
  comparison: string,
) => {
  switch (comparison) {
    case "gt":
      return observedValue > threshold;
    case "lt":
      return observedValue < threshold;
    case "lte":
      return observedValue <= threshold;
    case "gte":
    default:
      return observedValue >= threshold;
  }
};

const mergeStringLists = (...values: unknown[]) => {
  const merged = values.flatMap((value) => parseSymptoms(value));
  return Array.from(new Set(merged));
};

const parseJsonConfig = (
  rawValue: unknown,
  fieldLabel: string,
): Record<string, unknown> | undefined => {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    const record = toRecord(parsed);
    if (!record) {
      throw new Error(`${fieldLabel} must be a JSON object`);
    }
    return record;
  } catch (error: any) {
    throw new Error(error?.message || `${fieldLabel} is invalid JSON`);
  }
};

const toStringHeaderMap = (value: Record<string, unknown> | undefined) => {
  if (!value) return undefined;

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, String(entryValue)]),
  );
};

const parseStatusCodes = (rawValue: unknown) => {
  const asString = String(rawValue ?? "200,202,204").trim();
  return new Set(
    asString
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isInteger(value)),
  );
};

const findIncidentFromPayload = (payload: unknown): { id: string } | null => {
  const record = toRecord(payload);
  if (!record) return null;

  const directIncident = toRecord(record.incident);
  if (directIncident && typeof directIncident.id === "string") {
    return { id: directIncident.id };
  }

  const nestedIncident = findIncidentFromPayload(record.upstreamPayload);
  if (nestedIncident) return nestedIncident;

  return null;
};

const delay = async (durationMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });

const normalizeComparisonValue = (rawValue: string) => {
  const numericValue = Number(rawValue);
  if (!Number.isNaN(numericValue) && rawValue.trim() !== "") {
    return numericValue;
  }

  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  return rawValue;
};

const evaluateConditional = (
  leftValue: unknown,
  operator: string,
  rightValue: unknown,
) => {
  switch (operator) {
    case "eq":
      return leftValue === rightValue;
    case "neq":
      return leftValue !== rightValue;
    case "gt":
      return Number(leftValue) > Number(rightValue);
    case "lt":
      return Number(leftValue) < Number(rightValue);
    case "contains":
      return String(leftValue ?? "").includes(String(rightValue ?? ""));
    default:
      return false;
  }
};

const inferIssueCategory = (payload: Record<string, unknown> | null) => {
  const symptoms = mergeStringLists(payload?.symptoms);
  const metrics = toRecord(payload?.metrics) ?? {};
  const remediation = toRecord(payload?.remediationAction);
  const summary = String(payload?.summary ?? "").toLowerCase();

  if (
    summary.includes("stripe") ||
    symptoms.some((symptom) => symptom.toLowerCase().includes("stripe"))
  ) {
    return "stripe-provider-degradation";
  }

  if (Number(metrics.errorRate ?? 0) >= 10) {
    return "application-error-spike";
  }

  if (Number(metrics.queueDepth ?? 0) >= 100) {
    return "queue-backlog";
  }

  if (remediation?.status === "failed") {
    return "failed-remediation";
  }

  return "general-incident";
};

const buildAiSummaryText = (
  payload: Record<string, unknown> | null,
  incidentId?: string,
) => {
  const service = String(payload?.service ?? "unknown-service");
  const environment = String(payload?.environment ?? "unknown-environment");
  const severity = String(payload?.severity ?? "warning");
  const metrics = toRecord(payload?.metrics) ?? {};
  const remediation = toRecord(payload?.remediationAction);
  const issueCategory = inferIssueCategory(payload);

  const metricText = Object.entries(metrics)
    .slice(0, 3)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  const remediationText =
    remediation && remediation.status
      ? ` Latest remediation status is ${String(remediation.status)}.`
      : "";

  return `Incident ${incidentId ?? "draft"} for ${service} in ${environment} is currently ${severity}. Likely category: ${issueCategory}.${metricText ? ` Observed metrics: ${metricText}.` : ""}${remediationText}`.trim();
};

const buildNotionBlocks = (payload: Record<string, unknown> | null) => {
  const summary = String(payload?.summary ?? "No summary available");
  const severity = String(payload?.severity ?? "warning");
  const service = String(payload?.service ?? "unknown-service");
  const environment = String(payload?.environment ?? "unknown-environment");
  const symptoms = mergeStringLists(payload?.symptoms);
  const metrics = toRecord(payload?.metrics) ?? {};

  const metricText =
    Object.keys(metrics).length > 0
      ? Object.entries(metrics)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : "No metrics captured";

  const symptomText =
    symptoms.length > 0 ? symptoms.join(", ") : "No symptoms captured";

  return [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: summary } }],
      },
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: `Severity: ${severity}` } },
        ],
      },
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          {
            type: "text",
            text: { content: `Service: ${service} (${environment})` },
          },
        ],
      },
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [{ type: "text", text: { content: `Metrics: ${metricText}` } }],
      },
    },
    {
      object: "block",
      type: "bulleted_list_item",
      bulleted_list_item: {
        rich_text: [
          { type: "text", text: { content: `Symptoms: ${symptomText}` } },
        ],
      },
    },
  ];
};

const getIncomingNodePayload = (
  nodeId: string,
  connections: IConnection[],
  context: ExecutionContext,
) => {
  const incomingConnections = connections.filter(
    (connection) => connection.target === nodeId,
  );

  const parentOutputs = incomingConnections
    .map((connection) => context[connection.source])
    .filter((value) => value !== undefined);

  if (parentOutputs.length === 1) {
    return parentOutputs[0];
  }

  if (parentOutputs.length > 1) {
    return { inputs: parentOutputs };
  }

  return context.$input ?? null;
};

const executeNode = async (
  currentNode: INode,
  allNodes: INode[],
  connections: IConnection[],
  context: ExecutionContext,
  nodeLogs: NodeExecutionLog[],
  userId: string,
  workflowId: string,
) => {
  console.log(`Executing node: ${currentNode.type} (${currentNode.id})`);

  const config = currentNode.config ?? {};
  let outputResult: unknown = null;
  let nextSourceHandles: string[] | null = null;
  const startedAt = new Date();
  let nodeStatus: "success" | "failed" = "success";
  let nodeError: string | undefined;
  const upstreamPayload = getIncomingNodePayload(
    currentNode.id,
    connections,
    context,
  );
  const upstreamRecord = toRecord(upstreamPayload);

  try {
    switch (currentNode.type) {
      case "manual-trigger":
        outputResult = { triggered: true, timestamp: new Date().toISOString() };
        break;

      case "http-request":
        const url = String(config.url ?? "");
        const method = String(config.method ?? "GET");
        if (url) {
          const response = await axios({ method, url, timeout: 30000 });
          outputResult = response.data;
        } else {
          throw new Error("URL is missing in http-request node");
        }
        break;

      case "incident-trigger": {
        const title =
          String(config.title ?? upstreamRecord?.title ?? "").trim() ||
          "Workflow incident";
        const summary =
          String(config.summary ?? upstreamRecord?.summary ?? "").trim() ||
          undefined;
        const severityValue = String(
          config.severity ?? upstreamRecord?.severity ?? "warning",
        ).trim();
        const severity =
          severityValue === "critical" || severityValue === "high"
            ? severityValue
            : "warning";
        const source =
          String(config.source ?? upstreamRecord?.source ?? "workflow.manual").trim() ||
          "workflow.manual";
        const service =
          String(config.service ?? upstreamRecord?.service ?? "").trim() ||
          undefined;
        const environment =
          String(config.environment ?? upstreamRecord?.environment ?? "").trim() ||
          undefined;
        const symptoms = parseSymptoms(config.symptoms ?? upstreamRecord?.symptoms);
        const dedupeKey =
          String(config.dedupeKey ?? upstreamRecord?.dedupeKey ?? "").trim() ||
          [service ?? "workflow", environment ?? "default", title]
            .join(":")
            .toLowerCase()
            .replace(/\s+/g, "-");

        const result = await ingestIncidentSignal(userId, {
          workflowId,
          title,
          summary,
          severity,
          source,
          service,
          environment,
          dedupeKey,
          symptoms,
          timelineEvent: {
            type: "workflow.incident-trigger",
            title: "Incident created from workflow",
            detail: `Node ${currentNode.id} created or updated incident state`,
            metadata: {
              nodeId: currentNode.id,
            },
          },
        });

        outputResult = {
          created: result.created,
          incident: result.incident,
          upstreamPayload,
        };
        break;
      }

      case "signal-check": {
        const signalName =
          String(config.signalName ?? "Signal check").trim() || "Signal check";
        const sourceType = String(config.sourceType ?? "http").trim() || "http";
        const metricField = String(config.metricField ?? "").trim();
        const metricKeySource =
          config.metricKey ?? (metricField || "value");
        const metricKey = String(metricKeySource).trim() || "value";

        if (!metricField) {
          throw new Error("Metric field is required in signal-check node");
        }

        let rawPayload: unknown = upstreamPayload;
        if (sourceType === "http") {
          const url = String(config.url ?? "").trim();
          const method = String(config.method ?? "GET").trim() || "GET";
          if (!url) {
            throw new Error("URL is required for HTTP signal-check nodes");
          }
          const response = await axios({
            method,
            url,
            timeout: 30000,
          });
          rawPayload = response.data;
        } else if (sourceType !== "context") {
          throw new Error(`Unsupported signal-check source type '${sourceType}'`);
        }

        const rawRecord = toRecord(rawPayload);
        const rawValue =
          getValueByPath(rawPayload, metricField) ??
          config.fallbackValue ??
          upstreamRecord?.value ??
          0;
        const observedValue = Number(rawValue);

        if (!Number.isFinite(observedValue)) {
          throw new Error(
            `Metric field '${metricField}' did not resolve to a numeric value`,
          );
        }

        const existingMetrics = toRecord(upstreamRecord?.metrics) ?? {};
        const source =
          String(
            config.source ??
              upstreamRecord?.source ??
              (sourceType === "http" ? "signal-check.http" : "signal-check.context"),
          ).trim() || "signal-check";
        const service =
          String(config.service ?? upstreamRecord?.service ?? "").trim() ||
          undefined;
        const environment =
          String(config.environment ?? upstreamRecord?.environment ?? "").trim() ||
          undefined;
        const dedupeKey =
          String(config.dedupeKey ?? upstreamRecord?.dedupeKey ?? "").trim() ||
          [service ?? "workflow", environment ?? "default", metricKey]
            .join(":")
            .toLowerCase()
            .replace(/\s+/g, "-");
        const summary =
          String(config.summary ?? upstreamRecord?.summary ?? "").trim() ||
          `${signalName} observed value ${observedValue}`;

        outputResult = {
          ...(upstreamRecord ?? {}),
          source,
          service,
          environment,
          dedupeKey,
          summary,
          value: observedValue,
          metrics: {
            ...existingMetrics,
            [metricKey]: observedValue,
          },
          symptoms: mergeStringLists(upstreamRecord?.symptoms, config.symptoms),
          signalCheck: {
            signalName,
            sourceType,
            metricField,
            metricKey,
            observedValue,
            fetchedAt: new Date().toISOString(),
            sample: rawRecord ?? rawPayload,
          },
        };
        break;
      }

      case "severity-rule": {
        const label = String(config.label ?? "Severity rule").trim() || "Severity rule";
        const metricField = String(config.metricField ?? "").trim();
        const comparison = String(config.comparison ?? "gte").trim() || "gte";
        const rawObservedValue =
          getValueByPath(upstreamPayload, metricField) ??
          config.fallbackValue ??
          upstreamRecord?.value ??
          0;
        const observedValue = Number(rawObservedValue);

        if (!metricField) {
          throw new Error("Metric field is required in severity-rule node");
        }

        if (!Number.isFinite(observedValue)) {
          throw new Error(
            `Metric field '${metricField}' did not resolve to a numeric value`,
          );
        }

        const warningThreshold = Number(config.warningThreshold ?? 1);
        const highThreshold = Number(config.highThreshold ?? 5);
        const criticalThreshold = Number(config.criticalThreshold ?? 10);

        if (
          !Number.isFinite(warningThreshold) ||
          !Number.isFinite(highThreshold) ||
          !Number.isFinite(criticalThreshold)
        ) {
          throw new Error("Severity thresholds must be numeric values");
        }

        let severity: "warning" | "high" | "critical" = "warning";
        if (compareThreshold(observedValue, criticalThreshold, comparison)) {
          severity = "critical";
        } else if (compareThreshold(observedValue, highThreshold, comparison)) {
          severity = "high";
        } else if (compareThreshold(observedValue, warningThreshold, comparison)) {
          severity = "warning";
        } else {
          severity = "warning";
        }

        outputResult = {
          ...(upstreamRecord ?? {}),
          severity,
          severityRule: {
            label,
            metricField,
            comparison,
            observedValue,
            thresholds: {
              warning: warningThreshold,
              high: highThreshold,
              critical: criticalThreshold,
            },
            matchedThreshold:
              severity === "critical"
                ? criticalThreshold
                : severity === "high"
                  ? highThreshold
                  : warningThreshold,
          },
          summary:
            upstreamRecord?.summary ??
            `${label} evaluated at ${observedValue} and matched ${severity} severity`,
        };
        break;
      }

      case "remediation-action": {
        const actionName =
          String(config.actionName ?? "Remediation action").trim() ||
          "Remediation action";
        const url = String(config.url ?? "").trim();
        const method = String(config.method ?? "POST").trim() || "POST";
        const timeoutMs = Number(config.timeoutMs ?? 15000);
        const recordToIncident = config.recordToIncident !== false;
        const failWorkflowOnError = config.failWorkflowOnError !== false;

        if (!url) {
          throw new Error("URL is required in remediation-action node");
        }

        const headers = toStringHeaderMap(
          parseJsonConfig(config.headers, "Headers"),
        );
        const configuredBody = parseJsonConfig(config.body, "Request body");
        const successStatusCodes = parseStatusCodes(config.successStatusCodes);
        const incidentRef = findIncidentFromPayload(upstreamPayload);

        const requestBody = configuredBody ?? {
          actionName,
          incidentId: incidentRef?.id,
          service: upstreamRecord?.service,
          environment: upstreamRecord?.environment,
          severity: upstreamRecord?.severity,
          summary: upstreamRecord?.summary,
          metrics: toRecord(upstreamRecord?.metrics) ?? undefined,
        };

        const response = await axios({
          method,
          url,
          data: requestBody,
          headers,
          timeout: Number.isFinite(timeoutMs) ? timeoutMs : 15000,
          validateStatus: () => true,
        });

        const succeeded = successStatusCodes.has(response.status);
        const remediationStatus = succeeded ? "success" : "failed";
        const detail = `${actionName} returned HTTP ${response.status}`;

        let updatedIncident = null;
        if (recordToIncident && incidentRef?.id) {
          updatedIncident = await recordRemediationCheck(incidentRef.id, userId, {
            action: actionName,
            status: remediationStatus,
            detail,
          });
        }

        outputResult = {
          ...(upstreamRecord ?? {}),
          incident: updatedIncident ?? upstreamRecord?.incident,
          remediationAction: {
            actionName,
            status: remediationStatus,
            httpStatus: response.status,
            url,
            responseData: response.data,
            incidentId: incidentRef?.id,
          },
        };

        if (!succeeded) {
          nodeStatus = "failed";
          nodeError = detail;
          if (failWorkflowOnError) {
            throw new Error(detail);
          }
        }
        break;
      }

      case "incident-delay": {
        const duration = Number(config.duration ?? 5);
        const unit = String(config.unit ?? "seconds").trim();
        const multiplier =
          unit === "minutes" ? 60_000 : unit === "milliseconds" ? 1 : 1_000;
        const durationMs = Math.max(0, duration * multiplier);

        await delay(durationMs);

        outputResult = {
          ...(upstreamRecord ?? {}),
          incidentDelay: {
            duration,
            unit,
            durationMs,
            completedAt: new Date().toISOString(),
          },
        };
        break;
      }

      case "ai-summary": {
        const incidentRef = findIncidentFromPayload(upstreamPayload);
        const persistToIncident = config.persistToIncident !== false;
        const aiSummary = buildAiSummaryText(upstreamRecord, incidentRef?.id);

        let updatedIncident = null;
        if (persistToIncident && incidentRef?.id) {
          updatedIncident = await updateIncidentAutomationState(
            incidentRef.id,
            userId,
            {
              aiSummary,
              timelineEvent: {
                type: "ai.summary.generated",
                title: "AI summary generated",
                detail: aiSummary,
              },
            },
          );
        }

        outputResult = {
          ...(upstreamRecord ?? {}),
          incident: updatedIncident ?? upstreamRecord?.incident,
          aiSummary,
        };
        break;
      }

      case "notion-incident": {
        const credentialId = String(config.credentialId ?? "").trim();
        const appendMode = String(config.appendMode ?? "upsert").trim() || "upsert";
        const incidentRef = findIncidentFromPayload(upstreamPayload);
        const incidentRecord = toRecord(upstreamRecord?.incident);

        if (!credentialId) {
          throw new Error("Notion credential is required in notion-incident node");
        }

        const credential = await getDecryptedCredential(credentialId, userId);
        if (!credential) {
          throw new Error("Selected Notion credential could not be loaded");
        }

        const apiKey = String(credential.data.apiKey ?? "").trim();
        const parentPageId = String(credential.data.parentPageId ?? "").trim();
        const notionVersion = String(
          credential.data.notionVersion ?? "2022-06-28",
        ).trim();
        if (!apiKey || !parentPageId) {
          throw new Error("Notion credential is missing apiKey or parentPageId");
        }

        const title =
          String(
            config.title ??
              incidentRecord?.title ??
              upstreamRecord?.title ??
              "Incident",
          ).trim() || "Incident";

        const headers = {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": notionVersion,
          "Content-Type": "application/json",
        };

        let notionPageId = String(incidentRecord?.notionPageId ?? "").trim();
        const blocks = buildNotionBlocks(upstreamRecord);

        if (appendMode === "append" && !notionPageId) {
          throw new Error("No existing Notion page is linked to this incident");
        }

        if (!notionPageId || appendMode === "create") {
          const createResponse = await axios.post(
            "https://api.notion.com/v1/pages",
            {
              parent: {
                type: "page_id",
                page_id: parentPageId,
              },
              properties: {
                title: [
                  {
                    type: "text",
                    text: {
                      content: title,
                    },
                  },
                ],
              },
              children: blocks,
            },
            { headers },
          );

          notionPageId = String(createResponse.data?.id ?? "").trim();
        } else {
          await axios.patch(
            `https://api.notion.com/v1/blocks/${notionPageId}/children`,
            { children: blocks },
            { headers },
          );
        }

        let updatedIncident = null;
        if (incidentRef?.id && notionPageId) {
          updatedIncident = await updateIncidentAutomationState(
            incidentRef.id,
            userId,
            {
              notionPageId,
              timelineEvent: {
                type: "notion.synced",
                title: "Incident synced to Notion",
                detail: `Incident synced to Notion page ${notionPageId}`,
                metadata: { notionPageId },
              },
            },
          );
        }

        outputResult = {
          ...(upstreamRecord ?? {}),
          incident: updatedIncident ?? upstreamRecord?.incident,
          notionSync: {
            notionPageId,
            mode: appendMode,
          },
        };
        break;
      }

      case "conditional": {
        const field = String(config.field ?? "").trim();
        const operator = String(config.operator ?? "eq").trim() || "eq";
        const rightValue = normalizeComparisonValue(String(config.value ?? ""));
        const leftValue = field ? getValueByPath(upstreamPayload, field) : undefined;
        const result = evaluateConditional(leftValue, operator, rightValue);
        nextSourceHandles = [result ? "true" : "false"];

        outputResult = {
          ...(upstreamRecord ?? {}),
          conditional: {
            field,
            operator,
            expected: rightValue,
            actual: leftValue,
            result,
          },
        };
        break;
      }

      case "weather":
        // Example Free API mapping for weather node
        const city = String(config.city ?? "London");
        // Using a free geocoding or mocking weather for now since API key is required
        // For demonstration, we'll hit jsonplaceholder to mock a data fetch
        const weatherResponse = await axios.get(
          `https://jsonplaceholder.typicode.com/posts?userId=1`,
        );
        outputResult = {
          city,
          forecast: "Mocked data",
          data: weatherResponse.data,
        };
        break;

      case "discord":
      case "telegram":
      case "email":
      case "transform":
      case "schedule-trigger":
      case "webhook-trigger":
        outputResult = {
          status: "success",
          message: `${currentNode.type} executed in mock mode`,
          timestamp: new Date().toISOString(),
        };
        break;

      default:
        console.log(`Node type ${currentNode.type} is not implemented yet.`);
        outputResult = { error: "Node type not implemented" };
    }
  } catch (error: any) {
    console.error(`Error executing node ${currentNode.id}:`, error.message);
    outputResult = { error: error.message };
    nodeStatus = "failed";
    nodeError = error.message;
  }

  const finishedAt = new Date();
  nodeLogs.push({
    nodeId: currentNode.id,
    nodeType: currentNode.type,
    status: nodeStatus,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    output: outputResult,
    error: nodeError,
  });

  // Save the result of this node in the context
  context[currentNode.id] = outputResult;

  // Find next nodes
  const outgoingConnections = connections.filter(
    (connection) =>
      connection.source === currentNode.id &&
      (!nextSourceHandles ||
        (!!connection.sourceHandle &&
          nextSourceHandles.includes(connection.sourceHandle))),
  );

  for (const connection of outgoingConnections) {
    const nextNode = allNodes.find((n) => n.id === connection.target);
    if (nextNode) {
      await executeNode(
        nextNode,
        allNodes,
        connections,
        context,
        nodeLogs,
        userId,
        workflowId,
      );
    }
  }
};
