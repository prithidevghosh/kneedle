import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions, Easing } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

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

const RING_CONFIGS = [
  { size: 160, x: 0.75, y: 0.25, duration: 14000, delay: 0,    color: 'rgba(82,183,136,0.20)' },
  { size: 100, x: 0.20, y: 0.65, duration: 10000, delay: 2000, color: 'rgba(82,183,136,0.15)' },
  { size: 220, x: 0.50, y: 0.50, duration: 18000, delay: 500,  color: 'rgba(45,106,79,0.12)'  },
];

function Orb({ config }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          delay: config.delay,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: config.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-config.dx, config.dx] });
  const translateY = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-config.dy, config.dy, -config.dy] });
  const scale      = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.88, 1.08, 0.88] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [config.opacity * 0.7, config.opacity, config.opacity * 0.7] });
  const rotateY    = anim.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] });
  const rotateX    = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-8deg', '8deg', '-8deg'] });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          left: config.x * W - config.size / 2,
          top:  config.y * H - config.size / 2,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          opacity,
          transform: [
            { perspective: 600 },
            { translateX },
            { translateY },
            { rotateX },
            { rotateY },
            { scale },
          ],
        },
      ]}
    />
  );
}

function Ring({ config }) {
  const spin  = useRef(new Animated.Value(0)).current;
  const tilt  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: config.duration,
        easing: Easing.linear,
        useNativeDriver: true,
        delay: config.delay,
      })
    );
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, {
          toValue: 1,
          duration: config.duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          delay: config.delay,
        }),
        Animated.timing(tilt, {
          toValue: 0,
          duration: config.duration * 1.3,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    spinLoop.start();
    tiltLoop.start();
    return () => { spinLoop.stop(); tiltLoop.stop(); };
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotateX = tilt.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '35deg'] });
  const rotateY = tilt.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-20deg', '20deg', '-20deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: config.x * W - config.size / 2,
        top:  config.y * H - config.size / 2,
        width: config.size,
        height: config.size,
        borderRadius: config.size / 2,
        borderWidth: 1.5,
        borderColor: config.color,
        transform: [{ perspective: 500 }, { rotateX }, { rotateY }, { rotate }],
      }}
    />
  );
}

export default function FloatingOrbs() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ORB_CONFIGS.map((cfg, i) => <Orb key={i} config={cfg} />)}
      {RING_CONFIGS.map((cfg, i) => <Ring key={i} config={cfg} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute' },
});
