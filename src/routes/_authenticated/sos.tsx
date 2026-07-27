import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, PhoneCall, ShieldAlert, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { triggerSos } from "@/lib/sos.functions";
import { listSosAlerts, resolveSosAlert } from "@/services/sos";
import { listContacts } from "@/services/contacts";
import { errorMessage, formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — SafeHer" },
      { name: "description", content: "Send an instant SOS alert with your live location to every trusted contact." },
      { property: "og:title", content: "Emergency SOS — SafeHer" },
      { property: "og:description", content: "One press alerts your trusted circle with your location." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SosPage,
});

const HOLD_MS = 3000;

function SosPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const sendSos = useServerFn(triggerSos);
  const { position, locate, loading: locating } = useGeolocation();

  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const alerts = useQuery({
    queryKey: ["sos-alerts", userId],
    queryFn: () => listSosAlerts(userId!),
    enabled: !!userId,
  });
  const contacts = useQuery({
    queryKey: ["contacts", userId],
    queryFn: () => listContacts(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    void locate();
  }, [locate]);

  function clearHold() {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    setProgress(0);
  }

  function startHold() {
    if (sending) return;
    const started = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, (elapsed / HOLD_MS) * 100));
      if (elapsed >= HOLD_MS) {
        clearHold();
        void fire();
      }
    }, 60);
  }

  async function fire() {
    setSending(true);
    try {
      const location = position ?? (await locate());
      const result = await sendSos({
        data: {
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          locationLabel: location?.label ?? null,
          message: "I need help right now. Please reach me immediately.",
        },
      });
      if (result.warning) toast(result.warning, { icon: "⚠️" });
      toast.success(
        result.contactsNotified > 0
          ? `Alert sent to ${result.contactsNotified} contact${result.contactsNotified === 1 ? "" : "s"}.`
          : "Alert recorded. Add contact emails so they can be notified.",
      );
      await queryClient.invalidateQueries({ queryKey: ["sos-alerts", userId] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    } catch (error) {
      toast.error(errorMessage(error, "We could not send the alert. Please call emergency services."));
    } finally {
      setSending(false);
    }
  }

  async function resolve(id: string) {
    try {
      await resolveSosAlert(id, "resolved");
      toast.success("Marked as safe.");
      await queryClient.invalidateQueries({ queryKey: ["sos-alerts", userId] });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const notifiable = contacts.data?.filter((contact) => contact.notify_on_sos).length ?? 0;

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="Emergency SOS" subtitle="Press and hold for three seconds to alert your circle." />

        <div className="sos-stage">
          <button
            className={`sos-button${progress > 0 || sending ? " is-armed" : ""}`}
            onMouseDown={startHold}
            onMouseUp={clearHold}
            onMouseLeave={clearHold}
            onTouchStart={startHold}
            onTouchEnd={clearHold}
            disabled={sending}
            aria-label="Press and hold to send an emergency alert"
          >
            <ShieldAlert size={44} aria-hidden="true" />
            <span>{sending ? "Sending…" : progress > 0 ? `${Math.round(progress)}%` : "HOLD FOR SOS"}</span>
          </button>

          <div className="sos-status">
            <div className="row">
              <MapPin size={16} aria-hidden="true" />
              <span>{locating ? "Finding your location…" : position ? position.label : "Location unavailable"}</span>
            </div>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              {notifiable} contact{notifiable === 1 ? "" : "s"} will be notified by email.
            </p>
          </div>

          <div className="row wrap" style={{ justifyContent: "center" }}>
            <a className="btn btn-danger" href="tel:112">
              <PhoneCall size={18} aria-hidden="true" /> Call 112
            </a>
            <a className="btn btn-outline" href="tel:1091">
              Women's helpline 1091
            </a>
          </div>
        </div>

        <div className="section-head mt-lg">
          <h2>Alert history</h2>
        </div>
        <div className="stack gap-sm">
          {alerts.data?.length ? (
            alerts.data.map((alert) => (
              <div className="list-card" key={alert.id}>
                <span className="list-icon list-icon-danger">
                  <ShieldAlert size={20} aria-hidden="true" />
                </span>
                <span className="grow">
                  <span className="list-title">{formatDateTime(alert.created_at)}</span>
                  <span className="list-sub">
                    {alert.location_label ?? "No location"} · {alert.contacts_notified} notified
                  </span>
                </span>
                {alert.status === "active" ? (
                  <Button size="sm" variant="outline" onClick={() => resolve(alert.id)} icon={<CheckCircle2 size={16} />}>
                    I'm safe
                  </Button>
                ) : (
                  <span className="badge badge-success">{alert.status}</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted">No alerts sent yet. We hope it stays that way.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
