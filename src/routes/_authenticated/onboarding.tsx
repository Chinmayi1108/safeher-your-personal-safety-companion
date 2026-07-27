import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/profiles";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/Field";
import { errorMessage } from "@/utils/format";
import { phone as phoneRule } from "@/utils/validation";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up SafeHer" },
      { name: "description", content: "Personalise SafeHer so your alerts and reports carry the right details." },
      { property: "og:title", content: "Set up SafeHer" },
      { property: "og:description", content: "Personalise SafeHer in a few quick steps." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Onboarding,
});

const slides = [
  {
    icon: ShieldCheck,
    title: "Emergency help, instantly",
    body: "Hold SOS for three seconds and every trusted contact receives your location and a call-for-help message.",
  },
  {
    icon: Sparkles,
    title: "Report without reliving it",
    body: "Speak freely or type a few lines. SafeHer's AI writes the formal report so you don't have to.",
  },
  {
    icon: Users,
    title: "Your circle, your rules",
    body: "Choose exactly who gets notified, in what order. You can change it any time.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ fullName: "", phone: "" });
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);

  const fullName = values.fullName || profile?.full_name || "";

  async function finish() {
    const nextErrors: { fullName?: string; phone?: string } = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required";
    const phoneError = values.phone ? phoneRule(values.phone) : null;
    if (phoneError) nextErrors.phone = phoneError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;

    setBusy(true);
    try {
      await updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: values.phone.trim() || null,
        onboarding_completed: true,
      });
      await refreshProfile();
      toast.success("You're all set.");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  const slide = slides[step];
  const Icon = slide?.icon ?? ShieldCheck;
  const isFinalStep = step === slides.length;

  return (
    <div className="onboard">
      <div className="container-narrow">
        {!isFinalStep ? (
          <div className="card animate-in text-center">
            <div className="onboard-art">
              <Icon size={40} aria-hidden="true" />
            </div>
            <h1>{slide.title}</h1>
            <p className="text-muted">{slide.body}</p>
            <div className="dots" role="presentation">
              {slides.map((item, index) => (
                <span key={item.title} className={`dot${index === step ? " dot-active" : ""}`} />
              ))}
            </div>
            <div className="row mt-md" style={{ justifyContent: "center" }}>
              <Button variant="ghost" onClick={() => setStep(slides.length)}>
                Skip
              </Button>
              <Button onClick={() => setStep((value) => value + 1)}>Continue</Button>
            </div>
          </div>
        ) : (
          <div className="card animate-in">
            <h1>A few details</h1>
            <p className="text-muted">
              These appear on your reports and in the alert your contacts receive.
            </p>
            <div className="stack gap-sm mt-md">
              <TextField
                id="onboard-name"
                label="Full name"
                value={fullName}
                onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
                error={errors.fullName}
                placeholder="Ananya Sharma"
              />
              <TextField
                id="onboard-phone"
                label="Phone number"
                hint="Optional, but it helps contacts reach you fast."
                value={values.phone}
                onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
                error={errors.phone}
                placeholder="+91 98765 43210"
              />
              <Button block loading={busy} onClick={finish}>
                Enter SafeHer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
