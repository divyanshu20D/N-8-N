import { useState } from "react";
import {
  User,
  Lock,
  Variable,
  Bell,
  Moon,
  Sun,
  Check,
  Shield,
  Save,
  Settings as SettingsIcon,
  ChevronRight,
  Plus,
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "variables" | "security" | "notifications"
  >("profile");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "variables", label: "Global Variables", icon: Variable },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ] as const;

  return (
    <div className="p-8 h-full bg-bg-base text-text-primary overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <SettingsIcon size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Settings
              </h1>
              <p className="text-sm text-text-tertiary">
                Configure your workspace and preferences
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-md font-bold text-sm hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all transform active:scale-95"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "Changes Saved" : "Save Changes"}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between p-4 rounded-md transition-all group ${
                  activeTab === tab.id
                    ? "bg-bg-surface border border-border-default shadow-xl text-primary"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={18} />
                  <span className="text-sm font-bold tracking-tight">
                    {tab.label}
                  </span>
                </div>
                {activeTab === tab.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-bg-surface border border-border-default rounded-md p-8 min-h-[500px] shadow-2xl relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 group-hover:bg-primary/10 transition-all" />

            {activeTab === "profile" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-2xl ring-4 ring-white/5">
                    JS
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">
                      John Sterling
                    </h3>
                    <p className="text-sm text-text-tertiary">
                      Workspace Owner • Free Plan
                    </p>
                    <button className="text-xs font-bold text-primary hover:underline">
                      Change Avatar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">
                      Full Name
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-bg-elevated/50 border border-border-default rounded-md outline-none focus:border-primary transition-all text-sm font-medium"
                      defaultValue="John Sterling"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">
                      Email Address
                    </label>
                    <input
                      className="w-full px-4 py-3 bg-bg-elevated/50 border border-border-default rounded-md outline-none focus:border-primary transition-all text-sm font-medium"
                      defaultValue="john@flowforge.ai"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tighter">
                    Theme Preference
                  </h4>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-lg border transition-all ${theme === "dark" ? "bg-primary/5 border-primary shadow-xl ring-4 ring-primary/5" : "bg-bg-elevated/20 border-border-default hover:border-text-tertiary"}`}
                    >
                      <div className="w-12 h-12 rounded-md bg-bg-surface border border-white/5 flex items-center justify-center shadow-inner">
                        <Moon
                          size={24}
                          className={
                            theme === "dark"
                              ? "text-primary"
                              : "text-text-tertiary"
                          }
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-text-tertiary"}`}
                      >
                        Dark Mode
                      </span>
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex-1 flex flex-col items-center gap-4 p-6 rounded-lg border transition-all ${theme === "light" ? "bg-primary/5 border-primary shadow-xl ring-4 ring-primary/5" : "bg-bg-elevated/20 border-border-default hover:border-text-tertiary"}`}
                    >
                      <div className="w-12 h-12 rounded-md bg-bg-surface border border-white/5 flex items-center justify-center shadow-inner">
                        <Sun
                          size={24}
                          className={
                            theme === "light"
                              ? "text-primary"
                              : "text-text-tertiary"
                          }
                        />
                      </div>
                      <span
                        className={`text-xs font-bold ${theme === "light" ? "text-white" : "text-text-tertiary"}`}
                      >
                        Light Mode
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "variables" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Environment Variables
                    </h3>
                    <p className="text-xs text-text-tertiary mt-1">
                      Access these variables across all your workflows using{" "}
                      {"`{{env.VAR_NAME}}`"}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-md text-xs font-bold hover:bg-white/10 transition-all">
                    <Plus size={14} /> Add Variable
                  </button>
                </div>

                <div className="space-y-3 pt-4">
                  {[
                    { key: "BASE_URL", value: "https://api.flowforge.ai" },
                    { key: "RETRY_ATTEMPTS", value: "3" },
                    { key: "DEBUG_MODE", value: "false" },
                  ].map((v) => (
                    <div
                      key={v.key}
                      className="flex gap-4 items-center p-3 rounded-md bg-bg-base/50 border border-white/5"
                    >
                      <div className="flex-1 flex gap-2">
                        <input
                          className="w-1/3 px-3 py-2 bg-bg-surface border border-border-default rounded-lg outline-none text-[11px] font-mono text-primary font-bold uppercase"
                          defaultValue={v.key}
                        />
                        <input
                          className="flex-1 px-3 py-2 bg-bg-surface border border-border-default rounded-lg outline-none text-[11px] font-mono text-text-secondary"
                          defaultValue={v.value}
                        />
                      </div>
                      <button className="p-2 hover:bg-error/10 hover:text-error rounded-lg text-text-tertiary transition-colors">
                        <Bell size={14} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock size={20} className="text-primary" /> Password
                    Authentication
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">
                        Current Password
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-bg-elevated/50 border border-border-default rounded-md outline-none focus:border-primary transition-all text-sm font-medium"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">
                          New Password
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-bg-elevated/50 border border-border-default rounded-md outline-none focus:border-primary transition-all text-sm font-medium"
                          type="password"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">
                          Confirm New Password
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-bg-elevated/50 border border-border-default rounded-md outline-none focus:border-primary transition-all text-sm font-medium"
                          type="password"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-md bg-indigo-500/20 text-indigo-400">
                        <Shield size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-[10px] text-text-tertiary mt-0.5 tracking-tight font-medium">
                          Add an extra layer of security to your account.
                        </p>
                      </div>
                    </div>
                    <button className="px-5 py-2 bg-indigo-500 text-white rounded-md text-xs font-bold hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
