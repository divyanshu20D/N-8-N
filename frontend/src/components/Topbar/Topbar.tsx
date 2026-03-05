/**
 * Topbar — The toolbar at the top of the workflow editor.
 *
 * Contains:
 *  - Back button (to workflow list)
 *  - Workflow name (editable)
 *  - Action buttons (Save, Execute)
 */

import { ArrowLeft, Save, Play, Loader2 } from "lucide-react";
import { useWorkflowStore } from "../../stores/workflowStore";

interface TopbarProps {
  onBack?: () => void;
  onSave?: () => void;
  onExecute?: () => void;
  isSaving?: boolean;
  isExecuting?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

export default function Topbar({
  onBack,
  onSave,
  onExecute,
  isSaving = false,
  isExecuting = false,
  saveStatus = "idle",
}: TopbarProps) {
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);

  const saveStatusText =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "error"
          ? "Save failed"
          : "";

  const saveStatusClass =
    saveStatus === "saving"
      ? "text-text-tertiary"
      : saveStatus === "saved"
        ? "text-success"
        : saveStatus === "error"
          ? "text-error"
          : "text-text-tertiary";

  return (
    <header
      className="flex items-center justify-between h-[var(--topbar-height)] px-4 bg-bg-surface border-b border-border-default z-50 sticky top-0 w-full"
      id="editor-topbar"
    >
      <div className="flex items-center gap-3">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
          onClick={onBack}
          title="Back to workflows"
          id="btn-back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-[1px] h-6 bg-border-default" />
        <input
          className="text-base font-semibold text-text-primary bg-transparent border border-transparent rounded-sm px-2 py-1 min-w-[180px] transition-colors duration-200 hover:border-border-default focus:border-primary focus:outline-none"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Untitled Workflow"
          spellCheck={false}
          id="input-workflow-name"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className={`text-xs font-medium min-w-[72px] text-right ${saveStatusClass}`}>
          {saveStatusText}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-bg-elevated text-text-secondary border border-border-default hover:not:disabled:bg-bg-overlay hover:not:disabled:text-text-primary hover:not:disabled:border-border-hover"
          onClick={onSave}
          disabled={isSaving}
          id="btn-save"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Save</span>
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white shadow-sm hover:not:disabled:bg-primary-hover hover:not:disabled:shadow-[0_0_12px_rgba(255,109,90,0.3)] active:not:disabled:bg-primary-active"
          onClick={onExecute}
          disabled={isExecuting}
          id="btn-execute"
        >
          {isExecuting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
          <span>Execute</span>
        </button>
      </div>
    </header>
  );
}
