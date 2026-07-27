import { ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="SafeHer home">
      <span className="brand-mark">
        <ShieldCheck size={20} aria-hidden="true" />
      </span>
      <span>
        Safe<span className="brand-her">Her</span>
      </span>
    </Link>
  );
}
