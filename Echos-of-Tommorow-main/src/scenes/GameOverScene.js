import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.score = data.score || 0;
    this.fragments = data.fragments || 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Dark crimson moody backdrop
    this.add.rectangle(0, 0, width, height, 0x0a0507).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x450a0a, 0x450a0a, 0x020617, 0x020617, 0.4, 0.4, 0.9, 0.9);
    overlay.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, height * 0.28, 'SIGNAL LOST', {
      fontFamily: 'Cinzel, serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ef4444',
      letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.37, 'The expedition encountered fatal interference', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Stats Box
    const box = this.add.container(width / 2, height * 0.52);
    const boxBg = this.add.rectangle(0, 0, 260, 70, 0x1e1014, 0.8);
    boxBg.setStrokeStyle(1, 0x7f1d1d);

    const stats = this.add.text(0, 0, [
      `Fragments Collected: ${this.fragments}`,
      `Current Run Score: ${this.score}`
    ].join('\n'), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#fca5a5',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    box.add([boxBg, stats]);

    // Retry Button
    const retryBtn = this.createButton(
      width / 2,
      height * 0.68,
      'RETRY LEVEL',
      true,
      () => {
        this.scene.start('GameScene', { levelId: this.levelId });
      }
    );

    // Main Menu Button
    const menuBtn = this.createButton(
      width / 2,
      height * 0.78,
      'MAIN MENU',
      false,
      () => {
        this.scene.start('MenuScene');
      }
    );
  }

  createButton(x, y, text, isPrimary, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(
      0, 0, 220, 38,
      isPrimary ? 0xdc2626 : 0x1e293b
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, isPrimary ? 0xf87171 : 0x475569);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0xef4444 : 0x334155);
      container.setScale(1.03);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0xdc2626 : 0x1e293b);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
