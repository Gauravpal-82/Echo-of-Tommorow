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
    this.timeSeconds = data.timeSeconds || 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Deep emerald aura backdrop
    this.add.rectangle(0, 0, width, height, 0x040e0c).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x064e3b, 0x064e3b, 0x030910, 0x030910, 0.45, 0.45, 0.95, 0.95);
    overlay.fillRect(0, 0, width, height);

    // Floating celebration motes
    for (let i = 0; i < 28; i++) {
      const p = this.add.circle(
        width / 2 + Phaser.Math.Between(-220, 220),
        height * 0.28 + Phaser.Math.Between(-60, 60),
        Phaser.Math.Between(2, 4),
        Phaser.Math.RND.pick([0x34d399, 0x38bdf8, 0xfbbf24]),
        0.8
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(50, 110),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 2600),
        yoyo: true,
        repeat: -1
      });
    }

    // Rank evaluation
    let rank = 'B-RANK';
    let rankColor = '#60a5fa';
    let rankSub = 'Standard Explorer Clear';
    if (this.fragments >= this.totalFragments) {
      rank = 'S-RANK ★★★';
      rankColor = '#fbbf24';
      rankSub = 'Flawless Fragment Attunement';
    } else if (this.fragments >= Math.floor(this.totalFragments * 0.7)) {
      rank = 'A-RANK ★★';
      rankColor = '#34d399';
      rankSub = 'High-Proficiency Recon';
    }

    // Header Kicker
    this.add.text(width / 2, height * 0.12, 'EXPEDITION RECONNAISSANCE COMPLETE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#34d399',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Title
    this.add.text(width / 2, height * 0.19, 'SECTOR CLEARED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '36px',
      fontStyle: '800',
      color: '#ffffff',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Rank Medal Banner
    const rankText = this.add.text(width / 2, height * 0.27, rank, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '24px',
      fontStyle: '800',
      color: rankColor,
      letterSpacing: 1.5
    }).setOrigin(0.5);

    this.tweens.add({
      targets: rankText,
      scale: 1.08,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.32, rankSub, {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Debriefing Box
    const boxW = Math.min(380, width - 40);
    const boxH = 100;
    const boxY = height * 0.48;

    const boxBg = this.add.rectangle(width / 2, boxY, boxW, boxH, 0x051a15, 0.95);
    boxBg.setStrokeStyle(1.5, 0x059669, 0.7);

    const m = Math.floor(this.timeSeconds / 60);
    const s = Math.floor(this.timeSeconds % 60);
    const ms = Math.floor((this.timeSeconds % 1) * 10);
    const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;

    const stats = this.add.text(width / 2, boxY, [
      `Fragments Attuned: ${this.fragments} / ${this.totalFragments}`,
      `Clear Time: ${timeFormatted}    ·    Sector Score: ${this.score} PTS`,
      '✦ Sector 02: The Broken Frontier Unlocked'
    ].join('\n'), {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#a7f3d0',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Buttons
    this.createButton(
      width / 2,
      height * 0.65,
      'PROCEED TO SECTOR 02',
      true,
      () => {
        this.scene.start('GameScene', { levelId: 2 });
      }
    );

    this.createButton(
      width / 2,
      height * 0.74,
      'RETRY FOR S-RANK',
      false,
      () => {
        this.scene.start('GameScene', { levelId: 1 });
      }
    );

    this.createButton(
      width / 2,
      height * 0.83,
      'EXPEDITION ARCHIVE [ESC]',
      false,
      () => {
        this.scene.start('LevelSelectScene');
      }
    );

    const returnToArchive = () => {
      this.scene.start('LevelSelectScene');
    };
    this.input.keyboard?.on('keydown-ESC', returnToArchive);
    const windowCompleteEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('LevelCompleteScene')) {
        e.preventDefault();
        returnToArchive();
      }
    };
    window.addEventListener('keydown', windowCompleteEsc);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', windowCompleteEsc);
    });
  }

  createButton(x, y, text, isPrimary, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(
      0, 0, 260, 38,
      isPrimary ? 0x059669 : 0x0a1c17,
      0.95
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1.5, isPrimary ? 0x34d399 : 0x1f4e3f);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0x10b981 : 0x123026);
      container.setScale(1.025);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0x059669 : 0x0a1c17);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
