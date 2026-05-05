import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import PainDots from '../components/PainDots';
import { KL_GRADE_MAP } from '../utils/flags';

export default function HomeScreen({ navigation, route }) {
  const [lang, setLang]       = useState(route.params?.lang || 'en');
  const [profile, setProfile] = useState(route.params?.profile || null);
  const [painLevel, setPainLevel] = useState(3);
  const [sessions, setSessions]   = useState([]);
  const [lastResult, setLastResult] = useState(null); // result from most recent session
  const [daysSinceLastScan, setDaysSinceLastScan] = useState(null);
  const s = getStrings(lang);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const savedLang = await Storage.getLanguage();
        setLang(savedLang);
        const p = await Storage.getProfile();
        if (p) setProfile(p);
        const sess = await Storage.getSessions();
        setSessions(sess);

        if (sess.length > 0) {
          setLastResult(sess[0].result || null);
          const lastDate = new Date(sess[0].date);
          const diff = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          setDaysSinceLastScan(diff);
        } else {
          setLastResult(null);
          setDaysSinceLastScan(null);
        }
      })();
    }, [])
  );

  const handlePainChange = async (level) => {
    setPainLevel(level);
    await Storage.logPain(level);
  };

  const handleLangChange = async (l) => {
    setLang(l);
    await Storage.saveLanguage(l);
    if (profile) await Storage.saveProfile({ ...profile, lang: l });
  };

  const displayName = profile
    ? profile.name + (lang === 'bn' ? ' দি' : lang === 'hi' ? ' जी' : '')
    : '';

  const today = new Date();
  const dateStr = lang === 'en'
    ? today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : lang === 'hi'
    ? today.toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : today.toLocaleDateString('bn-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const weekCount = sessions.filter(sess => {
    const diff = (Date.now() - new Date(sess.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const weekPct = Math.min((weekCount / 7) * 100, 100);

  // ── F4: Fall risk ─────────────────────────────────────────────────────────
  const isFallRisk = (() => {
    if (!lastResult?.metrics) return false;
    const m = lastResult.metrics;
    const highDoubleSupport = (m.double_support_ratio ?? 0) > 28;
    const slowGait          = (m.gait_speed_proxy   ?? 1) < 0.75;
    return highDoubleSupport || slowGait;
  })();

  // ── F1: KL stage on home ──────────────────────────────────────────────────
  const klGrade = lastResult?.kl_proxy_grade;
  const klInfo  = klGrade ? KL_GRADE_MAP[klGrade] : null;

  // ── F10: Morning check-in advice ─────────────────────────────────────────
  // Uses today's pain level (logged on home) + last session pain_rule threshold.
  const getMorningAdvice = () => {
    if (painLevel >= 5) return { text: s.morningRest, bg: '#fde2d4', border: '#f8b39b' };
    if (painLevel >= 4) return { text: s.morningEasy, bg: '#fdf1d6', border: '#f4d58d' };
    return { text: s.morningGo, bg: '#d8f3dc', border: '#52b788' };
  };
  const morningAdvice = getMorningAdvice();

  // Rescan nudge: if last session was > 5 days ago
  const showRescanNudge = daysSinceLastScan !== null && daysSinceLastScan >= 5;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{s.greeting}</Text>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          {/* F1: KL stage pill in header */}
          {klInfo && (
            <View style={[styles.klPill, { backgroundColor: klInfo.color + '33' }]}>
              <Text style={[styles.klPillTxt, { color: klInfo.bg === '#d8f3dc' ? '#2d6a4f' : klInfo.color }]}>
                {s.klStagePrefix} {klInfo.stage}
              </Text>
              <Text style={[styles.klPillSeverity, { color: klInfo.bg === '#d8f3dc' ? '#2d6a4f' : klInfo.color }]}>
                {s[klInfo.severityKey]}
              </Text>
            </View>
          )}
        </View>
        <LanguageBar current={lang} onChange={handleLangChange} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* F10: Morning check-in card */}
        <View style={[styles.morningCard, { backgroundColor: morningAdvice.bg, borderColor: morningAdvice.border }]}>
          <Text style={styles.morningTitle}>{s.morningTitle}</Text>
          <Text style={styles.morningText}>{morningAdvice.text}</Text>
          {showRescanNudge && (
            <Text style={styles.rescanNudge}>
              {daysSinceLastScan} {s.morningRescan}
            </Text>
          )}
        </View>

        {/* F4: Fall risk banner */}
        {isFallRisk && (
          <View style={styles.fallRiskCard}>
            <Text style={styles.fallRiskTitle}>⚖️ {s.fallRiskTitle}</Text>
            <Text style={styles.fallRiskBody}>{s.fallRiskBody}</Text>
          </View>
        )}

        {/* Today's pain */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{s.todayPain}</Text>
          <PainDots value={painLevel} onChange={handlePainChange} lang={lang} />
        </View>

        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: '#2d6a4f' }]}
          onPress={() => navigation.navigate('Record', { profile, lang })}
          activeOpacity={0.87}
        >
          <View style={styles.btnIcon}><Text style={{ fontSize: 22 }}>🚶</Text></View>
          <View style={styles.btnText}>
            <Text style={styles.btnTitle}>{s.recordBtn}</Text>
            <Text style={styles.btnSub}>{s.recordSub}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: '#e76f51' }]}
          onPress={() => navigation.navigate('History', { lang })}
          activeOpacity={0.87}
        >
          <View style={styles.btnIcon}><Text style={{ fontSize: 22 }}>📋</Text></View>
          <View style={styles.btnText}>
            <Text style={styles.btnTitle}>{s.historyBtn}</Text>
            <Text style={styles.btnSub}>{sessions.length} {s.historySub}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>{s.weekProgress} · {weekCount}/7 {s.daysLabel}</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${weekPct}%` }]} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header:    { backgroundColor: '#1a3326', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:  { fontSize: 11, color: '#52b788', marginBottom: 2 },
  name:      { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  date:      { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  // F1: KL pill
  klPill:        { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  klPillTxt:     { fontSize: 18, fontWeight: '900' },
  klPillSeverity:{ fontSize: 9, fontWeight: '700', marginTop: 1 },

  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  // F10: morning check-in
  morningCard: {
    borderRadius: 12, padding: 13, marginBottom: 10,
    borderWidth: 1,
  },
  morningTitle:{ fontSize: 12, fontWeight: '700', color: '#1a3326', marginBottom: 4 },
  morningText: { fontSize: 13, color: '#1a3326', lineHeight: 19 },
  rescanNudge: { fontSize: 11, color: '#e76f51', marginTop: 6, fontWeight: '600' },

  // F4: fall risk
  fallRiskCard: {
    backgroundColor: '#fff3cd', borderRadius: 12, padding: 13,
    marginBottom: 10, borderWidth: 1, borderColor: '#ffc107',
  },
  fallRiskTitle: { fontSize: 13, fontWeight: '700', color: '#856404', marginBottom: 4 },
  fallRiskBody:  { fontSize: 12.5, color: '#856404', lineHeight: 19 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#ede9df',
  },
  cardLabel: { fontSize: 11, color: '#888', marginBottom: 10 },

  bigBtn: {
    borderRadius: 13, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 10, elevation: 3,
  },
  btnIcon: {
    width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  btnText:  { flex: 1 },
  btnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },

  progressBg:   { backgroundColor: '#e8e5de', borderRadius: 10, height: 6 },
  progressFill: { height: 6, backgroundColor: '#2d6a4f', borderRadius: 10 },
});
