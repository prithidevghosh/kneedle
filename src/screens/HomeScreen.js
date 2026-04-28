import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import PainDots from '../components/PainDots';

export default function HomeScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.lang || 'bn');
  const [profile, setProfile] = useState(route.params?.profile || null);
  const [painLevel, setPainLevel] = useState(3);
  const [sessions, setSessions] = useState([]);
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

  return (
    <SafeAreaView style={styles.container}>
      <LanguageBar current={lang} onChange={handleLangChange} />
      <View style={styles.header}>
        <Text style={styles.greeting}>{s.greeting}</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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
  header: { backgroundColor: '#1a3326', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  greeting: { fontSize: 11, color: '#52b788', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  date: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
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
  btnText: { flex: 1 },
  btnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnSub: { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  progressBg: { backgroundColor: '#e8e5de', borderRadius: 10, height: 6 },
  progressFill: { height: 6, backgroundColor: '#2d6a4f', borderRadius: 10 },
});
