import { View, Text, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Line } from 'react-native-svg';

const GUIDE_STROKE = 'rgba(82,183,136,0.5)';

// Dashed body silhouette to guide user positioning
function BodySilhouette() {
  const dash = '4 3';
  return (
    <Svg width={56} height={150} viewBox="0 0 56 150">
      {/* Head */}
      <Ellipse cx="28" cy="10" rx="8" ry="9"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
      {/* Neck */}
      <Line x1="24" y1="18" x2="24" y2="23" stroke={GUIDE_STROKE} strokeWidth="1.5" />
      <Line x1="32" y1="18" x2="32" y2="23" stroke={GUIDE_STROKE} strokeWidth="1.5" />
      {/* Torso */}
      <Path d="M16 23 L13 68 L43 68 L40 23 Z"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
      {/* Left arm */}
      <Path d="M16 28 L6 58 L11 59"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
      {/* Right arm */}
      <Path d="M40 28 L50 58 L45 59"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
      {/* Left leg */}
      <Path d="M20 68 L16 115 L23 115 L26 135"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
      {/* Right leg */}
      <Path d="M36 68 L40 115 L33 115 L30 135"
        fill="none" stroke={GUIDE_STROKE} strokeWidth="1.5" strokeDasharray={dash} />
    </Svg>
  );
}

function StatusPill({ label, status }) {
  const bg =
    status === 'ok'      ? 'rgba(82,183,136,0.85)' :
    status === 'unknown' ? 'rgba(150,150,150,0.75)' :
                           'rgba(231,111,81,0.88)';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={styles.pillTxt}>{label}</Text>
    </View>
  );
}

export default function QualityOverlay({ lighting, stability, warnings, strings }) {
  const warningMap = {
    dark:    strings.qLightDark,
    bright:  strings.qLightBright,
    shaking: strings.qShaking,
  };

  const lightStatus  = lighting === 'ok' ? 'ok' : lighting === 'unknown' ? 'unknown' : 'fail';
  const stableStatus = stability === 'ok' ? 'ok' : 'fail';

  return (
    <>
      {/* Dashed body silhouette centred in camera frame */}
      <View style={styles.silhouetteWrap} pointerEvents="none">
        <BodySilhouette />
      </View>

      {/* Live status pills — bottom-left */}
      <View style={styles.statusRow} pointerEvents="none">
        <StatusPill label={strings.qLightLabel}  status={lightStatus} />
        <StatusPill label={strings.qStableLabel} status={stableStatus} />
      </View>

      {/* Top warning banner — first active warning only */}
      {warnings.length > 0 && (
        <View style={styles.warnBanner} pointerEvents="none">
          <Text style={styles.warnTxt}>{warningMap[warnings[0]]}</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  silhouetteWrap: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  statusRow: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', gap: 5,
  },
  pill: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  pillTxt: { fontSize: 9, color: '#fff', fontWeight: '700' },
  warnBanner: {
    position: 'absolute', top: 8, left: 8, right: 8,
    backgroundColor: 'rgba(231,111,81,0.9)',
    borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10,
    alignItems: 'center',
  },
  warnTxt: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center' },
});
