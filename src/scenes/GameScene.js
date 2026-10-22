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
    this.respawnFromCheckpoint = !!data.fromCheckpoint;
    this.score = this.respawnFromCheckpoint ? (data.score || 0) : 0;
    this.fragmentsCollected = this.respawnFromCheckpoint ? (data.fragments || 0) : 0;
    this.elapsedTime = this.respawnFromCheckpoint ? (data.timeSeconds || 0) : 0;
    this.isPaused = false;
    this.levelFinished = false;
    this.collectedIds = new Set(this.respawnFromCheckpoint && data.collectedIds ? data.collectedIds : []);
    this.isCheckpointActive = this.respawnFromCheckpoint;
    this.saveSettings = saveManager.getSettings();
  }

  formatTimer(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
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
    // When spawning at checkpoint, checkpoint.y is the top of the solid platform (e.g. 600).
    // Player height is 100 with center origin (0.5, 0.5). Spawning at checkpoint.y - 56 places
    // player feet safely 6px above the ground surface so the player lands cleanly without clipping.
    const startX = (this.respawnFromCheckpoint && config.checkpoint) ? config.checkpoint.x : config.playerStart.x;
    const startY = (this.respawnFromCheckpoint && config.checkpoint) 
      ? (config.checkpoint.y - 56) 
      : config.playerStart.y;
    this.player = new PlayerController(this, startX, startY);
    if (this.respawnFromCheckpoint && config.checkpoint) {
      this.isCheckpointActive = true;
      this.player.setCheckpoint(config.checkpoint.x, config.checkpoint.y);
      if (this.checkpointSprite) this.checkpointSprite.setTint(0x38bdf8);
      if (this.checkpointGlow) this.checkpointGlow.setFillStyle(0x34d399, 0.8);
    }

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

    // 17. Bind Dedicated ESC / Pause Key Listeners (event-driven & window fallback)
    this.setupPauseKeyListeners();

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

    // Calibrated offsets so bottom transparency of sprite is sunk beneath the ground surface,
    // firmly rooting trees and planting stones into the soil and grass blades
    const visibleFootOffsets = {
      'env-tree': 18,
      'env-rock': 20,
      'env-bush': 12,
      'env-ruin': 10,
      'env-machinery': 8,
      'env-broken-pillar': 10
    };

    config.decorations.forEach(item => {
      if (this.textures.exists(item.key)) {
        const support = config.platforms
          .filter(platform => item.x >= platform.x && item.x <= platform.x + platform.width)
          .sort((a, b) => Math.abs(a.y - item.y) - Math.abs(b.y - item.y))[0];
        const scale = item.scale || 1;
        const groundY = support ? support.y : item.y;
        const offset = (visibleFootOffsets[item.key] || 10) * scale;

        // Ground contact shadow right at the ground level
        const contactShadow = this.add.ellipse(
          item.x,
          groundY + 1,
          Math.max(22, 54 * scale),
          Math.max(6, 6 * scale),
          0x020617,
          0.4
        );
        contactShadow.setDepth(10.5);
        this.decorationsGroup.add(contactShadow);

        const deco = this.add.image(
          item.x,
          groundY + offset,
          item.key
        );
        deco.setOrigin(0.5, 1.0);
        deco.setScale(scale);
        deco.setDepth(11);
        this.decorationsGroup.add(deco);

        if (item.key === 'env-tree' || item.key === 'env-bush') {
          this.tweens.add({
            targets: deco,
            angle: { from: -1.0, to: 1.0 },
            duration: 2200 + Phaser.Math.Between(0, 500),
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

      // Mathematically exact solid static body matching walkable surface dimensions
      const collider = this.add.rectangle(plat.x + plat.width / 2, plat.y + plat.height / 2, plat.width, plat.height);
      this.physics.add.existing(collider, true);
      this.platformsGroup.add(collider);
      collider.setVisible(false);
    });

    // Deep chasm danger aura across bottom voids
    const chasmRift = this.add.graphics();
    chasmRift.setDepth(8);
    const riftColor = (this.levelId === 2) ? 0x9333ea : 0xbe123c;
    chasmRift.fillGradientStyle(0x020617, 0x020617, riftColor, riftColor, 0, 0, 0.45, 0.45);
    chasmRift.fillRect(0, config.worldHeight - 40, config.worldWidth, 50);
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

    const texKey = (this.levelId === 2) ? 'hazard-spikes-l2' : 'hazard-spikes-l1';
    const hazardTexture = this.textures.exists(texKey) ? texKey : 'hazard-spikes';

    config.hazards.forEach(hz => {
      // 1. Mathematically determine the exact ground platform supporting this hazard
      const centerH = hz.x + hz.width / 2;
      const support = config.platforms
        .filter(p => centerH >= p.x - 4 && centerH <= p.x + p.width + 4)
        .sort((a, b) => Math.abs(a.y - (hz.y || a.y)) - Math.abs(b.y - (hz.y || b.y)))[0];
      const groundY = support ? support.y : (hz.y + (hz.height || 32));
      const height = hz.height || 32;
      const visualY = groundY - height;

      // 2. Base anchor contact shadow firmly seating the spikes on the platform surface
      const baseAnchor = this.add.rectangle(hz.x + hz.width / 2, groundY, hz.width, 3, 0x020617, 0.65);
      baseAnchor.setOrigin(0.5, 0);
      baseAnchor.setDepth(10.8);

      // 3. Crisp tiled spike hazard visual
      const tile = this.add.tileSprite(hz.x, visualY, hz.width, height, hazardTexture);
      tile.setOrigin(0, 0);
      tile.setDepth(11);

      // 4. Subtle, atmospheric danger warning glow
      const glowColor = (this.levelId === 2) ? 0xf43f5e : 0xf87171;
      const hazardGlow = this.add.ellipse(
        hz.x + hz.width / 2,
        visualY + 6,
        Math.max(28, hz.width - 6),
        10,
        glowColor,
        0.2
      );
      hazardGlow.setDepth(10.9);
      this.tweens.add({
        targets: hazardGlow,
        alpha: { from: 0.12, to: 0.32 },
        scaleY: { from: 0.85, to: 1.25 },
        duration: 1100 + Phaser.Math.Between(0, 300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // 5. Fair, forgiving Arcade physics collider:
      // Inset horizontally by 6px on each side so grazing past tips is safe
      // Positioned at the bottom 62% of spike height flush against the ground
      const hitboxW = Math.max(16, hz.width - 12);
      const hitboxH = Math.max(12, Math.round(height * 0.62));
      const collider = this.hazardsGroup.create(hz.x + hz.width / 2, groundY - hitboxH / 2, null);
      collider.setVisible(false);
      collider.body.setSize(hitboxW, hitboxH);
      collider.body.setOffset(-hitboxW / 2, -hitboxH / 2);
      collider.refreshBody();

      // Store metadata for directional recoil and hit calculations
      collider.hazardCenterX = hz.x + hz.width / 2;
      collider.hazardGroundY = groundY;
    });
  }

  createCollectibles(config) {
    this.collectiblesGroup = this.physics.add.staticGroup();

    config.collectibles.forEach(item => {
      // Do not respawn already attuned fragments if resuming from checkpoint
      if (this.collectedIds && this.collectedIds.has(item.id)) return;

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

    // Modern Top HUD Bar: sleek floating glass banner
    const hudBar = this.add.graphics();
    hudBar.fillStyle(0x020612, 0.65);
    hudBar.fillRoundedRect(12, 12, width - 24, 46, 14);
    hudBar.fillStyle(0x0a1424, 0.92);
    hudBar.fillRoundedRect(12, 10, width - 24, 46, 14);
    hudBar.lineStyle(1, 0x38bdf8, 0.35);
    hudBar.strokeRoundedRect(12, 10, width - 24, 46, 14);
    this.hudContainer.add(hudBar);

    // 1. Vitality Section (Left)
    this.heartSprites = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(34 + i * 26, 33, 'ui-heart');
      heart.setScale(0.48);
      this.hudContainer.add(heart);
      this.heartSprites.push(heart);
    }

    this.hpLabel = this.add.text(118, 33, '3/3 HP', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.hpLabel);

    const divider1 = this.add.rectangle(176, 33, 1, 20, 0x1e3a5f, 0.9);
    this.hudContainer.add(divider1);

    // 2. Fragment Attunement Section (Center-Left)
    const fragIcon = this.add.image(196, 33, 'ui-energy-icon');
    fragIcon.setScale(0.42);
    this.hudContainer.add(fragIcon);
    this.tweens.add({
      targets: fragIcon,
      scaleX: 0.46,
      scaleY: 0.46,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.fragText = this.add.text(214, 33, `0 / ${this.levelConfig.collectibles.length}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      fontStyle: '600',
      color: '#e0f2fe'
    }).setOrigin(0, 0.5);
    this.hudContainer.add(this.fragText);

    // Micro progress track underneath fragments
    const progressTrack = this.add.graphics();
    progressTrack.fillStyle(0x0f1f33, 1);
    progressTrack.fillRoundedRect(194, 45, 96, 3, 2);
    this.hudContainer.add(progressTrack);
    this.fragmentProgressFill = this.add.graphics();
    this.hudContainer.add(this.fragmentProgressFill);
    this.updateFragmentProgress();

    // 3. Center: Expedition Stopwatch Timer
    this.timerText = this.add.text(width / 2 - 40, 33, '⏱ 00:00.0', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#38bdf8',
      letterSpacing: 0.5
    }).setOrigin(0.5);
    this.hudContainer.add(this.timerText);

    // 4. Center-Right: Expedition Score
    this.scoreText = this.add.text(width / 2 + 55, 33, '✦ 0 PTS', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fbbf24',
      letterSpacing: 0.5
    }).setOrigin(0.5);
    this.hudContainer.add(this.scoreText);

    // 5. Far Right: Sector Tag & Pause button
    this.levelBadgeText = this.add.text(width - 88, 33, `SECTOR 0${this.levelId}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      fontStyle: '600',
      color: '#94a3b8',
      letterSpacing: 1
    }).setOrigin(1, 0.5);
    this.hudContainer.add(this.levelBadgeText);

    const pauseBtn = this.add.rectangle(width - 44, 33, 48, 28, 0x0f2238, 0.95).setInteractive({ useHandCursor: true });
    pauseBtn.setStrokeStyle(1, 0x38bdf8, 0.7);
    const pauseIcon = this.add.text(width - 44, 33, '⏸ ESC', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#e0f2fe'
    }).setOrigin(0.5);

    pauseBtn.on('pointerdown', () => {
      this.handlePauseToggle();
    });
    pauseBtn.on('pointerover', () => {
      pauseBtn.setFillStyle(0x0284c7, 1);
      pauseBtn.setStrokeStyle(1, 0x7dd3fc, 1);
    });
    pauseBtn.on('pointerout', () => {
      pauseBtn.setFillStyle(0x0f2238, 0.95);
      pauseBtn.setStrokeStyle(1, 0x38bdf8, 0.7);
    });

    this.hudContainer.add([pauseBtn, pauseIcon]);
    this.pauseButton = pauseBtn;
    this.pauseButtonIcon = pauseIcon;
    this.hudContainer.setAlpha(0);
    this.tweens.add({ targets: this.hudContainer, alpha: 1, duration: 400, ease: 'Cubic.easeOut' });
  }

  updateFragmentProgress() {
    if (!this.fragmentProgressFill) return;
    const total = this.levelConfig.collectibles.length;
    const progress = total > 0 ? Phaser.Math.Clamp(this.fragmentsCollected / total, 0, 1) : 0;
    this.fragmentProgressFill.clear();
    if (progress > 0) {
      this.fragmentProgressFill.fillStyle(0x38bdf8, 1);
      this.fragmentProgressFill.fillRoundedRect(194, 45, 96 * progress, 3, 2);
    }
  }

  setupPauseKeyListeners() {
    this.lastPauseToggleTime = 0;

    // Direct Phaser Keyboard keys
    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      this.escKey.on('down', () => this.handlePauseToggle());
      this.pKey.on('down', () => this.handlePauseToggle());
      this.rKey.on('down', () => {
        if (this.isPaused && !this.levelFinished) {
          this.physics.resume();
          this.scene.restart({ levelId: this.levelId });
        }
      });
    }

    // Window level listener as bulletproof backup for iframes and canvas focus issues
    this.windowKeyDownHandler = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'p' || e.key === 'P') {
        if (this.scene && this.scene.isActive('GameScene') && !this.levelFinished) {
          e.preventDefault();
          this.handlePauseToggle();
        }
      } else if ((e.key === 'r' || e.key === 'R') && this.isPaused && !this.levelFinished) {
        if (this.scene && this.scene.isActive('GameScene')) {
          e.preventDefault();
          this.physics.resume();
          this.scene.restart({ levelId: this.levelId });
        }
      }
    };
    window.addEventListener('keydown', this.windowKeyDownHandler);
  }

  handlePauseToggle() {
    if (this.levelFinished) return;
    const now = Date.now();
    if (this.lastPauseToggleTime && now - this.lastPauseToggleTime < 220) {
      return;
    }
    this.lastPauseToggleTime = now;
    this.togglePause();
  }

  createPauseMenu() {
    const { width, height } = this.scale;

    this.pauseMenu = this.add.container(0, 0);
    this.pauseMenu.setScrollFactor(0);
    this.pauseMenu.setDepth(200);
    this.pauseMenu.setVisible(false);

    // Fullscreen semi-transparent backdrop blocker
    this.pauseBlocker = this.add.rectangle(0, 0, width, height, 0x020617, 0.85)
      .setOrigin(0)
      .setInteractive();

    // Clicking anywhere on the backdrop outside the panel resumes the game
    this.pauseBlocker.on('pointerdown', (pointer) => {
      if (!this.pausePanel) return;
      const bounds = this.pausePanel.getBounds();
      if (!bounds.contains(pointer.x, pointer.y)) {
        this.handlePauseToggle();
      }
    });

    // Central Glass Panel
    const panelW = Math.min(420, width - 36);
    const panelH = 370;
    this.pausePanel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x081324, 0.98);
    this.pausePanel.setStrokeStyle(1.5, 0x38bdf8, 0.7);

    // Subtle top glowing edge
    const topGlow = this.add.rectangle(width / 2, height / 2 - panelH / 2 + 1, panelW - 4, 3, 0x38bdf8, 0.9);

    // Sub-badge
    const badgeText = this.add.text(width / 2, height / 2 - panelH / 2 + 28, 'MISSION SUSPENDED · SYSTEM IDLE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      color: '#38bdf8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Title
    const title = this.add.text(width / 2, height / 2 - panelH / 2 + 56, 'EXPEDITION PAUSED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '24px',
      fontStyle: '800',
      color: '#ffffff',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Close '✕' button at top-right
    const closeX = width / 2 + panelW / 2 - 28;
    const closeY = height / 2 - panelH / 2 + 28;
    const closeBtnBg = this.add.circle(closeX, closeY, 14, 0x0f2238, 0.85).setInteractive({ useHandCursor: true });
    closeBtnBg.setStrokeStyle(1, 0x38bdf8, 0.5);
    const closeBtnTxt = this.add.text(closeX, closeY, '✕', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5);

    closeBtnBg.on('pointerover', () => {
      closeBtnBg.setFillStyle(0xef4444, 0.9);
      closeBtnBg.setStrokeStyle(1, 0xfca5a5, 1);
      closeBtnTxt.setColor('#ffffff');
    });
    closeBtnBg.on('pointerout', () => {
      closeBtnBg.setFillStyle(0x0f2238, 0.85);
      closeBtnBg.setStrokeStyle(1, 0x38bdf8, 0.5);
      closeBtnTxt.setColor('#94a3b8');
    });
    closeBtnBg.on('pointerdown', () => {
      this.handlePauseToggle();
    });

    // Divider Line 1
    const divider1 = this.add.rectangle(width / 2, height / 2 - panelH / 2 + 82, panelW - 48, 1, 0x1e3a5f);

    // Stats Readout
    this.pauseStatsText = this.add.text(width / 2, height / 2 - panelH / 2 + 104, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#94a3b8',
      align: 'center'
    }).setOrigin(0.5);

    // Divider Line 2
    const divider2 = this.add.rectangle(width / 2, height / 2 - panelH / 2 + 126, panelW - 48, 1, 0x1e3a5f);

    // Menu Buttons
    const buttons = [
      {
        text: 'RESUME EXPEDITION [ESC]',
        primary: true,
        action: () => this.handlePauseToggle()
      },
      {
        text: 'RETRY SECTOR [R]',
        primary: false,
        action: () => {
          this.physics.resume();
          this.scene.restart({ levelId: this.levelId });
        }
      },
      {
        text: 'SECTOR ARCHIVE',
        primary: false,
        action: () => {
          this.physics.resume();
          audioManager.stopMusic(this, this.levelConfig.musicKey);
          this.scene.start('LevelSelectScene');
        }
      },
      {
        text: 'MAIN MENU',
        primary: false,
        action: () => {
          this.physics.resume();
          audioManager.stopMusic(this, this.levelConfig.musicKey);
          this.scene.start('MenuScene');
        }
      }
    ];

    const pauseButtonContainers = [];
    const btnStartY = height / 2 - panelH / 2 + 160;
    const btnSpacing = 44;

    buttons.forEach((btn, idx) => {
      const y = btnStartY + idx * btnSpacing;
      const bWidth = panelW - 60;
      const bHeight = 36;

      const container = this.add.container(width / 2, y);

      const b = this.add.rectangle(0, 0, bWidth, bHeight, btn.primary ? 0x0284c7 : 0x0c1b30, 0.95)
        .setInteractive({ useHandCursor: true });
      b.setStrokeStyle(1.5, btn.primary ? 0x38bdf8 : 0x1e3a5f);

      const t = this.add.text(0, 0, btn.text, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        fontStyle: '700',
        color: '#ffffff',
        letterSpacing: 1
      }).setOrigin(0.5);

      b.on('pointerover', () => {
        b.setFillStyle(btn.primary ? 0x0369a1 : 0x152c4c);
        b.setStrokeStyle(1.5, btn.primary ? 0x7dd3fc : 0x38bdf8);
        this.tweens.add({ targets: container, scale: 1.03, duration: 120, ease: 'Cubic.easeOut' });
      });
      b.on('pointerout', () => {
        b.setFillStyle(btn.primary ? 0x0284c7 : 0x0c1b30);
        b.setStrokeStyle(1.5, btn.primary ? 0x38bdf8 : 0x1e3a5f);
        this.tweens.add({ targets: container, scale: 1.0, duration: 150, ease: 'Cubic.easeOut' });
      });
      b.on('pointerdown', () => {
        audioManager.playSfx(this, 'sfx-button-click');
        btn.action();
      });

      container.add([b, t]);
      pauseButtonContainers.push(container);
    });

    // Footer Hint
    const footerHint = this.add.text(width / 2, height / 2 + panelH / 2 - 20, 'Press [ESC] / [P] to Resume  ·  [R] Quick Retry', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '10px',
      color: '#64748b',
      letterSpacing: 0.5
    }).setOrigin(0.5);

    this.pauseMenu.add([
      this.pauseBlocker,
      this.pausePanel,
      topGlow,
      badgeText,
      title,
      closeBtnBg,
      closeBtnTxt,
      divider1,
      this.pauseStatsText,
      divider2,
      ...pauseButtonContainers,
      footerHint
    ]);
  }

  togglePause() {
    if (this.levelFinished) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      audioManager.playSfx(this, 'sfx-button-click');

      // Update Pause stats
      if (this.pauseStatsText) {
        this.pauseStatsText.setText(
          `SECTOR 0${this.levelId}  ·  TIME: ${this.formatTimer(this.elapsedTime)}  ·  ENERGY: ${this.fragmentsCollected}/${this.levelConfig.collectibles.length}  ·  ${this.score} PTS`
        );
      }

      // Hide mobile buttons while paused to prevent interfering clicks
      if (this.inputManager) {
        this.inputManager.resetState();
        if (this.inputManager.touchContainer) {
          this.inputManager.touchContainer.setVisible(false);
        }
      }
      if (this.player && this.player.sprite && this.player.sprite.body) {
        this.player.sprite.body.setVelocityX(0);
      }

      this.pauseMenu.setAlpha(0);
      this.pauseMenu.setVisible(true);
      this.pausePanel.setScale(0.92);

      this.tweens.killTweensOf([this.pauseMenu, this.pausePanel]);
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 1,
        duration: 180,
        ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: this.pausePanel,
        scale: 1,
        duration: 220,
        ease: 'Back.easeOut'
      });

      this.physics.pause();
    } else {
      audioManager.playSfx(this, 'sfx-button-click');

      // Restore touch controls
      if (this.inputManager && this.inputManager.touchContainer) {
        this.inputManager.touchContainer.setVisible(true);
      }

      this.tweens.killTweensOf([this.pauseMenu, this.pausePanel]);
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 0,
        duration: 140,
        ease: 'Sine.easeIn',
        onComplete: () => {
          if (!this.isPaused) {
            this.pauseMenu.setVisible(false);
          }
        }
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

    // Modern floating +100 score popup
    const floatText = this.add.text(frag.x, frag.y - 10, '+100', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#fbbf24',
      stroke: '#030712',
      strokeThickness: 2.5
    }).setOrigin(0.5).setDepth(26);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 36,
      alpha: 0,
      scale: 1.15,
      duration: 550,
      ease: 'Cubic.easeOut',
      onComplete: () => floatText.destroy()
    });

    // Collect tween
    this.tweens.add({
      targets: frag,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      y: frag.y - 24,
      duration: 240,
      onComplete: () => {
        frag.destroy();
      }
    });

    // Update HUD
    if (this.fragText) {
      this.fragText.setText(`${this.fragmentsCollected} / ${this.levelConfig.collectibles.length}`);
      this.updateFragmentProgress();
      this.tweens.add({
        targets: this.fragText,
        scale: 1.15,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeOut'
      });
    }

    if (this.scoreText) {
      this.scoreText.setText(`✦ ${this.score} PTS`);
      this.tweens.add({
        targets: this.scoreText,
        scale: 1.14,
        duration: 100,
        yoyo: true,
        ease: 'Sine.easeOut'
      });
    }
  }

  createSparkleEffect(x, y) {
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const spark = this.add.circle(x, y, 3, 0x38bdf8, 1);
      spark.setDepth(25);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 36,
        y: y + Math.sin(angle) * 36,
        alpha: 0,
        scale: 0.1,
        duration: 360,
        onComplete: () => spark.destroy()
      });
    }
  }

  onHitHazard(playerSprite, hazard) {
    if (this.player.isInvulnerable || this.player.isDead) return;

    // Directional knockback away from hazard center with upward bounce
    const hazardCenterX = hazard.hazardCenterX || hazard.x;
    const knockDir = playerSprite.x < hazardCenterX ? -1 : 1;
    const knockSpeedX = knockDir * 200;
    const knockSpeedY = -340; // upward launch so player can clear spikes safely

    this.createHazardImpactEffect(playerSprite.x, playerSprite.y + 20);

    if (this.player.takeDamage(1, false, knockSpeedX, knockSpeedY)) {
      this.updateHealthHUD();
    }
  }

  onHitEnemy(playerSprite, enemy) {
    if (this.player.isInvulnerable || this.player.isDead) return;

    const knockDir = playerSprite.x < enemy.x ? -1 : 1;
    const knockSpeedX = knockDir * 180;
    const knockSpeedY = -280;

    this.createHazardImpactEffect(playerSprite.x, playerSprite.y + 10);

    if (this.player.takeDamage(1, false, knockSpeedX, knockSpeedY)) {
      this.updateHealthHUD();
    }
  }

  createHazardImpactEffect(x, y) {
    const count = 12;
    const color = (this.levelId === 2) ? 0xf43f5e : 0xef4444;
    for (let i = 0; i < count; i++) {
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 4), (i % 2 === 0) ? color : 0xfbbf24, 1);
      spark.setDepth(26);
      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.25, 0.25);
      const speed = Phaser.Math.Between(45, 120);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 18,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(240, 360),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  onReachCheckpoint(playerSprite, checkpoint) {
    if (this.isCheckpointActive) return;

    this.isCheckpointActive = true;
    this.player.setCheckpoint(checkpoint.x, checkpoint.y);

    audioManager.playSfx(this, 'sfx-checkpoint');

    // Visual activation
    checkpoint.setTint(0x38bdf8);
    if (this.checkpointGlow) {
      this.checkpointGlow.setFillStyle(0x34d399, 0.8);
    }

    // Modern floating HUD banner for checkpoint
    this.showCheckpointBanner();
  }

  showCheckpointBanner() {
    const { width } = this.scale;
    const banner = this.add.container(width / 2, -30).setScrollFactor(0).setDepth(130);

    const bannerBg = this.add.rectangle(0, 0, 360, 36, 0x051b2c, 0.96);
    bannerBg.setStrokeStyle(1.5, 0x34d399, 0.85);

    const bannerText = this.add.text(0, 0, '✦ CHECKPOINT ATTUNED · PROGRESS SECURED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      fontStyle: '600',
      color: '#34d399',
      letterSpacing: 1
    }).setOrigin(0.5);

    banner.add([bannerBg, bannerText]);

    this.tweens.add({
      targets: banner,
      y: 72,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: banner,
            y: -40,
            alpha: 0,
            duration: 250,
            ease: 'Cubic.easeIn',
            onComplete: () => banner.destroy()
          });
        });
      }
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
        // Save progress with speedrun time
        saveManager.completeLevel(this.levelId, this.score, this.fragmentsCollected, this.elapsedTime);

        if (this.levelId === 1) {
          this.scene.start('LevelCompleteScene', {
            levelId: 1,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length,
            timeSeconds: this.elapsedTime
          });
        } else {
          // Level 2 complete -> Victory Scene
          this.scene.start('VictoryScene', {
            levelId: 2,
            score: this.score,
            fragments: this.fragmentsCollected,
            totalFragments: this.levelConfig.collectibles.length,
            timeSeconds: this.elapsedTime
          });
        }
      }
    });
  }

  updateHealthHUD() {
    const hp = this.player.health;
    if (this.hpLabel) {
      this.hpLabel.setText(`${hp}/3 HP`);
      this.hpLabel.setColor(hp === 1 ? '#ef4444' : (hp === 2 ? '#f59e0b' : '#38bdf8'));
    }

    this.heartSprites.forEach((heart, idx) => {
      if (idx < hp) {
        heart.setTint(0xffffff);
        heart.setAlpha(1.0);
      } else {
        heart.setTint(0x475569);
        heart.setAlpha(0.3);
      }
    });

    const lostHeart = this.heartSprites[hp];
    if (lostHeart) {
      this.tweens.add({
        targets: lostHeart,
        scale: 0.7,
        duration: 120,
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
      fragments: this.fragmentsCollected,
      timeSeconds: this.elapsedTime,
      hasCheckpoint: this.isCheckpointActive,
      collectedIds: Array.from(this.collectedIds)
    });
  }

  update(time, delta) {
    if (this.levelFinished) return;

    if (this.isPaused) {
      if (this.inputManager) {
        this.inputManager.update();
        if (this.inputManager.state.pauseJustPressed) {
          this.handlePauseToggle();
        } else if (this.inputManager.state.restartJustPressed) {
          this.physics.resume();
          this.scene.restart({ levelId: this.levelId });
        }
      }
      return;
    }

    // Advance speedrun timer
    this.elapsedTime += delta / 1000;
    if (this.timerText) {
      this.timerText.setText('⏱ ' + this.formatTimer(this.elapsedTime));
    }

    // Update Unified Input
    this.inputManager.update();

    // Check Pause & Restart keys
    if (this.inputManager.state.pauseJustPressed) {
      this.handlePauseToggle();
      return;
    }

    if (this.inputManager.state.restartJustPressed) {
      this.physics.resume();
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
    if (this.timerText) this.timerText.setPosition(width / 2 - 40, 33);
    if (this.scoreText) this.scoreText.setPosition(width / 2 + 55, 33);
    if (this.levelBadgeText) this.levelBadgeText.setPosition(width - 88, 33);
    if (this.pauseButton) {
      this.pauseButton.setPosition(width - 44, 33);
      this.pauseButtonIcon.setPosition(width - 44, 33);
    }
    if (this.bgLayer) {
      this.resizeBackground(this.bgLayer, width, height, this.levelConfig);
    }
    if (this.skyTint) {
      this.skyTint.clear();
      this.skyTint.fillGradientStyle(this.levelConfig.bgColor, this.levelConfig.bgColor, 0x050811, 0x050811, 0.15, 0.15, 0.4, 0.4);
      this.skyTint.fillRect(0, 0, width, height);
    }
    if (this.pauseMenu) {
      const wasVisible = this.pauseMenu.visible;
      const curAlpha = this.pauseMenu.alpha;
      this.pauseMenu.destroy();
      this.createPauseMenu();
      if (wasVisible) {
        this.pauseMenu.setVisible(true);
        this.pauseMenu.setAlpha(curAlpha);
      }
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
    if (this.physics && this.physics.world) {
      this.physics.resume();
    }
    if (this.windowKeyDownHandler) {
      window.removeEventListener('keydown', this.windowKeyDownHandler);
      this.windowKeyDownHandler = null;
    }
    if (this.escKey) this.escKey.removeAllListeners();
    if (this.pKey) this.pKey.removeAllListeners();
    if (this.rKey) this.rKey.removeAllListeners();
    if (this.inputManager) {
      this.inputManager.destroy();
    }
  }
}
