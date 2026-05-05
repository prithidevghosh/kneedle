import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  async getProfile() {
    const data = await AsyncStorage.getItem('kneedle_profile');
    return data ? JSON.parse(data) : null;
  },
  async saveProfile(profile) {
    await AsyncStorage.setItem('kneedle_profile', JSON.stringify(profile));
  },
  async getLanguage() {
    return await AsyncStorage.getItem('kneedle_lang') || 'en';
  },
  async saveLanguage(lang) {
    await AsyncStorage.setItem('kneedle_lang', lang);
  },
  async getSessions() {
    const data = await AsyncStorage.getItem('kneedle_sessions');
    return data ? JSON.parse(data) : [];
  },
  async saveSession(session) {
    const sessions = await this.getSessions();
    sessions.unshift({ ...session, date: new Date().toISOString() });
    await AsyncStorage.setItem('kneedle_sessions', JSON.stringify(sessions));
  },
  async getPainLog() {
    const data = await AsyncStorage.getItem('kneedle_pain');
    return data ? JSON.parse(data) : [];
  },
  async logPain(level) {
    const log = await this.getPainLog();
    log.unshift({ level, date: new Date().toISOString() });
    const trimmed = log.slice(0, 30);
    await AsyncStorage.setItem('kneedle_pain', JSON.stringify(trimmed));
  },

  // Per-exercise feedback memory: {exerciseName_en: [{feedback, date, painSide?}]}
  async getExerciseFeedback() {
    const data = await AsyncStorage.getItem('kneedle_ex_feedback');
    return data ? JSON.parse(data) : {};
  },
  async logExerciseFeedback(exerciseNameEn, feedback, painSide = null) {
    const all = await this.getExerciseFeedback();
    const key = exerciseNameEn || 'unknown';
    const list = all[key] || [];
    list.unshift({
      feedback, // 'hurt' | 'okay' | 'good'
      painSide,
      date: new Date().toISOString(),
    });
    all[key] = list.slice(0, 10);
    await AsyncStorage.setItem('kneedle_ex_feedback', JSON.stringify(all));
  },
  async getLastFeedbackFor(exerciseNameEn) {
    const all = await this.getExerciseFeedback();
    const list = all[exerciseNameEn] || [];
    return list[0] || null;
  },

  // Daily streak: distinct YYYY-MM-DD with completed work.
  async getStreak() {
    const sessions = await this.getSessions();
    if (!sessions.length) return 0;
    const days = new Set(
      sessions.map(s => new Date(s.date).toISOString().slice(0, 10))
    );
    let streak = 0;
    const cur = new Date();
    while (true) {
      const key = cur.toISOString().slice(0, 10);
      if (days.has(key)) {
        streak += 1;
        cur.setDate(cur.getDate() - 1);
      } else if (streak === 0) {
        // Allow the streak to start "yesterday" if today missed.
        cur.setDate(cur.getDate() - 1);
        const k2 = cur.toISOString().slice(0, 10);
        if (days.has(k2)) {
          streak += 1;
          cur.setDate(cur.getDate() - 1);
        } else break;
      } else break;
    }
    return streak;
  },

  async clearAllSessions() {
    await AsyncStorage.multiRemove(['kneedle_sessions', 'kneedle_pain']);
  },

  // Trend extraction across sessions for a given metric.
  async getMetricSeries(metricKey) {
    const sessions = await this.getSessions();
    return sessions
      .map(s => ({
        date: s.date,
        value: s.result?.metrics?.[metricKey],
      }))
      .filter(p => p.value != null && !Number.isNaN(p.value))
      .reverse();
  },
};
