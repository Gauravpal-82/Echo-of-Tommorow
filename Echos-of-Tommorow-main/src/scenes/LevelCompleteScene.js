import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.score = data.score || 0;
    this.fragments = data.fragments || 0;
    this.totalFragments = data.totalFragments || 9;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric emerald backdrop
    this.add.rectangle(0, 0, width, height, 0x061114).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x064e3b, 0x064e3b, 0x020617, 0x020617, 0.45, 0.45, 0.9, 0.9);
    overlay.fillRect(0, 0, width, height);

    // Celebration burst
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(
        width / 2 + Phaser.Math.Between(-150, 150),
        height * 0.25 + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(2, 4),
        0x34d399,
        0.8
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 80),
        alpha: 0,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1
      });
    }

    // Title
    this.add.text(width / 2, height * 0.22, 'SECTOR CLEARED!', {
      fontFamily: 'Cinzel, serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#34d399',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.30, `Level 0${this.levelId}: The Lost Wilderness`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Summary Box
    const box = this.add.container(width / 2, height * 0.46);
    const boxBg = this.add.rectangle(0, 0, 300, 90, 0x0f1f1a, 0.9);
    boxBg.setStrokeStyle(1, 0x059669);

    const stats = this.add.text(0, 0, [
      `Fragments Attuned: ${this.fragments} / ${this.totalFragments}`,
      `Level Score: ${this.score}`,
      'Sector 02: Broken Frontier Unlocked!'
    ].join('\n'), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#a7f3d0',
      align: 'center',
      lineSpacing: 5
    }).setOrigin(0.5);
    box.add([boxBg, stats]);

    // Buttons: Continue to Level 2, Replay Level 1, Main Menu
    const continueBtn = this.createButton(
      width / 2,
      height * 0.63,
      'CONTINUE TO LEVEL 2',
      true,
      () => {
        this.scene.start('GameScene', { levelId: 2 });
      }
    );

    const replayBtn = this.createButton(
      width / 2,
      height * 0.73,
      'REPLAY LEVEL 1',
      false,
      () => {
        this.scene.start('GameScene', { levelId: 1 });
      }
    );

    const menuBtn = this.createButton(
      width / 2,
      height * 0.83,
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
      isPrimary ? 0x059669 : 0x1e293b
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, isPrimary ? 0x34d399 : 0x475569);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0x10b981 : 0x334155);
      container.setScale(1.03);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0x059669 : 0x1e293b);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
