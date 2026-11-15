import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Compass,
  Droplets,
  Loader2,
  MapPin,
  ShieldAlert,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UiCopy } from "../data/locales";
import type {
  LocalizedWeatherAdvisory,
  UiLanguage,
  WeatherSprayReport,
} from "../types/agronomy";
import {
  buildOpenMeteoUrl,
  buildReverseGeocodeUrl,
  buildWeatherReportFromOpenMeteo,
  type OpenMeteoForecastPayload,
} from "../utils/weather";
import { AudioAdviceButton } from "./AudioAdviceButton";
import { SprayCalculator } from "./SprayCalculator";

interface DistrictPreset {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

const FARMING_DISTRICTS: DistrictPreset[] = [
  { name: "Ludhiana", state: "Punjab", lat: 30.901, lon: 75.8573 },
  { name: "Amritsar", state: "Punjab", lat: 31.634, lon: 74.8723 },
  { name: "Bathinda", state: "Punjab", lat: 30.211, lon: 74.9455 },
  { name: "Patiala", state: "Punjab", lat: 30.3398, lon: 76.3869 },
  { name: "Karnal", state: "Haryana", lat: 29.6857, lon: 76.9905 },
  { name: "Hisar", state: "Haryana", lat: 29.1492, lon: 75.7217 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lon: 73.7898 },
  { name: "Rajkot", state: "Gujarat", lat: 22.3039, lon: 70.8022 },
  { name: "Bardhaman", state: "West Bengal", lat: 23.2324, lon: 87.8615 },
  { name: "Thanjavur", state: "Tamil Nadu", lat: 10.787, lon: 79.1378 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
];

const advisoryCache = new Map<string, LocalizedWeatherAdvisory>();

interface SprayPlannerViewProps {
  uiLang: UiLanguage;
  copy: UiCopy;
  onError?: (msg: string) => void;
}

export function SprayPlannerView({
  uiLang,
  copy,
  onError,
}: SprayPlannerViewProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ludhiana");
  const [locationLabel, setLocationLabel] = useState<string>("Ludhiana, Punjab");
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 30.901,
    lon: 75.8573,
  });
  const [resolveGpsName, setResolveGpsName] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherSprayReport | null>(null);
  const [advisory, setAdvisory] = useState<LocalizedWeatherAdvisory | null>(null);
  const [loading, setLoading] = useState(false);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const advisoryReqRef = useRef(0);

  const loadWeather = useCallback(
    async (lat: number, lon: number, resolveName: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/weather?lat=${lat}&lon=${lon}${resolveName ? "&resolveName=true" : ""}`
        );
        if (res.ok) {
          const data = (await res.json()) as WeatherSprayReport;
          setWeather(data);
          if (resolveName && data.locationResolved) {
            setLocationLabel(data.locationResolved);
          }
          return;
        }

        // If backend container cannot reach Open-Meteo directly (502), query Open-Meteo from browser
        const [directRes, directGeo] = await Promise.all([
          fetch(buildOpenMeteoUrl(lat, lon)),
          resolveName
            ? fetch(buildReverseGeocodeUrl(lat, lon))
                .then(async (r) => {
                  if (!r.ok) return undefined;
                  const g = (await r.json()) as {
                    city?: string;
                    locality?: string;
                    principalSubdivision?: string;
                  };
                  const place = g.city || g.locality;
                  if (place && g.principalSubdivision) {
                    return `${place}, ${g.principalSubdivision}`;
                  }
                  return place || g.principalSubdivision;
                })
                .catch(() => undefined)
            : Promise.resolve(undefined),
        ]);

        if (!directRes.ok) {
          throw new Error("Unable to load live weather forecast right now.");
        }
        const raw = (await directRes.json()) as OpenMeteoForecastPayload;
        const report = buildWeatherReportFromOpenMeteo(raw, directGeo);
        setWeather(report);
        if (resolveName && report.locationResolved) {
          setLocationLabel(report.locationResolved);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load weather spray data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWeather(coords.lat, coords.lon, resolveGpsName);
  }, [coords.lat, coords.lon, resolveGpsName, loadWeather]);

  useEffect(() => {
    if (!weather) return;

    const cacheKey = `${locationLabel}:${uiLang}:${weather.daily[0]?.date ?? ""}`;
    const cached = advisoryCache.get(cacheKey);
    if (cached) {
      setAdvisory(cached);
      setAdvisoryLoading(false);
      return;
    }

    const reqId = ++advisoryReqRef.current;
    setAdvisoryLoading(true);
    setAdvisory(null);

    const controller = new AbortController();

    fetch("/api/weather/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        locationName: locationLabel,
        uiLang,
        weatherReport: {
          current: {
            temperature: weather.current.temperature,
            humidity: weather.current.humidity,
            windSpeed: weather.current.windSpeed,
            rainProbability12h: weather.current.rainProbability12h,
            soilTemperature: weather.current.soilTemperature,
            soilMoisturePct: weather.current.soilMoisturePct,
          },
          suitability: weather.suitability,
          warnings: weather.warnings.map((w) => ({
            severity: w.severity,
            title: w.title,
            detail: w.detail,
          })),
          daily: weather.daily.map((d) => ({
            date: d.date,
            tempMin: d.tempMin,
            tempMax: d.tempMax,
            rainProbability: d.rainProbability,
            windMax: d.windMax,
          })),
        },
      }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as LocalizedWeatherAdvisory;
      })
      .then((data) => {
        if (data) {
          advisoryCache.set(cacheKey, data);
        }
        if (reqId === advisoryReqRef.current && data) {
          setAdvisory(data);
        }
      })
      .catch(() => {
        // Fallback smoothly to Open-Meteo deterministic warnings & planting rules
      })
      .finally(() => {
        if (reqId === advisoryReqRef.current) {
          setAdvisoryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [weather, locationLabel, uiLang]);

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    setResolveGpsName(false);
    const found = FARMING_DISTRICTS.find((d) => d.name === districtName);
    if (found) {
      setLocationLabel(`${found.name}, ${found.state}`);
      setCoords({ lat: found.lat, lon: found.lon });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedDistrict("gps");
        setResolveGpsName(true);
        setLocationLabel(
          `My Field (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`
        );
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        setError(
          "Location permission denied. Select a district manually instead."
        );
      }
    );
  };

  const activeWarnings = useMemo(() => {
    if (advisory && advisory.warnings.length > 0) {
      return advisory.warnings;
    }
    return (weather?.warnings ?? []).map((w) => ({
      title: w.title,
      detail: w.detail,
      severity: w.severity,
    }));
  }, [advisory, weather]);

  const spokenBriefingText = useMemo(() => {
    if (advisory?.spokenSummary) return advisory.spokenSummary;
    if (!weather) return "";
    const topWarning = weather.warnings[0]?.detail ?? "";
    return `${locationLabel}: ${weather.reasons.join(" ")} ${topWarning} ${weather.planting.summary}`;
  }, [advisory, weather, locationLabel]);

  const renderSuitabilityBanner = (report: WeatherSprayReport) => {
    const styles = {
      Ideal: {
        bg: "bg-[#F0FDF4] border-[#BBF7D0]",
        text: "text-[#166534]",
        Icon: CheckCircle2,
        label: "Ideal Spray Window",
      },
      Caution: {
        bg: "bg-[#FFFBEB] border-[#FDE68A]",
        text: "text-[#92400E]",
        Icon: AlertTriangle,
        label: "Spray With Caution",
      },
      Avoid: {
        bg: "bg-[#FEF2F2] border-[#FECACA]",
        text: "text-[#991B1B]",
        Icon: ShieldAlert,
        label: "Avoid Spraying Now",
      },
    }[report.suitability];

    const Icon = styles.Icon;

    return (
      <div className={`rounded-lg border p-4 space-y-2 ${styles.bg}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-2 font-semibold text-sm ${styles.text}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{styles.label}</span>
          </div>
          <span className="text-xs font-medium text-[#3D4B41]">
            Recommended Window: {report.bestWindow}
          </span>
        </div>
        {advisory?.summary ? (
          <p className="text-sm text-[#263029] leading-relaxed">
            {advisory.summary}
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-[#263029]">
            {report.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderWarningCard = (
    item: {
      title: string;
      detail: string;
      severity: "Warning" | "Advisory" | "Favorable";
    },
    idx: number
  ) => {
    const severityStyles = {
      Warning: {
        box: "border-[#FECACA] bg-[#FEF2F2]",
        head: "text-[#991B1B]",
        Icon: ShieldAlert,
        label: "Warning",
      },
      Advisory: {
        box: "border-[#FDE68A] bg-[#FFFBEB]",
        head: "text-[#92400E]",
        Icon: AlertTriangle,
        label: "Advisory",
      },
      Favorable: {
        box: "border-[#BBF7D0] bg-[#F0FDF4]",
        head: "text-[#166534]",
        Icon: CheckCircle2,
        label: "Favorable",
      },
    };
    const style = severityStyles[item.severity] ?? severityStyles.Advisory;

    const Icon = style.Icon;

    return (
      <div
        key={`${item.title}-${idx}`}
        className={`rounded-lg border p-3.5 space-y-1.5 ${style.box}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.head}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.title}</span>
          </div>
          <span className={`text-[11px] font-semibold ${style.head}`}>
            {style.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-[#263029]">{item.detail}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Live Weather & Spray Window Advisor */}
      <section className="rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#141B16]">
              Live Weather, Warnings &amp; Planting Advisor
            </h1>
            <p className="text-sm text-[#4E5D52]">
              Real-time spray windows, localized weather hazards, soil readiness, and regional sowing guidance for{" "}
              <span className="font-semibold text-[#143322]">
                {locationLabel}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3 py-1.5">
              <MapPin className="w-4 h-4 text-[#15803D] shrink-0" />
              <select
                aria-label="Select agricultural district"
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#143322] focus:outline-none min-h-[28px]"
              >
                {selectedDistrict === "gps" && (
                  <option value="gps">{locationLabel}</option>
                )}
                {FARMING_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}, {d.state}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-white px-3.5 py-2 text-xs font-semibold text-[#143322] hover:bg-[#F1F5EE] transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Use My GPS</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        {loading && !weather ? (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-[#5B6B5F]">
            <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
            <span>
              Loading live agricultural weather for {locationLabel}...
            </span>
          </div>
        ) : weather ? (
          <div className="space-y-6">
            {renderSuitabilityBanner(weather)}

            {/* Current Field & Soil Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <Thermometer className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Air Temp</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.temperature.toFixed(1)} °C
                </div>
              </div>

              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <Sprout className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Soil Temp</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.soilTemperature.toFixed(1)} °C
                </div>
              </div>

              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <Droplets className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Soil Moisture</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.soilMoisturePct}%
                </div>
              </div>

              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <Wind className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Wind Speed</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.windSpeed.toFixed(1)} km/h
                </div>
              </div>

              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <CloudRain className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>12h Rain Risk</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.rainProbability12h}%
                </div>
              </div>

              <div className="rounded-lg border border-[#E2E6E0] bg-[#FAFBF9] p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                  <Sun className="w-3.5 h-3.5 text-[#15803D]" />
                  <span>Humidity · UV</span>
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-[#141B16] tabular-nums">
                  {weather.current.humidity}% · {weather.current.uvIndexMax.toFixed(0)}
                </div>
              </div>
            </div>

            {/* Localized Weather Warnings */}
            <div className="space-y-3 pt-2 border-t border-[#E2E6E0]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#141B16]">
                  Localized Weather Warnings · {locationLabel}
                </h2>
                {advisoryLoading && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#5B6B5F]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#15803D]" />
                    <span>Translating field advisory...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeWarnings.map((w, idx) => renderWarningCard(w, idx))}
              </div>
            </div>

            {/* Localized Planting & Crop Recommendations */}
            <div className="rounded-xl border border-[#D4DDD1] bg-[#F7FAF5] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#15803D]">
                    <Sprout className="w-4 h-4 shrink-0" />
                    <span>
                      {advisory?.plantingRecommendations.seasonLabel ||
                        weather.planting.seasonName}
                    </span>
                    <span className="text-[#94A397]">·</span>
                    <span className="text-[#3D4B41]">
                      Soil Readiness: {weather.planting.soilReadiness}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#141B16]">
                    Planting &amp; Sowing Recommendations
                  </h2>
                </div>

                {spokenBriefingText && (
                  <AudioAdviceButton
                    text={spokenBriefingText}
                    copy={copy}
                    compact
                    onError={onError}
                  />
                )}
              </div>

              <p className="text-sm leading-relaxed text-[#263029]">
                {advisory?.plantingRecommendations.sowingSuitability ||
                  weather.planting.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="rounded-lg border border-[#E2E6E0] bg-white p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-[#143322]">
                    Recommended Crops for Current Window
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#263029]">
                    {(
                      advisory?.plantingRecommendations.recommendedCrops ??
                      weather.planting.recommendedCrops
                    ).map((cropName, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />
                        <span>{cropName}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-[#E2E6E0] bg-white p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-[#143322]">
                    7-Day Field Preparation &amp; Irrigation Tips
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#263029]">
                    {(
                      advisory?.plantingRecommendations.actionableTips ??
                      weather.reasons
                    ).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Sprout className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 7-Day Spray & Field Outlook */}
            <div className="space-y-2.5 pt-2 border-t border-[#E2E6E0]">
              <h2 className="text-xs font-semibold text-[#4E5D52]">
                7-Day Field Spray &amp; Rain Outlook · {locationLabel}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {weather.daily.map((day) => {
                  const statusConfig =
                    day.status === "Ideal"
                      ? { color: "text-[#166534]", Icon: CheckCircle2 }
                      : day.status === "Caution"
                      ? { color: "text-[#92400E]", Icon: AlertTriangle }
                      : { color: "text-[#991B1B]", Icon: ShieldAlert };
                  const DayIcon = statusConfig.Icon;
                  return (
                    <div
                      key={day.date}
                      className="rounded-lg border border-[#E2E6E0] bg-white p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#141B16] tabular-nums">
                          {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                            [],
                            { weekday: "short", month: "short", day: "numeric" }
                          )}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${statusConfig.color}`}
                        >
                          <DayIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{day.status}</span>
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#3D4B41] tabular-nums">
                        {day.tempMin.toFixed(0)}°–{day.tempMax.toFixed(0)}°C ·
                        Rain {day.rainProbability}%
                      </div>
                      <div className="font-mono text-[11px] text-[#5B6B5F] tabular-nums">
                        {day.precipitationSum.toFixed(1)} mm · Max wind{" "}
                        {day.windMax.toFixed(0)} km/h
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Interactive Spray Tank & Acreage Calculator */}
      <SprayCalculator />
    </div>
  );
}
