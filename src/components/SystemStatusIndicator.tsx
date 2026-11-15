import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  HardDrive,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { UiLanguage } from "../types/agronomy";
import {
  formatBytesCompact,
  measureLocalStorageUsage,
  STORAGE_UPDATE_EVENT,
  type LocalStorageUsage,
} from "../utils/storageHealth";

interface StatusCopy {
  onlineLabel: string;
  offlineWarning: string;
  storageNearFull: (pct: number, used: string) => string;
  storageQuotaFull: string;
  storageNormal: (used: string) => string;
  freeSpaceBtn: string;
  syncLabel: string;
  syncPendingLabel: (count: number) => string;
  syncNowBtn: string;
  syncingBtn: string;
  syncedLabel: string;
}

const STATUS_COPY: Record<UiLanguage, StatusCopy> = {
  english: {
    onlineLabel: "Online",
    offlineWarning: "Offline · Saved history & guides ready",
    storageNearFull: (pct, used) => `Storage ${pct}% full (${used})`,
    storageQuotaFull: "Storage full · Cannot save new photos",
    storageNormal: (used) => `${used} saved`,
    freeSpaceBtn: "Free space",
    syncLabel: "Sync",
    syncPendingLabel: (count) => `${count} pending`,
    syncNowBtn: "Sync now",
    syncingBtn: "Syncing...",
    syncedLabel: "Synced",
  },
  hindi: {
    onlineLabel: "ऑनलाइन",
    offlineWarning: "ऑफ़लाइन · सहेजे गए मामले और दवा गाइड उपलब्ध",
    storageNearFull: (pct, used) => `स्टोरेज ${pct}% भरा (${used})`,
    storageQuotaFull: "स्टोरेज भर गया · पुरानी फ़ोटो हटाएँ",
    storageNormal: (used) => `${used} सहेजा गया`,
    freeSpaceBtn: "जगह खाली करें",
    syncLabel: "सिंक",
    syncPendingLabel: (count) => `${count} बाकी`,
    syncNowBtn: "अभी सिंक करें",
    syncingBtn: "सिंक हो रहा है...",
    syncedLabel: "सिंक पूर्ण",
  },
  punjabi: {
    onlineLabel: "ਆਨਲਾਈਨ",
    offlineWarning: "ਆਫ਼ਲਾਈਨ · ਪੁਰਾਣੇ ਕੇਸ ਤੇ ਦਵਾਈ ਗਾਈਡ ਉਪਲਬਧ",
    storageNearFull: (pct, used) => `ਸਟੋਰੇਜ ${pct}% ਭਰਿਆ (${used})`,
    storageQuotaFull: "ਸਟੋਰੇਜ ਭਰ ਗਿਆ · ਪੁਰਾਣੀਆਂ ਫੋਟੋਆਂ ਹਟਾਓ",
    storageNormal: (used) => `${used} ਸੇਵ`,
    freeSpaceBtn: "ਥਾਂ ਖਾਲੀ ਕਰੋ",
    syncLabel: "ਸਿੰਕ",
    syncPendingLabel: (count) => `${count} ਬਾਕੀ`,
    syncNowBtn: "ਹੁਣੇ ਸਿੰਕ ਕਰੋ",
    syncingBtn: "ਸਿੰਕ ਹੋ ਰਿਹਾ ਹੈ...",
    syncedLabel: "ਸਿੰਕ ਪੂਰਾ",
  },
  marathi: {
    onlineLabel: "ऑनलाइन",
    offlineWarning: "ऑफलाइन · जतन केलेली माहिती उपलब्ध",
    storageNearFull: (pct, used) => `स्टोरेज ${pct}% भरले (${used})`,
    storageQuotaFull: "स्टोरेज पूर्ण · जुने फोटो काढा",
    storageNormal: (used) => `${used} जतन`,
    freeSpaceBtn: "जागा मोकळी करा",
    syncLabel: "सिंक",
    syncPendingLabel: (count) => `${count} प्रलंबित`,
    syncNowBtn: "आता सिंक करा",
    syncingBtn: "सिंक होत आहे...",
    syncedLabel: "सिंक पूर्ण",
  },
  gujarati: {
    onlineLabel: "ઓનલાઈન",
    offlineWarning: "ઓફલાઈન · સાચવેલા કેસ અને દવા માર્ગદર્શિકા ઉપલબ્ધ",
    storageNearFull: (pct, used) => `સ્ટોરેજ ${pct}% ભરાયું (${used})`,
    storageQuotaFull: "સ્ટોરેજ ભરાઈ ગયું · જૂના ફોટા દૂર કરો",
    storageNormal: (used) => `${used} સાચવેલ`,
    freeSpaceBtn: "જગ્યા ખાલી કરો",
    syncLabel: "સિંક",
    syncPendingLabel: (count) => `${count} બાકી`,
    syncNowBtn: "હવે સિંક કરો",
    syncingBtn: "સિંક થાય છે...",
    syncedLabel: "સિંક પૂર્ણ",
  },
  bengali: {
    onlineLabel: "অনলাইন",
    offlineWarning: "অফলাইন · সংরক্ষিত তথ্য ও ওষুধ নির্দেশিকা চালু",
    storageNearFull: (pct, used) => `স্টোরেজ ${pct}% পূর্ণ (${used})`,
    storageQuotaFull: "স্টোরেজ পূর্ণ · পুরোনো ছবি মুছুন",
    storageNormal: (used) => `${used} সংরক্ষিত`,
    freeSpaceBtn: "জায়গা খালি করুন",
    syncLabel: "সিঙ্ক",
    syncPendingLabel: (count) => `${count} বাকি`,
    syncNowBtn: "এখনই সিঙ্ক করুন",
    syncingBtn: "সিঙ্ক হচ্ছে...",
    syncedLabel: "সিঙ্ক সম্পূর্ণ",
  },
  tamil: {
    onlineLabel: "ஆன்லைன்",
    offlineWarning: "ஆஃப்லைன் · சேமித்த வழக்குகள் & மருந்து வழிகாட்டி தயார்",
    storageNearFull: (pct, used) => `சேமிப்பகம் ${pct}% நிரம்பியது (${used})`,
    storageQuotaFull: "சேமிப்பகம் நிரம்பியது · பழைய படங்களை நீக்கவும்",
    storageNormal: (used) => `${used} சேமிப்பு`,
    freeSpaceBtn: "இடம் காலி செய்",
    syncLabel: "ஒத்திசைவு",
    syncPendingLabel: (count) => `${count} நிலுவை`,
    syncNowBtn: "இப்போது ஒத்திசை",
    syncingBtn: "ஒத்திசைக்கிறது...",
    syncedLabel: "ஒத்திசைக்கப்பட்டது",
  },
  telugu: {
    onlineLabel: "ఆన్‌లైన్",
    offlineWarning: "ఆఫ్‌లైన్ · సేవ్ చేసిన కేసులు & మందుల గైడ్ సిద్ధం",
    storageNearFull: (pct, used) => `స్టోరేజ్ ${pct}% నిండింది (${used})`,
    storageQuotaFull: "స్టోరేజ్ నిండింది · పాత ఫోటోలు తొలగించండి",
    storageNormal: (used) => `${used} సేవ్`,
    freeSpaceBtn: "ఖాళీ చేయండి",
    syncLabel: "సింక్",
    syncPendingLabel: (count) => `${count} పెండింగ్`,
    syncNowBtn: "ఇప్పుడే సింక్ చేయండి",
    syncingBtn: "సింక్ అవుతోంది...",
    syncedLabel: "సింక్ అయింది",
  },
};

interface SystemStatusIndicatorProps {
  uiLang: UiLanguage;
  storageRefreshKey?: number;
  pendingSyncCount?: number;
  isSyncing?: boolean;
  onFreeStorage?: () => void;
  onForceSync?: () => void;
}

export function SystemStatusIndicator({
  uiLang,
  storageRefreshKey = 0,
  pendingSyncCount = 0,
  isSyncing = false,
  onFreeStorage,
  onForceSync,
}: SystemStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [usage, setUsage] = useState<LocalStorageUsage>(() =>
    measureLocalStorageUsage()
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const labels = STATUS_COPY[uiLang];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleStorageEvent = (e: Event) => {
      const custom = e as CustomEvent<{ quotaExceeded?: boolean }>;
      if (custom.detail?.quotaExceeded !== undefined) {
        setQuotaExceeded(custom.detail.quotaExceeded);
      }
      setUsage(measureLocalStorageUsage());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener(STORAGE_UPDATE_EVENT, handleStorageEvent);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener(STORAGE_UPDATE_EVENT, handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    setUsage(measureLocalStorageUsage());
  }, [storageRefreshKey]);

  const showStorageWarning =
    quotaExceeded || usage.isNearCapacity || usage.storageUnavailable;
  const usedFormatted = formatBytesCompact(usage.usedBytes);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-3 text-xs tabular-nums"
    >
      {/* Network connectivity status */}
      {!isOnline ? (
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#92400E] whitespace-nowrap shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
          <span>{labels.offlineWarning}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[#4E5D52] whitespace-nowrap shrink-0">
          <Wifi className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
          <span>{labels.onlineLabel}</span>
        </span>
      )}

      <span className="text-[#CBD5C7]" aria-hidden="true">
        ·
      </span>

      {/* Sync Indicator with Pending Badge & Manual Force Sync Button */}
      {pendingSyncCount > 0 || isSyncing ? (
        <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#143322]">
            <CloudUpload className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
            <span>{labels.syncLabel}</span>
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/40 text-[11px] font-bold text-[#92400E] tabular-nums"
              title={labels.syncPendingLabel(pendingSyncCount)}
            >
              {pendingSyncCount}
            </span>
          </span>
          {onForceSync && (
            <button
              type="button"
              onClick={onForceSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 rounded-md border border-[#15803D]/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#143322] hover:bg-[#F0FDF4] hover:border-[#15803D] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3 h-3 text-[#15803D] shrink-0 ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span>{isSyncing ? labels.syncingBtn : labels.syncNowBtn}</span>
            </button>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[#5B6B5F] whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
          <span>{labels.syncedLabel}</span>
        </span>
      )}

      <span className="text-[#CBD5C7]" aria-hidden="true">
        ·
      </span>

      {/* LocalStorage capacity warning or quiet telemetry */}
      {showStorageWarning ? (
        <span className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              quotaExceeded || usage.isCritical
                ? "text-[#991B1B]"
                : "text-[#92400E]"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 shrink-0 ${
                quotaExceeded || usage.isCritical
                  ? "text-[#DC2626]"
                  : "text-[#D97706]"
              }`}
            />
            <span>
              {quotaExceeded
                ? labels.storageQuotaFull
                : labels.storageNearFull(usage.percentUsed, usedFormatted)}
            </span>
          </span>
          {onFreeStorage && (
            <button
              type="button"
              onClick={() => {
                onFreeStorage();
                setQuotaExceeded(false);
                setUsage(measureLocalStorageUsage());
              }}
              className="text-xs font-semibold text-[#143322] underline underline-offset-2 hover:text-[#15803D] whitespace-nowrap shrink-0"
            >
              {labels.freeSpaceBtn}
            </button>
          )}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[#5B6B5F] whitespace-nowrap shrink-0">
          <HardDrive className="w-3.5 h-3.5 text-[#5B6B5F] shrink-0" />
          <span>{labels.storageNormal(usedFormatted)}</span>
        </span>
      )}
    </div>
  );
}
