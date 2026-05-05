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

function errorConfig(code, fallbackMsg, s) {
  switch (code) {
    case 'BAD_VIDEO':
      return { icon: '🎥', title: s.errBadVideoTitle, body: s.errBadVideoBody };
    case 'TIMEOUT':
      return { icon: '⏱', title: s.errTimeoutTitle, body: s.errTimeoutBody };
    case 'NETWORK':
      return { icon: '📡', title: s.errNetworkTitle, body: s.errNetworkBody };
    default:
      return { icon: '⚠️', title: s.errGenericTitle, body: fallbackMsg };
  }
}

const { width } = Dimensions.get('window');
const SKEL_W = width - 48;
const SKEL_H = SKEL_W * 1.4;

export default function AnalysisScreen({ navigation, route }) {
  const { videoFrontalUri, videoSagittalUri, profile, lang = 'bn', pressedAt } = route.params;
  const s = getStrings(lang);
  const [step, setStep] = useState(0);
  const [activeJoint, setActiveJoint] = useState('hips');
  const [progress, setProgress] = useState(10);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const analysisRef = useRef(false);

  useEffect(() => {
    if (analysisRef.current) return;
    analysisRef.current = true;
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    const FLOW = '[Kneedle/flow]';
    const t0 = Date.now();
    const mark = (label) => {
      const elapsed = Date.now() - t0;
      const sincePress = pressedAt ? ` (press→${Date.now() - pressedAt}ms)` : '';
      console.log(`${FLOW} ${label} +${elapsed}ms${sincePress}`);
    };

    mark('AnalysisScreen mounted, starting runAnalysis');

    const tStorage = Date.now();
    const sessions = await Storage.getSessions();
    mark(`Storage.getSessions done in ${Date.now() - tStorage}ms (${sessions.length} sessions)`);
    const sessionNumber = sessions.length + 1;

    mark('firing API.analyseGait (non-blocking)');
    const apiPromise = API.analyseGait(videoFrontalUri, videoSagittalUri, { ...profile, lang }, sessionNumber);

    // Animation runs in parallel and stops early as soon as the API resolves
    // (or rejects). This guarantees the user never waits longer than the
    // network round-trip, instead of being capped at the animation's length.
    let apiSettled = false;
    apiPromise
      .catch(() => {})
      .finally(() => { apiSettled = true; mark('apiPromise settled'); });

    const stepDurations = [600, 700, 600, 500];
    for (let i = 0; i < STEPS_KEY.length; i++) {
      if (apiSettled) break;
      setStep(i);
      setActiveJoint(JOINT_SEQUENCE[i]);
      setProgress(((i + 1) / STEPS_KEY.length) * 90);
      await new Promise(r => setTimeout(r, stepDurations[i]));
    }
    setStep(STEPS_KEY.length - 1);
    setProgress(95);

    let result;
    try {
      result = await apiPromise;
      mark('apiPromise resolved (result received)');
    } catch (err) {
      mark(`apiPromise rejected: ${err.message} (code=${err.code || 'NONE'})`);
      // Map any non-tagged network failure to NETWORK so the UI can recover.
      const code = err.code
        || (/Network request failed|failed to connect|Network error/i.test(err.message || '') ? 'NETWORK' : 'GENERIC');
      setErrorCode(code);
      setErrorMsg(err.message || 'Analysis failed');
      return;
    }

    setProgress(100);
    const tSave = Date.now();
    await Storage.saveSession({ result, videoUri: videoFrontalUri, painLevel: profile?.painLevel });
    mark(`Storage.saveSession done in ${Date.now() - tSave}ms`);

    mark('navigating to Results');
    navigation.replace('Results', { result, lang, profile });
  };

  if (errorMsg) {
    const cfg = errorConfig(errorCode, errorMsg, s);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorIcon}>{cfg.icon}</Text>
          <Text style={styles.errorTitle}>{cfg.title}</Text>
          <Text style={styles.errorMsg}>{cfg.body}</Text>
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => navigation.replace('Record', { profile, lang })}
          >
            <Text style={styles.errorBtnTxt}>{s.recordAgainBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.errorBtnGhost} onPress={() => navigation.goBack()}>
            <Text style={styles.errorBtnGhostTxt}>{s.goBackBtn}</Text>
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
  errorIcon: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  errorMsg:   { fontSize: 14, color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginBottom: 28, lineHeight: 21 },
  errorBtn:   { backgroundColor: '#2d6a4f', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 11, marginBottom: 10, elevation: 2 },
  errorBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorBtnGhost: { paddingHorizontal: 24, paddingVertical: 10 },
  errorBtnGhostTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
});
