import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { Storage } from '../utils/storage';
import { getStrings } from '../utils/language';
import LanguageBar from '../components/LanguageBar';

export default function ProfileScreen({ navigation, route }) {
  const [lang, setLang] = useState(route.params?.lang || 'bn');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [knee, setKnee] = useState('both');
  const [painLevel, setPainLevel] = useState('mid');
  const s = getStrings(lang);

  const handleSave = async () => {
    if (!name.trim()) return;
    const profile = { name: name.trim(), age, knee, painLevel, lang };
    await Storage.saveProfile(profile);
    await Storage.saveLanguage(lang);
    navigation.replace('Home', { profile, lang });
  };

  const handleLangChange = async (l) => {
    setLang(l);
    await Storage.saveLanguage(l);
  };

  const KneeOption = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.option, knee === value && styles.optionActive]}
      onPress={() => setKnee(value)}
    >
      <Text style={[styles.optionText, knee === value && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const PainOption = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.option, painLevel === value && styles.optionActive]}
      onPress={() => setPainLevel(value)}
    >
      <Text style={[styles.optionText, painLevel === value && styles.optionTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LanguageBar current={lang} onChange={handleLangChange} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{s.profileTitle}</Text>
        <Text style={styles.headerSub}>{s.profileSubtitle}</Text>
      </View>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{lang === 'en' ? 'NAME' : lang === 'hi' ? 'नाम' : 'নাম'}</Text>
          <TextInput
            style={styles.input}
            placeholder={s.namePlaceholder}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{lang === 'en' ? 'AGE' : lang === 'hi' ? 'उम्र' : 'বয়স'}</Text>
          <TextInput
            style={styles.input}
            placeholder={s.agePlaceholder}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{s.whichKnee.toUpperCase()}</Text>
          <View style={styles.optionRow}>
            <KneeOption value="left"  label={s.kneeLeft} />
            <KneeOption value="right" label={s.kneeRight} />
            <KneeOption value="both"  label={s.kneeBoth} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{s.painLevel.toUpperCase()}</Text>
          <View style={styles.optionRow}>
            <PainOption value="low"  label={s.painLow} />
            <PainOption value="mid"  label={s.painMid} />
            <PainOption value="high" label={s.painHigh} />
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{s.saveBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4e8' },
  header: { backgroundColor: '#1a3326', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 10, color: '#52b788', marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, color: '#888', letterSpacing: 0.5, marginBottom: 5 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1a3326', borderWidth: 1, borderColor: '#ede9df', fontWeight: '500',
  },
  optionRow: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, paddingVertical: 11, borderRadius: 9, borderWidth: 1,
    borderColor: '#ede9df', backgroundColor: '#fff', alignItems: 'center',
  },
  optionActive: { backgroundColor: '#d8f3dc', borderColor: '#52b788' },
  optionText: { fontSize: 13, color: '#666' },
  optionTextActive: { color: '#1a3326', fontWeight: '700' },
  saveBtn: {
    backgroundColor: '#2d6a4f', borderRadius: 11, paddingVertical: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 40, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
