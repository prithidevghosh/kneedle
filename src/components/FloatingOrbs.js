import { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// Each orb: position seed, size, color, speed, phase offset
const ORB_CONFIGS = [
  { x: 0.15, y: 0.12, size: 90,  color: '#52b788', opacity: 0.18, duration: 7000,  delay: 0,    dx: 40, dy: 30 },
  { x: 0.80, y: 0.08, size: 55,  color: '#2d6a4f', opacity: 0.30, duration: 9000,  delay: 800,  dx: 25, dy: 45 },
  { x: 0.50, y: 0.30, size: 130, color: '#1a5c3a', opacity: 0.14, duration: 11000, delay: 200,  dx: 55, dy: 20 },
  { x: 0.05, y: 0.55, size: 70,  color: '#52b788', opacity: 0.22, duration: 8500,  delay: 1400, dx: 30, dy: 50 },
  { x: 0.90, y: 0.45, size: 85,  color: '#2d6a4f', opacity: 0.16, duration: 10000, delay: 600,  dx: 45, dy: 35 },
  { x: 0.35, y: 0.70, size: 50,  color: '#74c69d', opacity: 0.25, duration: 7500,  delay: 1800, dx: 20, dy: 40 },
  { x: 0.70, y: 0.75, size: 100, color: '#1b4332', opacity: 0.20, duration: 12000, delay: 400,  dx: 60, dy: 25 },
  { x: 0.20, y: 0.88, size: 65,  color: '#52b788', opacity: 0.18, duration: 9500,  delay: 1000, dx: 35, dy: 30 },
  { x: 0.60, y: 0.50, size: 40,  color: '#95d5b2', opacity: 0.28, duration: 6500,  delay: 2200, dx: 18, dy: 22 },
  { x: 0.45, y: 0.15, size: 75,  color: '#2d6a4f', opacity: 0.15, duration: 10500, delay: 300,  dx: 50, dy: 38 },
  { x: 0.85, y: 0.88, size: 58,  color: '#52b788', opacity: 0.20, duration: 8000,  delay: 1600, dx: 28, dy: 42 },
  { x: 0.10, y: 0.35, size: 45,  color: '#74c69d', opacity: 0.24, duration: 7200,  delay: 900,  dx: 22, dy: 28 },
];

function Orb({ config }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;

    // Lissajous-style path: x uses sin, y uses cos at different frequencies
    const tx = interpolate(p, [0, 1], [-config.dx, config.dx]);
    const ty = interpolate(p, [0, 0.5, 1], [-config.dy, config.dy, -config.dy]);

    // Gentle 3D tilt — rotateX and rotateY driven by position
    const rotX = interpolate(p, [0, 0.5, 1], [-8, 8, -8]);
    const rotY = interpolate(p, [0, 1], [-12, 12]);

    // Subtle breathe: scale pulses slightly
    const scale = interpolate(p, [0, 0.5, 1], [0.88, 1.08, 0.88]);

    // Opacity breathes with motion
    const opacity = interpolate(p, [0, 0.5, 1], [config.opacity * 0.7, config.opacity, config.opacity * 0.7]);

    return {
      opacity,
      transform: [
        { perspective: 600 },
        { translateX: tx },
        { translateY: ty },
        { rotateX: `${rotX}deg` },
        { rotateY: `${rotY}deg` },
        { scale },
      ],
    };
  });

  const baseX = config.x * W - config.size / 2;
  const baseY = config.y * H - config.size / 2;

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          left: baseX,
          top: baseY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
        },
        animStyle,
      ]}
    />
  );
}

// Slow rotating ring accent — a hollow circle that spins in 3D
function RotatingRing({ size, x, y, duration, delay, color }) {
  const spin = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    spin.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false)
    );
    tilt.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    const rotate = interpolate(spin.value, [0, 1], [0, 360]);
    const rx = interpolate(tilt.value, [0, 1], [-35, 35]);
    const ry = interpolate(tilt.value, [0, 0.5, 1], [-20, 20, -20]);
    return {
      transform: [
        { perspective: 500 },
        { rotateX: `${rx}deg` },
        { rotateY: `${ry}deg` },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * W - size / 2,
          top: y * H - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        ringStyle,
      ]}
    />
  );
}

export default function FloatingOrbs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ORB_CONFIGS.map((cfg, i) => (
        <Orb key={i} config={cfg} />
      ))}
      <RotatingRing size={160} x={0.75} y={0.25} duration={14000} delay={0}    color="rgba(82,183,136,0.20)" />
      <RotatingRing size={100} x={0.20} y={0.65} duration={10000} delay={2000} color="rgba(82,183,136,0.15)" />
      <RotatingRing size={220} x={0.50} y={0.50} duration={18000} delay={500}  color="rgba(45,106,79,0.12)"  />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});
