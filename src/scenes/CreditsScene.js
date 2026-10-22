import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x050811).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x0a1424, 0x0a1424, 0x020612, 0x020612, 0.75, 0.75, 0.96, 0.96);
    overlay.fillRect(0, 0, width, height);

    // Decorative Glass Panel
    const boxW = Math.min(540, width - 36);
    const boxH = Math.min(480, height - 50);
    const box = this.add.rectangle(width / 2, height / 2, boxW, boxH, 0x081324, 0.94);
    box.setStrokeStyle(1.5, 0x38bdf8, 0.45);

    // Header Kicker
    this.add.text(width / 2, height / 2 - boxH / 2 + 32, 'CREATIVE & TECHNICAL ARCHITECTURE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Title
    this.add.text(width / 2, height / 2 - boxH / 2 + 58, 'ECHOES OF TOMORROW', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '26px',
      fontStyle: '800',
      color: '#f8fafc',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - boxH / 2 + 88, 'A 2D Atmospheric Platformer', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    const headerLine = this.add.rectangle(width / 2, height / 2 - boxH / 2 + 108, boxW - 60, 1, 0x1e3a5f);

    // Team Section
    const teamBox = this.add.container(width / 2, height / 2 + 20);

    const teamHeader = this.add.text(0, -78, 'DEVELOPED BY TEAM ZERONIX', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: '700',
      color: '#fbbf24',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    // Team Lead Card
    const leadBg = this.add.rectangle(0, -28, 320, 52, 0x0c1e36, 0.9);
    leadBg.setStrokeStyle(1.5, 0x38bdf8, 0.7);

    const leadBadge = this.add.text(0, -42, 'TEAM LEAD & CREATIVE ARCHITECT', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 1.2
    }).setOrigin(0.5);

    const leadName = this.add.text(0, -22, 'Gaurav Pal', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '19px',
      fontStyle: '700',
      color: '#ffffff',
      letterSpacing: 0.5
    }).setOrigin(0.5);

    // Core Members
    const membersBadge = this.add.text(0, 24, 'CORE TEAM MEMBERS', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      color: '#94a3b8',
      letterSpacing: 1.2
    }).setOrigin(0.5);

    const m1Bg = this.add.rectangle(-105, 64, 180, 42, 0x0f1b2c, 0.85);
    m1Bg.setStrokeStyle(1, 0x223a59);
    const m1Name = this.add.text(-105, 64, 'Veer Pratap', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontStyle: '600',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    const m2Bg = this.add.rectangle(105, 64, 180, 42, 0x0f1b2c, 0.85);
    m2Bg.setStrokeStyle(1, 0x223a59);
    const m2Name = this.add.text(105, 64, 'Akhand Pratap', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      fontStyle: '600',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    teamBox.add([
      teamHeader,
      leadBg, leadBadge, leadName,
      membersBadge,
      m1Bg, m1Name,
      m2Bg, m2Name
    ]);

    // Back Button
    const backBtn = this.add.container(width / 2, height / 2 + boxH / 2 - 38);
    const backBg = this.add.rectangle(0, 0, 160, 36, 0x0284c7).setInteractive({ useHandCursor: true });
    backBg.setStrokeStyle(1, 0x38bdf8);
    const backTxt = this.add.text(0, 0, '◀ RETURN TO MENU', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x0369a1);
      backBtn.setScale(1.025);
    });
    backBg.on('pointerout', () => {
      backBg.setFillStyle(0x0284c7);
      backBtn.setScale(1.0);
    });
    backBg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.scene.start('MenuScene');
    });

    backBtn.add([backBg, backTxt]);

    const returnToMenu = () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.scene.start('MenuScene');
    };

    this.input.keyboard?.on('keydown-ESC', returnToMenu);

    const windowEscHandler = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('CreditsScene')) {
        e.preventDefault();
        returnToMenu();
      }
    };
    window.addEventListener('keydown', windowEscHandler);

    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', windowEscHandler);
    });
  }
}
