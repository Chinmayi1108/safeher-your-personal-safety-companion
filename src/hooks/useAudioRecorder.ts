import { useCallback, useEffect, useRef, useState } from "react";

interface RecorderRefs {
  stream: MediaStream;
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  chunks: Float32Array[];
}

function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const targetRate = 16000;
  const ratio = sampleRate / targetRate;
  const outLength = Math.floor(merged.length / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);

  const writeString = (pos: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(pos + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, outLength * 2, true);

  for (let i = 0; i < outLength; i += 1) {
    const sample = merged[Math.floor(i * ratio)] ?? 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function useAudioRecorder() {
  const refs = useRef<RecorderRefs | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  const cleanup = useCallback(() => {
    const current = refs.current;
    if (!current) return null;
    current.stream.getTracks().forEach((track) => track.stop());
    current.processor.disconnect();
    current.source.disconnect();
    const blob = encodeWav(current.chunks, current.context.sampleRate);
    void current.context.close();
    refs.current = null;
    return blob;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];
      processor.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      processor.connect(context.destination);
      refs.current = { stream, context, source, processor, chunks };
      setSeconds(0);
      setRecording(true);
    } catch {
      setError("Microphone access is needed to record your statement.");
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const blob = cleanup();
    setRecording(false);
    if (!blob || blob.size < 4000) {
      setError("That recording was too short. Please try again.");
      return null;
    }
    return blob;
  }, [cleanup]);

  const cancel = useCallback(() => {
    cleanup();
    setRecording(false);
    setSeconds(0);
  }, [cleanup]);

  useEffect(() => () => void cleanup(), [cleanup]);

  return { recording, seconds, error, start, stop, cancel };
}
