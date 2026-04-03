import { useState } from "react";
import {
  X,
  ShieldCheck,
  Database,
  Globe,
  MessageSquare,
  Lock,
  FileText,
  ChevronRight,
  Info,
} from "lucide-react";
import { useCredentialStore } from "../../stores/credentialStore";

interface CreateCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREDENTIAL_PROVIDERS = [
  {
    id: "discord",
    name: "Discord",
    provider: "discord",
    icon: MessageSquare,
    color: "#818cf8",
    fields: [{ label: "Webhook URL", key: "webhookUrl", secret: false }],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    provider: "postgres",
    icon: Database,
    color: "#60a5fa",
    fields: [
      { label: "Host", key: "host", secret: false },
      { label: "Port", key: "port", secret: false },
      { label: "User", key: "user", secret: false },
      { label: "Password", key: "password", secret: true },
      { label: "Database", key: "database", secret: false },
    ],
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    provider: "telegram",
    icon: Globe,
    color: "#38bdf8",
    fields: [
      { label: "Bot Token", key: "botToken", secret: true },
      { label: "Chat ID", key: "chatId", secret: false },
    ],
  },
  {
    id: "weather",
    name: "OpenWeatherMap",
    provider: "weather",
    icon: Lock,
    color: "#2dd4bf",
    fields: [{ label: "API Key", key: "apiKey", secret: true }],
  },
  {
    id: "notion",
    name: "Notion",
    provider: "notion",
    icon: FileText,
    color: "#111827",
    fields: [
      { label: "API Token", key: "apiKey", secret: true },
      { label: "Parent Page ID", key: "parentPageId", secret: false },
      { label: "Notion Version", key: "notionVersion", secret: false },
    ],
  },
];

export default function CreateCredentialModal({
  isOpen,
  onClose,
}: CreateCredentialModalProps) {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof CREDENTIAL_PROVIDERS)[0] | null
  >(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCredential = useCredentialStore((s) => s.addCredential);

  if (!isOpen) return null;

  const handleSelect = (providerDef: (typeof CREDENTIAL_PROVIDERS)[0]) => {
    setSelectedProvider(providerDef);
    setName(`${providerDef.name} - ${new Date().toLocaleDateString()}`);
    setStep("configure");
  };

  const handleSave = async () => {
    if (!selectedProvider || !name) return;

    setError(null);
    setIsSaving(true);
    try {
      await addCredential({
        name,
        provider: selectedProvider.provider,
        data: formData,
      });

      // Reset and close
      setStep("select");
      setSelectedProvider(null);
      setFormData({});
      setName("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save credential");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setSelectedProvider(null);
    setFormData({});
    setName("");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="bg-bg-surface border border-border-default w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-bg-elevated/30">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              {step === "select" ? (
                <>
                  <ShieldCheck className="text-primary" /> Create New Credential
                </>
              ) : (
                <button
                  onClick={() => setStep("select")}
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <X className="rotate-45" size={18} /> {selectedProvider?.name}
                </button>
              )}
            </h2>
            <p className="text-xs text-text-tertiary mt-1">
              {step === "select"
                ? "Choose the service provider you want to connect."
                : "Enter the connection details for your credential."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-bg-overlay rounded-xl text-text-tertiary hover:text-text-primary transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[60vh] custom-scrollbar">
          {step === "select" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CREDENTIAL_PROVIDERS.map((providerDef) => (
                <button
                  key={providerDef.id}
                  onClick={() => handleSelect(providerDef)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-bg-elevated/50 border border-white/5 hover:border-primary/50 hover:bg-bg-overlay group transition-all text-left"
                >
                  <div
                    className="p-2.5 rounded-xl bg-bg-surface text-text-secondary group-hover:text-primary transition-colors shadow-inner"
                    style={{ color: providerDef.color }}
                  >
                    <providerDef.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {providerDef.name}
                    </p>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      {providerDef.provider}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-text-tertiary group-hover:translate-x-1 transition-transform"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Credential Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Production Bot"
                />
              </div>

              {/* Provider Badge */}
              <div className="flex items-center gap-3 px-4 py-3 bg-bg-elevated/50 border border-white/5 rounded-xl">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Provider
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                  {selectedProvider?.provider}
                </span>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-primary">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">
                  Credentials are encrypted and stored securely. They are only
                  sent to nodes when a workflow is executed.
                </p>
              </div>
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
                  {error}
                </div>
              )}

              {/* Dynamic Fields */}
              {selectedProvider?.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                    {field.label}
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium"
                    type={field.secret ? "password" : "text"}
                    value={formData[field.key] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.key]: e.target.value })
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-bg-elevated/30 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-text-tertiary hover:text-text-primary hover:bg-bg-overlay transition-all"
          >
            Cancel
          </button>
          {step === "configure" && (
            <button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="px-8 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {isSaving ? "Saving..." : "Save Credential"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
