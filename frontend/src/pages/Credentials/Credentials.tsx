import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Database,
  Globe,
  MessageSquare,
  Lock,
  FileText,
  Trash2,
  FlaskConical,
  Pencil,
  Clock,
  X,
} from "lucide-react";
import {
  useCredentialStore,
  type Credential,
  type CredentialStatus,
} from "../../stores/credentialStore";
import CreateCredentialModal from "../../components/CreateCredentialModal/CreateCredentialModal";

const PROVIDER_META: Record<
  string,
  { label: string; icon: typeof Lock; color: string }
> = {
  discord: { label: "Discord", icon: MessageSquare, color: "#818cf8" },
  postgres: { label: "PostgreSQL", icon: Database, color: "#60a5fa" },
  telegram: { label: "Telegram Bot", icon: Globe, color: "#38bdf8" },
  weather: { label: "OpenWeatherMap", icon: Lock, color: "#2dd4bf" },
  notion: { label: "Notion", icon: FileText, color: "#111827" },
};

const getProviderMeta = (provider: string) =>
  PROVIDER_META[provider] ?? {
    label: provider,
    icon: Lock,
    color: "#a78bfa",
  };

// ─── Helpers ─────────────────────────────────────────────────
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function Credentials() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const credentials = useCredentialStore((s) => s.credentials);
  const isLoading = useCredentialStore((s) => s.isLoading);
  const storeError = useCredentialStore((s) => s.error);
  const loadCredentials = useCredentialStore((s) => s.loadCredentials);
  const deleteCredential = useCredentialStore((s) => s.deleteCredential);
  const updateCredential = useCredentialStore((s) => s.updateCredential);
  const testCredential = useCredentialStore((s) => s.testCredential);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const filteredCredentials = credentials.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Status Badge ──────────────────────────────────────────
  const getStatusBadge = (status: CredentialStatus) => {
    switch (status) {
      case "passed":
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
            <ShieldCheck size={12} /> Passed
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
            <ShieldAlert size={12} /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-500/10 text-zinc-400 text-[10px] font-bold uppercase tracking-wider border border-zinc-500/20">
            <ShieldQuestion size={12} /> Untested
          </span>
        );
    }
  };

  // ─── Provider Icon ─────────────────────────────────────────
  const getIcon = (provider: string) => {
    const meta = getProviderMeta(provider);
    const IconComp = meta.icon;
    return <IconComp size={18} style={{ color: meta.color }} />;
  };

  // ─── Inline Rename ─────────────────────────────────────────
  const startEditing = (cred: Credential) => {
    setEditingId(cred.id);
    setEditName(cred.name);
  };

  const saveEdit = async () => {
    if (editingId && editName.trim()) {
      try {
        setActionError(null);
        await updateCredential(editingId, { name: editName.trim() });
      } catch (error: any) {
        setActionError(error?.response?.data?.message ?? "Failed to rename credential");
      }
    }
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-bg-base text-text-primary custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-visible">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-text-tertiary bg-clip-text text-transparent">
              Credentials
            </h1>
            <p className="text-sm text-text-tertiary mt-1 font-medium">
              Manage your API keys, auth tokens and database secrets securely.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-all transform active:scale-95 shadow-lg shadow-primary/20 hover:shadow-primary/40"
          >
            <Plus size={18} strokeWidth={3} />
            Create New Credential
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors"
              size={18}
            />
            <input
              className="w-full pl-12 pr-4 py-3 bg-bg-surface border border-border-default rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm placeholder:text-text-tertiary shadow-inner"
              placeholder="Search credentials by name or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {(actionError || storeError) && (
            <div className="col-span-full rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {actionError || storeError}
            </div>
          )}
          {isLoading && (
            <div className="col-span-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-text-tertiary">
              Loading credentials...
            </div>
          )}
          {filteredCredentials.map((cred) => {
            const providerMeta = getProviderMeta(cred.provider);

            return (
              <div
                key={cred.id}
                className="group relative flex flex-col p-5 bg-bg-surface border border-border-default rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-1 overflow-hidden"
              >
                {/* Card Glow Effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors" />

                {/* Top Row */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-bg-elevated/50 rounded-2xl border border-white/5 ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-300">
                    {getIcon(cred.provider)}
                  </div>
                  <div className="relative flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () => {
                        try {
                          setActionError(null);
                          await testCredential(cred.id);
                        } catch (error: any) {
                          setActionError(
                            error?.response?.data?.message ?? "Failed to test credential",
                          );
                        }
                      }}
                      className="p-1.5 hover:bg-primary/10 rounded-lg text-text-tertiary hover:text-primary transition-colors"
                      title="Test credential"
                    >
                      <FlaskConical size={16} />
                    </button>
                    <button
                      onClick={() => startEditing(cred)}
                      className="p-1.5 hover:bg-bg-elevated rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
                      title="Rename"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setActionError(null);
                          await deleteCredential(cred.id);
                        } catch (error: any) {
                          setActionError(
                            error?.response?.data?.message ?? "Failed to delete credential",
                          );
                        }
                      }}
                      className="p-1.5 hover:bg-error/10 rounded-lg text-text-tertiary hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Name & Provider */}
                <div className="flex flex-col gap-1.5 mb-6">
                  {editingId === cred.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 px-3 py-1.5 bg-bg-elevated border border-primary rounded-lg text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-primary/20"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditName("");
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditName("");
                        }}
                        className="p-1 text-text-tertiary hover:text-text-primary"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                      {cred.name}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-xs text-text-tertiary font-medium">
                    <span className="bg-bg-elevated px-2 py-0.5 rounded border border-white/5">
                      {providerMeta.label}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">
                      Status
                    </p>
                    {getStatusBadge(cred.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 text-right">
                      Last Tested
                    </p>
                    <p className="text-xs font-semibold text-text-secondary flex items-center gap-1 justify-end">
                      <Clock size={10} className="text-text-tertiary" />
                      {formatRelativeTime(cred.lastTestedAt)}
                    </p>
                  </div>
                </div>

                {/* Test Error Tooltip */}
                {cred.status === "failed" && cred.lastTestError && (
                  <div className="mt-3 px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                      Error
                    </p>
                    <p className="text-[11px] text-red-300/80 leading-relaxed truncate">
                      {cred.lastTestError}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Card Placeholder */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center p-8 bg-bg-base border-2 border-dashed border-border-default rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-default flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary group-hover:text-primary transition-all">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-bold text-text-tertiary group-hover:text-primary">
              Add New Credential
            </p>
          </button>
        </div>
      </div>

      <CreateCredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
