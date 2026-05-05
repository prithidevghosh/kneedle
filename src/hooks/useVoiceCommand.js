import { useEffect, useRef, useState } from 'react';

// Safe optional require — module exists only in dev clients / EAS builds.
// In Expo Go, every export is undefined and the hook becomes a no-op.
let SR = null;
try { SR = require('expo-speech-recognition'); } catch (_) { /* optional */ }

const DEFAULT_PHRASES = {
  bn: ['শুরু করুন', 'রেকর্ড শুরু', 'রেকর্ড'],
  hi: ['शुरू करें', 'रिकॉर्ड शुरू', 'रिकॉर्ड'],
  en: ['start recording', 'start record', 'record now', 'begin'],
};

const LOCALE = { bn: 'bn-IN', hi: 'hi-IN', en: 'en-IN' };

export default function useVoiceCommand({
  enabled,
  lang = 'en',
  onTrigger,
  phrases,
}) {
  const [supported] = useState(() => Boolean(SR?.ExpoSpeechRecognitionModule));
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (!supported || !enabled) return;
    let cancelled = false;
    const Module = SR.ExpoSpeechRecognitionModule;
    const targets = (phrases?.[lang] || DEFAULT_PHRASES[lang] || DEFAULT_PHRASES.en)
      .map(p => p.toLowerCase());

    const matches = (txt) => {
      const lower = (txt || '').toLowerCase();
      return targets.some(t => lower.includes(t));
    };

    const start = async () => {
      try {
        const perm = await SR.ExpoSpeechRecognitionModule.requestPermissionsAsync?.();
        if (perm && perm.granted === false) {
          console.warn('[Kneedle/voice] microphone permission denied');
          return;
        }
        if (cancelled) return;
        Module.start({
          lang: LOCALE[lang] || 'en-IN',
          interimResults: true,
          continuous: true,
          requiresOnDeviceRecognition: false,
          addsPunctuation: false,
        });
        setListening(true);
        console.log('[Kneedle/voice] listening for:', targets);
      } catch (e) {
        console.warn('[Kneedle/voice] failed to start', e?.message || e);
      }
    };

    const onResult = (ev) => {
      const t = ev?.results?.[0]?.transcript || '';
      if (!t) return;
      setLastHeard(t);
      if (matches(t)) {
        console.log('[Kneedle/voice] phrase matched →', t);
        try { Module.stop(); } catch (_) {}
        setListening(false);
        onTriggerRef.current?.(t);
      }
    };
    const onEnd = () => setListening(false);
    const onError = (e) => {
      console.warn('[Kneedle/voice] error', e?.error || e);
      setListening(false);
    };

    const subResult = SR.addSpeechRecognitionListener?.('result', onResult);
    const subEnd = SR.addSpeechRecognitionListener?.('end', onEnd);
    const subErr = SR.addSpeechRecognitionListener?.('error', onError);

    start();

    return () => {
      cancelled = true;
      try { Module.stop(); } catch (_) {}
      subResult?.remove?.();
      subEnd?.remove?.();
      subErr?.remove?.();
      setListening(false);
    };
  }, [supported, enabled, lang, phrases]);

  return { supported, listening, lastHeard };
}
