import {
  AlertTriangle,
  MessageCircle,
  Search,
  Sprout,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { UiCopy } from "../data/locales";
import { DISEASE_MEDICINE_CATALOG } from "../data/medicines";
import type { DiseaseMedicineEntry } from "../types/agronomy";
import { MedicineDosageList } from "./MedicineDosageList";

interface MedicinesDirectoryProps {
  copy: UiCopy;
  onAskInWhatsapp: (entry: DiseaseMedicineEntry) => void;
}

const CROP_FILTERS = ["All", "Wheat", "Paddy", "Cotton", "Mustard", "Vegetables"];

export function MedicinesDirectory({
  copy,
  onAskInWhatsapp,
}: MedicinesDirectoryProps) {
  const [query, setQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("All");

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DISEASE_MEDICINE_CATALOG.filter((item) => {
      const matchesCrop = selectedCrop === "All" || item.crop === selectedCrop;
      if (!matchesCrop) return false;
      if (!q) return true;
      const inMedicines = item.medicines.some(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.activeIngredient.toLowerCase().includes(q)
      );
      return (
        item.diseaseEnglish.toLowerCase().includes(q) ||
        item.diseaseLocal.toLowerCase().includes(q) ||
        item.crop.toLowerCase().includes(q) ||
        item.cropLocal.toLowerCase().includes(q) ||
        item.symptoms.toLowerCase().includes(q) ||
        inMedicines
      );
    });
  }, [query, selectedCrop]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#141B16]">
              {copy.medicinesTitle}
            </h1>
            <p className="mt-1 text-sm text-[#4E5D52] max-w-2xl">
              {copy.medicinesSubtitle}
            </p>
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-[#6B7A6E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.medicinesSearchPlaceholder}
              className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] pl-10 pr-4 py-2.5 text-sm text-[#141B16] placeholder:text-[#6B7A6E] focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
            />
          </div>
        </div>

        {/* Crop Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E2E6E0]">
          {CROP_FILTERS.map((crop) => {
            const active = selectedCrop === crop;
            return (
              <button
                key={crop}
                type="button"
                onClick={() => setSelectedCrop(crop)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-[#143322] text-white"
                    : "bg-[#F2F5F0] text-[#3D4B41] hover:bg-[#E6ECE3]"
                }`}
              >
                {crop === "All" ? copy.allCropsFilter : crop}
              </button>
            );
          })}
        </div>
      </section>

      {/* Catalog Entries */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-[#E2E6E0] bg-white p-10 text-center space-y-2">
          <Sprout className="w-7 h-7 text-[#5B6B5F] mx-auto" />
          <p className="text-sm font-medium text-[#141B16]">
            No matching crop diseases or medicines found.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedCrop("All");
            }}
            className="text-xs font-semibold text-[#15803D] hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B5F]">
                    <span className="font-semibold text-[#143322]">
                      {entry.crop} ({entry.cropLocal})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.category}</span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-[#141B16]">
                    {entry.diseaseEnglish}
                  </h2>
                  <p className="text-sm font-medium text-[#2E5438]">
                    {entry.diseaseLocal}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAskInWhatsapp(entry)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{copy.askInWhatsappBtn}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E2E6E0] text-sm">
                <div>
                  <div className="text-xs font-semibold text-[#4E5D52] mb-1">
                    Field Symptoms
                  </div>
                  <p className="text-[#263029] leading-relaxed">
                    {entry.symptoms}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#15803D] mb-1">
                    Organic & Cultural First Step
                  </div>
                  <p className="text-[#263029] leading-relaxed">
                    {entry.organicRemedy}
                  </p>
                </div>
              </div>

              <MedicineDosageList medicines={entry.medicines} />

              <div className="flex items-start gap-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-4 py-2.5 text-xs text-[#78350F]">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>{entry.safetyNote}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
