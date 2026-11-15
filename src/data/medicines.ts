import type { DiseaseMedicineEntry } from "../types/agronomy";

export const DISEASE_MEDICINE_CATALOG: DiseaseMedicineEntry[] = [
  {
    id: "wheat-yellow-rust",
    crop: "Wheat",
    cropLocal: "गेहूँ / ਕਣਕ",
    diseaseEnglish: "Yellow Rust (Stripe Rust)",
    diseaseLocal: "पीला रतुआ / ਪੀਲਾ ਰਤੂਆ",
    category: "Fungal",
    symptoms:
      "Bright yellow-orange powdery pustules arranged in narrow stripes on wheat leaves; yellow dust rubs off on fingers.",
    organicRemedy:
      "Remove heavily infected lower leaves early; avoid excess nitrogen/urea top-dressing; spray Neem Oil (Azadirachtin 1500 ppm) at 3 ml/L as early supportive protection.",
    medicines: [
      {
        name: "Propiconazole 25% EC",
        activeIngredient: "Propiconazole 25% EC",
        type: "Fungicide",
        dosagePerLiter: "1 ml / L water",
        dosagePerAcre: "200 ml in 200 L water / acre",
        spraySchedule: "Spray immediately on appearance; repeat after 14 days if fog persists",
        waitingPeriodDays: "21 days before harvest",
      },
      {
        name: "Tebuconazole 25.9% EC",
        activeIngredient: "Tebuconazole 25.9% EC",
        type: "Fungicide",
        dosagePerLiter: "1 ml / L water",
        dosagePerAcre: "200 ml in 200 L water / acre",
        spraySchedule: "1–2 foliar sprays at 15-day interval",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Wear gloves and face mask while spraying. Do not feed freshly sprayed crop leaves to cattle for 14 days.",
  },
  {
    id: "wheat-aphids",
    crop: "Wheat",
    cropLocal: "गेहूँ / ਕਣਕ",
    diseaseEnglish: "Wheat Aphids (Tela / Mahu)",
    diseaseLocal: "माहू / ਤੇਲਾ",
    category: "Pest",
    symptoms:
      "Clusters of green/black soft insects sucking sap from earheads and tender shoots, leaving sticky honeydew and yellowing.",
    organicRemedy:
      "Encourage natural ladybird beetles; install yellow sticky traps (6–8/acre); spray Neem Seed Kernel Extract (NSKE 5%) or Azadirachtin 1500 ppm at 3–5 ml/L.",
    medicines: [
      {
        name: "Azadirachtin 1500 ppm (Neem Oil)",
        activeIngredient: "Azadirachtin 0.15% EC",
        type: "Organic",
        dosagePerLiter: "3–5 ml / L water",
        dosagePerAcre: "600–800 ml in 150–200 L water / acre",
        spraySchedule: "Evening spray at early aphid colony appearance",
        waitingPeriodDays: "1 day",
      },
      {
        name: "Imidacloprid 17.8% SL",
        activeIngredient: "Imidacloprid 17.8% SL",
        type: "Insecticide",
        dosagePerLiter: "0.3 ml / L water",
        dosagePerAcre: "40–60 ml in 150 L water / acre",
        spraySchedule: "Single spray only if threshold exceeds 10 aphids/earhead",
        waitingPeriodDays: "21 days before harvest",
      },
      {
        name: "Thiamethoxam 25% WG",
        activeIngredient: "Thiamethoxam 25% WG",
        type: "Insecticide",
        dosagePerLiter: "0.2 g / L water",
        dosagePerAcre: "20–40 g in 150 L water / acre",
        spraySchedule: "Spray in evening when honeybees are inactive",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Avoid spraying during active bee foraging hours (mid-morning). Protect beneficial ladybird predators whenever possible.",
  },
  {
    id: "paddy-rice-blast",
    crop: "Paddy",
    cropLocal: "धान / ਝੋਨਾ",
    diseaseEnglish: "Rice Blast (Leaf & Neck Blast)",
    diseaseLocal: "झोंका रोग / ਭੁਰੜ ਰੋਗ",
    category: "Fungal",
    symptoms:
      "Spindle or diamond-shaped spots with gray centers and dark brown borders on paddy leaves; blackening of panicle neck.",
    organicRemedy:
      "Drain stagnant excess water briefly; stop urea application immediately; apply Pseudomonas fluorescens bio-fungicide at 5 g/L.",
    medicines: [
      {
        name: "Tricyclazole 75% WP",
        activeIngredient: "Tricyclazole 75% WP",
        type: "Fungicide",
        dosagePerLiter: "0.6 g / L water",
        dosagePerAcre: "120 g in 200 L water / acre",
        spraySchedule: "Spray at early leaf spots and once at booting stage for neck blast",
        waitingPeriodDays: "21–30 days before harvest",
      },
      {
        name: "Isoprothiolane 40% EC",
        activeIngredient: "Isoprothiolane 40% EC",
        type: "Fungicide",
        dosagePerLiter: "1.5 ml / L water",
        dosagePerAcre: "300 ml in 200 L water / acre",
        spraySchedule: "Repeat after 10–14 days if humid cloudy weather continues",
        waitingPeriodDays: "20 days before harvest",
      },
    ],
    safetyNote:
      "Do not spray right before heavy rain. Keep field bunds weed-free to prevent spore carryover.",
  },
  {
    id: "paddy-leaf-folder",
    crop: "Paddy",
    cropLocal: "धान / ਝੋਨਾ",
    diseaseEnglish: "Paddy Leaf Folder & Stem Borer",
    diseaseLocal: "पत्ता लपेट सुंडी / ਪੱਤਾ ਲਪੇਟ ਸੁੰਡੀ",
    category: "Pest",
    symptoms:
      "Leaves folded lengthwise with white scraped streaks inside; or dead-hearts/white-ears from stem borer larvae.",
    organicRemedy:
      "Drag a light rope across flooded paddy to dislodge larvae; release Trichogramma bio-cards; spray Bacillus thuringiensis (Bt) at 2 g/L.",
    medicines: [
      {
        name: "Chlorantraniliprole 18.5% SC",
        activeIngredient: "Chlorantraniliprole 18.5% SC",
        type: "Insecticide",
        dosagePerLiter: "0.3 ml / L water",
        dosagePerAcre: "60 ml in 200 L water / acre",
        spraySchedule: "Apply when >10% leaves show folding",
        waitingPeriodDays: "30 days before harvest",
      },
      {
        name: "Cartap Hydrochloride 50% SP",
        activeIngredient: "Cartap Hydrochloride 50% SP",
        type: "Insecticide",
        dosagePerLiter: "1 g / L water",
        dosagePerAcre: "200–300 g in 200 L water / acre",
        spraySchedule: "One targeted foliar application in morning or evening",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Keep fish ponds and water channels protected from spray drift. Wear waterproof gloves and mask.",
  },
  {
    id: "cotton-whitefly",
    crop: "Cotton",
    cropLocal: "कपास / ਨਰਮਾ",
    diseaseEnglish: "Cotton Whitefly & Leaf Curl",
    diseaseLocal: "सफेद मक्खी / ਚਿੱਟਾ ਮੱਛਰ",
    category: "Pest",
    symptoms:
      "Tiny white flies on leaf undersides, sticky honeydew, black sooty mold, and upward/downward curling of leaves.",
    organicRemedy:
      "Install 10–15 yellow sticky traps per acre; remove host weeds like Peeli Booti/Kanghi Booti; spray Neem Oil 1500 ppm at 5 ml/L.",
    medicines: [
      {
        name: "Neem Oil (Azadirachtin 1500 ppm)",
        activeIngredient: "Azadirachtin 0.15% EC",
        type: "Organic",
        dosagePerLiter: "5 ml / L water",
        dosagePerAcre: "1 L in 200 L water / acre",
        spraySchedule: "Spray leaf undersides every 7 days in early stage",
        waitingPeriodDays: "1 day",
      },
      {
        name: "Flonicamid 50% WG",
        activeIngredient: "Flonicamid 50% WG",
        type: "Insecticide",
        dosagePerLiter: "0.4 g / L water",
        dosagePerAcre: "80 g in 150–200 L water / acre",
        spraySchedule: "Use when whitefly adults exceed 6 per leaf",
        waitingPeriodDays: "21 days before harvest",
      },
      {
        name: "Diafenthiuron 50% WP",
        activeIngredient: "Diafenthiuron 50% WP",
        type: "Insecticide",
        dosagePerLiter: "1 g / L water",
        dosagePerAcre: "200 g in 200 L water / acre",
        spraySchedule: "Spray thoroughly targeting underside of leaves",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Avoid synthetic pyrethroids early in season as they cause whitefly flare-ups. Direct nozzle upwards under leaves.",
  },
  {
    id: "cotton-pink-bollworm",
    crop: "Cotton",
    cropLocal: "कपास / ਨਰਮਾ",
    diseaseEnglish: "Pink Bollworm",
    diseaseLocal: "गुलाबी सुंडी / ਗੁਲਾਬੀ ਸੁੰਡੀ",
    category: "Pest",
    symptoms:
      "Rosette-shaped closed flowers and tiny entry holes in green cotton bolls with pink larvae feeding inside.",
    organicRemedy:
      "Install 4–5 Gossyplure pheromone traps per acre to monitor moths; pluck and destroy rosette flowers; spray Neem Oil 1500 ppm at early egg stage.",
    medicines: [
      {
        name: "Emamectin Benzoate 5% SG",
        activeIngredient: "Emamectin Benzoate 5% SG",
        type: "Insecticide",
        dosagePerLiter: "0.5 g / L water",
        dosagePerAcre: "80–100 g in 200 L water / acre",
        spraySchedule: "Spray at evening when moth catch crosses 8/trap for 3 nights",
        waitingPeriodDays: "10 days before picking",
      },
      {
        name: "Profenofos 50% EC",
        activeIngredient: "Profenofos 50% EC",
        type: "Insecticide",
        dosagePerLiter: "2.5 ml / L water",
        dosagePerAcre: "500 ml in 200 L water / acre",
        spraySchedule: "Alternate chemistry at 12–15 day interval if infestation persists",
        waitingPeriodDays: "15 days before picking",
      },
    ],
    safetyNote:
      "Do not mix multiple unrecommended insecticides together. Never graze cattle in fields after spraying.",
  },
  {
    id: "mustard-alternaria-blight",
    crop: "Mustard",
    cropLocal: "सरसों / ਸਰ੍ਹੋਂ",
    diseaseEnglish: "Alternaria Leaf & Pod Blight",
    diseaseLocal: "झुलसा रोग / ਝੁਲਸਾ ਰੋਗ",
    category: "Fungal",
    symptoms:
      "Dark brown to black concentric ring spots on lower leaves, stems, and siliquae (pods), reducing grain filling.",
    organicRemedy:
      "Remove lower blighted leaves and improve field airflow; use Trichoderma viride seed treatment before sowing.",
    medicines: [
      {
        name: "Mancozeb 75% WP",
        activeIngredient: "Mancozeb 75% WP",
        type: "Fungicide",
        dosagePerLiter: "2 g / L water",
        dosagePerAcre: "400 g in 200 L water / acre",
        spraySchedule: "1st spray at 45 days or first spot; repeat after 15 days",
        waitingPeriodDays: "15 days before harvest",
      },
      {
        name: "Azoxystrobin 11% + Tebuconazole 18.3% SC",
        activeIngredient: "Azoxystrobin + Tebuconazole",
        type: "Fungicide",
        dosagePerLiter: "1.5 ml / L water",
        dosagePerAcre: "300 ml in 200 L water / acre",
        spraySchedule: "For moderate-to-severe pod blight at flowering/pod stage",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Avoid spraying during peak midday sun to protect pollinators on mustard flowers.",
  },
  {
    id: "potato-tomato-late-blight",
    crop: "Vegetables",
    cropLocal: "आलू-टमाटर / ਆਲੂ-ਟਮਾਟਰ",
    diseaseEnglish: "Late Blight",
    diseaseLocal: "पछेती झुलसा / ਪਛੇਤਾ ਝੁਲਸਾ",
    category: "Fungal",
    symptoms:
      "Water-soaked dark green/brown patches on leaf tips turning black with white cottony fungal growth underneath in cool humid weather.",
    organicRemedy:
      "Stop overhead irrigation immediately; earth up potato ridges properly; apply Copper Oxychloride only preventively before wet fog.",
    medicines: [
      {
        name: "Cymoxanil 8% + Mancozeb 64% WP",
        activeIngredient: "Cymoxanil 8% + Mancozeb 64% WP",
        type: "Fungicide",
        dosagePerLiter: "2.5 g / L water",
        dosagePerAcre: "500 g in 200 L water / acre",
        spraySchedule: "Spray immediately upon first dark lesion; repeat every 7–10 days in fog",
        waitingPeriodDays: "10–14 days before harvest",
      },
      {
        name: "Dimethomorph 50% WP + Mancozeb",
        activeIngredient: "Dimethomorph 50% WP",
        type: "Fungicide",
        dosagePerLiter: "1 g / L water",
        dosagePerAcre: "200 g (+ 400 g Mancozeb) in 200 L water / acre",
        spraySchedule: "Alternate fungicide to prevent resistance in severe blight",
        waitingPeriodDays: "14 days before harvest",
      },
    ],
    safetyNote:
      "Wash vegetables thoroughly before consumption and respect pre-harvest waiting days strictly.",
  },
  {
    id: "zinc-deficiency-paddy",
    crop: "Paddy",
    cropLocal: "धान / ਝੋਨਾ",
    diseaseEnglish: "Khaira Disease (Zinc Deficiency)",
    diseaseLocal: "खैरा रोग / ਖੈਰਾ ਰੋਗ",
    category: "Deficiency",
    symptoms:
      "Rusty-brown patches on older/middle leaves 2–4 weeks after transplanting, stunted plant growth, patchy field yellowing.",
    organicRemedy:
      "Apply well-decomposed Farmyard Manure (FYM) before puddling; drain stagnant alkaline water temporarily.",
    medicines: [
      {
        name: "Zinc Sulphate (21% Zn) + Lime Spray",
        activeIngredient: "Zinc Sulphate Heptahydrate 21% + Slaked Lime",
        type: "Nutrient",
        dosagePerLiter: "5 g Zinc + 2.5 g Lime / L water",
        dosagePerAcre: "1 kg Zinc Sulphate + 500 g Lime in 200 L water / acre",
        spraySchedule: "2 foliar sprays at 10-day interval",
        waitingPeriodDays: "0 days (nutrient)",
      },
      {
        name: "Chelated Zinc (Zn-EDTA 12%)",
        activeIngredient: "Zn-EDTA 12%",
        type: "Nutrient",
        dosagePerLiter: "0.5–1 g / L water",
        dosagePerAcre: "100–150 g in 150–200 L water / acre",
        spraySchedule: "1–2 sprays on foliage for fast correction",
        waitingPeriodDays: "0 days (nutrient)",
      },
    ],
    safetyNote:
      "Dissolve Zinc Sulphate and Lime separately before mixing in the spray tank to prevent nozzle clogging.",
  },
  {
    id: "sugarcane-red-rot",
    crop: "Sugarcane",
    cropLocal: "गन्ना / ਗੰਨਾ",
    diseaseEnglish: "Sugarcane Red Rot",
    diseaseLocal: "लाल सड़न / ਲਾਲ ਸੜਨ",
    category: "Fungal",
    symptoms:
      "Yellowing and drying of 3rd–4th crown leaves; split stalks show red internal tissue with white cross-bands and sour alcoholic smell.",
    organicRemedy:
      "Uproot and burn affected clumps immediately; use healthy disease-free seed setts; treat soil with Trichoderma harzianum enriched FYM.",
    medicines: [
      {
        name: "Carbendazim 50% WP (Sett Dip)",
        activeIngredient: "Carbendazim 50% WP",
        type: "Fungicide",
        dosagePerLiter: "1 g / L water (sett dip)",
        dosagePerAcre: "200 g in 200 L water for dipping seed setts before planting",
        spraySchedule: "Dip seed setts for 15–20 minutes prior to planting",
        waitingPeriodDays: "Pre-planting seed treatment",
      },
      {
        name: "Thiophanate Methyl 70% WP",
        activeIngredient: "Thiophanate Methyl 70% WP",
        type: "Fungicide",
        dosagePerLiter: "1–1.5 g / L water",
        dosagePerAcre: "250 g in 200 L water (soil drench around root zone)",
        spraySchedule: "Drench neighboring healthy clumps after uprooting infected stools",
        waitingPeriodDays: "30 days",
      },
    ],
    safetyNote:
      "Do not allow irrigation water from infected plots to flow into healthy sugarcane fields.",
  },
  {
    id: "paddy-bph",
    crop: "Paddy",
    cropLocal: "धान / ਝੋਨਾ",
    diseaseEnglish: "Brown Plant Hopper (Hopper Burn / Tela)",
    diseaseLocal: "भूरा फुदका / ਭੂਰਾ ਤੇਲਾ",
    category: "Pest",
    symptoms:
      "Circular patches of drying brown paddy plants ('hopper burn'); tiny brown hoppers clustered at the base of rice tillers just above water level.",
    organicRemedy:
      "Drain standing water from the field for 3–4 days to break pest multiplication; avoid excess urea; part rice rows slightly for sunlight penetration.",
    medicines: [
      {
        name: "Pymetrozine 50% WG",
        activeIngredient: "Pymetrozine 50% WG",
        type: "Insecticide",
        dosagePerLiter: "0.6 g / L water",
        dosagePerAcre: "120 g in 200 L water / acre",
        spraySchedule: "Direct spray nozzle toward the base of rice plants when >10 hoppers/hill",
        waitingPeriodDays: "15–21 days before harvest",
      },
      {
        name: "Dinotefuran 20% SG",
        activeIngredient: "Dinotefuran 20% SG",
        type: "Insecticide",
        dosagePerLiter: "0.4 g / L water",
        dosagePerAcre: "80 g in 200 L water / acre",
        spraySchedule: "Single targeted basal spray; avoid synthetic pyrethroids",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Always direct spray to the lower stem base where hoppers hide, not just the top leaf canopy.",
  },
  {
    id: "wheat-karnal-smut",
    crop: "Wheat",
    cropLocal: "गेहूँ / ਕਣਕ",
    diseaseEnglish: "Wheat Powdery Mildew & Loose Smut",
    diseaseLocal: "चूर्णिल आसिता / ਚਿੱਟਾ ਚੂਰਨ ਰੋਗ",
    category: "Fungal",
    symptoms:
      "White flour-like powdery patches on wheat leaves and stems in cool, shaded areas, turning gray-brown later.",
    organicRemedy:
      "Ensure balanced potash fertilizer and avoid overcrowded sowing; remove weeds along bunds.",
    medicines: [
      {
        name: "Wettable Sulphur 80% WP",
        activeIngredient: "Sulphur 80% WP",
        type: "Organic",
        dosagePerLiter: "2.5 g / L water",
        dosagePerAcre: "500 g in 200 L water / acre",
        spraySchedule: "Spray during cool morning/evening hours at first white patch",
        waitingPeriodDays: "7 days",
      },
      {
        name: "Azoxystrobin 23% SC",
        activeIngredient: "Azoxystrobin 23% SC",
        type: "Fungicide",
        dosagePerLiter: "1 ml / L water",
        dosagePerAcre: "200 ml in 200 L water / acre",
        spraySchedule: "1 spray at flag leaf/booting stage if severe",
        waitingPeriodDays: "21 days before harvest",
      },
    ],
    safetyNote:
      "Do not spray Wettable Sulphur when daytime temperature exceeds 32°C to avoid leaf scorching.",
  },
];
