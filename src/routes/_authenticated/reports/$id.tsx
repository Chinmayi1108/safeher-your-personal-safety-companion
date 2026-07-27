import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { Sparkles, Download, Trash2, Paperclip } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { PageLoader } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";
import { generateIncidentReport } from "@/lib/ai.functions";
import {
  getIncident,
  listEvidence,
  updateIncident,
  deleteIncident,
  incidentTypeLabel,
  signedEvidenceUrl,
} from "@/services/incidents";
import { errorMessage, formatDateTime, formatBytes } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({
    meta: [
      { title: "Incident report — SafeHer" },
      { name: "description", content: "Review your incident, attach evidence and generate an official AI report." },
      { property: "og:title", content: "Incident report — SafeHer" },
      { property: "og:description", content: "Review and export your incident report." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const generate = useServerFn(generateIncidentReport);
  const [busy, setBusy] = useState(false);

  const incident = useQuery({ queryKey: ["incident", id], queryFn: () => getIncident(id) });
  const evidence = useQuery({ queryKey: ["evidence", id], queryFn: () => listEvidence(id) });

  if (incident.isLoading) {
    return (
      <AppShell>
        <PageLoader label="Opening your report" />
      </AppShell>
    );
  }

  const record = incident.data;
  if (!record) {
    return (
      <AppShell>
        <div className="container page">
          <PageHead title="Report not found" subtitle="This report may have been deleted." />
        </div>
      </AppShell>
    );
  }

  async function runAi() {
    if (!record) return;
    setBusy(true);
    try {
      const { report } = await generate({
        data: {
          title: record.title,
          incidentType: incidentTypeLabel(record.incident_type),
          description: record.description,
          occurredAt: record.occurred_at ? formatDateTime(record.occurred_at) : null,
          location: record.location,
          suspectDetails: record.suspect_details,
          reporterName: profile?.full_name ?? null,
          evidence: (evidence.data ?? []).map((item) => ({ kind: item.kind, fileName: item.file_name })),
        },
      });
      await updateIncident(record.id, {
        ai_report: report,
        ai_generated_at: new Date().toISOString(),
        status: "submitted",
      });
      await queryClient.invalidateQueries({ queryKey: ["incident", id] });
      toast.success("Report generated.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function downloadPdf() {
    if (!record?.ai_report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    doc.setFontSize(16);
    doc.text("SafeHer Incident Report", margin, 60);
    doc.setFontSize(10);
    doc.text(`Generated ${formatDateTime(record.ai_generated_at)}`, margin, 78);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(record.ai_report, 515 - margin);
    doc.text(lines, margin, 108);
    doc.save(`safeher-report-${record.id.slice(0, 8)}.pdf`);
  }

  async function openEvidence(path: string) {
    const url = await signedEvidenceUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Could not open that file.");
  }

  async function remove() {
    if (!record) return;
    try {
      await deleteIncident(record.id);
      toast.success("Report deleted.");
      navigate({ to: "/reports" });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead title={record.title} subtitle={`${incidentTypeLabel(record.incident_type)} · ${formatDateTime(record.created_at)}`} />

        <div className="card">
          <strong>Your account</strong>
          <p className="text-muted mt-sm" style={{ whiteSpace: "pre-wrap" }}>
            {record.description}
          </p>
          {record.location ? <p className="text-muted" style={{ marginBottom: 0 }}>Location: {record.location}</p> : null}
        </div>

        {evidence.data?.length ? (
          <div className="card mt-md">
            <strong>Evidence</strong>
            <div className="stack gap-xs mt-sm">
              {evidence.data.map((item) => (
                <button key={item.id} className="list-card" onClick={() => openEvidence(item.storage_path)}>
                  <span className="list-icon">
                    <Paperclip size={18} aria-hidden="true" />
                  </span>
                  <span className="grow">
                    <span className="list-title">{item.file_name}</span>
                    <span className="list-sub">
                      {item.kind} · {formatBytes(item.size_bytes)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="card mt-md">
          <div className="row-between">
            <strong>Official AI report</strong>
            {record.ai_report ? (
              <Button size="sm" variant="outline" onClick={downloadPdf} icon={<Download size={16} />}>
                PDF
              </Button>
            ) : null}
          </div>
          {record.ai_report ? (
            <pre className="report-preview mt-sm">{record.ai_report}</pre>
          ) : (
            <p className="text-muted mt-sm">
              Generate a structured, police-ready version of your account. Nothing is invented — only what you wrote.
            </p>
          )}
          <Button className="mt-sm" loading={busy} onClick={runAi} icon={<Sparkles size={18} />}>
            {record.ai_report ? "Regenerate report" : "Generate report"}
          </Button>
        </div>

        <Button className="mt-md" variant="ghost" onClick={remove} icon={<Trash2 size={16} />}>
          Delete this report
        </Button>
      </div>
    </AppShell>
  );
}
