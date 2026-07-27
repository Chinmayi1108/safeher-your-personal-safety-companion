import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { TextField } from "@/components/common/Field";
import { EmptyState, SkeletonList } from "@/components/common/States";
import { useAuth } from "@/context/AuthContext";
import { listContacts, createContact, deleteContact } from "@/services/contacts";
import { errorMessage } from "@/utils/format";
import { email as emailRule, phone as phoneRule, required, validateForm } from "@/utils/validation";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => ({
    meta: [
      { title: "Trusted contacts — SafeHer" },
      { name: "description", content: "Manage the people SafeHer alerts when you trigger an SOS." },
      { property: "og:title", content: "Trusted contacts — SafeHer" },
      { property: "og:description", content: "Choose who gets notified in an emergency." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Contacts,
});

function Contacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({ name: "", relationship: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "phone" | "email", string>>>({});

  const contacts = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: () => listContacts(user!.id),
    enabled: !!user?.id,
  });

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  async function save() {
    const nextErrors = validateForm(values, {
      name: [required("Name")],
      phone: [required("Phone"), phoneRule],
      email: [required("Email"), emailRule],
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;
    setBusy(true);
    try {
      await createContact(user.id, {
        name: values.name.trim(),
        relationship: values.relationship.trim() || null,
        phone: values.phone.trim(),
        email: values.email.trim(),
        priority: (contacts.data?.length ?? 0) + 1,
        notify_on_sos: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["contacts", user.id] });
      setValues({ name: "", relationship: "", phone: "", email: "" });
      setOpen(false);
      toast.success("Contact added.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteContact(id);
      await queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] });
      toast.success("Contact removed.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead
          title="Trusted circle"
          subtitle="These people are emailed the moment you send an SOS."
          action={
            <Button size="sm" onClick={() => setOpen(true)} icon={<Plus size={16} />}>
              Add
            </Button>
          }
        />

        {contacts.isLoading ? (
          <SkeletonList count={2} />
        ) : contacts.data?.length ? (
          <div className="stack gap-sm">
            {contacts.data.map((contact) => (
              <div className="list-card" key={contact.id}>
                <span className="list-icon">
                  <Users size={20} aria-hidden="true" />
                </span>
                <span className="grow">
                  <span className="list-title">{contact.name}</span>
                  <span className="list-sub">
                    {contact.relationship ? `${contact.relationship} · ` : ""}
                    {contact.phone}
                  </span>
                </span>
                <button className="btn-icon" aria-label={`Remove ${contact.name}`} onClick={() => remove(contact.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users size={24} aria-hidden="true" />}
            title="No contacts yet"
            description="Add at least one person who should know if you're in trouble."
            action={<Button size="sm" onClick={() => setOpen(true)}>Add a contact</Button>}
          />
        )}
      </div>

      <Modal
        open={open}
        title="Add trusted contact"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={save}>Save contact</Button>
          </>
        }
      >
        <div className="stack gap-sm">
          <TextField id="c-name" label="Name" value={values.name} onChange={set("name")} error={errors.name} />
          <TextField id="c-rel" label="Relationship" placeholder="Sister, friend, colleague" value={values.relationship} onChange={set("relationship")} />
          <TextField id="c-phone" label="Phone" value={values.phone} onChange={set("phone")} error={errors.phone} />
          <TextField id="c-email" label="Email" type="email" hint="Alerts are delivered by email." value={values.email} onChange={set("email")} error={errors.email} />
        </div>
      </Modal>
    </AppShell>
  );
}
