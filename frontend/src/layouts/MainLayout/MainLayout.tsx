import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Siren,
  History,
  Key,
  Settings,
  LayoutDashboard,
  Zap,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useNodeCatalogStore } from "../../stores/nodeCatalogStore";
import { useCredentialStore } from "../../stores/credentialStore";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const loadCatalog = useNodeCatalogStore((s) => s.loadCatalog);
  const loadCredentials = useCredentialStore((s) => s.loadCredentials);

  useEffect(() => {
    void loadCatalog();
    void loadCredentials();
  }, [loadCatalog, loadCredentials]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-col items-center justify-center gap-1.5 w-[48px] h-[48px] rounded-xl transition-all duration-100 ${
      isActive
        ? 'bg-bg-elevated text-primary shadow-[0_4px_12px_rgba(0,0,0,0.2)] before:content-[""] before:absolute before:-left-3 before:top-3 before:bottom-3 before:w-[3px] before:bg-primary before:rounded-r-md'
        : "text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
    }`;

  return (
    <div className="flex h-screen w-screen bg-bg-base overflow-hidden">
      <aside className="w-[64px] bg-bg-surface border-r border-border-default flex flex-col items-center py-4 shrink-0 z-[200]">
        <div className="flex items-center justify-center pb-8">
          <Zap size={24} className="text-primary" />
          <span className="hidden">FlowForge</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3">
          <NavLink to="/" title="Workflows" className={linkClass}>
            <LayoutDashboard size={20} />
            <span className="hidden">Workflows</span>
          </NavLink>
          <NavLink to="/incidents" title="Incidents" className={linkClass}>
            <Siren size={20} />
            <span className="hidden">Incidents</span>
          </NavLink>
          <NavLink to="/executions" title="Executions" className={linkClass}>
            <History size={20} />
            <span className="hidden">Executions</span>
          </NavLink>
          <NavLink to="/credentials" title="Credentials" className={linkClass}>
            <Key size={20} />
            <span className="hidden">Credentials</span>
          </NavLink>
          <NavLink to="/marketplace" title="Marketplace" className={linkClass}>
            <ShoppingBag size={20} />
            <span className="hidden">Marketplace</span>
          </NavLink>
        </nav>

        <div className="px-3">
          <NavLink to="/settings" title="Settings" className={linkClass}>
            <Settings size={20} />
            <span className="hidden">Settings</span>
          </NavLink>
          <button
            title="Logout"
            className="mt-2 relative flex flex-col items-center justify-center gap-1.5 w-[48px] h-[48px] rounded-xl transition-all duration-100 text-text-tertiary hover:bg-bg-hover hover:text-text-primary"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut size={20} />
            <span className="hidden">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
