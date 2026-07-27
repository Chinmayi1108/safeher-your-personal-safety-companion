import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/Field";
import { Logo } from "@/components/common/Logo";
import { validateForm, email as emailRule, password as passwordRule, required } from "@/utils/validation";
import { errorMessage } from "@/utils/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join SafeHer" },
      {
        name: "description",
        content: "Create your SafeHer account to unlock one-tap SOS alerts, AI incident reports and a private evidence vault.",
      },
      { property: "og:title", content: "Sign in or join SafeHer" },
      { property: "og:description", content: "Your safety circle, evidence vault and AI report assistant in one place." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [values, setValues] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<"fullName" | "email" | "password", string>>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    navigate({ to: profile?.onboarding_completed ? "/dashboard" : "/onboarding", replace: true });
  }, [loading, session, profile, navigate]);

  const setValue = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const rules =
      mode === "signup"
        ? { fullName: [required("Full name")], email: [required("Email"), emailRule], password: [required("Password"), passwordRule] }
        : mode === "signin"
          ? { email: [required("Email"), emailRule], password: [required("Password")] }
          : { email: [required("Email"), emailRule] };

    const nextErrors = validateForm(values, rules);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: values.fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to SafeHer.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (error) throw error;
        toast.success("Welcome back.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("If that email exists, a reset link is on its way.");
        setMode("signin");
      }
    } catch (error) {
      toast.error(errorMessage(error, "We could not complete that. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (error) {
      toast.error(errorMessage(error, "Google sign-in failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <span className="auth-blob auth-blob-1" aria-hidden="true" />
      <span className="auth-blob auth-blob-2" aria-hidden="true" />

      <div className="auth-panel">
        <aside className="auth-aside">
          <Logo />
          <h2>Safety that stays with you.</h2>
          <p>Join thousands of women who keep their evidence, contacts and emergency help in one calm place.</p>
          <ul>
            <li>One-tap SOS with live location</li>
            <li>AI-written, police-ready reports</li>
            <li>Private, encrypted evidence vault</li>
            <li>Helplines and services near you</li>
          </ul>
        </aside>

        <div className="auth-card animate-in">
          <Link to="/" className="nav-link row" style={{ marginBottom: 12, display: "inline-flex" }}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
          <h1>
            {mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Reset your password"}
          </h1>
          <p className="auth-sub">
            {mode === "signup"
              ? "It takes less than a minute and it's free."
              : mode === "signin"
                ? "Sign in to reach your safety circle."
                : "We'll email you a secure link to set a new password."}
          </p>

          <form onSubmit={onSubmit} className="stack gap-sm" noValidate>
            {mode === "signup" ? (
              <TextField
                id="fullName"
                label="Full name"
                autoComplete="name"
                placeholder="Ananya Sharma"
                value={values.fullName}
                onChange={setValue("fullName")}
                error={errors.fullName}
              />
            ) : null}

            <TextField
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={setValue("email")}
              error={errors.email}
            />

            {mode !== "forgot" ? (
              <TextField
                id="password"
                label="Password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                value={values.password}
                onChange={setValue("password")}
                error={errors.password}
              />
            ) : null}

            <Button type="submit" block loading={busy}>
              {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot" ? (
            <>
              <div className="divider">or</div>
              <Button variant="outline" block onClick={onGoogle} disabled={busy} icon={<Mail size={18} />}>
                Continue with Google
              </Button>
            </>
          ) : null}

          <div className="stack gap-xs mt-md text-center">
            {mode === "signin" ? (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => setMode("forgot")} type="button">
                  Forgot your password?
                </button>
                <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
                  New to SafeHer?{" "}
                  <button className="btn btn-ghost btn-sm" onClick={() => setMode("signup")} type="button">
                    Create an account
                  </button>
                </p>
              </>
            ) : (
              <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
                Already have an account?{" "}
                <button className="btn btn-ghost btn-sm" onClick={() => setMode("signin")} type="button">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
