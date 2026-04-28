import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';

const BAR_MAX_HEIGHT = 60;

function MiniBarChart({ painLog, days }) {
  const last7 = Array(7).fill(null);
  const now = Date.now();

  painLog.forEach(entry => {
    const daysAgo = Math.floor((now - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7 && last7[6 - daysAgo] === null) {
      last7[6 - daysAgo] = entry.level;
    }
  });

  return (
    <View style={chartStyles.wrap}>
      {last7.map((val, i) => {
        const barH = val ? (val / 5) * BAR_MAX_HEIGHT : 4;
        const barColor = !val ? '#e8e5de'
          : val <= 2 ? '#52b788'
          : val <= 3 ? '#fde68a'
          : '#f87171';
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
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 8 },
  colWrap: { flex: 1, alignItems: 'center' },
  barContainer: { height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', width: '100%' },
  bar: { borderRadius: 4, width: '100%', minHeight: 4 },
  dayLabel: { fontSize: 8, color: '#888', marginTop: 4, textAlign: 'center' },
});

export default function HistoryScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.lang || 'en');
  const [sessions, setSessions] = useState([]);
  const [painLog, setPainLog] = useState([]);
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
      })();
    }, [])
  );

  const handleLangChange = async (l) => {
    setLang(l);
    await Storage.saveLanguage(l);
  };

  const getTrend = () => {
    if (painLog.length < 2) return null;
    const recent = painLog.slice(0, 3).reduce((a, b) => a + b.level, 0) / Math.min(painLog.length, 3);
    const older  = painLog.slice(3, 6).reduce((a, b) => a + b.level, 0) / Math.min(painLog.slice(3, 6).length || 1, 3);
    if (recent < older - 0.3) return 'improving';
    if (recent > older + 0.3) return 'worse';
    return 'same';
  };

  const trend = getTrend();
  const trendColor = trend === 'improving' ? '#2d6a4f' : trend === 'worse' ? '#e76f51' : '#888';
  const trendLabel = trend ? s[trend] : '';

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(
      lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN',
      { day: 'numeric', month: 'short' }
    );
  };

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

        {/* Pain trend chart */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{s.painTrend}</Text>
          <MiniBarChart painLog={painLog} days={s.days} />
        </View>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🚶</Text>
            <Text style={styles.emptyTitle}>{s.noHistory}</Text>
            <Text style={styles.emptySub}>{s.noHistorySub}</Text>
            <TouchableOpacity
              style={styles.recordNowBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.recordNowTxt}>{s.recordBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sessions.map((sess, i) => {
            const result = sess.result || {};
            const score = result.symmetry_score || 0;
            const scoreColor = score >= 75 ? '#2d6a4f' : score >= 50 ? '#f4a261' : '#e76f51';
            const observation = lang === 'en'
              ? result.observation_en
              : result.observation;
            const shortObs = observation?.split(/[।.]/)[0] || '';

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
                  <Text style={styles.sessionNum}>
                    {s.session} {sessions.length - i}
                    {i === sessions.length - 1 ? ` · ${s.firstSession}` : ''}
                  </Text>
                  <Text style={styles.sessionObs} numberOfLines={2}>{shortObs}</Text>
                </View>
                <Text style={styles.sessionDate}>{formatDate(sess.date)}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header: {
    backgroundColor: '#1a3326', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 10, color: '#52b788', marginTop: 1 },
  trendBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  trendTxt: { fontSize: 10, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#ede9df', elevation: 1,
  },
  cardLabel: { fontSize: 11, color: '#888' },
  emptyWrap: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a3326', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#888', marginBottom: 20 },
  recordNowBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 11, paddingVertical: 13,
    paddingHorizontal: 28, elevation: 2,
  },
  recordNowTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sessionCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 13,
    marginBottom: 9, borderWidth: 1, borderColor: '#ede9df',
    flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 1,
  },
  sessionLeft: { alignItems: 'center' },
  sessionScore: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sessionScoreNum: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sessionMid: { flex: 1 },
  sessionNum: { fontSize: 11, fontWeight: '700', color: '#1a3326', marginBottom: 3 },
  sessionObs: { fontSize: 12, color: '#666', lineHeight: 17 },
  sessionDate: { fontSize: 10, color: '#888', flexShrink: 0 },
});
