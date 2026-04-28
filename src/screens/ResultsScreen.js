import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import * as Speech from 'expo-speech';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';

export default function ResultsScreen({ navigation, route }) {
  const { result, lang: initLang = 'bn', profile } = route.params;
  const [lang, setLang] = useState(initLang);
  const [speaking, setSpeaking] = useState(false);
  const s = getStrings(lang);

  const today = new Date().toLocaleDateString(
    lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN',
    { day: 'numeric', month: 'long' }
  );

  const speakText = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = lang === 'en'
      ? `${result.observation_en}. ${result.fix_desc}`
      : `${result.observation}। ${result.fix_desc}`;
    const voiceLang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'bn-IN';
    setSpeaking(true);
    Speech.speak(text, {
      language: voiceLang,
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const symmetryScore = result.symmetry_score || 0;
  const scoreColor = symmetryScore >= 75 ? '#2d6a4f' : symmetryScore >= 50 ? '#f4a261' : '#e76f51';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{s.resultsTitle}</Text>
            <Text style={styles.headerSub}>{today}</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreNum}>{symmetryScore}</Text>
            <Text style={styles.scoreLbl}>{lang === 'en' ? 'score' : 'স্কোর'}</Text>
          </View>
        </View>
        <LanguageBar current={lang} onChange={setLang} />
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Observation */}
        <View style={styles.card}>
          <Text style={[styles.cardTag, { color: '#2d6a4f' }]}>{s.observationTag}</Text>
          <Text style={styles.cardTitle}>
            {lang === 'en'
              ? result.observation_en?.split('.')[0]
              : result.observation?.split('।')[0]}
          </Text>
          <Text style={styles.cardText}>
            {lang === 'en' ? result.observation_en : result.observation}
          </Text>
        </View>

        {/* Fix */}
        <View style={styles.card}>
          <Text style={[styles.cardTag, { color: '#e76f51' }]}>{s.fixTag}</Text>
          <Text style={styles.cardTitle}>{result.fix_title}</Text>
          <Text style={styles.cardText}>{result.fix_desc}</Text>
        </View>

        {/* Exercises */}
        <View style={styles.card}>
          <Text style={[styles.cardTag, { color: '#7c3aed' }]}>{s.exerciseTag}</Text>
          <View style={styles.exRow}>
            {result.exercises?.map((ex, i) => (
              <View key={i} style={styles.exChip}>
                <Text style={styles.exName}>{lang === 'en' ? ex.name_en : ex.name}</Text>
                <Text style={styles.exReps}>{lang === 'en' ? ex.reps_en : ex.reps}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Speak button */}
        <TouchableOpacity
          style={[styles.speakBtn, speaking && styles.speakBtnActive]}
          onPress={speakText}
          activeOpacity={0.85}
        >
          <Text style={styles.speakBtnTxt}>{speaking ? '⏹ থামুন' : s.speakBtn}</Text>
        </TouchableOpacity>

        {/* Home button */}
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
  header: {
    backgroundColor: '#1a3326', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 10, color: '#52b788', marginTop: 2 },
  scoreBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  scoreLbl: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#ede9df', elevation: 1,
  },
  cardTag: { fontSize: 10, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a3326', marginBottom: 6, lineHeight: 22 },
  cardText: { fontSize: 13, color: '#444', lineHeight: 20 },
  exRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  exChip: {
    backgroundColor: '#f0faf4', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#d8f3dc',
  },
  exName: { fontSize: 13, fontWeight: '700', color: '#1a3326' },
  exReps: { fontSize: 11, color: '#52b788', marginTop: 2 },
  speakBtn: {
    backgroundColor: '#1a3326', borderRadius: 11, paddingVertical: 15,
    alignItems: 'center', marginBottom: 10, elevation: 2,
  },
  speakBtnActive: { backgroundColor: '#e76f51' },
  speakBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  homeBtn: {
    backgroundColor: '#e8e5de', borderRadius: 11, paddingVertical: 14,
    alignItems: 'center',
  },
  homeBtnTxt: { color: '#444', fontSize: 14, fontWeight: '600' },
});
