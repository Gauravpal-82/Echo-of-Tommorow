import Phaser from 'phaser';
import { ASSET_MANIFEST, getAllAssetEntries } from '../config/assets.js';
import { audioManager } from '../systems/AudioManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Atmospheric loading backdrop
    this.add.rectangle(0, 0, width, height, 0x090b10).setOrigin(0);

    // Title
    this.add.text(width / 2, height / 2 - 70, 'ECHOES OF TOMORROW', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '32px',
      fontStyle: '800',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 25, 'A 2D Atmospheric Adventure · Team Zeronix', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Progress Bar
    const barWidth = 320;
    const barHeight = 10;
    const progressBg = this.add.rectangle(width / 2, height / 2 + 30, barWidth, barHeight, 0x0f1e31);
    progressBg.setStrokeStyle(1, 0x1e3a5f);

    const progressBar = this.add.rectangle(width / 2 - barWidth / 2, height / 2 + 30, 0, barHeight, 0x38bdf8);
    progressBar.setOrigin(0, 0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 65, 'Attuning world frequencies...', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#64748b'
    }).setOrigin(0.5);

    // Progress events
    this.load.on('progress', (value) => {
      progressBar.width = barWidth * value;
      loadingText.setText(`Attuning world fragments: ${Math.floor(value * 100)}%`);
    });

    // Asset load error handling - never crash, warn clearly
    this.load.on('loaderror', (fileObj) => {
      console.warn(`[Asset Missing / Load Error]: "${fileObj.src}" (key: ${fileObj.key}). Using automatic procedural fallback.`);
    });

    // 1. Load Player Images
    Object.values(ASSET_MANIFEST.player).forEach(item => {
      this.load.image(item.key, item.path);
    });

    // 2. Load Backgrounds
    Object.values(ASSET_MANIFEST.backgrounds).forEach(item => {
      this.load.image(item.key, item.path);
    });

    // 3. Load Platforms
    Object.values(ASSET_MANIFEST.platforms).forEach(item => {
      this.load.image(item.key, item.path);
    });

    // 4. Load Enemies
    Object.values(ASSET_MANIFEST.enemies).forEach(item => {
      this.load.image(item.key, item.path);
    });

    // 5. Load Collectibles
    Object.values(ASSET_MANIFEST.collectibles).forEach(item => {
      this.load.image(item.key, item.path);
    });

    // 6. Load Hazards (Generated procedurally for crisp vector detail and precise tileable bounds)
    Object.values(ASSET_MANIFEST.hazards).forEach(item => {
      if (item.key.startsWith('hazard-')) return;
      this.load.image(item.key, item.path);
    });

    // 7. Load Checkpoints & Goals
    this.load.image(ASSET_MANIFEST.checkpoints.monolith.key, ASSET_MANIFEST.checkpoints.monolith.path);
    this.load.image(ASSET_MANIFEST.goals.finishGate.key, ASSET_MANIFEST.goals.finishGate.path);

    // 8. Load Environment Scenery
    ASSET_MANIFEST.environment.level1.forEach(item => this.load.image(item.key, item.path));
    ASSET_MANIFEST.environment.level2.forEach(item => this.load.image(item.key, item.path));

    // 9. Load UI
    this.load.image(ASSET_MANIFEST.ui.heart.key, ASSET_MANIFEST.ui.heart.path);
    this.load.image(ASSET_MANIFEST.ui.energyIcon.key, ASSET_MANIFEST.ui.energyIcon.path);
    this.load.image(ASSET_MANIFEST.ui.appIcon.key, ASSET_MANIFEST.ui.appIcon.path);

    // 10. Load Audio SFX & BGM
    Object.values(ASSET_MANIFEST.audio.sfx).forEach(item => {
      this.load.audio(item.key, item.path);
    });
    if (ASSET_MANIFEST.audio.music && ASSET_MANIFEST.audio.music.bgm) {
      const bgmInfo = ASSET_MANIFEST.audio.music.bgm;
      const audioSources = bgmInfo.urls || [
        '/assets/audio/music/background-music.mp3',
        '/assets/audio/music/background-music.ogg',
        '/assets/audio/music/background-music.wav'
      ];
      this.load.audio(bgmInfo.key, audioSources);
    }
  }

  create() {
    // Generate procedural fallbacks for any missing textures
    this.ensureFallbackTextures();

    // Init WebAudio context
    audioManager.initWebAudio();

    // Transition to MenuScene
    this.scene.start('MenuScene');
  }

  ensureFallbackTextures() {
    const list = getAllAssetEntries();
    list.forEach(item => {
      let needsFallback = false;
      if (!this.textures.exists(item.key)) {
        needsFallback = true;
      } else {
        const tex = this.textures.get(item.key);
        const img = tex ? tex.getSourceImage() : null;
        if (!img || !img.width || !img.height) {
          needsFallback = true;
          this.textures.remove(item.key);
        }
      }

      if (needsFallback) {
        const w = item.width || 64;
        const h = item.height || 64;
        const color = item.fallbackColor || 0x64748b;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        if (item.key === 'hazard-spikes-l2') {
          // Sector 2: Cybernetic Frontier electrified plasma conduit spikes
          // Dark titanium chassis base
          g.fillStyle(0x0a1120, 1);
          g.fillRect(0, 24, w, 8);
          g.fillStyle(0x0284c7, 1);
          g.fillRect(0, 24, w, 2);
          // Caution chevrons
          for (let cx = 4; cx < w; cx += 16) {
            g.fillStyle(0xf59e0b, 0.85);
            g.fillTriangle(cx, 31, cx + 5, 26, cx + 7, 26);
            g.fillTriangle(cx, 31, cx + 7, 26, cx + 2, 31);
          }
          // 4 plasma energy spikes per 64px tile
          for (let i = 0; i < 4; i++) {
            const bx = i * 16 + 8;
            // Emitter node base
            g.fillStyle(0x1e293b, 1);
            g.fillRect(bx - 6, 22, 12, 3);
            g.fillStyle(0x38bdf8, 1);
            g.fillCircle(bx, 22, 2.5);

            const tipY = (i % 2 === 0) ? 2 : 4;
            // Outer plasma energy cone
            g.fillStyle(0xe11d48, 0.9);
            g.fillTriangle(bx - 5, 23, bx, tipY, bx + 5, 23);
            // Inner energized laser core
            g.fillStyle(0xf43f5e, 1);
            g.fillTriangle(bx - 3, 23, bx, tipY, bx + 3, 23);
            g.fillStyle(0xffffff, 1);
            g.fillTriangle(bx - 1, 23, bx, tipY, bx + 1, 23);

            // Energy cross-spark
            g.fillStyle(0x38bdf8, 0.9);
            g.fillRect(bx - 4, 14, 8, 1.5);
          }
          // Top hazard boundary line
          g.lineStyle(1, 0x38bdf8, 0.7);
          g.lineBetween(0, 24, w, 24);
        } else if (item.key === 'hazard-spikes-l1' || item.key === 'hazard-spikes' || item.key === 'hazard-generic') {
          // Sector 1: Wilderness razor stone obsidian spikes with ruby veins
          // Dark weathered stone bedrock base plate (sits flush at y=25..32)
          g.fillStyle(0x1a121d, 1);
          g.fillRect(0, 25, w, 7);
          g.fillStyle(0x2f1f33, 1);
          g.fillRect(0, 25, w, 2);
          // Anchor stone rivets
          for (let rx = 8; rx < w; rx += 16) {
            g.fillStyle(0x4a3250, 1);
            g.fillCircle(rx, 29, 2);
            g.fillStyle(0x120c15, 1);
            g.fillCircle(rx - 0.5, 28.5, 1);
          }
          // 4 sharp crystalline razor spikes per 64px tile
          for (let i = 0; i < 4; i++) {
            const bx = i * 16 + 8;
            const tipY = (i === 1) ? 1 : ((i === 3) ? 2 : 3);
            // Shadow left facet
            g.fillStyle(0x3f0e1f, 1);
            g.fillTriangle(bx - 7, 26, bx, tipY, bx, 26);
            // Bright lit right facet
            g.fillStyle(0x88132c, 1);
            g.fillTriangle(bx, tipY, bx + 7, 26, bx, 26);
            // Glowing razor spine highlight
            g.fillStyle(0xf87171, 1);
            g.fillTriangle(bx - 1, 26, bx, tipY, bx + 1.5, tipY + 8);
            // Razor sharp needle tip
            g.fillStyle(0xfecaca, 1);
            g.fillCircle(bx, tipY + 0.5, 1);
          }
          // Ground anchor contact line
          g.lineStyle(1.5, 0x551a2d, 0.85);
          g.lineBetween(0, 25, w, 25);
        } else {
          g.fillStyle(color, 1);
          g.fillRect(0, 0, w, h);
          g.lineStyle(2, 0xffffff, 0.6);
          g.strokeRect(1, 1, w - 2, h - 2);
        }
        g.generateTexture(item.key, w, h);
        g.destroy();
      }
    });
  }
}
