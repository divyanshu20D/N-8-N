import type { IWorkflow, INode, IConnection } from "../models/Workflow";
import axios from "axios";

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
  const context: ExecutionContext = {};
  const nodeLogs: NodeExecutionLog[] = [];

  for (const triggerNode of triggerNodes) {
    await executeNode(triggerNode, nodes, connections, context, nodeLogs);
  }

  return { success: true, finalContext: context, nodeLogs };
};

const executeNode = async (
  currentNode: INode,
  allNodes: INode[],
  connections: IConnection[],
  context: ExecutionContext,
  nodeLogs: NodeExecutionLog[],
) => {
  console.log(`Executing node: ${currentNode.type} (${currentNode.id})`);

  const config = currentNode.config ?? {};
  let outputResult: unknown = null;
  const startedAt = new Date();
  let nodeStatus: "success" | "failed" = "success";
  let nodeError: string | undefined;

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
      await executeNode(nextNode, allNodes, connections, context, nodeLogs);
    }
  }
};
