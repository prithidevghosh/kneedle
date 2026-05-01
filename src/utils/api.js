const BASE_URL = 'http://192.168.3.136:8000';

export const API = {
  async analyseGait(videoUri, profile, sessionNumber = 1) {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'walk.mp4',
    });
    formData.append('knee', profile.knee ?? 'both');
    formData.append('age', String(profile.age ?? '60'));
    formData.append('lang', profile.lang || 'bn');
    formData.append('session_number', sessionNumber);

    const response = await fetch(`${BASE_URL}/analyse`, {
      method: 'POST',
      body: formData,
      // Content-Type must NOT be set manually — fetch attaches the multipart
      // boundary automatically when the body is FormData.
    });

    if (response.status === 400) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || 'Invalid file uploaded');
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Analysis failed (server ${response.status})`);
    }

    return await response.json();
  },
};

// Matches the full /analyse success-response shape.
// Used in development or when the server is unreachable.
export const MOCK_RESPONSE = {
  observation: 'হাঁটার সময় শরীর ডানদিকে সামান্য হেলছে, যা ডান হাঁটুতে অতিরিক্ত চাপ তৈরি করছে।',
  observation_en: 'Your body leans slightly right while walking, putting extra load on your right knee.',
  fix_title: 'বাম পা ১০° বাইরে রাখুন',
  fix_desc: 'হাঁটার সময় বাম পায়ের আঙুল সামান্য বাইরের দিকে রাখুন। এতে হাঁটুর চাপ কমবে।',
  fix_title_en: 'Point left toes slightly outward',
  fix_desc_en: 'While walking, point your left toes 10° outward. This reduces the load on your knee.',
  exercises: [
    {
      name: 'হাঁটু মোড়ানো',
      reps: '১০×৩',
      name_en: 'Knee bend',
      reps_en: '10×3',
      description: 'চেয়ারে বসে ধীরে ধীরে হাঁটু ভাঁজ করুন এবং সোজা করুন।',
      reason: 'Improves range of motion in the stiff knee.',
    },
    {
      name: 'পা তোলা',
      reps: '১৫×২',
      name_en: 'Leg raise',
      reps_en: '15×2',
      description: 'চেয়ারে বসে সোজা পা তুলুন এবং ৩ সেকেন্ড ধরে রাখুন।',
      reason: 'Strengthens quadriceps to reduce knee load during walking.',
    },
  ],
  active_joint: 'right_knee',
  symmetry_score: 62,
  session_number: 1,
  thinking: 'Fallback used due to: server unreachable',
  metrics: {
    knee_angle_right: null,
    knee_angle_left: null,
    knee_angle_diff: null,
    symmetry_score: 62,
    trunk_lean_angle: null,
    trunk_lean_direction: null,
    toe_out_angle_right: null,
    toe_out_angle_left: null,
    cadence: null,
    frames_analysed: 0,
    confidence: 0,
  },
};
