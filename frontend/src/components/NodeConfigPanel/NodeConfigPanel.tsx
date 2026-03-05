import { useEffect, useState } from "react";
import {
  X,
  Trash2,
  Settings2,
  ScrollText,
  Copy,
  Check,
  Info,
  ShieldCheck,
  PlusCircle,
  CopyCheck,
  AlertTriangle,
  Link2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Link } from "react-router-dom";
import { useWorkflowStore } from "../../stores/workflowStore";
import { useCredentialStore } from "../../stores/credentialStore";
import { useNodeCatalogStore } from "../../stores/nodeCatalogStore";
import { getNodeType } from "../../utils/nodeRegistry";
import {
  NODE_CONFIG_SCHEMAS,
  type ConfigField,
} from "../../utils/nodeConfigSchemas";

interface NodeConfigPanelProps {
  onPersist?: () => void | Promise<void>;
}

export default function NodeConfigPanel({ onPersist }: NodeConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<"parameters" | "output">(
    "parameters",
  );
  const [copied, setCopied] = useState(false);
  const [nodeLabel, setNodeLabel] = useState("");

  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const workflowId = useWorkflowStore((s) => s.workflowId);
  const updateNodeLabel = useWorkflowStore((s) => s.updateNodeLabel);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const nodeConfigSchemas = useNodeCatalogStore((s) => s.nodeConfigSchemas);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) return null;

  const nodeData = selectedNode.data as {
    nodeType: string;
    label: string;
    config: Record<string, unknown>;
    executionData?: any;
    status?: string;
  };
  const typeDef = getNodeType(nodeData.nodeType);
  const fields =
    nodeConfigSchemas[nodeData.nodeType] ??
    NODE_CONFIG_SCHEMAS[nodeData.nodeType] ??
    [];
  const config = nodeData.config ?? {};
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<{ size?: number }>
  >;
  const Icon = icons[typeDef?.icon ?? "CircleDot"] ?? LucideIcons.CircleDot;

  useEffect(() => {
    setNodeLabel(nodeData.label ?? "");
  }, [selectedNode.id, nodeData.label]);

  const handleCopy = () => {
    if (!nodeData.executionData) return;
    navigator.clipboard.writeText(
      JSON.stringify(nodeData.executionData, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");
  const webhookUrl =
    workflowId && selectedNode.id
      ? `${apiBaseUrl}/triggers/webhook/${workflowId}/${selectedNode.id}`
      : "";

  const isLikelyValidCron = (value: string) => {
    const expression = value.trim();
    if (!expression) return false;
    const parts = expression.split(/\s+/);
    return parts.length >= 5 && parts.length <= 6;
  };

  const cronExpression =
    nodeData.nodeType === "schedule-trigger"
      ? String(config.cronExpression ?? "")
      : "";

  return (
    <aside className="w-[380px] h-full flex flex-col bg-bg-surface border-l border-border-default z-10 animate-in slide-in-from-right duration-300 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default bg-bg-elevated/30">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shadow-lg shadow-black/20 text-white"
            style={{ background: typeDef?.color }}
          >
            <Icon size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis leading-none mb-1">
              {nodeData.label}
            </span>
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest leading-none">
              {typeDef?.name}
            </span>
          </div>
        </div>
        <button
          className="p-2 hover:bg-bg-overlay rounded-lg text-text-tertiary hover:text-text-primary transition-all duration-200"
          onClick={() => selectNode(null)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex px-4 pt-4 bg-bg-surface">
        <div className="flex w-full bg-bg-elevated/50 p-1 rounded-xl border border-border-default/50">
          <button
            onClick={() => setActiveTab("parameters")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all transform active:scale-95 ${
              activeTab === "parameters"
                ? "bg-bg-overlay text-primary shadow-lg ring-1 ring-white/5"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <Settings2 size={14} />
            Parameters
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all transform active:scale-95 ${
              activeTab === "output"
                ? "bg-bg-overlay text-primary shadow-lg ring-1 ring-white/5"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <ScrollText size={14} />
            Output
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {activeTab === "parameters" ? (
          <div className="space-y-6 flex flex-col">
            {nodeData.nodeType === "webhook-trigger" && webhookUrl && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <Link2 size={14} /> Webhook Endpoint
                </div>
                <div className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-xs text-text-secondary break-all">
                  {webhookUrl}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-text-tertiary">
                    Send requests here. Optional auth token supported via header/query.
                  </p>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopiedWebhookUrl(true);
                      setTimeout(() => setCopiedWebhookUrl(false), 1500);
                    }}
                  >
                    {copiedWebhookUrl ? <CopyCheck size={12} /> : <Copy size={12} />}
                    {copiedWebhookUrl ? "Copied" : "Copy URL"}
                  </button>
                </div>
              </div>
            )}

            {nodeData.nodeType === "schedule-trigger" && cronExpression && (
              <div
                className={`rounded-xl border p-3 text-xs ${
                  isLikelyValidCron(cronExpression)
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-warning/30 bg-warning/10 text-warning"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {isLikelyValidCron(cronExpression) ? (
                    <Check size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )}
                  {isLikelyValidCron(cronExpression)
                    ? "Cron format looks valid"
                    : "Cron format may be invalid"}
                </div>
                {!isLikelyValidCron(cronExpression) && (
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Use 5-part cron like <code>*/5 * * * *</code>
                  </p>
                )}
              </div>
            )}

            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Info size={40} className="mb-4 stroke-1" />
                <p className="text-sm">No settings available for this node.</p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.key} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within:text-primary transition-colors">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-error text-xs">*</span>
                      )}
                    </label>
                  </div>
                  <ConfigFieldInput
                    field={field}
                    nodeType={nodeData.nodeType}
                    value={config[field.key] ?? field.defaultValue ?? ""}
                    onChange={(val) =>
                      updateNodeConfig(selectedNode.id, { [field.key]: val })
                    }
                  />
                </div>
              ))
            )}
            <div className="space-y-2 group">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary group-focus-within:text-primary transition-colors">
                Node Name
              </label>
              <input
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-sm transition-all duration-200 outline-none hover:border-border-hover focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary placeholder:text-text-tertiary"
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                onBlur={() => {
                  const normalized = nodeLabel.trim() || typeDef?.name || "Node";
                  if (normalized !== nodeData.label) {
                    updateNodeLabel(selectedNode.id, normalized);
                    void onPersist?.();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const normalized =
                      nodeLabel.trim() || typeDef?.name || "Node";
                    if (normalized !== nodeData.label) {
                      updateNodeLabel(selectedNode.id, normalized);
                      void onPersist?.();
                    }
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Enter node name"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-top-2 duration-400">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                Latest Response Data
              </span>
              {nodeData.executionData && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md bg-bg-elevated text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-all active:scale-90"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-400" /> COPIED
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> COPY JSON
                    </>
                  )}
                </button>
              )}
            </div>

            {!nodeData.executionData ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center opacity-50 grayscale">
                <div className="w-16 h-16 rounded-3xl bg-bg-elevated/50 flex items-center justify-center mb-5 rotate-12">
                  <ScrollText size={28} className="-rotate-12" />
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">
                  Silence is Golden
                </h3>
                <p className="text-[11px] text-text-tertiary max-w-[200px] leading-relaxed">
                  Fire this workflow up to see data flowing through your system.
                </p>
              </div>
            ) : (
              <div className="flex-1 rounded-xl border border-border-default overflow-hidden flex flex-col shadow-inner bg-[#1e1e1e]">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-white/[0.03]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                  <span className="text-[10px] font-mono text-text-tertiary ml-2 uppercase">
                    JSON
                  </span>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: "1.25rem",
                      background: "transparent",
                      fontSize: "12px",
                      lineHeight: "1.6",
                    }}
                  >
                    {JSON.stringify(nodeData.executionData, null, 2)}
                  </SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-default bg-bg-surface">
        <button
          className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-error/80 hover:text-error hover:bg-error/10 transition-all active:scale-[0.98]"
          onClick={() => {
            deleteNode(selectedNode.id);
            void onPersist?.();
          }}
        >
          <Trash2
            size={14}
            className="group-hover:rotate-12 transition-transform"
          />
          <span>Permanently Delete Node</span>
        </button>
      </div>
    </aside>
  );
}

function ConfigFieldInput({
  field,
  nodeType,
  value,
  onChange,
}: {
  field: ConfigField;
  nodeType: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const stringVal = String(value ?? "");
  const credentials = useCredentialStore((s) => s.credentials);

  const baseInputStyles =
    "w-full px-4 py-2.5 bg-bg-elevated border border-border-default rounded-xl text-sm transition-all duration-200 outline-none hover:border-border-hover focus:border-primary focus:ring-4 focus:ring-primary/10 text-text-primary placeholder:text-text-tertiary";

  if (field.type === "text" || field.type === "number") {
    return (
      <input
        className={baseInputStyles}
        type={field.type}
        value={stringVal}
        onChange={(e) =>
          onChange(
            field.type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${baseInputStyles} min-height-[100px] resize-none leading-relaxed`}
        value={stringVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={4}
      />
    );
  }

  if (field.type === "select") {
    return (
      <div className="relative">
        <select
          className={`${baseInputStyles} appearance-none cursor-pointer pr-10`}
          value={stringVal}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-bg-elevated"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
          <LucideIcons.ChevronDown size={16} />
        </div>
      </div>
    );
  }

  if (field.type === "credential") {
    // Filter credentials based on node type keywords for a better match
    const relevantCredentials = credentials.filter((c) => {
      const provider = c.provider.toLowerCase();
      const node = nodeType.toLowerCase();
      if (node === "discord") return provider.includes("discord");
      if (node === "telegram") return provider.includes("telegram");
      if (node === "weather") return provider.includes("weather");
      if (node === "postgres") return provider.includes("postgres");
      return true;
    });

    return (
      <div className="space-y-3">
        <div className="relative">
          <select
            className={`${baseInputStyles} appearance-none cursor-pointer pr-10 border-primary/20 bg-primary/5`}
            value={stringVal}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select a credential...</option>
            {relevantCredentials.map((cred) => (
              <option key={cred.id} value={cred.id} className="bg-bg-elevated">
                {cred.name} ({cred.provider})
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] text-text-tertiary flex items-center gap-1">
            <Info size={10} /> Secrets are encrypted
          </p>
          <Link
            to="/credentials"
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 active:scale-95 transition-transform"
          >
            <PlusCircle size={10} /> Create New
          </Link>
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-3 cursor-pointer select-none group/check">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-border-default bg-bg-elevated transition-all checked:bg-primary checked:border-primary"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <Check
            size={14}
            className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            strokeWidth={4}
          />
        </div>
        <span className="text-sm text-text-secondary group-hover/check:text-text-primary transition-colors">
          {field.placeholder}
        </span>
      </label>
    );
  }

  return null;
}
