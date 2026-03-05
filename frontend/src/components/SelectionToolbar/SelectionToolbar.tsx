import { Trash2, Copy } from "lucide-react";

interface SelectionToolbarProps {
  onDelete: () => void;
  onDuplicate: () => void;
  selectedCount: number;
}

export default function SelectionToolbar({
  onDelete,
  onDuplicate,
  selectedCount,
}: SelectionToolbarProps) {
  if (selectedCount < 1) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-bg-overlay border border-border-hover rounded-lg px-4 py-2 flex items-center gap-3 shadow-xl z-50 animate-in slide-in-from-bottom-2 duration-200">
      <div className="text-sm font-medium text-text-secondary">
        {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
      </div>
      <div className="w-[1px] h-5 bg-border-default" />
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
        onClick={onDuplicate}
        title="Duplicate"
      >
        <Copy size={16} />
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary transition-all duration-200 hover:bg-error/10 hover:text-error"
        onClick={onDelete}
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
