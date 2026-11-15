import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  diagnoseCropIssue,
  followUpConsultation,
  generateLocalizedWeatherAdvisory,
  generateSpeechWav,
  transcribeFarmerAudio,
  whatsappBotTurn,
} from "./server/gemini.ts";
import {
  buildOpenMeteoUrl,
  buildReverseGeocodeUrl,
  buildWeatherReportFromOpenMeteo,
  type OpenMeteoForecastPayload,
} from "./src/utils/weather.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const WHATSAPP_SESSION_TTL_MS = 30 * 60 * 1000;
const whatsappWebhookSessions = new Map<
  string,
  { turns: Array<{ role: "user" | "model"; text: string }>; updatedAt: number }
>();

function extractErrorDetails(err: unknown): { status: number; message: string } {
  if (typeof err === "object" && err !== null) {
    const maybeStatus = (err as { status?: unknown }).status;
    const maybeMessage = (err as { message?: unknown }).message;
    const status =
      typeof maybeStatus === "number" && maybeStatus >= 400 && maybeStatus < 600
        ? maybeStatus
        : 500;
    const message =
      typeof maybeMessage === "string" && maybeMessage.length > 0
        ? maybeMessage
        : "An unexpected server error occurred.";
    return { status, message };
  }
  return { status: 500, message: "An unexpected server error occurred." };
}

async function fetchMetaWhatsappMedia(
  mediaId: string,
  accessToken: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return null;
    const metaJson = (await metaRes.json()) as {
      url?: string;
      mime_type?: string;
    };
    if (!metaJson.url) return null;

    const mediaRes = await fetch(metaJson.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mediaRes.ok) return null;
    const arrayBuf = await mediaRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    return {
      base64,
      mimeType: metaJson.mime_type || "image/jpeg",
    };
  } catch {
    return null;
  }
}

async function sendMetaWhatsappText(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v21.0/${params.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: params.to,
        type: "text",
        text: { body: params.body.slice(0, 4000) },
      }),
    }
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };
      if (!audioBase64 || !mimeType) {
        res.status(400).json({ error: "Audio data and mimeType are required." });
        return;
      }
      const result = await transcribeFarmerAudio(audioBase64, mimeType);
      res.json(result);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/diagnose", async (req, res) => {
    try {
      const { message, imageBase64, imageMimeType, cropType, preferredLanguage } =
        req.body as {
          message?: string;
          imageBase64?: string;
          imageMimeType?: string;
          cropType?: string;
          preferredLanguage?: string;
        };

      if (!imageBase64 && (!message || message.trim().length === 0)) {
        res.status(400).json({
          error: "Please upload a crop photo or describe the problem.",
        });
        return;
      }

      const result = await diagnoseCropIssue({
        message,
        imageBase64,
        imageMimeType,
        cropType,
        preferredLanguage,
      });
      res.json(result);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/consultations/sync", async (req, res) => {
    try {
      const { cases } = req.body as {
        cases?: Array<{
          id?: string;
          message?: string;
          imageBase64?: string;
          imageMimeType?: string;
          cropType?: string;
          preferredLanguage?: string;
        }>;
      };

      if (!Array.isArray(cases) || cases.length === 0) {
        res.status(400).json({
          error: "At least one pending consultation is required to sync.",
        });
        return;
      }

      const synced: Array<{
        id: string;
        diagnosis: Awaited<ReturnType<typeof diagnoseCropIssue>>;
        syncedAt: string;
      }> = [];
      const failed: Array<{ id: string; error: string }> = [];

      for (const item of cases) {
        const id = item.id || "";
        if (!id || (!item.imageBase64 && (!item.message || !item.message.trim()))) {
          failed.push({
            id: id || "unknown",
            error: "Missing consultation photo or symptom text.",
          });
          continue;
        }
        try {
          const diagnosis = await diagnoseCropIssue({
            message: item.message,
            imageBase64: item.imageBase64,
            imageMimeType: item.imageMimeType,
            cropType: item.cropType,
            preferredLanguage: item.preferredLanguage,
          });
          synced.push({
            id,
            diagnosis,
            syncedAt: new Date().toISOString(),
          });
        } catch (err) {
          const { message } = extractErrorDetails(err);
          failed.push({ id, error: message });
        }
      }

      res.json({ synced, failed });
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { diagnosisContext, history, message } = req.body as {
        diagnosisContext?: Parameters<typeof followUpConsultation>[0]["diagnosisContext"];
        history?: Parameters<typeof followUpConsultation>[0]["history"];
        message?: string;
      };
      if (!diagnosisContext || !message || message.trim().length === 0) {
        res
          .status(400)
          .json({ error: "Consultation context and message are required." });
        return;
      }
      const result = await followUpConsultation({
        diagnosisContext,
        history: Array.isArray(history) ? history : [],
        message,
      });
      res.json(result);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/whatsapp/chat", async (req, res) => {
    try {
      const {
        message,
        imageBase64,
        imageMimeType,
        preferredLanguage,
        history,
        startNewConsultation,
      } = req.body as {
        message?: string;
        imageBase64?: string;
        imageMimeType?: string;
        preferredLanguage?: string;
        history?: Array<{
          role: "user" | "model";
          text: string;
          stage?: "clarifying" | "final_diagnosis";
        }>;
        startNewConsultation?: boolean;
      };

      if (!imageBase64 && (!message || message.trim().length === 0)) {
        res.status(400).json({
          error: "Please send a message, voice note, or crop photo.",
        });
        return;
      }

      const result = await whatsappBotTurn({
        message,
        imageBase64,
        imageMimeType,
        preferredLanguage,
        history: Array.isArray(history) ? history : [],
        startNewConsultation,
      });
      res.json(result);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  // Meta WhatsApp Business Cloud API Webhook Verification
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken =
      process.env.WHATSAPP_VERIFY_TOKEN || "kisan-mitra-verify";

    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(String(challenge ?? ""));
      return;
    }
    res.sendStatus(403);
  });

  // Meta WhatsApp Business Cloud API Incoming Messages Handler
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body as {
        entry?: Array<{
          changes?: Array<{
            value?: {
              messages?: Array<{
                from?: string;
                type?: string;
                text?: { body?: string };
                image?: { id?: string; caption?: string };
                audio?: { id?: string };
              }>;
            };
          }>;
        }>;
      };

      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg || !msg.from) {
        res.sendStatus(200);
        return;
      }

      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      let userText = msg.text?.body ?? msg.image?.caption ?? "";
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (msg.type === "image" && msg.image?.id && accessToken) {
        const media = await fetchMetaWhatsappMedia(msg.image.id, accessToken);
        if (media) {
          imageBase64 = media.base64;
          imageMimeType = media.mimeType;
        }
      } else if (msg.type === "audio" && msg.audio?.id && accessToken) {
        const media = await fetchMetaWhatsappMedia(msg.audio.id, accessToken);
        if (media) {
          const { transcription } = await transcribeFarmerAudio(
            media.base64,
            media.mimeType
          );
          userText = transcription;
        }
      }

      const now = Date.now();
      const existingSession = whatsappWebhookSessions.get(msg.from);
      const priorTurns =
        existingSession && now - existingSession.updatedAt < WHATSAPP_SESSION_TTL_MS
          ? existingSession.turns.slice(-10)
          : [];

      const botReply = await whatsappBotTurn({
        message: userText,
        imageBase64,
        imageMimeType,
        history: priorTurns,
      });

      const updatedTurns = [
        ...priorTurns,
        { role: "user" as const, text: userText || "Crop photo sent." },
        { role: "model" as const, text: botReply.whatsappReply },
      ].slice(-10);
      whatsappWebhookSessions.set(msg.from, {
        turns: updatedTurns,
        updatedAt: now,
      });

      if (accessToken && phoneNumberId && botReply.whatsappReply) {
        await sendMetaWhatsappText({
          phoneNumberId,
          accessToken,
          to: msg.from,
          body: botReply.whatsappReply,
        });
      }

      res.status(200).json({
        ok: true,
        stage: botReply.stage,
        reply: botReply.whatsappReply,
      });
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || text.trim().length === 0) {
        res.status(400).json({ error: "Text is required for audio playback." });
        return;
      }
      const audioBase64 = await generateSpeechWav(text);
      res.json({ audioBase64, mimeType: "audio/wav" });
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const latRaw = Number(req.query.lat ?? 30.901);
      const lonRaw = Number(req.query.lon ?? 75.8573);
      const resolveName = req.query.resolveName === "true";

      if (
        Number.isNaN(latRaw) ||
        Number.isNaN(lonRaw) ||
        latRaw < -90 ||
        latRaw > 90 ||
        lonRaw < -180 ||
        lonRaw > 180
      ) {
        res.status(400).json({ error: "Valid latitude and longitude are required." });
        return;
      }

      const [weatherRes, geoName] = await Promise.all([
        fetch(buildOpenMeteoUrl(latRaw, lonRaw), {
          signal: AbortSignal.timeout(4500),
        }),
        resolveName
          ? fetch(buildReverseGeocodeUrl(latRaw, lonRaw), {
              signal: AbortSignal.timeout(3000),
            })
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

      if (!weatherRes.ok) {
        res
          .status(502)
          .json({ error: "Unable to fetch live weather forecast right now." });
        return;
      }

      const raw = (await weatherRes.json()) as OpenMeteoForecastPayload;
      res.json(buildWeatherReportFromOpenMeteo(raw, geoName));
    } catch {
      res
        .status(502)
        .json({ error: "Unable to reach weather upstream from server." });
    }
  });

  app.post("/api/weather/advisory", async (req, res) => {
    try {
      const { locationName, uiLang, weatherReport } = req.body as {
        locationName?: string;
        uiLang?: string;
        weatherReport?: {
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
        };
      };

      if (!weatherReport || !locationName) {
        res.status(400).json({ error: "Location and weatherReport are required." });
        return;
      }

      const advisory = await generateLocalizedWeatherAdvisory({
        locationName,
        uiLang: uiLang || "english",
        currentDateIso: new Date().toISOString().split("T")[0],
        current: weatherReport.current,
        suitability: weatherReport.suitability,
        warnings: weatherReport.warnings ?? [],
        daily: weatherReport.daily ?? [],
      });
      res.json(advisory);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kisan Mitra server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
