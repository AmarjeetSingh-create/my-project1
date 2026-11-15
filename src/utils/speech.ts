import type { UiLanguage } from "../types/agronomy";

const UI_LANG_TO_BCP47: Record<UiLanguage, string> = {
  english: "en-IN",
  hindi: "hi-IN",
  punjabi: "pa-IN",
  marathi: "mr-IN",
  gujarati: "gu-IN",
  bengali: "bn-IN",
  tamil: "ta-IN",
  telugu: "te-IN",
};

export function resolveSpeechLocale(
  preferredLanguage?: UiLanguage | string,
  textSample?: string
): string {
  if (textSample) {
    if (/[\u0A00-\u0A7F]/.test(textSample)) return "pa-IN";
    if (/[\u0A80-\u0AFF]/.test(textSample)) return "gu-IN";
    if (/[\u0980-\u09FF]/.test(textSample)) return "bn-IN";
    if (/[\u0B80-\u0BFF]/.test(textSample)) return "ta-IN";
    if (/[\u0C00-\u0C7F]/.test(textSample)) return "te-IN";
    if (/[\u0900-\u097F]/.test(textSample)) {
      return preferredLanguage === "marathi" ? "mr-IN" : "hi-IN";
    }
  }
  if (preferredLanguage && preferredLanguage in UI_LANG_TO_BCP47) {
    return UI_LANG_TO_BCP47[preferredLanguage as UiLanguage];
  }
  return "en-IN";
}

export function cleanTextForSpeech(raw: string): string {
  return raw
    .replace(/[*_`#🩺🔍💊🛡️•]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function getSpeechRecognitionCtor():
  | (new () => BrowserSpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

let activeAudioStopper: (() => void) | null = null;

export function claimActiveAudioChannel(stopFn: () => void): void {
  if (activeAudioStopper && activeAudioStopper !== stopFn) {
    try {
      activeAudioStopper();
    } catch {
      // Ignore cleanup failures
    }
  }
  activeAudioStopper = stopFn;
}

export function releaseActiveAudioChannel(stopFn: () => void): void {
  if (activeAudioStopper === stopFn) {
    activeAudioStopper = null;
  }
}

export function stopAllActiveSpeech(): void {
  if (activeAudioStopper) {
    try {
      activeAudioStopper();
    } catch {
      // Ignore cleanup failures
    }
    activeAudioStopper = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors
    }
  }
}
