import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';
import FloatingOrbs from '../components/FloatingOrbs';

export default function WelcomeScreen({ navigation }) {
  const [lang, setLang] = useState('en');
  const s = getStrings(lang);

  useEffect(() => {
    (async () => {
      const savedLang = await Storage.getLanguage();
      setLang(savedLang);
      const profile = await Storage.getProfile();
      if (profile) navigation.replace('Home', { profile, lang: savedLang });
    })();
  }, []);

  const handleLangChange = async (l) => {
    setLang(l);
    await Storage.saveLanguage(l);
  };

  const handleStart = () => navigation.navigate('Profile', { lang });

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen animated orb layer — sits behind everything */}
      <FloatingOrbs />

      <View style={styles.top}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🌿</Text>
        </View>
        <Text style={styles.appName}>{s.appName}</Text>
        <Text style={styles.appSub}>{s.appSubtitle}</Text>
        <Text style={styles.tagline}>{s.appTagline}</Text>
        <LanguageBar current={lang} onChange={handleLangChange} />
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{s.startBtn}</Text>
        </TouchableOpacity>
        <Text style={styles.freeNote}>{s.freeNote}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a3326', overflow: 'hidden' },
  top: { flex: 1, paddingHorizontal: 24, paddingTop: 32, justifyContent: 'flex-end', paddingBottom: 32 },
  logoBox: {
    width: 52, height: 52, backgroundColor: '#52b788',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 26 },
  appName: { fontSize: 38, fontWeight: '700', color: '#fff', lineHeight: 42 },
  appSub: { fontSize: 11, color: '#52b788', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 24 },
  bottom: {
    backgroundColor: '#f8f4e8',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
  },
  startBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 12,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#2d6a4f', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, elevation: 6,
  },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  freeNote: { textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 12 },
});
