import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/Field";
import { Logo } from "@/components/common/Logo";
import { errorMessage } from "@/utils/format";
import { password as passwordRule } from "@/utils/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new SafeHer password" },
      { name: "description", content: "Choose a new password to get back into your SafeHer account." },
      { property: "og:title", content: "Set a new SafeHer password" },
      { property: "og:description", content: "Choose a new password to get back into your SafeHer account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = passwordRule(value);
    setError(message);
    if (message) return;

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: value });
      if (updateError) throw updateError;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (updateError) {
      toast.error(errorMessage(updateError, "That link may have expired. Please request a new one."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card animate-in" style={{ maxWidth: 440, margin: "0 auto" }}>
        <Logo />
        <h1 className="mt-md">Set a new password</h1>
        <p className="auth-sub">Choose something you haven't used before.</p>
        <form className="stack gap-sm" onSubmit={onSubmit} noValidate>
          <TextField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={error}
          />
          <Button type="submit" block loading={busy}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
