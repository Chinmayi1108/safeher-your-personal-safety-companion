import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { EmptyState, SkeletonList } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";
import { listNotifications, markAllRead } from "@/services/notifications";
import { relativeTime } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SafeHer" },
      { name: "description", content: "Alerts, reminders and updates from your SafeHer account." },
      { property: "og:title", content: "Notifications — SafeHer" },
      { property: "og:description", content: "Alerts and updates from SafeHer." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(user!.id),
    enabled: !!user?.id,
  });

  async function readAll() {
    if (!user) return;
    await markAllRead(user.id);
    await queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead
          title="Notifications"
          action={
            <Button size="sm" variant="outline" onClick={readAll} icon={<CheckCheck size={16} />}>
              Mark all read
            </Button>
          }
        />
        {notifications.isLoading ? (
          <SkeletonList count={2} />
        ) : notifications.data?.length ? (
          <div className="stack gap-sm">
            {notifications.data.map((item) => (
              <div className="list-card" key={item.id}>
                <span className={`list-icon${item.category === "emergency" ? " list-icon-danger" : ""}`}>
                  <Bell size={18} aria-hidden="true" />
                </span>
                <span className="grow">
                  <span className="list-title">{item.title}</span>
                  <span className="list-sub">
                    {item.body} · {relativeTime(item.created_at)}
                  </span>
                </span>
                {!item.read ? <span className="badge badge-primary">New</span> : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell size={24} aria-hidden="true" />}
            title="You're all caught up"
            description="Alerts about your SOS and reports will show up here."
          />
        )}
      </div>
    </AppShell>
  );
}
