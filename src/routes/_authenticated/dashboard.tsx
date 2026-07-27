import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  FileText,
  Users,
  MessageCircleHeart,
  MapPin,
  Building2,
  Lightbulb,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { listIncidents, incidentTypeLabel } from "@/services/incidents";
import { listContacts } from "@/services/contacts";
import { listSafetyTips } from "@/services/reference";
import { listNotifications } from "@/services/notifications";
import { SkeletonList, EmptyState } from "@/components/common/States";
import { greetingForNow, relativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your SafeHer dashboard" },
      { name: "description", content: "Your safety hub: SOS, recent reports, trusted contacts and daily safety tips." },
      { property: "og:title", content: "Your SafeHer dashboard" },
      { property: "og:description", content: "Your safety hub in one screen." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { to: "/reports/new", label: "New report", hint: "Voice or text", icon: FileText },
  { to: "/assistant", label: "Ask SafeHer", hint: "AI guidance", icon: MessageCircleHeart, accent: true },
  { to: "/contacts", label: "Trusted circle", hint: "Manage contacts", icon: Users },
  { to: "/safe-routes", label: "Safe routes", hint: "Plan a journey", icon: MapPin },
  { to: "/services", label: "Help nearby", hint: "Police & shelters", icon: Building2 },
] as const;

function Dashboard() {
  const { user, profile } = useAuth();
  const userId = user?.id;

  const incidents = useQuery({
    queryKey: ["incidents", userId],
    queryFn: () => listIncidents(userId!),
    enabled: !!userId,
  });
  const contacts = useQuery({
    queryKey: ["contacts", userId],
    queryFn: () => listContacts(userId!),
    enabled: !!userId,
  });
  const tips = useQuery({ queryKey: ["safety-tips"], queryFn: listSafetyTips });
  const notifications = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => listNotifications(userId!),
    enabled: !!userId,
  });

  const unread = notifications.data?.filter((item) => !item.read).length ?? 0;
  const firstName = (profile?.full_name || "there").split(" ")[0];
  const tip = tips.data?.[new Date().getDate() % Math.max(tips.data.length, 1)];

  return (
    <AppShell unread={unread}>
      <div className="container page">
        <section className="greeting-card animate-in">
          <p>{greetingForNow()},</p>
          <h2>{firstName}</h2>
          <p>You're protected. Everything you need is one tap away.</p>
        </section>

        <div className="stat-grid mt-md">
          <div className="stat">
            <strong>{incidents.data?.length ?? 0}</strong>
            <span>Reports</span>
          </div>
          <div className="stat">
            <strong>{contacts.data?.length ?? 0}</strong>
            <span>Trusted contacts</span>
          </div>
          <div className="stat">
            <strong>{unread}</strong>
            <span>New alerts</span>
          </div>
        </div>

        <Link to="/sos" className="card card-hover mt-md row" style={{ borderColor: "var(--danger)" }}>
          <span className="list-icon list-icon-danger">
            <ShieldAlert size={22} aria-hidden="true" />
          </span>
          <span className="grow">
            <span className="list-title">Emergency SOS</span>
            <span className="list-sub">Alert your contacts with your live location</span>
          </span>
        </Link>

        <div className="section-head mt-lg">
          <h2>Quick actions</h2>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to} className="quick-card">
                <span className={`list-icon${"accent" in action && action.accent ? " list-icon-accent" : ""}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <strong>{action.label}</strong>
                <span>{action.hint}</span>
              </Link>
            );
          })}
        </div>

        <div className="section-head mt-lg">
          <h2>Recent reports</h2>
          <Link to="/reports">View all</Link>
        </div>
        {incidents.isLoading ? (
          <SkeletonList count={2} />
        ) : incidents.data?.length ? (
          <div className="stack gap-sm">
            {incidents.data.slice(0, 3).map((incident) => (
              <Link key={incident.id} to="/reports/$id" params={{ id: incident.id }} className="list-card">
                <span className="list-icon">
                  <FileText size={20} aria-hidden="true" />
                </span>
                <span className="grow">
                  <span className="list-title">{incident.title}</span>
                  <span className="list-sub">
                    {incidentTypeLabel(incident.incident_type)} · {relativeTime(incident.created_at)}
                  </span>
                </span>
                <span className={`badge badge-${incident.status === "submitted" ? "success" : "primary"}`}>
                  {incident.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={24} aria-hidden="true" />}
            title="No reports yet"
            description="When something happens, SafeHer helps you record it clearly and privately."
            action={
              <Link to="/reports/new" className="btn btn-sm">
                Create your first report
              </Link>
            }
          />
        )}

        {tip ? (
          <div className="card card-soft mt-lg">
            <div className="row">
              <span className="list-icon list-icon-accent">
                <Lightbulb size={20} aria-hidden="true" />
              </span>
              <strong>Safety tip of the day</strong>
            </div>
            <h3 className="mt-sm">{tip.title}</h3>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              {tip.body}
            </p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
