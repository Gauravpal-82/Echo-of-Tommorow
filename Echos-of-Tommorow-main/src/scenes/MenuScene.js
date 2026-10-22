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
    this.cameras.main.fadeIn(320, 4, 9, 20);

    // Atmospheric illustrated backdrop
    if (this.textures.exists('bg-level-1')) {
      const bg = this.add.image(width / 2, height / 2, 'bg-level-1');
      bg.setDisplaySize(width, height);
      bg.setTint(0xa5b4c4);
      this.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 1.04,
        scaleY: bg.scaleY * 1.04,
        duration: 18000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      this.add.rectangle(0, 0, width, height, 0x0f172a).setOrigin(0);
    }

    // Vignette overlay
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 0.75, 0.75, 0.85, 0.85);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);

    // Subtle atmospheric floating dust / ember particles
    this.createAtmosphericEmbers(width, height);

    this.add.text(width / 2, height * 0.105, 'A JOURNEY THROUGH A LOST WORLD', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#67e8f9',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    // Title & Branding
    const title = this.add.text(width / 2, height * 0.22, 'ECHOES OF TOMORROW', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: width < 600 ? '28px' : '40px',
      fontStyle: 'bold',
      color: '#f8fafc',
      stroke: '#0369a1',
      strokeThickness: 2,
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    this.tweens.add({
      targets: title,
      y: title.y - 3,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.29, 'A Hand-Drawn 2D Adventure', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#bae6fd',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(2);

    const panel = this.add.graphics().setDepth(1);
    panel.fillStyle(0x081426, 0.78);
    panel.fillRoundedRect(width / 2 - 220, height * 0.34, 440, height * 0.57, 24);
    panel.lineStyle(1, 0x7dd3fc, 0.22);
    panel.strokeRoundedRect(width / 2 - 220, height * 0.34, 440, height * 0.57, 24);

    this.add.text(width / 2, height * 0.34 + 15, 'Developed by Team Zeronix', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '11px',
      color: '#94a3b8',
      letterSpacing: 0.5
    }).setOrigin(0.5).setDepth(2);

    const buttons = [
      {
        text: 'PLAY ADVENTURE',
        primary: true,
        x: width / 2,
        y: height * 0.48,
        action: () => {
          this.transitionToScene('GameScene', { levelId: 1 });
        }
      },
      {
        text: 'LEVEL SELECTION',
        primary: false,
        x: width / 2,
        y: height * 0.57,
        action: () => {
          this.transitionToScene('LevelSelectScene');
        }
      },
      {
        text: 'HOW TO PLAY',
        primary: false,
        isSecondary: true,
        x: width / 2 - 98,
        y: height * 0.68,
        action: () => {
          this.showHowToPlayModal();
        }
      },
      {
        text: 'SETTINGS',
        primary: false,
        isSecondary: true,
        x: width / 2 + 98,
        y: height * 0.68,
        action: () => {
          this.showSettingsModal();
        }
      },
      {
        text: 'CREDITS',
        primary: false,
        isSecondary: true,
        x: width / 2,
        y: height * 0.77,
        action: () => {
          this.transitionToScene('CreditsScene');
        }
      }
    ];

    buttons.forEach((btn, index) => {
      const button = this.createMenuButton(
        btn.x, btn.y, btn.text, btn.primary, btn.isSecondary, btn.action
      );
      button.setDepth(3).setAlpha(0).setY(btn.y + 14);
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: btn.y,
        duration: 360,
        delay: 140 + index * 65,
        ease: 'Cubic.easeOut'
      });
    });

    // Version label
    this.add.text(width - 16, height - 14, 'v1.0.0 • Hand-Drawn Edition', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#64748b'
    }).setOrigin(1, 1).setDepth(2);
  }

  createMenuButton(x, y, text, isPrimary, isSecondary, onClick) {
    const btnWidth = isSecondary ? 176 : 300;
    const btnHeight = isSecondary ? 36 : 40;
    const container = this.add.container(x, y);

    const normalBg = isPrimary ? 0x0284c7 : 0x142237;
    const hoverBg = isPrimary ? 0x0ea5e9 : 0x203751;
    const strokeCol = isPrimary ? 0x7dd3fc : 0x3b536f;

    const shadow = this.add.rectangle(0, 3, btnWidth, btnHeight, 0x020617, 0.45);
    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, normalBg, isPrimary ? 1 : 0.94);
    bg.setStrokeStyle(isPrimary ? 2 : 1, strokeCol, 0.9);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: isSecondary ? '12px' : '14px',
      fontStyle: 'bold',
      color: isPrimary ? '#ffffff' : '#e2e8f0',
      letterSpacing: isSecondary ? 0.5 : 1
    }).setOrigin(0.5);

    container.add([shadow, bg, label]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverBg, 1);
      bg.setStrokeStyle(1, 0x7dd3fc, 1);
      this.tweens.add({ targets: container, scale: 1.035, duration: 120, ease: 'Cubic.easeOut' });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(normalBg, isPrimary ? 1 : 0.94);
      bg.setStrokeStyle(isPrimary ? 2 : 1, strokeCol, 0.9);
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
    for (let i = 0; i < 25; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        Phaser.Math.FloatBetween(1, 2.5),
        0x38bdf8,
        Phaser.Math.FloatBetween(0.2, 0.7)
      );

      this.tweens.add({
        targets: ember,
        y: ember.y - Phaser.Math.Between(40, 100),
        x: ember.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  showHowToPlayModal() {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(520, width - 40), 380, 0x0f172a);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 145, 'HOW TO PLAY', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    const instructions = [
      '• DESKTOP: A / D or Left / Right Arrows to Move',
      '• JUMP: Spacebar, W, or Up Arrow (Single Grounded Jump)',
      '• MOBILE: On-screen responsive Left / Right / Jump buttons',
      '• PAUSE / RESUME: Esc or P key',
      '• RESTART LEVEL: R key',
      '',
      'OBJECTIVES:',
      '1. Cross treacherous terrain without falling into deep chasms.',
      '2. Collect glowing Energy Fragments (+100 score each).',
      '3. Attune Ancient Checkpoints to safeguard your progress.',
      '4. Evade patrol crawlers and sharp brambles.',
      '5. Reach the mysterious Finish Gate to complete the level!'
    ].join('\n');

    const body = this.add.text(width / 2, height / 2 - 15, instructions, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
      lineSpacing: 5,
      align: 'left'
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.rectangle(width / 2, height / 2 + 145, 120, 34, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 145, 'GOT IT', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      modal.destroy();
    });

    modal.add([blocker, panel, title, body, closeBtn, closeTxt]);
  }

  showSettingsModal() {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(0, 0).setDepth(200);

    const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, Math.min(480, width - 40), 360, 0x0f172a);
    panel.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 135, 'SETTINGS', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5);

    // Master Sound Toggle
    const soundToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 70,
      'Master Audio',
      !audioManager.isMuted,
      (newVal) => {
        audioManager.toggleMasterMute();
      }
    );

    // SFX Toggle
    const sfxToggle = this.createSettingToggle(
      width / 2,
      height / 2 - 20,
      'Sound Effects',
      !audioManager.isSfxMuted,
      (newVal) => {
        audioManager.toggleSfxMute();
      }
    );

    // Reset Progress Button with Confirmation
    const resetBtn = this.add.rectangle(width / 2, height / 2 + 45, 260, 36, 0x991b1b).setInteractive({ useHandCursor: true });
    resetBtn.setStrokeStyle(1, 0xf87171);
    const resetTxt = this.add.text(width / 2, height / 2 + 45, 'RESET PROGRESS', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      if (confirm('Are you sure you want to reset all game progression and high scores?')) {
        saveManager.resetProgress();
        resetTxt.setText('PROGRESS CLEARED!');
        this.time.delayedCall(1200, () => resetTxt.setText('RESET PROGRESS'));
      }
    });

    // Close Button
    const closeBtn = this.add.rectangle(width / 2, height / 2 + 130, 120, 34, 0x0284c7).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1, 0x38bdf8);
    const closeTxt = this.add.text(width / 2, height / 2 + 130, 'CLOSE', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      modal.destroy();
    });

    modal.add([blocker, panel, title, soundToggle, sfxToggle, resetBtn, resetTxt, closeBtn, closeTxt]);
  }

  createSettingToggle(x, y, label, initialValue, onToggle) {
    const container = this.add.container(x, y);

    const txt = this.add.text(-120, 0, label, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0'
    }).setOrigin(0, 0.5);

    let state = initialValue;
    const btn = this.add.rectangle(110, 0, 75, 28, state ? 0x059669 : 0x475569).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(1, state ? 0x34d399 : 0x94a3b8);

    const btnTxt = this.add.text(110, 0, state ? 'ON' : 'OFF', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      state = !state;
      btn.setFillStyle(state ? 0x059669 : 0x475569);
      btn.setStrokeStyle(1, state ? 0x34d399 : 0x94a3b8);
      btnTxt.setText(state ? 'ON' : 'OFF');
      onToggle(state);
    });

    container.add([txt, btn, btnTxt]);
    return container;
  }

}
