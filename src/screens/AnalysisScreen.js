import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef } from 'react';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import SkeletonOverlay from '../components/SkeletonOverlay';
import { API } from '../utils/api';
import { Storage } from '../utils/storage';

const STEPS_KEY = ['analysisStep1', 'analysisStep2', 'analysisStep3', 'analysisStep4'];
const JOINT_SEQUENCE = ['hips', 'right_knee', 'left_knee', 'ankles'];

const { width } = Dimensions.get('window');
const SKEL_W = width - 48;
const SKEL_H = SKEL_W * 1.4;

export default function AnalysisScreen({ navigation, route }) {
  const { videoUri, profile, lang = 'bn' } = route.params;
  const s = getStrings(lang);
  const [step, setStep] = useState(0);
  const [activeJoint, setActiveJoint] = useState('hips');
  const [progress, setProgress] = useState(10);
  const analysisRef = useRef(false);

  useEffect(() => {
    if (analysisRef.current) return;
    analysisRef.current = true;
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    const stepDurations = [1800, 2200, 1600, 1400];
    const apiPromise = API.analyseGait(videoUri, { ...profile, lang });

    for (let i = 0; i < STEPS_KEY.length; i++) {
      setStep(i);
      setActiveJoint(JOINT_SEQUENCE[i]);
      setProgress(((i + 1) / STEPS_KEY.length) * 90);
      await new Promise(r => setTimeout(r, stepDurations[i]));
    }

    setProgress(100);
    const result = await apiPromise;
    await Storage.saveSession({ result, videoUri, painLevel: profile?.painLevel });

    setTimeout(() => {
      navigation.replace('Results', { result, lang, profile });
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LanguageBar current={lang} onChange={() => {}} />
      <View style={styles.videoArea}>
        <View style={styles.skeletonContainer}>
          <SkeletonOverlay activeJoint={activeJoint} width={SKEL_W} height={SKEL_H} />
        </View>
      </View>
      <View style={styles.bottomPanel}>
        {STEPS_KEY.map((key, i) => (
          <View key={key} style={styles.stepRow}>
            <View style={[
              styles.dot,
              i < step && styles.dotDone,
              i === step && styles.dotActive,
            ]} />
            <Text style={[
              styles.stepText,
              i < step && styles.stepDone,
              i === step && styles.stepActive,
            ]}>
              {s[key]}{i < step ? ' ✓' : ''}
            </Text>
          </View>
        ))}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1a14' },
  videoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  skeletonContainer: {
    backgroundColor: '#0d1a14', borderRadius: 16,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  bottomPanel: { backgroundColor: '#1a3326', padding: 16, paddingBottom: 32 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotDone: { backgroundColor: '#2d6a4f' },
  dotActive: { backgroundColor: '#52b788' },
  stepText: { fontSize: 12, color: 'rgba(255,255,255,0.25)' },
  stepDone: { color: 'rgba(255,255,255,0.5)' },
  stepActive: { color: '#52b788', fontWeight: '700' },
  progressBg: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, height: 4, marginTop: 8 },
  progressFill: { height: 4, backgroundColor: '#52b788', borderRadius: 10 },
});
