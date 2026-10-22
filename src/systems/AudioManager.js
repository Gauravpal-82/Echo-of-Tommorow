/**
 * Centralized AudioManager for Echoes of Tomorrow
 * Handles SFX, background music playback, browser autoplay unlocking,
 * audio volume/mute persistence, and Web Audio API synthesizer fallbacks.
 */
import Phaser from 'phaser';
import { saveManager } from './SaveManager.js';

class AudioManager {
  constructor() {
    this.game = null;
    this.activeScene = null;
    this.ctx = null;
    this.bgmSource = null;
    this.bgmGain = null;
    this.currentMusic = null;
    this.currentMusicKey = null;
    this.targetMusicKey = null;
    this.unlockListenersAttached = false;

    // Load saved settings
    const settings = saveManager.getSettings();
    this.masterVolume = settings.masterVolume ?? 1.0;
    this.sfxVolume = settings.sfxVolume ?? 0.8;
    this.musicVolume = settings.musicVolume ?? 0.6;
    this.isMuted = !!settings.soundMuted;
    this.isSfxMuted = !!settings.sfxMuted;
    this.isMusicMuted = !!settings.musicMuted;

    // Setup global interaction listeners immediately to unlock audio on first click/key
    this.setupGlobalUnlock();
  }

  setGame(game) {
    this.game = game;
  }

  setupGlobalUnlock() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const unlockHandler = () => {
      // 1. Resume custom WebAudio context if existing
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // 2. Unlock Phaser sound manager and audio context if active
      const soundMgr = (this.activeScene && this.activeScene.sound) || (this.game && this.game.sound);
      if (soundMgr) {
        if (soundMgr.context && soundMgr.context.state === 'suspended') {
          soundMgr.context.resume().catch(() => {});
        }
        if (soundMgr.locked) {
          soundMgr.unlock();
        }
      }

      // 3. If there is a target music key and music is not currently playing, start it now
      if (this.targetMusicKey && !this.isMuted && !this.isMusicMuted) {
        if (!this.currentMusic || !this.currentMusic.isPlaying) {
          this.playMusic(this.activeScene, this.targetMusicKey);
        }
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  initWebAudio() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[AudioManager] Web Audio Context not available:', e);
    }
  }

  playSfx(scene, key) {
    if (this.isMuted || this.isSfxMuted) return;

    if (scene) {
      this.activeScene = scene;
      if (scene.game) this.game = scene.game;
    }

    this.initWebAudio();
    this.setupGlobalUnlock();

    const vol = Math.max(0.01, 0.6 * (this.sfxVolume ?? 0.8) * (this.masterVolume ?? 1.0));

    // 1. Try to play via Phaser Sound Manager if asset exists in cache
    const soundMgr = (scene && scene.sound) || (this.game && this.game.sound);
    const cache = (scene && scene.cache && scene.cache.audio) || (this.game && this.game.cache && this.game.cache.audio);

    if (soundMgr && cache && cache.exists(key)) {
      try {
        soundMgr.play(key, { volume: vol });
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
      this.ctx.resume().catch(() => {});
    }

    try {
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
    } catch (e) {
      // Ignore synth errors
    }
  }

  playMusic(scene, key = 'bgm-track') {
    if (scene) {
      this.activeScene = scene;
      if (scene.game) this.game = scene.game;
    }
    this.targetMusicKey = key;

    if (this.isMuted || this.isMusicMuted) {
      this.stopMusic(scene, key);
      return;
    }

    this.initWebAudio();
    this.setupGlobalUnlock();

    const vol = Math.max(0.01, 0.48 * (this.musicVolume ?? 0.6) * (this.masterVolume ?? 1.0));

    // If the requested music is already active and playing, simply maintain volume
    if (this.currentMusic && this.currentMusicKey === key && this.currentMusic.isPlaying) {
      this.currentMusic.setVolume(vol);
      return;
    }

    const soundMgr = (scene && scene.sound) || (this.game && this.game.sound);
    const cache = (scene && scene.cache && scene.cache.audio) || (this.game && this.game.cache && this.game.cache.audio);

    if (soundMgr) {
      // If locked by browser autoplay policy, try to unlock
      if (soundMgr.locked) {
        soundMgr.unlock();
      }

      // Check if sound instance already exists
      let sound = soundMgr.get(key);

      // If not yet instantiated, check if it's ready in the audio cache
      if (!sound && cache && cache.exists(key)) {
        try {
          sound = soundMgr.add(key, { loop: true, volume: vol });
        } catch (e) {
          console.warn('[AudioManager] sound.add error:', e);
        }
      }

      if (sound) {
        // Stop any previous differing music instance
        if (this.currentMusic && this.currentMusic !== sound) {
          try {
            this.currentMusic.stop();
          } catch (e) {}
        }
        this.stopAmbientSynth();

        this.currentMusic = sound;
        this.currentMusicKey = key;

        try {
          sound.setVolume(vol);
          if (!sound.isPlaying) {
            sound.play({ loop: true, volume: vol });
          }

          // Register unlock listener if sound manager was locked
          if (soundMgr.locked) {
            soundMgr.once(Phaser.Sound.Events.UNLOCKED, () => {
              if (this.currentMusic && !this.isMuted && !this.isMusicMuted && !this.currentMusic.isPlaying) {
                this.currentMusic.play({ loop: true, volume: vol });
              }
            });
          }

          return;
        } catch (e) {
          console.warn('[AudioManager] sound.play error:', e);
        }
      }
    }

    // Fallback: If asset is still loading or audio context is pending, start ambient synth
    this.startAmbientSynth();
  }

  stopMusic(scene, key) {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch (e) {}
      this.currentMusic = null;
    }

    const soundMgr = (scene && scene.sound) || (this.game && this.game.sound);
    if (soundMgr && key) {
      try {
        soundMgr.stopByKey(key);
      } catch (e) {}
    }

    this.stopAmbientSynth();
    this.currentMusicKey = null;
  }

  startAmbientSynth() {
    if (this.bgmSource || !this.ctx || this.isMuted || this.isMusicMuted) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, now); // A2 fundamental

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, now); // E3 perfect 5th

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(220, now); // A3 harmonic

      const vol = 0.05 * (this.masterVolume ?? 1.0) * (this.musicVolume ?? 0.6);
      gain.gain.setValueAtTime(Math.max(0.005, vol), now);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      this.bgmSource = { osc1, osc2, osc3 };
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
        if (this.bgmSource.osc3) this.bgmSource.osc3.stop();
      } catch (e) {}
      this.bgmSource = null;
    }
  }

  toggleMasterMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.currentMusic) {
        try { this.currentMusic.stop(); } catch (e) {}
      }
      this.stopAmbientSynth();
    } else {
      if (this.targetMusicKey && !this.isMusicMuted) {
        this.playMusic(this.activeScene, this.targetMusicKey);
      }
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
    const targetKey = key || this.currentMusicKey || this.targetMusicKey || 'bgm-track';
    if (this.isMusicMuted) {
      this.stopMusic(scene, targetKey);
    } else {
      this.playMusic(scene, targetKey);
    }
    saveManager.setSettings({ musicMuted: this.isMusicMuted });
    return this.isMusicMuted;
  }

  setMasterVolume(vol) {
    this.masterVolume = Phaser.Math.Clamp(vol, 0, 1);
    this.isMuted = this.masterVolume === 0;
    saveManager.setSettings({ masterVolume: this.masterVolume, soundMuted: this.isMuted });
    const effectiveMusicVol = Math.max(0, Math.min(1, 0.48 * this.musicVolume * this.masterVolume));
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.setVolume(effectiveMusicVol);
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(0.05 * this.masterVolume * this.musicVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Phaser.Math.Clamp(vol, 0, 1);
    this.isSfxMuted = this.sfxVolume === 0;
    saveManager.setSettings({ sfxVolume: this.sfxVolume, sfxMuted: this.isSfxMuted });
  }

  setMusicVolume(vol, scene, key) {
    this.musicVolume = Phaser.Math.Clamp(vol, 0, 1);
    this.isMusicMuted = this.musicVolume === 0;
    saveManager.setSettings({ musicVolume: this.musicVolume, musicMuted: this.isMusicMuted });
    const effectiveVol = Math.max(0, Math.min(1, 0.48 * (this.masterVolume ?? 1.0) * this.musicVolume));
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.setVolume(effectiveVol);
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(0.05 * (this.masterVolume ?? 1.0) * this.musicVolume, this.ctx.currentTime);
    }
  }

  reloadSettings() {
    const settings = saveManager.getSettings();
    this.masterVolume = settings.masterVolume ?? 1.0;
    this.sfxVolume = settings.sfxVolume ?? 0.8;
    this.musicVolume = settings.musicVolume ?? 0.6;
    this.isMuted = !!settings.soundMuted;
    this.isSfxMuted = !!settings.sfxMuted;
    this.isMusicMuted = !!settings.musicMuted;
  }
}

export const audioManager = new AudioManager();
