const BASE_URL = 'http://192.168.1.100:8000'; // change to your local IP

export const API = {
  async analyseGait(videoUri, profile) {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'walk.mp4',
      });
      formData.append('knee', profile.knee);
      formData.append('age', profile.age);
      formData.append('lang', profile.lang || 'bn');

      const response = await fetch(`${BASE_URL}/analyse`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.ok) throw new Error('Server error');
      return await response.json();
    } catch (error) {
      return MOCK_RESPONSE;
    }
  }
};

const MOCK_RESPONSE = {
  observation: 'হাঁটার সময় শরীর ডানদিকে সামান্য হেলছে, যা ডান হাঁটুতে অতিরিক্ত চাপ তৈরি করছে।',
  observation_en: 'Your body leans slightly right while walking, putting extra load on your right knee.',
  fix_title: 'বাম পা ১০° বাইরে রাখুন',
  fix_desc: 'হাঁটার সময় বাম পায়ের আঙুল সামান্য বাইরের দিকে রাখুন। এতে হাঁটুর চাপ কমবে।',
  exercises: [
    { name: 'হাঁটু মোড়ানো', reps: '১০×৩', name_en: 'Knee bend', reps_en: '10×3' },
    { name: 'পা তোলা', reps: '১৫×২', name_en: 'Leg raise', reps_en: '15×2' },
  ],
  active_joint: 'right_knee',
  symmetry_score: 62,
  session_number: 1,
};
