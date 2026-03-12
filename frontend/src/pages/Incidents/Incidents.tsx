import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Bot,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import type {
  IncidentItem,
  IncidentRemediationAttempt,
  IncidentTimelineEvent,
} from "../../types/workflow";
import { getIncident, listIncidents } from "../../utils/incidentService";

const severityTone: Record<
  IncidentItem["severity"],
  { badge: string; dot: string }
> = {
  warning: {
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  high: {
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    dot: "bg-orange-400",
  },
  critical: {
    badge: "border-red-500/20 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
  },
};

const statusTone: Record<IncidentItem["status"], string> = {
  open: "text-red-300",
  investigating: "text-orange-300",
  monitoring: "text-amber-300",
  resolved: "text-emerald-300",
};

function formatDateTime(value: number) {
  return new Date(value).toLocaleString();
}

function formatRelative(value: number) {
  const diffMs = Date.now() - value;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function TimelineItem({
  item,
}: {
  item: IncidentTimelineEvent;
}) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,109,90,0.45)]" />
      <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">{item.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-text-tertiary">
              {item.type}
            </p>
          </div>
          <p className="shrink-0 text-xs text-text-tertiary">
            {formatDateTime(item.createdAt)}
          </p>
        </div>
        {item.detail && (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
}

function RemediationCard({
  item,
}: {
  item: IncidentRemediationAttempt;
}) {
  const tone =
    item.status === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : item.status === "failed"
        ? "border-red-500/20 bg-red-500/10 text-red-300"
        : "border-amber-500/20 bg-amber-500/10 text-amber-300";

  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wrench size={14} />
          <p className="text-sm font-semibold">{item.action}</p>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {item.status}
        </span>
      </div>
      {item.detail && <p className="mt-2 text-sm">{item.detail}</p>}
      <p className="mt-2 text-xs opacity-80">
        Recorded {formatDateTime(item.createdAt)}
      </p>
    </div>
  );
}

export default function Incidents() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await listIncidents({ page, limit: 20 });
        setIncidents(response.items);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page]);

  useEffect(() => {
    if (!selectedIncidentId) return;

    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const incident = await getIncident(selectedIncidentId);
        setSelectedIncident(incident);
      } catch (err: any) {
        setDetailError(err?.response?.data?.message ?? "Failed to load incident");
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [selectedIncidentId]);

  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return incidents;

    return incidents.filter((incident) => {
      const haystacks = [
        incident.title,
        incident.source,
        incident.service ?? "",
        incident.environment ?? "",
        incident.dedupeKey,
        incident.status,
        incident.severity,
      ];

      return haystacks.some((value) => value.toLowerCase().includes(q));
    });
  }, [incidents, search]);

  const openCount = incidents.filter((item) => item.status !== "resolved").length;
  const criticalCount = incidents.filter(
    (item) => item.severity === "critical" && item.status !== "resolved",
  ).length;

  return (
    <div className="h-full overflow-y-auto bg-bg-base p-8 text-text-primary">
      <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
            <p className="mt-1 text-sm text-text-tertiary">
              Track correlated operational issues, remediation attempts, and timeline events.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={16}
            />
            <input
              className="w-full rounded-lg border border-border-default bg-bg-surface py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
              placeholder="Search by title, source, environment, severity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-default bg-bg-surface px-4 py-2">
            <span className="text-xs font-semibold uppercase text-text-tertiary">
              Open Incidents
            </span>
            <span className="font-bold text-text-primary">{openCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border-default bg-bg-surface px-4 py-2">
            <span className="text-xs font-semibold uppercase text-text-tertiary">
              Critical Open
            </span>
            <span className="font-bold text-red-300">{criticalCount}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border-default bg-bg-surface">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-bg-elevated/50 text-text-secondary">
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Severity <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  Signals
                </th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-4 text-[10px] font-medium uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-text-tertiary">
                    Loading incidents...
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-text-tertiary">
                    No incidents found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="group cursor-pointer transition-colors hover:bg-white/[0.02]"
                    onClick={() => {
                      setSelectedIncidentId(incident.id);
                      setSelectedIncident(null);
                    }}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          severityTone[incident.severity].badge
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${severityTone[incident.severity].dot}`}
                        />
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-primary group-hover:text-primary">
                        {incident.title}
                      </p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {incident.service ?? "unknown-service"}
                        {incident.environment ? ` • ${incident.environment}` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          statusTone[incident.status]
                        }`}
                      >
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {incident.signalCount}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {formatRelative(incident.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {incident.source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-border-default px-6 py-4 text-xs font-medium text-text-tertiary">
            <span>
              Showing page {page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded border border-border-default bg-bg-elevated/50 px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded border border-border-default bg-bg-elevated px-3 py-1 hover:bg-bg-overlay disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {selectedIncidentId && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border-default bg-bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Incident Detail
                  </h2>
                  <p className="text-xs font-mono text-text-tertiary">
                    {selectedIncidentId}
                  </p>
                </div>
                <button
                  className="rounded-md p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
                  onClick={() => {
                    setSelectedIncidentId(null);
                    setSelectedIncident(null);
                    setDetailError(null);
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto p-5">
                {detailLoading && (
                  <div className="rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-sm text-text-tertiary">
                    Loading incident detail...
                  </div>
                )}

                {detailError && (
                  <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                    {detailError}
                  </div>
                )}

                {selectedIncident && !detailLoading && !detailError && (
                  <>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">
                          Severity
                        </p>
                        <p className="text-sm font-semibold capitalize">
                          {selectedIncident.severity}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">
                          Status
                        </p>
                        <p className="text-sm font-semibold capitalize">
                          {selectedIncident.status}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">
                          Signals Seen
                        </p>
                        <p className="text-sm font-semibold">
                          {selectedIncident.signalCount}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2">
                        <p className="text-[10px] uppercase text-text-tertiary">
                          Last Updated
                        </p>
                        <p className="text-sm font-semibold">
                          {formatDateTime(selectedIncident.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 text-primary" size={18} />
                            <div>
                              <h3 className="text-base font-semibold text-text-primary">
                                {selectedIncident.title}
                              </h3>
                              <p className="mt-1 text-sm text-text-secondary">
                                {selectedIncident.summary ?? "No summary has been recorded yet."}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
                              Source: {selectedIncident.source}
                            </span>
                            {selectedIncident.service && (
                              <span className="rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
                                Service: {selectedIncident.service}
                              </span>
                            )}
                            {selectedIncident.environment && (
                              <span className="rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
                                Env: {selectedIncident.environment}
                              </span>
                            )}
                            {selectedIncident.notionPageId && (
                              <span className="rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
                                Notion linked
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-300" />
                            <h3 className="text-sm font-semibold text-text-primary">
                              Current Symptoms
                            </h3>
                          </div>
                          {selectedIncident.currentSymptoms.length === 0 ? (
                            <p className="mt-3 text-sm text-text-tertiary">
                              No symptoms recorded yet.
                            </p>
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {selectedIncident.currentSymptoms.map((symptom) => (
                                <span
                                  key={symptom}
                                  className="rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs text-text-secondary"
                                >
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Clock3 size={16} className="text-primary" />
                            <h3 className="text-sm font-semibold text-text-primary">
                              Timeline
                            </h3>
                          </div>
                          <div className="mt-4 space-y-4 border-l border-border-default/70 pl-4">
                            {selectedIncident.timeline.length === 0 ? (
                              <p className="text-sm text-text-tertiary">
                                No timeline events yet.
                              </p>
                            ) : (
                              selectedIncident.timeline
                                .slice()
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .map((item, index) => (
                                  <TimelineItem
                                    key={`${item.type}-${item.createdAt}-${index}`}
                                    item={item}
                                  />
                                ))
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Wrench size={16} className="text-primary" />
                            <h3 className="text-sm font-semibold text-text-primary">
                              Remediation Attempts
                            </h3>
                          </div>
                          <div className="mt-4 space-y-3">
                            {selectedIncident.remediationAttempts.length === 0 ? (
                              <p className="text-sm text-text-tertiary">
                                No remediation attempts recorded yet.
                              </p>
                            ) : (
                              selectedIncident.remediationAttempts
                                .slice()
                                .sort((a, b) => b.createdAt - a.createdAt)
                                .map((item, index) => (
                                  <RemediationCard
                                    key={`${item.action}-${item.createdAt}-${index}`}
                                    item={item}
                                  />
                                ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-primary" />
                            <h3 className="text-sm font-semibold text-text-primary">
                              AI Summary
                            </h3>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                            {selectedIncident.aiSummary ??
                              "No AI summary has been generated yet for this incident."}
                          </p>
                        </div>

                        <div className="rounded-xl border border-border-default bg-bg-elevated px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Bot size={16} className="text-primary" />
                            <h3 className="text-sm font-semibold text-text-primary">
                              Resolution State
                            </h3>
                          </div>
                          <div className="mt-3 space-y-3 text-sm text-text-secondary">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-emerald-300" />
                              <span>Created {formatDateTime(selectedIncident.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 size={14} className="text-amber-300" />
                              <span>Last updated {formatDateTime(selectedIncident.updatedAt)}</span>
                            </div>
                            <p className="rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-xs font-mono text-text-tertiary">
                              dedupeKey: {selectedIncident.dedupeKey}
                            </p>
                          </div>
                        </div>
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
