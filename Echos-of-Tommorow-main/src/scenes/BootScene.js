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
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 25, 'A Hand-Drawn Adventure • Team Zeronix', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Progress Bar
    const barWidth = 320;
    const barHeight = 12;
    const progressBg = this.add.rectangle(width / 2, height / 2 + 30, barWidth, barHeight, 0x1e293b);
    progressBg.setStrokeStyle(1, 0x334155);

    const progressBar = this.add.rectangle(width / 2 - barWidth / 2, height / 2 + 30, 0, barHeight, 0x38bdf8);
    progressBar.setOrigin(0, 0.5);

    const loadingText = this.add.text(width / 2, height / 2 + 65, 'Attuning world fragments...', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
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

    // 6. Load Hazards
    Object.values(ASSET_MANIFEST.hazards).forEach(item => {
      // No spike image is shipped, so generate a vector texture instead of requesting a missing file.
      if (item.key === 'hazard-spikes') return;
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

    // 10. Load Audio SFX (Missing audio gracefully caught)
    Object.values(ASSET_MANIFEST.audio.sfx).forEach(item => {
      this.load.audio(item.key, item.path);
    });
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
        if (item.key === 'hazard-spikes') {
          g.fillStyle(0x321b26, 1);
          g.fillRect(0, h * 0.7, w, h * 0.3);
          for (let x = -8; x < w + 8; x += 24) {
            g.fillStyle(0x7f1d32, 1);
            g.fillTriangle(x, h * 0.82, x + 12, h * 0.12, x + 24, h * 0.82);
            g.fillStyle(0xf87171, 1);
            g.fillTriangle(x + 5, h * 0.76, x + 12, h * 0.12, x + 14, h * 0.76);
          }
          g.lineStyle(2, 0xfca5a5, 0.8);
          g.lineBetween(0, h * 0.82, w, h * 0.82);
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
