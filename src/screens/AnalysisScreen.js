import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
  const [errorMsg, setErrorMsg] = useState(null);
  const analysisRef = useRef(false);

  useEffect(() => {
    if (analysisRef.current) return;
    analysisRef.current = true;
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    const stepDurations = [1800, 2200, 1600, 1400];

    const sessions = await Storage.getSessions();
    const sessionNumber = sessions.length + 1;
    const apiPromise = API.analyseGait(videoUri, { ...profile, lang }, sessionNumber);

    for (let i = 0; i < STEPS_KEY.length; i++) {
      setStep(i);
      setActiveJoint(JOINT_SEQUENCE[i]);
      setProgress(((i + 1) / STEPS_KEY.length) * 90);
      await new Promise(r => setTimeout(r, stepDurations[i]));
    }

    setProgress(100);

    let result;
    try {
      result = await apiPromise;
    } catch (err) {
      // 400 (bad file), 500 (server crash), or network failure all land here.
      // Gemma-down is a soft 200 fallback on the server — it never throws.
      setErrorMsg(err.message || 'Analysis failed');
      return;
    }

    await Storage.saveSession({ result, videoUri, painLevel: profile?.painLevel });

    setTimeout(() => {
      navigation.replace('Results', { result, lang, profile });
    }, 400);
  };

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>
            {lang === 'bn' ? 'বিশ্লেষণ ব্যর্থ হয়েছে' : lang === 'hi' ? 'विश्लेषण विफल' : 'Analysis failed'}
          </Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBtnTxt}>
              {lang === 'bn' ? '← ফিরে যান' : lang === 'hi' ? '← वापस जाएं' : '← Go back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#e76f51', marginBottom: 12, textAlign: 'center' },
  errorMsg:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 28 },
  errorBtn:   { backgroundColor: '#2d6a4f', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  errorBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
