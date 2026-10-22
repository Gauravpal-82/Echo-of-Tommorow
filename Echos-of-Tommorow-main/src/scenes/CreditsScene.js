import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(0, 0, width, height, 0x07090e).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x0c1322, 0x0c1322, 0x020617, 0x020617, 0.7, 0.7, 0.95, 0.95);
    overlay.fillRect(0, 0, width, height);

    // Decorative border box
    const boxW = Math.min(520, width - 40);
    const boxH = Math.min(480, height - 60);
    const box = this.add.rectangle(width / 2, height / 2, boxW, boxH, 0x0b1120, 0.9);
    box.setStrokeStyle(2, 0x38bdf8);

    // Header
    this.add.text(width / 2, height / 2 - boxH / 2 + 40, 'ECHOES OF TOMORROW', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - boxH / 2 + 75, 'A Hand-Drawn 2D Adventure Platformer', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Development Team Section
    const teamBox = this.add.container(width / 2, height / 2 - 10);

    const teamHeader = this.add.text(0, -90, 'TEAM ZERONIX', {
      fontFamily: 'Cinzel, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Team Lead (Distinguished badge & styling)
    const leadBg = this.add.rectangle(0, -40, 280, 48, 0x1e293b, 0.8);
    leadBg.setStrokeStyle(1, 0x38bdf8);

    const leadBadge = this.add.text(0, -52, 'TEAM LEAD & CREATIVE ARCHITECT', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 1.5
    }).setOrigin(0.5);

    const leadName = this.add.text(0, -34, 'Gaurav Pal', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Team Members
    const membersBadge = this.add.text(0, 16, 'CORE TEAM MEMBERS', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#94a3b8',
      letterSpacing: 1.2
    }).setOrigin(0.5);

    const m1Bg = this.add.rectangle(-100, 56, 170, 36, 0x161f30, 0.7);
    m1Bg.setStrokeStyle(1, 0x334155);
    const m1Name = this.add.text(-100, 56, 'Veer Pratap', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#e2e8f0'
    }).setOrigin(0.5);

    const m2Bg = this.add.rectangle(100, 56, 170, 36, 0x161f30, 0.7);
    m2Bg.setStrokeStyle(1, 0x334155);
    const m2Name = this.add.text(100, 56, 'Akhand Pratap', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
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
    const backBtn = this.add.container(width / 2, height / 2 + boxH / 2 - 42);
    const backBg = this.add.rectangle(0, 0, 150, 34, 0x0284c7).setInteractive({ useHandCursor: true });
    backBg.setStrokeStyle(1, 0x38bdf8);
    const backTxt = this.add.text(0, 0, '◀ BACK TO MENU', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x0ea5e9);
      backBtn.setScale(1.03);
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
  }
}
