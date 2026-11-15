export type UiLanguage =
  | "english"
  | "hindi"
  | "punjabi"
  | "marathi"
  | "gujarati"
  | "bengali"
  | "tamil"
  | "telugu";

export type WorkspaceMode = "clinic" | "whatsapp" | "medicines" | "planner";

export type SeverityLevel = "Low" | "Moderate" | "Severe";

export type MedicineCategory =
  | "Organic"
  | "Fungicide"
  | "Insecticide"
  | "Bactericide"
  | "Nutrient";

export interface MedicineRecommendation {
  name: string;
  activeIngredient: string;
  type: MedicineCategory;
  dosagePerLiter: string;
  dosagePerAcre: string;
  spraySchedule: string;
  waitingPeriodDays: string;
}

export interface DiagnosisResult {
  detectedLanguage: string;
  cropIdentified: string;
  diseaseNameEnglish: string;
  diseaseNameLocal: string;
  severity: SeverityLevel;
  severityLocal: string;
  diagnosis: string;
  cause: string;
  organicRemedy: string;
  chemicalTreatment: string;
  medicines?: MedicineRecommendation[];
  safetyPrecautions: string;
  prevention: string;
  whatsappFormattedText: string;
  spokenSummary: string;
}

export interface SprayLogEntry {
  id: string;
  appliedAt: string;
  medicineUsed: string;
  acresCovered: number;
  repeatIntervalDays: number;
  waitingDays: number;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  spokenText?: string;
  timestamp: string;
}

export type SyncStatus = "synced" | "pending_sync" | "sync_error";

export interface PendingDiagnosisPayload {
  message: string;
  imageBase64?: string;
  imageMimeType?: string;
  cropType: string;
  preferredLanguage: UiLanguage;
}

export interface ConsultationCase {
  id: string;
  createdAt: string;
  cropLabel: string;
  imagePreviewUrl?: string;
  farmerPrompt: string;
  diagnosis: DiagnosisResult;
  followUps: ChatMessage[];
  sprayLogs?: SprayLogEntry[];
  syncStatus?: SyncStatus;
  pendingPayload?: PendingDiagnosisPayload;
  syncError?: string;
  syncedAt?: string;
}

export interface WeatherWarning {
  id: string;
  severity: "Warning" | "Advisory" | "Favorable";
  category: "Rain" | "Wind" | "Humidity" | "Temperature" | "Soil";
  title: string;
  detail: string;
}

export interface LocalizedWeatherAdvisory {
  summary: string;
  warnings: Array<{
    title: string;
    detail: string;
    severity: "Warning" | "Advisory" | "Favorable";
  }>;
  plantingRecommendations: {
    seasonLabel: string;
    sowingSuitability: string;
    recommendedCrops: string[];
    actionableTips: string[];
  };
  spokenSummary: string;
}

export interface WeatherSprayReport {
  locationResolved?: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    rainProbability12h: number;
    soilTemperature: number;
    soilMoisturePct: number;
    uvIndexMax: number;
  };
  suitability: "Ideal" | "Caution" | "Avoid";
  reasons: string[];
  bestWindow: string;
  warnings: WeatherWarning[];
  planting: {
    seasonName: string;
    soilReadiness: "Optimal" | "Monitor" | "Wait";
    summary: string;
    recommendedCrops: string[];
  };
  daily: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    rainProbability: number;
    precipitationSum: number;
    windMax: number;
    status: "Ideal" | "Caution" | "Avoid";
  }>;
}

export interface SampleCropCase {
  id: string;
  imageUrl: string;
  cropType: string;
  title: Record<UiLanguage, string>;
  subtitle: Record<UiLanguage, string>;
  sampleNote: Record<UiLanguage, string>;
}

export interface WhatsAppChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  spokenText?: string;
  imagePreviewUrl?: string;
  voiceNoteUrl?: string;
  voiceDurationSec?: number;
  severity?: SeverityLevel;
  medicines?: MedicineRecommendation[];
  stage?: "clarifying" | "final_diagnosis";
  quickReplies?: string[];
  timestamp: string;
}

export interface DiseaseMedicineEntry {
  id: string;
  crop: string;
  cropLocal: string;
  diseaseEnglish: string;
  diseaseLocal: string;
  category: "Fungal" | "Pest" | "Bacterial" | "Viral" | "Deficiency";
  symptoms: string;
  organicRemedy: string;
  medicines: MedicineRecommendation[];
  safetyNote: string;
}
