import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    this.isTransitioning = false;
    this.cameras.main.fadeIn(350, 4, 9, 20);

    // Start background music
    audioManager.playMusic(this, 'bgm-track');
    this.input.once('pointerdown', () => {
      audioManager.playMusic(this, 'bgm-track');
    });

    // Modal tracking and ESC dismissal
    this.activeModal = null;
    this.dismissActiveModal = () => {
      if (this.activeModal) {
        audioManager.playSfx(this, 'sfx-button-click');
        this.activeModal.destroy();
        this.activeModal = null;
      }
    };
    this.input.keyboard?.on('keydown-ESC', () => this.dismissActiveModal());
    const windowMenuEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('MenuScene')) {
        if (this.activeModal) {
          e.preventDefault();
          this.dismissActiveModal();
        }
      }
    };
    window.addEventListener('keydown', windowMenuEsc);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', windowMenuEsc);
    });

    // Atmospheric illustrated backdrop with cinematic slow zoom
    if (this.textures.exists('bg-level-1')) {
      const bg = this.add.image(width / 2, height / 2, 'bg-level-1');
      bg.setDisplaySize(width, height);
      bg.setTint(0x94a3b8);
      this.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 1.05,
        scaleY: bg.scaleY * 1.05,
        duration: 20000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      this.add.rectangle(0, 0, width, height, 0x050811).setOrigin(0);
    }

    // Modern dark glass overlay with subtle vignette
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x030712, 0x030712, 0x0a101f, 0x0a101f, 0.82, 0.82, 0.92, 0.92);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);

    // Atmospheric floating energy particles
    this.createAtmosphericEmbers(width, height);

    // Kicker tagline
    this.add.text(width / 2, height * 0.10, 'A 2D ATMOSPHERIC PLATFORMER', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#38bdf8',
      letterSpacing: 3
    }).setOrigin(0.5).setDepth(2);

    // Primary Title Lockup
    const title = this.add.text(width / 2, height * 0.20, 'ECHOES OF TOMORROW', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: width < 600 ? '30px' : '44px',
      fontStyle: '800',
      color: '#f8fafc',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    // Subtle ambient title float
    this.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.27, 'Traverse forgotten biomes · Recover ancient memories', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      color: '#94a3b8',
      letterSpacing: 0.5
    }).setOrigin(0.5).setDepth(2);

    // Central Glass Panel
    const panelWidth = Math.min(460, width - 40);
    const panelHeight = height * 0.58;
    const panelY = height * 0.32;

    const panel = this.add.graphics().setDepth(1);
    panel.fillStyle(0x060c18, 0.76);
    panel.fillRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 20);
    panel.lineStyle(1, 0x38bdf8, 0.25);
    panel.strokeRoundedRect(width / 2 - panelWidth / 2, panelY, panelWidth, panelHeight, 20);

    // Studio watermark
    this.add.text(width / 2, panelY + 16, 'TEAM ZERONIX PRESENTS', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      color: '#64748b',
      letterSpacing: 1.5
    }).setOrigin(0.5).setDepth(2);

    // Interactive Buttons
    const buttons = [
      {
        text: 'START EXPEDITION',
        subtext: 'Launch Sector 01: The Lost Wilderness',
        primary: true,
        x: width / 2,
        y: panelY + 68,
        action: () => {
          this.transitionToScene('GameScene', { levelId: 1 });
        }
      },
      {
        text: 'SECTOR ARCHIVE',
        subtext: 'Select unlocked missions & view best records',
        primary: false,
        x: width / 2,
        y: panelY + 130,
        action: () => {
          this.transitionToScene('LevelSelectScene');
        }
      },
      {
        text: 'EXPEDITION GUIDE',
        subtext: 'Controls, jump mechanics & objectives',
        primary: false,
        isSecondary: true,
        x: width / 2 - 105,
        y: panelY + 198,
        action: () => {
          this.showHowToPlayModal();
        }
      },
      {
        text: 'SYSTEM SETTINGS',
        subtext: 'Audio, screen effects & calibration',
        primary: false,
        isSecondary: true,
        x: width / 2 + 105,
        y: panelY + 198,
        action: () => {
          this.showSettingsModal();
        }
      },
      {
        text: 'EXPEDITION CREDITS',
        subtext: 'Core architecture & creators',
        primary: false,
        isSecondary: true,
        x: width / 2,
        y: panelY + 258,
        action: () => {
          this.transitionToScene('CreditsScene');
        }
      }
    ];

    buttons.forEach((btn, index) => {
      const button = this.createModernButton(
        btn.x, btn.y, btn.text, btn.primary, btn.isSecondary, btn.action
      );
      button.setDepth(3).setAlpha(0).setY(btn.y + 12);
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: btn.y,
        duration: 320,
        delay: 100 + index * 55,
        ease: 'Cubic.easeOut'
      });
    });

    // Bottom telemetry bar
    const totalFragments = saveManager.getTotalFragments();
    const totalScore = saveManager.getTotalScore();
    const bestSector1 = saveManager.getBestTime(1);
    const timeDisplay = bestSector1 ? ` · BEST 01: ${bestSector1.toFixed(1)}s` : '';

    this.add.text(16, height - 16, `ATTUNED: ${totalFragments}/18 FRAGMENTS · RECORD: ${totalScore} PTS${timeDisplay}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#64748b'
    }).setOrigin(0, 1).setDepth(2);

    this.add.text(width - 16, height - 16, 'BUILD 2.0 · ZERO-LATENCY ENGINE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#475569'
    }).setOrigin(1, 1).setDepth(2);
  }

  createModernButton(x, y, text, isPrimary, isSecondary, onClick) {
    const btnWidth = isSecondary ? 190 : 360;
    const btnHeight = isSecondary ? 38 : 46;
    const container = this.add.container(x, y);

    const normalBg = isPrimary ? 0x0284c7 : 0x0f1b2c;
    const hoverBg = isPrimary ? 0x0369a1 : 0x162942;
    const strokeCol = isPrimary ? 0x38bdf8 : 0x223a59;

    const shadow = this.add.rectangle(0, 3, btnWidth, btnHeight, 0x020617, 0.4);
    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, normalBg, isPrimary ? 0.95 : 0.85);
    bg.setStrokeStyle(isPrimary ? 1.5 : 1, strokeCol, 0.9);

    // Accent line on left for primary/active feel
    const accentLine = this.add.rectangle(-btnWidth / 2 + 2, 0, 3, btnHeight - 8, isPrimary ? 0xbae6fd : 0x38bdf8, isPrimary ? 1 : 0.5);

    const label = this.add.text(isPrimary ? 4 : 0, 0, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isSecondary ? '12px' : '14px',
      fontStyle: '600',
      color: isPrimary ? '#ffffff' : '#e0f2fe',
      letterSpacing: isSecondary ? 0.8 : 1.2
    }).setOrigin(0.5);

    container.add([shadow, bg, accentLine, label]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverBg, 1);
      bg.setStrokeStyle(1.5, 0x38bdf8, 1);
      accentLine.setAlpha(1);
      this.tweens.add({ targets: container, scale: 1.025, duration: 120, ease: 'Cubic.easeOut' });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(normalBg, isPrimary ? 0.95 : 0.85);
      bg.setStrokeStyle(isPrimary ? 1.5 : 1, strokeCol, 0.9);
      accentLine.setAlpha(isPrimary ? 1 : 0.5);
      this.tweens.add({ targets: container, scale: 1, duration: 150, ease: 'Cubic.easeOut' });
    });

    bg.on('pointerdown', () => {
      if (this.isTransitioning) return;
      audioManager.playSfx(this, 'sfx-button-click');
      this.tweens.add({
        targets: container,
        scale: 0.97,
        duration: 70,
        yoyo: true,
        onComplete: onClick
      });
    });

    return container;
  }

  transitionToScene(sceneKey, data) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(260, 4, 9, 20);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey, data);
    });
  }

  createAtmosphericEmbers(w, h) {
    for (let i = 0; i < 28; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.FloatBetween(1, 2.5),
        Phaser.Math.RND.pick([0x38bdf8, 0x0284c7, 0x67e8f9]),
        Phaser.Math.FloatBetween(0.2, 0.7)
      );
      ember.setDepth(1.5);

      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(50, 110),
        x: ember.x + Phaser.Math.Between(-35, 35),
        alpha: 0,
        duration: Phaser.Math.Between(3200, 7500),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  showHowToPlayModal() {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }

    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);
    this.activeModal = modal;

    const blocker = this.add.rectangle(0, 0, width, height, 0x020617, 0.82).setOrigin(0).setInteractive();
    const panelW = Math.min(540, width - 36);
    const panelH = 410;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x081324, 0.98);
    panel.setStrokeStyle(1.5, 0x38bdf8, 0.6);

    blocker.on('pointerdown', (pointer) => {
      const bounds = panel.getBounds();
      if (!bounds.contains(pointer.x, pointer.y)) {
        this.dismissActiveModal();
      }
    });

    const title = this.add.text(width / 2, height / 2 - 165, 'EXPEDITION OPERATING MANUAL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: '700',
      color: '#38bdf8',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const headerLine = this.add.rectangle(width / 2, height / 2 - 145, panelW - 40, 1, 0x1e3a5f);

    const lines = [
      'NAVIGATION CONTROLS',
      '• Movement: A / D or Left / Right Arrows',
      '• Jump: Spacebar, W, or Up Arrow (Single grounded leap)',
      '• Mobile: Ergonomic on-screen directional & jump controls',
      '• Quick Actions: [ESC / P] Pause game  ·  [R] Quick level retry',
      '',
      'MISSION OBJECTIVES',
      '1. Cross treacherous terrain without falling into deep chasms.',
      '2. Collect glowing Energy Fragments (+100 score each) to boost your rating.',
      '3. Attune Ancient Monoliths to lock in checkpoints and safeguard progress.',
      '4. Evade patrol crawlers and avoid sharp environmental hazards.',
      '5. Reach the Quantum Finish Gate to clear the sector and unlock the archive!'
    ].join('\n');

    const body = this.add.text(width / 2, height / 2 - 10, lines, {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      lineSpacing: 5,
      align: 'left'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.rectangle(width / 2, height / 2 + 165, 140, 36, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 165, 'CONFIRM & EXIT [ESC]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      this.dismissActiveModal();
    });

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x0369a1));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x0284c7));

    modal.add([blocker, panel, title, headerLine, body, closeBtn, closeTxt]);
  }

  showSettingsModal() {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }

    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);
    this.activeModal = modal;

    const blocker = this.add.rectangle(0, 0, width, height, 0x020617, 0.85).setOrigin(0).setInteractive();
    const panelW = Math.min(500, width - 36);
    const panelH = 390;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x081324, 0.98);
    panel.setStrokeStyle(1.5, 0x38bdf8, 0.6);

    blocker.on('pointerdown', (pointer) => {
      const bounds = panel.getBounds();
      if (!bounds.contains(pointer.x, pointer.y)) {
        this.dismissActiveModal();
      }
    });

    const title = this.add.text(width / 2, height / 2 - 155, 'SYSTEM CALIBRATION', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: '700',
      color: '#38bdf8',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const headerLine = this.add.rectangle(width / 2, height / 2 - 135, panelW - 40, 1, 0x1e3a5f);

    // Master Audio Toggle
    const masterToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 95,
      'Master Sound Output',
      !audioManager.isMuted,
      () => {
        audioManager.toggleMasterMute();
      }
    );

    // SFX Toggle
    const sfxToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 45,
      'Sound Effects (SFX)',
      !audioManager.isSfxMuted,
      () => {
        audioManager.toggleSfxMute();
      }
    );

    // Music Toggle
    const musicToggle = this.createSettingToggle(
      width / 2,
      height / 2 + 5,
      'Background Music (BGM)',
      !audioManager.isMusicMuted,
      () => {
        audioManager.toggleMusicMute(this, 'bgm-track');
      }
    );

    // Screen Shake Toggle
    const currentSettings = saveManager.getSettings();
    const shakeToggle = this.createSettingToggle(
      width / 2,
      height / 2 + 55,
      'Impact Screen Shake',
      currentSettings.screenShake !== false,
      (state) => {
        saveManager.setSettings({ screenShake: state });
      }
    );

    // Reset Progress Button with styled feedback
    const resetBtn = this.add.rectangle(width / 2 - 75, height / 2 + 115, 170, 32, 0x7f1d1d).setInteractive({ useHandCursor: true });
    resetBtn.setStrokeStyle(1, 0xf87171);
    const resetTxt = this.add.text(width / 2 - 75, height / 2 + 115, 'RESET ARCHIVE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      saveManager.resetProgress();
      resetTxt.setText('DATA WIPED');
      this.time.delayedCall(1200, () => resetTxt.setText('RESET ARCHIVE'));
    });

    // Close Button
    const closeBtn = this.add.rectangle(width / 2 + 105, height / 2 + 115, 140, 32, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2 + 105, height / 2 + 115, 'APPLY & CLOSE [ESC]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      this.dismissActiveModal();
    });

    modal.add([
      blocker, panel, title, headerLine,
      masterToggle, sfxToggle, musicToggle, shakeToggle,
      resetBtn, resetTxt, closeBtn, closeTxt
    ]);
  }

  createSettingToggle(x, y, label, initialValue, onToggle) {
    const container = this.add.container(x, y);

    const txt = this.add.text(-170, 0, label, {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0'
    }).setOrigin(0, 0.5);

    let state = initialValue;
    const btn = this.add.rectangle(135, 0, 70, 26, state ? 0x059669 : 0x334155).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(1, state ? 0x34d399 : 0x64748b);

    const btnTxt = this.add.text(135, 0, state ? 'ENABLED' : 'MUTED', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      state = !state;
      btn.setFillStyle(state ? 0x059669 : 0x334155);
      btn.setStrokeStyle(1, state ? 0x34d399 : 0x64748b);
      btnTxt.setText(state ? 'ENABLED' : 'MUTED');
      onToggle(state);
    });

    container.add([txt, btn, btnTxt]);
    return container;
  }
}
