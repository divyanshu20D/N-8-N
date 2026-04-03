import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import * as LucideIcons from "lucide-react";
import { useNodeCatalogStore } from "../../stores/nodeCatalogStore";
import { getNodeType } from "../../utils/nodeRegistry";

interface WorkflowNodeData {
  nodeType: string;
  label: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const nodeTypes = useNodeCatalogStore((s) => s.nodeTypes);
  const typeDef =
    nodeTypes.find((n) => n.type === nodeData.nodeType) ??
    getNodeType(nodeData.nodeType);

  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{
      size?: number;
      strokeWidth?: number;
      className?: string;
    }>
  >;
  const IconComponent =
    icons[typeDef?.icon ?? "CircleDot"] ?? LucideIcons.CircleDot;

  const color = typeDef?.color ?? "#888";
  const status = (data as any).status as
    | "idle"
    | "running"
    | "success"
    | "error";
  const isConditional = nodeData.nodeType === "conditional";

  // Base handle classes
  const handleBaseClasses =
    "!w-2.5 !h-2.5 !border-2 !border-bg-elevated !bg-edge-color !rounded-full transition-all duration-200 z-10 hover:!scale-125";

  return (
    <div
      className={`bg-node-bg border-[1.5px] rounded-lg min-w-[200px] transition-all duration-200 ease-in-out cursor-grab relative overflow-visible
        ${selected ? "border-[var(--node-color)] shadow-[var(--shadow-lg),0_0_0_2px_rgba(255,109,90,0.15),0_0_20px_color-mix(in_srgb,var(--node-color)_25%,transparent)]" : "border-node-border shadow-node hover:border-border-hover hover:shadow-lg"}`}
      style={{ "--node-color": color } as React.CSSProperties}
    >
      {/* Status Badge */}
      {status && status !== "idle" && (
        <div
          className={`absolute -top-2 -right-2 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-node-bg z-20 shadow-sm animate-in zoom-in duration-200
            ${status === "running" ? "bg-warning text-[#1a1a1a]" : ""}
            ${status === "success" ? "bg-success text-[#1a1a1a]" : ""}
            ${status === "error" ? "bg-error text-white" : ""}`}
        >
          {status === "running" && (
            <LucideIcons.Loader2 size={12} className="animate-spin" />
          )}
          {status === "success" && <LucideIcons.Check size={12} />}
          {status === "error" && <LucideIcons.X size={12} />}
        </div>
      )}

      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`${handleBaseClasses} !-top-[5px] !left-1/2 !-translate-x-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-src"
        className={`${handleBaseClasses} !-top-[5px] !left-1/2 !-translate-x-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />

      {/* Right handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={`${handleBaseClasses} !-right-[5px] !top-1/2 !-translate-y-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-src"
        className={`${handleBaseClasses} !-right-[5px] !top-1/2 !-translate-y-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />

      {/* Bottom handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={`${handleBaseClasses} !-bottom-[5px] !left-1/2 !-translate-x-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />
      {!isConditional && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-src"
          className={`${handleBaseClasses} !-bottom-[5px] !left-1/2 !-translate-x-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
        />
      )}

      {isConditional && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className={`${handleBaseClasses} !-bottom-[5px] !left-[28%] hover:!bg-emerald-400 hover:shadow-[0_0_8px_rgba(52,211,153,0.5)]`}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className={`${handleBaseClasses} !-bottom-[5px] !left-[72%] hover:!bg-red-400 hover:shadow-[0_0_8px_rgba(248,113,113,0.5)]`}
          />
          <div className="pointer-events-none absolute -bottom-6 left-[21%] text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            True
          </div>
          <div className="pointer-events-none absolute -bottom-6 left-[63%] text-[10px] font-bold uppercase tracking-wider text-red-300">
            False
          </div>
        </>
      )}

      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`${handleBaseClasses} !-left-[5px] !top-1/2 !-translate-y-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-src"
        className={`${handleBaseClasses} !-left-[5px] !top-1/2 !-translate-y-1/2 hover:!bg-[var(--node-color)] hover:shadow-[0_0_8px_color-mix(in_srgb,var(--node-color)_50%,transparent)]`}
      />

      <div className="flex items-center gap-3 p-3 px-4">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-md text-white shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
          style={{ background: color }}
        >
          <IconComponent size={16} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col gap-[1px] overflow-hidden">
          <span className="text-base font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
            {nodeData.label}
          </span>
          <span className="text-xs text-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis">
            {typeDef?.name ?? nodeData.nodeType}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(WorkflowNode);
