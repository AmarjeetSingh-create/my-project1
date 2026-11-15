import {
  AlertCircle,
  BookOpen,
  Camera,
  CloudSun,
  Globe,
  ImagePlus,
  Loader2,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Sprout,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CropImageSlot } from "./components/CropImageSlot";
import { DiagnosisReport } from "./components/DiagnosisReport";
import { MedicinesDirectory } from "./components/MedicinesDirectory";
import { SoilHealthCard } from "./components/SoilHealthCard";
import { SprayPlannerView } from "./components/SprayPlannerView";
import { SystemStatusIndicator } from "./components/SystemStatusIndicator";
import { VoiceRecorderButton } from "./components/VoiceRecorderButton";
import { WhatsAppChatbot } from "./components/WhatsAppChatbot";
import {
  CROP_OPTIONS,
  FIELD_BANNER_IMAGE,
  LANGUAGE_OPTIONS,
  SAMPLE_CROP_CASES,
  UI_COPY,
} from "./data/locales";
import type {
  ChatMessage,
  ConsultationCase,
  DiagnosisResult,
  DiseaseMedicineEntry,
  PendingDiagnosisPayload,
  SampleCropCase,
  SprayLogEntry,
  UiLanguage,
  WorkspaceMode,
} from "./types/agronomy";
import { fileToBase64Resized, urlToBase64 } from "./utils/media";
import { notifyStorageChanged } from "./utils/storageHealth";

const STORAGE_KEY = "kisan_mitra_consultations_v1";
const LANG_STORAGE_KEY = "kisan_mitra_ui_lang_v1";

interface SelectedPhotoState {
  base64: string;
  mimeType: string;
  previewUrl: string;
  label: string;
}

const VALID_LANGS: UiLanguage[] = [
  "english",
  "hindi",
  "punjabi",
  "marathi",
  "gujarati",
  "bengali",
  "tamil",
  "telugu",
];

export default function App() {
  const [uiLang, setUiLang] = useState<UiLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY) as UiLanguage | null;
      if (saved && VALID_LANGS.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage errors
    }
    return "english";
  });

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("clinic");
  const [whatsappPrefillPrompt, setWhatsappPrefillPrompt] = useState<string | null>(
    null
  );

  const [consultations, setConsultations] = useState<ConsultationCase[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsultationCase[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Composer state
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhotoState | null>(
    null
  );
  const [symptomText, setSymptomText] = useState("");
  const [cropType, setCropType] = useState("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const consultationsRef = useRef<ConsultationCase[]>(consultations);
  const syncingRef = useRef(false);

  const copy = UI_COPY[uiLang];

  useEffect(() => {
    consultationsRef.current = consultations;
  }, [consultations]);

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, uiLang);
    } catch {
      // Ignore
    }
  }, [uiLang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consultations));
      notifyStorageChanged(false);
    } catch {
      try {
        const compact = consultations.map((c) => ({
          ...c,
          imagePreviewUrl: c.imagePreviewUrl?.startsWith("/src/")
            ? c.imagePreviewUrl
            : undefined,
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
        notifyStorageChanged(false);
      } catch {
        notifyStorageChanged(true);
      }
    }
  }, [consultations]);

  const handleFreeCachedPhotos = () => {
    setConsultations((prev) =>
      prev.map((c) => ({
        ...c,
        imagePreviewUrl: c.imagePreviewUrl?.startsWith("data:")
          ? undefined
          : c.imagePreviewUrl,
      }))
    );
  };

  const pendingSyncCount = useMemo(
    () =>
      consultations.filter(
        (c) => c.syncStatus === "pending_sync" || c.syncStatus === "sync_error"
      ).length,
    [consultations]
  );

  const handleSyncPendingConsultations = useCallback(
    async (manualForce = false) => {
      if (syncingRef.current) return;

      const pendingCases = consultationsRef.current.filter(
        (c) =>
          (c.syncStatus === "pending_sync" || c.syncStatus === "sync_error") &&
          c.pendingPayload
      );
      if (pendingCases.length === 0) return;

      if (!navigator.onLine && !manualForce) {
        return;
      }

      syncingRef.current = true;
      setIsSyncing(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/consultations/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cases: pendingCases.map((c) => ({
              id: c.id,
              message: c.pendingPayload?.message ?? "",
              imageBase64: c.pendingPayload?.imageBase64,
              imageMimeType: c.pendingPayload?.imageMimeType,
              cropType: c.pendingPayload?.cropType ?? "auto",
              preferredLanguage: c.pendingPayload?.preferredLanguage ?? "english",
            })),
          }),
        });

        const payload = (await res.json()) as {
          synced?: Array<{
            id: string;
            diagnosis: DiagnosisResult;
            syncedAt: string;
          }>;
          failed?: Array<{ id: string; error: string }>;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error || "Sync request failed.");
        }

        const syncedMap = new Map(
          (payload.synced ?? []).map((s) => [s.id, s])
        );
        const failedMap = new Map(
          (payload.failed ?? []).map((f) => [f.id, f.error])
        );

        setConsultations((prev) =>
          prev.map((c) => {
            const syncedItem = syncedMap.get(c.id);
            if (syncedItem) {
              return {
                ...c,
                cropLabel: syncedItem.diagnosis.cropIdentified || c.cropLabel,
                diagnosis: syncedItem.diagnosis,
                syncStatus: "synced",
                syncedAt: syncedItem.syncedAt,
                pendingPayload: undefined,
                syncError: undefined,
              };
            }
            const errMsg = failedMap.get(c.id);
            if (errMsg) {
              return {
                ...c,
                syncStatus: "sync_error",
                syncError: errMsg,
              };
            }
            return c;
          })
        );

        if ((payload.failed?.length ?? 0) > 0) {
          setErrorMsg(
            `${payload.failed?.length} pending consultation(s) could not sync yet: ${payload.failed?.[0]?.error}`
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Still unable to reach server to sync consultations.";
        setConsultations((prev) =>
          prev.map((c) =>
            c.syncStatus === "pending_sync" || c.syncStatus === "sync_error"
              ? { ...c, syncStatus: "sync_error", syncError: msg }
              : c
          )
        );
        if (manualForce) {
          setErrorMsg(
            "Unable to sync with backend right now. Your offline consultations remain safely queued."
          );
        }
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    []
  );

  useEffect(() => {
    const onBackOnline = () => {
      void handleSyncPendingConsultations(false);
    };
    window.addEventListener("online", onBackOnline);
    return () => window.removeEventListener("online", onBackOnline);
  }, [handleSyncPendingConsultations]);

  const activeConsultation = useMemo(
    () => consultations.find((c) => c.id === activeCaseId) ?? null,
    [consultations, activeCaseId]
  );

  const filteredConsultations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return consultations;
    return consultations.filter(
      (c) =>
        c.diagnosis.diseaseNameEnglish.toLowerCase().includes(q) ||
        c.diagnosis.diseaseNameLocal.toLowerCase().includes(q) ||
        c.diagnosis.cropIdentified.toLowerCase().includes(q) ||
        c.farmerPrompt.toLowerCase().includes(q)
    );
  }, [consultations, searchQuery]);

  const handleStartNewCheck = () => {
    setWorkspaceMode("clinic");
    setActiveCaseId(null);
    setErrorMsg(null);
    setMobileDrawerOpen(false);
  };

  const handleSwitchMode = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    setErrorMsg(null);
    setMobileDrawerOpen(false);
  };

  const handleAskMedicineInWhatsapp = (entry: DiseaseMedicineEntry) => {
    setWhatsappPrefillPrompt(
      `Tell me safe organic & chemical treatment and exact spray schedule for ${entry.diseaseEnglish} (${entry.diseaseLocal}) in ${entry.crop}.`
    );
    setWorkspaceMode("whatsapp");
    setErrorMsg(null);
    setMobileDrawerOpen(false);
  };

  const handlePhotoFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const encoded = await fileToBase64Resized(file);
      setSelectedPhoto({
        base64: encoded.base64,
        mimeType: encoded.mimeType,
        previewUrl: encoded.dataUrl,
        label: file.name,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not process selected photo."
      );
    }
  };

  const handleLoadSample = async (sample: SampleCropCase) => {
    setErrorMsg(null);
    setWorkspaceMode("clinic");
    setActiveCaseId(null);
    setMobileDrawerOpen(false);
    try {
      const encoded = await urlToBase64(sample.imageUrl);
      setSelectedPhoto({
        base64: encoded.base64,
        mimeType: encoded.mimeType,
        previewUrl: sample.imageUrl,
        label: sample.title[uiLang],
      });
      setCropType(sample.cropType);
      setSymptomText(sample.sampleNote[uiLang]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not load sample image."
      );
    }
  };

  const queueOfflineConsultation = (payload: PendingDiagnosisPayload) => {
    const cropTitle = payload.cropType === "auto" ? "Crop Sample" : payload.cropType;
    const offlineCase: ConsultationCase = {
      id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      cropLabel: cropTitle,
      imagePreviewUrl: selectedPhoto?.previewUrl,
      farmerPrompt:
        payload.message || `${cropTitle} photo saved offline for diagnosis.`,
      syncStatus: "pending_sync",
      pendingPayload: payload,
      diagnosis: {
        detectedLanguage: payload.preferredLanguage,
        cropIdentified: cropTitle,
        diseaseNameEnglish: "Saved Offline · Pending Sync",
        diseaseNameLocal: "Pending backend connection",
        severity: "Moderate",
        severityLocal: "Pending Diagnosis",
        diagnosis:
          "This consultation was saved locally while offline. Connect to the internet or click 'Sync now' in the top status bar to run full AI diagnosis and medicine recommendations.",
        cause: "Awaiting server analysis once connectivity returns.",
        organicRemedy:
          "Until synced, remove heavily infected leaves manually, avoid overhead watering, and inspect the Medicines guide (works offline).",
        chemicalTreatment:
          "Exact chemical recommendations will populate automatically after syncing with the server.",
        medicines: [],
        safetyPrecautions:
          "Verify exact dosage and crop stage before applying any spray.",
        prevention:
          "Keep affected foliage isolated and monitor nearby plants daily.",
        whatsappFormattedText: "",
        spokenSummary:
          "This consultation has been saved offline and is waiting to sync.",
      },
      followUps: [],
    };

    setConsultations((prev) => [offlineCase, ...prev]);
    setActiveCaseId(offlineCase.id);
    setSelectedPhoto(null);
    setSymptomText("");
    setCropType("auto");
  };

  const handleDiagnoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPhoto && !symptomText.trim()) {
      setErrorMsg(copy.photoRequiredError);
      return;
    }

    const payload: PendingDiagnosisPayload = {
      message: symptomText.trim(),
      imageBase64: selectedPhoto?.base64,
      imageMimeType: selectedPhoto?.mimeType,
      cropType,
      preferredLanguage: uiLang,
    };

    if (!navigator.onLine) {
      queueOfflineConsultation(payload);
      return;
    }

    setIsDiagnosing(true);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as DiagnosisResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Diagnosis request failed.");
      }

      const newCase: ConsultationCase = {
        id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        cropLabel: data.cropIdentified || cropType,
        imagePreviewUrl: selectedPhoto?.previewUrl,
        farmerPrompt:
          payload.message ||
          `${data.cropIdentified} photo submitted for field diagnosis.`,
        syncStatus: "synced",
        syncedAt: new Date().toISOString(),
        diagnosis: data,
        followUps: [],
      };

      setConsultations((prev) => [newCase, ...prev]);
      setActiveCaseId(newCase.id);
      setSelectedPhoto(null);
      setSymptomText("");
      setCropType("auto");
    } catch (err) {
      if (!navigator.onLine || err instanceof TypeError) {
        queueOfflineConsultation(payload);
      } else {
        setErrorMsg(
          err instanceof Error ? err.message : "Unable to complete crop diagnosis."
        );
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSendFollowUp = async (message: string) => {
    if (!activeConsultation) return;
    setErrorMsg(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: "user",
      text: message,
      timestamp: new Date().toISOString(),
    };

    const targetId = activeConsultation.id;
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === targetId ? { ...c, followUps: [...c.followUps, userMsg] } : c
      )
    );

    setIsSendingFollowUp(true);
    try {
      const historyPayload = activeConsultation.followUps.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisContext: activeConsultation.diagnosis,
          history: historyPayload,
          message,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        spokenReply?: string;
        error?: string;
      };

      if (!res.ok || !data.reply) {
        throw new Error(data.error || "Could not get follow-up reply.");
      }

      const modelMsg: ChatMessage = {
        id: `msg_${Date.now()}_m`,
        role: "model",
        text: data.reply,
        spokenText: data.spokenReply,
        timestamp: new Date().toISOString(),
      };

      setConsultations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, followUps: [...c.followUps, modelMsg] }
            : c
        )
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Follow-up request failed."
      );
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  const handleDeleteConsultation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConsultations((prev) => prev.filter((c) => c.id !== id));
    if (activeCaseId === id) {
      setActiveCaseId(null);
    }
  };

  const handleAddSprayLog = (caseId: string, entry: SprayLogEntry) => {
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, sprayLogs: [entry, ...(c.sprayLogs ?? [])] }
          : c
      )
    );
  };

  const handleContinueInWhatsapp = (consultation: ConsultationCase) => {
    setWhatsappPrefillPrompt(
      `Regarding ${consultation.diagnosis.diseaseNameEnglish} (${consultation.diagnosis.diseaseNameLocal}) in ${consultation.diagnosis.cropIdentified}: can you help me with exact spray timing and any precautions?`
    );
    setWorkspaceMode("whatsapp");
    setErrorMsg(null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#143322] text-[#EDF3EE]">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E4A32] text-[#A7F3D0] shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold tracking-tight text-white truncate">
                {copy.brandName}
              </div>
              <div className="text-xs text-[#A8BFB0] truncate">
                {copy.brandSub}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden rounded-md p-1.5 text-[#A8BFB0] hover:bg-white/10 hover:text-white"
            aria-label={copy.closePreview}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleStartNewCheck}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16A34A] transition-colors whitespace-nowrap min-h-[42px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <Plus className="w-4 h-4" />
          <span>{copy.newCheck}</span>
        </button>

        {/* Workspace Navigation inside Sidebar */}
        <nav className="mt-4 space-y-1" aria-label="Workspace Sections">
          <button
            type="button"
            onClick={() => handleSwitchMode("clinic")}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              workspaceMode === "clinic"
                ? "bg-[#1E4A32] text-white"
                : "text-[#BFD2C4] hover:bg-white/10 hover:text-white"
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span className="truncate">{copy.navClinic}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("whatsapp")}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              workspaceMode === "whatsapp"
                ? "bg-[#1E4A32] text-white"
                : "text-[#BFD2C4] hover:bg-white/10 hover:text-white"
            }`}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{copy.navWhatsapp}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("medicines")}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              workspaceMode === "medicines"
                ? "bg-[#1E4A32] text-white"
                : "text-[#BFD2C4] hover:bg-white/10 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">{copy.navMedicines}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("planner")}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              workspaceMode === "planner"
                ? "bg-[#1E4A32] text-white"
                : "text-[#BFD2C4] hover:bg-white/10 hover:text-white"
            }`}
          >
            <CloudSun className="w-4 h-4 shrink-0" />
            <span className="truncate">{copy.navPlanner}</span>
          </button>
        </nav>
      </div>

      {/* Saved Consultations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-[#A8BFB0] px-1">
            {copy.historyTitle}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#8DA897] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.searchHistoryPlaceholder}
              className="w-full rounded-lg border border-white/15 bg-[#0E2418] pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#8DA897] focus:border-[#4ADE80] focus:outline-none"
            />
          </div>

          {filteredConsultations.length === 0 ? (
            <p className="px-1 py-3 text-xs leading-relaxed text-[#9BB2A3]">
              {copy.noHistory}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {filteredConsultations.map((c) => {
                const isActive =
                  workspaceMode === "clinic" && c.id === activeCaseId;
                return (
                  <li key={c.id}>
                    <div
                      onClick={() => {
                        setWorkspaceMode("clinic");
                        setActiveCaseId(c.id);
                        setErrorMsg(null);
                        setMobileDrawerOpen(false);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setWorkspaceMode("clinic");
                          setActiveCaseId(c.id);
                          setMobileDrawerOpen(false);
                        }
                      }}
                      className={`group flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#1E4A32] text-white"
                          : "hover:bg-white/8 text-[#DCE7DF]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {c.diagnosis.diseaseNameEnglish}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9BB2A3] tabular-nums truncate">
                          <span>{c.diagnosis.cropIdentified}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {(c.syncStatus === "pending_sync" ||
                            c.syncStatus === "sync_error") && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#FCD34D] font-semibold">
                                Pending sync
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConsultation(c.id, e)}
                        aria-label={copy.deleteCaseLabel}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-[#9BB2A3] hover:bg-white/10 hover:text-white transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Sample Field Cases */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="text-xs font-semibold text-[#A8BFB0] px-1">
            {copy.samplesSidebarTitle}
          </div>
          <div className="space-y-2">
            {SAMPLE_CROP_CASES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="w-full flex items-center gap-3 rounded-lg border border-white/10 bg-[#0E2418]/70 p-2 text-left hover:bg-[#1E4A32] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <CropImageSlot
                  src={sample.imageUrl}
                  alt={sample.title[uiLang]}
                  className="w-11 h-11 rounded-md object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {sample.title[uiLang]}
                  </div>
                  <div className="text-[11px] text-[#9BB2A3] truncate">
                    {sample.subtitle[uiLang]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F8F6] text-[#141B16]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[276px] shrink-0 border-r border-[#E2E6E0] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Single row, 3 zones separated by gap-8 */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E2E6E0] px-4 md:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Single-line Brand / Workspace Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden inline-flex items-center justify-center rounded-lg border border-[#E2E6E0] p-2 text-[#143322] hover:bg-[#F7F8F6]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleStartNewCheck}
              className="font-display text-base font-bold tracking-tight text-[#141B16] whitespace-nowrap shrink-0 hover:text-[#15803D] transition-colors"
            >
              {copy.brandName}
            </button>
          </div>

          {/* Zone 2: Clean single-line text nav links */}
          <nav className="flex items-center gap-5 md:gap-7 text-sm font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSwitchMode("clinic")}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                workspaceMode === "clinic"
                  ? "border-[#15803D] text-[#141B16] font-semibold"
                  : "border-transparent text-[#4E5D52] hover:text-[#141B16]"
              }`}
            >
              {copy.navClinic}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("whatsapp")}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                workspaceMode === "whatsapp"
                  ? "border-[#15803D] text-[#141B16] font-semibold"
                  : "border-transparent text-[#4E5D52] hover:text-[#141B16]"
              }`}
            >
              {copy.navWhatsapp}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("medicines")}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                workspaceMode === "medicines"
                  ? "border-[#15803D] text-[#141B16] font-semibold"
                  : "border-transparent text-[#4E5D52] hover:text-[#141B16]"
              }`}
            >
              {copy.navMedicines}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("planner")}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                workspaceMode === "planner"
                  ? "border-[#15803D] text-[#141B16] font-semibold"
                  : "border-transparent text-[#4E5D52] hover:text-[#141B16]"
              }`}
            >
              {copy.navPlanner}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="hidden sm:flex items-center shrink-0">
            <button
              type="button"
              onClick={handleStartNewCheck}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143322] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E4A32] transition-colors whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{copy.newCheck}</span>
            </button>
          </div>
        </header>

        {/* Top Status Bar: Context, Offline/Storage Indicator & Language */}
        <div className="border-b border-[#E2E6E0] bg-[#FAFBF9] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-medium text-[#5B6B5F] truncate">
            {workspaceMode === "clinic" && activeConsultation
              ? `${copy.breadcrumbClinic} · ${activeConsultation.diagnosis.cropIdentified}`
              : workspaceMode === "whatsapp"
              ? copy.whatsappTitle
              : workspaceMode === "medicines"
              ? copy.medicinesTitle
              : workspaceMode === "planner"
              ? copy.navPlanner
              : copy.breadcrumbClinic}
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <SystemStatusIndicator
              uiLang={uiLang}
              storageRefreshKey={consultations.length}
              pendingSyncCount={pendingSyncCount}
              isSyncing={isSyncing}
              onFreeStorage={handleFreeCachedPhotos}
              onForceSync={() => void handleSyncPendingConsultations(true)}
            />

            <div className="flex items-center gap-2 shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
              <label
                htmlFor="ui-language-select"
                className="text-xs font-medium text-[#4E5D52] whitespace-nowrap"
              >
                {copy.languageLabel}
              </label>
              <select
                id="ui-language-select"
                value={uiLang}
                onChange={(e) => setUiLang(e.target.value as UiLanguage)}
                className="rounded-lg border border-[#D4DDD1] bg-white px-2.5 py-1 text-xs font-semibold text-[#143322] focus:border-[#15803D] focus:outline-none min-h-[32px]"
              >
                {LANGUAGE_OPTIONS.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.nativeLabel} ({lang.englishLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        <main className="flex-1 w-full max-w-[1060px] mx-auto px-4 md:px-8 py-6">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="rounded p-1 hover:bg-[#FEE2E2]"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {workspaceMode === "whatsapp" ? (
            <WhatsAppChatbot
              uiLang={uiLang}
              copy={copy}
              initialPrompt={whatsappPrefillPrompt}
              onConsumeInitialPrompt={() => setWhatsappPrefillPrompt(null)}
              onError={(msg) => setErrorMsg(msg)}
            />
          ) : workspaceMode === "medicines" ? (
            <MedicinesDirectory
              copy={copy}
              onAskInWhatsapp={handleAskMedicineInWhatsapp}
            />
          ) : workspaceMode === "planner" ? (
            <SprayPlannerView
              uiLang={uiLang}
              copy={copy}
              onError={(msg) => setErrorMsg(msg)}
            />
          ) : isDiagnosing ? (
            <div className="rounded-xl border border-[#E2E6E0] bg-white p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[#15803D] shrink-0" />
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#141B16]">
                    {copy.loadingSkeletonTitle}
                  </h2>
                  <p className="text-sm text-[#5B6B5F]">
                    {copy.loadingSkeletonSub}
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-2 animate-pulse">
                <div className="h-7 w-2/3 rounded bg-[#EEF2EC]" />
                <div className="h-4 w-1/3 rounded bg-[#EEF2EC]" />
                <div className="pt-4 border-t border-[#E2E6E0] space-y-2.5">
                  <div className="h-4 w-full rounded bg-[#EEF2EC]" />
                  <div className="h-4 w-5/6 rounded bg-[#EEF2EC]" />
                </div>
                <div className="pt-4 border-t border-[#E2E6E0] space-y-2.5">
                  <div className="h-4 w-full rounded bg-[#EEF2EC]" />
                  <div className="h-4 w-4/5 rounded bg-[#EEF2EC]" />
                </div>
              </div>
            </div>
          ) : activeConsultation ? (
            <DiagnosisReport
              consultation={activeConsultation}
              copy={copy}
              isSendingFollowUp={isSendingFollowUp}
              isSyncing={isSyncing}
              onSendFollowUp={handleSendFollowUp}
              onAddSprayLog={handleAddSprayLog}
              onContinueInWhatsapp={handleContinueInWhatsapp}
              onForceSync={() => void handleSyncPendingConsultations(true)}
              onError={(msg) => setErrorMsg(msg)}
            />
          ) : (
            <div className="space-y-6">
              {/* Atmospheric Punjab Field Banner */}
              <section className="relative rounded-xl overflow-hidden border border-[#E2E6E0] bg-[#143322]">
                <CropImageSlot
                  src={FIELD_BANNER_IMAGE}
                  alt="Punjab wheat and mustard fields at sunrise"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1E14]/90 via-[#0D1E14]/55 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <p className="text-xs font-medium text-[#BBF7D0] mb-1.5">
                    {copy.heroMeta}
                  </p>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-2xl text-balance">
                    {copy.heroTitle}
                  </h1>
                  <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-[#E2ECE4] max-w-2xl">
                    {copy.heroBody}
                  </p>
                </div>
              </section>

              {/* Crop Diagnostic Composer */}
              <form
                onSubmit={handleDiagnoseSubmit}
                className="rounded-xl border border-[#E2E6E0] bg-white p-6 md:p-8 space-y-7"
              >
                {/* Step 1: Photo Upload & Sample Picker */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-base font-semibold text-[#141B16]">
                      {copy.photoStepTitle}
                    </h2>
                    {selectedPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(null)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#DC2626] hover:underline"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{copy.removePhotoBtn}</span>
                      </button>
                    )}
                  </div>

                  {selectedPhoto ? (
                    <div className="flex flex-col sm:flex-row items-start gap-4 rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] p-4">
                      <CropImageSlot
                        src={selectedPhoto.previewUrl}
                        alt={selectedPhoto.label}
                        className="w-full sm:w-48 h-36 rounded-lg object-cover border border-[#E2E6E0] shrink-0"
                      />
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#141B16] truncate">
                          {selectedPhoto.label}
                        </div>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-xs font-medium text-[#143322] hover:bg-[#F1F5EE]"
                          >
                            <ImagePlus className="w-3.5 h-3.5 text-[#15803D]" />
                            <span>{copy.uploadPhotoBtn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-xs font-medium text-[#143322] hover:bg-[#F1F5EE]"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#15803D]" />
                            <span>{copy.takePhotoBtn}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith("image/")) {
                          void handlePhotoFile(file);
                        }
                      }}
                      className={`rounded-lg border border-dashed p-6 text-center transition-colors ${
                        isDragging
                          ? "border-[#15803D] bg-[#F0FDF4]"
                          : "border-[#C7D3C4] bg-[#FAFBF9]"
                      }`}
                    >
                      <p className="text-sm text-[#4E5D52] mb-4">
                        {copy.photoDropHint}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#143322] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E4A32] transition-colors min-h-[44px]"
                        >
                          <ImagePlus className="w-4 h-4" />
                          <span>{copy.uploadPhotoBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-white px-4 py-2.5 text-sm font-medium text-[#143322] hover:bg-[#F1F5EE] transition-colors min-h-[44px]"
                        >
                          <Camera className="w-4 h-4 text-[#15803D]" />
                          <span>{copy.takePhotoBtn}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePhotoFile(file);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePhotoFile(file);
                      e.target.value = "";
                    }}
                  />

                  {/* Instant Field Samples */}
                  <div className="pt-1 space-y-2.5">
                    <p className="text-xs font-medium text-[#5B6B5F]">
                      {copy.orTrySample}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SAMPLE_CROP_CASES.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleLoadSample(sample)}
                          className="group flex items-center gap-3 rounded-lg border border-[#E2E6E0] bg-white p-2.5 text-left hover:border-[#15803D] hover:bg-[#F8FBF7] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
                        >
                          <CropImageSlot
                            src={sample.imageUrl}
                            alt={sample.title[uiLang]}
                            className="w-14 h-12 rounded-md object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-[#141B16] truncate group-hover:text-[#15803D]">
                              {sample.title[uiLang]}
                            </div>
                            <div className="text-[11px] text-[#5B6B5F] truncate">
                              {sample.subtitle[uiLang]}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#E2E6E0]" />

                {/* Step 2: Voice Note or Text Description */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-base font-semibold text-[#141B16]">
                      {copy.voiceStepTitle}
                    </h2>
                    <VoiceRecorderButton
                      copy={copy}
                      onTranscribed={(transcript) =>
                        setSymptomText((prev) =>
                          prev ? `${prev} ${transcript}` : transcript
                        )
                      }
                      onError={(msg) => setErrorMsg(msg)}
                    />
                  </div>

                  <textarea
                    rows={3}
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    placeholder={copy.symptomPlaceholder}
                    className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-4 py-3 text-[15px] leading-relaxed text-[#141B16] placeholder:text-[#6B7A6E] focus:border-[#15803D] focus:bg-white focus:outline-none"
                  />

                  {/* Quick Farmer Colloquial Phrases */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#5B6B5F]">
                      {copy.quickVoicePhrasesLabel}
                    </span>
                    {copy.quickVoicePhrases.map((phrase) => (
                      <button
                        key={phrase.label}
                        type="button"
                        onClick={() => setSymptomText(phrase.text)}
                        className="rounded-md border border-[#E2E6E0] bg-[#F7F8F6] px-2.5 py-1 text-xs font-medium text-[#2E4234] hover:border-[#9EB39B] hover:bg-[#EDF1EB] transition-colors"
                      >
                        {phrase.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-2 border-t border-[#E2E6E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="crop-select"
                      className="text-xs font-semibold text-[#4E5D52] whitespace-nowrap"
                    >
                      {copy.cropLabel}
                    </label>
                    <select
                      id="crop-select"
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="rounded-lg border border-[#D4DDD1] bg-white px-3 py-2 text-sm text-[#141B16] focus:border-[#15803D] focus:outline-none min-h-[42px]"
                    >
                      {CROP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label[uiLang]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isDiagnosing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] px-6 py-3 text-sm font-semibold text-white hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 min-h-[46px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
                  >
                    <Sprout className="w-4 h-4" />
                    <span>{copy.diagnoseBtn}</span>
                  </button>
                </div>
              </form>

              <SoilHealthCard
                cropType={cropType}
                uiLang={uiLang}
                onSelectCrop={setCropType}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
