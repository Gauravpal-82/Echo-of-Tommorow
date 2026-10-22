import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric deep violet/cosmic backdrop
    this.add.rectangle(0, 0, width, height, 0x05030d).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x3b0764, 0x3b0764, 0x040612, 0x040612, 0.55, 0.55, 0.95, 0.95);
    overlay.fillRect(0, 0, width, height);

    // Cosmic celebration particles
    for (let i = 0; i < 40; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1.5, 3.5),
        Phaser.Math.RND.pick([0xfbbf24, 0x38bdf8, 0xa855f7, 0x34d399]),
        Phaser.Math.FloatBetween(0.4, 0.9)
      );

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(60, 150),
        x: p.x + Phaser.Math.Between(-35, 35),
        alpha: 0,
        duration: Phaser.Math.Between(2200, 5200),
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }

    // Header Kicker
    this.add.text(width / 2, height * 0.12, 'EXPEDITION CHRONICLES COMPLETE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#c084fc',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Title
    const title = this.add.text(width / 2, height * 0.19, 'ECHOES OF TOMORROW', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: width < 600 ? '26px' : '36px',
      fontStyle: '800',
      color: '#f8fafc',
      letterSpacing: 2
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.26, 'ALL SECTORS DECIPHERED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: '700',
      color: '#fbbf24',
      letterSpacing: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.32, 'You have traversed all biomes and attuned every ancient frequency', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    // Stats Dossier
    const totalScore = saveManager.getTotalScore();
    const totalFrags = saveManager.getTotalFragments();

    const boxW = Math.min(420, width - 40);
    const boxH = 100;
    const boxY = height * 0.48;

    const boxBg = this.add.rectangle(width / 2, boxY, boxW, boxH, 0x120824, 0.95);
    boxBg.setStrokeStyle(1.5, 0x9333ea, 0.8);

    const stats = this.add.text(width / 2, boxY, [
      `Combined Expedition Score: ${totalScore} PTS`,
      `Total Energy Fragments Recovered: ${totalFrags} / 18`,
      'Honorary Rank: Master Chrononaut ★★★'
    ].join('\n'), {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#f3e8ff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Signature
    this.add.text(width / 2, height * 0.62, 'Designed & Engineered with pride by Team Zeronix', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '12px',
      color: '#c084fc'
    }).setOrigin(0.5);

    // Actions
    this.createButton(
      width / 2,
      height * 0.71,
      'REPLAY EXPEDITION (LEVEL 1)',
      true,
      () => {
        this.scene.start('GameScene', { levelId: 1 });
      }
    );

    this.createButton(
      width / 2,
      height * 0.80,
      'EXPEDITION ARCHIVE',
      false,
      () => {
        this.scene.start('LevelSelectScene');
      }
    );

    const returnToMenu = () => {
      this.scene.start('MenuScene');
    };

    this.createButton(
      width / 2,
      height * 0.89,
      'MAIN MENU [ESC]',
      false,
      returnToMenu
    );

    this.input.keyboard?.on('keydown-ESC', returnToMenu);
    const windowVictoryEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('VictoryScene')) {
        e.preventDefault();
        returnToMenu();
      }
    };
    window.addEventListener('keydown', windowVictoryEsc);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', windowVictoryEsc);
    });
  }

  createButton(x, y, text, isPrimary, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(
      0, 0, 260, 36,
      isPrimary ? 0x7e22ce : 0x0c0f1d,
      0.95
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1.5, isPrimary ? 0xc084fc : 0x334155);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0x9333ea : 0x161c33);
      container.setScale(1.025);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0x7e22ce : 0x0c0f1d);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
