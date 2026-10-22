/**
 * SaveManager handles LocalStorage persistence for Echoes of Tomorrow.
 * Gracefully handles private browsing mode or disabled storage.
 */

const STORAGE_KEY = 'echoes_of_tomorrow_save_v1';

const DEFAULT_SAVE_DATA = {
  unlockedLevel: 1,
  completedLevels: [],
  highScores: { 1: 0, 2: 0 },
  collectedFragments: { 1: 0, 2: 0 },
  totalFragmentsAllTime: 0,
  settings: {
    masterVolume: 1.0,
    soundMuted: false,
    sfxMuted: false,
    musicMuted: false
  }
};

class SaveManager {
  constructor() {
    this.data = this.load();
  }

  isAvailable() {
    try {
      const test = '__echoes_storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  load() {
    if (!this.isAvailable()) {
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        highScores: { ...DEFAULT_SAVE_DATA.highScores, ...(parsed.highScores || {}) },
        collectedFragments: { ...DEFAULT_SAVE_DATA.collectedFragments, ...(parsed.collectedFragments || {}) },
        settings: { ...DEFAULT_SAVE_DATA.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.warn('Error reading save data from localStorage, using default:', e);
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
  }

  save() {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }

  isLevelUnlocked(levelId) {
    if (levelId === 1) return true;
    return this.data.unlockedLevel >= levelId;
  }

  isLevelCompleted(levelId) {
    return this.data.completedLevels.includes(levelId);
  }

  completeLevel(levelId, score, fragments) {
    if (!this.data.completedLevels.includes(levelId)) {
      this.data.completedLevels.push(levelId);
    }

    // Unlock next level (Level 2 is max in this game)
    if (levelId === 1 && this.data.unlockedLevel < 2) {
      this.data.unlockedLevel = 2;
    }

    // Update best score for this level
    const currentBest = this.data.highScores[levelId] || 0;
    if (score > currentBest) {
      this.data.highScores[levelId] = score;
    }

    // Update fragments count for this level
    const currentBestFrag = this.data.collectedFragments[levelId] || 0;
    if (fragments > currentBestFrag) {
      this.data.collectedFragments[levelId] = fragments;
    }

    this.data.totalFragmentsAllTime = (this.data.totalFragmentsAllTime || 0) + fragments;

    this.save();
  }

  getHighScore(levelId) {
    return this.data.highScores[levelId] || 0;
  }

  getBestFragments(levelId) {
    return this.data.collectedFragments[levelId] || 0;
  }

  getTotalScore() {
    return (this.data.highScores[1] || 0) + (this.data.highScores[2] || 0);
  }

  getTotalFragments() {
    return (this.data.collectedFragments[1] || 0) + (this.data.collectedFragments[2] || 0);
  }

  getSettings() {
    return this.data.settings;
  }

  setSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  resetProgress() {
    const keepSettings = { ...this.data.settings };
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.data.settings = keepSettings;
    this.save();
  }
}

export const saveManager = new SaveManager();
