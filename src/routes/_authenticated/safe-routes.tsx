import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Navigation, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/Field";
import { useGeolocation } from "@/hooks/useGeolocation";

export const Route = createFileRoute("/_authenticated/safe-routes")({
  head: () => ({
    meta: [
      { title: "Safe routes — SafeHer" },
      { name: "description", content: "Plan a journey along well-lit, populated routes and share your trip." },
      { property: "og:title", content: "Safe routes — SafeHer" },
      { property: "og:description", content: "Plan safer journeys and share them with your circle." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SafeRoutes,
});

const guidance = [
  "Stay on main roads with street lighting and open shops.",
  "Share your live location with one trusted contact before you leave.",
  "Keep one earphone out so you can hear what's around you.",
  "If you feel followed, walk into a shop, pharmacy or police station.",
];

function SafeRoutes() {
  const { position, locate, loading } = useGeolocation();
  const [destination, setDestination] = useState("");

  const mapsUrl = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${
        position ? `&origin=${position.latitude},${position.longitude}` : ""
      }&travelmode=walking`
    : null;

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="Safe routes" subtitle="Plan the safest way to get where you're going." />

        <div className="card stack gap-sm">
          <TextField
            id="destination"
            label="Where are you going?"
            placeholder="Home, office, metro station…"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
          <Button variant="outline" onClick={() => void locate()} loading={loading} icon={<MapPin size={18} />}>
            {position ? `Starting from ${position.label}` : "Use my current location"}
          </Button>
          <a
            className="btn btn-block"
            href={mapsUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!mapsUrl}
            onClick={(event) => {
              if (!mapsUrl) event.preventDefault();
            }}
          >
            <Navigation size={18} aria-hidden="true" /> Open walking directions
          </a>
        </div>

        <div className="card card-soft mt-md">
          <div className="row">
            <span className="list-icon">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <strong>Travel safely</strong>
          </div>
          <ul className="prose mt-sm">
            {guidance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
