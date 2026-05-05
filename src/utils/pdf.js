// Enhanced doctor summary export.
// Tries expo-print (if installed) for real PDF, otherwise falls back to Share API.
import { Share, Platform } from 'react-native';

let Print   = null;
let Sharing = null;
try { Print   = require('expo-print');   } catch (e) { /* optional */ }
try { Sharing = require('expo-sharing'); } catch (e) { /* optional */ }

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

// Plain-English flag label map for the PDF (always English regardless of app lang)
const FLAG_LABELS = {
  right_loading_response_absent:   'Right knee: No shock absorption at heel strike',
  right_loading_response_reduced:  'Right knee: Reduced shock absorption',
  left_loading_response_absent:    'Left knee: No shock absorption at heel strike',
  left_loading_response_reduced:   'Left knee: Reduced shock absorption',
  right_swing_flexion_severe:      'Right knee: Very stiff during swing',
  right_swing_flexion_reduced:     'Right knee: Limited bend while walking',
  left_swing_flexion_severe:       'Left knee: Very stiff during swing',
  left_swing_flexion_reduced:      'Left knee: Limited bend while walking',
  right_flexion_contracture:       'Right knee: Cannot fully straighten',
  left_flexion_contracture:        'Left knee: Cannot fully straighten',
  significant_varus_valgus_thrust: 'Knee buckles sideways significantly',
  mild_varus_valgus_thrust:        'Mild sideways knee movement',
  trendelenburg_positive:          'Hip drops when walking (weak stabilisers)',
  significant_trunk_lean:          'Significant sideways trunk lean',
  fppa_deviation:                  'Dynamic knee valgus (knee caves inward)',
  high_double_support:             'High double-support time (balance caution)',
  elevated_double_support:         'Elevated double-support time',
  high_stride_asymmetry:           'High stride time asymmetry',
  low_cadence:                     'Low cadence (< 70 steps/min)',
  reduced_hip_extension:           'Reduced hip extension at terminal stance',
  reduced_ankle_dorsiflexion:      'Reduced ankle dorsiflexion',
  bilateral_oa_pattern:            'Bilateral OA gait pattern detected',
};

const KL_LABELS = { kl_0: 'Stage 0 — Healthy', kl_1: 'Stage 1 — Early', kl_2: 'Stage 2 — Moderate', kl_3: 'Stage 3 — Advanced', kl_4: 'Stage 4 — Severe' };

function buildHtml({ profile, sessions, painLog, streak, lang }) {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Session table rows (last 14) ──────────────────────────────────────────
  const sessRows = sessions.slice(0, 14).map((s, idx) => {
    const r = s.result || {};
    const m = r.metrics || {};
    const date = new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const klLabel = r.kl_proxy_grade ? KL_LABELS[r.kl_proxy_grade] || r.kl_proxy_grade : '—';
    const flagCount = (r.clinical_flags || []).length;
    return `
      <tr>
        <td>${date}</td>
        <td>${r.symmetry_score ?? '—'}</td>
        <td>${m.gait_speed_proxy != null ? m.gait_speed_proxy.toFixed(2) + ' m/s' : '—'}</td>
        <td>${m.trunk_lean_angle != null ? m.trunk_lean_angle + '°' : '—'}</td>
        <td>${m.cadence ?? '—'}</td>
        <td>${klLabel}</td>
        <td>${flagCount > 0 ? `<span class="flag-count">${flagCount} flags</span>` : '—'}</td>
        <td>${esc(r.fix_title_en || r.fix_title || '—')}</td>
      </tr>
    `;
  }).join('');

  // ── KL grade trend (text summary) ────────────────────────────────────────
  const klHistory = sessions.slice(0, 6)
    .filter(s => s.result?.kl_proxy_grade)
    .map(s => {
      const d = new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return `${d}: ${KL_LABELS[s.result.kl_proxy_grade] || s.result.kl_proxy_grade}`;
    });

  // ── Latest bilateral metrics ──────────────────────────────────────────────
  const latestMetrics = sessions[0]?.result?.metrics || {};
  const bilatRows = [
    ['Swing flexion',     latestMetrics.right_peak_swing_flexion,   latestMetrics.left_peak_swing_flexion,   '°'],
    ['Extension lag',     latestMetrics.right_extension_lag,         latestMetrics.left_extension_lag,         '°'],
    ['Loading response',  latestMetrics.right_loading_response_peak, latestMetrics.left_loading_response_peak, '°'],
    ['ROM delta',         latestMetrics.right_rom_delta,             latestMetrics.left_rom_delta,             '°'],
    ['Varus/valgus thrust', latestMetrics.right_varus_valgus_thrust, latestMetrics.left_varus_valgus_thrust, '°'],
  ].map(([label, r, l, unit]) => {
    if (r == null && l == null) return '';
    const fv = v => v != null ? v.toFixed(1) + unit : '—';
    return `<tr><td>${label}</td><td>${fv(r)}</td><td>${fv(l)}</td></tr>`;
  }).join('');

  // ── Latest clinical flags ─────────────────────────────────────────────────
  const latestFlags = sessions[0]?.result?.clinical_flags || [];
  const flagList = latestFlags.map(f => `<li>${FLAG_LABELS[f] || f}</li>`).join('') || '<li>None</li>';

  // ── Cumulative flags seen across all sessions ────────────────────────────
  const allFlagCounts = {};
  sessions.forEach(s => {
    (s.result?.clinical_flags || []).forEach(f => {
      allFlagCounts[f] = (allFlagCounts[f] || 0) + 1;
    });
  });
  const persistentFlags = Object.entries(allFlagCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([f, count]) => `<li>${FLAG_LABELS[f] || f} <em>(${count} sessions)</em></li>`)
    .join('') || '<li>None</li>';

  // ── Pain log ──────────────────────────────────────────────────────────────
  const painSummary = painLog.slice(0, 14).map(p => {
    const date = new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `<li>${date} — pain ${p.level}/5</li>`;
  }).join('');

  // ── Gait speed & functional threshold ────────────────────────────────────
  const latestSpeed  = latestMetrics.gait_speed_proxy;
  const speedStatus  = latestSpeed != null
    ? latestSpeed >= 0.8
      ? `<span class="green">${latestSpeed.toFixed(2)} m/s — above functional threshold (0.80)</span>`
      : `<span class="amber">${latestSpeed.toFixed(2)} m/s — below functional threshold (0.80 m/s)</span>`
    : '—';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 28px; color: #1a3326; font-size: 12px; }
  h1  { font-size: 20px; margin: 0 0 2px; }
  h2  { font-size: 13px; margin: 20px 0 7px; color: #2d6a4f; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
  h3  { font-size: 11px; margin: 10px 0 4px; color: #555; }
  .muted  { color: #666; font-size: 10px; }
  .pill   { display: inline-block; background: #d8f3dc; color: #1a3326; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 4px; }
  .amber  { color: #b7620a; font-weight: bold; }
  .green  { color: #2d6a4f; font-weight: bold; }
  .red    { color: #c0392b; font-weight: bold; }
  .flag-count { background: #fde2d4; color: #c0392b; padding: 1px 5px; border-radius: 6px; font-size: 9px; font-weight: bold; }
  table   { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  th      { background: #f0faf4; text-align: left; padding: 5px 6px; border-bottom: 1px solid #d8f3dc; font-size: 10px; }
  td      { padding: 5px 6px; border-bottom: 1px solid #eee; }
  ul      { padding-left: 16px; margin: 4px 0; }
  li      { margin-bottom: 3px; }
  .disclaimer { font-size: 10px; color: #888; line-height: 1.5; border-top: 1px solid #eee; padding-top: 10px; margin-top: 16px; }
  .two-col { display: flex; gap: 24px; }
  .two-col > div { flex: 1; }
</style></head><body>

  <h1>Kneedle — Gait Analysis Report</h1>
  <div class="muted">Generated ${today} · This is an AI-assisted at-home gait report</div>

  <div style="margin-top: 10px;">
    <span class="pill">Patient: ${esc(profile?.name || '—')}</span>
    <span class="pill">Age: ${esc(profile?.age || '—')}</span>
    <span class="pill">Knee: ${esc(profile?.knee || '—')}</span>
    <span class="pill">Sessions: ${sessions.length}</span>
    <span class="pill">Streak: ${streak} day${streak === 1 ? '' : 's'}</span>
  </div>

  <h2>Functional Status</h2>
  <div class="two-col">
    <div>
      <h3>Walking Speed (latest)</h3>
      <p>${speedStatus}</p>
      <p class="muted">0.8 m/s = community ambulation threshold</p>
    </div>
    <div>
      <h3>Knee OA Stage (latest)</h3>
      <p><strong>${sessions[0]?.result?.kl_proxy_grade
        ? KL_LABELS[sessions[0].result.kl_proxy_grade] || sessions[0].result.kl_proxy_grade
        : '—'}</strong></p>
      <p class="muted">KL proxy derived from gait analysis, not radiograph</p>
    </div>
  </div>
  ${sessions[0]?.result?.bilateral_pattern_detected
    ? '<p><span class="red">⚠ Bilateral OA gait pattern detected — both knees affected</span></p>'
    : ''}

  ${klHistory.length > 0 ? `
  <h2>Knee Stage History</h2>
  <ul>${klHistory.map(k => `<li>${k}</li>`).join('')}</ul>
  ` : ''}

  <h2>Latest Bilateral Metrics</h2>
  ${bilatRows ? `
  <table>
    <thead><tr><th>Metric</th><th>Right</th><th>Left</th></tr></thead>
    <tbody>${bilatRows}</tbody>
  </table>
  <p class="muted">Values outside normal range may correspond to clinical flags below.</p>
  ` : '<p class="muted">No bilateral data available yet.</p>'}

  <h2>Clinical Flags — Latest Session</h2>
  <ul>${flagList}</ul>

  <h2>Persistent Flags (≥ 2 Sessions)</h2>
  <ul>${persistentFlags}</ul>

  <h2>Session History</h2>
  <table>
    <thead><tr>
      <th>Date</th><th>Symmetry</th><th>Speed</th><th>Trunk lean</th>
      <th>Cadence</th><th>KL Stage</th><th>Flags</th><th>Focus</th>
    </tr></thead>
    <tbody>${sessRows || '<tr><td colspan="8">No sessions yet</td></tr>'}</tbody>
  </table>

  <h2>Pain Log</h2>
  <ul>${painSummary || '<li>No pain entries yet</li>'}</ul>

  <p class="disclaimer">
    This report was generated automatically from at-home gait recordings analysed by the Kneedle app
    using computer vision. Gait speed, KL proxy grade, and clinical flags are estimated values intended
    to support — not replace — clinical assessment. A radiograph and in-person physiotherapy assessment
    are required for definitive diagnosis and treatment planning.
  </p>

</body></html>`;
}

export async function exportDoctorSummary(payload) {
  const html = buildHtml(payload);
  if (Print?.printToFileAsync) {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Sharing?.isAvailableAsync && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Kneedle gait report' });
        return { ok: true, mode: 'pdf', uri };
      }
      return { ok: true, mode: 'pdf-saved', uri };
    } catch (e) {
      // fall through to text share
    }
  }
  try {
    const text = htmlToPlain(html);
    await Share.share({ message: text, title: 'Kneedle gait report' });
    return { ok: true, mode: 'text' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function htmlToPlain(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<\/(h1|h2|h3|tr|li|p|div)>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}
