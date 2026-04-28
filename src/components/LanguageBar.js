import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const LANGS = [
  { code: 'bn', label: 'বাংলা' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'en', label: 'EN' },
];

export default function LanguageBar({ current, onChange }) {
  return (
    <View style={styles.bar}>
      <Text style={styles.label}>ভাষা:</Text>
      {LANGS.map(l => (
        <TouchableOpacity
          key={l.code}
          style={[styles.chip, current === l.code && styles.chipActive]}
          onPress={() => onChange(l.code)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, current === l.code && styles.chipTextActive]}>
            {l.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(26,51,38,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  label: { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginRight: 2 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#52b788',
    borderColor: '#52b788',
  },
  chipText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
});
