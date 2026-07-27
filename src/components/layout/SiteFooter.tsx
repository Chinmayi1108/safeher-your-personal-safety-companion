import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/common/Logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="text-muted mt-sm" style={{ maxWidth: 320 }}>
              SafeHer helps women document what happened, reach trusted people fast, and find real help nearby.
            </p>
          </div>
          <div className="footer-links">
            <strong>Product</strong>
            <Link to="/auth">Create account</Link>
            <Link to="/auth">Sign in</Link>
          </div>
          <div className="footer-links">
            <strong>Emergency numbers</strong>
            <a href="tel:112">112 — All emergencies</a>
            <a href="tel:1091">1091 — Women's helpline</a>
            <a href="tel:181">181 — Women in distress</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} SafeHer. Built for safety, privacy and dignity.</span>
          <span>If you are in immediate danger, call your local emergency number.</span>
        </div>
      </div>
    </footer>
  );
}
