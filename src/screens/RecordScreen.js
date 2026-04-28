import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef, useState, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';

const MAX_SECONDS = 15;

export default function RecordScreen({ navigation, route }) {
  const lang = route.params?.lang || 'bn';
  const profile = route.params?.profile;
  const s = getStrings(lang);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState(null);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  useKeepAwake();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev >= MAX_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    setSeconds(0);
    setVideoUri(null);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: MAX_SECONDS });
      setVideoUri(video.uri);
    } catch (e) {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const handleAnalyse = () => {
    if (!videoUri) return;
    navigation.navigate('Analysis', { videoUri, profile, lang });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: '#1a3326', textAlign: 'center', marginTop: 40, fontSize: 15 }}>
          ক্যামেরার অনুমতি দরকার
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>অনুমতি দিন</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <LanguageBar current={lang} onChange={() => {}} />
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="video"
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.guideFrame} />
          {isRecording && (
            <View style={styles.recBadge}>
              <View style={styles.recDot} />
              <Text style={styles.recTxt}>
                REC {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.stepsWrap}>
        {[s.step1, s.step2, s.step3].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
            <Text style={styles.stepTxt}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.btnRow}>
        {!videoUri ? (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelTxt}>{s.cancelBtn}</Text>
            </TouchableOpacity>
            {!isRecording ? (
              <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
                <Text style={styles.recordBtnTxt}>{s.startRecord}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                <Text style={styles.recordBtnTxt}>{s.stopRecord}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setVideoUri(null); setSeconds(0); }}>
              <Text style={styles.cancelTxt}>↩ ফের করুন</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyseBtn} onPress={handleAnalyse}>
              <Text style={styles.recordBtnTxt}>{s.analyseBtn}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header: {
    backgroundColor: '#1a3326', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  backTxt: { fontSize: 16, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 10, color: '#52b788', marginTop: 1 },
  cameraWrap: {
    marginHorizontal: 16, marginTop: 14, borderRadius: 16,
    overflow: 'hidden', height: 220, position: 'relative',
  },
  camera: { flex: 1 },
  cameraOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  guideFrame: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
    borderWidth: 1.5, borderColor: 'rgba(82,183,136,0.4)',
    borderRadius: 10, borderStyle: 'dashed',
  },
  recBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#e76f51', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  recDot: { width: 6, height: 6, backgroundColor: '#fff', borderRadius: 3 },
  recTxt: { fontSize: 10, color: '#fff', fontWeight: '700' },
  stepsWrap: { paddingHorizontal: 16, paddingTop: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  stepNum: {
    width: 22, height: 22, backgroundColor: '#d8f3dc', borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0,
  },
  stepNumTxt: { fontSize: 11, fontWeight: '700', color: '#1a3326' },
  stepTxt: { fontSize: 13, color: '#444', lineHeight: 20, flex: 1 },
  btnRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16,
    paddingBottom: 24, paddingTop: 12, marginTop: 'auto',
  },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 11,
    backgroundColor: '#e8e5de', alignItems: 'center',
  },
  cancelTxt: { fontSize: 14, color: '#666', fontWeight: '600' },
  recordBtn: {
    flex: 2, padding: 14, borderRadius: 11,
    backgroundColor: '#e76f51', alignItems: 'center', elevation: 3,
  },
  stopBtn: {
    flex: 2, padding: 14, borderRadius: 11,
    backgroundColor: '#2d6a4f', alignItems: 'center', elevation: 3,
  },
  analyseBtn: {
    flex: 2, padding: 14, borderRadius: 11,
    backgroundColor: '#2d6a4f', alignItems: 'center', elevation: 3,
  },
  recordBtnTxt: { fontSize: 14, color: '#fff', fontWeight: '700' },
  permBtn: { margin: 24, backgroundColor: '#2d6a4f', padding: 14, borderRadius: 10, alignItems: 'center' },
});
