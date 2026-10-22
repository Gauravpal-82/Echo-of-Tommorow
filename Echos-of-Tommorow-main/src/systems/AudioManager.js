/**
 * Centralized AudioManager for Echoes of Tomorrow
 * Handles SFX, ambient music, mute toggles, and Web Audio API synthesizer fallbacks.
 * Never crashes if an audio asset is missing.
 */
import { saveManager } from './SaveManager.js';

class AudioManager {
  constructor() {
    this.game = null;
    this.ctx = null;
    this.bgmSource = null;
    this.bgmGain = null;
    this.isInitialized = false;

    // Load saved settings
    const settings = saveManager.getSettings();
    this.isMuted = !!settings.soundMuted;
    this.isSfxMuted = !!settings.sfxMuted;
    this.isMusicMuted = !!settings.musicMuted;
  }

  setGame(game) {
    this.game = game;
  }

  initWebAudio() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          const resumeHandler = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
              this.ctx.resume();
            }
            window.removeEventListener('click', resumeHandler);
            window.removeEventListener('keydown', resumeHandler);
            window.removeEventListener('touchstart', resumeHandler);
          };
          window.addEventListener('click', resumeHandler);
          window.addEventListener('keydown', resumeHandler);
          window.addEventListener('touchstart', resumeHandler);
        }
      }
    } catch (e) {
      console.warn('Web Audio Context not available:', e);
    }
  }

  playSfx(scene, key, synthType = 'sine') {
    if (this.isMuted || this.isSfxMuted) return;

    this.initWebAudio();

    // 1. Try to play via Phaser Sound manager if loaded
    if (scene && scene.sound && scene.sound.get(key)) {
      try {
        scene.sound.play(key, { volume: 0.6 });
        return;
      } catch (e) {
        // Fall back to synth
      }
    }

    // 2. High fidelity Web Audio synth fallback
    this.playSynthFallback(key);
  }

  playSynthFallback(key) {
    if (!this.ctx || this.isMuted || this.isSfxMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (key) {
      case 'sfx-jump':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'sfx-collect':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(987.77, now + 0.08); // B5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case 'sfx-damage':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'sfx-checkpoint':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.1);
        osc.frequency.setValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'sfx-level-complete':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        osc.frequency.setValueAtTime(1046.50, now + 0.45);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
        break;

      case 'sfx-button-click':
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.06);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
    }
  }

  playMusic(scene, key) {
    if (this.isMuted || this.isMusicMuted) return;

    if (scene && scene.sound && scene.sound.get(key)) {
      try {
        if (!scene.sound.get(key).isPlaying) {
          scene.sound.play(key, { loop: true, volume: 0.4 });
        }
        return;
      } catch (e) {
        // Fall back to synth ambient drone
      }
    }

    this.startAmbientSynth();
  }

  stopMusic(scene, key) {
    if (scene && scene.sound && scene.sound.get(key)) {
      try {
        scene.sound.stopByKey(key);
      } catch (e) {}
    }
    this.stopAmbientSynth();
  }

  startAmbientSynth() {
    if (this.bgmSource || !this.ctx || this.isMuted || this.isMusicMuted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, now); // A2 drone

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, now); // E3 drone

      gain.gain.setValueAtTime(0.04, now);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.bgmSource = { osc1, osc2 };
      this.bgmGain = gain;
    } catch (e) {
      // Ignore
    }
  }

  stopAmbientSynth() {
    if (this.bgmSource) {
      try {
        this.bgmSource.osc1.stop();
        this.bgmSource.osc2.stop();
      } catch (e) {}
      this.bgmSource = null;
    }
  }

  toggleMasterMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbientSynth();
    }
    saveManager.setSettings({ soundMuted: this.isMuted });
    return this.isMuted;
  }

  toggleSfxMute() {
    this.isSfxMuted = !this.isSfxMuted;
    saveManager.setSettings({ sfxMuted: this.isSfxMuted });
    return this.isSfxMuted;
  }

  toggleMusicMute(scene, key) {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.stopMusic(scene, key);
    } else {
      this.playMusic(scene, key);
    }
    saveManager.setSettings({ musicMuted: this.isMusicMuted });
    return this.isMusicMuted;
  }
}

export const audioManager = new AudioManager();
