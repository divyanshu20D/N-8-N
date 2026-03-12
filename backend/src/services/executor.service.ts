import type { IWorkflow, INode, IConnection } from "../models/Workflow";
import axios from "axios";
import { ingestIncidentSignal } from "./incident.service";

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
      case "conditional":
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
    (connection) => connection.source === currentNode.id,
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
