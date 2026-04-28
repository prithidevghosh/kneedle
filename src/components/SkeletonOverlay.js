import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText, Ellipse } from 'react-native-svg';

export default function SkeletonOverlay({ activeJoint = 'right_knee', width = 200, height = 280 }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const w = width;
  const h = height;
  const cx = w / 2;

  const joints = {
    head:      { x: cx,      y: h * 0.10 },
    neck:      { x: cx,      y: h * 0.18 },
    shoulderL: { x: cx - 30, y: h * 0.24 },
    shoulderR: { x: cx + 30, y: h * 0.24 },
    elbowL:    { x: cx - 36, y: h * 0.36 },
    elbowR:    { x: cx + 36, y: h * 0.36 },
    wristL:    { x: cx - 38, y: h * 0.47 },
    wristR:    { x: cx + 38, y: h * 0.47 },
    hip:       { x: cx,      y: h * 0.50 },
    hipL:      { x: cx - 18, y: h * 0.53 },
    hipR:      { x: cx + 18, y: h * 0.53 },
    kneeL:     { x: cx - 20, y: h * 0.70 },
    kneeR:     { x: cx + 20, y: h * 0.70 },
    ankleL:    { x: cx - 18, y: h * 0.87 },
    ankleR:    { x: cx + 18, y: h * 0.87 },
  };

  const isActive = (joint) => {
    if (activeJoint === 'right_knee') return joint === 'kneeR';
    if (activeJoint === 'left_knee')  return joint === 'kneeL';
    if (activeJoint === 'hips')       return joint === 'hipL' || joint === 'hipR';
    if (activeJoint === 'ankles')     return joint === 'ankleL' || joint === 'ankleR';
    return false;
  };

  const boneColor   = 'rgba(82,183,136,0.7)';
  const activeColor = '#f4a261';
  const dimColor    = 'rgba(82,183,136,0.35)';

  const boneStroke = (j1, j2) => (isActive(j1) || isActive(j2) ? activeColor : boneColor);

  const activeLabel = activeJoint === 'right_knee' ? 'ডান হাঁটু'
    : activeJoint === 'left_knee' ? 'বাম হাঁটু'
    : activeJoint === 'hips'      ? 'কোমর'
    : 'গোড়ালি';

  const labelJoint = activeJoint === 'right_knee' ? joints.kneeR
    : activeJoint === 'left_knee' ? joints.kneeL
    : activeJoint === 'hips'      ? joints.hipR
    : joints.ankleR;

  return (
    <Svg width={w} height={h}>
      <Ellipse cx={cx} cy={joints.head.y} rx={14} ry={16} fill="#1a2e22" opacity={0.6} />
      <Rect x={cx - 22} y={joints.neck.y} width={44} height={h * 0.32} rx={8} fill="#1a2e22" opacity={0.5} />

      <Line x1={joints.neck.x}      y1={joints.neck.y}      x2={joints.shoulderL.x} y2={joints.shoulderL.y} stroke={boneStroke('neck', 'shoulderL')}  strokeWidth={2} />
      <Line x1={joints.neck.x}      y1={joints.neck.y}      x2={joints.shoulderR.x} y2={joints.shoulderR.y} stroke={boneStroke('neck', 'shoulderR')}  strokeWidth={2} />
      <Line x1={joints.neck.x}      y1={joints.neck.y}      x2={joints.hip.x}       y2={joints.hip.y}       stroke={boneColor}                        strokeWidth={2} />
      <Line x1={joints.shoulderL.x} y1={joints.shoulderL.y} x2={joints.elbowL.x}    y2={joints.elbowL.y}    stroke={dimColor}                         strokeWidth={1.5} />
      <Line x1={joints.shoulderR.x} y1={joints.shoulderR.y} x2={joints.elbowR.x}    y2={joints.elbowR.y}    stroke={dimColor}                         strokeWidth={1.5} />
      <Line x1={joints.elbowL.x}    y1={joints.elbowL.y}    x2={joints.wristL.x}    y2={joints.wristL.y}    stroke={dimColor}                         strokeWidth={1.5} />
      <Line x1={joints.elbowR.x}    y1={joints.elbowR.y}    x2={joints.wristR.x}    y2={joints.wristR.y}    stroke={dimColor}                         strokeWidth={1.5} />
      <Line x1={joints.hip.x}       y1={joints.hip.y}       x2={joints.hipL.x}      y2={joints.hipL.y}      stroke={boneStroke('hip', 'hipL')}         strokeWidth={2} />
      <Line x1={joints.hip.x}       y1={joints.hip.y}       x2={joints.hipR.x}      y2={joints.hipR.y}      stroke={boneStroke('hip', 'hipR')}         strokeWidth={2} />
      <Line x1={joints.hipL.x}      y1={joints.hipL.y}      x2={joints.kneeL.x}     y2={joints.kneeL.y}     stroke={boneStroke('hipL', 'kneeL')}       strokeWidth={2} />
      <Line x1={joints.hipR.x}      y1={joints.hipR.y}      x2={joints.kneeR.x}     y2={joints.kneeR.y}     stroke={boneStroke('hipR', 'kneeR')}       strokeWidth={2} />
      <Line x1={joints.kneeL.x}     y1={joints.kneeL.y}     x2={joints.ankleL.x}    y2={joints.ankleL.y}    stroke={boneStroke('kneeL', 'ankleL')}     strokeWidth={2} />
      <Line x1={joints.kneeR.x}     y1={joints.kneeR.y}     x2={joints.ankleR.x}    y2={joints.ankleR.y}    stroke={boneStroke('kneeR', 'ankleR')}     strokeWidth={2} />

      {Object.entries(joints).filter(([k]) => k !== 'head' && k !== 'hip').map(([key, pos]) => (
        <Circle
          key={key}
          cx={pos.x} cy={pos.y}
          r={isActive(key) ? 7 : 4}
          fill={isActive(key) ? activeColor : boneColor}
          opacity={isActive(key) ? 1 : 0.7}
        />
      ))}

      <Circle cx={joints.head.x} cy={joints.head.y} r={13} fill="none" stroke={boneColor} strokeWidth={1.5} opacity={0.5} />

      <Circle
        cx={labelJoint.x}
        cy={labelJoint.y}
        r={16}
        fill="rgba(244,162,97,0.15)"
        stroke={activeColor}
        strokeWidth={2}
      />

      <Rect
        x={labelJoint.x + 14}
        y={labelJoint.y - 10}
        width={52}
        height={20}
        rx={5}
        fill="rgba(244,162,97,0.92)"
      />
      <SvgText
        x={labelJoint.x + 40}
        y={labelJoint.y + 4}
        textAnchor="middle"
        fontSize={9}
        fill="#7a3000"
        fontWeight="bold"
      >
        {activeLabel}
      </SvgText>
    </Svg>
  );
}
