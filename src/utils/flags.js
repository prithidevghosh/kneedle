// Clinical flag definitions. Each entry maps a flag code returned by /analyse
// to human-readable display info in all three supported languages.
const FLAG_DEFS = {
  right_loading_response_absent: {
    icon: '⚠️', severity: 'alert',
    name: { en: 'Right knee: No shock absorption at heel strike', bn: 'ডান হাঁটু: হিল স্ট্রাইকে শক শোষণ নেই', hi: 'दायाँ घुटना: एड़ी पड़ने पर झटका नहीं सोखता' },
    why:  { en: 'Your right knee completely skips absorbing the landing impact, putting severe direct force on the joint cartilage.', bn: 'হিল মাটিতে পড়ার সময় ডান হাঁটু চাপ শোষণ করছে না — তরুণাস্থিতে সরাসরি অতিরিক্ত চাপ পড়ছে।', hi: 'एड़ी पड़ते समय दायाँ घुटना झटका बिल्कुल नहीं सोखता — उपास्थि पर सीधा अत्यधिक दबाव पड़ता है।' },
  },
  right_loading_response_reduced: {
    icon: '⚡', severity: 'warning',
    name: { en: 'Right knee: Reduced shock absorption', bn: 'ডান হাঁটু: কম শক শোষণ', hi: 'दायाँ घुटना: कम झटका-शोषण' },
    why:  { en: 'Your right knee partially skips the shock-absorption phase at heel strike. This gradually increases joint stress each step.', bn: 'হিল মাটিতে পড়ার সময় ডান হাঁটু আংশিকভাবে চাপ শোষণ এড়াচ্ছে — প্রতিটি পদক্ষেপে জয়েন্টের উপর চাপ বাড়ছে।', hi: 'एड़ी पड़ने पर दायाँ घुटना आंशिक रूप से झटका नहीं सोखता — हर कदम पर जोड़ का दबाव धीरे-धीरे बढ़ता है।' },
  },
  left_loading_response_absent: {
    icon: '⚠️', severity: 'alert',
    name: { en: 'Left knee: No shock absorption at heel strike', bn: 'বাম হাঁটু: হিল স্ট্রাইকে শক শোষণ নেই', hi: 'बायाँ घुटना: एड़ी पड़ने पर झटका नहीं सोखता' },
    why:  { en: 'Your left knee completely skips absorbing the landing impact, putting severe direct force on the joint cartilage.', bn: 'হিল মাটিতে পড়ার সময় বাম হাঁটু চাপ শোষণ করছে না — তরুণাস্থিতে সরাসরি অতিরিক্ত চাপ পড়ছে।', hi: 'एड़ी पड़ते समय बायाँ घुटना झटका बिल्कुल नहीं सोखता — उपास्थि पर सीधा अत्यधिक दबाव पड़ता है।' },
  },
  left_loading_response_reduced: {
    icon: '⚡', severity: 'warning',
    name: { en: 'Left knee: Reduced shock absorption', bn: 'বাম হাঁটু: কম শক শোষণ', hi: 'बायाँ घुटना: कम झटका-शोषण' },
    why:  { en: 'Your left knee partially skips the shock-absorption phase at heel strike, gradually increasing joint stress.', bn: 'হিল মাটিতে পড়ার সময় বাম হাঁটু আংশিকভাবে চাপ শোষণ এড়াচ্ছে — জয়েন্টের উপর চাপ বাড়ছে।', hi: 'एड़ी पड़ने पर बायाँ घुटना आंशिक रूप से झटका नहीं सोखता, जोड़ का दबाव धीरे-धीरे बढ़ता है।' },
  },
  right_swing_flexion_severe: {
    icon: '🦵', severity: 'alert',
    name: { en: 'Right knee: Very stiff when swinging forward', bn: 'ডান হাঁটু: সামনে দোলানোর সময় অনেক শক্ত', hi: 'दायाँ घुटना: आगे झुलते समय बहुत अकड़ा हुआ' },
    why:  { en: "Your right knee barely bends when swinging forward during a step. This severely unnatural gait pattern strains surrounding muscles.", bn: 'পদক্ষেপের সময় ডান হাঁটু সামনে দোলানোর মুহূর্তে সামান্যই বাঁকছে। এই অস্বাভাবিক হাঁটার ধরন আশেপাশের পেশীতে চাপ দেয়।', hi: 'कदम रखते समय दायाँ घुटना आगे झुलने पर बहुत कम झुकता है। यह असामान्य चाल आसपास की मांसपेशियों पर दबाव डालती है।' },
  },
  right_swing_flexion_reduced: {
    icon: '🦵', severity: 'warning',
    name: { en: 'Right knee: Limited bend while walking', bn: 'ডান হাঁটু: হাঁটার সময় সীমিত বাঁক', hi: 'दायाँ घुटना: चलते समय सीमित झुकाव' },
    why:  { en: "Your right knee doesn't bend enough during the swing phase. This is often pain-guarding or stiffness — exercises today target this directly.", bn: 'হাঁটার সময় ডান হাঁটু যথেষ্ট বাঁকছে না। এটি প্রায়ই ব্যথা এড়ানো বা শক্ততার লক্ষণ — আজকের ব্যায়াম এটি সরাসরি লক্ষ্য করে।', hi: 'चलते समय दायाँ घुटना पर्याप्त नहीं झुकता। यह अक्सर दर्द-बचाव या अकड़न का संकेत है — आज के व्यायाम इसे सीधे लक्ष्य करते हैं।' },
  },
  left_swing_flexion_severe: {
    icon: '🦵', severity: 'alert',
    name: { en: 'Left knee: Very stiff when swinging forward', bn: 'বাম হাঁটু: সামনে দোলানোর সময় অনেক শক্ত', hi: 'बायाँ घुटना: आगे झुलते समय बहुत अकड़ा हुआ' },
    why:  { en: "Your left knee barely bends when swinging forward. This severely unnatural pattern strains surrounding muscles.", bn: 'পদক্ষেপের সময় বাম হাঁটু সামনে দোলানোর মুহূর্তে সামান্যই বাঁকছে।', hi: 'कदम रखते समय बायाँ घुटना आगे झुलने पर बहुत कम झुकता है।' },
  },
  left_swing_flexion_reduced: {
    icon: '🦵', severity: 'warning',
    name: { en: 'Left knee: Limited bend while walking', bn: 'বাম হাঁটু: হাঁটার সময় সীমিত বাঁক', hi: 'बायाँ घुटना: चलते समय सीमित झुकाव' },
    why:  { en: "Your left knee doesn't bend enough during the swing phase — often pain-guarding or stiffness.", bn: 'হাঁটার সময় বাম হাঁটু যথেষ্ট বাঁকছে না — প্রায়ই ব্যথা এড়ানো বা শক্ততার লক্ষণ।', hi: 'चलते समय बायाँ घुटना पर्याप्त नहीं झुकता — अक्सर दर्द-बचाव या अकड़न का संकेत।' },
  },
  right_flexion_contracture: {
    icon: '🔒', severity: 'alert',
    name: { en: "Right knee: Cannot fully straighten", bn: 'ডান হাঁটু: সম্পূর্ণ সোজা হচ্ছে না', hi: 'दायाँ घुटना: पूरी तरह सीधा नहीं होता' },
    why:  { en: "Your right knee can't fully extend when walking. This extension lag means the joint has tightened in a slightly bent position — a treatable pattern.", bn: 'হাঁটার সময় ডান হাঁটু সম্পূর্ণ সোজা হচ্ছে না। এটি জয়েন্ট সামান্য বাঁকা অবস্থায় শক্ত হয়ে যাওয়ার লক্ষণ — চিকিৎসাযোগ্য।', hi: 'चलते समय दायाँ घुटना पूरी तरह सीधा नहीं होता। यह जोड़ के थोड़े झुके हुए पोज़ में सिकुड़ने का संकेत है — इलाज़ योग्य।' },
  },
  left_flexion_contracture: {
    icon: '🔒', severity: 'alert',
    name: { en: "Left knee: Cannot fully straighten", bn: 'বাম হাঁটু: সম্পূর্ণ সোজা হচ্ছে না', hi: 'बायाँ घुटना: पूरी तरह सीधा नहीं होता' },
    why:  { en: "Your left knee can't fully extend when walking — the joint has tightened in a slightly bent position.", bn: 'হাঁটার সময় বাম হাঁটু সম্পূর্ণ সোজা হচ্ছে না — জয়েন্ট সামান্য বাঁকা অবস্থায় শক্ত হয়ে গেছে।', hi: 'चलते समय बायाँ घुटना पूरी तरह सीधा नहीं होता — जोड़ थोड़े झुके पोज़ में सिकुड़ गया है।' },
  },
  significant_varus_valgus_thrust: {
    icon: '↔️', severity: 'alert',
    name: { en: 'Knee buckles sideways with each step', bn: 'প্রতিটি পদক্ষেপে হাঁটু পাশে বাঁকছে', hi: 'हर कदम पर घुटना बगल में मुड़ता है' },
    why:  { en: 'A significant sideways wobble in your knee with each step. This puts uneven stress on one side of the cartilage and can worsen over time.', bn: 'প্রতিটি পদক্ষেপে হাঁটু উল্লেখযোগ্যভাবে পাশে কাত হচ্ছে। এটি তরুণাস্থির একদিকে অসম চাপ দেয় এবং সময়ের সাথে খারাপ হতে পারে।', hi: 'हर कदम पर घुटने में बड़ी बगल की हलचल होती है। इससे उपास्थि के एक तरफ असमान दबाव पड़ता है और समय के साथ बिगड़ सकता है।' },
  },
  mild_varus_valgus_thrust: {
    icon: '↔️', severity: 'warning',
    name: { en: 'Mild sideways knee movement', bn: 'হাঁটুতে হালকা পাশে নড়াচড়া', hi: 'घुटने में हल्की बगल की हलचल' },
    why:  { en: 'A mild sideways wobble during walking. Worth addressing with lateral strengthening exercises before it progresses.', bn: 'হাঁটার সময় হালকা পাশে কাত হওয়া। পার্শ্বীয় শক্তিবর্ধক ব্যায়াম দিয়ে এটি আরও খারাপ হওয়ার আগে সমাধান করা উচিত।', hi: 'चलते समय हल्की बगल की हलचल। इसे आगे बढ़ने से पहले पार्श्व मजबूती व्यायाम से ठीक करें।' },
  },
  trendelenburg_positive: {
    icon: '🏋️', severity: 'warning',
    name: { en: 'Hip drops when walking (weak hip stabilisers)', bn: 'হাঁটার সময় নিতম্ব কাত হচ্ছে (দুর্বল হিপ পেশী)', hi: 'चलते समय कूल्हा झुकता है (कमज़ोर हिप स्टेबिलाइज़र)' },
    why:  { en: 'Your hip drops on one side when you step. This is a sign of weak gluteus medius — the hip stabiliser that directly protects the knee from sideways forces.', bn: 'পদক্ষেপের সময় একদিকের নিতম্ব সামান্য নেমে যাচ্ছে। এটি গ্লুটিয়াস মিডিয়াস দুর্বলতার লক্ষণ — যে হিপ স্টেবিলাইজার হাঁটুকে পার্শ্বীয় চাপ থেকে রক্ষা করে।', hi: 'कदम रखते समय एक तरफ का कूल्हा झुकता है। यह ग्लूटियस मेडियस कमज़ोरी का संकेत है — जो हिप स्टेबिलाइज़र घुटने को बगल के झटकों से बचाता है।' },
  },
  significant_trunk_lean: {
    icon: '🎯', severity: 'warning',
    name: { en: 'Significant sideways trunk lean', bn: 'ধড় অতিরিক্ত পাশে হেলছে', hi: 'शरीर का ज़्यादा बगल झुकाव' },
    why:  { en: 'Your upper body leans significantly to one side while walking, shifting extra load onto that knee.', bn: 'হাঁটার সময় আপনার উপরের শরীর একদিকে উল্লেখযোগ্যভাবে হেলছে, যা সেদিকের হাঁটুতে অতিরিক্ত চাপ দেয়।', hi: 'चलते समय ऊपरी शरीर एक तरफ उल्লेखनीय रूप से झुकता है, उस घुटने पर अधिक भार डालता है।' },
  },
  fppa_deviation: {
    icon: '📐', severity: 'warning',
    name: { en: 'Knee caves inward dynamically', bn: 'হাঁটার সময় হাঁটু ভেতরের দিকে কাত হচ্ছে', hi: 'चलते समय घुटना अंदर की ओर मुड़ता है' },
    why:  { en: "Your knee angle deviates inward when seen from the front during walking (dynamic valgus). This increases ligament and cartilage stress on the inner knee.", bn: 'হাঁটার সময় সামনে থেকে দেখলে হাঁটুর কোণ ভেতরের দিকে বাঁকছে (ডায়নামিক ভালগাস)। এটি ভেতরের হাঁটুতে লিগামেন্ট ও তরুণাস্থিতে চাপ বাড়ায়।', hi: 'चलते समय सामने से देखने पर घुटना अंदर की ओर झुकता है (डायनामिक वाल्गस)। इससे अंदरी घुटने के लिगामेंट व उपास्थि पर दबाव बढ़ता है।' },
  },
  high_double_support: {
    icon: '🦶', severity: 'warning',
    name: { en: 'Balance caution: too long on both feet', bn: 'ভারসাম্য সতর্কতা: দুই পায়ে অনেক বেশি সময়', hi: 'संतुलन सावधानी: दोनों पैरों पर बहुत अधिक समय' },
    why:  { en: "You spend significantly more time with both feet on the ground than normal. Your body is protecting itself — this is fall-risk behaviour that improves with balance training.", bn: 'স্বাভাবিকের চেয়ে বেশি সময় দুই পায়ে ভর দিয়ে থাকছেন। আপনার শরীর নিজেকে রক্ষা করছে — এটি পড়ে যাওয়ার ঝুঁকির আচরণ যা ব্যালেন্স প্রশিক্ষণে উন্নত হয়।', hi: 'आप सामान्य से काफी अधिक समय दोनों पैरों पर रहते हैं। शरीर खुद को बचा रहा है — यह गिरने का जोखिम व्यवहार है जो बैलेंस प्रशिक्षण से सुधरता है।' },
  },
  elevated_double_support: {
    icon: '🦶', severity: 'info',
    name: { en: 'Slightly cautious walking pattern', bn: 'সামান্য সতর্কতার সাথে হাঁটছেন', hi: 'थोड़ा सावधान चलने का तरीका' },
    why:  { en: "You're spending a bit more time with both feet on the ground. This is mild and typically improves as knee strength and walking confidence build.", bn: 'দুই পায়ে ভর দিয়ে সামান্য বেশি সময় থাকছেন। এটি হালকা এবং হাঁটুর শক্তি ও আত্মবিশ্বাস বাড়লে উন্নত হয়।', hi: 'आप दोनों पैरों पर थोड़ा अधिक समय रहते हैं। यह हल्का है और घुटने की शक्ति बढ़ने से सुधरता है।' },
  },
  high_stride_asymmetry: {
    icon: '↕️', severity: 'warning',
    name: { en: 'Uneven step timing', bn: 'পদক্ষেপের সময় অসম', hi: 'कदमों का असमान समय' },
    why:  { en: 'Your left and right steps take noticeably different amounts of time. One leg is compensating for the other — a sign of asymmetric pain loading.', bn: 'বাম ও ডান পদক্ষেপের সময় উল্লেখযোগ্যভাবে ভিন্ন। একটি পা অন্যটির জন্য ক্ষতিপূরণ করছে — অসম ব্যথার চাপের লক্ষণ।', hi: 'बाएँ और दाएँ कदमों में उल्लेखनीय समय का अंतर है। एक पैर दूसरे की भरपाई कर रहा है — असमान दर्द-भार का संकेत।' },
  },
  low_cadence: {
    icon: '⏱', severity: 'info',
    name: { en: 'Slower walking pace', bn: 'ধীর হাঁটার গতি', hi: 'धीमी चलने की गति' },
    why:  { en: 'Your step rate is below normal (< 70 steps/min). A low cadence often reflects pain avoidance or reduced muscle strength — both improvable with consistent exercise.', bn: 'আপনার পদক্ষেপের হার স্বাভাবিকের নিচে (৭০/মিনিটের কম)। ধীর গতি প্রায়শই ব্যথা এড়ানো বা পেশীর দুর্বলতার লক্ষণ।', hi: 'आपकी कदम दर सामान्य से कम है (< 70/मिनट)। कम गति अक्सर दर्द-बचाव या मांसपेशी कमज़ोरी का संकेत है।' },
  },
  reduced_hip_extension: {
    icon: '🦾', severity: 'warning',
    name: { en: "Hip doesn't push off fully when walking", bn: 'হাঁটার সময় হিপ সম্পূর্ণ পিছনে যাচ্ছে না', hi: 'चलते समय कूल्हा पूरी तरह पीछे नहीं जाता' },
    why:  { en: "Your hip doesn't fully extend when pushing off the back foot. This reduces walking propulsion and transfers extra load to the knee.", bn: 'পিছনের পা ঠেলার সময় হিপ সম্পূর্ণভাবে প্রসারিত হচ্ছে না। এটি হাঁটার গতি কমায় এবং হাঁটুতে অতিরিক্ত চাপ দেয়।', hi: 'पिछले पैर को धकेलते समय कूल्हा पूरी तरह नहीं फैलता। इससे चलने की शक्ति कम होती है और घुटने पर अधिक भार आता है।' },
  },
  reduced_ankle_dorsiflexion: {
    icon: '🦶', severity: 'info',
    name: { en: 'Limited ankle flexibility upward', bn: 'গোড়ালির উপরে বাঁকানোর সীমাবদ্ধতা', hi: 'टखने की ऊपर की ओर लचीलेपन में कमी' },
    why:  { en: "Your ankle doesn't flex upward enough during walking. Limited dorsiflexion forces compensatory movements upstream — often increasing knee stress.", bn: 'হাঁটার সময় গোড়ালি যথেষ্ট উপরে বাঁকছে না। সীমিত গতি ক্ষতিপূরণমূলক নড়াচড়া তৈরি করে — প্রায়শই হাঁটুতে চাপ বাড়ায়।', hi: 'चलते समय टखना पर्याप्त ऊपर नहीं मुड़ता। सीमित गति मुआवज़ा संचालन बनाती है — अक्सर घुटने का दबाव बढ़ाती है।' },
  },
  bilateral_oa_pattern: {
    icon: '🔄', severity: 'alert',
    name: { en: 'Both knees show OA pattern', bn: 'উভয় হাঁটুতে আর্থ্রাইটিসের প্যাটার্ন', hi: 'दोनों घुटनों में गठिया का पैटर्न' },
    why:  { en: "Both knees show reduced loading and swing patterns consistent with osteoarthritis. Your exercise plan addresses both sides equally.", bn: 'উভয় হাঁটুতে অস্টিওআর্থ্রাইটিসের সাথে সামঞ্জস্যপূর্ণ হ্রাসকৃত লোডিং ও সুইং প্যাটার্ন দেখা গেছে। আপনার পরিকল্পনা উভয় দিক সমানভাবে সমাধান করে।', hi: 'दोनों घुटनों में ऑस्टियोआर्थराइटिस के अनुरूप कम लोडिंग व स्विंग पैटर्न दिखते हैं। आपकी योजना दोनों तरफ को समान रूप से संबोधित करती है।' },
  },
};

export function getFlagInfo(flagCode, lang = 'en') {
  const def = FLAG_DEFS[flagCode];
  if (!def) return null;
  const l = ['en', 'bn', 'hi'].includes(lang) ? lang : 'en';
  return {
    icon: def.icon,
    name: def.name[l] || def.name.en,
    why:  def.why[l]  || def.why.en,
    severity: def.severity,
  };
}

// Color palette per severity level
export const FLAG_SEVERITY_COLORS = {
  alert:   { bg: '#fde2d4', border: '#f8b39b', text: '#c0392b', dot: '#e74c3c' },
  warning: { bg: '#fdf1d6', border: '#f4d58d', text: '#b7620a', dot: '#f39c12' },
  info:    { bg: '#eaf2ff', border: '#cfe0ff', text: '#1565c0', dot: '#3498db' },
};

// KL grade → severity label mapping (mirrors backend logic)
export const KL_GRADE_MAP = {
  kl_0: { stage: '0', severityKey: 'klMild',     color: '#2d6a4f', bg: '#d8f3dc' },
  kl_1: { stage: '1', severityKey: 'klMild',     color: '#2d6a4f', bg: '#d8f3dc' },
  kl_2: { stage: '2', severityKey: 'klModerate', color: '#b7620a', bg: '#fdf1d6' },
  kl_3: { stage: '3', severityKey: 'klSevere',   color: '#c0392b', bg: '#fde2d4' },
  kl_4: { stage: '4', severityKey: 'klSevere',   color: '#c0392b', bg: '#fde2d4' },
};
