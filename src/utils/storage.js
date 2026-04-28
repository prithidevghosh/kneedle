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
  }
};
