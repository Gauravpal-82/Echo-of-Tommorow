/**
 * PlayerController handles physics, movement, ground checks, health, and animations.
 */
import { audioManager } from './AudioManager.js';

export class PlayerController {
  constructor(scene, x, y) {
    this.scene = scene;

    // Movement configuration
    this.speed = 260;
    this.jumpForce = -700;
    this.acceleration = 1200;
    this.drag = 900;
    this.jumpBufferDuration = 220;
    this.coyoteDuration = 130;
    this.jumpBuffer = 0;
    this.coyoteTime = 0;
    
    // Health and state
    this.maxHealth = 3;
    this.health = 3;
    this.isInvulnerable = false;
    this.invulnerabilityDuration = 1500; // ms
    this.isDead = false;

    // Create player physics sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player-idle');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.setDepth(20);
    this.setPlayerTexture('player-idle');
    this.sprite.body.setDragX(this.drag);
    this.sprite.body.setMaxVelocityX(this.speed);
    this.shadow = scene.add.ellipse(x, y + 50, 42, 9, 0x06111f, 0.24).setDepth(18);
    this.aura = scene.add.circle(x, y, 30, 0x38bdf8, 0.08).setDepth(19);
    scene.tweens.add({
      targets: this.aura,
      scale: 1.18,
      alpha: 0.16,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Track spawn point and active checkpoint
    this.spawnPoint = { x, y };
    this.activeCheckpoint = null;
    this.currentVisualState = null;
    this.lastRunDustAt = 0;

    this.setupAnimations();
  }

  setupAnimations() {
    const anims = this.scene.anims;

    // Create safe fallback animations if textures exist
    if (!anims.exists('player_idle') && this.scene.textures.exists('player-idle')) {
      anims.create({
        key: 'player_idle',
        frames: [{ key: 'player-idle' }],
        frameRate: 1,
        repeat: -1
      });
    }

    if (!anims.exists('player_run') && this.scene.textures.exists('player-run')) {
      anims.create({
        key: 'player_run',
        frames: [{ key: 'player-run' }],
        frameRate: 8,
        repeat: -1
      });
    }

    if (!anims.exists('player_jump') && this.scene.textures.exists('player-jump')) {
      anims.create({
        key: 'player_jump',
        frames: [{ key: 'player-jump' }],
        frameRate: 1,
        repeat: 0
      });
    }

    if (!anims.exists('player_fall') && this.scene.textures.exists('player-fall')) {
      anims.create({
        key: 'player_fall',
        frames: [{ key: 'player-fall' }],
        frameRate: 1,
        repeat: 0
      });
    }

    if (!anims.exists('player_damage') && this.scene.textures.exists('player-damage')) {
      anims.create({
        key: 'player_damage',
        frames: [{ key: 'player-damage' }],
        frameRate: 1,
        repeat: 0
      });
    }
  }

  update(inputManager) {
    if (this.isDead) return;

    const body = this.sprite.body;
    const isGrounded = body.blocked.down || body.touching.down;
    const delta = this.scene.game.loop.delta;
    this.aura.setPosition(this.sprite.x, this.sprite.y);
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 50);
    this.shadow.setAlpha(isGrounded ? 0.24 : 0.1);
    this.shadow.setScale(isGrounded ? 1 : 0.72, 1);

    this.jumpBuffer = Math.max(0, this.jumpBuffer - delta);
    this.coyoteTime = isGrounded
      ? this.coyoteDuration
      : Math.max(0, this.coyoteTime - delta);

    // Horizontal movement
    if (inputManager.state.left) {
      body.setAccelerationX(-this.acceleration);
      this.sprite.setFlipX(true);
    } else if (inputManager.state.right) {
      body.setAccelerationX(this.acceleration);
      this.sprite.setFlipX(false);
    } else {
      body.setAccelerationX(0);
    }

    if (inputManager.consumeJumpPress() || (inputManager.state.jump && isGrounded)) {
      this.jumpBuffer = this.jumpBufferDuration;
    }

    if (this.jumpBuffer > 0 && (isGrounded || this.coyoteTime > 0)) {
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
      body.setVelocityY(this.jumpForce);
      audioManager.playSfx(this.scene, 'sfx-jump');
      this.createJumpEffect();
    }

    // Animation state selection
    this.updateAnimation(isGrounded);

    if (isGrounded && Math.abs(body.velocity.x) > 10 && this.scene.time.now - this.lastRunDustAt > 110) {
      this.createRunDust();
      this.lastRunDustAt = this.scene.time.now;
    }

    // Fall out of world check: if player has HP left, deduct 1 HP and respawn at checkpoint; otherwise die
    if (this.sprite.y > this.scene.levelConfig.worldHeight + 40) {
      if (this.isDead) return;

      if (this.health > 1) {
        this.health -= 1;
        audioManager.playSfx(this.scene, 'sfx-damage');
        if (this.scene.updateHealthHUD) {
          this.scene.updateHealthHUD();
        }

        const currentSettings = this.scene.saveSettings || {};
        if (currentSettings.screenShake !== false) {
          this.scene.cameras.main.shake(160, 0.012);
        }

        this.respawnAtLastSafePoint();

        // Flash invulnerability
        this.isInvulnerable = true;
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.3,
          duration: 90,
          yoyo: true,
          repeat: 7,
          onComplete: () => {
            this.sprite.setAlpha(1);
            this.isInvulnerable = false;
          }
        });
      } else {
        this.health = 0;
        if (this.scene.updateHealthHUD) {
          this.scene.updateHealthHUD();
        }
        this.die();
      }
    }
  }

  updateAnimation(isGrounded) {
    if (this.isInvulnerable && this.scene.textures.exists('player-damage')) {
      this.setVisualState('damage', 'player-damage');
      return;
    }

    if (!isGrounded) {
      if (this.sprite.body.velocity.y < 0 && this.scene.textures.exists('player-jump')) {
        this.setVisualState('jump', 'player-jump');
      } else if (this.scene.textures.exists('player-fall')) {
        this.setVisualState('fall', 'player-fall');
      }
    } else if (Math.abs(this.sprite.body.velocity.x) > 10) {
      if (this.scene.textures.exists('player-run')) {
        this.setVisualState('run', 'player-run');
      }
    } else {
      if (this.scene.textures.exists('player-idle')) {
        this.setVisualState('idle', 'player-idle');
      }
    }

    const time = this.scene.time.now;
    const motionAngle = {
      idle: Math.sin(time / 420) * 1.5,
      run: Math.sin(time / 85) * 3,
      jump: this.sprite.flipX ? -3 : 3,
      fall: this.sprite.flipX ? 4 : -4,
      damage: 0
    };
    this.sprite.setAngle(motionAngle[this.currentVisualState] || 0);
  }

  setVisualState(state, textureKey) {
    if (this.currentVisualState === state) return;
    this.currentVisualState = state;
    this.setPlayerTexture(textureKey);
  }

  setPlayerTexture(textureKey) {
    this.sprite.setTexture(textureKey);
    this.sprite.setDisplaySize(86, 100);

    const scaleX = Math.abs(this.sprite.scaleX);
    const scaleY = Math.abs(this.sprite.scaleY);
    this.sprite.body.setSize(38 / scaleX, 88 / scaleY, false);
    this.sprite.body.setOffset(24 / scaleX, 12 / scaleY);
  }

  createRunDust() {
    const direction = this.sprite.flipX ? -1 : 1;
    const dust = this.scene.add.circle(
      this.sprite.x - direction * 16,
      this.sprite.y + 54,
      3 + Math.random() * 2,
      0xd7e8d0,
      0.45
    );
    dust.setDepth(19);
    this.scene.tweens.add({
      targets: dust,
      x: dust.x - direction * 12,
      y: dust.y + 7,
      alpha: 0,
      scale: 1.8,
      duration: 280,
      onComplete: () => dust.destroy()
    });
  }

  createJumpEffect() {
    const fx = this.scene.add.ellipse(this.sprite.x, this.sprite.y + 42, 28, 8, 0xffffff, 0.5);
    this.scene.tweens.add({
      targets: fx,
      scaleX: 1.6,
      scaleY: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => fx.destroy()
    });
  }

  setCheckpoint(x, groundY) {
    // Player height is 100, origin is (0.5, 0.5). Elevate 56px so feet rest 6px above ground surface
    this.activeCheckpoint = { x, y: groundY - 56 };
  }

  takeDamage(amount = 1, forceRespawn = false, knockX = null, knockY = null) {
    if (this.isInvulnerable || this.isDead) return false;

    this.health = Math.max(0, this.health - amount);
    audioManager.playSfx(this.scene, 'sfx-damage');

    // Camera micro-shake respecting settings
    const currentSettings = this.scene.saveSettings || {};
    if (currentSettings.screenShake !== false) {
      this.scene.cameras.main.shake(180, 0.012);
    }

    if (this.health <= 0) {
      this.die();
      return true;
    }

    // Invulnerability flashing
    this.isInvulnerable = true;
    
    // Directional knockback & bounce recovery away from hazard
    if (knockX !== null && knockY !== null) {
      this.sprite.body.setVelocity(knockX, knockY);
    } else {
      const knockDir = this.sprite.flipX ? 1 : -1;
      this.sprite.body.setVelocity(knockDir * 180, -300);
    }

    // Flicker tween
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.isInvulnerable = false;
      }
    });

    if (forceRespawn) {
      this.respawnAtLastSafePoint();
    }

    return true;
  }

  respawnAtLastSafePoint() {
    const target = this.activeCheckpoint || this.spawnPoint;
    const targetY = this.activeCheckpoint ? this.activeCheckpoint.y : this.spawnPoint.y;
    this.sprite.setPosition(target.x, targetY);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAcceleration(0, 0);
    this.sprite.body.reset(target.x, targetY);
    if (this.shadow) this.shadow.setPosition(target.x, targetY + 50);
    if (this.aura) this.aura.setPosition(target.x, targetY);
  }

  die() {
    this.isDead = true;
    this.aura.setVisible(false);
    this.shadow.setVisible(false);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAllowGravity(false);

    if (this.scene.textures.exists('player-death')) {
      this.sprite.setTexture('player-death');
    }

    // Death fade & trigger Game Over scene
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.3,
      y: this.sprite.y - 20,
      duration: 600,
      onComplete: () => {
        this.scene.onPlayerDied();
      }
    });
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setAngle(0);
    this.aura.setVisible(true);
    this.shadow.setVisible(true);
    this.sprite.body.setAllowGravity(true);
    this.respawnAtLastSafePoint();
  }
}
