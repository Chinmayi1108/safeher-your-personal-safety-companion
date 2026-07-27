import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { SkeletonList, EmptyState } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";
import { listIncidents, incidentTypeLabel } from "@/services/incidents";
import { relativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({
    meta: [
      { title: "My incident reports — SafeHer" },
      { name: "description", content: "Every incident you have documented, with AI-written reports and evidence." },
      { property: "og:title", content: "My incident reports — SafeHer" },
      { property: "og:description", content: "Your private incident history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsList,
});

function ReportsList() {
  const { user } = useAuth();
  const incidents = useQuery({
    queryKey: ["incidents", user?.id],
    queryFn: () => listIncidents(user!.id),
    enabled: !!user?.id,
  });

  return (
    <AppShell>
      <div className="container page">
        <PageHead
          title="My reports"
          subtitle="Private records only you can see."
          action={
            <Link to="/reports/new" className="btn btn-sm">
              <Plus size={16} aria-hidden="true" /> New
            </Link>
          }
        />
        {incidents.isLoading ? (
          <SkeletonList />
        ) : incidents.data?.length ? (
          <div className="stack gap-sm">
            {incidents.data.map((incident) => (
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
            title="Nothing documented yet"
            description="Create a report to keep a clear, timestamped record of what happened."
            action={
              <Link to="/reports/new" className="btn btn-sm">
                Create a report
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
