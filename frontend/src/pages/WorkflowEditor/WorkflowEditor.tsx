import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type ReactFlowInstance,
  type EdgeChange,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "../../stores/workflowStore";
import { useNodeCatalogStore } from "../../stores/nodeCatalogStore";
import { getNodeType } from "../../utils/nodeRegistry";
import {
  getWorkflow,
  saveWorkflow,
  createWorkflow,
  runWorkflow,
} from "../../utils/workflowService";
import WorkflowNode from "../../components/WorkflowNode/WorkflowNode";
import NodePalette from "../../components/NodePalette/NodePalette";
import NodeConfigPanel from "../../components/NodeConfigPanel/NodeConfigPanel";
import Topbar from "../../components/Topbar/Topbar";
import SelectionToolbar from "../../components/SelectionToolbar/SelectionToolbar";
import ContextMenu from "../../components/ContextMenu/ContextMenu";
import type { NodeInstance, Connection } from "../../types/workflow";

const nodeTypes = { workflowNode: WorkflowNode };

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `node_${Date.now()}_${++nodeIdCounter}`;
}

function flowNodesToInstances(nodes: Node[]): NodeInstance[] {
  return nodes.map((n) => ({
    id: n.id,
    type: (n.data as any).nodeType,
    position: n.position,
    config: (n.data as any).config ?? {},
    label: (n.data as any).label,
  }));
}

function flowEdgesToConnections(edges: Edge[]): Connection[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
}

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
  } | null>(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const didLoadWorkflowRef = useRef(false);
  const saveStatusResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (saveStatusResetTimerRef.current) {
      clearTimeout(saveStatusResetTimerRef.current);
    }
    saveStatusResetTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
      saveStatusResetTimerRef.current = null;
    }, 1200);
  }, []);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const nodeTypesCatalog = useNodeCatalogStore((s) => s.nodeTypes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const onNodesChangeStore = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChangeStore = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const deleteEdges = useWorkflowStore((s) => s.deleteEdges);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const resetEditor = useWorkflowStore((s) => s.resetEditor);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingWorkflow(true);
      setError(null);
      try {
        if (!id) {
          const wf = await createWorkflow("Untitled Workflow");
          if (!cancelled) navigate(`/editor/${wf.id}`, { replace: true });
          return;
        }

        const wf = await getWorkflow(id);
        if (!wf) {
          if (!cancelled) {
            navigate("/", { replace: true });
          }
          return;
        }

        if (!cancelled) {
          didLoadWorkflowRef.current = true;
          setWorkflow(
            wf.id,
            wf.name,
            wf.nodes.map((n) => ({
              id: n.id,
              type: "workflowNode",
              position: n.position,
              data: { nodeType: n.type, label: n.label, config: n.config },
            })),
            wf.connections.map((c) => ({
              id: c.id,
              source: c.source,
              target: c.target,
              sourceHandle: c.sourceHandle,
              targetHandle: c.targetHandle,
              animated: true,
              style: { stroke: "#4a4a60", strokeWidth: 2 },
            })),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? "Failed to load workflow");
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkflow(false);
        }
      }
    };
    void load();

    return () => {
      cancelled = true;
      if (saveStatusResetTimerRef.current) {
        clearTimeout(saveStatusResetTimerRef.current);
      }
      resetEditor();
    };
  }, [id, navigate, setWorkflow, resetEditor]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setIsSaving(true);
    setSaveStatus("saving");
    setError(null);
    const store = useWorkflowStore.getState();
    try {
      await saveWorkflow({
        id,
        name: store.workflowName,
        description: "",
        nodes: flowNodesToInstances(store.nodes),
        connections: flowEdgesToConnections(store.edges),
        active: true,
      });
      markSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save workflow");
      setSaveStatus("error");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id || loadingWorkflow || !didLoadWorkflowRef.current) return;

    const timeout = setTimeout(() => {
      const persist = async () => {
        setSaveStatus("saving");
        setError(null);
        const store = useWorkflowStore.getState();
        try {
          await saveWorkflow({
            id,
            name: store.workflowName,
            description: "",
            nodes: flowNodesToInstances(store.nodes),
            connections: flowEdgesToConnections(store.edges),
            active: true,
          });
          markSaved();
        } catch (err: any) {
          setError(err?.response?.data?.message ?? "Failed to auto-save workflow");
          setSaveStatus("error");
        } finally {
        }
      };
      void persist();
    }, 900);

    return () => clearTimeout(timeout);
  }, [id, nodes, edges, workflowName, loadingWorkflow, markSaved]);

  const handleExecute = useCallback(async () => {
    if (!id) return;

    setIsExecuting(true);
    setError(null);

    const store = useWorkflowStore.getState();
    store.nodes.forEach((n) => {
      store.updateNodeStatus(n.id, "idle");
      store.updateNodeExecutionData(n.id, null);
    });

    try {
      await handleSave();
      const result = await runWorkflow(id);
      for (const log of result.nodeLogs) {
        store.updateNodeStatus(
          log.nodeId,
          log.status === "success" ? "success" : "error",
        );

        if (log.status === "success") {
          store.updateNodeExecutionData(log.nodeId, log.output ?? null);
        } else {
          store.updateNodeExecutionData(log.nodeId, {
            error: log.error ?? "Node execution failed",
            output: log.output ?? null,
          });
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to execute workflow");
    } finally {
      setIsExecuting(false);
    }
  }, [id, handleSave]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      const typeDef =
        nodeTypesCatalog.find((n) => n.type === nodeType) ?? getNodeType(nodeType);
      if (!typeDef) return;
      const position = reactFlowInstance.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      if (!position) return;
      addNode({
        id: generateNodeId(),
        type: "workflowNode",
        position,
        data: { nodeType: typeDef.type, label: typeDef.name, config: {} },
      });
    },
    [addNode, nodeTypesCatalog],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeStore>[0]) => {
      onNodesChangeStore(changes);
    },
    [onNodesChangeStore],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeStore(changes);
      if (changes.some((c) => c.type === "remove")) {
        void handleSave();
      }
    },
    [onEdgesChangeStore, handleSave],
  );

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);
  const selectedCount = selectedNodes.length + selectedEdges.length;

  const handleBulkDelete = () => {
    const store = useWorkflowStore.getState();
    selectedNodes.forEach((n) => store.deleteNode(n.id));
    deleteEdges(selectedEdges.map((e) => e.id));
    setMenu(null);
    void handleSave();
  };

  const handleBulkDuplicate = () => {
    selectedNodes.forEach((n) => {
      addNode({
        ...n,
        id: generateNodeId(),
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: false,
      });
    });
    setMenu(null);
  };

  const onNodeContextMenu = useCallback((event: any, node: Node) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const onPaneContextMenu = useCallback((event: any) => {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY });
  }, []);

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden bg-[var(--canvas-bg)]"
      onClick={() => setMenu(null)}
    >
      <Topbar
        onBack={() => {
          void handleSave();
          navigate("/");
        }}
        onSave={() => void handleSave()}
        onExecute={() => void handleExecute()}
        isSaving={isSaving}
        isExecuting={isExecuting}
        saveStatus={saveStatus}
      />
      {error && (
        <div className="mx-4 mt-3 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
      {loadingWorkflow && (
        <div className="mx-4 mt-3 rounded-md border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-tertiary">
          Loading workflow...
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="flex-1 relative [&_.react-flow__pane]:cursor-default [&_.react-flow__edge-path]:stroke-[2] [&_.react-flow__selection]:!border-[var(--color-primary)] [&_.react-flow__selection]:!bg-[var(--color-primary-subtle)] [&_.react-flow__edge.animated_path]:[stroke-dasharray:5] [&_.react-flow__edge.animated_path]:[animation:edgeDash_0.5s_linear_infinite] [&_.react-flow__edge.selected_path]:!stroke-[var(--color-primary)] [&_.react-flow__edge.selected_path]:!stroke-[3]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={(instance) => {
              reactFlowInstance.current = instance;
            }}
            onNodeClick={(_e, node) => selectNode(node.id)}
            onPaneClick={() => {
              selectNode(null);
              setMenu(null);
            }}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={["Backspace", "Delete"]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#4a4a60", strokeWidth: 2 },
              selectable: true,
            }}
            connectionLineStyle={{ stroke: "#ff6d5a", strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.06)"
            />
            <Controls
              className="!bg-bg-surface !border !border-border-default !rounded-lg !shadow-md overflow-hidden [&>button]:!bg-bg-surface [&>button]:!border-b [&>button]:!border-border-default [&>button]:!text-text-secondary [&>button]:!w-8 [&>button]:!h-8 [&>button]:transition-[background,color] [&>button]:duration-[120ms] [&>button:hover]:!bg-bg-elevated [&>button:hover]:!text-text-primary [&>button_svg]:!fill-current [&>button:last-child]:!border-b-0"
              showInteractive={false}
            />
            <MiniMap
              className="!bg-bg-surface !border !border-border-default !rounded-lg !shadow-md overflow-hidden"
              nodeColor={(n) =>
                (
                  nodeTypesCatalog.find(
                    (t) => t.type === ((n.data as any)?.nodeType ?? ""),
                  )?.color ?? getNodeType((n.data as any)?.nodeType ?? "")?.color
                ) ?? "#333"
              }
              maskColor="rgba(0, 0, 0, 0.7)"
              pannable
              zoomable
            />
          </ReactFlow>

          {menu && (
            <ContextMenu
              x={menu.x}
              y={menu.y}
              onDelete={handleBulkDelete}
              onDuplicate={handleBulkDuplicate}
              onExecute={
                menu.nodeId
                  ? () => console.log("execute from node", menu.nodeId)
                  : undefined
              }
            />
          )}

          <SelectionToolbar
            selectedCount={selectedCount}
            onDelete={handleBulkDelete}
            onDuplicate={handleBulkDuplicate}
          />
        </div>
        {selectedNodeId && <NodeConfigPanel onPersist={() => void handleSave()} />}
      </div>
    </div>
  );
}
