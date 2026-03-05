/**
 * Workflow Editor Store (Zustand)
 *
 * This store manages the state of the workflow editor:
 *  - nodes & edges on the canvas
 *  - selected node
 *  - workflow metadata
 *  - drag-and-drop actions
 *
 * React Flow works by giving you full control over the nodes/edges arrays.
 * We store them here and pass updater functions to React Flow.
 */

import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

interface WorkflowEditorState {
  // ─── Canvas State ──────────────────────────
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // ─── Workflow metadata ─────────────────────
  workflowId: string | null;
  workflowName: string;

  // ─── Actions ───────────────────────────────
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdges: (edgeIds: string[]) => void;
  selectNode: (nodeId: string | null) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeStatus: (
    nodeId: string,
    status: "idle" | "running" | "success" | "error",
  ) => void;
  updateNodeExecutionData: (nodeId: string, data: unknown) => void;

  setWorkflow: (id: string, name: string, nodes: Node[], edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  resetEditor: () => void;
}

export const useWorkflowStore = create<WorkflowEditorState>((set, get) => ({
  // ─── Initial State ──────────────────────────
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowId: null,
  workflowName: "Untitled Workflow",

  // ─── React Flow Change Handlers ─────────────
  // These are called by React Flow whenever users drag nodes,
  // select items, or modify edges. We apply the changes to our state.
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: "#4a4a60", strokeWidth: 2 },
        },
        get().edges,
      ),
    });
  },

  // ─── Node Operations ─────────────────────────
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      selectedNodeId:
        get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  deleteEdges: (edgeIds) => {
    if (edgeIds.length === 0) return;
    const edgeIdSet = new Set(edgeIds);
    set({
      edges: get().edges.filter((e) => !edgeIdSet.has(e.id)),
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  updateNodeLabel: (nodeId, label) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                label,
              },
            }
          : n,
      ),
    });
  },

  updateNodeConfig: (nodeId, config) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...(n.data.config as Record<string, unknown>),
                  ...config,
                },
              },
            }
          : n,
      ),
    });
  },

  updateNodeStatus: (nodeId, status) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                status,
              },
            }
          : n,
      ),
    });
  },

  updateNodeExecutionData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                executionData: data,
              },
            }
          : n,
      ),
    });
  },

  // ─── Workflow Operations ──────────────────────
  setWorkflow: (id, name, nodes, edges) => {
    set({
      workflowId: id,
      workflowName: name,
      nodes,
      edges,
      selectedNodeId: null,
    });
  },

  setWorkflowName: (name) => set({ workflowName: name }),

  resetEditor: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      workflowId: null,
      workflowName: "Untitled Workflow",
    });
  },
}));
