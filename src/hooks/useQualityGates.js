import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer, LightSensor } from 'expo-sensors';

const ACCEL_WINDOW = 8;

// Pre-recording: warn if phone is being held / shaking
const SHAKE_THRESHOLD = 0.35;

// During-recording: only trigger if phone actually falls or moves significantly
// (walking vibrations from the floor won't reach this)
const MOVE_THRESHOLD = 1.2;

const LUX_DARK   = 30;
const LUX_BRIGHT = 10000;

export default function useQualityGates() {
  const [lighting,  setLighting]  = useState('unknown'); // 'ok'|'dark'|'bright'|'unknown'
  const [stability, setStability] = useState('unknown'); // 'ok'|'shaking'|'unknown'
  const [isPhoneMoving, setIsPhoneMoving] = useState(false); // true only when phone significantly displaced

  const accelBuf = useRef([]);
  const mounted  = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Ambient light — Android only
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    LightSensor.setUpdateInterval(1000);
    const sub = LightSensor.addListener(({ illuminance }) => {
      if (!mounted.current) return;
      if (illuminance < LUX_DARK)        setLighting('dark');
      else if (illuminance > LUX_BRIGHT) setLighting('bright');
      else                               setLighting('ok');
    });
    return () => sub.remove();
  }, []);

  // Accelerometer — drives both stability (pre-recording) and isPhoneMoving (during recording)
  useEffect(() => {
    Accelerometer.setUpdateInterval(150);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      if (!mounted.current) return;
      const mag = Math.sqrt(x * x + y * y + z * z);
      const buf = accelBuf.current;
      buf.push(mag);
      if (buf.length > ACCEL_WINDOW) buf.shift();
      if (buf.length >= 4) {
        const mean   = buf.reduce((a, b) => a + b, 0) / buf.length;
        const stddev = Math.sqrt(buf.reduce((a, b) => a + (b - mean) ** 2, 0) / buf.length);
        setStability(stddev > SHAKE_THRESHOLD ? 'shaking' : 'ok');
        setIsPhoneMoving(stddev > MOVE_THRESHOLD);
      }
    });
    return () => sub.remove();
  }, []);

  const warnings = [];
  if (lighting === 'dark')     warnings.push('dark');
  if (lighting === 'bright')   warnings.push('bright');
  if (stability === 'shaking') warnings.push('shaking');

  const sensorsReady = stability !== 'unknown' &&
    (Platform.OS !== 'android' || lighting !== 'unknown');

  const checksPass = sensorsReady &&
    (lighting === 'ok' || Platform.OS !== 'android') &&
    stability === 'ok';

  return { lighting, stability, warnings, checksPass, sensorsReady, isPhoneMoving };
}
