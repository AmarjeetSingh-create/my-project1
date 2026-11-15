import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UiCopy } from "../data/locales";
import type { UiLanguage } from "../types/agronomy";
import {
  claimActiveAudioChannel,
  cleanTextForSpeech,
  releaseActiveAudioChannel,
  resolveSpeechLocale,
} from "../utils/speech";

interface AudioAdviceButtonProps {
  text: string;
  copy: UiCopy;
  preferredLanguage?: UiLanguage;
  compact?: boolean;
  autoPlay?: boolean;
  onError?: (msg: string) => void;
}

const SPEED_STEPS = [0.85, 1, 1.25] as const;

function formatAudioSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const rounded = Math.floor(sec);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

let ttsEndpointDisabled = false;

export function AudioAdviceButton({
  text,
  copy,
  preferredLanguage,
  compact = false,
  autoPlay = false,
  onError,
}: AudioAdviceButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">(
    "idle"
  );
  const [engine, setEngine] = useState<"tts" | "browser" | null>(null);
  const [speedIdx, setSpeedIdx] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cachedSrcRef = useRef<{ text: string; url: string } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoPlayedTextRef = useRef<string | null>(null);
  const speedIdxRef = useRef(speedIdx);
  speedIdxRef.current = speedIdx;

  const currentSpeed = SPEED_STEPS[speedIdx];

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (
      utteranceRef.current &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setState("idle");
    setEngine(null);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      releaseActiveAudioChannel(stopPlayback);
      if (cachedSrcRef.current) {
        URL.revokeObjectURL(cachedSrcRef.current.url);
        cachedSrcRef.current = null;
      }
    };
  }, [stopPlayback]);

  const startBrowserSpeech = useCallback(
    (speechText: string, rate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        throw new Error("Voice playback is unavailable on this browser.");
      }
      window.speechSynthesis.cancel();

      const cleaned = cleanTextForSpeech(speechText);
      const locale = resolveSpeechLocale(preferredLanguage, speechText);
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = locale;
      utterance.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const langPrefix = locale.split("-")[0];
      const matchedVoice =
        voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        utteranceRef.current = null;
        releaseActiveAudioChannel(stopPlayback);
        setState("idle");
        setEngine(null);
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        releaseActiveAudioChannel(stopPlayback);
        setState("idle");
        setEngine(null);
      };

      utteranceRef.current = utterance;
      claimActiveAudioChannel(stopPlayback);
      setEngine("browser");
      setState("playing");
      window.speechSynthesis.speak(utterance);
    },
    [preferredLanguage, stopPlayback]
  );

  const startPlayback = useCallback(async () => {
    if (!text.trim()) return;

    try {
      setState("loading");
      claimActiveAudioChannel(stopPlayback);

      let wavUrl: string | null = null;

      if (cachedSrcRef.current && cachedSrcRef.current.text === text) {
        wavUrl = cachedSrcRef.current.url;
      } else if (
        !ttsEndpointDisabled &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (res.status === 400 || res.status === 404) {
            ttsEndpointDisabled = true;
          }
          if (res.ok) {
            const data = (await res.json()) as { audioBase64?: string };
            if (data.audioBase64) {
              const byteChars = atob(data.audioBase64);
              const bytes = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                bytes[i] = byteChars.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: "audio/wav" });
              wavUrl = URL.createObjectURL(blob);
              if (cachedSrcRef.current) {
                URL.revokeObjectURL(cachedSrcRef.current.url);
              }
              cachedSrcRef.current = { text, url: wavUrl };
            }
          }
        } catch {
          // Fall back seamlessly to browser SpeechSynthesis
        }
      }

      if (!wavUrl) {
        startBrowserSpeech(text, SPEED_STEPS[speedIdxRef.current]);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(wavUrl);
      audio.playbackRate = SPEED_STEPS[speedIdxRef.current];
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime || 0);
      };
      audio.onended = () => {
        releaseActiveAudioChannel(stopPlayback);
        setState("idle");
        setEngine(null);
        setCurrentTime(0);
      };
      audio.onerror = () => {
        audioRef.current = null;
        try {
          startBrowserSpeech(text, SPEED_STEPS[speedIdxRef.current]);
        } catch (fallbackErr) {
          releaseActiveAudioChannel(stopPlayback);
          setState("idle");
          setEngine(null);
          onError?.(
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "Audio playback failed on this device."
          );
        }
      };

      await audio.play();
      setEngine("tts");
      setState("playing");
    } catch (err) {
      try {
        startBrowserSpeech(text, SPEED_STEPS[speedIdxRef.current]);
      } catch {
        releaseActiveAudioChannel(stopPlayback);
        setState("idle");
        setEngine(null);
        onError?.(
          err instanceof Error ? err.message : "Audio playback failed."
        );
      }
    }
  }, [text, stopPlayback, startBrowserSpeech, onError]);

  useEffect(() => {
    if (
      autoPlay &&
      text.trim() &&
      autoPlayedTextRef.current !== text &&
      state === "idle"
    ) {
      autoPlayedTextRef.current = text;
      void startPlayback();
    }
  }, [autoPlay, text, state, startPlayback]);

  const handlePauseResume = async () => {
    if (engine === "tts" && audioRef.current) {
      if (state === "playing") {
        audioRef.current.pause();
        setState("paused");
      } else if (state === "paused") {
        await audioRef.current.play();
        setState("playing");
      }
      return;
    }

    if (
      engine === "browser" &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      if (state === "playing") {
        window.speechSynthesis.pause();
        setState("paused");
      } else if (state === "paused") {
        window.speechSynthesis.resume();
        setState("playing");
      }
    }
  };

  const handleCycleSpeed = () => {
    const nextIdx = (speedIdx + 1) % SPEED_STEPS.length;
    const nextRate = SPEED_STEPS[nextIdx];
    setSpeedIdx(nextIdx);

    if (engine === "tts" && audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    } else if (engine === "browser" && state === "playing") {
      startBrowserSpeech(text, nextRate);
    }
  };

  if (state === "playing" || state === "paused") {
    return (
      <div className="inline-flex items-center gap-1 rounded-lg border border-[#15803D] bg-[#143322] px-1.5 py-1 text-white">
        <button
          type="button"
          onClick={() => void handlePauseResume()}
          aria-label={state === "playing" ? "Pause audio" : "Resume audio"}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-white/15 transition-colors whitespace-nowrap"
        >
          {state === "playing" ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{state === "playing" ? "Pause" : "Resume"}</span>
        </button>

        {engine === "tts" && duration > 0 && (
          <span className="font-mono text-[11px] text-[#D1FAE5] px-1 tabular-nums">
            {formatAudioSeconds(currentTime)}/{formatAudioSeconds(duration)}
          </span>
        )}

        <button
          type="button"
          onClick={handleCycleSpeed}
          title="Playback speed"
          className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white hover:bg-white/25 transition-colors tabular-nums"
        >
          {currentSpeed}x
        </button>

        <button
          type="button"
          onClick={() => {
            stopPlayback();
            releaseActiveAudioChannel(stopPlayback);
          }}
          aria-label={copy.stopAudio}
          title={copy.stopAudio}
          className="inline-flex items-center justify-center rounded-md p-1 text-[#FECACA] hover:bg-white/15 transition-colors"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void startPlayback()}
      disabled={state === "loading"}
      className={`inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-white font-medium text-[#143322] hover:bg-[#F1F5EE] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
        compact
          ? "px-3 py-1.5 text-xs min-h-[36px]"
          : "px-4 py-2 text-sm min-h-[40px]"
      }`}
    >
      {state === "loading" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
          <span>{copy.preparingAudio}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-[#15803D]" />
          <span>{copy.listenAdvice}</span>
        </>
      )}
    </button>
  );
}
