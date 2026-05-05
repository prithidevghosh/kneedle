import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import TrendChart from '../components/TrendChart';
import { exportDoctorSummary } from '../utils/pdf';
import { getFlagInfo, FLAG_SEVERITY_COLORS } from '../utils/flags';

const BAR_MAX_HEIGHT = 60;

function MiniBarChart({ painLog, days }) {
  const last7 = Array(7).fill(null);
  const now = Date.now();
  painLog.forEach(entry => {
    const daysAgo = Math.floor((now - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7 && last7[6 - daysAgo] === null) last7[6 - daysAgo] = entry.level;
  });
  return (
    <View style={chartStyles.wrap}>
      {last7.map((val, i) => {
        const barH = val ? (val / 5) * BAR_MAX_HEIGHT : 4;
        const barColor = !val ? '#e8e5de' : val <= 2 ? '#52b788' : val <= 3 ? '#fde68a' : '#f87171';
        return (
          <View key={i} style={chartStyles.colWrap}>
            <View style={chartStyles.barContainer}>
              <View style={[chartStyles.bar, { height: barH, backgroundColor: barColor }]} />
            </View>
            <Text style={chartStyles.dayLabel}>{days[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}
const chartStyles = StyleSheet.create({
  wrap:         { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 },
  colWrap:      { flex: 1, alignItems: 'center' },
  barContainer: { height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', width: '100%' },
  bar:          { borderRadius: 4, width: '100%', minHeight: 4 },
  dayLabel:     { fontSize: 8, color: '#888', marginTop: 4, textAlign: 'center' },
});

const STREAK_STICKERS = [
  { days: 30, emoji: '🏆', label: 'Champion' },
  { days: 14, emoji: '🌟', label: 'Two-week star' },
  { days: 7,  emoji: '🎖',  label: 'Week warrior' },
  { days: 5,  emoji: '🔥',  label: '5-day streak' },
  { days: 3,  emoji: '✨',  label: 'Building habit' },
  { days: 1,  emoji: '🌱',  label: 'Getting started' },
];
function pickSticker(streak) {
  return STREAK_STICKERS.find(s => streak >= s.days) || null;
}

// ── F6: Flag Clearance component ──────────────────────────────────────────────
// Compares current session flags with all previous sessions to show what cleared.
function FlagClearanceCard({ sessions, lang, s }) {
  if (sessions.length < 2) return null;

  const currentFlags  = new Set(sessions[0].result?.clinical_flags || []);
  const previousFlags = new Set(sessions[1].result?.clinical_flags || []);

  const cleared    = [...previousFlags].filter(f => !currentFlags.has(f));
  const newFlags   = [...currentFlags].filter(f => !previousFlags.has(f));
  const persisting = [...currentFlags].filter(f => previousFlags.has(f));

  if (cleared.length === 0 && newFlags.length === 0 && persisting.length === 0) return null;

  const renderFlagRow = (code, status) => {
    const info = getFlagInfo(code, lang);
    if (!info) return null;
    const colors = FLAG_SEVERITY_COLORS[info.severity];
    const statusColor =
      status === 'cleared'    ? '#2d6a4f' :
      status === 'new'        ? '#c0392b' : '#b7620a';
    const statusLabel =
      status === 'cleared'    ? s.flagCleared :
      status === 'new'        ? s.flagNew     : s.flagPersisting;
    return (
      <View key={code} style={flagStyles.row}>
        <View style={[flagStyles.dot, { backgroundColor: colors.dot }]} />
        <Text style={flagStyles.name} numberOfLines={1}>{info.name}</Text>
        <View style={[flagStyles.statusPill, { backgroundColor: statusColor + '22' }]}>
          <Text style={[flagStyles.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{s.flagProgressTitle}</Text>
      {cleared.length    === 0 && newFlags.length === 0 && persisting.length === 0
        ? <Text style={{ fontSize: 13, color: '#2d6a4f' }}>{s.flagAllClear}</Text>
        : null
      }
      {cleared.map(f    => renderFlagRow(f, 'cleared'))}
      {newFlags.map(f   => renderFlagRow(f, 'new'))}
      {persisting.map(f => renderFlagRow(f, 'persisting'))}
      <Text style={flagStyles.footnote}>
        {lang === 'en'
          ? `${currentFlags.size} ${s.flagCount} this session · ${previousFlags.size} last session`
          : `এই সেশনে ${currentFlags.size} ${s.flagCount} · গতবার ${previousFlags.size}`}
      </Text>
    </View>
  );
}
const flagStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0ece2' },
  dot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  name:      { flex: 1, fontSize: 12, color: '#333' },
  statusPill:{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
  footnote:  { fontSize: 9, color: '#aaa', marginTop: 8 },
});

// ── F9: Symptom correlation ───────────────────────────────────────────────────
function SymptomCorrelCard({ sessions, painLog, lang, s }) {
  if (sessions.length < 3 || painLog.length < 5) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{s.symptomCorrTitle}</Text>
        <Text style={{ fontSize: 12, color: '#888' }}>{s.symptomCorrNotEnough}</Text>
      </View>
    );
  }

  // For each session, find the pain level logged closest to the session date (±12 hrs).
  // Split into high-score (≥70) and low-score (<70) buckets; average pain for each.
  const SCORE_THRESHOLD = 70;
  let highScorePains = [], lowScorePains = [];

  sessions.forEach(sess => {
    const score = sess.result?.symmetry_score;
    if (score == null) return;
    const sessTime = new Date(sess.date).getTime();
    // find closest pain entry within 12 hours
    let closest = null, bestDiff = Infinity;
    painLog.forEach(p => {
      const diff = Math.abs(new Date(p.date).getTime() - sessTime);
      if (diff < bestDiff && diff < 12 * 3600 * 1000) { bestDiff = diff; closest = p; }
    });
    if (!closest) return;
    if (score >= SCORE_THRESHOLD) highScorePains.push(closest.level);
    else                          lowScorePains.push(closest.level);
  });

  if (highScorePains.length < 2 || lowScorePains.length < 2) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{s.symptomCorrTitle}</Text>
        <Text style={{ fontSize: 12, color: '#888' }}>{s.symptomCorrNotEnough}</Text>
      </View>
    );
  }

  const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  const highAvg = avg(highScorePains);
  const lowAvg  = avg(lowScorePains);
  const improving = parseFloat(highAvg) < parseFloat(lowAvg);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{s.symptomCorrTitle}</Text>
      <View style={corrStyles.row}>
        <View style={[corrStyles.bucket, { backgroundColor: '#d8f3dc' }]}>
          <Text style={corrStyles.bucketScore}>
            {lang === 'en' ? `Score ≥ ${SCORE_THRESHOLD}` : `স্কোর ≥ ${SCORE_THRESHOLD}`}
          </Text>
          <Text style={corrStyles.bucketPain}>{highAvg}<Text style={corrStyles.unit}>/5</Text></Text>
          <Text style={corrStyles.bucketLbl}>
            {lang === 'en' ? 'avg pain' : 'গড় ব্যথা'}
          </Text>
        </View>
        <Text style={corrStyles.arrow}>{improving ? '>' : '<'}</Text>
        <View style={[corrStyles.bucket, { backgroundColor: '#fde2d4' }]}>
          <Text style={corrStyles.bucketScore}>
            {lang === 'en' ? `Score < ${SCORE_THRESHOLD}` : `স্কোর < ${SCORE_THRESHOLD}`}
          </Text>
          <Text style={corrStyles.bucketPain}>{lowAvg}<Text style={corrStyles.unit}>/5</Text></Text>
          <Text style={corrStyles.bucketLbl}>
            {lang === 'en' ? 'avg pain' : 'গড় ব্যথা'}
          </Text>
        </View>
      </View>
      {improving && (
        <Text style={corrStyles.insight}>
          {lang === 'en'
            ? '✓ Better gait scores correlate with lower pain — the exercises are working.'
            : lang === 'hi'
            ? '✓ बेहतर गेट स्कोर कम दर्द से जुड़े हैं — व्यायाम काम कर रहे हैं।'
            : '✓ ভালো গেইট স্কোর কম ব্যথার সাথে সম্পর্কিত — ব্যায়াম কাজ করছে।'}
        </Text>
      )}
    </View>
  );
}
const corrStyles = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  bucket:      { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  bucketScore: { fontSize: 10, color: '#555', marginBottom: 4 },
  bucketPain:  { fontSize: 24, fontWeight: '800', color: '#1a3326' },
  unit:        { fontSize: 12, fontWeight: '400' },
  bucketLbl:   { fontSize: 10, color: '#666', marginTop: 2 },
  arrow:       { fontSize: 20, color: '#aaa' },
  insight:     { fontSize: 12, color: '#2d6a4f', marginTop: 10, lineHeight: 18, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HistoryScreen({ navigation, route }) {
  const [lang,           setLang]           = useState(route.params?.lang || 'en');
  const [sessions,       setSessions]       = useState([]);
  const [painLog,        setPainLog]        = useState([]);
  const [trunkSeries,    setTrunkSeries]    = useState([]);
  const [symmetrySeries, setSymmetrySeries] = useState([]);
  const [gaitSpeedSeries,setGaitSpeedSeries]= useState([]);  // F5
  const [streak,         setStreak]         = useState(0);
  const [profile,        setProfile]        = useState(null);
  const [exporting,      setExporting]      = useState(false);
  const s = getStrings(lang);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const savedLang = await Storage.getLanguage();
        setLang(savedLang);
        const sess = await Storage.getSessions();
        setSessions(sess);
        const log = await Storage.getPainLog();
        setPainLog(log);
        setStreak(await Storage.getStreak());
        setProfile(await Storage.getProfile());
        setTrunkSeries(await Storage.getMetricSeries('trunk_lean_angle'));
        setSymmetrySeries(await Storage.getMetricSeries('symmetry_score'));
        setGaitSpeedSeries(await Storage.getMetricSeries('gait_speed_proxy')); // F5
      })();
    }, [])
  );

  const handleLangChange = async (l) => {
    setLang(l);
    await Storage.saveLanguage(l);
  };

  const onClearAll = () => {
    Alert.alert(
      s.clearAllConfirmTitle,
      s.clearAllConfirmBody,
      [
        { text: s.clearAllConfirmCancel, style: 'cancel' },
        {
          text: s.clearAllConfirmOk,
          style: 'destructive',
          onPress: async () => {
            await Storage.clearAllSessions();
            setSessions([]);
            setPainLog([]);
            setStreak(0);
            setTrunkSeries([]);
            setSymmetrySeries([]);
            setGaitSpeedSeries([]);
          },
        },
      ]
    );
  };

  const onExport = async () => {
    setExporting(true);
    const res = await exportDoctorSummary({ profile, sessions, painLog, streak, lang });
    setExporting(false);
    if (!res.ok) {
      Alert.alert('Export failed', res.error || 'Please try again');
    } else if (res.mode === 'text') {
      Alert.alert(
        'Shared as text',
        'Install expo-print + expo-sharing for a true PDF export:\n\nnpx expo install expo-print expo-sharing'
      );
    }
  };

  const trend = (() => {
    if (painLog.length < 2) return null;
    const recent = painLog.slice(0, 3).reduce((a, b) => a + b.level, 0) / Math.min(painLog.length, 3);
    const older  = painLog.slice(3, 6).reduce((a, b) => a + b.level, 0) / Math.min(painLog.slice(3, 6).length || 1, 3);
    if (recent < older - 0.3) return 'improving';
    if (recent > older + 0.3) return 'worse';
    return 'same';
  })();
  const trendColor = trend === 'improving' ? '#2d6a4f' : trend === 'worse' ? '#e76f51' : '#888';
  const trendLabel = trend ? s[trend] : '';

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(
      lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN',
      { day: 'numeric', month: 'short' }
    );
  };

  const sticker = pickSticker(streak);
  const chartW  = Dimensions.get('window').width - 28 - 28;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{s.historyTitle}</Text>
            <Text style={styles.headerSub}>{sessions.length} {s.historySub}</Text>
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '22' }]}>
              <Text style={[styles.trendTxt, { color: trendColor }]}>{trendLabel}</Text>
            </View>
          )}
        </View>
        <LanguageBar current={lang} onChange={handleLangChange} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Streak sticker */}
        {sticker && (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>{sticker.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakBig}>
                {streak} {lang === 'en' ? 'day streak' : lang === 'hi' ? 'दिन लगातार' : 'দিন একটানা'}
              </Text>
              <Text style={styles.streakSub}>{sticker.label}</Text>
            </View>
          </View>
        )}

        {/* Doctor summary export */}
        <TouchableOpacity style={styles.pdfBtn} onPress={onExport} disabled={exporting} activeOpacity={0.85}>
          <Text style={styles.pdfBtnIcon}>📄</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pdfBtnTitle}>
              {exporting
                ? (lang === 'en' ? 'Preparing…' : lang === 'hi' ? 'तैयार हो रहा है…' : 'তৈরি হচ্ছে…')
                : (lang === 'en' ? 'Doctor summary (PDF)' : lang === 'hi' ? 'डॉक्टर सारांश (PDF)' : 'ডাক্তারের জন্য সারাংশ (PDF)')}
            </Text>
            <Text style={styles.pdfBtnSub}>
              {lang === 'en' ? 'Share with your physician' : lang === 'hi' ? 'अपने चिकित्सक को दिखाएं' : 'ডাক্তারকে দেখান'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* F6: Flag clearance tracker */}
        <FlagClearanceCard sessions={sessions} lang={lang} s={s} />

        {/* F5: Gait speed trend */}
        {gaitSpeedSeries.length >= 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{s.gaitSpeedLabel}</Text>
            <TrendChart series={gaitSpeedSeries} unit=" m/s" goal="up" width={chartW} color="#0077b6" />
            <View style={styles.gaitGoalRow}>
              <View style={styles.gaitGoalLine} />
              <Text style={styles.gaitGoalLbl}>{s.gaitSpeedGoalNote}</Text>
            </View>
          </View>
        )}

        {/* Symmetry trend */}
        {symmetrySeries.length >= 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              {lang === 'en' ? 'Symmetry score' : lang === 'hi' ? 'समरूपता स्कोर' : 'সামঞ্জস্য স্কোর'}
            </Text>
            <TrendChart series={symmetrySeries} unit="" goal="up" width={chartW} color="#7c3aed" />
          </View>
        )}

        {/* Trunk lean trend */}
        {trunkSeries.length >= 1 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              {lang === 'en' ? 'Trunk lean over time' : lang === 'hi' ? 'ट्रंक झुकाव · समय के साथ' : 'ধড় হেলান · সময়ের সাথে'}
            </Text>
            <TrendChart series={trunkSeries} unit="°" goal="down" width={chartW} color="#2d6a4f" />
          </View>
        )}

        {/* Pain trend chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{s.painTrend}</Text>
          <MiniBarChart painLog={painLog} days={s.days} />
        </View>

        {/* F9: Symptom-gait correlation */}
        <SymptomCorrelCard sessions={sessions} painLog={painLog} lang={lang} s={s} />

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🚶</Text>
            <Text style={styles.emptyTitle}>{s.noHistory}</Text>
            <Text style={styles.emptySub}>{s.noHistorySub}</Text>
            <TouchableOpacity style={styles.recordNowBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.recordNowTxt}>{s.recordBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sessions.map((sess, i) => {
            const result     = sess.result || {};
            const score      = result.symmetry_score || 0;
            const scoreColor = score >= 75 ? '#2d6a4f' : score >= 50 ? '#f4a261' : '#e76f51';
            const observation = lang === 'en' ? result.observation_en : result.observation;
            const shortObs    = observation?.split(/[।.]/)[0] || '';
            const flagCount   = result.clinical_flags?.length ?? 0;

            return (
              <TouchableOpacity
                key={i}
                style={styles.sessionCard}
                onPress={() => navigation.navigate('Results', { result, lang })}
                activeOpacity={0.85}
              >
                <View style={styles.sessionLeft}>
                  <View style={[styles.sessionScore, { backgroundColor: scoreColor }]}>
                    <Text style={styles.sessionScoreNum}>{score}</Text>
                  </View>
                </View>
                <View style={styles.sessionMid}>
                  <View style={styles.sessionTopRow}>
                    <Text style={styles.sessionNum}>
                      {s.session} {sessions.length - i}
                      {i === sessions.length - 1 ? ` · ${s.firstSession}` : ''}
                    </Text>
                    {flagCount > 0 && (
                      <View style={styles.flagCountPill}>
                        <Text style={styles.flagCountTxt}>{flagCount} {s.flagCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionObs} numberOfLines={2}>{shortObs}</Text>
                </View>
                <Text style={styles.sessionDate}>{formatDate(sess.date)}</Text>
              </TouchableOpacity>
            );
          })
        )}
        {/* Clear all records */}
        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClearAll} activeOpacity={0.8}>
            <Text style={styles.clearBtnTxt}>{s.clearAllBtn}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header:    { backgroundColor: '#1a3326', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:   { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  backTxt:   { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 10, color: '#52b788', marginTop: 1 },
  trendBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trendTxt:    { fontSize: 10, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#ede9df', elevation: 1,
  },
  cardLabel: { fontSize: 11, color: '#888', marginBottom: 6 },

  // F5: gait speed goal annotation
  gaitGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  gaitGoalLine:{ flex: 1, height: 1, backgroundColor: '#0077b6', opacity: 0.4 },
  gaitGoalLbl: { fontSize: 9, color: '#0077b6', flex: 3 },

  streakCard: {
    backgroundColor: '#fffaf0', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#f7e3b0',
  },
  streakEmoji: { fontSize: 36 },
  streakBig:   { fontSize: 18, fontWeight: '800', color: '#1a3326' },
  streakSub:   { fontSize: 12, color: '#7a6a3f', marginTop: 2 },

  pdfBtn: {
    backgroundColor: '#1a3326', borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 2,
  },
  pdfBtnIcon:  { fontSize: 24 },
  pdfBtnTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pdfBtnSub:   { color: '#52b788', fontSize: 11, marginTop: 2 },

  clearBtn: {
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#fecaca',
  },
  clearBtnTxt: { color: '#dc2626', fontSize: 13, fontWeight: '600' },

  emptyWrap:  { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  emptyIcon:  { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a3326', marginBottom: 6 },
  emptySub:   { fontSize: 13, color: '#888', marginBottom: 20 },
  recordNowBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 11, paddingVertical: 13,
    paddingHorizontal: 28, elevation: 2,
  },
  recordNowTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },

  sessionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 9,
    borderWidth: 1, borderColor: '#ede9df', flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1,
  },
  sessionLeft:  { alignItems: 'center' },
  sessionScore: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sessionScoreNum: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sessionMid:   { flex: 1 },
  sessionTopRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  sessionNum:   { fontSize: 11, fontWeight: '700', color: '#1a3326' },
  flagCountPill:{ backgroundColor: '#fde2d4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  flagCountTxt: { fontSize: 9, color: '#c0392b', fontWeight: '700' },
  sessionObs:   { fontSize: 12, color: '#666', lineHeight: 17 },
  sessionDate:  { fontSize: 10, color: '#888', flexShrink: 0 },
});
