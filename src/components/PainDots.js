import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const DOT_COLORS = [
  { bg: '#d8f3dc', text: '#1a3326' },
  { bg: '#b7e4c7', text: '#1a3326' },
  { bg: '#fde68a', text: '#92400e' },
  { bg: '#fca5a5', text: '#7f1d1d' },
  { bg: '#f87171', text: '#7f1d1d' },
];

const BN_NUMS = ['১', '২', '৩', '৪', '৫'];

export default function PainDots({ value, onChange, lang = 'bn' }) {
  return (
    <View style={styles.row}>
      {DOT_COLORS.map((c, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.dot,
            { backgroundColor: c.bg },
            value === i + 1 && styles.dotSelected,
          ]}
          onPress={() => onChange(i + 1)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dotText, { color: c.text }]}>
            {lang === 'en' ? i + 1 : BN_NUMS[i]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dotSelected: {
    borderColor: '#1a3326',
    transform: [{ scale: 1.12 }],
  },
  dotText: { fontSize: 14, fontWeight: '700' },
});
