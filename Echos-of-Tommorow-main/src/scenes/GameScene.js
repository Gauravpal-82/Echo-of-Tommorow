import Phaser from 'phaser';
import { LEVELS } from '../config/levels.js';
import { PlayerController } from '../systems/PlayerController.js';
import { InputManager } from '../systems/InputManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data = {}) {
    const requestedLevel = Number(data.levelId);
    this.levelId = LEVELS[requestedLevel] ? requestedLevel : 1;
    this.levelConfig = LEVELS[this.levelId];
    this.score = 0;
    this.fragmentsCollected = 0;
    this.isPaused = false;
    this.levelFinished = false;
    this.collectedIds = new Set();
    this.isCheckpointActive = false;
  }

  create() {
    const config = this.levelConfig;

    // Set world physics bounds
    this.physics.world.setBounds(0, 0, config.worldWidth, config.worldHeight + 160);
    this.cameras.main.setBounds(0, 0, config.worldWidth, config.worldHeight);

    // 1. Layered Parallax Backgrounds
    this.createBackgrounds(config);

    // 2. Non-solid foreground scenery
    this.createDecorations(config);
    this.createAmbientMotes(config);

    // 3. Static Platforms & Ground
    this.createPlatforms(config);

    // 4. Checkpoint
    this.createCheckpoint(config);

    // 5. Finish Goal Gate
    this.createFinishGate(config);

    // 6. Hazards
    this.createHazards(config);

    // 7. Collectibles
    this.createCollectibles(config);

    // 8. Enemies
    this.createEnemies(config);

    // 9. Player Controller
    this.player = new PlayerController(this, config.playerStart.x, config.playerStart.y);

    // 10. Platform Collisions
    this.physics.add.collider(this.player.sprite, this.platformsGroup);
    this.physics.add.collider(this.enemiesGroup, this.platformsGroup);

    // 11. Overlaps
    this.physics.add.overlap(this.player.sprite, this.collectiblesGroup, this.onCollectFragment, null, this);
    this.physics.add.overlap(this.player.sprite, this.hazardsGroup, this.onHitHazard, null, this);
    this.physics.add.overlap(this.player.sprite, this.enemiesGroup, this.onHitEnemy, null, this);
    this.physics.add.overlap(this.player.sprite, this.checkpointSprite, this.onReachCheckpoint, null, this);
    this.physics.add.overlap(this.player.sprite, this.finishGateSprite, this.onReachFinishGate, null, this);

    // 12. Camera Setup
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.1);
    this.cameras.main.setDeadzone(100, 50);

    // 13. Input Manager (Unified keyboard and touch)
    this.inputManager = new InputManager(this);

    // 14. HUD (Pinned to screen)
    this.createHUD();

    // 15. Level 1 Tutorial markers
    if (config.tutorial) {
      this.createTutorialMarkers(config.tutorial);
    }

    // 16. Start Background Audio
    audioManager.playMusic(this, config.musicKey);

    // Pause overlay container
    this.createPauseMenu();

    // Listen for resize
    this.scale.on('resize', this.onResize, this);
  }

  createBackgrounds(config) {
    const { width, height } = this.scale;

    const bgKey = config.bgKey;
    const bg = this.add.image(0, 0, bgKey);
    bg.setOrigin(0, 0);
    bg.setScrollFactor(0.12, 0.03);
    bg.setDepth(-10);
    this.resizeBackground(bg, width, height, config);
    this.bgLayer = bg;

    // Atmospheric sky color gradient tint (soft, preserving art clarity)
    const skyTint = this.add.graphics();
    skyTint.fillGradientStyle(config.bgColor, config.bgColor, 0x050811, 0x050811, 0.15, 0.15, 0.4, 0.4);
    skyTint.fillRect(0, 0, width, height);
    skyTint.setScrollFactor(0);
    skyTint.setDepth(-9);
    this.skyTint = skyTint;
  }

  createDecorations(config) {
    this.decorationsGroup = this.add.group();
    if (!config.decorations) return;

    const visibleFootOffsets = {
      'env-tree': 11,
      'env-rock': 12,
      'env-bush': 8,
      'env-ruin': 4,
      'env-machinery': 3,
      'env-broken-pillar': 6
    };

    config.decorations.forEach(item => {
      if (this.textures.exists(item.key)) {
        const support = config.platforms
          .filter(platform => item.x >= platform.x && item.x <= platform.x + platform.width)
          .sort((a, b) => Math.abs(a.y - item.y) - Math.abs(b.y - item.y))[0];
        const scale = item.scale || 1;
        const groundY = support ? support.y : item.y;
        const deco = this.add.image(
          item.x,
          groundY + visibleFootOffsets[item.key] * scale,
          item.key
        );
        deco.setOrigin(0.5, 1.0);
        deco.setScale(scale);
        deco.setDepth(11);
        this.decorationsGroup.add(deco);
        const contactShadow = this.add.ellipse(
          item.x,
          groundY - 1,
          Math.max(20, deco.displayWidth * 0.62),
          Math.max(5, 4 * scale),
          0x020617,
          0.3
        );
        contactShadow.setDepth(10.5);
        this.decorationsGroup.add(contactShadow);
        if (item.key === 'env-tree' || item.key === 'env-bush') {
          this.tweens.add({
            targets: deco,
            angle: { from: -1.2, to: 1.2 },
            duration: 2100 + Phaser.Math.Between(0, 500),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      }
    });
  }

  createAmbientMotes(config) {
    this.ambientMotes = [];
    for (let i = 0; i < 22; i++) {
      const mote = this.add.circle(
        Phaser.Math.Between(24, config.worldWidth - 24),
        Phaser.Math.Between(70, 500),
        Phaser.Math.Between(1, 2),
        0x9be7ff,
        0.25
      );
      mote.setDepth(-2);
      this.ambientMotes.push(mote);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(12, 36),
        alpha: { from: 0.12, to: 0.48 },
        duration: Phaser.Math.Between(1800, 3600),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1800),
        ease: 'Sine.easeInOut'
      });
    }
  }

  createPlatforms(config) {
    this.platformsGroup = this.physics.add.staticGroup();

    config.platforms.forEach(plat => {
      const texKey = plat.isGround ? config.groundKey : config.platformKey;
      
      let imgH = 47;
      if (this.textures.exists(texKey)) {
        const tex = this.textures.get(texKey);
        const img = tex ? tex.getSourceImage() : null;
        if (img && img.height > 0) {
          imgH = img.height;
        }
      }

      if (plat.isGround && plat.height > imgH) {
        // Top surface with grass: exactly 1 slice high, repeating horizontally seamlessly
        const surfaceTile = this.add.tileSprite(plat.x, plat.y, plat.width, imgH, texKey);
        surfaceTile.setOrigin(0, 0);
        surfaceTile.setDepth(10);

        // Subsurface filling down to the bottom of the ground with matching deep earth color
        const subHeight = plat.height - imgH;
        const subRect = this.add.rectangle(
          plat.x,
          plat.y + imgH,
          plat.width,
          subHeight,
          0x1f110b // deep organic soil/rock tone matching the bottom of the platform
        );
        subRect.setOrigin(0, 0);
        subRect.setDepth(9);
      } else {
        // Floating platform: tile across width, matching the height
        const tile = this.add.tileSprite(plat.x, plat.y, plat.width, plat.height, texKey);
        tile.setOrigin(0, 0);
        tile.setDepth(10);

        if (plat.height !== imgH) {
          const s = plat.height / imgH;
          tile.setTileScale(s, s);
        }
      }

      // Dedicated solid collision body matching walkable surface
      const collider = this.platformsGroup.create(plat.x + plat.width / 2, plat.y + plat.height / 2);
      collider.setSize(plat.width, plat.height);
      collider.setVisible(false);
    });
  }

  createCheckpoint(config) {
    const cp = config.checkpoint;
    this.checkpointSprite = this.physics.add.sprite(cp.x, cp.y, 'checkpoint-monolith');
    this.checkpointSprite.setOrigin(0.5, 1.0);
    this.checkpointSprite.body.setAllowGravity(false);
    this.checkpointSprite.body.setImmovable(true);
    this.checkpointSprite.body.setSize(48, 100);
    this.checkpointSprite.setDepth(12);

    // Floating rune indicator
    this.checkpointGlow = this.add.circle(cp.x, cp.y - 80, 10, 0x38bdf8, 0.4);
    this.checkpointGlow.setDepth(13);
    this.tweens.add({
      targets: this.checkpointGlow,
      scale: 1.4,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
  }

  createFinishGate(config) {
    const gate = config.finishGate;
    this.finishGateSprite = this.physics.add.sprite(gate.x, gate.y, 'finish-gate');
    this.finishGateSprite.setOrigin(0.5, 1.0);
    this.finishGateSprite.body.setAllowGravity(false);
    this.finishGateSprite.body.setImmovable(true);
    this.finishGateSprite.body.setSize(64, 160);
    this.finishGateSprite.setDepth(12);

    // Swirling portal light
    this.tweens.add({
      targets: this.finishGateSprite,
      alpha: 0.85,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createHazards(config) {
    this.hazardsGroup = this.physics.add.staticGroup();

    if (!config.hazards) return;

    config.hazards.forEach(hz => {
      const tile = this.add.tileSprite(hz.x, hz.y, hz.width, hz.height, 'hazard-spikes');
      tile.setOrigin(0, 0);
      tile.setDepth(11);

      const floor = this.levelConfig.platforms
        .filter(platform => hz.x + hz.width / 2 >= platform.x && hz.x + hz.width / 2 <= platform.x + platform.width)
        .sort((a, b) => Math.abs(a.y - (hz.y + hz.height / 2)) - Math.abs(b.y - (hz.y + hz.height / 2)))[0];
      const floorY = floor ? floor.y : hz.y + hz.height;
      const collider = this.hazardsGroup.create(hz.x + hz.width / 2, floorY - 6);
      collider.setSize(Math.max(16, hz.width - 8), 12);
      collider.setVisible(false);
    });
  }

  createCollectibles(config) {
    this.collectiblesGroup = this.physics.add.staticGroup();

    config.collectibles.forEach(item => {
      const frag = this.collectiblesGroup.create(item.x, item.y, 'energy-fragment');
      frag.id = item.id;
      frag.body.setSize(28, 52);
      frag.setDepth(15);

      // Idle hovering animation
      this.tweens.add({
        targets: frag,
        y: item.y - 8,
        duration: 1200 + Phaser.Math.Between(0, 400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: frag,
        scale: 1.08,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createEnemies(config) {
    this.enemiesGroup = this.physics.add.group();

    if (!config.enemies) return;

    config.enemies.forEach(item => {
      const support = config.platforms
        .filter(platform => item.x >= platform.x && item.x <= platform.x + platform.width)
        .sort((a, b) => Math.abs(a.y - item.y) - Math.abs(b.y - item.y))[0];
      const floorY = support ? support.y : item.y + 48;
      const enemy = this.enemiesGroup.create(item.x, floorY, 'enemy-idle');
      enemy.setOrigin(0.5, 1);
      const frameWidth = enemy.frame.realWidth;
      const frameHeight = enemy.frame.realHeight;
      const bodyWidth = Math.min(42, frameWidth * 0.84);
      const bodyHeight = Math.min(20, frameHeight * 0.5);
      enemy.body.setSize(bodyWidth, bodyHeight, false);
      enemy.setY(floorY + 2);
      enemy.body.setOffset((frameWidth - bodyWidth) / 2, frameHeight - bodyHeight - 2);
      enemy.body.setCollideWorldBounds(true);
      enemy.body.setMaxVelocityX(item.speed || 70);
      enemy.groundY = floorY;
      enemy.groundShadow = this.add.ellipse(item.x, floorY - 1, 48, 8, 0x020617, 0.4);
      enemy.groundShadow.setDepth(12);
      enemy.patrolLeft = item.patrolLeft;
      enemy.patrolRight = item.patrolRight;
      enemy.patrolSpeed = item.speed || 70;
      enemy.direction = 1;
      enemy.body.setVelocityX(enemy.patrolSpeed);
      enemy.setDepth(14);
    });
  }

  createTutorialMarkers(tutorials) {
    tutorials.forEach(tut => {
      const banner = this.add.container(tut.x, tut.y);
      banner.setDepth(15);
      banner.setAlpha(0);
      banner.setVisible(false);

      const text = this.add.text(0, 0, tut.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e2e8f0',
        backgroundColor: '#0f172ae0',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5);

      text.setStroke('#38bdf8', 1);
      banner.add(text);
      banner.triggerX = tut.x;
      banner.dismissed = false;
      banner.showing = false;

      // Add to list for proximity check
      if (!this.tutorialBanners) this.tutorialBanners = [];
      this.tutorialBanners.push(banner);
    });
  }

  createHUD() {
    const { width } = this.scale;

    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setScrollFactor(0);
    this.hudContainer.setDepth(110);

    // Compact glass HUD with distinct health, objective, score, and level sections.
    const bar = this.add.graphics();
    bar.fillStyle(0x020817, 0.48);
    bar.fillRoundedRect(10, 12, width - 20, 48, 16);
    bar.fillStyle(0x071629, 0.94);
    bar.fillRoundedRect(10, 8, width - 20, 48, 16);
    bar.lineStyle(1, 0x7dd3fc, 0.32);
    bar.strokeRoundedRect(10, 8, width - 20, 48, 16);
    bar.fillStyle(0x38bdf8, 0.72);
    bar.fillRoundedRect(30, 54, width - 60, 2, 1);
    this.hudContainer.add(bar);

    // Hearts (Health)
    this.heartSprites = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(32 + i * 29, 31, 'ui-heart');
      heart.setScale(0.5);
      this.hudContainer.add(heart);
      this.heartSprites.push(heart);
    }

    const counterDivider = this.add.rectangle(119, 31, 1, 24, 0x64748b, 0.55);
    this.hudContainer.add(counterDivider);

    const fragIcon = this.add.image(140, 31, 'ui-energy-icon');
    fragIcon.setScale(0.4);
    this.hudContainer.add(fragIcon);
    this.tweens.add({
      targets: fragIcon,
      angle: 8,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.fragText = this.add.text(158, 31, `0 / ${this.levelConfig.collectibles.length}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#bae6fd'
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.fragText);

    const progressTrack = this.add.graphics();
    progressTrack.fillStyle(0x0b2235, 1);
    progressTrack.fillRoundedRect(140, 46, 108, 3, 2);
    this.hudContainer.add(progressTrack);
    this.fragmentProgressFill = this.add.graphics();
    this.hudContainer.add(this.fragmentProgressFill);
    this.updateFragmentProgress();

    const scorePanel = this.add.graphics();
    scorePanel.fillStyle(0x0b1b2a, 0.98);
    scorePanel.fillRoundedRect(width / 2 - 94, 12, 188, 38, 14);
    scorePanel.lineStyle(1, 0xfbbf24, 0.45);
    scorePanel.strokeRoundedRect(width / 2 - 94, 12, 188, 38, 14);
    this.hudContainer.add(scorePanel);

    this.scoreText = this.add.text(width / 2, 32, '✦  SCORE  0', {
      fontFamily: 'Cinzel, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5);
    this.hudContainer.add(this.scoreText);

    this.levelBadgeText = this.add.text(width - 78, 32, `LEVEL 0${this.levelId}`, {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#bae6fd',
      letterSpacing: 1
    }).setOrigin(1, 0.5);
    this.hudContainer.add(this.levelBadgeText);

    const pauseBtn = this.add.rectangle(width - 34, 32, 32, 32, 0x10263a, 0.98).setInteractive({ useHandCursor: true });
    pauseBtn.setStrokeStyle(1, 0x38bdf8, 0.75);
    const pauseIcon = this.add.text(width - 34, 32, 'Ⅱ', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#e0f2fe'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      audioManager.playSfx(this, 'sfx-button-click');
      this.togglePause();
    });
    pauseBtn.on('pointerover', () => {
      pauseBtn.setFillStyle(0x164e63, 1);
      pauseBtn.setStrokeStyle(1, 0x67e8f9, 1);
    });
    pauseBtn.on('pointerout', () => {
      pauseBtn.setFillStyle(0x10263a, 0.95);
      pauseBtn.setStrokeStyle(1, 0x38bdf8, 0.65);
    });

    this.hudContainer.add([pauseBtn, pauseIcon]);
    this.pauseButton = pauseBtn;
    this.pauseButtonIcon = pauseIcon;
    this.hudContainer.setAlpha(0);
    this.tweens.add({ targets: this.hudContainer, alpha: 1, duration: 420, ease: 'Cubic.easeOut' });
  }

  updateFragmentProgress() {
    if (!this.fragmentProgressFill) return;
    const total = this.levelConfig.collectibles.length;
    const progress = total > 0 ? Phaser.Math.Clamp(this.fragmentsCollected / total, 0, 1) : 0;
    this.fragmentProgressFill.clear();
    if (progress > 0) {
      this.fragmentProgressFill.fillStyle(0x38bdf8, 1);
      this.fragmentProgressFill.fillRoundedRect(140, 46, 108 * progress, 3, 2);
    }
  }

  createPauseMenu() {
    const { width, height } = this.scale;

    this.pauseMenu = this.add.container(0, 0);
    this.pauseMenu.setScrollFactor(0);
    this.pauseMenu.setDepth(150);
    this.pauseMenu.setVisible(false);

    const blocker = this.add.rectangle(0, 0, width, height, 0x020617, 0.78).setOrigin(0).setInteractive();
    const panelShadow = this.add.rectangle(width / 2, height / 2 + 8, 340, 330, 0x020617, 0.55);
    const panel = this.add.rectangle(width / 2, height / 2, 340, 330, 0x0a1728, 0.98);
    panel.setStrokeStyle(1, 0x67e8f9, 0.55);
    const accent = this.add.rectangle(width / 2, height / 2 - 103, 54, 3, 0x38bdf8, 0.9);

    const title = this.add.text(width / 2, height / 2 - 125, 'PAUSED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#e0f2fe',
      letterSpacing: 2
    }).setOrigin(0.5);
    const subtitle = this.add.text(width / 2, height / 2 - 82, 'Take a breath, explorer', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '13px',
      color: '#94a3b8'
    }).setOrigin(0.5);

    // Buttons: Resume, Restart, Menu
    const buttons = [
      { text: 'RESUME', action: () => this.togglePause() },
      { text: 'RESTART LEVEL', action: () => this.scene.restart({ levelId: this.levelId }) },
      { text: 'MAIN MENU', action: () => {
        audioManager.stopMusic(this, this.levelConfig.musicKey);
        this.scene.start('MenuScene');
      }}
    ];

    const pauseBtns = buttons.map((btn, idx) => {
      const y = height / 2 - 34 + idx * 54;
      const b = this.add.rectangle(width / 2, y, 240, 40, idx === 0 ? 0x075985 : 0x142237)
        .setInteractive({ useHandCursor: true });
      b.setStrokeStyle(1, idx === 0 ? 0x38bdf8 : 0x334b64);
      const t = this.add.text(width / 2, y, btn.text, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#e0f2fe',
        letterSpacing: 1
      }).setOrigin(0.5);

      b.on('pointerover', () => {
        b.setFillStyle(idx === 0 ? 0x0369a1 : 0x203751);
        this.tweens.add({ targets: [b, t], scale: 1.03, duration: 120, ease: 'Cubic.easeOut' });
      });
      b.on('pointerout', () => {
        b.setFillStyle(idx === 0 ? 0x075985 : 0x142237);
        this.tweens.add({ targets: [b, t], scale: 1, duration: 150, ease: 'Cubic.easeOut' });
      });
      b.on('pointerdown', () => {
        audioManager.playSfx(this, 'sfx-button-click');
        btn.action();
      });

      return [b, t];
    }).flat();

    this.pausePanel = panel;
    this.pauseMenu.add([blocker, panelShadow, panel, accent, title, subtitle, ...pauseBtns]);
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.pauseMenu.setAlpha(0);
      this.pauseMenu.setVisible(true);
      this.pausePanel.setScale(0.94);
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 1,
        duration: 220,
        ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: this.pausePanel,
        scale: 1,
        duration: 260,
        ease: 'Back.easeOut'
      });
      this.physics.pause();
    } else {
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 0,
        duration: 140,
        ease: 'Sine.easeIn',
        onComplete: () => this.pauseMenu.setVisible(false)
      });
      this.physics.resume();
    }
  }

  onCollectFragment(playerSprite, frag) {
    if (!frag.active || this.collectedIds.has(frag.id)) return;

    this.collectedIds.add(frag.id);
    this.fragmentsCollected++;
    this.score += 100;

    audioManager.playSfx(this, 'sfx-collect');

    // Sparkle pickup animation
    this.createSparkleEffect(frag.x, frag.y);

    // Collect tween
    this.tweens.add({
      targets: frag,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      y: frag.y - 24,
      duration: 250,
      onComplete: () => {
        frag.destroy();
      }
    });

    // Update HUD
    this.fragText.setText(`${this.fragmentsCollected} / ${this.levelConfig.collectibles.length}`);
    this.updateFragmentProgress();
    this.tweens.add({
      targets: this.fragText,
      scale: 1.16,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
    this.scoreText.setText(`✦  SCORE  ${this.score}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.14,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  }

  createSparkleEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.add.circle(x, y, 3, 0x38bdf8, 1);
      spark.setDepth(25);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 35,
        y: y + Math.sin(angle) * 35,
        alpha: 0,
        scale: 0.1,
        duration: 350,
        onComplete: () => spark.destroy()
      });
    }
  }

  onHitHazard(playerSprite, hazard) {
    if (this.player.isInvulnerable || this.player.isDead) return;
    if (this.player.takeDamage(1)) this.updateHealthHUD();
  }

  onHitEnemy(playerSprite, enemy) {
    if (this.player.isInvulnerable || this.player.isDead) return;
    if (this.player.takeDamage(1)) this.updateHealthHUD();
  }

  onReachCheckpoint(playerSprite, checkpoint) {
    if (this.isCheckpointActive) return;

    this.isCheckpointActive = true;
    this.player.setCheckpoint(checkpoint.x, checkpoint.y);

    audioManager.playSfx(this, 'sfx-checkpoint');

    // Visual activation
    checkpoint.setTint(0x38bdf8);
    this.checkpointGlow.setFillStyle(0x34d399, 0.8);

    // Floating text notification
    const msg = this.add.text(checkpoint.x, checkpoint.y - 120, 'CHECKPOINT ATTUNED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#34d399',
      backgroundColor: '#020617e0',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5);
    msg.setDepth(30);

    this.tweens.add({
      targets: msg,
      y: msg.y - 30,
      alpha: 0,
      duration: 1600,
      onComplete: () => msg.destroy()
    });
  }

  onReachFinishGate(playerSprite, gate) {
    if (this.levelFinished) return;

    this.levelFinished = true;
    this.physics.pause();

    audioManager.playSfx(this, 'sfx-level-complete');
    audioManager.stopMusic(this, this.levelConfig.musicKey);

    // Finish swirl celebration
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0,
      scale: 0.1,
      y: gate.y - 60,
      x: gate.x,
      duration: 700,
      onComplete: () => {
        // Save progress
        saveManager.completeLevel(this.levelId, this.score, this.fragmentsCollected);

        if (this.levelId === 1) {
          this.scene.start('LevelCompleteScene', {
            levelId: 1,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length
          });
        } else {
          // Level 2 complete -> Victory Scene
          this.scene.start('VictoryScene', {
            levelId: 2,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length
          });
        }
      }
    });
  }

  updateHealthHUD() {
    const hp = this.player.health;
    this.heartSprites.forEach((heart, idx) => {
      if (idx < hp) {
        heart.setTint(0xffffff);
        heart.setAlpha(1.0);
      } else {
        heart.setTint(0x475569);
        heart.setAlpha(0.35);
      }
    });
    const lostHeart = this.heartSprites[hp];
    if (lostHeart) {
      this.tweens.add({
        targets: lostHeart,
        scale: 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut'
      });
    }
  }

  onPlayerDied() {
    audioManager.stopMusic(this, this.levelConfig.musicKey);
    this.scene.start('GameOverScene', {
      levelId: this.levelId,
      score: this.score,
      fragments: this.fragmentsCollected
    });
  }

  update(time, delta) {
    if (this.isPaused || this.levelFinished) return;

    // Update Unified Input
    this.inputManager.update();

    // Check Pause & Restart keys
    if (this.inputManager.state.pauseJustPressed) {
      this.togglePause();
      return;
    }

    if (this.inputManager.state.restartJustPressed) {
      this.scene.restart({ levelId: this.levelId });
      return;
    }

    // Update Player Physics and Movement
    this.player.update(this.inputManager);

    // Update Enemy Patrol Behavior
    this.enemiesGroup.getChildren().forEach(enemy => {
      if (enemy.texture.key !== 'enemy-move' && this.textures.exists('enemy-move')) {
        enemy.setTexture('enemy-move');
      }
      if (enemy.x <= enemy.patrolLeft) {
        enemy.direction = 1;
        enemy.setFlipX(false);
      } else if (enemy.x >= enemy.patrolRight) {
        enemy.direction = -1;
        enemy.setFlipX(true);
      }
      enemy.body.setVelocityX(enemy.direction * enemy.patrolSpeed);
      enemy.setAngle(Math.sin(time / 180 + enemy.patrolLeft) * 1.5);
      enemy.groundShadow.setPosition(enemy.x, enemy.groundY - 1);
    });

    // Update Tutorial dismissals
    if (this.tutorialBanners) {
      this.tutorialBanners.forEach(banner => {
        const nearby = Math.abs(this.player.sprite.x - banner.triggerX) <= 160;
        if (!banner.dismissed && nearby && !banner.showing) {
          banner.showing = true;
          banner.setVisible(true);
          this.tweens.add({ targets: banner, alpha: 1, duration: 180 });
        } else if (!nearby && banner.showing) {
          banner.showing = false;
          banner.setVisible(false);
        }

        if (!banner.dismissed && this.player.sprite.x > banner.triggerX + 160) {
          banner.dismissed = true;
          this.tweens.add({
            targets: banner,
            alpha: 0,
            y: banner.y - 20,
            duration: 400,
            onComplete: () => banner.destroy()
          });
        }
      });
    }

  }

  onResize(gameSize) {
    const { width, height } = gameSize;
    if (this.scoreText) this.scoreText.setPosition(width / 2, 32);
    if (this.levelBadgeText) this.levelBadgeText.setPosition(width - 78, 32);
    if (this.pauseButton) {
      this.pauseButton.setPosition(width - 34, 32);
      this.pauseButtonIcon.setPosition(width - 34, 32);
    }
    if (this.bgLayer) {
      this.resizeBackground(this.bgLayer, width, height, this.levelConfig);
    }
    if (this.skyTint) {
      this.skyTint.clear();
      this.skyTint.fillGradientStyle(this.levelConfig.bgColor, this.levelConfig.bgColor, 0x050811, 0x050811, 0.15, 0.15, 0.4, 0.4);
      this.skyTint.fillRect(0, 0, width, height);
    }
  }

  resizeBackground(background, width, height, config) {
    const texture = this.textures.get(config.bgKey);
    const image = texture ? texture.getSourceImage() : null;
    if (!image || image.width <= 0 || image.height <= 0) return;

    const parallaxTravelX = Math.max(0, config.worldWidth - width) * 0.12;
    const parallaxTravelY = Math.max(0, config.worldHeight - height) * 0.03;
    const scale = Math.max(
      (height + parallaxTravelY + 8) / image.height,
      (width + parallaxTravelX) / image.width
    );
    background.setDisplaySize(image.width * scale, image.height * scale);
  }

  shutdown() {
    audioManager.stopMusic(this, this.levelConfig.musicKey);
    if (this.inputManager) {
      this.inputManager.destroy();
    }
  }
}
