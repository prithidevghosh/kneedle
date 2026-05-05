const BASE_URL = 'http://192.168.1.101:8000';
const REQUEST_TIMEOUT_MS = 180_000; // 3 minutes — dual-video analysis can be slow.

const TAG = '[Kneedle/api]';
const log    = (...a) => console.log(TAG, ...a);
const warn   = (...a) => console.warn(TAG, ...a);
const errLog = (...a) => console.error(TAG, ...a);

export class ApiError extends Error {
  constructor(message, { code, status, detail } = {}) {
    super(message);
    this.name  = 'ApiError';
    this.code   = code;
    this.status = status;
    this.detail = detail;
  }
}

function withTimeout(promise, ms, reqId) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new ApiError(`Request timed out after ${ms / 1000}s`, {
        code: 'TIMEOUT', status: 0,
      }));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const fmtBytes = (n) => {
  if (n == null || Number.isNaN(n)) return '?';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

let FileSystem = null;
try { FileSystem = require('expo-file-system/legacy'); }
catch (_) {
  try { FileSystem = require('expo-file-system'); } catch (_) { /* optional */ }
}

async function probeFileSize(uri) {
  if (!FileSystem?.getInfoAsync) return null;
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return info?.size ?? null;
  } catch (_) { return null; }
}

// Sends both videos as multipart/form-data using the new /analyse API shape.
// The old single `video` field is deprecated and returns HTTP 400 — we never send it.
async function uploadViaFetch({ url, videoFrontalUri, videoSagittalUri, fields, reqId }) {
  const formData = new FormData();
  formData.append('video_frontal',  { uri: videoFrontalUri,  type: 'video/mp4', name: 'frontal.mp4' });
  formData.append('video_sagittal', { uri: videoSagittalUri, type: 'video/mp4', name: 'sagittal.mp4' });
  Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)));

  const startedAt  = Date.now();
  log(`… POST(fetch) ${url} [${reqId}]`);
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { method: 'POST', body: formData, signal: controller.signal });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`, { code: 'TIMEOUT', status: 0 });
    }
    throw e;
  } finally {
    clearTimeout(abortTimer);
  }
  const body = await response.text();
  return { status: response.status, body, elapsed: Date.now() - startedAt };
}

export const API = {
  // videoFrontalUri  — patient walking toward/away from camera
  // videoSagittalUri — patient walking sideways across frame
  async analyseGait(videoFrontalUri, videoSagittalUri, profile, sessionNumber = 1) {
    const reqId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const url   = `${BASE_URL}/analyse`;

    const [sizeF, sizeS] = await Promise.all([
      probeFileSize(videoFrontalUri),
      probeFileSize(videoSagittalUri),
    ]);
    log(`→ analyseGait [${reqId}]`, {
      url,
      frontalSize:  fmtBytes(sizeF),
      sagittalSize: fmtBytes(sizeS),
      profile: { knee: profile?.knee, age: profile?.age, lang: profile?.lang },
      sessionNumber,
    });

    const fields = {
      knee:           profile?.knee   ?? 'both',
      age:            profile?.age    ?? '60',
      lang:           profile?.lang   || 'bn',
      session_number: sessionNumber,
    };

    let result;
    try {
      result = await withTimeout(
        uploadViaFetch({ url, videoFrontalUri, videoSagittalUri, fields, reqId }),
        REQUEST_TIMEOUT_MS,
        reqId,
      );
    } catch (e) {
      errLog(`✗ network error [${reqId}]`, e?.message || e);
      throw e;
    }

    log(`← response [${reqId}]`, { status: result.status, elapsedMs: result.elapsed });

    let parsed = {};
    try { parsed = result.body ? JSON.parse(result.body) : {}; }
    catch (_) { parsed = { detail: result.body?.slice?.(0, 200) }; }

    if (result.status === 400) {
      warn(`✗ 400 [${reqId}]`, parsed);
      throw new ApiError(parsed.detail || 'Invalid file uploaded', {
        code: 'BAD_VIDEO', status: 400, detail: parsed.detail,
      });
    }
    if (result.status < 200 || result.status >= 300) {
      errLog(`✗ ${result.status} [${reqId}]`, parsed);
      throw new ApiError(parsed.detail || `Analysis failed (server ${result.status})`, {
        code: 'SERVER_ERROR', status: result.status, detail: parsed.detail,
      });
    }

    log(`✓ analyseGait done [${reqId}] in ${result.elapsed}ms`, {
      symmetry_score:    parsed?.symmetry_score,
      active_joint:      parsed?.active_joint,
      kl_proxy_grade:    parsed?.kl_proxy_grade,
      severity:          parsed?.severity,
      clinical_flags:    parsed?.clinical_flags?.length,
      bilateral_pattern: parsed?.bilateral_pattern_detected,
      exercises:         parsed?.exercises?.length,
      confidence:        parsed?.primary_view_confidence,
    });
    return parsed;
  },
};

// Full mock response matching the new /analyse response shape.
// Used in development or when the server is unreachable.
export const MOCK_RESPONSE = {
  observation:    'আপনার হাঁটার ধরনে ডান হাঁটু সামান্য কম বাঁকছে এবং হিল স্ট্রাইকে চাপ শোষণ কমে গেছে।',
  observation_en: 'Your right knee bends less than the left during walking and shows reduced shock absorption at heel strike.',
  fix_title:      'ডান হাঁটুর বাঁক বাড়ান',
  fix_desc:       'হাঁটার সময় সচেতনভাবে ডান হাঁটু একটু বেশি বাঁকানোর চেষ্টা করুন।',
  fix_title_en:   'Increase right knee bend during walking',
  fix_desc_en:    'Consciously try to bend your right knee a little more during the swing phase.',
  exercises: [
    {
      name: 'কোয়াড সেট', reps: '১০×৩',
      name_en: 'Quad Set', reps_en: '10×3',
      description: 'চেয়ারে বসে পা সোজা রেখে উরুর পেশী শক্ত করুন। ৫ সেকেন্ড ধরে রাখুন।',
      reason: 'Strengthens the quadriceps to improve knee loading response.',
      video_url: '',
    },
    {
      name: 'হিল স্লাইড', reps: '১৫×২',
      name_en: 'Heel Slide', reps_en: '15×2',
      description: 'শুয়ে পড়ুন। গোড়ালি মেঝে বরাবর নিতম্বের দিকে টেনে আনুন, তারপর ছেড়ে দিন।',
      reason: 'Improves knee range of motion and swing flexion.',
      video_url: '',
    },
  ],
  active_joint:   'right_knee',
  symmetry_score: 74.5,
  session_number: 1,
  thinking:       'Mock response — server not reachable.',
  severity:       'moderate',
  symmetry_band:  'fair',
  symmetry_meaning:    'আপনার হাঁটু মোটামুটি সামঞ্জস্যপূর্ণ — কিছু পার্থক্য আছে।',
  symmetry_meaning_en: 'Your knees are fairly symmetric — some difference noted.',
  empathy_line:    'আপনি প্রতিদিন চেষ্টা করছেন — এটাই সবচেয়ে গুরুত্বপূর্ণ।',
  empathy_line_en: "You keep showing up — that's what matters most.",
  frequency:     'প্রতিদিন একবার, ২ সপ্তাহ',
  frequency_en:  'Once daily for 2 weeks',
  pain_rule:     'ব্যথা ৫/১০-এর বেশি হলে থামুন',
  pain_rule_en:  'Stop if pain exceeds 5/10',
  red_flags:     'হাঁটু ফুলে গেলে বা লাল হলে ডাক্তার দেখান।',
  red_flags_en:  'See a doctor if the knee swells or becomes red.',
  complementary_actions:    'গরম সেঁক ব্যায়ামের পর ১৫ মিনিট।',
  complementary_actions_en: 'Apply heat for 15 minutes after exercises.',
  referral_recommended: false,
  referral_text:    '',
  referral_text_en: '',
  kl_proxy_grade:           'kl_2',
  clinical_flags:           ['right_loading_response_reduced', 'elevated_double_support'],
  bilateral_pattern_detected: false,
  primary_view_confidence:  0.78,
  metrics: {
    knee_angle_right:  158.4,
    knee_angle_left:   162.1,
    knee_angle_diff:   3.7,
    symmetry_score:    74.5,
    trunk_lean_angle:  4.2,
    trunk_lean_direction: 'right',
    toe_out_angle_right: null,
    toe_out_angle_left:  null,
    cadence:            88.5,
    frames_analysed:    62,
    confidence:         0.78,
    frontal_frames_analyzed:  28,
    frontal_frames_skipped:   3,
    sagittal_frames_analyzed: 34,
    sagittal_frames_skipped:  2,
    heel_strike_events_right: 5,
    heel_strike_events_left:  4,
    gait_cycles_detected:     4,
    kl_proxy_score:    6.0,
    kl_proxy_grade:    'kl_2',
    clinical_flags:    ['right_loading_response_reduced', 'elevated_double_support'],
    bilateral_pattern_detected: false,
    right_loading_response_peak: 8.5,
    left_loading_response_peak:  14.2,
    right_mid_stance_angle:  9.1,
    left_mid_stance_angle:   7.8,
    right_peak_swing_flexion: 52.3,
    left_peak_swing_flexion:  61.7,
    right_rom_delta:  43.2,
    left_rom_delta:   53.9,
    right_extension_lag: 6.1,
    left_extension_lag:  3.4,
    hip_extension_terminal_stance: 11.3,
    ankle_dorsiflexion:   8.7,
    trunk_anterior_lean_deg: 3.1,
    right_varus_valgus_thrust: 3.2,
    left_varus_valgus_thrust:  1.1,
    pelvic_obliquity_deg:  6.4,
    trendelenburg_flag:    false,
    step_width_proxy:      0.11,
    fppa_right:  4.2,
    fppa_left:   2.8,
    stride_time_asymmetry: 8.3,
    double_support_ratio:  29.4,
    gait_speed_proxy:      0.71,
    fallback_mode:         false,
  },
};
