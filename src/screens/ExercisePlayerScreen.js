import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import YouTubePlayer from '../components/YouTubePlayer';
import { parseReps, localizedNumber, voiceLocale } from '../utils/reps';
import { Storage } from '../utils/storage';

const PHASE = { IDLE: 'idle', RUNNING: 'running', SET_BREAK: 'set_break', DONE: 'done', FEEDBACK: 'feedback' };

export default function ExercisePlayerScreen({ navigation, route }) {
  const { exercise, lang = 'bn' } = route.params;
  const repsSpec = parseReps(lang === 'en' ? exercise.reps_en : exercise.reps);
  const { count, sets, isTime, perSide } = repsSpec;

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [setIdx, setSetIdx] = useState(1);
  const [tick, setTick] = useState(0); // current rep / second
  const [side, setSide] = useState(perSide ? 'right' : null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const cancelRef = useRef(false);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => () => {
    cancelRef.current = true;
    Speech.stop();
  }, []);

  const speak = (txt) => Speech.speak(txt, { language: voiceLocale(lang), rate: 0.9 });

  const wait = (ms) => new Promise(res => {
    const start = Date.now();
    const id = setInterval(() => {
      if (cancelRef.current) { clearInterval(id); res(); return; }
      if (!pausedRef.current && Date.now() - start >= ms) {
        clearInterval(id); res();
      }
    }, 80);
  });

  const animatePulse = () => {
    pulse.setValue(0.85);
    Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  };

  const runExercise = async () => {
    setPhase(PHASE.RUNNING);
    cancelRef.current = false;

    const sideOrder = perSide ? ['right', 'left'] : [null];
    for (let s = 1; s <= sets; s++) {
      if (cancelRef.current) return;
      setSetIdx(s);
      for (const sd of sideOrder) {
        if (cancelRef.current) return;
        if (sd) {
          setSide(sd);
          speak(lang === 'en' ? `${sd} side` : sd === 'right' ? 'ডান পাশ' : 'বাম পাশ');
          await wait(1200);
        }
        speak(lang === 'en' ? `Set ${s}, ready, go` : `সেট ${s}, শুরু`);
        await wait(1400);

        for (let i = 1; i <= count; i++) {
          if (cancelRef.current) return;
          setTick(i);
          animatePulse();
          speak(localizedNumber(i, lang));
          // 1s for time-hold reps, ~1.4s for count reps to give a relaxed pace.
          await wait(isTime ? 1000 : 1400);
        }
      }
      if (s < sets) {
        setPhase(PHASE.SET_BREAK);
        speak(lang === 'en' ? 'Rest for 20 seconds' : '২০ সেকেন্ড বিশ্রাম নিন');
        // 20s rest with countdown
        for (let r = 20; r > 0; r--) {
          if (cancelRef.current) return;
          setTick(r);
          await wait(1000);
        }
        setPhase(PHASE.RUNNING);
      }
    }
    speak(lang === 'en' ? 'Well done. How did that feel?' : 'বাহ! কেমন লাগলো?');
    setPhase(PHASE.FEEDBACK);
  };

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) Speech.stop();
  };

  const stop = () => {
    cancelRef.current = true;
    Speech.stop();
    navigation.goBack();
  };

  const submitFeedback = async (feedback) => {
    await Storage.logExerciseFeedback(exercise.name_en, feedback, side);
    setPhase(PHASE.DONE);
    setTimeout(() => navigation.goBack(), 800);
  };

  const repsLabel = lang === 'en' ? exercise.reps_en : exercise.reps;
  const exerciseName = lang === 'en' ? exercise.name_en : exercise.name;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={stop} style={styles.backBtn}>
          <Text style={styles.backTxt}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{exerciseName}</Text>
          <Text style={styles.sub}>{repsLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <YouTubePlayer url={exercise.video_url} height={210} autoplay={false} />

        {phase === PHASE.IDLE && (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={styles.bigInfo}>
              {sets} × {count}{isTime ? (lang === 'en' ? 's' : ' সে.') : ''}{perSide ? (lang === 'en' ? ' / side' : ' প্রতি পাশে') : ''}
            </Text>
            <TouchableOpacity style={styles.primary} onPress={runExercise} activeOpacity={0.88}>
              <Text style={styles.primaryTxt}>
                {lang === 'en' ? '▶  Start' : '▶  শুরু করুন'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              {lang === 'en'
                ? 'I will count out loud — follow my voice.'
                : 'আমি গুনে দেবো — কণ্ঠস্বর অনুসরণ করুন।'}
            </Text>
          </View>
        )}

        {(phase === PHASE.RUNNING || phase === PHASE.SET_BREAK) && (
          <View style={styles.counterWrap}>
            <Text style={styles.setLbl}>
              {phase === PHASE.SET_BREAK
                ? (lang === 'en' ? 'Rest' : 'বিশ্রাম')
                : `${lang === 'en' ? 'Set' : 'সেট'} ${localizedNumber(setIdx, lang)} / ${localizedNumber(sets, lang)}`}
              {side && phase === PHASE.RUNNING ? ` · ${side === 'right' ? (lang === 'en' ? 'Right' : 'ডান') : (lang === 'en' ? 'Left' : 'বাম')}` : ''}
            </Text>
            <Animated.View style={[styles.bigCircle, { transform: [{ scale: pulse }], backgroundColor: phase === PHASE.SET_BREAK ? '#f4a261' : '#2d6a4f' }]}>
              <Text style={styles.bigNum}>{localizedNumber(tick, lang)}</Text>
              {phase === PHASE.RUNNING && (
                <Text style={styles.bigUnit}>
                  {isTime ? (lang === 'en' ? 'sec' : 'সে.') : ''}
                </Text>
              )}
            </Animated.View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.ctrlBtn} onPress={togglePause}>
                <Text style={styles.ctrlTxt}>
                  {paused ? (lang === 'en' ? '▶ Resume' : '▶ পুনরায়') : (lang === 'en' ? '⏸ Pause' : '⏸ থামুন')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: '#fde2d4' }]} onPress={stop}>
                <Text style={[styles.ctrlTxt, { color: '#e76f51' }]}>
                  {lang === 'en' ? '⏹ Stop' : '⏹ বাতিল'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === PHASE.FEEDBACK && (
          <View style={styles.fbWrap}>
            <Text style={styles.fbTitle}>
              {lang === 'en' ? 'Did this hurt?' : 'এতে ব্যথা হয়েছিল কি?'}
            </Text>
            <Text style={styles.fbSub}>
              {lang === 'en' ? "I'll remember for next time." : 'আমি পরের বার মনে রাখবো।'}
            </Text>
            <View style={styles.fbRow}>
              <TouchableOpacity style={[styles.fbBtn, { backgroundColor: '#fde2d4' }]} onPress={() => submitFeedback('hurt')}>
                <Text style={styles.fbEmoji}>😟</Text>
                <Text style={[styles.fbLbl, { color: '#e76f51' }]}>
                  {lang === 'en' ? 'Hurt' : 'ব্যথা'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fbBtn, { backgroundColor: '#fdf1d6' }]} onPress={() => submitFeedback('okay')}>
                <Text style={styles.fbEmoji}>😐</Text>
                <Text style={[styles.fbLbl, { color: '#f4a261' }]}>
                  {lang === 'en' ? 'Okay' : 'মাঝারি'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fbBtn, { backgroundColor: '#d8f3dc' }]} onPress={() => submitFeedback('good')}>
                <Text style={styles.fbEmoji}>😊</Text>
                <Text style={[styles.fbLbl, { color: '#2d6a4f' }]}>
                  {lang === 'en' ? 'Felt good' : 'ভালো লাগলো'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {phase === PHASE.DONE && (
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={styles.fbTitle}>
              {lang === 'en' ? 'Saved' : 'সংরক্ষিত'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1a3326', paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { color: '#fff', fontSize: 14 },
  title: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sub: { color: '#52b788', fontSize: 11, marginTop: 2 },
  bigInfo: { fontSize: 16, color: '#1a3326', fontWeight: '700', marginBottom: 16 },
  primary: {
    backgroundColor: '#2d6a4f', borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 36, elevation: 3,
  },
  primaryTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12, color: '#666', marginTop: 14, textAlign: 'center' },
  counterWrap: { alignItems: 'center', marginTop: 24 },
  setLbl: { fontSize: 13, color: '#444', fontWeight: '700', marginBottom: 18 },
  bigCircle: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  bigNum: { fontSize: 84, fontWeight: '800', color: '#fff', lineHeight: 92 },
  bigUnit: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: -4 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 24 },
  ctrlBtn: {
    backgroundColor: '#e8e5de', paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: 10,
  },
  ctrlTxt: { fontWeight: '700', color: '#1a3326', fontSize: 13 },
  fbWrap: { marginTop: 24, alignItems: 'center' },
  fbTitle: { fontSize: 18, fontWeight: '700', color: '#1a3326', marginTop: 8 },
  fbSub: { fontSize: 12, color: '#666', marginTop: 4, marginBottom: 18 },
  fbRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  fbBtn: {
    width: 100, height: 100, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  fbEmoji: { fontSize: 32 },
  fbLbl: { fontSize: 13, fontWeight: '700' },
});
