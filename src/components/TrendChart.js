import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export default function TrendChart({
  series, // [{date, value}]
  unit = '°',
  goal = 'down', // 'down' = lower is better, 'up' = higher is better
  width = 280,
  height = 120,
  color = '#2d6a4f',
}) {
  if (!series || series.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyTxt}>Not enough data yet — keep going!</Text>
      </View>
    );
  }

  const values = series.map(p => Number(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = (max - min) || 1;
  const padX = 16, padY = 14;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const points = series.map((p, i) => {
    const x = padX + (series.length === 1 ? w / 2 : (i / (series.length - 1)) * w);
    const y = padY + (1 - (Number(p.value) - min) / span) * h;
    return { x, y, v: Number(p.value) };
  });

  const path = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const improving = goal === 'down' ? delta < 0 : delta > 0;
  const deltaTxt = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}${unit}`;
  const trendColor = improving ? '#2d6a4f' : delta === 0 ? '#888' : '#e76f51';

  return (
    <View>
      <View style={styles.row}>
        <View>
          <Text style={styles.cur}>{last.toFixed(1)}{unit}</Text>
          <Text style={styles.lbl}>today</Text>
        </View>
        <View style={[styles.deltaPill, { backgroundColor: trendColor + '22' }]}>
          <Text style={[styles.deltaTxt, { color: trendColor }]}>
            {improving ? '↓ improving' : delta === 0 ? '— same' : '↑ rising'} · {deltaTxt}
          </Text>
        </View>
      </View>
      <Svg width={width} height={height}>
        <Line x1={padX} y1={padY + h} x2={padX + w} y2={padY + h} stroke="#e8e5de" strokeWidth="1" />
        <Path d={path} stroke={color} strokeWidth="2.5" fill="none" />
        {points.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x} cy={pt.y} r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? color : '#fff'}
            stroke={color} strokeWidth="2"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cur: { fontSize: 22, fontWeight: '800', color: '#1a3326' },
  lbl: { fontSize: 10, color: '#888' },
  deltaPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  deltaTxt: { fontSize: 11, fontWeight: '700' },
  empty: {
    backgroundColor: '#f0faf4', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTxt: { fontSize: 11, color: '#52b788' },
});
