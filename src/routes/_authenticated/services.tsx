import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, PhoneCall } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { SkeletonList } from "@/components/common/States";
import { listNearbyServices } from "@/services/reference";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({
    meta: [
      { title: "Help nearby — SafeHer" },
      { name: "description", content: "Police stations, helplines, hospitals and shelters you can reach right now." },
      { property: "og:title", content: "Help nearby — SafeHer" },
      { property: "og:description", content: "Emergency services and helplines, one tap away." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Services,
});

function Services() {
  const services = useQuery({ queryKey: ["nearby-services"], queryFn: listNearbyServices });

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="Help nearby" subtitle="Verified helplines and emergency services." />
        {services.isLoading ? (
          <SkeletonList />
        ) : (
          <div className="stack gap-sm">
            {services.data?.map((service) => (
              <div className="list-card" key={service.id}>
                <span className="list-icon">
                  <Building2 size={20} aria-hidden="true" />
                </span>
                <span className="grow">
                  <span className="list-title">{service.name}</span>
                  <span className="list-sub">
                    {service.category}
                    {service.open_24x7 ? " · open 24×7" : ""}
                    {service.address ? ` · ${service.address}` : ""}
                  </span>
                </span>
                <a className="btn btn-sm" href={`tel:${service.phone}`} aria-label={`Call ${service.name}`}>
                  <PhoneCall size={16} aria-hidden="true" /> Call
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
