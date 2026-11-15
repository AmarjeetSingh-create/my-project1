import agronomistFieldBanner from "../assets/images/agronomist_field_banner_1794654470906.jpg";
import cottonWhiteflySample from "../assets/images/crop_sample_cotton_whitefly_1794654469603.jpg";
import riceBlastSample from "../assets/images/crop_sample_rice_blast_1794654470780.jpg";
import yellowRustSample from "../assets/images/crop_sample_yellow_rust_1794654469725.jpg";
import type { SampleCropCase, UiLanguage } from "../types/agronomy";

export const FIELD_BANNER_IMAGE = agronomistFieldBanner;

export const LANGUAGE_OPTIONS: Array<{
  id: UiLanguage;
  nativeLabel: string;
  englishLabel: string;
}> = [
  { id: "english", nativeLabel: "English", englishLabel: "English" },
  { id: "hindi", nativeLabel: "हिंदी", englishLabel: "Hindi" },
  { id: "punjabi", nativeLabel: "ਪੰਜਾਬੀ", englishLabel: "Punjabi" },
  { id: "marathi", nativeLabel: "मराठी", englishLabel: "Marathi" },
  { id: "gujarati", nativeLabel: "ગુજરાતી", englishLabel: "Gujarati" },
  { id: "bengali", nativeLabel: "বাংলা", englishLabel: "Bengali" },
  { id: "tamil", nativeLabel: "தமிழ்", englishLabel: "Tamil" },
  { id: "telugu", nativeLabel: "తెలుగు", englishLabel: "Telugu" },
];

export const SAMPLE_CROP_CASES: SampleCropCase[] = [
  {
    id: "wheat-yellow-rust",
    imageUrl: yellowRustSample,
    cropType: "Wheat",
    title: {
      english: "Wheat Leaf Stripes",
      hindi: "गेहूँ में पीली धारियाँ",
      punjabi: "ਕਣਕ ਦੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲਾ ਰਤੂਆ",
      marathi: "गव्हाच्या पानांवर पिवळे पट्टे",
      gujarati: "ઘઉંના પાંદડા પર પીળા પટ્ટા",
      bengali: "গমের পাতায় হলুদ দাগ",
      tamil: "கோதுமை இலை மஞ்சள் துரு",
      telugu: "గోధుమ ఆకులపై పసుపు చారలు",
    },
    subtitle: {
      english: "Yellow powder lines on foliage",
      hindi: "पत्तों पर पीला पाउडर और धारियाँ",
      punjabi: "ਪੱਤਿਆਂ ਤੇ ਪੀਲਾ ਪਾਊਡਰ ਤੇ ਧਾਰੀਆਂ",
      marathi: "पानांवर पिवळी पावडर व रेषा",
      gujarati: "પાંદડા પર પીળો પાવડર",
      bengali: "পাতায় হলুদ গুঁড়ো ও রেখা",
      tamil: "இலைகளில் மஞ்சள் தூள் வரிகள்",
      telugu: "ఆకులపై పసుపు పొడి చారలు",
    },
    sampleNote: {
      english:
        "My wheat leaves have bright yellow powder lines spreading across the field after morning fog.",
      hindi:
        "सुबह की धुंध के बाद मेरी गेहूँ की फसल के पत्तों पर पीला रतुआ जैसा पाउडर दिख रहा है।",
      punjabi:
        "ਸਵੇਰ ਦੀ ਧੁੰਦ ਤੋਂ ਬਾਅਦ ਮੇਰੀ ਕਣਕ ਦੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲਾ ਰਤੂਆ ਲੱਗ ਗਿਆ ਹੈ, ਹੱਥ ਲਾਉਣ ਤੇ ਪੀਲਾ ਪਾਊਡਰ ਲੱਗਦਾ ਹੈ।",
      marathi:
        "सकाळच्या धुक्यानंतर माझ्या गव्हाच्या पानांवर पिवळा तांबेरा रोगासारखी पावडर दिसत आहे.",
      gujarati:
        "સવારના ધુમ્મસ પછી મારા ઘઉંના પાંદડા પર પીળા રંગનો પાવડર દેખાય છે.",
      bengali:
        "সকালের কুয়াশার পর আমার গম গাছের পাতায় হলুদ মরিচা রোগের মতো গুঁড়ো দেখা যাচ্ছে।",
      tamil:
        "காலை பனிக்குப் பிறகு என் கோதுமை இலைகளில் மஞ்சள் தூள் போன்ற கோடுகள் தெரிகின்றன.",
      telugu:
        "ఉదయం మంచు తర్వాత నా గోధుమ ఆకులపై పసుపు రంగు పొడి చారలు కనిపిస్తున్నాయి.",
    },
  },
  {
    id: "cotton-whitefly",
    imageUrl: cottonWhiteflySample,
    cropType: "Cotton",
    title: {
      english: "Cotton Leaf Curl & Whitefly",
      hindi: "कपास में सफेद मक्खी और पत्ते मुड़ना",
      punjabi: "ਨਰਮੇ ਤੇ ਚਿੱਟਾ ਮੱਛਰ ਤੇ ਪੱਤੇ ਮੁੜਨਾ",
      marathi: "कापसावर पांढरी माशी व पानमुरडा",
      gujarati: "કપાસમાં સફેદ માખી અને પાન વળવા",
      bengali: "তুলোয় সাদা মাছি ও পাতা কুঁকড়ানো",
      tamil: "பருத்தி வெள்ளை ஈ மற்றும் இலை சுருட்டு",
      telugu: "పత్తిలో తెల్లదోమ మరియు ఆకు ముడత",
    },
    subtitle: {
      english: "Tiny white insects & leaf yellowing",
      hindi: "पत्तों के नीचे सफेद मक्खी व पीलापन",
      punjabi: "ਪੱਤਿਆਂ ਹੇਠਾਂ ਚਿੱਟਾ ਮੱਛਰ ਅਤੇ ਪੀਲਾਪਣ",
      marathi: "पानांखाली पांढरी माशी व पिवळेपणा",
      gujarati: "પાંદડા નીચે સફેદ માખી અને પીળાશ",
      bengali: "পাতার নিচে সাদা মাছি ও হলদে ভাব",
      tamil: "இலைகளுக்கு அடியில் வெள்ளை ஈ",
      telugu: "ఆకుల కింద తెల్లదోమ మరియు పసుపు రంగు",
    },
    sampleNote: {
      english:
        "Tiny white flies are under my cotton leaves and leaves are curling and turning yellow.",
      hindi:
        "मेरी कपास की फसल में सफेद मक्खी और तेला लगा है, पत्ते पीले पड़कर मुड़ रहे हैं।",
      punjabi:
        "ਮੇਰੇ ਨਰਮੇ ਤੇ ਚਿੱਟਾ ਮੱਛਰ ਅਤੇ ਤੇਲਾ ਲੱਗ ਗਿਆ ਹੈ, ਪੱਤੇ ਪੀਲੇ ਹੋ ਕੇ ਮੁੜ ਰਹੇ ਹਨ।",
      marathi:
        "माझ्या कापसाच्या पिकावर पांढरी माशी आणि मावा आला आहे, पाने पिवळी पडून मुडपली आहेत.",
      gujarati:
        "મારા કપાસના પાકમાં સફેદ માખી આવી ગઈ છે અને પાંદડા પીળા પડીને વળી રહ્યા છે.",
      bengali:
        "আমার তুলো গাছে সাদা মাছি লেগেছে এবং পাতা হলুদ হয়ে কুঁকড়ে যাচ্ছে।",
      tamil:
        "என் பருத்தி இலைகளில் வெள்ளை ஈக்கள் உள்ளன, இலைகள் மஞ்சளாகி சுருண்டு வருகின்றன.",
      telugu:
        "నా పత్తి ఆకుల కింద తెల్లదోమ ఉంది, ఆకులు పసుపు రంగులోకి మారి ముడుచుకుపోతున్నాయి.",
    },
  },
  {
    id: "rice-blast",
    imageUrl: riceBlastSample,
    cropType: "Paddy",
    title: {
      english: "Paddy Leaf Spots",
      hindi: "धान के पत्तों पर भूरे धब्बे",
      punjabi: "ਝੋਨੇ ਦੇ ਪੱਤਿਆਂ ਤੇ ਭੂਰੇ ਧੱਬੇ",
      marathi: "भाताच्या पानांवर करपा ठिपके",
      gujarati: "ડાંગરના પાંદડા પર ભૂરા ટપકાં",
      bengali: "ধানের পাতায় বাদামী দাগ",
      tamil: "நெல் இலை குலைநோய் புள்ளிகள்",
      telugu: "వరి ఆకులపై అగ్గితెగులు మచ్చలు",
    },
    subtitle: {
      english: "Spindle-shaped gray lesions",
      hindi: "आँख के आकार के भूरे-स्लेटी धब्बे",
      punjabi: "ਅੱਖ ਵਰਗੇ ਭੂਰੇ-ਸਲੇਟੀ ਧੱਬੇ",
      marathi: "डोळ्याच्या आकाराचे करडे-तपकिरी ठिपके",
      gujarati: "આંખ જેવા ભૂખરા-બદામી ડાઘ",
      bengali: "চোখের মতো ধূসর-বাদামী দাগ",
      tamil: "கண் வடிவ சாம்பல் நிற புள்ளிகள்",
      telugu: "కంటి ఆకారంలో బూడిద-గోధుమ మచ్చలు",
    },
    sampleNote: {
      english: "My paddy crop has gray-brown diamond-shaped spots on the leaves.",
      hindi: "मेरी धान की फसल के पत्तों पर भूरे और स्लेटी रंग के धब्बे बढ़ रहे हैं।",
      punjabi: "ਮੇਰੇ ਝੋਨੇ ਦੇ ਪੱਤਿਆਂ ਤੇ ਭੂਰੇ ਧੱਬੇ ਪੈ ਰਹੇ ਹਨ, ਕਿਰਪਾ ਕਰਕੇ ਇਲਾਜ ਦੱਸੋ।",
      marathi: "माझ्या भाताच्या पानांवर करपा रोगाचे ठिपके वाढत आहेत, कृपया औषध सांगा.",
      gujarati: "મારી ડાંગરના પાંદડા પર ભૂરા ટપકાં પડી રહ્યા છે, કૃપા કરીને દવા જણાવો.",
      bengali: "আমার ধানের পাতায় বাদামী ও ধূসর দাগ বাড়ছে, অনুগ্রহ করে ওষুধ বলুন।",
      tamil: "என் நெல் பயிரின் இலைகளில் சாம்பல் நிற புள்ளிகள் உள்ளன, மருந்து கூறுங்கள்.",
      telugu: "నా వరి ఆకులపై గోధుమ రంగు మచ్చలు పెరుగుతున్నాయి, దయచేసి మందు చెప్పండి.",
    },
  },
];

export const CROP_OPTIONS: Array<{
  value: string;
  label: Record<UiLanguage, string>;
}> = [
  {
    value: "auto",
    label: {
      english: "Auto-detect crop",
      hindi: "फ़सल अपने आप पहचानें",
      punjabi: "ਫ਼ਸਲ ਆਪਣੇ ਆਪ ਪਛਾਣੋ",
      marathi: "पीक आपोआप ओळखा",
      gujarati: "પાક આપમેળે ઓળખો",
      bengali: "ফসল স্বয়ংক্রিয়ভাবে শনাক্ত করুন",
      tamil: "பயிரை தானாக கண்டறி",
      telugu: "పంటను స్వయంగా గుర్తించు",
    },
  },
  {
    value: "Wheat",
    label: {
      english: "Wheat (Kanak / Gehun)",
      hindi: "गेहूँ",
      punjabi: "ਕਣਕ",
      marathi: "गहू",
      gujarati: "ઘઉં",
      bengali: "গম",
      tamil: "கோதுமை",
      telugu: "గోధుమ",
    },
  },
  {
    value: "Paddy",
    label: {
      english: "Paddy / Rice (Jhona)",
      hindi: "धान",
      punjabi: "ਝੋਨਾ",
      marathi: "भात / तांदूळ",
      gujarati: "ડાંગર",
      bengali: "ধান",
      tamil: "நெல்",
      telugu: "వరి",
    },
  },
  {
    value: "Cotton",
    label: {
      english: "Cotton (Narma)",
      hindi: "कपास / नरमा",
      punjabi: "ਨਰਮਾ / ਕਪਾਹ",
      marathi: "कापूस",
      gujarati: "કપાસ",
      bengali: "তুলা",
      tamil: "பருத்தி",
      telugu: "పత్తి",
    },
  },
  {
    value: "Sugarcane",
    label: {
      english: "Sugarcane (Ganna)",
      hindi: "गन्ना",
      punjabi: "ਗੰਨਾ",
      marathi: "ऊस",
      gujarati: "શેરડી",
      bengali: "আখ",
      tamil: "கரும்பு",
      telugu: "చెరకు",
    },
  },
  {
    value: "Mustard",
    label: {
      english: "Mustard (Sarson)",
      hindi: "सरसों",
      punjabi: "ਸਰ੍ਹੋਂ",
      marathi: "मोहरी",
      gujarati: "રાઈ / સરસવ",
      bengali: "সরিষা",
      tamil: "கடுகு",
      telugu: "ఆవాలు",
    },
  },
  {
    value: "Vegetables",
    label: {
      english: "Vegetables / Potato / Tomato",
      hindi: "सब्ज़ियाँ / आलू / टमाटर",
      punjabi: "ਸਬਜ਼ੀਆਂ / ਆਲੂ / ਟਮਾਟਰ",
      marathi: "भाजीपाला / बटाटा / टोमॅटो",
      gujarati: "શાકભાજી / બટાકા / ટામેટા",
      bengali: "সবজি / আলু / টমেটো",
      tamil: "காய்கறிகள் / உருளை / தக்காளி",
      telugu: "కూరగాయలు / బంగాళదుంప / టమాటా",
    },
  },
];

export interface UiCopy {
  brandName: string;
  brandSub: string;
  navClinic: string;
  navWhatsapp: string;
  navMedicines: string;
  navPlanner: string;
  languageLabel: string;
  breadcrumbClinic: string;
  newCheck: string;
  historyTitle: string;
  searchHistoryPlaceholder: string;
  noHistory: string;
  samplesSidebarTitle: string;
  heroTitle: string;
  heroBody: string;
  heroMeta: string;
  photoStepTitle: string;
  photoDropHint: string;
  uploadPhotoBtn: string;
  takePhotoBtn: string;
  removePhotoBtn: string;
  orTrySample: string;
  voiceStepTitle: string;
  recordVoiceBtn: string;
  stopRecordingBtn: string;
  cancelRecordingBtn: string;
  transcribingLabel: string;
  symptomPlaceholder: string;
  cropLabel: string;
  diagnoseBtn: string;
  diagnosingBtn: string;
  farmerQueryLabel: string;
  listenAdvice: string;
  preparingAudio: string;
  stopAudio: string;
  copyWhatsapp: string;
  copiedWhatsapp: string;
  viewWhatsappFormat: string;
  hideWhatsappFormat: string;
  openInWhatsapp: string;
  sectionDiagnosis: string;
  sectionCause: string;
  sectionSolution: string;
  organicFirstTitle: string;
  chemicalOptionTitle: string;
  medicinesTableTitle: string;
  safetyTitle: string;
  sectionPrevention: string;
  followUpTitle: string;
  followUpPlaceholder: string;
  sendFollowUp: string;
  sendingFollowUp: string;
  severityLabels: {
    Low: string;
    Moderate: string;
    Severe: string;
  };
  quickVoicePhrasesLabel: string;
  quickVoicePhrases: Array<{ label: string; text: string }>;
  micErrorFallback: string;
  photoRequiredError: string;
  closePreview: string;
  deleteCaseLabel: string;
  loadingSkeletonTitle: string;
  loadingSkeletonSub: string;
  whatsappTitle: string;
  whatsappSubtitle: string;
  whatsappWelcome: string;
  whatsappInputPlaceholder: string;
  whatsappWebhookBtn: string;
  whatsappClearChat: string;
  medicinesTitle: string;
  medicinesSubtitle: string;
  medicinesSearchPlaceholder: string;
  allCropsFilter: string;
  askInWhatsappBtn: string;
}

const ENGLISH_COPY: UiCopy = {
  brandName: "Kisan Mitra",
  brandSub: "AI Agronomist · India",
  navClinic: "Field Clinic",
  navWhatsapp: "WhatsApp Bot",
  navMedicines: "Medicines",
  navPlanner: "Spray Planner",
  languageLabel: "Language",
  breadcrumbClinic: "Field Clinic",
  newCheck: "New Check",
  historyTitle: "Saved Consultations",
  searchHistoryPlaceholder: "Search crop or disease...",
  noHistory: "No saved checks yet. Upload a crop photo or record a voice note to begin.",
  samplesSidebarTitle: "Field Sample Cases",
  heroTitle: "Accurate crop diagnosis & medicines in your language",
  heroBody:
    "Send a clear photo of an affected leaf, stem, or root—or speak in your own language—for organic-first remedies, exact medicine dosages, and WhatsApp advice.",
  heroMeta: "8 Indian Languages · Organic First · Exact Medicine Dosages",
  photoStepTitle: "1. Crop Photo",
  photoDropHint: "Drag a leaf, stem, or root photo here, or capture with your camera.",
  uploadPhotoBtn: "Upload Photo",
  takePhotoBtn: "Use Camera",
  removePhotoBtn: "Remove Photo",
  orTrySample: "Or load a real field sample:",
  voiceStepTitle: "2. Voice Note or Symptom Description",
  recordVoiceBtn: "Record Voice Note",
  stopRecordingBtn: "Stop & Transcribe",
  cancelRecordingBtn: "Cancel",
  transcribingLabel: "Transcribing voice note...",
  symptomPlaceholder:
    "Describe symptoms in Punjabi, Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, or English...",
  cropLabel: "Crop Type",
  diagnoseBtn: "Diagnose Crop",
  diagnosingBtn: "Analyzing Crop...",
  farmerQueryLabel: "Farmer Observation",
  listenAdvice: "Listen to Advice",
  preparingAudio: "Preparing Audio...",
  stopAudio: "Stop Audio",
  copyWhatsapp: "Copy for WhatsApp",
  copiedWhatsapp: "Copied",
  viewWhatsappFormat: "WhatsApp View",
  hideWhatsappFormat: "Structured View",
  openInWhatsapp: "Share on WhatsApp",
  sectionDiagnosis: "🩺 Diagnosis (पहचान / ਪਛਾਣ)",
  sectionCause: "🔍 Cause (कारण / ਕਾਰਨ)",
  sectionSolution: "💊 Solution & Medicines (उपचार व दवा / ਇਲਾਜ ਅਤੇ ਦਵਾਈਆਂ)",
  organicFirstTitle: "Organic & Home Remedy (First Step)",
  chemicalOptionTitle: "Chemical Treatment Summary",
  medicinesTableTitle: "Recommended Medicines & Exact Dosages",
  safetyTitle: "Safety Precautions & Waiting Period",
  sectionPrevention: "🛡️ Prevention (बचाव / ਬਚਾਅ)",
  followUpTitle: "Ask a Follow-up Question",
  followUpPlaceholder: "Ask about spray timing, mixing, or local alternatives...",
  sendFollowUp: "Ask Kisan Mitra",
  sendingFollowUp: "Replying...",
  severityLabels: {
    Low: "Low Severity",
    Moderate: "Moderate Severity",
    Severe: "Severe Attention Needed",
  },
  quickVoicePhrasesLabel: "Common field phrases:",
  quickVoicePhrases: [
    {
      label: "ਕਣਕ · ਪੀਲਾ ਰਤੂਆ",
      text: "ਮੇਰੀ ਕਣਕ ਦੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲਾ ਰਤੂਆ ਲੱਗ ਗਿਆ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਦਵਾਈ ਤੇ ਦੇਸੀ ਤਰੀਕਾ ਦੱਸੋ।",
    },
    {
      label: "कपास · तेला / सफेद मक्खी",
      text: "कपास के पत्तों पर सफेद मक्खी और तेला लगा है, पत्ते चिपचिपे हो रहे हैं।",
    },
    {
      label: "मराठी · करपा रोग",
      text: "माझ्या पिकाच्या पानांवर तपकिरी ठिपके पडत आहेत, योग्य औषध आणि प्रमाण सांगा.",
    },
  ],
  micErrorFallback:
    "Microphone access was blocked or unavailable. You can type or paste your crop issue directly.",
  photoRequiredError: "Please add a crop photo or describe the problem before diagnosing.",
  closePreview: "Close",
  deleteCaseLabel: "Delete consultation",
  loadingSkeletonTitle: "Examining crop symptoms and medicines...",
  loadingSkeletonSub: "Preparing organic remedies, exact per-liter dosage, and safety notes.",
  whatsappTitle: "Kisan Mitra WhatsApp Chatbot",
  whatsappSubtitle: "Send crop photos, voice notes, or questions just like on WhatsApp",
  whatsappWelcome:
    "Sat Sri Akal / Namaste! I am Kisan Mitra, your WhatsApp AI Agronomist. Send me a photo of any diseased leaf, record a voice note in your language, or ask for exact crop medicine dosages.",
  whatsappInputPlaceholder: "Type a message or paste symptoms in your language...",
  whatsappWebhookBtn: "Connect Real WhatsApp",
  whatsappClearChat: "Clear Chat",
  medicinesTitle: "Crop Diseases & Medicines Guide",
  medicinesSubtitle:
    "Verified organic remedies and active-ingredient chemical medicines with exact per-liter and per-acre dosages",
  medicinesSearchPlaceholder: "Search disease, pest, medicine, or crop...",
  allCropsFilter: "All Crops",
  askInWhatsappBtn: "Ask in WhatsApp Bot",
};

export const UI_COPY: Record<UiLanguage, UiCopy> = {
  english: ENGLISH_COPY,
  hindi: {
    ...ENGLISH_COPY,
    brandName: "किसान मित्र",
    brandSub: "कृषि सलाहकार · भारत",
    navClinic: "फ़सल क्लिनिक",
    navWhatsapp: "WhatsApp बॉट",
    navMedicines: "दवा और रोग",
    navPlanner: "स्प्रे प्लानर",
    languageLabel: "भाषा",
    breadcrumbClinic: "फ़सल क्लिनिक",
    newCheck: "नई जाँच",
    historyTitle: "पुरानी जाँचें",
    searchHistoryPlaceholder: "फ़सल या रोग खोजें...",
    noHistory: "अभी कोई जाँच सहेजी नहीं गई है। शुरू करने के लिए फ़ोटो डालें या आवाज़ रिकॉर्ड करें।",
    samplesSidebarTitle: "खेत के नमूने",
    heroTitle: "आपकी भाषा में सटीक फ़सल पहचान व दवा सलाह",
    heroBody:
      "प्रभावित पत्ते, तने या जड़ की साफ फ़ोटो भेजें—या अपनी भाषा में बोलकर बताएँ। पहले जैविक उपाय और फिर सुरक्षित दवा की सटीक मात्रा पाएँ।",
    heroMeta: "8 भारतीय भाषाएँ · पहले जैविक उपाय · सटीक दवा मात्रा",
    photoStepTitle: "1. फ़सल की फ़ोटो",
    photoDropHint: "पत्ते, तने या जड़ की फ़ोटो यहाँ डालें, या कैमरे से खींचें।",
    uploadPhotoBtn: "फ़ोटो चुनें",
    takePhotoBtn: "कैमरा खोलें",
    removePhotoBtn: "फ़ोटो हटाएँ",
    orTrySample: "या खेत के इन नमूनों से जाँच करें:",
    voiceStepTitle: "2. आवाज़ रिकॉर्ड करें या लक्षण लिखें",
    recordVoiceBtn: "आवाज़ रिकॉर्ड करें",
    stopRecordingBtn: "रोकें और लिखें",
    cancelRecordingBtn: "रद्द करें",
    transcribingLabel: "आवाज़ को लिखा जा रहा है...",
    symptomPlaceholder:
      "अपनी समस्या हिंदी, पंजाबी, मराठी या किसी भी भाषा में लिखें...",
    cropLabel: "फ़सल चुनें",
    diagnoseBtn: "रोग की जाँच करें",
    diagnosingBtn: "जाँच हो रही है...",
    farmerQueryLabel: "किसान का सवाल",
    listenAdvice: "सलाह सुनें",
    preparingAudio: "आवाज़ तैयार हो रही है...",
    stopAudio: "आवाज़ रोकें",
    copyWhatsapp: "WhatsApp के लिए कॉपी",
    copiedWhatsapp: "कॉपी हो गया",
    viewWhatsappFormat: "WhatsApp रूप",
    hideWhatsappFormat: "विस्तृत रूप",
    openInWhatsapp: "WhatsApp पर भेजें",
    sectionDiagnosis: "🩺 पहचान (Diagnosis)",
    sectionCause: "🔍 कारण (Cause)",
    sectionSolution: "💊 उपचार और दवाइयाँ (Medicines)",
    organicFirstTitle: "देसी और जैविक उपाय (पहला कदम)",
    chemicalOptionTitle: "रासायनिक उपचार सारांश",
    medicinesTableTitle: "सुझाई गई दवाइयाँ व सटीक मात्रा",
    safetyTitle: "जरूरी सुरक्षा सावधानियाँ",
    sectionPrevention: "🛡️ बचाव (Prevention)",
    followUpTitle: "अगला सवाल पूछें",
    followUpPlaceholder: "छिड़काव के समय, मात्रा या दवा के बारे में पूछें...",
    sendFollowUp: "किसान मित्र से पूछें",
    sendingFollowUp: "जवाब आ रहा है...",
    severityLabels: {
      Low: "कम प्रकोप",
      Moderate: "मध्यम प्रकोप",
      Severe: "गंभीर प्रकोप",
    },
    whatsappTitle: "किसान मित्र WhatsApp चैटबॉट",
    whatsappSubtitle: "सीधे WhatsApp चैट की तरह फ़सल की फ़ोटो, आवाज़ या सवाल भेजें",
    whatsappWelcome:
      "नमस्ते किसान भाई! मैं किसान मित्र WhatsApp कृषि विशेषज्ञ हूँ। मुझे अपनी फ़सल की फ़ोटो भेजें, आवाज़ रिकॉर्ड करें या रोग व दवा की सही मात्रा पूछें।",
    whatsappInputPlaceholder: "अपना संदेश लिखें या आवाज़ रिकॉर्ड करें...",
    whatsappWebhookBtn: "असली WhatsApp जोड़ें",
    whatsappClearChat: "चैट साफ़ करें",
    medicinesTitle: "फ़सल रोग एवं दवा निर्देशिका",
    medicinesSubtitle:
      "प्रमुख फ़सल रोगों के लिए जैविक उपाय और प्रति लीटर / प्रति एकड़ सटीक दवा मात्रा",
    medicinesSearchPlaceholder: "रोग, कीट, दवा या फ़सल खोजें...",
    allCropsFilter: "सभी फ़सलें",
    askInWhatsappBtn: "WhatsApp बॉट में पूछें",
  },
  punjabi: {
    ...ENGLISH_COPY,
    brandName: "ਕਿਸਾਨ ਮਿੱਤਰ",
    brandSub: "ਖੇਤੀਬਾੜੀ ਸਲਾਹਕਾਰ · ਭਾਰਤ",
    navClinic: "ਫ਼ਸਲ ਕਲੀਨਿਕ",
    navWhatsapp: "WhatsApp ਬੋਟ",
    navMedicines: "ਦਵਾਈਆਂ ਤੇ ਰੋਗ",
    navPlanner: "ਸਪਰੇਅ ਪਲੈਨਰ",
    languageLabel: "ਭਾਸ਼ਾ",
    breadcrumbClinic: "ਫ਼ਸਲ ਕਲੀਨਿਕ",
    newCheck: "ਨਵੀਂ ਜਾਂਚ",
    historyTitle: "ਪਿਛਲੀਆਂ ਜਾਂਚਾਂ",
    searchHistoryPlaceholder: "ਫ਼ਸਲ ਜਾਂ ਰੋਗ ਲੱਭੋ...",
    noHistory: "ਹਾਲੇ ਕੋਈ ਜਾਂਚ ਸੁਰੱਖਿਅਤ ਨਹੀਂ ਹੈ। ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਫ਼ੋਟੋ ਭੇਜੋ ਜਾਂ ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ।",
    samplesSidebarTitle: "ਖੇਤ ਦੇ ਨਮੂਨੇ",
    heroTitle: "ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਹੀ ਫ਼ਸਲ ਪਛਾਣ ਤੇ ਦਵਾਈ ਸਲਾਹ",
    heroBody:
      "ਖ਼ਰਾਬ ਪੱਤੇ, ਤਣੇ ਜਾਂ ਜੜ੍ਹ ਦੀ ਸਾਫ਼ ਫ਼ੋਟੋ ਭੇਜੋ—ਜਾਂ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲ ਕੇ ਦੱਸੋ। ਪਹਿਲਾਂ ਦੇਸੀ ਉਪਾਅ ਅਤੇ ਫਿਰ ਸਹੀ ਦਵਾਈ ਦੀ ਮਾਤਰਾ ਜਾਣੋ।",
    heroMeta: "8 ਭਾਰਤੀ ਭਾਸ਼ਾਵਾਂ · ਪਹਿਲਾਂ ਦੇਸੀ ਉਪਾਅ · ਸਹੀ ਦਵਾਈ ਮਾਤਰਾ",
    photoStepTitle: "1. ਫ਼ਸਲ ਦੀ ਫ਼ੋਟੋ",
    photoDropHint: "ਪੱਤੇ, ਤਣੇ ਜਾਂ ਜੜ੍ਹ ਦੀ ਫ਼ੋਟੋ ਇੱਥੇ ਪਾਓ, ਜਾਂ ਕੈਮਰੇ ਨਾਲ ਖਿੱਚੋ।",
    uploadPhotoBtn: "ਫ਼ੋਟੋ ਚੁਣੋ",
    takePhotoBtn: "ਕੈਮਰਾ ਖੋਲ੍ਹੋ",
    removePhotoBtn: "ਫ਼ੋਟੋ ਹਟਾਓ",
    orTrySample: "ਜਾਂ ਇਨ੍ਹਾਂ ਖੇਤ ਦੇ ਨਮੂਨਿਆਂ ਨਾਲ ਜਾਂਚ ਕਰੋ:",
    voiceStepTitle: "2. ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ ਜਾਂ ਸਮੱਸਿਆ ਲਿਖੋ",
    recordVoiceBtn: "ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ",
    stopRecordingBtn: "ਰੋਕੋ ਤੇ ਲਿਖੋ",
    cancelRecordingBtn: "ਰੱਦ ਕਰੋ",
    transcribingLabel: "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਲਿਖੀ ਜਾ ਰਹੀ ਹੈ...",
    symptomPlaceholder: "ਪੰਜਾਬੀ, ਹਿੰਦੀ ਜਾਂ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਮੱਸਿਆ ਦੱਸੋ...",
    cropLabel: "ਫ਼ਸਲ ਦੀ ਕਿਸਮ",
    diagnoseBtn: "ਰੋਗ ਦੀ ਜਾਂਚ ਕਰੋ",
    diagnosingBtn: "ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ...",
    farmerQueryLabel: "ਕਿਸਾਨ ਦਾ ਸਵਾਲ",
    listenAdvice: "ਸਲਾਹ ਸੁਣੋ",
    preparingAudio: "ਆਵਾਜ਼ ਤਿਆਰ ਹੋ ਰਹੀ ਹੈ...",
    stopAudio: "ਆਵਾਜ਼ ਬੰਦ ਕਰੋ",
    copyWhatsapp: "WhatsApp ਲਈ ਕਾਪੀ",
    copiedWhatsapp: "ਕਾਪੀ ਹੋ ਗਿਆ",
    viewWhatsappFormat: "WhatsApp ਰੂਪ",
    hideWhatsappFormat: "ਪੂਰਾ ਵੇਰਵਾ",
    openInWhatsapp: "WhatsApp ਤੇ ਭੇਜੋ",
    sectionDiagnosis: "🩺 ਪਛਾਣ (Diagnosis)",
    sectionCause: "🔍 ਕਾਰਨ (Cause)",
    sectionSolution: "💊 ਇਲਾਜ ਅਤੇ ਦਵਾਈਆਂ (Medicines)",
    organicFirstTitle: "ਦੇਸੀ ਅਤੇ ਜੈਵਿਕ ਇਲਾਜ (ਪਹਿਲਾ ਕਦਮ)",
    chemicalOptionTitle: "ਦਵਾਈ ਬਾਰੇ ਸਾਰ",
    medicinesTableTitle: "ਸੁਝਾਈਆਂ ਦਵਾਈਆਂ ਅਤੇ ਸਹੀ ਮਾਤਰਾ",
    safetyTitle: "ਜ਼ਰੂਰੀ ਸੁਰੱਖਿਆ ਸਾਵਧਾਨੀਆਂ",
    sectionPrevention: "🛡️ ਬਚਾਅ (Prevention)",
    followUpTitle: "ਅਗਲਾ ਸਵਾਲ ਪੁੱਛੋ",
    followUpPlaceholder: "ਛਿੜਕਾਅ ਦੇ ਸਮੇਂ, ਮਾਤਰਾ ਜਾਂ ਦਵਾਈ ਬਾਰੇ ਪੁੱਛੋ...",
    sendFollowUp: "ਕਿਸਾਨ ਮਿੱਤਰ ਨੂੰ ਪੁੱਛੋ",
    sendingFollowUp: "ਜਵਾਬ ਆ ਰਿਹਾ ਹੈ...",
    severityLabels: {
      Low: "ਘੱਟ ਹਮਲਾ",
      Moderate: "ਦਰਮਿਆਨਾ ਹਮਲਾ",
      Severe: "ਗੰਭੀਰ ਹਮਲਾ",
    },
    whatsappTitle: "ਕਿਸਾਨ ਮਿੱਤਰ WhatsApp ਚੈਟਬੋਟ",
    whatsappSubtitle: "WhatsApp ਵਾਂਗ ਸਿੱਧਾ ਫ਼ਸਲ ਦੀ ਫ਼ੋਟੋ, ਆਵਾਜ਼ ਜਾਂ ਸਵਾਲ ਭੇਜੋ",
    whatsappWelcome:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਕਿਸਾਨ ਮਿੱਤਰ WhatsApp ਖੇਤੀਬਾੜੀ ਮਾਹਿਰ ਹਾਂ। ਮੈਨੂੰ ਖ਼ਰਾਬ ਫ਼ਸਲ ਦੀ ਫ਼ੋਟੋ ਭੇਜੋ, ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ ਜਾਂ ਦਵਾਈਆਂ ਦੀ ਸਹੀ ਮਾਤਰਾ ਪੁੱਛੋ।",
    whatsappInputPlaceholder: "ਆਪਣਾ ਸੁਨੇਹਾ ਲਿਖੋ ਜਾਂ ਆਵਾਜ਼ ਰਿਕਾਰਡ ਕਰੋ...",
    whatsappWebhookBtn: "ਅਸਲੀ WhatsApp ਜੋੜੋ",
    whatsappClearChat: "ਚੈਟ ਸਾਫ਼ ਕਰੋ",
    medicinesTitle: "ਫ਼ਸਲ ਰੋਗ ਅਤੇ ਦਵਾਈਆਂ ਦੀ ਸੂਚੀ",
    medicinesSubtitle:
      "ਮੁੱਖ ਫ਼ਸਲਾਂ ਦੇ ਰੋਗਾਂ ਲਈ ਦੇਸੀ ਉਪਾਅ ਅਤੇ ਪ੍ਰਤੀ ਲੀਟਰ / ਪ੍ਰਤੀ ਏਕੜ ਸਹੀ ਦਵਾਈ ਮਾਤਰਾ",
    medicinesSearchPlaceholder: "ਰੋਗ, ਕੀੜਾ, ਦਵਾਈ ਜਾਂ ਫ਼ਸਲ ਲੱਭੋ...",
    allCropsFilter: "ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ",
    askInWhatsappBtn: "WhatsApp ਬੋਟ ਵਿੱਚ ਪੁੱਛੋ",
  },
  marathi: {
    ...ENGLISH_COPY,
    brandName: "किसान मित्र",
    brandSub: "कृषी सल्लागार · भारत",
    navClinic: "पीक क्लिनिक",
    navWhatsapp: "WhatsApp बॉट",
    navMedicines: "औषधे व रोग",
    navPlanner: "फवारणी नियोजक",
    languageLabel: "भाषा",
    breadcrumbClinic: "पीक क्लिनिक",
    newCheck: "नवीन तपासणी",
    historyTitle: "मागील तपासण्या",
    searchHistoryPlaceholder: "पीक किंवा रोग शोधा...",
    noHistory: "अजून कोणतीही तपासणी जतन केलेली नाही. सुरू करण्यासाठी फोटो किंवा आवाज पाठवा.",
    samplesSidebarTitle: "शेतातील नमुने",
    heroTitle: "तुमच्या भाषेत अचूक पीक निदान आणि औषध सल्ला",
    heroBody:
      "रोगट पानाचा, खोडाचा किंवा मुळाचा फोटो पाठवा—किंवा मराठीत बोलून समस्या सांगा. सेंद्रिय उपाय आणि योग्य औषधांचे प्रमाण मिळवा.",
    heroMeta: "8 भारतीय भाषा · प्रथम सेंद्रिय उपाय · अचूक औषध प्रमाण",
    photoStepTitle: "1. पिकाचा फोटो",
    uploadPhotoBtn: "फोटो निवडा",
    takePhotoBtn: "कॅमेरा वापरा",
    removePhotoBtn: "फोटो काढा",
    voiceStepTitle: "2. आवाज रेकॉर्ड करा किंवा लक्षणे लिहा",
    recordVoiceBtn: "आवाज रेकॉर्ड करा",
    stopRecordingBtn: "थांबवा व लिहा",
    cropLabel: "पीक निवडा",
    diagnoseBtn: "रोगाची तपासणी करा",
    diagnosingBtn: "तपासणी सुरू आहे...",
    listenAdvice: "सल्ला ऐका",
    stopAudio: "आवाज थांबवा",
    copyWhatsapp: "WhatsApp साठी कॉपी",
    openInWhatsapp: "WhatsApp वर पाठवा",
    whatsappTitle: "किसान मित्र WhatsApp चॅटबॉट",
    whatsappWelcome:
      "नमस्कार शेतकरी दादा! मी किसान मित्र WhatsApp कृषी सल्लागार आहे. पिकाचा फोटो पाठवा किंवा मराठीत तुमचा प्रश्न विचारा.",
    whatsappInputPlaceholder: "तुमचा संदेश लिहा किंवा आवाज रेकॉर्ड करा...",
    medicinesTitle: "पीक रोग आणि औषधांची मार्गदर्शिका",
    medicinesSearchPlaceholder: "रोग, कीड, औषध किंवा पीक शोधा...",
    allCropsFilter: "सर्व पिके",
    askInWhatsappBtn: "WhatsApp बॉटमध्ये विचारा",
  },
  gujarati: {
    ...ENGLISH_COPY,
    brandName: "કિસાન મિત્ર",
    brandSub: "કૃષિ સલાહકાર · ભારત",
    navClinic: "પાક ક્લિનિક",
    navWhatsapp: "WhatsApp બોટ",
    navMedicines: "દવાઓ અને રોગ",
    navPlanner: "સ્પ્રે પ્લાનર",
    languageLabel: "ભાષા",
    breadcrumbClinic: "પાક ક્લિનિક",
    newCheck: "નવી તપાસ",
    historyTitle: "સાચવેલી તપાસ",
    searchHistoryPlaceholder: "પાક અથવા રોગ શોધો...",
    samplesSidebarTitle: "ખેતરના નમૂના",
    heroTitle: "તમારી ભાષામાં સચોટ પાક નિદાન અને દવા સલાહ",
    heroBody:
      "રોગિષ્ઠ પાન, થડ કે મૂળનો ફોટો મોકલો અથવા ગુજરાતીમાં બોલીને સમસ્યા જણાવો. ઓર્ગેનિક ઉપાય અને દવાનું ચોક્કસ માપ મેળવો.",
    heroMeta: "8 ભારતીય ભાષાઓ · પ્રથમ ઓર્ગેનિક ઉપાય · ચોક્કસ દવાનું માપ",
    photoStepTitle: "1. પાકનો ફોટો",
    uploadPhotoBtn: "ફોટો પસંદ કરો",
    takePhotoBtn: "કેમેરા ખોલો",
    voiceStepTitle: "2. અવાજ રેકોર્ડ કરો અથવા લખો",
    recordVoiceBtn: "અવાજ રેકોર્ડ કરો",
    stopRecordingBtn: "રોકો અને લખો",
    cropLabel: "પાક પસંદ કરો",
    diagnoseBtn: "રોગની તપાસ કરો",
    diagnosingBtn: "તપાસ ચાલુ છે...",
    listenAdvice: "સલાહ સાંભળો",
    copyWhatsapp: "WhatsApp માટે કોપી",
    openInWhatsapp: "WhatsApp પર મોકલો",
    whatsappTitle: "કિસાન મિત્ર WhatsApp ચેટબોટ",
    whatsappWelcome:
      "નમસ્તે ખેડૂત મિત્ર! હું કિસાન મિત્ર WhatsApp કૃષિ નિષ્ણાત છું. પાકનો ફોટો મોકલો અથવા ગુજરાતીમાં પ્રશ્ન પૂછો.",
    whatsappInputPlaceholder: "તમારો સંદેશ લખો અથવા અવાજ રેકોર્ડ કરો...",
    medicinesTitle: "પાક રોગો અને દવાઓની યાદી",
    medicinesSearchPlaceholder: "રોગ, જીવાત, દવા અથવા પાક શોધો...",
    allCropsFilter: "બધા પાક",
    askInWhatsappBtn: "WhatsApp બોટમાં પૂછો",
  },
  bengali: {
    ...ENGLISH_COPY,
    brandName: "কিষাণ মিত্র",
    brandSub: "কৃষি পরামর্শদাতা · ভারত",
    navClinic: "ফসল ক্লিনিক",
    navWhatsapp: "WhatsApp বট",
    navMedicines: "ওষুধ ও রোগ",
    navPlanner: "স্প্রে প্ল্যানার",
    languageLabel: "ভাষা",
    breadcrumbClinic: "ফসল ক্লিনিক",
    newCheck: "নতুন পরীক্ষা",
    historyTitle: "সংরক্ষিত পরামর্শ",
    searchHistoryPlaceholder: "ফসল বা রোগ খুঁজুন...",
    samplesSidebarTitle: "মাঠের নমুনা",
    heroTitle: "আপনার ভাষায় সঠিক ফসল রোগ নির্ণয় ও ওষুধের পরামর্শ",
    heroBody:
      "আক্রান্ত পাতা, কাণ্ড বা শিকড়ের ছবি পাঠান অথবা বাংলায় কথা বলে জানান। জৈব প্রতিকার এবং সঠিক মাত্রার ওষুধের পরামর্শ পান।",
    heroMeta: "৮টি ভারতীয় ভাষা · জৈব প্রতিকার প্রথম · সঠিক ওষুধের মাত্রা",
    photoStepTitle: "1. ফসলের ছবি",
    uploadPhotoBtn: "ছবি আপলোড",
    takePhotoBtn: "ক্যামেরা ব্যবহার করুন",
    voiceStepTitle: "2. ভয়েস নোট বা লক্ষণ লিখুন",
    recordVoiceBtn: "ভয়েস রেকর্ড করুন",
    stopRecordingBtn: "থামুন ও লিখুন",
    cropLabel: "ফসলের ধরন",
    diagnoseBtn: "ফসল পরীক্ষা করুন",
    diagnosingBtn: "পরীক্ষা চলছে...",
    listenAdvice: "পরামর্শ শুনুন",
    copyWhatsapp: "WhatsApp কপি",
    openInWhatsapp: "WhatsApp-এ পাঠান",
    whatsappTitle: "কিষাণ মিত্র WhatsApp চ্যাটবট",
    whatsappWelcome:
      "নমস্কার কৃষক ভাই! আমি কিষাণ মিত্র WhatsApp কৃষি বিশেষজ্ঞ। আক্রান্ত ফসলের ছবি পাঠান অথবা বাংলায় জিজ্ঞাসা করুন।",
    whatsappInputPlaceholder: "আপনার বার্তা লিখুন বা ভয়েস রেকর্ড করুন...",
    medicinesTitle: "ফসলের রোগ ও ওষুধ নির্দেশিকা",
    medicinesSearchPlaceholder: "রোগ, পোকা, ওষুধ বা ফসল খুঁজুন...",
    allCropsFilter: "সব ফসল",
    askInWhatsappBtn: "WhatsApp বটে জিজ্ঞাসা করুন",
  },
  tamil: {
    ...ENGLISH_COPY,
    brandName: "கிசான் மித்ரா",
    brandSub: "வேளாண் ஆலோசகர் · இந்தியா",
    navClinic: "பயிர் கிளினிக்",
    navWhatsapp: "WhatsApp பாட்",
    navMedicines: "மருந்துகள்",
    navPlanner: "தெளிப்பு திட்டம்",
    languageLabel: "மொழி",
    breadcrumbClinic: "பயிர் கிளினிக்",
    newCheck: "புதிய ஆய்வு",
    historyTitle: "சேமித்த ஆய்வுகள்",
    searchHistoryPlaceholder: "பயிர் அல்லது நோய் தேடுக...",
    samplesSidebarTitle: "வயல் மாதிரிகள்",
    heroTitle: "உங்கள் மொழியில் துல்லியமான பயிர் நோய் மற்றும் மருந்து ஆலோசனை",
    heroBody:
      "பாதிக்கப்பட்ட இலை அல்லது பயிரின் புகைப்படத்தை அனுப்புங்கள் அல்லது தமிழில் பேசுங்கள். இயற்கை மற்றும் பாதுகாப்பான மருந்து அளவுகளைப் பெறுங்கள்.",
    heroMeta: "8 இந்திய மொழிகள் · இயற்கை வழி முதலில் · சரியான மருந்து அளவு",
    photoStepTitle: "1. பயிர் புகைப்படம்",
    uploadPhotoBtn: "புகைப்படம் பதிவேற்று",
    takePhotoBtn: "கேமரா திற",
    voiceStepTitle: "2. குரல் பதிவு அல்லது அறிகுறி",
    recordVoiceBtn: "குரல் பதிவு செய்",
    stopRecordingBtn: "நிறுத்து",
    cropLabel: "பயிர் வகை",
    diagnoseBtn: "பயிரை ஆய்வு செய்",
    diagnosingBtn: "ஆய்வு நடக்கிறது...",
    listenAdvice: "ஆலோசனையைக் கேள்",
    copyWhatsapp: "WhatsApp நகல்",
    openInWhatsapp: "WhatsApp-ல் அனுப்பு",
    whatsappTitle: "கிசான் மித்ரா WhatsApp சாட்பாட்",
    whatsappWelcome:
      "வணக்கம் விவசாய நண்பரே! நான் கிசான் மித்ரா WhatsApp வேளாண் ஆலோசகர். பயிர் புகைப்படம் அனுப்புங்கள் அல்லது தமிழில் கேளுங்கள்.",
    whatsappInputPlaceholder: "செய்தி தட்டச்சு செய்க அல்லது குரல் பதிவு செய்க...",
    medicinesTitle: "பயிர் நோய்கள் மற்றும் மருந்துகள் வழிகாட்டி",
    medicinesSearchPlaceholder: "நோய், பூச்சி, மருந்து தேடுக...",
    allCropsFilter: "அனைத்து பயிர்கள்",
    askInWhatsappBtn: "WhatsApp பாட்டில் கேள்",
  },
  telugu: {
    ...ENGLISH_COPY,
    brandName: "కిసాన్ మిత్ర",
    brandSub: "వ్యవసాయ సలహాదారు · భారత్",
    navClinic: "పంట క్లినిక్",
    navWhatsapp: "WhatsApp బాట్",
    navMedicines: "మందులు & తెగుళ్లు",
    navPlanner: "స్ప్రే ప్లానర్",
    languageLabel: "భాష",
    breadcrumbClinic: "పంట క్లినిక్",
    newCheck: "కొత్త పరీక్ష",
    historyTitle: "పాత పరీక్షలు",
    searchHistoryPlaceholder: "పంట లేదా తెగులు వెతకండి...",
    samplesSidebarTitle: "పొలం నమూనాలు",
    heroTitle: "మీ భాషలో ఖచ్చితమైన పంట తెగులు నిర్ధారణ & మందుల సలహా",
    heroBody:
      "తెగులు సోకిన ఆకు లేదా పంట ఫోటో పంపండి లేదా తెలుగులో మాట్లాడండి. సేంద్రీయ నివారణ మరియు సరైన మందుల మోతాదు పొందండి.",
    heroMeta: "8 భారతీయ భాషలు · మొదట సేంద్రీయ పద్ధతులు · సరైన మందు మోతాదు",
    photoStepTitle: "1. పంట ఫోటో",
    uploadPhotoBtn: "ఫోటో అప్‌లోడ్",
    takePhotoBtn: "కెమెరా వాడండి",
    voiceStepTitle: "2. వాయిస్ నోట్ లేదా లక్షణాలు",
    recordVoiceBtn: "వాయిస్ రికార్డ్",
    stopRecordingBtn: "ఆపి వ్రాయండి",
    cropLabel: "పంట రకం",
    diagnoseBtn: "పంటను పరీక్షించు",
    diagnosingBtn: "పరీక్షిస్తోంది...",
    listenAdvice: "సలహా వినండి",
    copyWhatsapp: "WhatsApp కాపీ",
    openInWhatsapp: "WhatsApp లో పంపు",
    whatsappTitle: "కిసాన్ మిత్ర WhatsApp చాట్‌బాట్",
    whatsappWelcome:
      "నమస్కారం రైతు సోదరా! నేను కిసాన్ మిత్ర WhatsApp వ్యవసాయ నిపుణుడిని. పంట ఫోటో పంపండి లేదా తెలుగులో అడగండి.",
    whatsappInputPlaceholder: "మీ సందేశం వ్రాయండి లేదా వాయిస్ రికార్డ్ చేయండి...",
    medicinesTitle: "పంట తెగుళ్లు మరియు మందుల మార్గదర్శి",
    medicinesSearchPlaceholder: "తెగులు, పురుగు, మందు లేదా పంట వెతకండి...",
    allCropsFilter: "అన్ని పంటలు",
    askInWhatsappBtn: "WhatsApp బాట్‌లో అడగండి",
  },
};
