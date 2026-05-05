// Parse rep specs in EN ("15×2 each side", "10 seconds×10", "12×2") and
// Bengali/Hindi numerals. Returns { count, sets, isTime, perSide }.

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const HI_DIGITS = '०१२३४५६७८९';

function toAscii(str) {
  if (!str) return '';
  let out = '';
  for (const ch of str) {
    const bn = BN_DIGITS.indexOf(ch);
    if (bn >= 0) { out += String(bn); continue; }
    const hi = HI_DIGITS.indexOf(ch);
    if (hi >= 0) { out += String(hi); continue; }
    out += ch;
  }
  return out;
}

export function parseReps(repsStr) {
  const ascii = toAscii(repsStr || '').toLowerCase();
  const isTime = /sec|second|সেকেন্ড|सेकंड/.test(ascii);
  const perSide = /each side|per side|প্রতি পাশে|प्रत्येक/.test(ascii);
  const nums = ascii.match(/\d+/g)?.map(Number) || [];
  // "15×2" -> count=15 sets=2; "10 seconds×10" -> count=10 (time) sets=10
  const count = nums[0] ?? 10;
  const sets = nums[1] ?? 1;
  return { count, sets, isTime, perSide };
}

// Localized number for voice/visual.
export function localizedNumber(n, lang) {
  const s = String(n);
  if (lang === 'bn') return s.split('').map(d => BN_DIGITS[+d] ?? d).join('');
  if (lang === 'hi') return s.split('').map(d => HI_DIGITS[+d] ?? d).join('');
  return s;
}

// Voice locale codes used with expo-speech.
export function voiceLocale(lang) {
  return lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN';
}

// YouTube ID extractor (handles watch?v=, youtu.be/, embed/).
export function youtubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}
