import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Copy,
  Pencil,
  Workflow,
} from "lucide-react";
import {
  listWorkflows,
  createWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from "../../utils/workflowService";
import type { WorkflowMetadata } from "../../types/workflow";

export default function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWorkflows();
      setWorkflows(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    try {
      const wf = await createWorkflow("Untitled Workflow");
      navigate(`/editor/${wf.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create workflow");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteWorkflow(id);
      setMenuOpen(null);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to delete workflow");
    }
  };

  const handleDuplicate = async (id: string) => {
    setError(null);
    try {
      await duplicateWorkflow(id);
      setMenuOpen(null);
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to duplicate workflow");
    }
  };

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="h-screen w-screen overflow-y-auto bg-bg-base py-8 px-6"
      id="workflow-list-page"
    >
      <div className="max-w-[1100px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <header className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              Workflows
            </h1>
            <p className="text-sm text-text-tertiary mt-1">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-md text-sm font-medium shadow-sm transition-all duration-120 hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(255,109,90,0.25)]"
            onClick={handleCreate}
            id="btn-create-workflow"
          >
            <Plus size={18} />
            <span>New Workflow</span>
          </button>
        </header>

        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          />
          <input
            className="w-full py-3 pr-4 pl-10 bg-bg-surface border border-border-default rounded-lg text-text-primary text-base transition-colors duration-120 placeholder:text-text-tertiary focus:border-primary focus:outline-none"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-search-workflows"
          />
        </div>
        {error && (
          <div className="mb-4 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-text-tertiary text-sm">
            Loading workflows...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3 text-text-tertiary">
            <Workflow size={48} strokeWidth={1} />
            <h2 className="text-lg font-semibold text-text-secondary">
              No workflows yet
            </h2>
            <p className="text-sm mb-4">
              Create your first workflow to get started.
            </p>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md text-sm font-medium shadow-sm transition-all duration-120 hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(255,109,90,0.25)]"
              onClick={handleCreate}
            >
              <Plus size={16} />
              <span>Create Workflow</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {filtered.map((wf) => (
              <div
                key={wf.id}
                className="bg-bg-surface border border-border-default rounded-lg p-4 cursor-pointer flex flex-col gap-3 transition-all duration-120 hover:border-border-hover hover:shadow-md hover:-translate-y-[2px]"
                onClick={() => navigate(`/editor/${wf.id}`)}
                id={`wf-card-${wf.id}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-2 h-2 rounded-full ${wf.active ? "bg-success shadow-[0_0_6px_rgba(52,211,153,0.4)]" : "bg-text-tertiary"}`}
                  />
                  <div className="relative">
                    <button
                      className="flex items-center justify-center w-7 h-7 rounded-sm text-text-tertiary transition-colors duration-120 hover:bg-bg-hover hover:text-text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === wf.id ? null : wf.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === wf.id && (
                      <div
                        className="absolute right-0 top-8 bg-bg-elevated border border-border-default rounded-md shadow-lg min-w-[140px] z-[100] overflow-hidden animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary transition-colors duration-120 hover:bg-bg-hover hover:text-text-primary"
                          onClick={() => navigate(`/editor/${wf.id}`)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary transition-colors duration-120 hover:bg-bg-hover hover:text-text-primary"
                          onClick={() => handleDuplicate(wf.id)}
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors duration-120 !text-error hover:!bg-error/10"
                          onClick={() => handleDelete(wf.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-text-primary mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {wf.name}
                  </h3>
                  {wf.description && (
                    <p className="text-sm text-text-tertiary whitespace-nowrap overflow-hidden text-ellipsis">
                      {wf.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-text-tertiary">
                  <span>Updated {formatDate(wf.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
