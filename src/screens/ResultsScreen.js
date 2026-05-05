import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as Speech from 'expo-speech';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import ExerciseCard from '../components/ExerciseCard';
import { Storage } from '../utils/storage';
import { voiceLocale } from '../utils/reps';
import { getFlagInfo, FLAG_SEVERITY_COLORS, KL_GRADE_MAP } from '../utils/flags';

export default function ResultsScreen({ navigation, route }) {
  const { result, lang: initLang = 'bn', profile } = route.params;
  const [lang, setLang]       = useState(initLang);
  const [speaking, setSpeaking] = useState(false);
  const [hurtMemos, setHurtMemos] = useState([]);
  const s = getStrings(lang);

  useEffect(() => {
    (async () => {
      const fbAll = await Storage.getExerciseFeedback();
      const matches = (result.exercises || [])
        .map(ex => {
          const last = fbAll[ex.name_en]?.[0];
          if (last?.feedback === 'hurt') {
            return { name: lang === 'en' ? ex.name_en : ex.name, side: last.painSide };
          }
          return null;
        })
        .filter(Boolean);
      setHurtMemos(matches);
    })();
  }, [result, lang]);

  const today = new Date().toLocaleDateString(
    lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN',
    { day: 'numeric', month: 'long' }
  );

  const speakText = () => {
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    const parts = lang === 'en'
      ? [result.empathy_line_en, result.observation_en, result.fix_desc_en, result.symmetry_meaning_en]
      : [result.empathy_line, result.observation, result.fix_desc, result.symmetry_meaning];
    Speech.speak(parts.filter(Boolean).join(' '), {
      language: voiceLocale(lang), rate: 0.85,
      onDone: () => setSpeaking(false), onError: () => setSpeaking(false),
    });
    setSpeaking(true);
  };

  const symmetryScore = result.symmetry_score || 0;
  const scoreColor    = symmetryScore >= 75 ? '#2d6a4f' : symmetryScore >= 50 ? '#f4a261' : '#e76f51';
  const tr = (en, bn) => (lang === 'en' ? en : bn);
  const m  = result.metrics || {};

  const onTryExercise = (exercise) => {
    Speech.stop(); setSpeaking(false);
    navigation.navigate('ExercisePlayer', { exercise, lang });
  };

  const metric = (label, val, unit = '') => (
    <View style={styles.metric}>
      <Text style={styles.metricLbl}>{label}</Text>
      <Text style={styles.metricVal}>{val ?? '—'}{val != null && unit ? unit : ''}</Text>
    </View>
  );

  // ── F1: KL stage ──────────────────────────────────────────────────────────
  const klGrade = result.kl_proxy_grade;
  const klInfo  = klGrade ? KL_GRADE_MAP[klGrade] : null;
  const klSeverityLabel = klInfo ? s[klInfo.severityKey] : null;

  const renderKLCard = () => {
    if (!klInfo) return null;
    const stageNum = klInfo.stage;
    return (
      <View style={[styles.klCard, { backgroundColor: klInfo.bg, borderColor: klInfo.color + '55' }]}>
        <View style={styles.klLeft}>
          <Text style={[styles.klStageNum, { color: klInfo.color }]}>
            {s.klStagePrefix} {stageNum}
          </Text>
          <Text style={[styles.klSeverity, { color: klInfo.color }]}>{klSeverityLabel}</Text>
          <Text style={styles.klLabel}>{s.klStageLabel}</Text>
        </View>
        <View style={styles.klRight}>
          {result.bilateral_pattern_detected && (
            <View style={[styles.klBilateralPill, { backgroundColor: klInfo.color + '22' }]}>
              <Text style={[styles.klBilateralTxt, { color: klInfo.color }]}>
                🔄 {s.klBilateralNote}
              </Text>
            </View>
          )}
          {/* KL stage bar: 5 segments */}
          <View style={styles.klBarWrap}>
            {[0, 1, 2, 3, 4].map(i => (
              <View
                key={i}
                style={[
                  styles.klBarSeg,
                  { backgroundColor: i <= parseInt(stageNum) ? klInfo.color : '#e8e5de' },
                ]}
              />
            ))}
          </View>
          <Text style={styles.klBarLbl}>0 ─────── 4</Text>
        </View>
      </View>
    );
  };

  // ── F2: Clinical flag cards ───────────────────────────────────────────────
  const clinicalFlags = result.clinical_flags || [];

  const renderFlagCards = () => (
    <View style={styles.card}>
      <Text style={[styles.cardTag, { color: '#7c3aed' }]}>{s.flagsFoundTitle}</Text>
      {clinicalFlags.length === 0 ? (
        <Text style={[styles.cardText, { color: '#2d6a4f' }]}>{s.flagsFoundNone}</Text>
      ) : (
        clinicalFlags.map((code, i) => {
          const info = getFlagInfo(code, lang);
          if (!info) return null;
          const colors = FLAG_SEVERITY_COLORS[info.severity];
          return (
            <View key={i} style={[styles.flagItem, { backgroundColor: colors.bg, borderLeftColor: colors.dot }]}>
              <View style={styles.flagHeader}>
                <Text style={styles.flagIcon}>{info.icon}</Text>
                <Text style={[styles.flagName, { color: colors.text }]}>{info.name}</Text>
              </View>
              <Text style={styles.flagWhyLbl}>{s.flagWhyLabel}</Text>
              <Text style={styles.flagWhy}>{info.why}</Text>
            </View>
          );
        })
      )}
    </View>
  );

  // ── F3: Bilateral comparison strip ────────────────────────────────────────
  const renderBilateral = () => {
    const hasData =
      m.right_peak_swing_flexion != null || m.right_extension_lag != null ||
      m.right_loading_response_peak != null || m.right_rom_delta != null;
    if (!hasData) return null;

    const flagSet = new Set(clinicalFlags);
    const rightFlagged = (suffix) =>
      flagSet.has(`right_${suffix}`) || flagSet.has(`right_${suffix}_reduced`) || flagSet.has(`right_${suffix}_severe`);
    const leftFlagged = (suffix) =>
      flagSet.has(`left_${suffix}`) || flagSet.has(`left_${suffix}_reduced`) || flagSet.has(`left_${suffix}_severe`);

    const row = (label, rVal, lVal, rFlagged, lFlagged, unit = '°') => {
      const fmtVal = (v) => v != null ? `${v.toFixed(1)}${unit}` : '—';
      return (
        <View style={styles.bilatRow}>
          <Text style={[styles.bilatVal, rFlagged && styles.bilatFlagged]}>
            {fmtVal(rVal)}
          </Text>
          <Text style={styles.bilatLabel}>{label}</Text>
          <Text style={[styles.bilatVal, lFlagged && styles.bilatFlagged]}>
            {fmtVal(lVal)}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.card}>
        <Text style={[styles.cardTag, { color: '#0077b6' }]}>{s.bilatTitle}</Text>
        <View style={styles.bilatHeader}>
          <Text style={styles.bilatHeaderTxt}>{s.bilatRight}</Text>
          <Text style={[styles.bilatHeaderTxt, { opacity: 0 }]}>{'metric label'}</Text>
          <Text style={styles.bilatHeaderTxt}>{s.bilatLeft}</Text>
        </View>
        {row(s.bilatSwingFlex, m.right_peak_swing_flexion, m.left_peak_swing_flexion,
          rightFlagged('swing_flexion'), leftFlagged('swing_flexion'))}
        {row(s.bilatExtLag, m.right_extension_lag, m.left_extension_lag,
          flagSet.has('right_flexion_contracture'), flagSet.has('left_flexion_contracture'))}
        {row(s.bilatLoading, m.right_loading_response_peak, m.left_loading_response_peak,
          rightFlagged('loading_response'), leftFlagged('loading_response'))}
        {row(s.bilatRomDelta, m.right_rom_delta, m.left_rom_delta, false, false)}
        {m.right_varus_valgus_thrust != null && (
          <View style={styles.bilatRow}>
            <Text style={[styles.bilatVal,
              (flagSet.has('significant_varus_valgus_thrust') || flagSet.has('mild_varus_valgus_thrust')) && styles.bilatFlagged]}>
              {m.right_varus_valgus_thrust.toFixed(1)}°
            </Text>
            <Text style={styles.bilatLabel}>
              {lang === 'en' ? 'Varus/valgus' : lang === 'hi' ? 'वेरस/वेल्गस' : 'ভেরাস/ভালগাস'}
            </Text>
            <Text style={styles.bilatVal}>{m.left_varus_valgus_thrust?.toFixed(1) ?? '—'}°</Text>
          </View>
        )}
        <Text style={styles.bilatNote}>
          {lang === 'en' ? '⚠ flagged values are outside normal range'
         : lang === 'hi' ? '⚠ चिह्नित मान सामान्य सीमा से बाहर हैं'
         : '⚠ চিহ্নিত মানগুলি স্বাভাবিক সীমার বাইরে'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{s.resultsTitle}</Text>
            <Text style={styles.headerSub}>
              {today}{result.session_number ? ` · ${tr('Session', 'সেশন')} ${result.session_number}` : ''}
            </Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreNum}>{symmetryScore}</Text>
            <Text style={styles.scoreLbl}>{tr('score', 'স্কোর')}</Text>
          </View>
        </View>
        <LanguageBar current={lang} onChange={setLang} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* F1: KL Stage card */}
        {renderKLCard()}

        {/* Empathy line */}
        {(result.empathy_line || result.empathy_line_en) && (
          <View style={[styles.card, styles.empathyCard]}>
            <Text style={styles.empathyTxt}>
              {lang === 'en' ? result.empathy_line_en : result.empathy_line}
            </Text>
          </View>
        )}

        {/* Memory banner */}
        {hurtMemos.length > 0 && (
          <View style={styles.memBanner}>
            <Text style={styles.memTitle}>💭 {tr('I remember', 'আমি মনে রেখেছি')}</Text>
            {hurtMemos.map((mm, i) => (
              <Text key={i} style={styles.memLine}>
                {tr(
                  `Last time the ${mm.name} hurt${mm.side ? ` your ${mm.side}` : ''} — today, gentler.`,
                  `গতবার ${mm.name} এ ব্যথা হয়েছিল — আজ আস্তে করুন।`
                )}
              </Text>
            ))}
          </View>
        )}

        {/* Observation */}
        <View style={styles.card}>
          <Text style={[styles.cardTag, { color: '#2d6a4f' }]}>{s.observationTag}</Text>
          <Text style={styles.cardText}>
            {lang === 'en' ? result.observation_en : result.observation}
          </Text>
          {result.symmetry_meaning && (
            <Text style={[styles.cardText, { marginTop: 8, fontStyle: 'italic', color: '#2d6a4f' }]}>
              {lang === 'en' ? result.symmetry_meaning_en : result.symmetry_meaning}
            </Text>
          )}
        </View>

        {/* Metrics strip */}
        <View style={styles.metricsCard}>
          {metric(tr('Trunk lean', 'ধড় হেলান'), m.trunk_lean_angle, '°')}
          {metric(tr('Knee Δ', 'হাঁটু পার্থক্য'), m.knee_angle_diff, '°')}
          {metric(tr('Cadence', 'ছন্দ'), m.cadence, '/min')}
          {metric(tr('Confidence', 'নির্ভুলতা'), m.confidence != null ? Math.round(m.confidence * 100) : null, '%')}
        </View>

        {/* F3: Bilateral comparison */}
        {renderBilateral()}

        {/* Fix */}
        <View style={styles.card}>
          <Text style={[styles.cardTag, { color: '#e76f51' }]}>{s.fixTag}</Text>
          <Text style={styles.cardTitle}>
            {lang === 'en' ? result.fix_title_en : result.fix_title}
          </Text>
          <Text style={styles.cardText}>
            {lang === 'en' ? result.fix_desc_en : result.fix_desc}
          </Text>
        </View>

        {/* Speak button */}
        <TouchableOpacity
          style={[styles.speakBtn, speaking && styles.speakBtnActive]}
          onPress={speakText}
          activeOpacity={0.85}
        >
          <Text style={styles.speakBtnTxt}>
            {speaking ? tr('⏹ Stop', '⏹ থামুন') : s.speakBtn}
          </Text>
        </TouchableOpacity>

        {/* F2: Clinical flag cards */}
        {renderFlagCards()}

        {/* Exercises */}
        <Text style={styles.sectionH}>{s.exerciseTag}</Text>
        {result.exercises?.map((ex, i) => (
          <ExerciseCard key={i} exercise={ex} lang={lang} index={i} onTry={onTryExercise} />
        ))}

        {/* Frequency / pain rule / red flags / complementary */}
        <View style={styles.infoRow}>
          {result.frequency && (
            <View style={[styles.infoCard, { backgroundColor: '#f0faf4', borderColor: '#d8f3dc' }]}>
              <Text style={styles.infoLbl}>⏱ {tr('How often', 'কতবার')}</Text>
              <Text style={styles.infoTxt}>{lang === 'en' ? result.frequency_en : result.frequency}</Text>
            </View>
          )}
          {result.pain_rule && (
            <View style={[styles.infoCard, { backgroundColor: '#fdf1d6', borderColor: '#f4d58d' }]}>
              <Text style={styles.infoLbl}>⚠️ {tr('Pain rule', 'ব্যথার নিয়ম')}</Text>
              <Text style={styles.infoTxt}>{lang === 'en' ? result.pain_rule_en : result.pain_rule}</Text>
            </View>
          )}
          {result.red_flags && (
            <View style={[styles.infoCard, { backgroundColor: '#fde2d4', borderColor: '#f8b39b' }]}>
              <Text style={styles.infoLbl}>🚩 {tr('Call doctor if', 'ডাক্তার ডাকুন যদি')}</Text>
              <Text style={styles.infoTxt}>{lang === 'en' ? result.red_flags_en : result.red_flags}</Text>
            </View>
          )}
          {result.complementary_actions && (
            <View style={[styles.infoCard, { backgroundColor: '#eaf2ff', borderColor: '#cfe0ff' }]}>
              <Text style={styles.infoLbl}>💡 {tr('Also helps', 'এটাও সাহায্য করবে')}</Text>
              <Text style={styles.infoTxt}>{lang === 'en' ? result.complementary_actions_en : result.complementary_actions}</Text>
            </View>
          )}
        </View>

        {result.referral_recommended && result.referral_text && (
          <View style={[styles.card, { borderColor: '#e76f51', borderWidth: 1.5 }]}>
            <Text style={[styles.cardTag, { color: '#e76f51' }]}>
              🩺 {tr('See a doctor', 'ডাক্তার দেখান')}
            </Text>
            <Text style={styles.cardText}>{lang === 'en' ? result.referral_text_en : result.referral_text}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnTxt}>{s.homeBtn}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header: { backgroundColor: '#1a3326', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 10, color: '#52b788', marginTop: 2 },
  scoreBadge:  { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  scoreNum:    { fontSize: 18, fontWeight: '800', color: '#fff' },
  scoreLbl:    { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  // F1 — KL card
  klCard: {
    borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1,
  },
  klLeft: { alignItems: 'flex-start' },
  klStageNum: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  klSeverity: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  klLabel:    { fontSize: 10, color: '#888', marginTop: 2 },
  klRight:    { flex: 1, alignItems: 'flex-end', gap: 6 },
  klBilateralPill:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  klBilateralTxt:   { fontSize: 10, fontWeight: '700' },
  klBarWrap:  { flexDirection: 'row', gap: 3, marginTop: 4 },
  klBarSeg:   { width: 18, height: 6, borderRadius: 3 },
  klBarLbl:   { fontSize: 8, color: '#aaa', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#ede9df', elevation: 1,
  },
  empathyCard: { backgroundColor: '#fffaf0', borderColor: '#f7e3b0' },
  empathyTxt:  { fontSize: 13, color: '#5a4a1f', lineHeight: 20, fontStyle: 'italic' },
  memBanner:   { backgroundColor: '#1a3326', borderRadius: 12, padding: 13, marginBottom: 10 },
  memTitle:    { color: '#52b788', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  memLine:     { color: '#fff', fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  cardTag:     { fontSize: 10, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#1a3326', marginBottom: 6, lineHeight: 22 },
  cardText:    { fontSize: 13, color: '#444', lineHeight: 20 },

  metricsCard: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  metric: {
    flex: 1, backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center',
    borderWidth: 1, borderColor: '#ede9df',
  },
  metricLbl: { fontSize: 9, color: '#888', marginBottom: 4 },
  metricVal: { fontSize: 14, fontWeight: '700', color: '#1a3326' },

  // F2 — flag cards
  flagItem: {
    borderLeftWidth: 4, borderRadius: 10, padding: 11, marginTop: 8,
  },
  flagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  flagIcon:   { fontSize: 16 },
  flagName:   { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
  flagWhyLbl: { fontSize: 9, fontWeight: '700', color: '#888', marginBottom: 3, letterSpacing: 0.3, textTransform: 'uppercase' },
  flagWhy:    { fontSize: 12, color: '#555', lineHeight: 18 },

  // F3 — bilateral
  bilatHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bilatHeaderTxt: { fontSize: 11, fontWeight: '700', color: '#1a3326', flex: 1, textAlign: 'center' },
  bilatRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f0ece2' },
  bilatLabel:     { flex: 1, fontSize: 11, color: '#666', textAlign: 'center' },
  bilatVal:       { flex: 1, fontSize: 13, fontWeight: '700', color: '#1a3326', textAlign: 'center' },
  bilatFlagged:   { color: '#e76f51' },
  bilatNote:      { fontSize: 9, color: '#aaa', marginTop: 8 },

  sectionH:  { fontSize: 12, fontWeight: '700', color: '#7c3aed', marginTop: 10, marginBottom: 8, letterSpacing: 0.4 },
  speakBtn:      { backgroundColor: '#1a3326', borderRadius: 11, paddingVertical: 13, alignItems: 'center', marginBottom: 14, elevation: 2 },
  speakBtnActive:{ backgroundColor: '#e76f51' },
  speakBtnTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  infoRow: { gap: 8, marginTop: 6 },
  infoCard:{ borderRadius: 11, padding: 12, borderWidth: 1 },
  infoLbl: { fontSize: 11, fontWeight: '700', color: '#1a3326', marginBottom: 4 },
  infoTxt: { fontSize: 12.5, color: '#444', lineHeight: 19 },
  homeBtn:    { backgroundColor: '#e8e5de', borderRadius: 11, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  homeBtnTxt: { color: '#444', fontSize: 14, fontWeight: '600' },
});
