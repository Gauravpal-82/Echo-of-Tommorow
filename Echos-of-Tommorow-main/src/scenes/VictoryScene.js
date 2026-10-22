import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Rich twilight gold and violet backdrop
    this.add.rectangle(0, 0, width, height, 0x090614).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x3b0764, 0x3b0764, 0x020617, 0x020617, 0.5, 0.5, 0.9, 0.9);
    overlay.fillRect(0, 0, width, height);

    // Subtle celebration fireflies & golden particles
    for (let i = 0; i < 35; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1.5, 3.5),
        Phaser.Math.RND.pick([0xfbbf24, 0x38bdf8, 0xa855f7]),
        Phaser.Math.FloatBetween(0.4, 0.9)
      );

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(60, 140),
        x: p.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Title
    const title = this.add.text(width / 2, height * 0.18, 'ECHOES OF TOMORROW', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: width < 600 ? '24px' : '34px',
      fontStyle: 'bold',
      color: '#f8fafc',
      letterSpacing: 3
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.26, 'JOURNEY COMPLETED', {
      fontFamily: 'Cinzel, Georgia, serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, 'You have deciphered the ancient signals across both realms', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    // Total stats from save manager
    const totalScore = saveManager.getTotalScore();
    const totalFrags = saveManager.getTotalFragments();

    const summaryBox = this.add.container(width / 2, height * 0.49);
    const boxBg = this.add.rectangle(0, 0, 320, 100, 0x140d21, 0.9);
    boxBg.setStrokeStyle(1, 0x9333ea);

    const stats = this.add.text(0, 0, [
      'EXPEDITION SUMMARY',
      `Total Energy Fragments: ${totalFrags}`,
      `Combined Score: ${totalScore}`,
      'Expedition Rating: Master Explorer ★★★'
    ].join('\n'), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#e9d5ff',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);
    summaryBox.add([boxBg, stats]);

    // Team signature
    this.add.text(width / 2, height * 0.63, 'Presented by Team Zeronix', {
      fontFamily: 'Cinzel, serif',
      fontSize: '12px',
      color: '#a855f7'
    }).setOrigin(0.5);

    // Play Again button
    this.createButton(
      width / 2,
      height * 0.72,
      'PLAY AGAIN (LEVEL 1)',
      true,
      () => {
        this.scene.start('GameScene', { levelId: 1 });
      }
    );

    // Main Menu button
    this.createButton(
      width / 2,
      height * 0.82,
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
      0, 0, 240, 36,
      isPrimary ? 0x7e22ce : 0x1e293b
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, isPrimary ? 0xc084fc : 0x475569);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0x9333ea : 0x334155);
      container.setScale(1.03);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0x7e22ce : 0x1e293b);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
