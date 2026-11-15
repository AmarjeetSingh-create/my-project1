import type { WeatherSprayReport, WeatherWarning } from "../types/agronomy";

export interface OpenMeteoForecastPayload {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
    temperature_2m?: number[];
    soil_temperature_0cm?: number[];
    soil_moisture_0_to_1cm?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    uv_index_max?: number[];
  };
}

export function buildOpenMeteoUrl(lat: number, lon: number): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(
    4
  )}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&hourly=precipitation_probability,wind_speed_10m,temperature_2m,soil_temperature_0cm,soil_moisture_0_to_1cm&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max&forecast_days=7&timezone=auto`;
}

export function buildReverseGeocodeUrl(lat: number, lon: number): string {
  return `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(
    4
  )}&longitude=${lon.toFixed(4)}&localityLanguage=en`;
}

export function buildWeatherReportFromOpenMeteo(
  raw: OpenMeteoForecastPayload,
  locationResolved?: string
): WeatherSprayReport {
  const temp = raw.current?.temperature_2m ?? 25;
  const humidity = raw.current?.relative_humidity_2m ?? 50;
  const wind = raw.current?.wind_speed_10m ?? 6;
  const currentRain = raw.current?.precipitation ?? 0;
  const soilTemp = raw.hourly?.soil_temperature_0cm?.[0] ?? temp;
  const soilMoistureRaw = raw.hourly?.soil_moisture_0_to_1cm?.[0] ?? 0.22;
  const soilMoisturePct = Math.min(
    100,
    Math.max(0, Math.round(soilMoistureRaw * 100))
  );
  const uvIndexMax = raw.daily?.uv_index_max?.[0] ?? 5;

  const next12hRainProbs = (raw.hourly?.precipitation_probability ?? []).slice(
    0,
    12
  );
  const maxRain12h =
    next12hRainProbs.length > 0 ? Math.max(...next12hRainProbs) : 0;

  let suitability: "Ideal" | "Caution" | "Avoid" = "Ideal";
  const reasons: string[] = [];

  if (currentRain > 0.2 || maxRain12h >= 50) {
    suitability = "Avoid";
    reasons.push(
      `Rain risk (${maxRain12h}% in next 12h) can wash off foliar spray.`
    );
  } else if (wind >= 18) {
    suitability = "Avoid";
    reasons.push(
      `High wind (${wind.toFixed(1)} km/h) causes chemical drift and uneven coverage.`
    );
  } else {
    if (wind >= 12) {
      suitability = "Caution";
      reasons.push(
        `Moderate wind (${wind.toFixed(1)} km/h) — spray close to canopy with low drift.`
      );
    }
    if (temp >= 34) {
      suitability = "Caution";
      reasons.push(
        `High heat (${temp.toFixed(1)}°C) — wait until late evening after 4:30 PM to avoid leaf scorch.`
      );
    }
    if (suitability === "Ideal") {
      reasons.push(
        "Low wind and low rain chance — good conditions for morning (6–9 AM) or evening (4:30–6:30 PM) spraying."
      );
    }
  }

  const dailyForecast = (raw.daily?.time ?? []).map((date, idx) => {
    const rainProb = raw.daily?.precipitation_probability_max?.[idx] ?? 0;
    const precipSum = raw.daily?.precipitation_sum?.[idx] ?? 0;
    const maxWind = raw.daily?.wind_speed_10m_max?.[idx] ?? 0;
    const maxTemp = raw.daily?.temperature_2m_max?.[idx] ?? 0;
    const minTemp = raw.daily?.temperature_2m_min?.[idx] ?? 0;
    let dayStatus: "Ideal" | "Caution" | "Avoid" = "Ideal";
    if (rainProb >= 50 || maxWind >= 20) dayStatus = "Avoid";
    else if (rainProb >= 25 || maxWind >= 14 || maxTemp >= 36)
      dayStatus = "Caution";
    return {
      date,
      tempMin: minTemp,
      tempMax: maxTemp,
      rainProbability: rainProb,
      precipitationSum: precipSum,
      windMax: maxWind,
      status: dayStatus,
    };
  });

  const warnings: WeatherWarning[] = [];

  const maxRain3d = Math.max(
    0,
    ...dailyForecast.slice(0, 3).map((d) => d.rainProbability)
  );
  const minTemp7d = Math.min(99, ...dailyForecast.map((d) => d.tempMin));
  const maxTemp7d = Math.max(0, ...dailyForecast.map((d) => d.tempMax));

  if (maxRain12h >= 50 || maxRain3d >= 60) {
    warnings.push({
      id: "rain-risk",
      severity: "Warning",
      category: "Rain",
      title: "Rain & Wash-Off Alert",
      detail: `Up to ${Math.max(
        maxRain12h,
        maxRain3d
      )}% rain probability expected. Postpone chemical spraying and delay fertilizer top-dressing until rain passes.`,
    });
  }

  if (humidity >= 75 && temp >= 12 && temp <= 28) {
    warnings.push({
      id: "fungal-humidity",
      severity: "Advisory",
      category: "Humidity",
      title: "High Fungal Disease Risk (Rust / Blight)",
      detail: `Relative humidity is ${humidity}% with mild ${temp.toFixed(
        1
      )}°C temperatures—ideal conditions for Yellow Rust, Late Blight, and Rice Blast. Inspect lower leaves closely.`,
    });
  }

  if (wind >= 15) {
    warnings.push({
      id: "wind-drift",
      severity: "Warning",
      category: "Wind",
      title: "High Wind Drift Warning",
      detail: `Wind speed is ${wind.toFixed(
        1
      )} km/h. Spraying now risks drift onto neighboring crops and uneven leaf coverage.`,
    });
  }

  if (minTemp7d <= 5) {
    warnings.push({
      id: "frost-cold",
      severity: "Warning",
      category: "Temperature",
      title: "Cold Wave / Frost Watch",
      detail: `Nighttime temperatures may drop to ${minTemp7d.toFixed(
        1
      )}°C. Light evening irrigation helps protect tender vegetable seedlings from frost injury.`,
    });
  } else if (maxTemp7d >= 35) {
    warnings.push({
      id: "heat-stress",
      severity: "Advisory",
      category: "Temperature",
      title: "Heat Stress & Leaf Scorch Risk",
      detail: `Peak temperatures reach ${maxTemp7d.toFixed(
        1
      )}°C. Avoid midday spraying and schedule irrigation in early morning or evening.`,
    });
  }

  if (soilMoisturePct < 15) {
    warnings.push({
      id: "dry-soil",
      severity: "Advisory",
      category: "Soil",
      title: "Low Topsoil Moisture",
      detail: `Surface soil moisture is ${soilMoisturePct}%. Apply light pre-sowing irrigation (paleva) before planting.`,
    });
  }

  if (warnings.length === 0) {
    warnings.push({
      id: "favorable-window",
      severity: "Favorable",
      category: "Temperature",
      title: "Stable Field Weather",
      detail:
        "No severe rain, frost, or wind hazards detected in the immediate forecast. Normal field work and spraying can proceed.",
    });
  }

  const month = new Date().getMonth() + 1;
  let seasonName = "Rabi (Winter Sowing)";
  let recommendedCrops = [
    "Wheat (HD-3086 / PBW-826)",
    "Mustard (Sarson)",
    "Chickpea / Gram",
    "Potato & Peas",
  ];
  if (month >= 6 && month <= 9) {
    seasonName = "Kharif (Monsoon Season)";
    recommendedCrops = [
      "Paddy / Basmati",
      "Cotton",
      "Maize",
      "Bajra / Moong",
    ];
  } else if (month >= 3 && month <= 5) {
    seasonName = "Zaid (Summer Season)";
    recommendedCrops = [
      "Summer Moong",
      "Fodder Maize",
      "Cucurbits / Okra",
      "Spring Sugarcane",
    ];
  }

  let soilReadiness: "Optimal" | "Monitor" | "Wait" = "Optimal";
  let plantingSummary = `Topsoil temperature (${soilTemp.toFixed(
    1
  )}°C) and moisture (${soilMoisturePct}%) are suitable for germination.`;
  if (maxRain3d >= 70) {
    soilReadiness = "Wait";
    plantingSummary = `Heavy rain chance (${maxRain3d}%) in the next 3 days may crust soil or wash away newly sown seed. Wait for dry soil.`;
  } else if (soilMoisturePct < 14) {
    soilReadiness = "Monitor";
    plantingSummary = `Topsoil is relatively dry (${soilMoisturePct}%). Apply pre-sowing irrigation before drilling seeds.`;
  }

  return {
    locationResolved,
    current: {
      temperature: temp,
      humidity,
      windSpeed: wind,
      precipitation: currentRain,
      rainProbability12h: maxRain12h,
      soilTemperature: soilTemp,
      soilMoisturePct,
      uvIndexMax,
    },
    suitability,
    reasons,
    bestWindow:
      suitability === "Avoid"
        ? "Postpone spraying until rain & wind subside"
        : temp >= 30
        ? "Evening (4:30 PM – 6:30 PM)"
        : "Morning (6:30 AM – 9:30 AM) or Evening (4:00 PM – 6:00 PM)",
    warnings,
    planting: {
      seasonName,
      soilReadiness,
      summary: plantingSummary,
      recommendedCrops,
    },
    daily: dailyForecast,
  };
}
