import Phaser from 'phaser';
import { saveManager } from '../systems/SaveManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { LEVELS } from '../config/levels.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const { width, height } = this.cameras.main;
    this.isTransitioning = false;
    this.cameras.main.fadeIn(320, 4, 9, 20);

    // Keep background music running smoothly
    audioManager.playMusic(this, 'bgm-track');

    if (this.textures.exists('bg-level-1')) {
      const bg = this.add.image(width / 2, height / 2, 'bg-level-1')
        .setDisplaySize(width, height)
        .setTint(0x64748b);
      this.tweens.add({
        targets: bg,
        scaleX: bg.scaleX * 1.04,
        scaleY: bg.scaleY * 1.04,
        duration: 22000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      this.add.rectangle(0, 0, width, height, 0x050811).setOrigin(0);
    }

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x020612, 0x020612, 0x071120, 0x071120, 0.82, 0.82, 0.92, 0.92);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);

    // Kicker
    this.add.text(width / 2, height * 0.12, 'EXPEDITION ARCHIVE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    // Title
    this.add.text(width / 2, height * 0.18, 'SELECT DESTINATION', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '32px',
      fontStyle: '800',
      color: '#f8fafc',
      letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    this.add.text(width / 2, height * 0.24, 'Deploy into explored biomes or conquer unexplored frontiers', {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5).setDepth(2);

    // Cards layout (Two levels)
    const cardWidth = Math.min(290, (width - 60) / 2);
    const cardHeight = 260;
    const cardY = height * 0.54;

    const spacing = cardWidth + 30;
    const startX = width / 2 - spacing / 2;

    [1, 2].forEach((lvlId, index) => {
      const cardX = startX + index * spacing;
      const card = this.createLevelCard(cardX, cardY, cardWidth, cardHeight, lvlId);
      card.setDepth(2).setAlpha(0).setY(cardY + 18);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: cardY,
        duration: 380,
        delay: 100 + index * 100,
        ease: 'Cubic.easeOut'
      });
    });

    // Back Button
    const backBtn = this.add.container(width / 2, height * 0.89);
    const backBg = this.add.rectangle(0, 0, 160, 36, 0x0a1628, 0.9).setInteractive({ useHandCursor: true });
    backBg.setStrokeStyle(1, 0x38bdf8, 0.6);
    const backTxt = this.add.text(0, 0, '◀ MAIN MENU', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#e2e8f0',
      letterSpacing: 1
    }).setOrigin(0.5);

    backBg.on('pointerover', () => {
      backBg.setFillStyle(0x132742);
      backBtn.setScale(1.03);
    });
    backBg.on('pointerout', () => {
      backBg.setFillStyle(0x0a1628);
      backBtn.setScale(1.0);
    });
    backBg.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.transitionToScene('MenuScene');
    });

    backBtn.add([backBg, backTxt]);
    backBtn.setDepth(2);

    // ESC key shortcuts to return to Menu
    const returnToMenu = () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.transitionToScene('MenuScene');
    };

    this.input.keyboard?.on('keydown-ESC', returnToMenu);

    this.windowEscHandler = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && this.scene && this.scene.isActive('LevelSelectScene')) {
        e.preventDefault();
        returnToMenu();
      }
    };
    window.addEventListener('keydown', this.windowEscHandler);

    this.events.once('shutdown', () => {
      if (this.windowEscHandler) {
        window.removeEventListener('keydown', this.windowEscHandler);
      }
    });
  }

  createLevelCard(x, y, w, h, levelId) {
    const config = LEVELS[levelId];
    const isUnlocked = saveManager.isLevelUnlocked(levelId);
    const isCompleted = saveManager.isLevelCompleted(levelId);
    const highScore = saveManager.getHighScore(levelId);
    const bestFrags = saveManager.getBestFragments(levelId);
    const bestTime = saveManager.getBestTime(levelId);

    const card = this.add.container(x, y);

    // Card background
    const bgCol = isUnlocked ? 0x071324 : 0x050911;
    const borderCol = isCompleted ? 0x10b981 : (isUnlocked ? 0x38bdf8 : 0x1e293b);
    const cardBg = this.add.rectangle(0, 0, w, h, bgCol, 0.95);
    cardBg.setStrokeStyle(1.5, borderCol, isUnlocked ? 0.85 : 0.4);

    // Accent line top
    const topAccent = this.add.rectangle(0, -h / 2 + 1, w - 2, 3, isCompleted ? 0x34d399 : (isUnlocked ? 0x38bdf8 : 0x334155), 0.9);

    // Status Pill
    const badgeText = isCompleted ? '✦ CLEARED' : (isUnlocked ? 'READY FOR DEPLOYMENT' : 'LOCKED');
    const badgeColor = isCompleted ? '#34d399' : (isUnlocked ? '#38bdf8' : '#64748b');
    const badge = this.add.text(0, -h / 2 + 22, badgeText, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: badgeColor,
      letterSpacing: 1.2
    }).setOrigin(0.5);

    // Level Designation & Name
    const lvlNum = this.add.text(0, -h / 2 + 48, `SECTOR 0${levelId}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#94a3b8',
      letterSpacing: 1
    }).setOrigin(0.5);

    const title = this.add.text(0, -h / 2 + 76, config.title, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '17px',
      fontStyle: '700',
      color: isUnlocked ? '#f8fafc' : '#475569',
      align: 'center',
      wordWrap: { width: w - 24 }
    }).setOrigin(0.5);

    // Metrics / Locked status
    let infoText;
    if (isUnlocked) {
      const timeStr = bestTime ? `${bestTime.toFixed(1)}s` : '--';
      infoText = this.add.text(0, 24, [
        `Record: ${highScore} PTS`,
        `Attuned: ${bestFrags}/${config.collectibles.length} Fragments`,
        `Best Run: ${timeStr}`
      ].join('\n'), {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#94a3b8',
        align: 'center',
        lineSpacing: 6
      }).setOrigin(0.5);
    } else {
      infoText = this.add.text(0, 24, 'Clear Sector 01 to unlock\nthis frontier biome', {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '12px',
        color: '#475569',
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5);
    }

    // Action button
    const actionBtn = this.add.container(0, h / 2 - 32);
    const btnBg = this.add.rectangle(
      0, 0, w - 44, 34,
      isUnlocked ? 0x0284c7 : 0x0c1524
    );
    btnBg.setStrokeStyle(1, isUnlocked ? 0x38bdf8 : 0x1e293b);

    const btnTxt = this.add.text(0, 0, isUnlocked ? 'LAUNCH MISSION' : '🔒 LOCKED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: isUnlocked ? '#ffffff' : '#475569',
      letterSpacing: 1
    }).setOrigin(0.5);

    actionBtn.add([btnBg, btnTxt]);

    if (isUnlocked) {
      cardBg.setInteractive({ useHandCursor: true });
      btnBg.setInteractive({ useHandCursor: true });

      const onEnter = () => {
        if (this.isTransitioning) return;
        audioManager.playSfx(this, 'sfx-button-click');
        this.transitionToScene('GameScene', { levelId });
      };

      cardBg.on('pointerover', () => {
        this.tweens.add({ targets: card, scale: 1.025, duration: 120, ease: 'Cubic.easeOut' });
        cardBg.setStrokeStyle(2, 0x67e8f9);
      });
      cardBg.on('pointerout', () => {
        this.tweens.add({ targets: card, scale: 1, duration: 150, ease: 'Cubic.easeOut' });
        cardBg.setStrokeStyle(1.5, borderCol);
      });
      cardBg.on('pointerdown', onEnter);
      btnBg.on('pointerdown', onEnter);
    }

    card.add([cardBg, topAccent, badge, lvlNum, title, infoText, actionBtn]);
    return card;
  }

  transitionToScene(sceneKey, data) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(260, 4, 9, 20);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(sceneKey, data);
    });
  }
}
