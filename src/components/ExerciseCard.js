import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import YouTubePlayer from './YouTubePlayer';
import { Storage } from '../utils/storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FEEDBACK_META = {
  hurt: { emoji: '😟', color: '#e76f51', bg: '#fde2d4' },
  okay: { emoji: '😐', color: '#f4a261', bg: '#fdf1d6' },
  good: { emoji: '😊', color: '#2d6a4f', bg: '#d8f3dc' },
};

export default function ExerciseCard({ exercise, lang, index, onTry }) {
  const [open, setOpen] = useState(index === 0);
  const [lastFeedback, setLastFeedback] = useState(null);

  useEffect(() => {
    let mounted = true;
    Storage.getLastFeedbackFor(exercise.name_en).then(fb => {
      if (mounted) setLastFeedback(fb);
    });
    return () => { mounted = false; };
  }, [exercise.name_en]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };

  const name = lang === 'en' ? exercise.name_en : exercise.name;
  const reps = lang === 'en' ? exercise.reps_en : exercise.reps;

  const memoryNote =
    lastFeedback?.feedback === 'hurt'
      ? lang === 'en'
        ? `Last time this hurt${lastFeedback.painSide ? ` your ${lastFeedback.painSide}` : ''}. Today, go gentler.`
        : 'গতবার এতে ব্যথা হয়েছিল। আজ ধীরে চেষ্টা করুন।'
      : lastFeedback?.feedback === 'good'
        ? lang === 'en' ? 'You said this felt good last time 💪' : 'গতবার ভালো লেগেছিল 💪'
        : null;

  const meta = lastFeedback ? FEEDBACK_META[lastFeedback.feedback] : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.head}>
        <View style={styles.headLeft}>
          <View style={styles.idx}><Text style={styles.idxTxt}>{index + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.reps}>{reps}</Text>
          </View>
        </View>
        <View style={styles.headRight}>
          {meta && (
            <View style={[styles.feedbackPill, { backgroundColor: meta.bg }]}>
              <Text style={{ fontSize: 12 }}>{meta.emoji}</Text>
            </View>
          )}
          <Text style={styles.chev}>{open ? '▾' : '▸'}</Text>
        </View>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          {memoryNote && (
            <View style={[styles.memory, { backgroundColor: meta?.bg || '#f0faf4', borderLeftColor: meta?.color || '#2d6a4f' }]}>
              <Text style={[styles.memoryTxt, { color: meta?.color || '#1a3326' }]}>
                💭 {memoryNote}
              </Text>
            </View>
          )}

          {exercise.video_url && (
            <YouTubePlayer url={exercise.video_url} height={190} />
          )}

          <Text style={styles.sectionLbl}>
            {lang === 'en' ? 'How to do it' : 'কীভাবে করবেন'}
          </Text>
          <Text style={styles.body2}>{exercise.description}</Text>

          {exercise.reason ? (
            <>
              <Text style={styles.sectionLbl}>
                {lang === 'en' ? 'Why this exercise' : 'কেন এই ব্যায়াম'}
              </Text>
              <Text style={styles.body2}>{exercise.reason}</Text>
            </>
          ) : null}

          <TouchableOpacity
            style={styles.tryBtn}
            onPress={() => onTry?.(exercise)}
            activeOpacity={0.88}
          >
            <Text style={styles.tryBtnTxt}>
              ▶  {lang === 'en' ? 'Try this exercise' : 'এখন চেষ্টা করুন'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#ede9df', overflow: 'hidden',
  },
  head: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idx: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0faf4',
    alignItems: 'center', justifyContent: 'center',
  },
  idxTxt: { color: '#2d6a4f', fontWeight: '700', fontSize: 13 },
  name: { fontSize: 14, fontWeight: '700', color: '#1a3326' },
  reps: { fontSize: 11, color: '#52b788', marginTop: 2 },
  feedbackPill: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  chev: { color: '#888', fontSize: 14 },
  body: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  memory: {
    borderLeftWidth: 3, borderRadius: 8, padding: 10, marginBottom: 4,
  },
  memoryTxt: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  sectionLbl: {
    fontSize: 10, fontWeight: '700', color: '#888',
    letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4,
  },
  body2: { fontSize: 13, color: '#444', lineHeight: 20 },
  tryBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 11, paddingVertical: 13,
    alignItems: 'center', marginTop: 8, elevation: 2,
  },
  tryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
