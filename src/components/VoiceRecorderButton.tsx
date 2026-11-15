import { AudioLines, Loader2, Mic, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { UiCopy } from "../data/locales";
import type { UiLanguage } from "../types/agronomy";
import { blobToBase64 } from "../utils/media";
import {
  type BrowserSpeechRecognition,
  getSpeechRecognitionCtor,
  resolveSpeechLocale,
  stopAllActiveSpeech,
} from "../utils/speech";

export interface VoiceTranscriptionMeta {
  audioUrl?: string;
  durationSec?: number;
}

interface VoiceRecorderButtonProps {
  copy: UiCopy;
  preferredLanguage?: UiLanguage;
  disabled?: boolean;
  compact?: boolean;
  onTranscribed: (text: string, meta?: VoiceTranscriptionMeta) => void;
  onError: (message: string) => void;
}

export function VoiceRecorderButton({
  copy,
  preferredLanguage,
  disabled = false,
  compact = false,
  onTranscribed,
  onError,
}: VoiceRecorderButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "recording" | "dictating" | "transcribing"
  >("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [livePreview, setLivePreview] = useState("");
  const [levels, setLevels] = useState<number[]>([
    0.2, 0.25, 0.3, 0.2, 0.25, 0.3, 0.2, 0.25,
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const startedAtRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const speechRecRef = useRef<BrowserSpeechRecognition | null>(null);
  const liveTranscriptRef = useRef<string>("");

  const speechSupported = Boolean(getSpeechRecognitionCtor());

  useEffect(() => {
    if (status !== "recording" && status !== "dictating") return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const cleanupVisualizer = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
  };

  const cleanupSpeechRecognition = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.onresult = null;
        speechRecRef.current.onerror = null;
        speechRecRef.current.onend = null;
        speechRecRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      speechRecRef.current = null;
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      cleanupVisualizer();
      cleanupSpeechRecognition();
      stopTracks();
    };
  }, []);

  const startLiveSpeechRecognition = (mode: "backup" | "primary") => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return false;
    try {
      const rec = new Ctor();
      rec.lang = resolveSpeechLocale(preferredLanguage);
      rec.continuous = true;
      rec.interimResults = true;
      liveTranscriptRef.current = "";
      setLivePreview("");

      let committed = "";
      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript ?? "";
          if (event.results[i].isFinal) {
            committed = `${committed} ${piece}`.trim();
          } else {
            interim = `${interim} ${piece}`.trim();
          }
        }
        const combined = `${committed} ${interim}`.trim();
        liveTranscriptRef.current = combined;
        setLivePreview(combined);
      };
      rec.onerror = () => {
        if (mode === "primary") {
          setStatus("idle");
        }
      };
      rec.onend = () => {
        if (mode === "primary" && !cancelledRef.current) {
          const text = liveTranscriptRef.current.trim();
          setStatus("idle");
          setElapsedSeconds(0);
          setLivePreview("");
          if (text) {
            onTranscribed(text, {
              durationSec: Math.max(
                1,
                Math.round((Date.now() - startedAtRef.current) / 1000)
              ),
            });
          }
        }
      };
      rec.start();
      speechRecRef.current = rec;
      return true;
    } catch {
      return false;
    }
  };

  const handleStartRecording = async () => {
    if (disabled || status !== "idle") return;
    stopAllActiveSpeech();

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      if (speechSupported) {
        cancelledRef.current = false;
        startedAtRef.current = Date.now();
        setElapsedSeconds(0);
        if (startLiveSpeechRecognition("primary")) {
          setStatus("dictating");
          return;
        }
      }
      onError(copy.micErrorFallback);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelledRef.current = false;
      startedAtRef.current = Date.now();

      // Real-time microphone level meter
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            const next = Array.from({ length: 8 }, (_, idx) => {
              const raw = dataArray[idx] ?? 0;
              return Math.min(1, Math.max(0.15, raw / 180));
            });
            setLevels(next);
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch {
        // Ignore visualizer failures on restricted contexts
      }

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      const supportedMime = preferredTypes.find((t) =>
        MediaRecorder.isTypeSupported(t)
      );
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      // Capture optional Web Speech Recognition transcript alongside for zero-quota offline/429 resilience
      startLiveSpeechRecognition("backup");

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cleanupVisualizer();
        cleanupSpeechRecognition();
        stopTracks();

        const durationSec = Math.max(
          1,
          Math.round((Date.now() - startedAtRef.current) / 1000)
        );
        const backupText = liveTranscriptRef.current.trim();
        setLivePreview("");

        if (cancelledRef.current) {
          setStatus("idle");
          setElapsedSeconds(0);
          return;
        }

        const audioBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audioBlob.size < 400 && !backupText) {
          setStatus("idle");
          setElapsedSeconds(0);
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        setStatus("transcribing");

        try {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            throw new Error("Offline");
          }
          const { base64, mimeType } = await blobToBase64(audioBlob);
          const cleanMime = mimeType.split(";")[0] || "audio/webm";
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64: base64, mimeType: cleanMime }),
          });
          const data = (await res.json()) as {
            transcription?: string;
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error || "Transcription failed.");
          }
          const finalText = (data.transcription || backupText).trim();
          if (finalText) {
            onTranscribed(finalText, { audioUrl, durationSec });
          } else {
            onTranscribed(`Voice note (${durationSec}s)`, {
              audioUrl,
              durationSec,
            });
          }
        } catch (err) {
          if (backupText) {
            onTranscribed(backupText, { audioUrl, durationSec });
          } else if (audioBlob.size >= 400) {
            onTranscribed(`Voice note (${durationSec}s)`, {
              audioUrl,
              durationSec,
            });
          } else {
            onError(
              err instanceof Error ? err.message : copy.micErrorFallback
            );
          }
        } finally {
          setStatus("idle");
          setElapsedSeconds(0);
        }
      };

      setElapsedSeconds(0);
      setStatus("recording");
      recorder.start();
    } catch {
      cleanupVisualizer();
      cleanupSpeechRecognition();
      stopTracks();
      onError(copy.micErrorFallback);
    }
  };

  const handleStartLiveDictation = () => {
    if (disabled || status !== "idle" || !speechSupported) return;
    stopAllActiveSpeech();
    cancelledRef.current = false;
    startedAtRef.current = Date.now();
    setElapsedSeconds(0);
    if (startLiveSpeechRecognition("primary")) {
      setStatus("dictating");
    } else {
      onError(copy.micErrorFallback);
    }
  };

  const handleStopAndFinish = () => {
    if (
      status === "recording" &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      cancelledRef.current = false;
      mediaRecorderRef.current.stop();
      return;
    }
    if (status === "dictating" && speechRecRef.current) {
      cancelledRef.current = false;
      speechRecRef.current.stop();
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    setLivePreview("");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    } else {
      cleanupVisualizer();
      cleanupSpeechRecognition();
      stopTracks();
      setStatus("idle");
      setElapsedSeconds(0);
    }
  };

  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(
    2,
    "0"
  )}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  if (status === "recording" || status === "dictating") {
    return (
      <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-[#DC2626]/30 bg-[#FEF2F2] px-3 py-1.5">
        {status === "recording" ? (
          <div
            className="flex items-center gap-0.5 h-5"
            aria-hidden="true"
            title="Live microphone input level"
          >
            {levels.map((lvl, idx) => (
              <span
                key={idx}
                className="w-1 rounded-xs bg-[#DC2626] transition-[height] duration-75"
                style={{ height: `${Math.round(4 + lvl * 14)}px` }}
              />
            ))}
          </div>
        ) : (
          <AudioLines className="w-4 h-4 text-[#DC2626] shrink-0" />
        )}

        <span className="font-mono text-xs font-semibold text-[#991B1B] tabular-nums">
          {formattedTime}
        </span>

        {livePreview && (
          <span className="max-w-[140px] truncate text-xs text-[#7F1D1D]">
            {livePreview}
          </span>
        )}

        <button
          type="button"
          onClick={handleStopAndFinish}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#DC2626] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#B91C1C] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>{copy.stopRecordingBtn}</span>
        </button>

        <button
          type="button"
          onClick={handleCancel}
          aria-label={copy.cancelRecordingBtn}
          className="inline-flex items-center justify-center rounded-md p-1 text-[#7F1D1D] hover:bg-[#FEE2E2] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (status === "transcribing") {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-[#EEF2EC] px-3.5 py-2 text-xs font-medium text-[#2E4234] whitespace-nowrap shrink-0 min-h-[42px]"
      >
        <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
        <span>{copy.transcribingLabel}</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => void handleStartRecording()}
        disabled={disabled}
        title={copy.recordVoiceBtn}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-white font-medium text-[#143322] hover:bg-[#F1F5EE] hover:border-[#9EB39B] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
          compact
            ? "px-3 py-2 text-xs min-h-[42px]"
            : "px-4 py-2.5 text-sm min-h-[44px]"
        }`}
      >
        <Mic className="w-4 h-4 text-[#15803D]" />
        <span>{copy.recordVoiceBtn}</span>
      </button>

      {speechSupported && compact && (
        <button
          type="button"
          onClick={handleStartLiveDictation}
          disabled={disabled}
          title="Live speech-to-text dictation"
          aria-label="Live speech-to-text dictation"
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#D4DDD1] bg-white px-2.5 py-2 text-xs font-medium text-[#143322] hover:bg-[#F1F5EE] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 min-h-[42px]"
        >
          <AudioLines className="w-4 h-4 text-[#075E54]" />
          <span className="hidden md:inline">Dictate</span>
        </button>
      )}
    </div>
  );
}
