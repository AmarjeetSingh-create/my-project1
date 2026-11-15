import { Calculator, Check, Copy, Droplets } from "lucide-react";
import { useMemo, useState } from "react";

interface SprayCalculatorProps {
  initialMedicineName?: string;
  initialDosagePerLiter?: string;
}

function parseDosageNumber(raw?: string): { amount: number; unit: "ml" | "g" } {
  if (!raw) return { amount: 1, unit: "ml" };
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  const amount = match ? parseFloat(match[1]) : 1;
  const isGrams = /\bg\b/i.test(raw) || /gram/i.test(raw);
  return {
    amount: Number.isFinite(amount) && amount > 0 ? amount : 1,
    unit: isGrams ? "g" : "ml",
  };
}

export function SprayCalculator({
  initialMedicineName,
  initialDosagePerLiter,
}: SprayCalculatorProps) {
  const parsed = parseDosageNumber(initialDosagePerLiter);

  const [medicineName, setMedicineName] = useState(
    initialMedicineName || "Propiconazole 25% EC (or Recommended Medicine)"
  );
  const [acres, setAcres] = useState<number>(2);
  const [waterPerAcreLiters, setWaterPerAcreLiters] = useState<number>(200);
  const [tankSizeLiters, setTankSizeLiters] = useState<number>(16);
  const [dosePerLiter, setDosePerLiter] = useState<number>(parsed.amount);
  const [unit, setUnit] = useState<"ml" | "g">(parsed.unit);
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    const safeAcres = Math.max(0.1, acres || 0);
    const safeWater = Math.max(50, waterPerAcreLiters || 0);
    const safeTank = Math.max(1, tankSizeLiters || 1);
    const safeDose = Math.max(0.05, dosePerLiter || 0);

    const totalWaterLiters = safeAcres * safeWater;
    const totalTanks = totalWaterLiters / safeTank;
    const medicinePerTank = safeTank * safeDose;
    const totalMedicine = totalWaterLiters * safeDose;

    return {
      totalWaterLiters,
      totalTanks,
      medicinePerTank,
      totalMedicine,
    };
  }, [acres, waterPerAcreLiters, tankSizeLiters, dosePerLiter]);

  const formatTotalQuantity = (qty: number, u: "ml" | "g") => {
    if (qty >= 1000) {
      const bigUnit = u === "ml" ? "L" : "kg";
      return `${qty.toFixed(0)} ${u} (${(qty / 1000).toFixed(2)} ${bigUnit})`;
    }
    return `${qty.toFixed(1)} ${u}`;
  };

  const handleCopySummary = async () => {
    const summary = `Spray Mixing Plan — ${medicineName}
Area: ${acres} acre(s) · Water: ${results.totalWaterLiters.toFixed(0)} L
Sprayer Tank (${tankSizeLiters} L): ${results.totalTanks.toFixed(1)} tanks
Add per ${tankSizeLiters} L tank: ${results.medicinePerTank.toFixed(1)} ${unit}
Total medicine needed: ${formatTotalQuantity(results.totalMedicine, unit)}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="rounded-xl border border-[#E2E6E0] bg-white p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
            <Calculator className="w-4 h-4 shrink-0" />
            <span>Spray Tank &amp; Acreage Dosage Calculator</span>
          </div>
          <p className="text-xs text-[#5B6B5F]">
            Convert per-liter medicine recommendations into exact sprayer tank measurements for your field size.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleCopySummary()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3 py-1.5 text-xs font-medium text-[#143322] hover:bg-[#EDF1EB] transition-colors whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Copied Plan</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#15803D]" />
              <span>Copy Mixing Plan</span>
            </>
          )}
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
          <label
            htmlFor="calc-medicine-name"
            className="block text-xs font-semibold text-[#3D4B41]"
          >
            Medicine / Active Ingredient
          </label>
          <input
            id="calc-medicine-name"
            type="text"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3.5 py-2 text-sm text-[#141B16] focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="calc-acres"
            className="block text-xs font-semibold text-[#3D4B41]"
          >
            Field Area (Acres)
          </label>
          <input
            id="calc-acres"
            type="number"
            min="0.25"
            step="0.25"
            value={acres}
            onChange={(e) => setAcres(Number(e.target.value))}
            className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3.5 py-2 font-mono text-sm text-[#141B16] tabular-nums focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
          />
          <div className="flex gap-1.5 pt-0.5">
            {[0.5, 1, 2, 5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAcres(preset)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums border ${
                  acres === preset
                    ? "border-[#15803D] bg-[#F0FDF4] text-[#143322] font-semibold"
                    : "border-[#E2E6E0] bg-white text-[#5B6B5F] hover:bg-[#F7F8F6]"
                }`}
              >
                {preset} ac
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="calc-tank"
            className="block text-xs font-semibold text-[#3D4B41]"
          >
            Sprayer Tank Size
          </label>
          <select
            id="calc-tank"
            value={tankSizeLiters}
            onChange={(e) => setTankSizeLiters(Number(e.target.value))}
            className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3 py-2 text-sm text-[#141B16] focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
          >
            <option value={15}>15 L Knapsack Sprayer</option>
            <option value={16}>16 L Battery Sprayer</option>
            <option value={20}>20 L Power Sprayer</option>
            <option value={200}>200 L Tractor Boom Tank</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="calc-dose"
            className="block text-xs font-semibold text-[#3D4B41]"
          >
            Dose per Liter of Water
          </label>
          <div className="flex gap-2">
            <input
              id="calc-dose"
              type="number"
              min="0.1"
              step="0.1"
              value={dosePerLiter}
              onChange={(e) => setDosePerLiter(Number(e.target.value))}
              className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3.5 py-2 font-mono text-sm text-[#141B16] tabular-nums focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
            />
            <select
              aria-label="Dosage unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as "ml" | "g")}
              className="rounded-lg border border-[#D4DDD1] bg-white px-2.5 py-2 text-sm font-medium text-[#143322] focus:border-[#15803D] focus:outline-none min-h-[42px]"
            >
              <option value="ml">ml/L</option>
              <option value="g">g/L</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="calc-water-acre"
            className="block text-xs font-semibold text-[#3D4B41]"
          >
            Water Volume / Acre (L)
          </label>
          <select
            id="calc-water-acre"
            value={waterPerAcreLiters}
            onChange={(e) => setWaterPerAcreLiters(Number(e.target.value))}
            className="w-full rounded-lg border border-[#D4DDD1] bg-[#FAFBF9] px-3 py-2 text-sm text-[#141B16] focus:border-[#15803D] focus:bg-white focus:outline-none min-h-[42px]"
          >
            <option value={150}>150 L / acre (Early crop)</option>
            <option value={200}>200 L / acre (Standard canopy)</option>
            <option value={250}>250 L / acre (Dense tall crop)</option>
          </select>
        </div>
      </div>

      {/* Results Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#E2E6E0]">
        <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-4">
          <div className="text-xs font-medium text-[#166534]">
            Add Per {tankSizeLiters}L Tank
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-[#143322] tabular-nums">
            {results.medicinePerTank.toFixed(1)} {unit}
          </div>
        </div>

        <div className="rounded-lg bg-[#FAFBF9] border border-[#E2E6E0] p-4">
          <div className="text-xs font-medium text-[#4E5D52]">
            Total Medicine to Buy
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#141B16] tabular-nums">
            {formatTotalQuantity(results.totalMedicine, unit)}
          </div>
        </div>

        <div className="rounded-lg bg-[#FAFBF9] border border-[#E2E6E0] p-4">
          <div className="text-xs font-medium text-[#4E5D52]">
            Sprayer Tanks Needed
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#141B16] tabular-nums">
            {results.totalTanks.toFixed(1)} tanks
          </div>
        </div>

        <div className="rounded-lg bg-[#FAFBF9] border border-[#E2E6E0] p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#4E5D52]">
            <Droplets className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Total Clean Water</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-[#141B16] tabular-nums">
            {results.totalWaterLiters.toFixed(0)} L
          </div>
        </div>
      </div>
    </div>
  );
}
