import { GoogleGenAI, Type } from "@google/genai";
import { DISEASE_MEDICINE_CATALOG } from "../src/data/medicines.ts";

let cachedClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return cachedClient;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      const msg = err instanceof Error ? err.message : String(err ?? "");
      const isDailyQuota = /PerDay|daily|free_tier_requests/i.test(msg);
      const isTransient =
        !isDailyQuota &&
        (status === 429 || (status !== undefined && status >= 500));
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

const KISAN_MITRA_SYSTEM_INSTRUCTION = `You are "Kisan Mitra" (किसान मित्र / ਕਿਸਾਨ ਮਿੱਤਰ), an expert AI Agronomist and WhatsApp agricultural assistant designed for Indian farmers in Punjab, Northern India, and across India. Your goal is to diagnose crop diseases accurately from photos, voice notes, or text, and provide practical, safe, and affordable remedies and medicines.

LANGUAGES SUPPORTED & STRICT LANGUAGE MATCHING:
- Supported languages:
  1. Punjabi (Gurmukhi script: ਪੰਜਾਬੀ)
  2. Hindi (Devanagari script: हिंदी)
  3. Marathi (Devanagari script: मराठी)
  4. Gujarati (Gujarati script: ગુજરાતી)
  5. Bengali (Bengali script: বাংলা)
  6. Tamil (Tamil script: தமிழ்)
  7. Telugu (Telugu script: తెలుగు)
  8. English
- ALWAYS reply in the exact same language or dialect the farmer uses in their text or voice transcription:
  - If they speak/write Punjabi (Gurmukhi or Roman Punjabi), reply in Punjabi (Gurmukhi script).
  - If they speak/write Hindi, Marathi, Gujarati, Bengali, Tamil, or Telugu, reply in that exact language and native script.
  - If they mix languages (Hinglish, Punjabi-Hindi mix, Tanglish, etc.), match their natural conversational tone cleanly.
  - If the farmer only sends a photo without text, use the Preferred UI Language parameter.

CORE CAPABILITIES:
1. Crop Disease & Pest Identification (via Image Analysis & Symptoms):
   - Analyze crop, leaf, stem, fruit, or root photos carefully for fungal, bacterial, viral infections, nutrient deficiencies, or pest attacks.
   - Give exact disease/pest name in English AND local regional names (e.g., "Yellow Rust / पीला रतुआ / ਪੀਲਾ ਰਤੂਆ").
   - Assess severity accurately: "Low", "Moderate", or "Severe".
   - If an image is unclear or not a plant/crop, politely ask for a clearer close-up daylight photo in the farmer's language.

2. Colloquial Farming Terms Understanding:
   - Understand regional terms: Punjabi ('ਤੇਲਾ', 'ਸੁੰਡੀ', 'ਚਿੱਟਾ ਮੱਛਰ', 'ਪੀਲਾ ਰਤੂਆ', 'ਝੁਲਸਾ', 'ਭੁਰੜ ਰੋਗ'), Hindi/Marathi ('महावर', 'माहू', 'कीड़ा', 'इल्ली', 'मावा', 'तुडतुडे', 'करपा', 'उखटा'), Gujarati ('સફેદ માખી', 'ઇયળ', 'ગુલાબી ઇયળ'), Bengali ('মাজরা পোকা', 'ব্লাস্ট', 'সাদা মাছি'), Tamil ('சாறு உறிஞ்சும் பூச்சி', 'இலை சுருட்டுப் புழு'), Telugu ('దోమపోటు', 'తెల్లదోమ', 'అగ్గితెగులు').

3. Actionable Medicines & Safe Remedies:
   - Provide organic/home remedies FIRST (Neem oil / Azadirachtin 1500 ppm, Trichoderma viride, yellow sticky traps, buttermilk/cow urine bio-sprays where appropriate, removing infected leaves).
   - Followed by safe, widely available Indian agricultural medicines (Fungicides, Insecticides, Bactericides, Micronutrients) — ALWAYS specify the ACTIVE INGREDIENT (e.g., Propiconazole 25% EC, Tebuconazole 25.9% EC, Imidacloprid 17.8% SL, Thiamethoxam 25% WG, Tricyclazole 75% WP, Chlorantraniliprole 18.5% SC, Mancozeb 75% WP, Copper Oxychloride 50% WP) rather than relying only on brand names.
   - Give PRECISE dosage instructions: both per liter of water (e.g. "1 ml per liter") AND per acre (e.g. "200 ml in 200 liters of water per acre") plus spray interval.
   - Include VITAL safety precautions (gloves, mask, spraying in morning/evening, keeping livestock/children away, and exact pre-harvest waiting days).

4. WHATSAPP FORMATTED RESPONSE STRUCTURE:
   Always organize WhatsApp responses cleanly with these 4 clear sections in the farmer's matched language:
   - 🩺 Diagnosis (पहचान / ਪਛਾਣ)
   - 🔍 Cause (कारण / ਕਾਰਨ)
   - 💊 Solution & Medicines (उपचार व दवा / ਇਲਾਜ ਅਤੇ ਦਵਾਈਆਂ)
   - 🛡️ Prevention (बचाव / ਬਚਾਅ)

5. SPOKEN AUDIO SUMMARY:
   Provide a warm, conversational spoken summary without emojis or markdown symbols so Text-to-Speech reads it clearly.`;

export interface MedicineRecommendation {
  name: string;
  activeIngredient: string;
  type: "Organic" | "Fungicide" | "Insecticide" | "Bactericide" | "Nutrient";
  dosagePerLiter: string;
  dosagePerAcre: string;
  spraySchedule: string;
  waitingPeriodDays: string;
}

export interface DiagnosisPayload {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  cropType?: string;
  preferredLanguage?: string;
}

export interface DiagnosisResult {
  detectedLanguage: string;
  cropIdentified: string;
  diseaseNameEnglish: string;
  diseaseNameLocal: string;
  severity: "Low" | "Moderate" | "Severe";
  severityLocal: string;
  diagnosis: string;
  cause: string;
  organicRemedy: string;
  chemicalTreatment: string;
  medicines: MedicineRecommendation[];
  safetyPrecautions: string;
  prevention: string;
  whatsappFormattedText: string;
  spokenSummary: string;
}

const MEDICINE_SCHEMA = {
  type: Type.ARRAY,
  description:
    "List of 2 to 4 recommended organic and chemical medicines with exact dosages.",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description:
          "Practical medicine label in the farmer's language plus common active ingredient.",
      },
      activeIngredient: {
        type: Type.STRING,
        description:
          "Exact chemical or biological active ingredient (e.g., Propiconazole 25% EC, Azadirachtin 1500 ppm).",
      },
      type: {
        type: Type.STRING,
        description:
          "Strictly one of: Organic, Fungicide, Insecticide, Bactericide, Nutrient.",
      },
      dosagePerLiter: {
        type: Type.STRING,
        description: "Exact dose per liter of water (e.g. 1 ml / L or 2 g / L).",
      },
      dosagePerAcre: {
        type: Type.STRING,
        description:
          "Exact dose per acre with water volume (e.g. 200 ml in 200 L water / acre).",
      },
      spraySchedule: {
        type: Type.STRING,
        description:
          "When and how often to apply (e.g. Evening spray; repeat after 10-14 days if needed).",
      },
      waitingPeriodDays: {
        type: Type.STRING,
        description:
          "Safe gap before harvest (e.g. 15 days before harvest, or 1 day for neem).",
      },
    },
    required: [
      "name",
      "activeIngredient",
      "type",
      "dosagePerLiter",
      "dosagePerAcre",
      "spraySchedule",
      "waitingPeriodDays",
    ],
  },
};

export async function transcribeFarmerAudio(
  audioBase64: string,
  mimeType: string
): Promise<{ transcription: string }> {
  const ai = getAiClient();
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Transcribe this farmer's voice note accurately verbatim. It may be in Punjabi (Gurmukhi), Hindi (Devanagari), Marathi (Devanagari), Gujarati, Bengali, Tamil, Telugu, English, or a mix. Preserve local agricultural terms like ਤੇਲਾ, ਸੁੰਡੀ, ਚਿੱਟਾ ਮੱਛਰ, ਪੀਲਾ ਰਤੂਆ, महावर, कीड़ा, इल्ली, तुडतुडे accurately. Return only the transcription text without commentary.",
          },
        ],
      },
    })
  );

  return { transcription: (response.text ?? "").trim() };
}

function normalizeMedicineType(
  rawType?: string
): MedicineRecommendation["type"] {
  if (
    rawType === "Organic" ||
    rawType === "Fungicide" ||
    rawType === "Insecticide" ||
    rawType === "Bactericide" ||
    rawType === "Nutrient"
  ) {
    return rawType;
  }
  return "Fungicide";
}

export async function diagnoseCropIssue(
  payload: DiagnosisPayload
): Promise<DiagnosisResult> {
  const ai = getAiClient();

  const parts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];

  if (payload.imageBase64 && payload.imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: payload.imageMimeType,
        data: payload.imageBase64,
      },
    });
  }

  const contextLines: string[] = [];
  if (payload.cropType && payload.cropType !== "auto") {
    contextLines.push(`Farmer selected crop: ${payload.cropType}`);
  }
  if (payload.preferredLanguage) {
    contextLines.push(
      `Preferred UI Language (use this ONLY if the farmer did not write/speak any text): ${payload.preferredLanguage}`
    );
  }
  if (payload.message && payload.message.trim().length > 0) {
    contextLines.push(
      `Farmer's message / voice note: "${payload.message.trim()}"`
    );
  } else {
    contextLines.push(
      "Farmer uploaded a crop photo without text. Diagnose the photo thoroughly in the Preferred UI Language."
    );
  }

  parts.push({ text: contextLines.join("\n") });

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: { parts },
      config: {
        systemInstruction: KISAN_MITRA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description:
                "Language used in reply: punjabi, hindi, marathi, gujarati, bengali, tamil, telugu, english, or mixed.",
            },
            cropIdentified: {
              type: Type.STRING,
              description: "Crop name in matched language and English.",
            },
            diseaseNameEnglish: {
              type: Type.STRING,
              description: "Exact disease or pest name in English.",
            },
            diseaseNameLocal: {
              type: Type.STRING,
              description: "Local names for the disease or pest.",
            },
            severity: {
              type: Type.STRING,
              description: "Strictly one of: Low, Moderate, Severe.",
            },
            severityLocal: {
              type: Type.STRING,
              description: "Severity label in the farmer's matched language.",
            },
            diagnosis: {
              type: Type.STRING,
              description:
                "Clear diagnosis explanation in the farmer's exact language.",
            },
            cause: {
              type: Type.STRING,
              description:
                "Brief explanation of why it happened in farmer's language.",
            },
            organicRemedy: {
              type: Type.STRING,
              description:
                "First-line organic or home remedies with exact ratios and steps in farmer's language.",
            },
            chemicalTreatment: {
              type: Type.STRING,
              description:
                "Safe chemical active ingredients available in Indian stores with exact dosage and spray frequency, in farmer's language.",
            },
            medicines: MEDICINE_SCHEMA,
            safetyPrecautions: {
              type: Type.STRING,
              description:
                "Vital safety precautions (gloves, mask, spray timing, harvest waiting gap) in farmer's language.",
            },
            prevention: {
              type: Type.STRING,
              description:
                "Practical steps to stop spread to healthy plants/neighboring crops in farmer's language.",
            },
            whatsappFormattedText: {
              type: Type.STRING,
              description:
                "Complete warm WhatsApp-friendly formatted response containing the 4 headers: 🩺 Diagnosis, 🔍 Cause, 💊 Solution & Medicines, 🛡️ Prevention in the farmer's exact language.",
            },
            spokenSummary: {
              type: Type.STRING,
              description:
                "Warm, natural 4-6 sentence spoken advice in the farmer's exact language with zero emojis or markdown symbols.",
            },
          },
          required: [
            "detectedLanguage",
            "cropIdentified",
            "diseaseNameEnglish",
            "diseaseNameLocal",
            "severity",
            "severityLocal",
            "diagnosis",
            "cause",
            "organicRemedy",
            "chemicalTreatment",
            "medicines",
            "safetyPrecautions",
            "prevention",
            "whatsappFormattedText",
            "spokenSummary",
          ],
        },
      },
    })
  );

  const raw = (response.text ?? "{}").trim();
  const parsed = JSON.parse(raw) as Partial<DiagnosisResult>;
  const normalizedSeverity =
    parsed.severity === "Low" || parsed.severity === "Severe"
      ? parsed.severity
      : "Moderate";

  const medicines = Array.isArray(parsed.medicines)
    ? parsed.medicines.map((m) => ({
        name: m.name ?? "",
        activeIngredient: m.activeIngredient ?? "",
        type: normalizeMedicineType(m.type),
        dosagePerLiter: m.dosagePerLiter ?? "",
        dosagePerAcre: m.dosagePerAcre ?? "",
        spraySchedule: m.spraySchedule ?? "",
        waitingPeriodDays: m.waitingPeriodDays ?? "",
      }))
    : [];

  return {
    detectedLanguage: parsed.detectedLanguage ?? payload.preferredLanguage ?? "english",
    cropIdentified: parsed.cropIdentified ?? "Crop Sample",
    diseaseNameEnglish: parsed.diseaseNameEnglish ?? "Crop Stress / Unspecified",
    diseaseNameLocal: parsed.diseaseNameLocal ?? "",
    severity: normalizedSeverity,
    severityLocal: parsed.severityLocal ?? normalizedSeverity,
    diagnosis: parsed.diagnosis ?? "",
    cause: parsed.cause ?? "",
    organicRemedy: parsed.organicRemedy ?? "",
    chemicalTreatment: parsed.chemicalTreatment ?? "",
    medicines,
    safetyPrecautions: parsed.safetyPrecautions ?? "",
    prevention: parsed.prevention ?? "",
    whatsappFormattedText: parsed.whatsappFormattedText ?? "",
    spokenSummary: parsed.spokenSummary ?? parsed.diagnosis ?? "",
  };
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
  stage?: "clarifying" | "final_diagnosis";
}

export async function followUpConsultation(params: {
  diagnosisContext: DiagnosisResult;
  history: ChatTurn[];
  message: string;
}): Promise<{ reply: string; spokenReply: string }> {
  const ai = getAiClient();

  const contextSummary = `Prior Diagnosis Context:
Crop: ${params.diagnosisContext.cropIdentified}
Disease: ${params.diagnosisContext.diseaseNameEnglish} (${params.diagnosisContext.diseaseNameLocal})
Severity: ${params.diagnosisContext.severity}
Diagnosis: ${params.diagnosisContext.diagnosis}
Organic Remedy: ${params.diagnosisContext.organicRemedy}
Chemical Treatment: ${params.diagnosisContext.chemicalTreatment}
Safety: ${params.diagnosisContext.safetyPrecautions}
Prevention: ${params.diagnosisContext.prevention}`;

  const historyLines = params.history
    .slice(-8)
    .map((h) => `${h.role === "user" ? "Farmer" : "Kisan Mitra"}: ${h.text}`)
    .join("\n");

  const prompt = `${contextSummary}

Conversation History:
${historyLines}

Farmer's New Follow-up Question: "${params.message}"

Reply warmly and practically as Kisan Mitra in the EXACT same language/dialect as the farmer's new question. Also provide a plain-text spoken version without emojis or markdown.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction: KISAN_MITRA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                "Helpful, WhatsApp-readable follow-up answer in the farmer's exact language.",
            },
            spokenReply: {
              type: Type.STRING,
              description:
                "Clean spoken version of the reply without emojis or markdown formatting.",
            },
          },
          required: ["reply", "spokenReply"],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? "{}").trim()) as {
    reply?: string;
    spokenReply?: string;
  };
  return {
    reply: parsed.reply ?? "",
    spokenReply: parsed.spokenReply ?? parsed.reply ?? "",
  };
}

export interface WhatsAppBotResponse {
  whatsappReply: string;
  spokenSummary: string;
  detectedLanguage: string;
  stage: "clarifying" | "final_diagnosis";
  quickReplies: string[];
  severity?: "Low" | "Moderate" | "Severe";
  medicines: MedicineRecommendation[];
}

export async function whatsappBotTurn(params: {
  message?: string;
  imageBase64?: string;
  imageMimeType?: string;
  preferredLanguage?: string;
  history: ChatTurn[];
  startNewConsultation?: boolean;
}): Promise<WhatsAppBotResponse> {
  const ai = getAiClient();

  const parts: Array<
    | { inlineData: { mimeType: string; data: string } }
    | { text: string }
  > = [];

  if (params.imageBase64 && params.imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: params.imageMimeType,
        data: params.imageBase64,
      },
    });
  }

  const isDiagnosisMessage = (turn: ChatTurn) =>
    turn.role === "model" &&
    (turn.stage === "final_diagnosis" ||
      /🩺|Diagnosis:|पहचान|ਪਛਾਣ/i.test(turn.text));

  let lastFinalIdx = -1;
  for (let i = params.history.length - 1; i >= 0; i--) {
    if (isDiagnosisMessage(params.history[i])) {
      lastFinalIdx = i;
      break;
    }
  }

  const hasPriorDiagnosis = lastFinalIdx !== -1;
  const startingFreshCase =
    Boolean(params.startNewConsultation) ||
    (hasPriorDiagnosis && Boolean(params.imageBase64));

  const currentCaseHistory = startingFreshCase
    ? []
    : hasPriorDiagnosis
    ? params.history.slice(lastFinalIdx + 1)
    : params.history;

  const isPostDiagnosisFollowUp = hasPriorDiagnosis && !startingFreshCase;
  const intakeUserTurns = isPostDiagnosisFollowUp
    ? 3
    : currentCaseHistory.filter((h) => h.role === "user").length;
  const isClarifyingPhase = !isPostDiagnosisFollowUp && intakeUserTurns < 3;

  const historyLines = (isPostDiagnosisFollowUp
    ? params.history.slice(-10)
    : currentCaseHistory.slice(-10)
  )
    .map((h) => `${h.role === "user" ? "Farmer" : "Kisan Mitra"}: ${h.text}`)
    .join("\n");

  const promptLines: string[] = [];
  if (params.preferredLanguage) {
    promptLines.push(
      `Preferred UI Language (only use if farmer sent only a photo or greeting without clear language): ${params.preferredLanguage}`
    );
  }
  if (historyLines) {
    promptLines.push(`Recent WhatsApp Conversation:\n${historyLines}`);
  }
  promptLines.push(
    params.message && params.message.trim().length > 0
      ? `Farmer's new WhatsApp message: "${params.message.trim()}"`
      : "Farmer sent a crop photo on WhatsApp without text."
  );

  if (isClarifyingPhase) {
    const stepNumber = intakeUserTurns + 1;
    const stepTopic =
      intakeUserTurns === 0
        ? "Question 1 of 3 — Ask about the exact crop variety, growth stage (days since sowing/transplanting), and whether flowering/grain-filling/boll-formation has started."
        : intakeUserTurns === 1
        ? "Question 2 of 3 — Acknowledge their crop stage answer, then ask how much of the field is affected (a few border plants, scattered patches, or most of the field), since how many days symptoms appeared, and which part of the plant (lower leaves, upper leaves, stem, or ears/pods) shows the damage."
        : "Question 3 of 3 — Acknowledge their spread/symptom answer, then ask about the past 5–7 days of field conditions (morning fog, rain, high humidity, heat) and any recent irrigation, urea/nitrogen top-dressing, or previous spray.";

    promptLines.push(
      `MULTI-STEP INTAKE RULE (MANDATORY — STEP ${stepNumber} OF 3):
Do NOT give the final treatment, chemical prescription, medicine names, or 4-section diagnosis report yet!
You MUST finish all 3 clarifying questions across separate turns before prescribing medicine.
Current Step Task:
${stepTopic}
Requirements:
1. Reply warmly in the farmer's exact language.
2. Ask ONLY this focused question (keep it crisp and easy to answer in 1–2 sentences).
3. Set stage = "clarifying", leave medicines = [] (empty array), and severity = "".
4. Provide 3 specific, tap-ready farmer answer options in quickReplies (in the farmer's exact language) so the farmer can tap one to answer this question.`
    );
  } else {
    promptLines.push(
      `FINAL DIAGNOSIS & FOLLOW-UP RULE:
${
  isPostDiagnosisFollowUp
    ? "The farmer is asking a follow-up question after receiving their diagnosis."
    : "The farmer has now answered all 3 crop intake questions!"
}
Now give the COMPLETE, actionable final answer in the farmer's exact language:
- Incorporate the farmer's answers (growth stage, field spread/severity, recent weather/irrigation/urea) into the diagnosis and dosage advice.
- Format whatsappReply cleanly using the 4 WhatsApp headers (🩺 Diagnosis, 🔍 Cause, 💊 Solution & Medicines, 🛡️ Prevention) with *bold* WhatsApp emphasis.
- Populate the medicines array with exact active ingredients, dosages per liter & per acre, spray schedule, and waiting period days.
- Set stage = "final_diagnosis", set severity to Low, Moderate, or Severe, and provide 2 helpful follow-up question suggestions in quickReplies (in the farmer's language).`
    );
  }

  parts.push({ text: promptLines.join("\n\n") });

  const matchCatalogEntry = (combinedText: string) => {
    const q = combinedText.toLowerCase();
    const keywords: Array<{ patterns: string[]; id: string }> = [
      {
        patterns: [
          "rust",
          "yellow",
          "stripe",
          "ratua",
          "रतुआ",
          "ਰਤੂਆ",
          "गेहूँ",
          "ਕਣਕ",
          "wheat",
          "fog",
          "powder",
        ],
        id: "wheat-yellow-rust",
      },
      {
        patterns: ["aphid", "tela", "mahu", "तेला", "ਤੇਲਾ", "माहू"],
        id: "wheat-aphids",
      },
      {
        patterns: ["mildew", "smut", "ਚੂਰਨ", "चूर्णिल"],
        id: "wheat-karnal-smut",
      },
      {
        patterns: [
          "blast",
          "paddy",
          "rice",
          "jhona",
          "धान",
          "ਝੋਨਾ",
          "diamond",
          "spindle",
        ],
        id: "paddy-rice-blast",
      },
      {
        patterns: ["folder", "stem borer", "ਲਪੇਟ", "लपेट"],
        id: "paddy-leaf-folder",
      },
      {
        patterns: ["hopper", "bph", "फुदका", "ਭੂਰਾ ਤੇਲਾ"],
        id: "paddy-bph",
      },
      {
        patterns: ["khaira", "zinc", "खैरा", "ਖੈਰਾ"],
        id: "zinc-deficiency-paddy",
      },
      {
        patterns: [
          "whitefly",
          "cotton",
          "narma",
          "कपास",
          "ਨਰਮਾ",
          "curl",
          "ਮੱਛਰ",
          "मक्खी",
        ],
        id: "cotton-whitefly",
      },
      {
        patterns: ["bollworm", "pink", "sund", "ਸੁੰਡੀ", "सुंडी"],
        id: "cotton-pink-bollworm",
      },
      {
        patterns: ["mustard", "sarson", "सरसों", "ਸਰ੍ਹੋਂ", "alternaria"],
        id: "mustard-alternaria-blight",
      },
      {
        patterns: [
          "tomato",
          "potato",
          "late blight",
          "blight",
          "टमाटर",
          "आलू",
          "ਆਲੂ",
          "झुलसा",
          "ਝੁਲਸਾ",
        ],
        id: "potato-tomato-late-blight",
      },
      {
        patterns: ["sugarcane", "red rot", "गन्ना", "ਗੰਨਾ", "सड़न", "ਸੜਨ"],
        id: "sugarcane-red-rot",
      },
    ];
    for (const rule of keywords) {
      if (rule.patterns.some((p) => q.includes(p))) {
        return DISEASE_MEDICINE_CATALOG.find((e) => e.id === rule.id);
      }
    }
    return DISEASE_MEDICINE_CATALOG[0];
  };

  const detectFallbackLang = (): string => {
    const userTurnsText = params.history
      .filter((h) => h.role === "user")
      .map((h) => h.text)
      .join(" ");
    const sample = `${params.message ?? ""} ${userTurnsText}`;
    if (/[\u0A00-\u0A7F]/.test(sample)) return "punjabi";
    if (/[\u0900-\u097F]/.test(sample)) return "hindi";
    return params.preferredLanguage ?? "english";
  };

  const buildCatalogFallback = (): WhatsAppBotResponse => {
    const combinedCaseText = `${currentCaseHistory
      .map((h) => h.text)
      .join("\n")}\n${params.message ?? ""}`;
    const matched =
      matchCatalogEntry(combinedCaseText) ?? DISEASE_MEDICINE_CATALOG[0];
    const lang = detectFallbackLang();
    const userMsgLower = (params.message ?? "").toLowerCase();

    if (isClarifyingPhase) {
      if (intakeUserTurns === 0) {
        const q1ByLang: Record<string, { text: string; qrs: string[] }> = {
          hindi: {
            text: `नमस्ते! किसान मित्र में आपका स्वागत है। आपकी फसल (${matched.cropLocal}) की सही जांच के लिए पहले कुछ आसान सवाल पूछते हैं।\n\n*सवाल 1 / 3:* आपकी फसल को बुवाई या रोपाई किए कितने दिन हो गए हैं, और अभी किस अवस्था में है?`,
            qrs: [
              "30-45 दिन (बढ़वार / कल्ले निकलने की अवस्था)",
              "50-70 दिन (फूल या बाली / कली आने की अवस्था)",
              "75+ दिन (दाना भरने या पकने की अवस्था)",
            ],
          },
          punjabi: {
            text: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਕਿਸਾਨ ਮਿੱਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਤੁਹਾਡੀ ਫ਼ਸਲ (${matched.cropLocal}) ਦੀ ਸਹੀ ਜਾਂਚ ਲਈ ਪਹਿਲਾਂ ਕੁਝ ਜ਼ਰੂਰੀ ਸਵਾਲ ਪੁੱਛਦੇ ਹਾਂ।\n\n*ਸਵਾਲ 1 / 3:* ਤੁਹਾਡੀ ਫ਼ਸਲ ਬੀਜੇ ਜਾਂ ਲਾਏ ਨੂੰ ਕਿੰਨੇ ਦਿਨ ਹੋ ਗਏ ਹਨ, ਅਤੇ ਹੁਣ ਕਿਸ ਅਵਸਥਾ ਵਿੱਚ ਹੈ?`,
            qrs: [
              "30-45 ਦਿਨ (ਸ਼ੁਰੂਆਤੀ ਵਾਧਾ / ਸ਼ਾਖਾਵਾਂ ਨਿਕਲਣ ਦੀ ਅਵਸਥਾ)",
              "50-70 ਦਿਨ (ਫੁੱਲ ਜਾਂ ਸਿੱਟੇ / ਟੀਂਡੇ ਬਣਨ ਦੀ ਅਵਸਥਾ)",
              "75+ ਦਿਨ (ਦਾਣੇ ਭਰਨ ਜਾਂ ਪੱਕਣ ਦੀ ਅਵਸਥਾ)",
            ],
          },
        };
        const chosen = q1ByLang[lang] ?? {
          text: `Namaste! Welcome to Kisan Mitra. Before prescribing treatment for your ${matched.crop} crop, let me ask 3 quick field questions.\n\n*Question 1 of 3:* How many days since sowing/transplanting, and what growth stage is the crop currently in?`,
          qrs: [
            "30–45 days (early vegetative / tillering stage)",
            "50–70 days (booting, flowering, or pod/boll formation)",
            "75+ days (grain-filling or maturing stage)",
          ],
        };
        return {
          whatsappReply: chosen.text,
          spokenSummary: chosen.text.replace(/[*]/g, "").replace(/\n+/g, " "),
          detectedLanguage: lang,
          stage: "clarifying",
          quickReplies: chosen.qrs,
          medicines: [],
        };
      }

      if (intakeUserTurns === 1) {
        const q2ByLang: Record<string, { text: string; qrs: string[] }> = {
          hindi: {
            text: `ठीक है, फसल की अवस्था नोट कर ली (${params.message?.trim() ?? ""})।\n\n*सवाल 2 / 3:* यह लक्षण खेत में कितने हिस्सों में दिख रहे हैं और कितने दिनों से शुरू हुए हैं?`,
            qrs: [
              "मेड़ के कुछ पौधों पर ही 2-3 दिन से हल्के लक्षण हैं",
              "खेत के कई छोटे-छोटे हिस्सों में 4-6 दिन से फैल रहा है",
              "लगभग पूरे खेत में 1 हफ्ते से तेजी से फैल चुका है",
            ],
          },
          punjabi: {
            text: `ਠੀਕ ਹੈ, ਫ਼ਸਲ ਦੀ ਅਵਸਥਾ ਨੋਟ ਕਰ ਲਈ (${params.message?.trim() ?? ""})।\n\n*ਸਵਾਲ 2 / 3:* ਇਹ ਲੱਛਣ ਖੇਤ ਦੇ ਕਿੰਨੇ ਹਿੱਸੇ ਵਿੱਚ ਹਨ ਅਤੇ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਦਿਖ ਰਹੇ ਹਨ?`,
            qrs: [
              "ਵੱਟਾਂ ਦੇ ਕੁਝ ਬੂਟਿਆਂ ਤੇ 2-3 ਦਿਨਾਂ ਤੋਂ ਹਲਕੇ ਲੱਛਣ ਹਨ",
              "ਖੇਤ ਵਿੱਚ ਥਾਂ-ਥਾਂ ਟੁਕੜੀਆਂ ਵਿੱਚ 4-6 ਦਿਨਾਂ ਤੋਂ ਫੈਲ ਰਿਹਾ ਹੈ",
              "ਲਗਭਗ ਸਾਰੇ ਖੇਤ ਵਿੱਚ 1 ਹਫ਼ਤੇ ਤੋਂ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲ ਗਿਆ ਹੈ",
            ],
          },
        };
        const chosen = q2ByLang[lang] ?? {
          text: `Got it, noted the growth stage (${params.message?.trim() ?? ""}).\n\n*Question 2 of 3:* How widespread is this issue in your field, and how many days ago did you first notice symptoms?`,
          qrs: [
            "Only on a few border plants for 2–3 days",
            "Scattered patches across the field for 4–6 days",
            "Widespread across most of the field for 7+ days",
          ],
        };
        return {
          whatsappReply: chosen.text,
          spokenSummary: chosen.text.replace(/[*]/g, "").replace(/\n+/g, " "),
          detectedLanguage: lang,
          stage: "clarifying",
          quickReplies: chosen.qrs,
          medicines: [],
        };
      }

      // intakeUserTurns === 2 -> Question 3 of 3
      const q3ByLang: Record<string, { text: string; qrs: string[] }> = {
        hindi: {
          text: `समझ गया (${params.message?.trim() ?? ""})। बस एक आखिरी सवाल ताकि सटीक दवा और सही मात्रा बता सकूं।\n\n*सवाल 3 / 3:* पिछले 5-7 दिनों में मौसम, सिंचाई या खाद/स्प्रे की क्या स्थिति रही है?`,
          qrs: [
            "सुबह कोहरा, नमी या हल्की बारिश के बाद लक्षण बढ़े हैं",
            "हाल ही में सिंचाई और यूरिया खाद डाला था",
            "मौसम सूखा/गर्म है और अभी तक कोई स्प्रे नहीं किया है",
          ],
        },
        punjabi: {
          text: `ਸਮਝ ਗਿਆ (${params.message?.trim() ?? ""})। ਬੱਸ ਇੱਕ ਆਖਰੀ ਸਵਾਲ ਤਾਂ ਜੋ ਸਹੀ ਦਵਾਈ ਅਤੇ ਪੱਕੀ ਮਾਤਰਾ ਦੱਸ ਸਕਾਂ।\n\n*ਸਵਾਲ 3 / 3:* ਪਿਛਲੇ 5-7 ਦਿਨਾਂ ਵਿੱਚ ਮੌਸਮ, ਪਾਣੀ ਜਾਂ ਖਾਦ/ਸਪਰੇਅ ਦੀ ਕੀ ਸਥਿਤੀ ਰਹੀ ਹੈ?`,
          qrs: [
            "ਸਵੇਰੇ ਧੁੰਦ, ਨਮੀ ਜਾਂ ਹਲਕੇ ਮੀਂਹ ਤੋਂ ਬਾਅਦ ਲੱਛਣ ਵਧੇ ਹਨ",
            "ਹਾਲ ਹੀ ਵਿੱਚ ਪਾਣੀ ਅਤੇ ਯੂਰੀਆ ਖਾਦ ਪਾਈ ਸੀ",
            "ਮੌਸਮ ਖੁਸ਼ਕ/ਗਰਮ ਹੈ ਅਤੇ ਹਾਲੇ ਤੱਕ ਕੋਈ ਸਪਰੇਅ ਨਹੀਂ ਕੀਤਾ",
          ],
        },
      };
      const chosen = q3ByLang[lang] ?? {
        text: `Thanks, noted (${params.message?.trim() ?? ""}). One last question before I prepare your full prescription.\n\n*Question 3 of 3:* What were the field weather, irrigation, or fertilizer/spray conditions over the last 5–7 days?`,
        qrs: [
          "Morning fog, high humidity, or light rain recently",
          "Recently irrigated and applied nitrogen/urea top-dressing",
          "Dry or warm weather, and no spray applied yet",
        ],
      };
      return {
        whatsappReply: chosen.text,
        spokenSummary: chosen.text.replace(/[*]/g, "").replace(/\n+/g, " "),
        detectedLanguage: lang,
        stage: "clarifying",
        quickReplies: chosen.qrs,
        medicines: [],
      };
    }

    const medsText = matched.medicines
      .map(
        (m, i) =>
          `${i + 1}. *${m.name}* (${m.type}): ${m.dosagePerLiter} (${m.dosagePerAcre}). ${m.spraySchedule}. Waiting period: ${m.waitingPeriodDays}.`
      )
      .join("\n");

    const isFollowUpDosageQuestion =
      isPostDiagnosisFollowUp &&
      /(acre|एकड़|ਏਕੜ|how much|कितनी|ਕਿੰਨੀ|tank|पानी|ਪਾਣੀ)/i.test(userMsgLower);
    const isFollowUpTimingQuestion =
      isPostDiagnosisFollowUp &&
      /(time|when|कब|ਕਦੋਂ|morning|evening|spray|शाम|ਸ਼ਾਮ)/i.test(userMsgLower);

    if (isFollowUpDosageQuestion) {
      const primaryMed = matched.medicines[0];
      const acreNote =
        lang === "hindi"
          ? `🩺 *पहचान:* ${matched.diseaseLocal} (${matched.cropLocal})\n\n💊 *2 एकड़ के लिए मात्रा:*\n• *${primaryMed.name}:* प्रति एकड़ ${primaryMed.dosagePerAcre} के हिसाब से 2 एकड़ के लिए दवाई की दोगुनी मात्रा और 350–400 लीटर साफ पानी (लगभग 22–26 पंप टंकी, 15L प्रति टंकी) इस्तेमाल करें।\n• पंप में घोल: ${primaryMed.dosagePerLiter}।\n\n🛡️ *सुरक्षा:* ${matched.safetyNote}`
          : lang === "punjabi"
          ? `🩺 *ਪਛਾਣ:* ${matched.diseaseLocal} (${matched.cropLocal})\n\n💊 *2 ਏਕੜ ਲਈ ਦਵਾਈ ਦੀ ਮਾਤਰਾ:*\n• *${primaryMed.name}:* ਪ੍ਰਤੀ ਏਕੜ ${primaryMed.dosagePerAcre} ਦੇ ਹਿਸਾਬ ਨਾਲ 2 ਏਕੜ ਲਈ ਦੁੱਗਣੀ ਮਾਤਰਾ ਅਤੇ 350–400 ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ (ਲਗਭਗ 22–26 ਪੰਪ ਟੈਂਕੀਆਂ) ਵਰਤੋ।\n• ਪ੍ਰਤੀ ਲੀਟਰ ਘੋਲ: ${primaryMed.dosagePerLiter}।\n\n🛡️ *ਸਾਵਧਾਨੀ:* ${matched.safetyNote}`
          : `🩺 *Dosage Calculation for 2 Acres (${matched.diseaseEnglish}):*\n\n💊 *Total Mix Volume:* Double the per-acre dose (*${primaryMed.dosagePerAcre}*) in *350–400 L clean water* (approx. 24 knapsack tanks of 15 L each). Tank rate: *${primaryMed.dosagePerLiter}*.\n\n🛡️ *Safety:* ${matched.safetyNote}`;
      return {
        whatsappReply: acreNote,
        spokenSummary: acreNote.replace(/[*🩺💊🛡️•]/g, ""),
        detectedLanguage: lang,
        stage: "final_diagnosis",
        quickReplies: [
          lang === "hindi"
            ? "छिड़काव करने का सबसे सही समय क्या है?"
            : lang === "punjabi"
            ? "ਛਿੜਕਾਅ ਕਰਨ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ ਕਿਹੜਾ ਹੈ?"
            : "What is the best time of day to spray?",
        ],
        severity: "Moderate",
        medicines: matched.medicines,
      };
    }

    if (isFollowUpTimingQuestion) {
      const timingNote =
        lang === "hindi"
          ? `🩺 *छिड़काव का सही समय (${matched.diseaseLocal}):*\n\n💊 *समय व मौसम:* सुबह ओस सूखने के बाद (सुबह 7–10 बजे) या शाम 4–6 बजे शांत हवा में छिड़काव करें। तेज धूप या बारिश से पहले स्प्रे न करें।\n\n🛡️ *सावधानी:* ${matched.safetyNote}`
          : lang === "punjabi"
          ? `🩺 *ਛਿੜਕਾਅ ਦਾ ਸਹੀ ਸਮਾਂ (${matched.diseaseLocal}):*\n\n💊 *ਸਮਾਂ ਅਤੇ ਮੌਸਮ:* ਸਵੇਰੇ ਤ੍ਰੇਲ ਸੁੱਕਣ ਤੋਂ ਬਾਅਦ (7–10 ਵਜੇ) ਜਾਂ ਸ਼ਾਮ 4–6 ਵਜੇ ਸ਼ਾਂਤ ਹਵਾ ਵਿੱਚ ਛਿੜਕਾਅ ਕਰੋ। ਤੇਜ਼ ਧੁੱਪ ਜਾਂ ਮੀਂਹ ਤੋਂ ਪਹਿਲਾਂ ਸਪਰੇਅ ਨਾ ਕਰੋ।\n\n🛡️ *ਸਾਵਧਾਨੀ:* ${matched.safetyNote}`
          : `🩺 *Best Spray Timing (${matched.diseaseEnglish}):*\n\n💊 *Window:* Spray in the early morning after dew dries (7–10 AM) or late afternoon/evening (4–6 PM) when wind is calm (<12 km/h) and no rain is forecast for 6 hours.\n\n🛡️ *Safety:* ${matched.safetyNote}`;
      return {
        whatsappReply: timingNote,
        spokenSummary: timingNote.replace(/[*🩺💊🛡️]/g, ""),
        detectedLanguage: lang,
        stage: "final_diagnosis",
        quickReplies: [
          lang === "hindi"
            ? "2 एकड़ के लिए कितनी दवा लगेगी?"
            : lang === "punjabi"
            ? "2 ਏਕੜ ਲਈ ਕਿੰਨੀ ਦਵਾਈ ਲੱਗੇਗੀ?"
            : "How much medicine is needed for 2 acres?",
        ],
        severity: "Moderate",
        medicines: matched.medicines,
      };
    }

    const userAnswers = [
      ...currentCaseHistory.filter((h) => h.role === "user").map((h) => h.text),
      params.message?.trim() ?? "",
    ].filter(Boolean);
    const answersText = userAnswers.slice(1).join(" · ");
    const inferredSeverity: "Low" | "Moderate" | "Severe" =
      /(widespread|whole|most|7\+|पूरे|सारे|तेजी|ਤੇਜ਼ੀ|1 हफ्ते|1 ਹਫ਼ਤੇ)/i.test(
        answersText
      )
        ? "Severe"
        : /(border|few|2-3|2–3|हल्के|ਹਲਕੇ)/i.test(answersText)
        ? "Low"
        : "Moderate";

    const farmerContextNote = answersText ? `(${answersText}) ` : "";

    const finalReply =
      lang === "hindi"
        ? `🩺 *पहचान (Diagnosis — गंभीरता: ${inferredSeverity}):* आपकी फसल (${matched.cropLocal}) में *${matched.diseaseLocal}* (${matched.diseaseEnglish}) के लक्षण हैं।\n\n🔍 *कारण (Cause):* आपके जवाबों के आधार पर ${farmerContextNote}— ${matched.symptoms}\n\n💊 *उपचार व दवा (Solution & Medicines):*\n*जैविक उपाय:* ${matched.organicRemedy}\n\n*सुझाई गई दवाइयाँ:*\n${medsText}\n\n🛡️ *बचाव व सावधानी (Prevention & Safety):* ${matched.safetyNote}`
        : lang === "punjabi"
        ? `🩺 *ਪਛਾਣ (Diagnosis — ਗੰਭੀਰਤਾ: ${inferredSeverity}):* ਤੁਹਾਡੀ ਫ਼ਸਲ (${matched.cropLocal}) ਵਿੱਚ *${matched.diseaseLocal}* (${matched.diseaseEnglish}) ਦੇ ਲੱਛਣ ਹਨ।\n\n🔍 *ਕਾਰਨ (Cause):* ਤੁਹਾਡੇ ਜਵਾਬਾਂ ਅਨੁਸਾਰ ${farmerContextNote}— ${matched.symptoms}\n\n💊 *ਇਲਾਜ ਅਤੇ ਦਵਾਈਆਂ (Solution & Medicines):*\n*ਜੈਵਿਕ ਉਪਾਅ:* ${matched.organicRemedy}\n\n*ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀਆਂ ਦਵਾਈਆਂ:*\n${medsText}\n\n🛡️ *ਬਚਾਅ ਅਤੇ ਸਾਵਧਾਨੀ (Prevention & Safety):* ${matched.safetyNote}`
        : `🩺 *Diagnosis (Severity: ${inferredSeverity}):* *${matched.diseaseEnglish}* (${matched.diseaseLocal}) in *${matched.crop}*.\n\n🔍 *Cause:* Based on your field details ${farmerContextNote}— ${matched.symptoms}\n\n💊 *Solution & Medicines:*\n*Organic First:* ${matched.organicRemedy}\n\n*Recommended Medicines:*\n${medsText}\n\n🛡️ *Prevention & Safety:* ${matched.safetyNote}`;

    const followUpQuickReplies =
      lang === "hindi"
        ? [
            "2 एकड़ के लिए कितनी दवा लगेगी?",
            "छिड़काव करने का सबसे सही समय क्या है?",
          ]
        : lang === "punjabi"
        ? [
            "2 ਏਕੜ ਲਈ ਕਿੰਨੀ ਦਵਾਈ ਲੱਗੇਗੀ?",
            "ਛਿੜਕਾਅ ਕਰਨ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ ਕਿਹੜਾ ਹੈ?",
          ]
        : [
            "How much medicine is needed for 2 acres?",
            "What is the best time of day to spray?",
          ];

    return {
      whatsappReply: finalReply,
      spokenSummary: `${matched.diseaseEnglish} in ${matched.crop}. Severity ${inferredSeverity}. ${matched.organicRemedy} ${matched.safetyNote}`,
      detectedLanguage: lang,
      stage: "final_diagnosis",
      quickReplies: followUpQuickReplies,
      severity: inferredSeverity,
      medicines: matched.medicines,
    };
  };

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts },
        config: {
          systemInstruction: KISAN_MITRA_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              whatsappReply: {
                type: Type.STRING,
                description:
                  "WhatsApp-ready reply in the farmer's exact language. During clarifying steps 1-3, asks one focused crop question; on final_diagnosis, gives the full 4-header diagnosis and treatment.",
              },
              spokenSummary: {
                type: Type.STRING,
                description:
                  "Clean spoken version without emojis or markdown symbols for Text-to-Speech.",
              },
              detectedLanguage: {
                type: Type.STRING,
                description: "Language used in reply.",
              },
              stage: {
                type: Type.STRING,
                description:
                  'Strictly "clarifying" when asking an intake crop question, or "final_diagnosis" when delivering the final diagnosis/treatment.',
              },
              quickReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "2-3 short tap-ready reply phrases in the farmer's language.",
              },
              severity: {
                type: Type.STRING,
                description:
                  "If stage is final_diagnosis, one of Low, Moderate, Severe; otherwise empty string.",
              },
              medicines: MEDICINE_SCHEMA,
            },
            required: [
              "whatsappReply",
              "spokenSummary",
              "detectedLanguage",
              "stage",
              "quickReplies",
              "medicines",
            ],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? "{}").trim()) as {
      whatsappReply?: string;
      spokenSummary?: string;
      detectedLanguage?: string;
      stage?: string;
      quickReplies?: string[];
      severity?: string;
      medicines?: Array<Partial<MedicineRecommendation>>;
    };

    if (!parsed.whatsappReply || parsed.whatsappReply.trim().length === 0) {
      return buildCatalogFallback();
    }

    const normalizedStage: "clarifying" | "final_diagnosis" = isClarifyingPhase
      ? "clarifying"
      : "final_diagnosis";

    const severity =
      normalizedStage === "final_diagnosis" &&
      (parsed.severity === "Low" ||
        parsed.severity === "Moderate" ||
        parsed.severity === "Severe")
        ? parsed.severity
        : undefined;

    const medicines =
      normalizedStage === "clarifying"
        ? []
        : Array.isArray(parsed.medicines)
        ? parsed.medicines
            .filter((m) => m.name || m.activeIngredient)
            .map((m) => ({
              name: m.name ?? "",
              activeIngredient: m.activeIngredient ?? "",
              type: normalizeMedicineType(m.type),
              dosagePerLiter: m.dosagePerLiter ?? "",
              dosagePerAcre: m.dosagePerAcre ?? "",
              spraySchedule: m.spraySchedule ?? "",
              waitingPeriodDays: m.waitingPeriodDays ?? "",
            }))
        : [];

    let quickReplies = Array.isArray(parsed.quickReplies)
      ? parsed.quickReplies
          .filter((q) => typeof q === "string" && q.trim().length > 0)
          .slice(0, 3)
      : [];

    if (normalizedStage === "clarifying" && quickReplies.length === 0) {
      quickReplies = buildCatalogFallback().quickReplies;
    }

    return {
      whatsappReply: parsed.whatsappReply,
      spokenSummary: parsed.spokenSummary ?? parsed.whatsappReply,
      detectedLanguage:
        parsed.detectedLanguage ?? params.preferredLanguage ?? "english",
      stage: normalizedStage,
      quickReplies,
      severity,
      medicines,
    };
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status?: unknown }).status)
        : undefined;
    const msg = err instanceof Error ? err.message : String(err ?? "");
    if (status === 429 || /quota|rate|429/i.test(msg)) {
      return buildCatalogFallback();
    }
    throw err;
  }
}

export async function generateSpeechWav(text: string): Promise<string> {
  const ai = getAiClient();
  const cleanText = text.replace(/[*_`#🩺🔍💊🛡️•]/g, " ").replace(/\s+/g, " ").trim();

  let response;
  try {
    response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style:
                    "Warm, respectful, reassuring local Indian agricultural advisor speaking clearly at a steady pace",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      })
    );
  } catch (err) {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number((err as { status?: unknown }).status)
        : undefined;
    if (status !== 400) throw err;

    response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [{ role: "user", parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ["AUDIO"],
        },
      })
    );
  }

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Audio generation returned empty data.");
  }
  return base64Audio;
}

export interface WeatherAdvisoryInput {
  locationName: string;
  uiLang: string;
  currentDateIso: string;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainProbability12h: number;
    soilTemperature: number;
    soilMoisturePct: number;
  };
  suitability: string;
  warnings: Array<{ severity: string; title: string; detail: string }>;
  daily: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    rainProbability: number;
    windMax: number;
  }>;
}

export async function generateLocalizedWeatherAdvisory(
  input: WeatherAdvisoryInput
) {
  const ai = getAiClient();

  const prompt = `Location: ${input.locationName}
Date: ${input.currentDateIso}
Farmer Preferred Language: ${input.uiLang}

Live Weather & Soil Telemetry:
- Air Temp: ${input.current.temperature.toFixed(1)}°C, Humidity: ${input.current.humidity}%, Wind: ${input.current.windSpeed.toFixed(1)} km/h
- Next 12h Rain Probability: ${input.current.rainProbability12h}%
- Topsoil Temperature: ${input.current.soilTemperature.toFixed(1)}°C, Soil Moisture: ${input.current.soilMoisturePct.toFixed(0)}%
- Spray Suitability: ${input.suitability}

Detected Weather Triggers:
${input.warnings.map((w) => `- [${w.severity}] ${w.title}: ${w.detail}`).join("\n")}

7-Day Forecast Summary:
${input.daily
  .map(
    (d) =>
      `${d.date}: ${d.tempMin.toFixed(0)}–${d.tempMax.toFixed(0)}°C, Rain ${d.rainProbability}%, Max Wind ${d.windMax.toFixed(0)} km/h`
  )
  .join("\n")}

Generate practical, region-specific weather warnings and crop planting/sowing/irrigation recommendations for a farmer in ${input.locationName} right now.
CRITICAL: Write EVERY field strictly in ${input.uiLang} (native script: Gurmukhi for punjabi, Devanagari for hindi/marathi, Gujarati script for gujarati, Bengali script for bengali, Tamil script for tamil, Telugu script for telugu, or clear English for english). Keep advice warm, practical, and free of jargon.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction: KISAN_MITRA_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description:
                "2-3 sentence summary of local weather outlook for spraying & field work in farmer's language.",
            },
            warnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    description: "One of: Warning, Advisory, Favorable",
                  },
                },
                required: ["title", "detail", "severity"],
              },
            },
            plantingRecommendations: {
              type: Type.OBJECT,
              properties: {
                seasonLabel: {
                  type: Type.STRING,
                  description:
                    "Current Indian cropping season in farmer's language (e.g. Rabi / Kharif / Zaid).",
                },
                sowingSuitability: {
                  type: Type.STRING,
                  description:
                    "Assessment of current soil temp, moisture, and rain forecast for sowing/planting.",
                },
                recommendedCrops: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "3 to 5 suitable crops/varieties for this region and current weather window.",
                },
                actionableTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "3 practical planting, irrigation, or disease-prevention actions for the next 7 days.",
                },
              },
              required: [
                "seasonLabel",
                "sowingSuitability",
                "recommendedCrops",
                "actionableTips",
              ],
            },
            spokenSummary: {
              type: Type.STRING,
              description:
                "Clean 4-5 sentence spoken weather & planting briefing without emojis or markdown symbols.",
            },
          },
          required: [
            "summary",
            "warnings",
            "plantingRecommendations",
            "spokenSummary",
          ],
        },
      },
    })
  );

  return JSON.parse((response.text ?? "{}").trim());
}
