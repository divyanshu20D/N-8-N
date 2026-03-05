import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowUpDown,
  X,
} from "lucide-react";
import { api } from "../../utils/api";
import { listWorkflows } from "../../utils/workflowService";

interface ExecutionItem {
  id: string;
  workflowId: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  startedAt: number;
  durationMs?: number;
  triggerType: "manual" | "webhook" | "schedule";
}

interface ExecutionListResponse {
  items: ExecutionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ExecutionNodeLog {
  nodeId: string;
  nodeType: string;
  status: "success" | "failed";
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  output?: unknown;
  error?: string;
}

interface ExecutionDetail extends ExecutionItem {
  finishedAt?: number;
  errorSummary?: string;
  finalOutput?: Record<string, unknown>;
  nodeLogs: ExecutionNodeLog[];
}

export default function Executions() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [workflowNames, setWorkflowNames] = useState<Record<string, string>>({});
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<ExecutionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const workflows = await listWorkflows();
        const map: Record<string, string> = {};
        workflows.forEach((w) => {
          map[w.id] = w.name;
        });
        setWorkflowNames(map);
      } catch {
        // Non-fatal for executions page table
      }
    };

    void loadWorkflows();
  }, []);

  useEffect(() => {
    const loadExecutions = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ExecutionListResponse>("/executions", {
          params: { page, limit: 20 },
        });
        setExecutions(data.items);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load executions");
      } finally {
        setLoading(false);
      }
    };

    void loadExecutions();
  }, [page]);

  const filteredExecutions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return executions;

    return executions.filter((ex) => {
      const workflowName = (workflowNames[ex.workflowId] ?? "Untitled Workflow").toLowerCase();
      return ex.id.toLowerCase().includes(q) || workflowName.includes(q);
    });
  }, [executions, search, workflowNames]);

  useEffect(() => {
    if (!selectedExecutionId) return;

    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const { data } = await api.get<ExecutionDetail>(
          `/executions/${selectedExecutionId}`,
        );
        setSelectedExecution(data);
      } catch (err: any) {
        setDetailError(
          err?.response?.data?.message ?? "Failed to load execution detail",
        );
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedExecutionId]);

  const getStatusIcon = (status: ExecutionItem["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="text-emerald-400" size={16} />;
      case "failed":
        return <XCircle className="text-red-400" size={16} />;
      case "running":
        return <Clock className="text-amber-400 animate-pulse" size={16} />;
      case "queued":
        return <Clock className="text-text-tertiary" size={16} />;
      case "cancelled":
        return <XCircle className="text-text-tertiary" size={16} />;
    }
  };

  const formatDuration = (durationMs?: number) => {
    if (durationMs === undefined || durationMs === null) return "-";
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-bg-base text-text-primary">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executions</h1>
            <p className="text-sm text-text-tertiary mt-1">
              Monitor your workflow performance and history.
            </p>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={16}
            />
            <input
              className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg focus:border-primary transition-colors outline-none text-sm"
              placeholder="Search by workflow name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-bg-surface border border-border-default rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-text-tertiary uppercase font-semibold">
              Success Rate
            </span>
            <span className="text-emerald-400 font-bold">
              {executions.length > 0
                ? `${Math.round(
                    (executions.filter((e) => e.status === "success").length /
                      executions.length) *
                      100,
                  )}%`
                : "0%"}
            </span>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-text-tertiary uppercase font-semibold">
              Total Runs
            </span>
            <span className="text-text-primary font-bold">{total}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-bottom border-border-default bg-bg-elevated/50 text-text-secondary">
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  <div className="flex items-center gap-2">
                    Status <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  Workflow
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  Execution ID
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  Start Time
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  Duration
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-[10px]">
                  Trigger
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-sm text-text-tertiary text-center"
                  >
                    Loading executions...
                  </td>
                </tr>
              ) : filteredExecutions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-sm text-text-tertiary text-center"
                  >
                    No executions found.
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((ex) => (
                <tr
                  key={ex.id}
                  className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedExecutionId(ex.id);
                    setSelectedExecution(null);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ex.status)}
                      <span className="capitalize text-xs font-semibold">
                        {ex.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary group-hover:text-primary transition-colors">
                    {workflowNames[ex.workflowId] ?? "Untitled Workflow"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-text-tertiary">
                    {ex.id}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(ex.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {formatDuration(ex.durationMs)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-bg-elevated border border-border-default rounded text-[10px] font-medium text-text-secondary">
                      {ex.triggerType}
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-border-default flex items-center justify-between text-xs text-text-tertiary font-medium">
            <span>
              Showing page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-border-default rounded bg-bg-elevated/50 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-border-default rounded bg-bg-elevated hover:bg-bg-overlay disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {selectedExecutionId && (
          <div className="fixed inset-0 z-[700] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-border-default bg-bg-surface shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Execution Detail
                  </h2>
                  <p className="text-xs text-text-tertiary font-mono">
                    {selectedExecutionId}
                  </p>
                </div>
                <button
                  className="p-2 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-hover"
                  onClick={() => {
                    setSelectedExecutionId(null);
                    setSelectedExecution(null);
                    setDetailError(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-72px)] space-y-4">
                {detailLoading && (
                  <div className="rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-sm text-text-tertiary">
                    Loading execution detail...
                  </div>
                )}

                {detailError && (
                  <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                    {detailError}
                  </div>
                )}

                {selectedExecution && !detailLoading && !detailError && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">Status</p>
                        <p className="text-sm font-semibold capitalize">{selectedExecution.status}</p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">Trigger</p>
                        <p className="text-sm font-semibold capitalize">{selectedExecution.triggerType}</p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">Started</p>
                        <p className="text-sm font-semibold">{new Date(selectedExecution.startedAt).toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">Duration</p>
                        <p className="text-sm font-semibold">{formatDuration(selectedExecution.durationMs)}</p>
                      </div>
                    </div>

                    {selectedExecution.errorSummary && (
                      <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                        {selectedExecution.errorSummary}
                      </div>
                    )}

                    <div className="rounded-lg border border-border-default bg-bg-elevated overflow-hidden">
                      <div className="px-4 py-2 border-b border-border-default text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                        Node Logs
                      </div>
                      <div className="divide-y divide-border-default">
                        {selectedExecution.nodeLogs.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-text-tertiary">
                            No node logs available.
                          </div>
                        ) : (
                          selectedExecution.nodeLogs.map((log, idx) => (
                            <div key={`${log.nodeId}-${idx}`} className="px-4 py-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-text-primary">
                                  {log.nodeType} ({log.nodeId})
                                </p>
                                <span
                                  className={`text-xs font-semibold capitalize ${
                                    log.status === "success"
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </div>
                              <p className="text-xs text-text-tertiary">
                                Duration: {formatDuration(log.durationMs)}
                              </p>
                              {log.error && (
                                <p className="text-xs text-red-400">{log.error}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
