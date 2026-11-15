import { FlaskConical, Layers, Sprout } from "lucide-react";
import { CROP_OPTIONS } from "../data/locales";
import type { UiLanguage } from "../types/agronomy";

interface SoilGuideProfile {
  targetPh: string;
  targetEc: string;
  samplingDepth: string;
  organicCarbonTarget: string;
  testingTips: string[];
  amendmentTips: string[];
}

const SOIL_PROFILES: Record<string, SoilGuideProfile> = {
  auto: {
    targetPh: "6.5 – 7.5",
    targetEc: "< 1.0 dS/m",
    samplingDepth: "15 cm (6 in)",
    organicCarbonTarget: "> 0.50%",
    testingTips: [
      "Collect 8–10 V-shaped soil cores (15 cm deep) across the field in a zig-zag pattern before pre-sowing irrigation.",
      "Mix samples on a clean cloth, shade-dry, and submit 500 g to your nearest KVK or Soil Health Card lab.",
      "Avoid sampling near field bunds, manure heaps, irrigation channels, or recently fertilized strips.",
    ],
    amendmentTips: [
      "Incorporate 4–5 tonnes/acre of well-rotted FYM or compost 15–20 days before sowing to raise organic carbon.",
      "If lab pH exceeds 8.5 (alkaline/kallar soil), apply agricultural gypsum as per the Gypsum Requirement test.",
      "If soil is acidic (pH < 5.5), incorporate agricultural lime 3–4 weeks prior to sowing.",
    ],
  },
  Wheat: {
    targetPh: "6.5 – 7.5",
    targetEc: "< 1.0 dS/m",
    samplingDepth: "15 cm (6 in)",
    organicCarbonTarget: "> 0.50%",
    testingTips: [
      "Test available Phosphorus (P), Potassium (K), Zinc, and Manganese—especially in light sandy-loam rice-wheat soils.",
      "Sample immediately after paddy harvest and before rauni (pre-sowing irrigation) so fertilizer doses stay accurate.",
      "Check soil pH and exchangeable sodium if patches show poor germination or white salt crusts.",
    ],
    amendmentTips: [
      "Apply Zinc Sulphate Heptahydrate (21%) at 25 kg/acre as basal dose if lab Zinc is below 0.6 ppm.",
      "For Manganese deficiency on light soils after rice, spray 0.5% Manganese Sulphate (1 kg in 200 L water/acre) at 30–35 days.",
      "Mulch or incorporate paddy straw with 20 kg urea/acre + Trichoderma/decomposer to boost soil structure and moisture.",
    ],
  },
  Paddy: {
    targetPh: "5.5 – 7.0",
    targetEc: "< 1.2 dS/m",
    samplingDepth: "15 cm (6 in)",
    organicCarbonTarget: "> 0.55%",
    testingTips: [
      "Test available Zinc, Iron (Fe), Organic Carbon, and water pH before puddling and nursery preparation.",
      "Send borewell irrigation water along with soil if lower leaves frequently turn rusty or scorched.",
      "Measure Residual Sodium Carbonate (RSC) in tubewell water; RSC > 2.5 meq/L requires gypsum management.",
    ],
    amendmentTips: [
      "Incorporate Green Manure (Dhaincha / Sunhemp) 45 days before transplanting to cut basal urea need by 25%.",
      "Apply 25 kg/acre Zinc Sulphate (21%) before final puddling to prevent Khaira disease (rusty brown spots).",
      "On sandy soils showing iron chlorosis (white young leaves), give 2–3 sprays of 1% Ferrous Sulphate (1 kg/100 L water).",
    ],
  },
  Cotton: {
    targetPh: "6.5 – 8.0",
    targetEc: "< 1.5 dS/m",
    samplingDepth: "22 cm (9 in)",
    organicCarbonTarget: "> 0.50%",
    testingTips: [
      "Sample deeper (up to 22–30 cm) because cotton develops a deep taproot sensitive to hardpans and subsoil salinity.",
      "Check Magnesium (Mg), Boron (B), and Potassium (K) levels to prevent premature leaf reddening (Laliya).",
      "Avoid waterlogged clay zones; test subsoil drainage and electrical conductivity before ridge sowing.",
    ],
    amendmentTips: [
      "Apply 5 tonnes/acre well-decomposed FYM before last harrowing to improve moisture retention during dry spells.",
      "For leaf reddening or boll-drop prevention, apply Magnesium Sulphate (10 kg/acre basal) and Boron if deficient.",
      "Subsoil chiseling once every 2–3 years breaks plough pan and strengthens root growth against wilt.",
    ],
  },
  Sugarcane: {
    targetPh: "6.5 – 7.5",
    targetEc: "< 1.5 dS/m",
    samplingDepth: "25 cm (10 in)",
    organicCarbonTarget: "> 0.60%",
    testingTips: [
      "Collect soil cores at 0–25 cm depth along planted furrows before trenching for autumn or spring planting.",
      "Prioritize testing Organic Carbon, Sulphur (S), Iron (Fe), and Zinc because sugarcane is a heavy 12-month feeder.",
      "Test ratoon field soils separately to adjust Potassium and micronutrient carryover.",
    ],
    amendmentTips: [
      "Mix 8–10 tonnes/acre press-mud or FYM enriched with Trichoderma viride (2 kg/acre) in trenches before planting.",
      "Apply Elemental Sulphur or Gypsum (where Sulphur < 10 ppm) to improve juice recovery and cane weight.",
      "Retain sugarcane trash mulch in ratoon rows instead of burning to conserve moisture and suppress weeds.",
    ],
  },
  Mustard: {
    targetPh: "6.0 – 7.5",
    targetEc: "< 1.0 dS/m",
    samplingDepth: "15 cm (6 in)",
    organicCarbonTarget: "> 0.45%",
    testingTips: [
      "Request Sulphur (S) and Boron (B) readings in your soil test—oilseed crops show steep yield drops without them.",
      "Test residual moisture and nitrogen from the previous Kharif crop before fixing basal DAP/SSP rates.",
      "Check soil pH and salinity in rainfed pockets where uneven germination often appears.",
    ],
    amendmentTips: [
      "Prefer Single Super Phosphate (SSP, which supplies 11% Sulphur + Phosphorus) or apply 10–15 kg/acre Sulphur at sowing.",
      "Apply 1 kg/acre Borax (10.5% B) mixed with soil if lab Boron is < 0.5 ppm to improve pod setting and oil content.",
      "Incorporate 3–4 tonnes/acre compost before sowing to hold winter moisture during flowering.",
    ],
  },
  Vegetables: {
    targetPh: "6.0 – 7.0",
    targetEc: "< 0.8 dS/m",
    samplingDepth: "15 cm (6 in)",
    organicCarbonTarget: "> 0.65%",
    testingTips: [
      "Test before every vegetable cycle—tomatoes, potatoes, and cucurbits are highly sensitive to high salt (EC > 1.0 dS/m).",
      "Check Calcium (Ca), Boron (B), and soil-borne nematode risk if crops previously showed blossom-end rot or root knots.",
      "Sample raised beds separately from furrows to measure true root-zone pH and moisture salinity.",
    ],
    amendmentTips: [
      "Enrich 6–8 tonnes/acre compost with Neem Cake (100 kg/acre) + Trichoderma to suppress damping-off and root-knot nematodes.",
      "For calcium deficiency in tomato/chili (blossom-end rot), maintain steady soil moisture and apply gypsum or calcium nitrate.",
      "Use raised beds with organic straw or plastic mulch to prevent soil splash blight on lower leaves.",
    ],
  },
};

const CARD_UI_COPY: Record<
  UiLanguage,
  {
    title: string;
    subtitle: string;
    targetPhLabel: string;
    depthLabel: string;
    ecLabel: string;
    ocLabel: string;
    testingHeading: string;
    amendmentHeading: string;
  }
> = {
  english: {
    title: "Soil Health & Amendment Guide",
    subtitle: "Sampling checkpoints and organic/mineral amendments matched to your selected crop.",
    targetPhLabel: "Target pH",
    depthLabel: "Sample Depth",
    ecLabel: "Safe Salinity (EC)",
    ocLabel: "Organic Carbon",
    testingHeading: "Soil Testing Tips",
    amendmentHeading: "Soil Amendment Plan",
  },
  hindi: {
    title: "मृदा स्वास्थ्य और सुधार गाइड",
    subtitle: "चयनित फ़सल के अनुसार मिट्टी जाँच और जैविक/पोषक सुधार के उपाय।",
    targetPhLabel: "लक्ष्य pH",
    depthLabel: "नमूना गहराई",
    ecLabel: "सुरक्षित लवणता (EC)",
    ocLabel: "जैविक कार्बन",
    testingHeading: "मिट्टी जाँच के नियम",
    amendmentHeading: "मिट्टी सुधार की सलाह",
  },
  punjabi: {
    title: "ਮਿੱਟੀ ਸਿਹਤ ਅਤੇ ਸੁਧਾਰ ਗਾਈਡ",
    subtitle: "ਚੁਣੀ ਗਈ ਫ਼ਸਲ ਮੁਤਾਬਕ ਮਿੱਟੀ ਪਰਖ ਅਤੇ ਜੈਵਿਕ/ਖਾਦ ਸੁਧਾਰ ਦੇ ਨੁਕਤੇ।",
    targetPhLabel: "ਸਹੀ pH",
    depthLabel: "ਨਮੂਨਾ ਡੂੰਘਾਈ",
    ecLabel: "ਸੁਰੱਖਿਅਤ ਖਾਰਾਪਣ (EC)",
    ocLabel: "ਜੈਵਿਕ ਕਾਰਬਨ",
    testingHeading: "ਮਿੱਟੀ ਪਰਖ ਦੇ ਨੁਕਤੇ",
    amendmentHeading: "ਮਿੱਟੀ ਸੁਧਾਰ ਯੋਜਨਾ",
  },
  marathi: {
    title: "माती आरोग्य व सुधारणा मार्गदर्शक",
    subtitle: "निवडलेल्या पिकानुसार माती परीक्षण व सेंद्रिय/खनिज सुधारणा टिप्स.",
    targetPhLabel: "योग्य pH",
    depthLabel: "नमुना खोली",
    ecLabel: "सुरक्षित क्षारता (EC)",
    ocLabel: "सेंद्रिय कर्ब",
    testingHeading: "माती परीक्षणाचे नियम",
    amendmentHeading: "माती सुधारणा उपाय",
  },
  gujarati: {
    title: "જમીન આરોગ્ય અને સુધારણા માર્ગદર્શિકા",
    subtitle: "પસંદ કરેલા પાક મુજબ જમીન પરીક્ષણ અને સેન્દ્રિય સુધારણા ટિપ્સ.",
    targetPhLabel: "યોગ્ય pH",
    depthLabel: "નમૂનાની ઊંડાઈ",
    ecLabel: "સુરક્ષિત ક્ષારતા (EC)",
    ocLabel: "સેન્દ્રિય કાર્બન",
    testingHeading: "જમીન પરીક્ષણ ટિપ્સ",
    amendmentHeading: "જમીન સુધારણા યોજના",
  },
  bengali: {
    title: "মাটির স্বাস্থ্য ও সংশোধন গাইড",
    subtitle: "নির্বাচিত ফসল অনুযায়ী মাটি পরীক্ষা ও জৈব/খনিজ সংশোধনের পরামর্শ।",
    targetPhLabel: "সঠিক pH",
    depthLabel: "নমুনার গভীরতা",
    ecLabel: "নিরাপদ লবণাক্ততা (EC)",
    ocLabel: "জৈব কার্বন",
    testingHeading: "মাটি পরীক্ষার নিয়ম",
    amendmentHeading: "মাটি সংশোধন পরিকল্পনা",
  },
  tamil: {
    title: "மண் ஆரோக்கியம் மற்றும் சீர்திருத்த வழிகாட்டி",
    subtitle: "தேர்ந்தெடுத்த பயிருக்கேற்ற மண் பரிசோதனை மற்றும் உர மேலாண்மை குறிப்புகள்.",
    targetPhLabel: "சரியான pH",
    depthLabel: "மாதிரி ஆழம்",
    ecLabel: "பாதுகாப்பான உவர்ப்பு (EC)",
    ocLabel: "அங்கக கார்பன்",
    testingHeading: "மண் பரிசோதனை குறிப்புகள்",
    amendmentHeading: "மண் சீர்திருத்த திட்டம்",
  },
  telugu: {
    title: "నేల ఆరోగ్యం మరియు మెరుగుదల గైడ్",
    subtitle: "ఎంచుకున్న పంటకు అనుగుణంగా మట్టి పరీక్ష మరియు సేంద్రీయ సవరణ సూచనలు.",
    targetPhLabel: "సరైన pH",
    depthLabel: "నమూనా లోతు",
    ecLabel: "సురక్షిత లవణీయత (EC)",
    ocLabel: "సేంద్రీయ కర్బనం",
    testingHeading: "మట్టి పరీక్ష చిట్కాలు",
    amendmentHeading: "నేల సవరణ ప్రణాళిక",
  },
};

interface SoilHealthCardProps {
  cropType: string;
  uiLang: UiLanguage;
  onSelectCrop: (crop: string) => void;
}

export function SoilHealthCard({
  cropType,
  uiLang,
  onSelectCrop,
}: SoilHealthCardProps) {
  const profile = SOIL_PROFILES[cropType] ?? SOIL_PROFILES.auto;
  const labels = CARD_UI_COPY[uiLang];

  return (
    <section className="rounded-xl border border-[#E2E6E0] bg-white p-6 md:p-8 space-y-5">
      {/* Header + Interactive Crop Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E6E0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#143322]">
            <Layers className="w-4 h-4 text-[#15803D] shrink-0" />
            <h2 className="font-display text-lg font-semibold text-[#141B16]">
              {labels.title}
            </h2>
          </div>
          <p className="text-sm text-[#4E5D52]">{labels.subtitle}</p>
        </div>

        {/* Interactive segmented crop tabs synchronized with composer cropType */}
        <div
          role="group"
          aria-label="Select crop for soil health advice"
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#F4F6F3]"
        >
          {CROP_OPTIONS.map((opt) => {
            const active = cropType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectCrop(opt.value)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-white text-[#143322] font-semibold shadow-xs"
                    : "text-[#4E5D52] hover:text-[#141B16]"
                }`}
              >
                {opt.value === "auto" ? "General" : opt.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Soil Target Telemetry Strip (unboxed, tabular numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1">
        <div>
          <div className="text-xs text-[#5B6B5F]">{labels.targetPhLabel}</div>
          <div className="mt-0.5 font-mono text-base font-bold text-[#141B16] tabular-nums">
            {profile.targetPh}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#5B6B5F]">{labels.depthLabel}</div>
          <div className="mt-0.5 font-mono text-base font-bold text-[#141B16] tabular-nums">
            {profile.samplingDepth}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#5B6B5F]">{labels.ecLabel}</div>
          <div className="mt-0.5 font-mono text-base font-bold text-[#141B16] tabular-nums">
            {profile.targetEc}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#5B6B5F]">{labels.ocLabel}</div>
          <div className="mt-0.5 font-mono text-base font-bold text-[#141B16] tabular-nums">
            {profile.organicCarbonTarget}
          </div>
        </div>
      </div>

      {/* Testing & Amendment Guidance (2-column split separated by hairline) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E2E6E0]">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#143322]">
            <FlaskConical className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{labels.testingHeading}</span>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-[#263029]">
            {profile.testingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs font-semibold text-[#15803D] mt-1 tabular-nums shrink-0">
                  0{i + 1}.
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#143322]">
            <Sprout className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>{labels.amendmentHeading}</span>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-[#263029]">
            {profile.amendmentTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-xs font-semibold text-[#15803D] mt-1 tabular-nums shrink-0">
                  0{i + 1}.
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
