import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';
import { audioManager } from './systems/AudioManager.js';

export function createGame() {
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 960,
    height: 540,
    backgroundColor: '#07090e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 1100 },
        debug: false
      }
    },
    scene: [
      BootScene,
      MenuScene,
      GameScene,
      LevelSelectScene,
      GameOverScene,
      LevelCompleteScene,
      VictoryScene,
      CreditsScene
    ],
    input: {
      activePointers: 3
    },
    render: {
      pixelArt: false,
      antialias: true
    }
  };

  const game = new Phaser.Game(config);
  audioManager.setGame(game);

  // Setup non-blocking mobile orientation tip
  setupOrientationTip();

  return game;
}

function setupOrientationTip() {
  const container = document.getElementById('game-container');
  if (!container) return;

  const tip = document.createElement('div');
  tip.id = 'orientation-tip';
  tip.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 text-sky-400 border border-sky-500/50 rounded-full text-xs font-semibold shadow-lg backdrop-blur pointer-events-none transition-opacity duration-300 opacity-0 hidden items-center gap-2';
  tip.innerHTML = '<span>📱 Rotate device to landscape for the optimal adventure experience</span>';
  document.body.appendChild(tip);

  function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth < 800 || ('ontouchstart' in window);
    if (isPortrait && isMobile) {
      tip.classList.remove('hidden');
      requestAnimationFrame(() => tip.classList.remove('opacity-0'));
    } else {
      tip.classList.add('opacity-0');
      setTimeout(() => tip.classList.add('hidden'), 300);
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  checkOrientation();
}
