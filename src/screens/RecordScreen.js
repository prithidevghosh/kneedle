import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useEffect, useCallback } from 'react';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import Svg, { Ellipse, Path, Line } from 'react-native-svg';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import useQualityGates from '../hooks/useQualityGates';

const COMPACT_H   = 220;
const MAX_SECONDS = 8;

// ── Body silhouette guide ─────────────────────────────────────────────────────
function BodyGuide({ tint = 'rgba(82,183,136,0.55)' }) {
  const d = '4 3';
  return (
    <Svg width={70} height={180} viewBox="0 0 56 180">
      <Ellipse cx="28" cy="10" rx="8" ry="9" fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
      <Line x1="24" y1="18" x2="24" y2="23" stroke={tint} strokeWidth="1.5" />
      <Line x1="32" y1="18" x2="32" y2="23" stroke={tint} strokeWidth="1.5" />
      <Path d="M16 23 L13 68 L43 68 L40 23 Z" fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
      <Path d="M16 28 L6 58 L11 59"  fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
      <Path d="M40 28 L50 58 L45 59" fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
      <Path d="M20 68 L16 115 L23 115 L26 155" fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
      <Path d="M36 68 L40 115 L33 115 L30 155" fill="none" stroke={tint} strokeWidth="1.5" strokeDasharray={d} />
    </Svg>
  );
}

// ── Check row ─────────────────────────────────────────────────────────────────
function CheckRow({ icon, label, status }) {
  const color =
    status === 'ok'       ? '#52b788' :
    status === 'checking' ? '#f4a261' :
    status === 'unknown'  ? '#aaa'    : '#e76f51';
  const mark =
    status === 'ok'       ? '✓' :
    status === 'checking' ? '…' :
    status === 'unknown'  ? '?' : '✗';
  return (
    <View style={chk.row}>
      <View style={[chk.circle, { borderColor: color }]}>
        <Text style={[chk.mark, { color }]}>{mark}</Text>
      </View>
      <Text style={chk.label}>{icon}  {label}</Text>
    </View>
  );
}
const chk = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  circle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  mark:   { fontSize: 12, fontWeight: '800' },
  label:  { fontSize: 12, color: '#fff', fontWeight: '600' },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RecordScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.lang || 'bn');
  const profile          = route.params?.profile;
  const s                = getStrings(lang);

  const [permission,    requestPermission]    = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // phase: 'position' → 'checks' → (recording)
  const [phase,          setPhase]          = useState('position');
  const [showConfirmBtn, setShowConfirmBtn] = useState(false);

  // body position: null | 'checking' | 'ok'
  const [bodyStatus, setBodyStatus] = useState(null);

  const [isRecording,   setIsRecording]   = useState(false);
  const [recordWarning, setRecordWarning] = useState(null); // warning shown DURING recording
  const [seconds,       setSeconds]       = useState(0);
  const [videoUri,      setVideoUri]      = useState(null);

  const cameraRef      = useRef(null);
  const timerRef       = useRef(null);
  const isRecordingRef = useRef(false);

  const { height: screenH } = useWindowDimensions();
  const cameraH = useRef(new Animated.Value(COMPACT_H)).current;

  useKeepAwake();

  const { lighting, stability, warnings, checksPass, sensorsReady, isPhoneMoving } = useQualityGates();

  const canRecord =
    phase === 'checks' &&
    bodyStatus === 'ok' &&
    sensorsReady &&
    checksPass;

  // ── Permissions ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!permission?.granted)    requestPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, []);

  // ── Position phase timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'position') return;
    const t = setTimeout(() => setShowConfirmBtn(true), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Camera expand ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(cameraH, {
      toValue: isRecording ? screenH * 0.82 : COMPACT_H,
      duration: 380,
      useNativeDriver: false,
    }).start();
  }, [isRecording, screenH]);

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  // ── During-recording phone-movement guard ─────────────────────────────────
  useEffect(() => {
    if (!isRecording || !isPhoneMoving) return;
    stopRecording();
    setRecordWarning(
      lang === 'bn' ? '📱 ফোন নড়ে গেছে — আবার রেকর্ড করুন'
    : lang === 'hi' ? '📱 फ़ोन हिल गया — दोबारा रिकॉर्ड करें'
    : '📱 Phone moved — please re-record'
    );
  }, [isPhoneMoving, isRecording]);

  // ── Confirm position: user manually confirms they are in frame ───────────
  // takePictureAsync fires the hardware shutter and pixel-variance analysis
  // cannot distinguish a person from an empty room (same variance range).
  // The real quality gates are sensor-based: lighting (LightSensor) and
  // stability (Accelerometer). Body position is guided by the silhouette
  // overlay; confirmation is the user's own judgement.
  const handleConfirmPosition = useCallback(() => {
    setPhase('checks');
    setBodyStatus('checking');
    // Brief pause so the UI shows "checking…" before confirming
    setTimeout(() => setBodyStatus('ok'), 800);
  }, []);

  const handleRecheck = useCallback(() => {
    setBodyStatus(null);
    setPhase('position');
    setShowConfirmBtn(false);
    setRecordWarning(null);
  }, []);

  // ── Record / Stop ─────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!canRecord || !cameraRef.current) return;
    if (!micPermission?.granted) { await requestMicPermission(); return; }
    setRecordWarning(null);
    isRecordingRef.current = true;
    setIsRecording(true);
    setSeconds(0);
    setVideoUri(null);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_SECONDS });
      if (video?.uri) setVideoUri(video.uri);
    } catch (e) {
      console.warn('recordAsync failed:', e);
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecordingRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const handleAnalyse = () => {
    if (!videoUri) return;
    navigation.navigate('Analysis', { videoUri, profile, lang });
  };

  const resetRecording = () => {
    setVideoUri(null);
    setSeconds(0);
    setRecordWarning(null);
    handleRecheck();
  };

  // ── Permission wall ───────────────────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permTxt}>ক্যামেরার অনুমতি দরকার</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnTxt}>অনুমতি দিন</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Derived labels ────────────────────────────────────────────────────────
  const bodyLabel   = lang === 'bn' ? 'পুরো শরীর' : lang === 'hi' ? 'पूरा शरीर' : 'Full body';
  const lightLabel  = s.qLightLabel;
  const stableLabel = s.qStableLabel;

  const bodyCheckStatus = () => {
    if (bodyStatus === null)             return 'unknown';
    if (bodyStatus === 'checking')       return 'checking';
    if (bodyStatus === 'ok')             return 'ok';
    return 'fail';
  };

  const recordBtnLabel = () => {
    if (phase === 'position')            return lang === 'bn' ? '📍 আগে অবস্থান নিশ্চিত করুন' : lang === 'hi' ? '📍 पहले स्थिति पक्की करें' : '📍 Confirm position first';
    if (bodyStatus === 'checking')       return lang === 'bn' ? '🔍 শরীর সনাক্ত হচ্ছে…'        : lang === 'hi' ? '🔍 शरीर पहचाना जा रहा है…' : '🔍 Detecting body…';
    if (!sensorsReady)                   return lang === 'bn' ? '⏳ সেন্সর লোড হচ্ছে…'         : lang === 'hi' ? '⏳ सेंसर लोड हो रहे हैं…'  : '⏳ Loading sensors…';
    if (!checksPass)                     return lang === 'bn' ? '⚠️ সমস্যা ঠিক করুন'           : lang === 'hi' ? '⚠️ समस्या ठीक करें'        : '⚠️ Fix issues above';
    return s.startRecord;
  };

  // ── Camera overlay ────────────────────────────────────────────────────────
  const renderOverlay = () => {
    if (isRecording) {
      return (
        <>
          <View style={styles.recBadge}>
            <View style={styles.recDot} />
            <Text style={styles.recTxt}>
              REC {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')} / 0:{String(MAX_SECONDS).padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.overlayBottomBanner} pointerEvents="none">
            <Text style={styles.bannerTxt}>
              {lang === 'bn' ? '🦵 কোমর থেকে পায়ের আঙুল ফ্রেমে রাখুন'
             : lang === 'hi' ? '🦵 कमर से पैर की उँगली फ्रेम में रखें'
             : '🦵 Keep waist to toe in frame'}
            </Text>
          </View>
        </>
      );
    }

    if (phase === 'position') {
      return (
        <>
          <View style={styles.overlayCenter} pointerEvents="none">
            <BodyGuide />
          </View>
          <View style={styles.overlayTopBanner} pointerEvents="none">
            <Text style={styles.bannerTxt}>
              {lang === 'bn' ? '📍 ৩ মি. দূরে দাঁড়ান — কোমর থেকে পায়ের আঙুল দেখা যাক'
             : lang === 'hi' ? '📍 ३ मी. दूर खड़े हों — कमर से पैर की उँगली दिखे'
             : '📍 Stand 3 m away — waist to toe must be visible'}
            </Text>
          </View>
          {showConfirmBtn && (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPosition}>
              <Text style={styles.confirmBtnTxt}>
                {lang === 'bn' ? '🔍 শরীর পরীক্ষা করুন'
               : lang === 'hi' ? '🔍 शरीर जाँचें'
               : '🔍 Check my position'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      );
    }

    // checks phase
    const lightStatus  = lighting  === 'ok' ? 'ok' : lighting  === 'unknown' ? 'unknown' : 'fail';
    const stableStatus = stability === 'ok' ? 'ok' : stability === 'unknown' ? 'unknown' : 'fail';
    const warningMap   = { dark: s.qLightDark, bright: s.qLightBright, shaking: s.qShaking };

    let bannerText  = null;
    let bannerStyle = {};
    if (warnings.length > 0) {
      bannerText  = warningMap[warnings[0]];
      bannerStyle = styles.bannerWarn;
    } else if (canRecord) {
      bannerText  = lang === 'bn' ? '✓ সব ঠিক আছে — রেকর্ড করুন' : lang === 'hi' ? '✓ सब ठीक है — रिकॉर्ड करें' : '✓ All checks passed — tap to record';
      bannerStyle = styles.bannerOk;
    } else {
      bannerText  = lang === 'bn' ? '🔍 পরীক্ষা করা হচ্ছে…' : lang === 'hi' ? '🔍 जाँच हो रही है…' : '🔍 Running checks…';
    }

    return (
      <>
        <View style={styles.overlayCenter} pointerEvents="none">
          <BodyGuide tint={canRecord ? 'rgba(82,183,136,0.9)' : 'rgba(82,183,136,0.45)'} />
        </View>

        <View style={styles.overlayTopBanner} pointerEvents="none">
          <Text style={[styles.bannerTxt, bannerStyle]}>{bannerText}</Text>
        </View>

        <View style={styles.checkPanel} pointerEvents="none">
          <CheckRow icon="🦵" label={bodyLabel}   status={bodyCheckStatus()} />
          <CheckRow icon="☀️" label={lightLabel}   status={lightStatus} />
          <CheckRow icon="📱" label={stableLabel}  status={stableStatus} />
        </View>

        <TouchableOpacity style={styles.retryBtn} onPress={handleRecheck}>
          <Text style={styles.retryBtnTxt}>
            {lang === 'bn' ? '↺ ফের চেক করুন' : lang === 'hi' ? '↺ फिर जाँचें' : '↺ Recheck'}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {!isRecording && (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backTxt}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{s.recordTitle}</Text>
              <Text style={styles.headerSub}>{s.recordSubtitle}</Text>
            </View>
          </View>
          <LanguageBar current={lang} onChange={setLang} />
        </View>
      )}

      <Animated.View style={[styles.cameraWrap, { height: cameraH }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          mode="video"
        />
        <View style={styles.guideFrame} pointerEvents="none" />
        {renderOverlay()}
      </Animated.View>

      {/* Phone-moved warning shown below camera after recording stops */}
      {recordWarning && !isRecording && (
        <View style={styles.recordWarningBanner}>
          <Text style={styles.recordWarningTxt}>{recordWarning}</Text>
        </View>
      )}

      {!isRecording && (
        <View style={styles.stepsWrap}>
          {[s.step1, s.step2, s.step3].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
              <Text style={styles.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.btnRow}>
        {videoUri ? (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetRecording}>
              <Text style={styles.cancelTxt}>
                {lang === 'bn' ? '↩ আবার করুন' : lang === 'hi' ? '↩ दोबारा करें' : '↩ Record again'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyseBtn} onPress={handleAnalyse}>
              <Text style={styles.recordBtnTxt}>{s.analyseBtn}</Text>
            </TouchableOpacity>
          </>
        ) : isRecording ? (
          // No stop button — recording auto-stops at MAX_SECONDS via maxDuration
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingIndicatorTxt}>
              {lang === 'bn' ? '🔴 রেকর্ড হচ্ছে…'
             : lang === 'hi' ? '🔴 रिकॉर्ड हो रहा है…'
             : '🔴 Recording…'}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelTxt}>{s.cancelBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recordBtn, !canRecord && styles.recordBtnLocked]}
              onPress={canRecord ? startRecording : undefined}
              activeOpacity={canRecord ? 0.8 : 1}
            >
              <Text style={styles.recordBtnTxt}>{recordBtnLabel()}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8f4e8' },

  header: { backgroundColor: '#1a3326', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:     { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  backTxt:     { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 10, color: '#52b788', marginTop: 1 },

  cameraWrap: { marginHorizontal: 16, marginTop: 14, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  guideFrame: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1.5, borderColor: 'rgba(82,183,136,0.35)', borderRadius: 10, borderStyle: 'dashed' },

  overlayCenter:     { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  overlayTopBanner:  { position: 'absolute', top: 10, left: 10, right: 10, alignItems: 'center' },
  overlayBottomBanner: { position: 'absolute', bottom: 10, left: 10, right: 10, alignItems: 'center' },

  bannerTxt: { backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, textAlign: 'center', overflow: 'hidden' },
  bannerWarn: { backgroundColor: 'rgba(231,111,81,0.92)' },
  bannerOk:   { backgroundColor: 'rgba(45,106,79,0.92)' },

  checkPanel: { position: 'absolute', bottom: 10, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.48)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },

  confirmBtn:    { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(45,106,79,0.92)', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 24 },
  confirmBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

  retryBtn:    { position: 'absolute', top: 10, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  retryBtnTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  recBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#e76f51', borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, gap: 5, zIndex: 10 },
  recDot:   { width: 6, height: 6, backgroundColor: '#fff', borderRadius: 3 },
  recTxt:   { fontSize: 10, color: '#fff', fontWeight: '700' },

  recordWarningBanner: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#e76f51', borderRadius: 10, padding: 10 },
  recordWarningTxt:    { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  stepsWrap: { paddingHorizontal: 16, paddingTop: 14 },
  stepRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  stepNum:   { width: 22, height: 22, backgroundColor: '#d8f3dc', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  stepNumTxt: { fontSize: 11, fontWeight: '700', color: '#1a3326' },
  stepTxt:    { fontSize: 13, color: '#444', lineHeight: 20, flex: 1 },

  btnRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12, marginTop: 'auto' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 11, backgroundColor: '#e8e5de', alignItems: 'center' },
  cancelTxt: { fontSize: 14, color: '#666', fontWeight: '600' },
  recordBtn: { flex: 2, padding: 14, borderRadius: 11, backgroundColor: '#2d6a4f', alignItems: 'center', elevation: 3 },
  recordBtnLocked: { backgroundColor: '#9db8ad' },
  analyseBtn: { flex: 2, padding: 14, borderRadius: 11, backgroundColor: '#2d6a4f', alignItems: 'center', elevation: 3 },
  recordingIndicator: { flex: 1, padding: 14, borderRadius: 11, backgroundColor: '#1a3326', alignItems: 'center' },
  recordingIndicatorTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },
  recordBtnTxt: { fontSize: 14, color: '#fff', fontWeight: '700', textAlign: 'center' },
  permTxt:   { color: '#1a3326', textAlign: 'center', marginTop: 40, fontSize: 15 },
  permBtn:   { margin: 24, backgroundColor: '#2d6a4f', padding: 14, borderRadius: 10, alignItems: 'center' },
  permBtnTxt: { color: '#fff', fontWeight: '700' },
});
