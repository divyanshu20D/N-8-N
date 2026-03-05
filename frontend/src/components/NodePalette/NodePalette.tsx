/**
 * NodePalette — Sidebar listing all available node types.
 *
 * Users drag nodes from here onto the canvas.
 * Nodes are organized by category: Triggers, Actions, Utilities.
 * Includes a search bar to filter.
 *
 * How drag-and-drop works:
 *  1. User starts dragging a node type from palette
 *  2. We store the node type in the drag event's dataTransfer
 *  3. The WorkflowEditor canvas listens for the "drop" event
 *  4. On drop, it reads the type and creates a new node at the drop position
 */

import { useState } from "react";
import { Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { NodeCategory } from "../../types/workflow";
import { useNodeCatalogStore } from "../../stores/nodeCatalogStore";

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: "⚡ Triggers",
  action: "🔧 Actions",
  utility: "🧩 Utilities",
};

const CATEGORY_ORDER: NodeCategory[] = ["trigger", "action", "utility"];

export default function NodePalette() {
  const [search, setSearch] = useState("");
  const nodeTypes = useNodeCatalogStore((s) => s.nodeTypes);

  const filtered = nodeTypes.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    nodes: filtered.filter((n) => n.category === cat),
  })).filter((g) => g.nodes.length > 0);

  const onDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className="w-[var(--sidebar-width)] h-full flex flex-col bg-bg-surface border-r border-border-default z-10 overflow-hidden animate-in slide-in-from-left duration-300"
      id="node-palette"
    >
      <div className="p-4 pb-2">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.08em]">
          Nodes
        </h2>
      </div>

      <div className="px-3 pb-3 relative">
        <Search
          size={14}
          className="absolute left-[22px] top-[14px] text-text-tertiary pointer-events-none"
        />
        <input
          className="w-full py-2 pr-3 pl-8 bg-bg-elevated border border-border-default rounded-md text-text-primary text-sm transition-colors duration-200 placeholder:text-text-tertiary focus:border-primary focus:outline-none"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="input-search-nodes"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {grouped.map((group) => (
          <div key={group.category} className="mb-4">
            <div className="text-xs font-medium text-text-tertiary px-2 py-2 mb-1">
              {group.label}
            </div>
            {group.nodes.map((node) => {
              const icons = LucideIcons as unknown as Record<
                string,
                React.ComponentType<{ size?: number }>
              >;
              const Icon = icons[node.icon] ?? LucideIcons.CircleDot;

              return (
                <div
                  key={node.type}
                  className="flex items-center gap-3 p-2 px-3 rounded-md cursor-grab transition-all duration-200 select-none hover:bg-bg-hover active:cursor-grabbing active:scale-[0.98] active:bg-bg-active"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  title={node.description}
                  id={`palette-node-${node.type}`}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-sm text-white shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                    style={{ background: node.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex flex-col gap-[1px] overflow-hidden min-w-0">
                    <span className="text-sm font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                      {node.name}
                    </span>
                    <span className="text-xs text-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis">
                      {node.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="py-8 px-4 text-center text-text-tertiary text-sm">
            No nodes match "{search}"
          </div>
        )}
      </div>
    </aside>
  );
}
