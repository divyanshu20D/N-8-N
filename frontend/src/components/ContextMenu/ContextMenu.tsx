import { Trash2, Copy, Play } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExecute?: () => void;
}

export default function ContextMenu({
  x,
  y,
  onDelete,
  onDuplicate,
  onExecute,
}: ContextMenuProps) {
  return (
    <div
      className="fixed bg-bg-elevated border border-border-default rounded-md shadow-lg p-1 min-w-[160px] z-[1000] animate-in zoom-in-95 duration-100 ease-out"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {onExecute && (
        <button
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary rounded-sm transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
          onClick={onExecute}
        >
          <Play size={14} />
          <span>Execute From Here</span>
        </button>
      )}
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary rounded-sm transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
        onClick={onDuplicate}
      >
        <Copy size={14} />
        <span>Duplicate</span>
      </button>
      <div className="h-[1px] bg-border-default my-1" />
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error rounded-sm transition-all duration-200 hover:bg-error/10 hover:text-error"
        onClick={onDelete}
      >
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </div>
  );
}
