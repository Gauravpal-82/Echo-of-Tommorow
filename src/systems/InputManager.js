/**
 * InputManager handles unified keyboard and mobile on-screen touch controls.
 * Prevents page scroll defaults and handles window blur events safely.
 */
import Phaser from 'phaser';

export class InputManager {
  constructor(scene) {
    this.scene = scene;
    
    // Abstract input states
    this.state = {
      left: false,
      right: false,
      jump: false,
      jumpJustPressed: false,
      pauseJustPressed: false,
      restartJustPressed: false
    };

    this.mobileElements = [];
    this.touchActive = {
      left: false,
      right: false,
      jump: false
    };

    this.setupKeyboard();
    this.setupMobileControls();
    this.setupWindowEvents();
  }

  setupKeyboard() {
    const { keyboard } = this.scene.input;
    if (!keyboard) return;

    // Keys
    this.keys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      r: Phaser.Input.Keyboard.KeyCodes.R
    });

    // Prevent default scroll behavior for arrow keys, space, and escape
    keyboard.on('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
      }
    });
  }

  setupMobileControls() {
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    
    // Always create responsive on-screen touch controls that adapt to screen size
    const { width, height } = this.scene.scale;

    // On-screen control container (pinned to camera viewport)
    this.touchContainer = this.scene.add.container(0, 0);
    this.touchContainer.setScrollFactor(0);
    this.touchContainer.setDepth(100);

    // Left button
    const btnSize = 64;
    const padding = 24;

    const leftBtn = this.createTouchButton(
      padding + btnSize / 2,
      height - padding - btnSize / 2,
      btnSize,
      '◀',
      () => { this.touchActive.left = true; },
      () => { this.touchActive.left = false; }
    );

    // Right button
    const rightBtn = this.createTouchButton(
      padding + btnSize * 1.8,
      height - padding - btnSize / 2,
      btnSize,
      '▶',
      () => { this.touchActive.right = true; },
      () => { this.touchActive.right = false; }
    );

    // Jump button (right side)
    const jumpBtn = this.createTouchButton(
      width - padding - btnSize / 2,
      height - padding - btnSize / 2,
      btnSize * 1.15,
      'JUMP',
      () => {
        this.touchActive.jump = true;
        this.state.jumpJustPressed = true;
      },
      () => { this.touchActive.jump = false; }
    );

    this.mobileElements.push(leftBtn, rightBtn, jumpBtn);
    this.touchContainer.add([leftBtn, rightBtn, jumpBtn]);

    // Update positions on screen resize
    this.scene.scale.on('resize', (gameSize) => {
      this.layoutMobileControls(gameSize.width, gameSize.height);
    });

    // If not touch device, make controls semi-transparent but visible
    if (!isTouch) {
      this.touchContainer.setAlpha(0.65);
    }
  }

  createTouchButton(x, y, size, label, onDown, onUp) {
    const container = this.scene.add.container(x, y);

    const outerGlow = this.scene.add.circle(0, 0, size / 2 + 3, 0x0284c7, 0.18);
    const circle = this.scene.add.circle(0, 0, size / 2, 0x0b1728, 0.75);
    circle.setStrokeStyle(1.5, 0x38bdf8, 0.7);

    const innerRing = this.scene.add.circle(0, 0, size / 2 - 6, 0x0f2744, 0.4);
    innerRing.setStrokeStyle(1, 0x38bdf8, 0.25);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: label === 'JUMP' ? '13px' : '20px',
      fontStyle: 'bold',
      color: '#e0f2fe'
    }).setOrigin(0.5);

    circle.setInteractive({ useHandCursor: true });

    circle.on('pointerdown', (pointer) => {
      circle.setFillStyle(0x0284c7, 0.95);
      circle.setStrokeStyle(2, 0xbae6fd, 1);
      outerGlow.setAlpha(0.6).setScale(1.15);
      container.setScale(0.92);
      onDown(pointer);
    });

    const release = () => {
      circle.setFillStyle(0x0b1728, 0.75);
      circle.setStrokeStyle(1.5, 0x38bdf8, 0.7);
      outerGlow.setAlpha(0.18).setScale(1.0);
      container.setScale(1.0);
      onUp();
    };

    circle.on('pointerup', release);
    circle.on('pointerout', release);

    container.add([outerGlow, circle, innerRing, text]);
    container.buttonCircle = circle;
    return container;
  }

  layoutMobileControls(w, h) {
    const btnSize = 64;
    const padding = 24;
    if (this.mobileElements.length >= 3) {
      this.mobileElements[0].setPosition(padding + btnSize / 2, h - padding - btnSize / 2);
      this.mobileElements[1].setPosition(padding + btnSize * 1.8, h - padding - btnSize / 2);
      this.mobileElements[2].setPosition(w - padding - btnSize / 2, h - padding - btnSize / 2);
    }
  }

  setupWindowEvents() {
    this.blurHandler = () => {
      this.resetState();
    };
    window.addEventListener('blur', this.blurHandler);
  }

  resetState() {
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.jumpJustPressed = false;
    this.state.pauseJustPressed = false;
    this.state.restartJustPressed = false;
    this.touchActive.left = false;
    this.touchActive.right = false;
    this.touchActive.jump = false;
  }

  update() {
    const k = this.keys;

    // Movement
    const kbLeft = k ? (k.left.isDown || k.a.isDown) : false;
    const kbRight = k ? (k.right.isDown || k.d.isDown) : false;
    this.state.left = kbLeft || this.touchActive.left;
    this.state.right = kbRight || this.touchActive.right;

    // Jump
    const kbJumpDown = k ? (k.up.isDown || k.w.isDown || k.space.isDown) : false;
    const kbJumpJustDown = k ? (
      Phaser.Input.Keyboard.JustDown(k.up) ||
      Phaser.Input.Keyboard.JustDown(k.w) ||
      Phaser.Input.Keyboard.JustDown(k.space)
    ) : false;

    this.state.jump = kbJumpDown || this.touchActive.jump;
    this.state.jumpJustPressed = kbJumpJustDown || this.state.jumpJustPressed;

    // Pause & Restart
    this.state.pauseJustPressed = k ? (
      Phaser.Input.Keyboard.JustDown(k.esc) || Phaser.Input.Keyboard.JustDown(k.p)
    ) : false;

    this.state.restartJustPressed = k ? Phaser.Input.Keyboard.JustDown(k.r) : false;
  }

  consumeJumpPress() {
    const val = this.state.jumpJustPressed;
    this.state.jumpJustPressed = false;
    return val;
  }

  destroy() {
    if (this.blurHandler) {
      window.removeEventListener('blur', this.blurHandler);
    }
    if (this.touchContainer) {
      this.touchContainer.destroy();
    }
  }
}
