import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { LogOut, Save, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { TextField } from "@/components/common/Field";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/profiles";
import { errorMessage, initials } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — SafeHer" },
      { name: "description", content: "Update the details that appear on your reports and emergency alerts." },
      { property: "og:title", content: "Your profile — SafeHer" },
      { property: "og:description", content: "Manage your SafeHer account details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    bloodGroup: profile?.blood_group ?? "",
    address: profile?.address ?? "",
  });

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      await updateProfile(user.id, {
        full_name: values.fullName.trim() || "SafeHer user",
        phone: values.phone.trim() || null,
        blood_group: values.bloodGroup.trim() || null,
        address: values.address.trim() || null,
      });
      await refreshProfile();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="Your profile" subtitle="These details appear on reports and emergency alerts." />

        <div className="profile-head">
          <span className="avatar avatar-lg">{initials(profile?.full_name)}</span>
          <div>
            <strong>{profile?.full_name || "SafeHer user"}</strong>
            <p className="text-muted" style={{ marginBottom: 0 }}>{user?.email}</p>
          </div>
        </div>

        <div className="card mt-md stack gap-sm">
          <TextField id="p-name" label="Full name" value={values.fullName} onChange={set("fullName")} />
          <TextField id="p-phone" label="Phone" value={values.phone} onChange={set("phone")} />
          <TextField id="p-blood" label="Blood group" placeholder="O+" value={values.bloodGroup} onChange={set("bloodGroup")} />
          <TextField id="p-address" label="Address" value={values.address} onChange={set("address")} />
          <Button loading={busy} onClick={save} icon={<Save size={18} />}>
            Save changes
          </Button>
        </div>

        <div className="settings-list mt-md">
          <Link to="/contacts" className="settings-row">
            <Users size={18} aria-hidden="true" /> Trusted contacts
          </Link>
          <Link to="/sos" className="settings-row">
            <ShieldCheck size={18} aria-hidden="true" /> Emergency SOS
          </Link>
          <button className="settings-row settings-row-danger" onClick={onSignOut}>
            <LogOut size={18} aria-hidden="true" /> Sign out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
