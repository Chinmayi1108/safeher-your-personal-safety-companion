import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  FileText,
  Sparkles,
  Users,
  MapPin,
  Building2,
  Lock,
  ArrowRight,
} from "lucide-react";
import heroArt from "@/assets/hero-safety.jpg";
import { Logo } from "@/components/common/Logo";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeHer — AI Safety & Emergency Help for Women" },
      {
        name: "description",
        content:
          "SafeHer sends one-tap SOS alerts with your location, turns your account into a police-ready incident report with AI, and stores evidence privately.",
      },
      { property: "og:title", content: "SafeHer — AI Safety & Emergency Help for Women" },
      {
        property: "og:description",
        content:
          "One-tap SOS with live location, AI-written incident reports, private evidence storage and trusted contacts.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ShieldAlert,
    title: "One-tap SOS",
    body: "Hold the SOS button for three seconds to alert every trusted contact with your live location.",
  },
  {
    icon: Sparkles,
    title: "AI incident reports",
    body: "Speak or type what happened. SafeHer turns it into a structured, factual report you can download as a PDF.",
  },
  {
    icon: Lock,
    title: "Private evidence vault",
    body: "Photos, videos, audio and documents are stored in encrypted storage only you can open.",
  },
  {
    icon: Users,
    title: "Trusted circle",
    body: "Add family or friends in priority order and choose exactly who gets notified in an emergency.",
  },
  {
    icon: MapPin,
    title: "Safer route guidance",
    body: "Plan journeys along well-lit, populated routes and share your check-in status.",
  },
  {
    icon: Building2,
    title: "Help nearby",
    body: "Police stations, women's helplines, hospitals and shelters, always one tap away.",
  },
];

const steps = [
  { title: "Create your profile", body: "Sign up in under a minute and add the people you trust." },
  { title: "Stay ready", body: "Keep SOS on your home screen and your safety tips close by." },
  { title: "Document safely", body: "Record or type an incident; AI drafts the formal report." },
  { title: "Get real help", body: "Share the report, alert contacts and reach nearby services." },
];

function Landing() {
  return (
    <>
      <header className="app-header">
        <div className="container row-between">
          <Logo />
          <nav className="desktop-nav" aria-label="Main">
            <a className="nav-link" href="#features">Features</a>
            <a className="nav-link" href="#how">How it works</a>
            <a className="nav-link" href="#faq">FAQ</a>
          </nav>
          <Link to="/auth" className="btn btn-sm">
            Get started
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="animate-in">
              <span className="eyebrow">Women's safety, reimagined</span>
              <h1>Help is one tap away — and proof is one sentence away.</h1>
              <p className="lead">
                SafeHer combines an instant SOS alert, a private evidence vault and an AI assistant that writes
                your incident report in clear, official language.
              </p>
              <div className="hero-actions">
                <Link to="/auth" className="btn btn-lg">
                  Create free account <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a href="#how" className="btn btn-outline btn-lg">
                  See how it works
                </a>
              </div>
              <div className="row wrap mt-md">
                <span className="chip">No ads, ever</span>
                <span className="chip">Encrypted evidence</span>
                <span className="chip">Works on any phone</span>
              </div>
            </div>
            <div className="hero-art animate-in delay-2">
              <img src={heroArt} alt="Illustration of a woman walking safely at night with SafeHer open on her phone" width={1200} height={1200} />
            </div>
          </div>
        </section>

        <section className="container" id="features" style={{ padding: "56px 20px" }}>
          <div className="section-head">
            <h2>Everything you need in a difficult moment</h2>
          </div>
          <div className="grid grid-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-icon">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{feature.title}</h3>
                  <p className="text-muted">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="container" id="how" style={{ padding: "24px 20px 56px" }}>
          <div className="section-head">
            <h2>How SafeHer works</h2>
          </div>
          <div className="grid grid-2">
            {steps.map((step, index) => (
              <div className="card card-soft" key={step.title}>
                <div className="row">
                  <span className="step-num">{index + 1}</span>
                  <strong>{step.title}</strong>
                </div>
                <p className="text-muted mb-sm mt-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container" id="faq" style={{ padding: "0 20px 56px" }}>
          <div className="section-head">
            <h2>Questions women ask us</h2>
          </div>
          <div className="faq">
            <details>
              <summary>Who can see my evidence and reports?</summary>
              <p>
                Only you. Files live in a private storage bucket and every record is locked to your account with
                row-level security. Nothing is shared unless you download and send it yourself.
              </p>
            </details>
            <details>
              <summary>What happens when I press SOS?</summary>
              <p>
                SafeHer records the alert with your location and emails every trusted contact marked for
                emergencies, with a map link and your phone number.
              </p>
            </details>
            <details>
              <summary>Is the AI report accurate?</summary>
              <p>
                The assistant only reorganises what you tell it into an official structure and never invents
                details. You can edit every line before downloading the PDF.
              </p>
            </details>
            <details>
              <summary>Does it work without internet?</summary>
              <p>
                SafeHer needs a connection to send alerts. For no-signal situations, always keep local emergency
                numbers such as 112 and 1091 saved on your phone.
              </p>
            </details>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 64 }}>
          <div className="cta-band">
            <h2>Feel prepared, not afraid.</h2>
            <p>Set up your safety circle today — it takes less than two minutes.</p>
            <Link to="/auth" className="btn btn-lg">
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
