import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Mic, Square, Type, Upload, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/common/Button";
import { TextField, TextAreaField, SelectField } from "@/components/common/Field";
import { useAuth } from "@/context/AuthContext";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeComplaint } from "@/lib/ai.functions";
import { INCIDENT_TYPES, createIncident, uploadEvidence } from "@/services/incidents";
import { errorMessage } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/reports/new")({
  head: () => ({
    meta: [
      { title: "New incident report — SafeHer" },
      { name: "description", content: "Describe an incident by voice or text and attach evidence privately." },
      { property: "og:title", content: "New incident report — SafeHer" },
      { property: "og:description", content: "Document an incident by voice or text." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewReport,
});

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

function NewReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const transcribe = useServerFn(transcribeComplaint);
  const recorder = useAudioRecorder();
  const fileInput = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"text" | "voice">("text");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [values, setValues] = useState({
    title: "",
    incidentType: "harassment",
    occurredAt: "",
    location: "",
    suspectDetails: "",
    description: "",
  });

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  async function stopAndTranscribe() {
    const blob = await recorder.stop();
    if (!blob) {
      if (recorder.error) toast.error(recorder.error);
      return;
    }
    setTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const { text } = await transcribe({ data: { audioBase64: base64, mimeType: "audio/wav" } });
      setValues((current) => ({
        ...current,
        description: current.description ? `${current.description}\n\n${text}` : text,
      }));
      toast.success("Transcribed your statement.");
    } catch (error) {
      toast.error(errorMessage(error, "We could not transcribe that recording."));
    } finally {
      setTranscribing(false);
    }
  }

  async function submit() {
    if (!user) return;
    if (values.description.trim().length < 15) {
      toast.error("Please describe the incident in a little more detail.");
      return;
    }
    setBusy(true);
    try {
      const incident = await createIncident(user.id, {
        title: values.title.trim() || "Untitled incident",
        incident_type: values.incidentType,
        occurred_at: values.occurredAt ? new Date(values.occurredAt).toISOString() : null,
        location: values.location.trim() || null,
        suspect_details: values.suspectDetails.trim() || null,
        description: values.description.trim(),
        input_mode: mode,
        status: "draft",
      });

      for (const file of files) {
        await uploadEvidence(user.id, incident.id, file);
      }

      toast.success("Report saved securely.");
      navigate({ to: "/reports/$id", params: { id: incident.id } });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="container page">
        <PageHead title="New report" subtitle="Take your time. Everything here stays private to you." />

        <div className="mode-toggle" role="tablist" aria-label="Input mode">
          <button
            className={`mode-btn${mode === "text" ? " is-active" : ""}`}
            onClick={() => setMode("text")}
            role="tab"
            aria-selected={mode === "text"}
          >
            <Type size={16} aria-hidden="true" /> Type it
          </button>
          <button
            className={`mode-btn${mode === "voice" ? " is-active" : ""}`}
            onClick={() => setMode("voice")}
            role="tab"
            aria-selected={mode === "voice"}
          >
            <Mic size={16} aria-hidden="true" /> Speak it
          </button>
        </div>

        {mode === "voice" ? (
          <div className="recorder mt-md">
            <button
              className={`rec-button${recorder.recording ? " is-recording" : ""}`}
              onClick={() => (recorder.recording ? void stopAndTranscribe() : void recorder.start())}
              disabled={transcribing}
              aria-label={recorder.recording ? "Stop recording" : "Start recording"}
            >
              {recorder.recording ? <Square size={26} aria-hidden="true" /> : <Mic size={26} aria-hidden="true" />}
            </button>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              {transcribing
                ? "Transcribing your statement…"
                : recorder.recording
                  ? `Recording… ${recorder.seconds}s — tap to stop`
                  : "Tap the mic and describe what happened in your own words."}
            </p>
          </div>
        ) : null}

        <div className="card mt-md stack gap-sm">
          <TextField
            id="title"
            label="Report title"
            placeholder="Followed near the metro station"
            value={values.title}
            onChange={set("title")}
          />
          <SelectField id="type" label="Incident type" value={values.incidentType} onChange={set("incidentType")}>
            {INCIDENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </SelectField>
          <TextField id="when" label="When did it happen?" type="datetime-local" value={values.occurredAt} onChange={set("occurredAt")} />
          <TextField
            id="where"
            label="Where did it happen?"
            placeholder="Street, landmark or area"
            value={values.location}
            onChange={set("location")}
          />
          <TextAreaField
            id="description"
            label="What happened?"
            rows={7}
            placeholder="Describe the incident in your own words. Include times, people and anything you noticed."
            value={values.description}
            onChange={set("description")}
          />
          <TextAreaField
            id="suspect"
            label="Description of the person involved"
            rows={3}
            placeholder="Height, clothing, vehicle number, anything you remember."
            value={values.suspectDetails}
            onChange={set("suspectDetails")}
          />
        </div>

        <div className="card mt-md">
          <strong>Evidence</strong>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Photos, videos, audio or documents. Stored encrypted, visible only to you.
          </p>
          <button className="dropzone" onClick={() => fileInput.current?.click()} type="button">
            <Upload size={20} aria-hidden="true" />
            <span>Tap to add files</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files ?? [])])}
          />
          {files.length ? (
            <div className="thumb-grid mt-sm">
              {files.map((file, index) => (
                <div className="thumb" key={`${file.name}-${index}`}>
                  <span className="thumb-name">{file.name}</span>
                  <button
                    className="thumb-remove"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <Button className="mt-md" block loading={busy} onClick={submit}>
          Save report
        </Button>
      </div>
    </AppShell>
  );
}
