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
    this.timeSeconds = data.timeSeconds || 0;
    this.hasCheckpoint = !!data.hasCheckpoint;
    this.collectedIds = data.collectedIds || [];
  }

  create() {
    const { width, height } = this.cameras.main;

    // Atmospheric deep crimson/obsidian backdrop
    this.add.rectangle(0, 0, width, height, 0x070509).setOrigin(0);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x3f0713, 0x3f0713, 0x05070e, 0x05070e, 0.55, 0.55, 0.95, 0.95);
    overlay.fillRect(0, 0, width, height);

    // Kicker
    this.add.text(width / 2, height * 0.16, 'SECTOR EXPEDITION INTERRUPTED', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#f87171',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Title
    const title = this.add.text(width / 2, height * 0.24, 'SIGNAL LOST', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '40px',
      fontStyle: '800',
      color: '#f87171',
      letterSpacing: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: 0.85,
      scale: 1.02,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.32, 'The explorer succumbed to hostile planetary forces', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Stats Dossier Box
    const boxW = Math.min(380, width - 40);
    const boxH = 96;
    const boxY = height * 0.48;

    const boxBg = this.add.rectangle(width / 2, boxY, boxW, boxH, 0x12080f, 0.92);
    boxBg.setStrokeStyle(1.5, 0x991b1b, 0.8);

    const m = Math.floor(this.timeSeconds / 60);
    const s = Math.floor(this.timeSeconds % 60);
    const timeFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    this.add.text(width / 2, boxY, [
      `Fragments Attuned: ${this.fragments}    ·    Run Score: ${this.score}`,
      `Mission Duration: ${timeFormatted}    ·    Sector: 0${this.levelId}`,
      this.hasCheckpoint ? '✦ Ancient Checkpoint Frequency Locked' : 'No Checkpoint Attuned'
    ].join('\n'), {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#fecaca',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Button actions
    let btnY = height * 0.64;
    const spacing = 46;

    const respawnCheckpointAction = () => {
      this.scene.start('GameScene', {
        levelId: this.levelId,
        fromCheckpoint: true,
        score: this.score,
        fragments: this.fragments,
        timeSeconds: this.timeSeconds,
        collectedIds: this.collectedIds
      });
    };

    const restartSectorAction = () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    };

    if (this.hasCheckpoint) {
      this.createButton(
        width / 2,
        btnY,
        'RESPAWN AT CHECKPOINT [C]',
        true,
        respawnCheckpointAction
      );
      btnY += spacing;

      this.input.keyboard?.on('keydown-C', respawnCheckpointAction);
      this.input.keyboard?.on('keydown-SPACE', respawnCheckpointAction);
      this.input.keyboard?.on('keydown-ENTER', respawnCheckpointAction);
    } else {
      this.input.keyboard?.on('keydown-SPACE', restartSectorAction);
      this.input.keyboard?.on('keydown-ENTER', restartSectorAction);
    }

    this.createButton(
      width / 2,
      btnY,
      'RESTART SECTOR [R]',
      !this.hasCheckpoint,
      restartSectorAction
    );
    btnY += spacing;

    const returnToBaseAction = () => {
      this.scene.start('MenuScene');
    };

    this.createButton(
      width / 2,
      btnY,
      'RETURN TO BASE [ESC]',
      false,
      returnToBaseAction
    );

    // Quick retry keyboard shortcut
    this.input.keyboard?.on('keydown-R', restartSectorAction);
    this.input.keyboard?.on('keydown-ESC', returnToBaseAction);

    const windowGameOverEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('GameOverScene')) {
        e.preventDefault();
        returnToBaseAction();
      }
    };
    window.addEventListener('keydown', windowGameOverEsc);
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', windowGameOverEsc);
    });
  }

  createButton(x, y, text, isPrimary, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(
      0, 0, 260, 38,
      isPrimary ? 0x0284c7 : 0x17121b,
      0.95
    ).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1.5, isPrimary ? 0x38bdf8 : 0x475569);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: '600',
      color: '#ffffff',
      letterSpacing: 1
    }).setOrigin(0.5);

    container.add([bg, label]);

    bg.on('pointerover', () => {
      bg.setFillStyle(isPrimary ? 0x0369a1 : 0x241d2d);
      container.setScale(1.025);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(isPrimary ? 0x0284c7 : 0x17121b);
      container.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      onClick();
    });

    return container;
  }
}
