import {
  Camera,
  ExternalLink,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  Webhook,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SAMPLE_CROP_CASES, type UiCopy } from "../data/locales";
import type {
  MedicineRecommendation,
  SeverityLevel,
  UiLanguage,
  WhatsAppChatMessage,
} from "../types/agronomy";
import { fileToBase64Resized, urlToBase64 } from "../utils/media";
import { stopAllActiveSpeech } from "../utils/speech";
import { notifyStorageChanged } from "../utils/storageHealth";
import { AudioAdviceButton } from "./AudioAdviceButton";
import { CropImageSlot } from "./CropImageSlot";
import { MedicineDosageList } from "./MedicineDosageList";
import {
  VoiceRecorderButton,
  type VoiceTranscriptionMeta,
} from "./VoiceRecorderButton";

interface WhatsAppChatbotProps {
  uiLang: UiLanguage;
  copy: UiCopy;
  initialPrompt?: string | null;
  onConsumeInitialPrompt?: () => void;
  onError: (msg: string) => void;
}

const WHATSAPP_STORAGE_KEY = "kisan_mitra_whatsapp_thread_v1";

interface PendingAttachment {
  base64: string;
  mimeType: string;
  previewUrl: string;
  label: string;
}

export function WhatsAppChatbot({
  uiLang,
  copy,
  initialPrompt,
  onConsumeInitialPrompt,
  onError,
}: WhatsAppChatbotProps) {
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(WHATSAPP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WhatsAppChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [
      {
        id: "wa_welcome",
        role: "model",
        text: copy.whatsappWelcome,
        spokenText: copy.whatsappWelcome,
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [pendingVoiceNote, setPendingVoiceNote] = useState<{
    audioUrl: string;
    durationSec: number;
  } | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kisan_mitra_wa_autospeak_v1") !== "false";
    } catch {
      return true;
    }
  });
  const [autoSendVoice, setAutoSendVoice] = useState<boolean>(() => {
    try {
      return localStorage.getItem("kisan_mitra_wa_autosend_v1") !== "false";
    } catch {
      return true;
    }
  });
  const [autoPlayMsgId, setAutoPlayMsgId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      onConsumeInitialPrompt?.();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  useEffect(() => {
    try {
      localStorage.setItem("kisan_mitra_wa_autospeak_v1", String(autoSpeak));
    } catch {
      // Ignore storage errors
    }
    if (!autoSpeak) {
      stopAllActiveSpeech();
    }
  }, [autoSpeak]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "kisan_mitra_wa_autosend_v1",
        String(autoSendVoice)
      );
    } catch {
      // Ignore storage errors
    }
  }, [autoSendVoice]);

  useEffect(() => {
    try {
      const compact = messages.slice(-24).map((m) => ({
        ...m,
        voiceNoteUrl: undefined,
        imagePreviewUrl: m.imagePreviewUrl?.startsWith("/src/")
          ? m.imagePreviewUrl
          : undefined,
      }));
      localStorage.setItem(WHATSAPP_STORAGE_KEY, JSON.stringify(compact));
      notifyStorageChanged(false);
    } catch {
      notifyStorageChanged(true);
    }
  }, [messages]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  const handlePhotoSelect = async (file: File) => {
    try {
      const encoded = await fileToBase64Resized(file);
      setAttachment({
        base64: encoded.base64,
        mimeType: encoded.mimeType,
        previewUrl: encoded.dataUrl,
        label: file.name,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not load photo.");
    }
  };

  const sendMessage = async (
    overrideText?: string,
    overridePhoto?: PendingAttachment | null,
    startNewConsultation?: boolean,
    overrideVoiceMeta?: VoiceTranscriptionMeta
  ) => {
    const textToSend = (overrideText ?? inputText).trim();
    const photoToSend = overridePhoto === undefined ? attachment : overridePhoto;
    const voiceToAttach =
      overrideVoiceMeta !== undefined ? overrideVoiceMeta : pendingVoiceNote;

    if ((!textToSend && !photoToSend) || isSending) return;

    const userMessage: WhatsAppChatMessage = {
      id: `wa_u_${Date.now()}`,
      role: "user",
      text: textToSend || "Crop photo sent for diagnosis.",
      imagePreviewUrl: photoToSend?.previewUrl,
      voiceNoteUrl: voiceToAttach?.audioUrl,
      voiceDurationSec: voiceToAttach?.durationSec,
      timestamp: new Date().toISOString(),
    };

    const priorHistory = messages
      .filter((m) => !m.id.startsWith("wa_err_"))
      .slice(-14)
      .map((m) => ({
        role: m.role,
        text: m.text,
        stage: m.stage,
      }));
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInputText("");
    setAttachment(null);
    setPendingVoiceNote(null);
    setIsSending(true);

    try {
      const res = await fetch("/api/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          imageBase64: photoToSend?.base64,
          imageMimeType: photoToSend?.mimeType,
          preferredLanguage: uiLang,
          history: priorHistory,
          startNewConsultation,
        }),
      });

      const data = (await res.json()) as {
        whatsappReply?: string;
        spokenSummary?: string;
        stage?: "clarifying" | "final_diagnosis";
        quickReplies?: string[];
        severity?: SeverityLevel;
        medicines?: MedicineRecommendation[];
        error?: string;
      };

      if (!res.ok || !data.whatsappReply) {
        throw new Error(data.error || "WhatsApp bot failed to respond.");
      }

      const botMsgId = `wa_m_${Date.now()}`;
      const botMessage: WhatsAppChatMessage = {
        id: botMsgId,
        role: "model",
        text: data.whatsappReply,
        spokenText: data.spokenSummary || data.whatsappReply,
        stage: data.stage,
        quickReplies: data.quickReplies,
        severity: data.severity,
        medicines: data.medicines,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (autoSpeak) {
        setAutoPlayMsgId(botMsgId);
      }
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : "Could not send WhatsApp message.";
      onError(errMsg);
      const inlineNotice: WhatsAppChatMessage = {
        id: `wa_err_${Date.now()}`,
        role: "model",
        text: `Unable to fetch response right now: ${errMsg}`,
        quickReplies: textToSend ? [textToSend] : undefined,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, inlineNotice]);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceTranscribed = (
    transcript: string,
    meta?: VoiceTranscriptionMeta
  ) => {
    const clean = transcript.trim();
    if (!clean) return;
    if (autoSendVoice) {
      const combinedText = inputText.trim()
        ? `${inputText.trim()} ${clean}`
        : clean;
      void sendMessage(combinedText, undefined, undefined, meta);
      return;
    }
    setInputText((prev) => (prev ? `${prev} ${clean}` : clean));
    if (meta?.audioUrl) {
      setPendingVoiceNote({
        audioUrl: meta.audioUrl,
        durationSec: meta.durationSec ?? 1,
      });
    }
  };

  const handleSampleToChat = async (sampleId: string) => {
    const sample = SAMPLE_CROP_CASES.find((s) => s.id === sampleId);
    if (!sample) return;
    try {
      const encoded = await urlToBase64(sample.imageUrl);
      await sendMessage(
        sample.sampleNote[uiLang],
        {
          base64: encoded.base64,
          mimeType: encoded.mimeType,
          previewUrl: sample.imageUrl,
          label: sample.title[uiLang],
        },
        true
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not load sample.");
    }
  };

  const handleResetChat = () => {
    stopAllActiveSpeech();
    setAutoPlayMsgId(null);
    setPendingVoiceNote(null);
    setMessages([
      {
        id: `wa_welcome_${Date.now()}`,
        role: "model",
        text: copy.whatsappWelcome,
        spokenText: copy.whatsappWelcome,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  return (
    <div className="rounded-xl border border-[#E2E6E0] bg-white overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      {/* WhatsApp Bot Header */}
      <div className="bg-[#075E54] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#128C7E] text-white shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base font-semibold truncate">
              {copy.whatsappTitle}
            </h1>
            <p className="text-xs text-[#D1FAE5] truncate">
              {copy.whatsappSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAutoSpeak((prev) => !prev)}
            aria-pressed={autoSpeak}
            title="Automatically speak every bot reply aloud"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              autoSpeak
                ? "bg-[#25D366] text-[#0B2E19] font-semibold"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {autoSpeak ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{autoSpeak ? "Auto-Speak On" : "Auto-Speak Off"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWebhookModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors whitespace-nowrap"
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>{copy.whatsappWebhookBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{copy.whatsappClearChat}</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Bar */}
      <div className="bg-[#F0F4EF] border-b border-[#E2E6E0] px-4 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-xs font-medium text-[#4E5D52] whitespace-nowrap shrink-0">
          Test in Chat:
        </span>
        {SAMPLE_CROP_CASES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={isSending}
            onClick={() => void handleSampleToChat(sample.id)}
            className="rounded-lg border border-[#D4DDD1] bg-white px-3 py-1 text-xs font-medium text-[#143322] hover:bg-[#E7EFE5] transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {sample.title[uiLang]}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto bg-[#EFEAE2] p-4 md:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isLatestMsg = idx === messages.length - 1;
          const waShareUrl = `https://wa.me/?text=${encodeURIComponent(msg.text)}`;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-2`}
            >
              <div
                className={`max-w-[92%] md:max-w-[78%] rounded-xl px-4 py-3 shadow-xs space-y-3 ${
                  isUser
                    ? "bg-[#D9FDD3] text-[#111B21] rounded-tr-xs"
                    : "bg-white text-[#111B21] border border-[#E2E6E0] rounded-tl-xs"
                }`}
              >
                {msg.imagePreviewUrl && (
                  <div className="rounded-lg overflow-hidden border border-black/10 max-w-xs">
                    <CropImageSlot
                      src={msg.imagePreviewUrl}
                      alt="Crop attachment"
                      className="w-full h-44 object-cover"
                    />
                  </div>
                )}

                {msg.voiceNoteUrl && (
                  <div className="rounded-lg bg-black/5 px-2.5 py-2 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#143322]">
                      <span className="inline-flex items-center gap-1">
                        <Mic className="w-3 h-3 text-[#075E54]" />
                        <span>Voice Message</span>
                      </span>
                      {typeof msg.voiceDurationSec === "number" && (
                        <span className="font-mono tabular-nums text-[#4E5D52]">
                          0:{String(msg.voiceDurationSec).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <audio
                      controls
                      src={msg.voiceNoteUrl}
                      className="w-full max-w-[260px] h-8"
                    />
                  </div>
                )}

                <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </div>

                {!isUser && msg.medicines && msg.medicines.length > 0 && (
                  <div className="pt-1">
                    <MedicineDosageList medicines={msg.medicines} compact />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/8">
                  <span className="font-mono text-[11px] text-[#667781] tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {!isUser && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AudioAdviceButton
                        text={msg.spokenText || msg.text}
                        copy={copy}
                        preferredLanguage={uiLang}
                        autoPlay={autoSpeak && msg.id === autoPlayMsgId}
                        compact
                        onError={onError}
                      />
                      <a
                        href={waShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-[#0B2E19] hover:bg-[#20BD5A] transition-colors whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{copy.openInWhatsapp}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {isLatestMsg &&
                !isUser &&
                !isSending &&
                msg.quickReplies &&
                msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-[92%] md:max-w-[78%]">
                    {msg.quickReplies.map((replyOpt, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => void sendMessage(replyOpt, null)}
                        className="rounded-lg border border-[#15803D]/35 bg-white px-3 py-1.5 text-xs font-medium text-[#143322] hover:bg-[#F0FDF4] hover:border-[#15803D] transition-colors text-left"
                      >
                        {replyOpt}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E2E6E0] px-4 py-3 text-sm text-[#4E5D52]">
              <Loader2 className="w-4 h-4 animate-spin text-[#075E54]" />
              <span>{copy.diagnosingBtn}</span>
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Attachment Preview Bar */}
      {attachment && (
        <div className="bg-[#FAFBF9] border-t border-[#E2E6E0] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <CropImageSlot
              src={attachment.previewUrl}
              alt={attachment.label}
              className="w-12 h-12 rounded-md object-cover border border-[#D4DDD1] shrink-0"
            />
            <span className="text-xs font-medium text-[#141B16] truncate">
              {attachment.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="rounded-md p-1.5 text-[#5B6B5F] hover:bg-[#E6ECE3]"
            aria-label={copy.removePhotoBtn}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Voice Note Preview Bar */}
      {pendingVoiceNote && (
        <div className="bg-[#FAFBF9] border-t border-[#E2E6E0] px-4 py-2 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Mic className="w-4 h-4 text-[#075E54] shrink-0" />
            <audio
              controls
              src={pendingVoiceNote.audioUrl}
              className="h-8 max-w-[240px]"
            />
            <span className="font-mono text-xs text-[#4E5D52] tabular-nums shrink-0">
              0:{String(pendingVoiceNote.durationSec).padStart(2, "0")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPendingVoiceNote(null)}
            className="rounded-md p-1.5 text-[#5B6B5F] hover:bg-[#E6ECE3]"
            aria-label="Discard voice note"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Mode Bar */}
      <div className="bg-[#F7F8F6] border-t border-[#E2E6E0] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#4E5D52] shrink-0">
        <span className="text-[11px]">
          Voice Input: Record or Dictate in your language
        </span>
        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium text-[#143322]">
          <input
            type="checkbox"
            checked={autoSendVoice}
            onChange={(e) => setAutoSendVoice(e.target.checked)}
            className="accent-[#075E54] w-3.5 h-3.5"
          />
          <span>Auto-send after speaking</span>
        </label>
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        className="bg-[#F0F2F5] border-t border-[#E2E6E0] p-3 flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isSending}
            title={copy.uploadPhotoBtn}
            className="inline-flex items-center justify-center rounded-lg border border-[#D4DDD1] bg-white p-2.5 text-[#143322] hover:bg-[#F7F8F6] min-h-[42px] min-w-[42px]"
          >
            <ImagePlus className="w-4 h-4 text-[#075E54]" />
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isSending}
            title={copy.takePhotoBtn}
            className="inline-flex items-center justify-center rounded-lg border border-[#D4DDD1] bg-white p-2.5 text-[#143322] hover:bg-[#F7F8F6] min-h-[42px] min-w-[42px]"
          >
            <Camera className="w-4 h-4 text-[#075E54]" />
          </button>
          <VoiceRecorderButton
            copy={copy}
            preferredLanguage={uiLang}
            compact
            disabled={isSending}
            onTranscribed={handleVoiceTranscribed}
            onError={onError}
          />
        </div>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={copy.whatsappInputPlaceholder}
          disabled={isSending}
          className="flex-1 min-w-[180px] rounded-lg border border-[#D4DDD1] bg-white px-4 py-2.5 text-sm text-[#141B16] placeholder:text-[#6B7A6E] focus:border-[#075E54] focus:outline-none min-h-[42px]"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !attachment) || isSending}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#075E54] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#064E46] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePhotoSelect(file);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePhotoSelect(file);
            e.target.value = "";
          }}
        />
      </form>

      {/* Meta WhatsApp Cloud API Webhook Setup Modal */}
      {showWebhookModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowWebhookModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-[#141B16]">
                  Meta WhatsApp Business Cloud API Webhook
                </h2>
                <p className="text-xs text-[#5B6B5F] mt-0.5">
                  This server already exposes live GET verification and POST message/image/voice-note webhook endpoints.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                className="rounded-md p-1.5 text-[#5B6B5F] hover:bg-[#F2F5F0]"
                aria-label={copy.closePreview}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#263029]">
              <div className="rounded-lg bg-[#F7F8F6] border border-[#E2E6E0] p-3">
                <div className="text-xs font-semibold text-[#4E5D52] mb-1">
                  Callback Webhook URL
                </div>
                <code className="block font-mono text-xs text-[#143322] break-all">
                  {webhookUrl}
                </code>
              </div>

              <div className="space-y-1.5 text-xs leading-relaxed text-[#3D4B41]">
                <p>
                  <strong>1.</strong> In Meta App Dashboard &rarr; WhatsApp &rarr; Configuration, set the Callback URL above and Verify Token (<code className="font-mono">WHATSAPP_VERIFY_TOKEN</code>, default <code className="font-mono">kisan-mitra-verify</code>).
                </p>
                <p>
                  <strong>2.</strong> Subscribe to the <code className="font-mono">messages</code> webhook field so incoming farmer texts, leaf photos, and voice notes route to Kisan Mitra.
                </p>
                <p>
                  <strong>3.</strong> Add <code className="font-mono">WHATSAPP_ACCESS_TOKEN</code> and <code className="font-mono">WHATSAPP_PHONE_NUMBER_ID</code> in your server environment secrets to send automated WhatsApp replies back to the farmer&apos;s phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
