import type { ReactNode } from "react";

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="loader-page">
      <span className="spinner spinner-lg spinner-dark" aria-hidden="true" />
      <p className="text-muted">{label}…</p>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="stack gap-sm">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton-line" style={{ width: "45%" }} />
          <div className="skeleton skeleton-line" style={{ width: "80%" }} />
          <div className="skeleton skeleton-line" style={{ width: "60%" }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "primary",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "primary" | "danger";
}) {
  return (
    <div className="state-block">
      <div className={`state-icon${tone === "danger" ? " state-icon-danger" : ""}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
