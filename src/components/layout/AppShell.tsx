import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageCircleHeart, ShieldAlert, FileText, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/common/Logo";

interface AppShellProps {
  children: ReactNode;
  unread?: number;
}

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/sos", label: "SOS", icon: ShieldAlert, sos: true },
  { to: "/assistant", label: "Assist", icon: MessageCircleHeart },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell({ children, unread = 0 }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <header className="app-header">
        <div className="container row-between">
          <Logo to="/dashboard" />
          <nav className="desktop-nav" aria-label="Main">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/reports" className="nav-link">Reports</Link>
            <Link to="/contacts" className="nav-link">Contacts</Link>
            <Link to="/safe-routes" className="nav-link">Safe routes</Link>
            <Link to="/services" className="nav-link">Help nearby</Link>
          </nav>
          <Link to="/notifications" className="header-action" aria-label="Notifications">
            <Bell size={20} aria-hidden="true" />
            {unread > 0 ? <span className="notif-dot" /> : null}
          </Link>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="tabbar" aria-label="Quick navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`tab${"sos" in tab && tab.sos ? " tab-sos" : ""}`}
              data-status={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={"sos" in tab && tab.sos ? 24 : 20} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
