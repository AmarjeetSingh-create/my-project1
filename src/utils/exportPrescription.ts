import type { ConsultationCase } from "../types/agronomy";

const A4_PX_WIDTH = 1240; // A4 @ 150 DPI
const A4_PX_HEIGHT = 1754;
const A4_PT_WIDTH = 595.28;
const A4_PT_HEIGHT = 841.89;

function sanitizeFileSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "crop";
}

function formatConsultationDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildRetailerPrescriptionText(
  consultation: ConsultationCase
): string {
  const { diagnosis } = consultation;
  const formattedDate = formatConsultationDate(consultation.createdAt);

  const medsSection = (diagnosis.medicines ?? [])
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} [${m.type}]\n   Active Ingredient: ${
          m.activeIngredient
        }\n   Dosage: ${m.dosagePerLiter} (${m.dosagePerAcre})\n   Spray Schedule: ${
          m.spraySchedule
        } | Harvest Gap: ${m.waitingPeriodDays}`
    )
    .join("\n\n");

  const sprayHistory =
    consultation.sprayLogs && consultation.sprayLogs.length > 0
      ? `\nLOGGED FIELD SPRAYS:\n${consultation.sprayLogs
          .map(
            (s, i) =>
              `${i + 1}. ${s.medicineUsed} (${s.acresCovered} acres) on ${new Date(
                s.appliedAt
              ).toLocaleDateString()}`
          )
          .join("\n")}\n`
      : "";

  return `====================================================================
KISAN MITRA — FARMER & AGRO-RETAILER PRESCRIPTION CARD
====================================================================
Date: ${formattedDate}
Case ID: ${consultation.id}
Crop: ${diagnosis.cropIdentified}
Disease / Pest: ${diagnosis.diseaseNameEnglish}${
    diagnosis.diseaseNameLocal ? ` (${diagnosis.diseaseNameLocal})` : ""
  }
Severity: ${diagnosis.severity}${
    diagnosis.severityLocal ? ` (${diagnosis.severityLocal})` : ""
  }

FARMER NOTE:
${consultation.farmerPrompt}

1. RECOMMENDED MEDICINES & DOSAGES (FOR RETAILER):
${medsSection || diagnosis.chemicalTreatment}

2. DIAGNOSIS:
${diagnosis.diagnosis}

3. CAUSE:
${diagnosis.cause}

4. ORGANIC / FIRST-STEP REMEDY:
${diagnosis.organicRemedy}

5. CHEMICAL TREATMENT SUMMARY:
${diagnosis.chemicalTreatment}

6. SAFETY PRECAUTIONS & WAITING PERIOD:
${diagnosis.safetyPrecautions}

7. PREVENTION:
${diagnosis.prevention}
${sprayHistory}
--------------------------------------------------------------------
Please ask your local agro-retailer for the exact active ingredient
and verify expiry date and waiting period before spraying.
====================================================================
`;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadTextPrescription(consultation: ConsultationCase): void {
  const content = buildRetailerPrescriptionText(consultation);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const slug = sanitizeFileSlug(consultation.diagnosis.cropIdentified);
  triggerBlobDownload(blob, `kisan-mitra-${slug}-prescription.txt`);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = (text || "").trim();
  if (!clean) return [];
  const paragraphs = clean.split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      lines.push("");
      continue;
    }
    const words = trimmedPara.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        // Character-level fallback for very long unspaced strings
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (ctx.measureText(chunk + ch).width <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function buildPdfFromJpegPages(pages: Uint8Array[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const totalObjs = 2 + pages.length * 3;
  const offsets: number[] = new Array(totalObjs + 1).fill(0);

  // PDF 1.4 Header + binary hint
  pushStr("%PDF-1.4\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // Object 1: Catalog
  offsets[1] = offset;
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages
  const kidsRefs = pages.map((_, idx) => `${3 + idx * 3} 0 R`).join(" ");
  offsets[2] = offset;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${pages.length} >>\nendobj\n`
  );

  // Page + Content + Image XObject triplets
  for (let i = 0; i < pages.length; i++) {
    const pageObj = 3 + i * 3;
    const contentObj = 4 + i * 3;
    const imageObj = 5 + i * 3;
    const jpegBytes = pages[i];

    offsets[pageObj] = offset;
    pushStr(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT_WIDTH} ${A4_PT_HEIGHT}] /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`
    );

    const contentStream = `q\n${A4_PT_WIDTH} 0 0 ${A4_PT_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets[contentObj] = offset;
    pushStr(
      `${contentObj} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    offsets[imageObj] = offset;
    pushStr(
      `${imageObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${A4_PX_WIDTH} /Height ${A4_PX_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
    );
    pushBytes(jpegBytes);
    pushStr("\nendstream\nendobj\n");
  }

  // Xref table
  const xrefOffset = offset;
  pushStr(`xref\n0 ${totalObjs + 1}\n`);
  pushStr("0000000000 65535 f \n");
  for (let id = 1; id <= totalObjs; id++) {
    pushStr(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  return output;
}

export async function downloadPdfPrescription(
  consultation: ConsultationCase
): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("PDF export is only available in the browser.");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const { diagnosis } = consultation;
  const formattedDate = formatConsultationDate(consultation.createdAt);

  const pages: Uint8Array[] = [];
  const marginX = 72;
  const contentWidth = A4_PX_WIDTH - marginX * 2;
  const bottomLimit = A4_PX_HEIGHT - 96;
  const fontStack =
    '"Plus Jakarta Sans", "Noto Sans", "Noto Sans Gurmukhi", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif';

  let canvas = document.createElement("canvas");
  canvas.width = A4_PX_WIDTH;
  canvas.height = A4_PX_HEIGHT;
  const initialCtx = canvas.getContext("2d");
  if (!initialCtx) {
    throw new Error("Canvas rendering context is unavailable.");
  }
  let ctx: CanvasRenderingContext2D = initialCtx;

  const startNewPage = (isFirstPage: boolean) => {
    if (!isFirstPage) {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const b64 = dataUrl.split(",")[1] ?? "";
      pages.push(base64ToUint8Array(b64));

      canvas = document.createElement("canvas");
      canvas.width = A4_PX_WIDTH;
      canvas.height = A4_PX_HEIGHT;
      const nextCtx = canvas.getContext("2d");
      if (!nextCtx) throw new Error("Canvas rendering failed.");
      ctx = nextCtx;
    }

    // Crisp white paper background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, A4_PX_WIDTH, A4_PX_HEIGHT);

    if (isFirstPage) {
      // Forest green masthead
      ctx.fillStyle = "#143322";
      ctx.fillRect(0, 0, A4_PX_WIDTH, 148);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 34px ${fontStack}`;
      ctx.fillText("KISAN MITRA · Field Prescription Card", marginX, 66);

      ctx.fillStyle = "#D1FAE5";
      ctx.font = `500 21px ${fontStack}`;
      ctx.fillText(
        `Farmer & Agro-Retailer Copy  |  ${formattedDate}`,
        marginX,
        108
      );
      return 184;
    }

    ctx.fillStyle = "#4E5D52";
    ctx.font = `600 18px ${fontStack}`;
    ctx.fillText(
      `KISAN MITRA · ${diagnosis.cropIdentified} — ${diagnosis.diseaseNameEnglish} (cont.)`,
      marginX,
      64
    );
    ctx.strokeStyle = "#E2E6E0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, 84);
    ctx.lineTo(A4_PX_WIDTH - marginX, 84);
    ctx.stroke();
    return 116;
  };

  let cursorY = startNewPage(true);

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > bottomLimit) {
      cursorY = startNewPage(false);
    }
  };

  // Primary Identification Card
  const idCardLines = [
    `Crop: ${diagnosis.cropIdentified}`,
    `Disease / Pest: ${diagnosis.diseaseNameEnglish}${
      diagnosis.diseaseNameLocal ? ` (${diagnosis.diseaseNameLocal})` : ""
    }`,
    `Severity: ${diagnosis.severity}${
      diagnosis.severityLocal ? ` (${diagnosis.severityLocal})` : ""
    }`,
  ];
  const cardHeight = 42 + idCardLines.length * 36;
  ctx.fillStyle = "#F7FAF5";
  ctx.strokeStyle = "#CBD9C7";
  ctx.lineWidth = 2;
  ctx.fillRect(marginX, cursorY, contentWidth, cardHeight);
  ctx.strokeRect(marginX, cursorY, contentWidth, cardHeight);

  let innerY = cursorY + 42;
  for (let i = 0; i < idCardLines.length; i++) {
    ctx.fillStyle = i === 1 ? "#143322" : "#1F2A22";
    ctx.font = i === 1 ? `700 24px ${fontStack}` : `600 21px ${fontStack}`;
    const wrapped = wrapTextLines(ctx, idCardLines[i], contentWidth - 48);
    ctx.fillText(wrapped[0] ?? idCardLines[i], marginX + 24, innerY);
    innerY += 36;
  }
  cursorY += cardHeight + 30;

  const drawSection = (
    heading: string,
    bodyText: string,
    accentBg?: { fill: string; border: string; titleColor: string; textColor: string }
  ) => {
    if (!bodyText || !bodyText.trim()) return;
    ctx.font = `400 21px ${fontStack}`;
    const lines = wrapTextLines(
      ctx,
      bodyText,
      accentBg ? contentWidth - 48 : contentWidth
    );
    const lineHeight = 32;
    const headingHeight = 36;

    if (accentBg) {
      const boxHeight = headingHeight + lines.length * lineHeight + 34;
      ensureSpace(boxHeight + 16);
      ctx.fillStyle = accentBg.fill;
      ctx.strokeStyle = accentBg.border;
      ctx.lineWidth = 2;
      ctx.fillRect(marginX, cursorY, contentWidth, boxHeight);
      ctx.strokeRect(marginX, cursorY, contentWidth, boxHeight);

      ctx.fillStyle = accentBg.titleColor;
      ctx.font = `700 22px ${fontStack}`;
      ctx.fillText(heading, marginX + 24, cursorY + 38);

      ctx.fillStyle = accentBg.textColor;
      ctx.font = `400 20px ${fontStack}`;
      let y = cursorY + 74;
      for (const line of lines) {
        if (line) ctx.fillText(line, marginX + 24, y);
        y += lineHeight;
      }
      cursorY += boxHeight + 24;
      return;
    }

    ensureSpace(headingHeight + Math.min(lines.length, 3) * lineHeight + 14);
    ctx.fillStyle = "#143322";
    ctx.font = `700 23px ${fontStack}`;
    ctx.fillText(heading, marginX, cursorY);
    cursorY += 14;

    ctx.strokeStyle = "#E2E6E0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginX, cursorY);
    ctx.lineTo(marginX + contentWidth, cursorY);
    ctx.stroke();
    cursorY += 30;

    ctx.fillStyle = "#263029";
    ctx.font = `400 21px ${fontStack}`;
    for (const line of lines) {
      ensureSpace(lineHeight + 8);
      if (line) {
        ctx.fillText(line, marginX, cursorY);
      }
      cursorY += lineHeight;
    }
    cursorY += 20;
  };

  // Retailer Medicines Box First (highest utility for counter staff)
  const medsText =
    diagnosis.medicines && diagnosis.medicines.length > 0
      ? diagnosis.medicines
          .map(
            (m, i) =>
              `${i + 1}. ${m.name} (${m.type}) — Active: ${
                m.activeIngredient
              }\n    Dose: ${m.dosagePerLiter}  |  ${
                m.dosagePerAcre
              }\n    Schedule: ${m.spraySchedule}  |  Waiting Gap: ${
                m.waitingPeriodDays
              }`
          )
          .join("\n\n")
      : diagnosis.chemicalTreatment;

  drawSection("Recommended Medicines & Exact Dosages (For Agro-Retailer)", medsText, {
    fill: "#F0FDF4",
    border: "#BBF7D0",
    titleColor: "#166534",
    textColor: "#143322",
  });

  drawSection("Diagnosis", diagnosis.diagnosis);
  drawSection("Cause", diagnosis.cause);
  drawSection("Organic / First-Step Remedy", diagnosis.organicRemedy);
  if (diagnosis.medicines && diagnosis.medicines.length > 0) {
    drawSection("Chemical Treatment Notes", diagnosis.chemicalTreatment);
  }
  drawSection("Safety Precautions & Harvest Waiting Period", diagnosis.safetyPrecautions, {
    fill: "#FFFBEB",
    border: "#FDE68A",
    titleColor: "#92400E",
    textColor: "#78350F",
  });
  drawSection("Prevention", diagnosis.prevention);
  drawSection("Farmer Observation", consultation.farmerPrompt);

  // Footer on final page
  ctx.fillStyle = "#5B6B5F";
  ctx.font = `500 17px ${fontStack}`;
  ctx.fillText(
    `Kisan Mitra Ref: ${consultation.id} · Verify active ingredient & harvest waiting gap before spraying.`,
    marginX,
    A4_PX_HEIGHT - 44
  );

  // Push final page
  const finalDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const finalB64 = finalDataUrl.split(",")[1] ?? "";
  pages.push(base64ToUint8Array(finalB64));

  const pdfBytes = buildPdfFromJpegPages(pages);
  const pdfCopy = new Uint8Array(pdfBytes.byteLength);
  pdfCopy.set(pdfBytes);
  const pdfBlob = new Blob([pdfCopy.buffer], { type: "application/pdf" });
  const slug = sanitizeFileSlug(diagnosis.cropIdentified);
  triggerBlobDownload(pdfBlob, `kisan-mitra-${slug}-prescription.pdf`);
}
