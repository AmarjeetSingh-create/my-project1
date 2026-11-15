import { Beaker, Calculator, Leaf, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import type { MedicineRecommendation } from "../types/agronomy";
import { SprayCalculator } from "./SprayCalculator";

interface MedicineDosageListProps {
  medicines: MedicineRecommendation[];
  compact?: boolean;
}

export function MedicineDosageList({
  medicines,
  compact = false,
}: MedicineDosageListProps) {
  const [selectedForCalc, setSelectedForCalc] =
    useState<MedicineRecommendation | null>(null);

  if (!medicines || medicines.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-[#E2E6E0] bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E6E0] bg-[#F7F8F6] text-xs font-semibold text-[#4E5D52]">
              <th className={compact ? "px-3 py-2" : "px-4 py-2.5"}>
                Medicine / Active Ingredient
              </th>
              <th className={compact ? "px-3 py-2" : "px-4 py-2.5"}>
                Per Liter
              </th>
              <th className={compact ? "px-3 py-2" : "px-4 py-2.5"}>
                Per Acre
              </th>
              {!compact && (
                <th className="px-4 py-2.5">Schedule &amp; Waiting Gap</th>
              )}
              <th className={compact ? "px-2 py-2 text-right" : "px-4 py-2.5 text-right"}>
                Mix
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E6E0] text-sm">
            {medicines.map((med, idx) => {
              const isOrganic =
                med.type === "Organic" || med.type === "Nutrient";
              return (
                <tr
                  key={`${med.activeIngredient}-${idx}`}
                  className="hover:bg-[#FAFBF9] transition-colors align-top"
                >
                  <td className={compact ? "px-3 py-2.5" : "px-4 py-3"}>
                    <div className="flex items-start gap-2">
                      {isOrganic ? (
                        <Leaf className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />
                      ) : (
                        <Beaker className="w-4 h-4 text-[#143322] mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-[#141B16]">
                          {med.name}
                        </div>
                        <div className="text-xs text-[#5B6B5F] mt-0.5">
                          {med.type}
                          {med.activeIngredient &&
                          med.activeIngredient !== med.name
                            ? ` · ${med.activeIngredient}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${
                      compact ? "px-3 py-2.5" : "px-4 py-3"
                    } font-mono text-xs font-medium text-[#143322] tabular-nums whitespace-nowrap`}
                  >
                    {med.dosagePerLiter}
                  </td>
                  <td
                    className={`${
                      compact ? "px-3 py-2.5" : "px-4 py-3"
                    } font-mono text-xs text-[#263029] tabular-nums`}
                  >
                    {med.dosagePerAcre}
                  </td>
                  {!compact && (
                    <td className="px-4 py-3 text-xs text-[#3D4B41] space-y-1">
                      <div>{med.spraySchedule}</div>
                      {med.waitingPeriodDays && (
                        <div className="inline-flex items-center gap-1 text-[#92400E] font-medium tabular-nums">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Wait: {med.waitingPeriodDays}</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td
                    className={`${
                      compact ? "px-2 py-2.5" : "px-4 py-3"
                    } text-right whitespace-nowrap`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedForCalc(med)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#D4DDD1] bg-[#F7F8F6] px-2.5 py-1 text-xs font-medium text-[#143322] hover:bg-[#E7EFE5] transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Tanks</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedForCalc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedForCalc(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#F7F8F6] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedForCalc(null)}
              className="absolute top-5 right-5 z-10 inline-flex items-center gap-1 rounded-lg border border-[#E2E6E0] bg-white px-2.5 py-1 text-xs font-medium text-[#3D4B41] hover:bg-[#F2F5F0]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
            <SprayCalculator
              initialMedicineName={
                selectedForCalc.activeIngredient || selectedForCalc.name
              }
              initialDosagePerLiter={selectedForCalc.dosagePerLiter}
            />
          </div>
        </div>
      )}
    </>
  );
}
