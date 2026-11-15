import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  CloudUpload,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  Leaf,
  Loader2,
  Maximize2,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import type { UiCopy } from "../data/locales";
import type {
  ConsultationCase,
  SeverityLevel,
  SprayLogEntry,
  UiLanguage,
} from "../types/agronomy";
import {
  downloadPdfPrescription,
  downloadTextPrescription,
} from "../utils/exportPrescription";
import { AudioAdviceButton } from "./AudioAdviceButton";
import { CropImageSlot } from "./CropImageSlot";
import { MedicineDosageList } from "./MedicineDosageList";
import { VoiceRecorderButton } from "./VoiceRecorderButton";

interface DiagnosisReportProps {
  consultation: ConsultationCase;
  copy: UiCopy;
  isSendingFollowUp: boolean;
  isSyncing?: boolean;
  onSendFollowUp: (message: string) => Promise<void>;
  onAddSprayLog: (caseId: string, entry: SprayLogEntry) => void;
  onContinueInWhatsapp: (consultation: ConsultationCase) => void;
  onForceSync?: () => void;
  onError: (msg: string) => void;
}

function SeverityIndicator({
  severity,
  severityLocal,
  copy,
}: {
  severity: SeverityLevel;
  severityLocal: string;
  copy: UiCopy;
}) {
  const config: Record<
    SeverityLevel,
    { color: string; Icon: typeof CheckCircle2; fallbackLabel: string }
  > = {
    Low: {
      color: "text-[#16A34A]",
      Icon: CheckCircle2,
      fallbackLabel: copy.severityLabels.Low,
    },
    Moderate: {
      color: "text-[#D97706]",
      Icon: AlertTriangle,
      fallbackLabel: copy.severityLabels.Moderate,
    },
    Severe: {
      color: "text-[#DC2626]",
      Icon: ShieldAlert,
      fallbackLabel: copy.severityLabels.Severe,
    },
  };

  const { color, Icon, fallbackLabel } = config[severity];

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${color}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{severityLocal || fallbackLabel}</span>
    </span>
  );
}

function addDaysFormatted(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DiagnosisReport({
  consultation,
  copy,
  isSendingFollowUp,
  isSyncing = false,
  onSendFollowUp,
  onAddSprayLog,
  onContinueInWhatsapp,
  onForceSync,
  onError,
}: DiagnosisReportProps) {
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [showWhatsappView, setShowWhatsappView] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [followUpInput, setFollowUpInput] = useState("");

  // Spray Treatment Log Form State
  const defaultMedicine =
    consultation.diagnosis.medicines?.[0]?.name || "Organic / Neem Spray";
  const [showSprayForm, setShowSprayForm] = useState(false);
  const [sprayMedicine, setSprayMedicine] = useState(defaultMedicine);
  const [sprayAcres, setSprayAcres] = useState(2);
  const [repeatDays, setRepeatDays] = useState(14);
  const [waitingDays, setWaitingDays] = useState(15);

  const { diagnosis } = consultation;
  const formattedDate = new Date(consultation.createdAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const whatsappText =
    diagnosis.whatsappFormattedText ||
    `${copy.sectionDiagnosis}\n${diagnosis.diagnosis}\n\n${copy.sectionCause}\n${diagnosis.cause}\n\n${copy.sectionSolution}\n${diagnosis.organicRemedy}\n${diagnosis.chemicalTreatment}\n\n${copy.sectionPrevention}\n${diagnosis.prevention}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    whatsappText
  )}`;

  const handleCopyWhatsapp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedWhatsapp(true);
      window.setTimeout(() => setCopiedWhatsapp(false), 2200);
    } catch {
      onError("Could not copy to clipboard.");
    }
  };

  const handleExportText = () => {
    try {
      downloadTextPrescription(consultation);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Could not export text file."
      );
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await downloadPdfPrescription(consultation);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Could not export PDF file."
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = followUpInput.trim();
    if (!trimmed || isSendingFollowUp) return;
    setFollowUpInput("");
    await onSendFollowUp(trimmed);
  };

  const handleSaveSprayLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprayMedicine.trim()) return;
    onAddSprayLog(consultation.id, {
      id: `spray_${Date.now()}`,
      appliedAt: new Date().toISOString(),
      medicineUsed: sprayMedicine.trim(),
      acresCovered: Math.max(0.25, sprayAcres || 1),
      repeatIntervalDays: Math.max(1, repeatDays || 14),
      waitingDays: Math.max(0, waitingDays || 0),
    });
    setShowSprayForm(false);
  };

  const sprayLogs = consultation.sprayLogs ?? [];
  const isPendingSync =
    consultation.syncStatus === "pending_sync" ||
    consultation.syncStatus === "sync_error";

  return (
    <div className="space-y-6">
      {isPendingSync && (
        <div
          role="status"
          className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-sm text-[#92400E]">
            <CloudUpload className="w-4 h-4 mt-0.5 shrink-0 text-[#D97706]" />
            <div>
              <div className="font-semibold">
                {consultation.syncStatus === "sync_error"
                  ? "Sync failed — ready to retry"
                  : "Created offline — pending backend sync"}
              </div>
              <p className="text-xs text-[#78350F] mt-0.5">
                {consultation.syncError ||
                  "This crop check is saved locally and will receive full AI diagnosis as soon as it syncs to the server."}
              </p>
            </div>
          </div>
          {onForceSync && (
            <button
              type="button"
              onClick={onForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143322] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E4A32] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          )}
        </div>
      )}

      {/* Farmer Submission Summary */}
      <section className="rounded-xl border border-[#E2E6E0] bg-white p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {consultation.imagePreviewUrl && (
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="group relative w-full sm:w-44 h-36 rounded-lg overflow-hidden border border-[#E2E6E0] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
              aria-label="Inspect uploaded crop photo"
            >
              <CropImageSlot
                src={consultation.imagePreviewUrl}
                alt={diagnosis.cropIdentified}
                fallbackTitle={diagnosis.cropIdentified}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 right-2 inline-flex items-center justify-center rounded-md bg-black/65 p-1.5 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B5F] tabular-nums">
              <span className="font-medium text-[#143322]">
                {copy.farmerQueryLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{diagnosis.cropIdentified}</span>
              <span aria-hidden="true">·</span>
              <span>{formattedDate}</span>
            </div>
            <p className="text-[15px] leading-relaxed text-[#141B16]">
              {consultation.farmerPrompt}
            </p>
          </div>
        </div>
      </section>

      {/* Primary Structured Agronomy Diagnosis Card */}
      <article className="rounded-xl border border-[#E2E6E0] bg-white p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-[#E2E6E0]">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B5F]">
              <span>{diagnosis.cropIdentified}</span>
              <span aria-hidden="true">·</span>
              <SeverityIndicator
                severity={diagnosis.severity}
                severityLocal={diagnosis.severityLocal}
                copy={copy}
              />
            </div>

            <h1 className="font-display text-2xl md:text-[28px] font-semibold tracking-tight text-[#141B16] text-balance">
              {diagnosis.diseaseNameEnglish}
            </h1>
            {diagnosis.diseaseNameLocal && (
              <p className="text-base font-medium text-[#2E5438]">
                {diagnosis.diseaseNameLocal}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <AudioAdviceButton
              text={diagnosis.spokenSummary || diagnosis.diagnosis}
              copy={copy}
              onError={onError}
            />
            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-sm font-medium text-[#143322] hover:bg-[#F1F5EE] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              {copiedWhatsapp ? (
                <>
                  <Check className="w-4 h-4 text-[#16A34A]" />
                  <span>{copy.copiedWhatsapp}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#15803D]" />
                  <span>{copy.copyWhatsapp}</span>
                </>
              )}
            </button>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-[#0B2E19] hover:bg-[#20BD5A] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{copy.openInWhatsapp}</span>
            </a>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-sm font-medium text-[#143322] hover:bg-[#F1F5EE] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
                  <span>Exporting PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-[#15803D]" />
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportText}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-sm font-medium text-[#143322] hover:bg-[#F1F5EE] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Download className="w-4 h-4 text-[#15803D]" />
              <span>Export Text</span>
            </button>
            <button
              type="button"
              onClick={() => setShowWhatsappView((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-[#F7F8F6] px-3.5 py-2 text-sm font-medium text-[#3D4B41] hover:bg-[#EDF1EB] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <FileText className="w-4 h-4" />
              <span>
                {showWhatsappView
                  ? copy.hideWhatsappFormat
                  : copy.viewWhatsappFormat}
              </span>
            </button>
          </div>
        </div>

        {showWhatsappView ? (
          <div className="pt-6 space-y-4">
            <div className="rounded-lg bg-[#F7F8F6] border border-[#E2E6E0] p-5 whitespace-pre-wrap text-[15px] leading-relaxed text-[#141B16]">
              {whatsappText}
            </div>
            <button
              type="button"
              onClick={() => onContinueInWhatsapp(consultation)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#075E54] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064E46] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{copy.askInWhatsappBtn}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E6E0]">
            {/* 1. Diagnosis */}
            <div className="py-6">
              <h2 className="font-display text-lg font-semibold text-[#141B16] mb-2.5">
                {copy.sectionDiagnosis}
              </h2>
              <p className="text-[15px] leading-7 text-[#263029] whitespace-pre-line max-w-[72ch]">
                {diagnosis.diagnosis}
              </p>
            </div>

            {/* 2. Cause */}
            <div className="py-6">
              <h2 className="font-display text-lg font-semibold text-[#141B16] mb-2.5">
                {copy.sectionCause}
              </h2>
              <p className="text-[15px] leading-7 text-[#263029] whitespace-pre-line max-w-[72ch]">
                {diagnosis.cause}
              </p>
            </div>

            {/* 3. Solution & Medicines */}
            <div className="py-6 space-y-5">
              <h2 className="font-display text-lg font-semibold text-[#141B16]">
                {copy.sectionSolution}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
                    <Leaf className="w-4 h-4 shrink-0" />
                    <span>{copy.organicFirstTitle}</span>
                  </div>
                  <p className="text-[15px] leading-7 text-[#263029] whitespace-pre-line">
                    {diagnosis.organicRemedy}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#143322]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{copy.chemicalOptionTitle}</span>
                  </div>
                  <p className="text-[15px] leading-7 text-[#263029] whitespace-pre-line">
                    {diagnosis.chemicalTreatment}
                  </p>
                </div>
              </div>

              {diagnosis.medicines && diagnosis.medicines.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <h3 className="text-sm font-semibold text-[#143322]">
                    {copy.medicinesTableTitle}
                  </h3>
                  <MedicineDosageList medicines={diagnosis.medicines} />
                </div>
              )}

              <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] p-4 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#92400E]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
                  <span>{copy.safetyTitle}</span>
                </div>
                <p className="text-sm leading-6 text-[#78350F] whitespace-pre-line">
                  {diagnosis.safetyPrecautions}
                </p>
              </div>
            </div>

            {/* 4. Prevention */}
            <div className="pt-6">
              <h2 className="font-display text-lg font-semibold text-[#141B16] mb-2.5">
                {copy.sectionPrevention}
              </h2>
              <p className="text-[15px] leading-7 text-[#263029] whitespace-pre-line max-w-[72ch]">
                {diagnosis.prevention}
              </p>
            </div>
          </div>
        )}
      </article>

      {/* Treatment & Spray Log Tracker */}
      <section className="rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#15803D]" />
            <div>
              <h2 className="font-display text-base font-semibold text-[#141B16]">
                Field Spray &amp; Harvest Waiting Tracker
              </h2>
              <p className="text-xs text-[#5B6B5F]">
                Log when you sprayed to track your repeat spray date and safe harvest gap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onContinueInWhatsapp(consultation)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-white px-3 py-1.5 text-xs font-semibold text-[#075E54] hover:bg-[#F1F5EE]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{copy.askInWhatsappBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSprayForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#143322] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E4A32]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Spray Applied</span>
            </button>
          </div>
        </div>

        {showSprayForm && (
          <form
            onSubmit={handleSaveSprayLog}
            className="rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
          >
            <div className="sm:col-span-2 lg:col-span-1 space-y-1">
              <label className="block text-xs font-medium text-[#3D4B41]">
                Medicine Sprayed
              </label>
              <input
                type="text"
                value={sprayMedicine}
                onChange={(e) => setSprayMedicine(e.target.value)}
                required
                className="w-full rounded-lg border border-[#D4DDD1] bg-white px-3 py-2 text-xs text-[#141B16] focus:border-[#15803D] focus:outline-none min-h-[38px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#3D4B41]">
                Area (Acres)
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={sprayAcres}
                onChange={(e) => setSprayAcres(Number(e.target.value))}
                className="w-full rounded-lg border border-[#D4DDD1] bg-white px-3 py-2 font-mono text-xs text-[#141B16] tabular-nums focus:border-[#15803D] focus:outline-none min-h-[38px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#3D4B41]">
                Repeat In (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={repeatDays}
                onChange={(e) => setRepeatDays(Number(e.target.value))}
                className="w-full rounded-lg border border-[#D4DDD1] bg-white px-3 py-2 font-mono text-xs text-[#141B16] tabular-nums focus:border-[#15803D] focus:outline-none min-h-[38px]"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium text-[#3D4B41]">
                  Harvest Gap (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={waitingDays}
                  onChange={(e) => setWaitingDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D4DDD1] bg-white px-3 py-2 font-mono text-xs text-[#141B16] tabular-nums focus:border-[#15803D] focus:outline-none min-h-[38px]"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[38px] whitespace-nowrap"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {sprayLogs.length > 0 && (
          <div className="divide-y divide-[#E2E6E0] rounded-lg border border-[#E2E6E0]">
            {sprayLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#141B16]">
                    {log.medicineUsed} ·{" "}
                    <span className="font-mono tabular-nums">
                      {log.acresCovered} acre(s)
                    </span>
                  </div>
                  <div className="text-[#5B6B5F] tabular-nums">
                    Applied on{" "}
                    {new Date(log.appliedAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-[11px]">
                  <span className="text-[#15803D] font-semibold">
                    Next check: {addDaysFormatted(log.appliedAt, log.repeatIntervalDays)}
                  </span>
                  <span className="text-[#92400E] font-semibold">
                    Safe harvest: {addDaysFormatted(log.appliedAt, log.waitingDays)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Follow-Up Consultation Thread */}
      <section className="rounded-xl border border-[#E2E6E0] bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-[#141B16] mb-4">
          {copy.followUpTitle}
        </h2>

        {consultation.followUps.length > 0 && (
          <div className="space-y-4 mb-5">
            {consultation.followUps.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-[#F3F6F2] border border-[#E2E6E0] ml-0 md:ml-12"
                    : "bg-[#F8FBF7] border border-[#D3E2D0] mr-0 md:mr-12"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-xs font-semibold text-[#3D4B41]">
                    {msg.role === "user" ? copy.farmerQueryLabel : copy.brandName}
                  </span>
                  <span className="text-xs text-[#6B7A6E] font-mono tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[15px] leading-7 text-[#141B16] whitespace-pre-line">
                  {msg.text}
                </p>
                {msg.role === "model" && (
                  <div className="mt-3 pt-2.5 border-t border-[#E2E6E0]/80 flex items-center gap-2">
                    <AudioAdviceButton
                      text={msg.spokenText || msg.text}
                      copy={copy}
                      preferredLanguage={
                        diagnosis.detectedLanguage as UiLanguage
                      }
                      compact
                      onError={onError}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleFollowUpSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              placeholder={copy.followUpPlaceholder}
              disabled={isSendingFollowUp}
              className="flex-1 rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-4 py-2.5 text-sm text-[#141B16] placeholder:text-[#6B7A6E] focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[44px]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <VoiceRecorderButton
                copy={copy}
                preferredLanguage={diagnosis.detectedLanguage as UiLanguage}
                compact
                disabled={isSendingFollowUp}
                onTranscribed={(transcript) =>
                  setFollowUpInput((prev) =>
                    prev ? `${prev} ${transcript}` : transcript
                  )
                }
                onError={onError}
              />
              <button
                type="submit"
                disabled={!followUpInput.trim() || isSendingFollowUp}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingFollowUp ? copy.sendingFollowUp : copy.sendFollowUp}
                </span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Full-size Photo Modal */}
      {isImageModalOpen && consultation.imagePreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setIsImageModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-3xl w-full rounded-xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-5 right-5 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-medium text-white hover:bg-black transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{copy.closePreview}</span>
            </button>
            <CropImageSlot
              src={consultation.imagePreviewUrl}
              alt={diagnosis.cropIdentified}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
