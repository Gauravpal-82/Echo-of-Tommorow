/**
 * Central Asset Manifest for Echoes of Tomorrow
 * All graphic, audio, and UI asset paths are defined here.
 * Replacing an asset in public/assets/ with a compatible file will automatically be picked up.
 */

export const ASSET_MANIFEST = {
  // Player Character animations and poses
  player: {
    idle: {
      key: 'player-idle',
      path: '/assets/player/idle/player-idle.png',
      width: 128,
      height: 128,
      fallbackColor: 0x4f46e5
    },
    run: {
      key: 'player-run',
      path: '/assets/player/run/player-run.png',
      width: 128,
      height: 128,
      fallbackColor: 0x6366f1
    },
    jump: {
      key: 'player-jump',
      path: '/assets/player/jump/player-jump.png',
      width: 128,
      height: 128,
      fallbackColor: 0x818cf8
    },
    fall: {
      key: 'player-fall',
      path: '/assets/player/fall/player-fall.png',
      width: 128,
      height: 128,
      fallbackColor: 0xa5b4fc
    },
    damage: {
      key: 'player-damage',
      path: '/assets/player/damage/player-damage.png',
      width: 128,
      height: 128,
      fallbackColor: 0xef4444
    },
    death: {
      key: 'player-death',
      path: '/assets/player/death/player-death.png',
      width: 128,
      height: 128,
      fallbackColor: 0x991b1b
    }
  },

  // Level Backgrounds (Layered illustrated backdrops)
  backgrounds: {
    level1: {
      key: 'bg-level-1',
      path: '/assets/backgrounds/level-1/wilderness-background.png',
      width: 960,
      height: 540,
      fallbackColor: 0x1e293b
    },
    level2: {
      key: 'bg-level-2',
      path: '/assets/backgrounds/level-2/frontier-background.png',
      width: 960,
      height: 540,
      fallbackColor: 0x271923
    }
  },

  // Solid Platforms and Walkable Ground
  platforms: {
    level1Ground: {
      key: 'plat-l1-ground',
      path: '/assets/platforms/level-1/wilderness-ground.png',
      width: 158,
      height: 47,
      fallbackColor: 0x334155
    },
    level1Platform: {
      key: 'plat-l1-piece',
      path: '/assets/platforms/level-1/wilderness-platform.png',
      width: 158,
      height: 47,
      fallbackColor: 0x475569
    },
    level2Ground: {
      key: 'plat-l2-ground',
      path: '/assets/platforms/level-2/frontier-ground.png',
      width: 256,
      height: 64,
      fallbackColor: 0x3b2d38
    },
    level2Platform: {
      key: 'plat-l2-piece',
      path: '/assets/platforms/level-2/frontier-platform.png',
      width: 256,
      height: 64,
      fallbackColor: 0x583e50
    }
  },

  // Enemies (Simple patrol crawler)
  enemies: {
    idle: {
      key: 'enemy-idle',
      path: '/assets/enemies/idle/enemy-idle.png',
      width: 96,
      height: 96,
      fallbackColor: 0xb45309
    },
    move: {
      key: 'enemy-move',
      path: '/assets/enemies/move/enemy-move.png',
      width: 96,
      height: 96,
      fallbackColor: 0xd97706
    }
  },

  // Collectibles (Energy Fragments)
  collectibles: {
    energyFragment: {
      key: 'energy-fragment',
      path: '/assets/collectibles/energy-fragment.png',
      width: 31,
      height: 58,
      fallbackColor: 0x06b6d4
    }
  },

  // Hazards (Dangerous spikes / rifts)
  hazards: {
    spikes: {
      key: 'hazard-spikes',
      path: '/assets/hazards/spikes.png',
      width: 64,
      height: 32,
      fallbackColor: 0xdc2626
    },
    spikesL1: {
      key: 'hazard-spikes-l1',
      path: '/assets/hazards/spikes-l1.png',
      width: 64,
      height: 32,
      fallbackColor: 0x991b1b
    },
    spikesL2: {
      key: 'hazard-spikes-l2',
      path: '/assets/hazards/spikes-l2.png',
      width: 64,
      height: 32,
      fallbackColor: 0xe11d48
    },
    hazard: {
      key: 'hazard-generic',
      path: '/assets/hazards/hazard.png',
      width: 64,
      height: 32,
      fallbackColor: 0xb91c1c
    }
  },

  // Checkpoints
  checkpoints: {
    monolith: {
      key: 'checkpoint-monolith',
      path: '/assets/checkpoints/checkpoint.png',
      width: 96,
      height: 128,
      fallbackColor: 0x0284c7
    }
  },

  // Level Exit Gate
  goals: {
    finishGate: {
      key: 'finish-gate',
      path: '/assets/goals/finish-gate.png',
      width: 128,
      height: 192,
      fallbackColor: 0x8b5cf6
    }
  },

  // Environmental Scenery (Non-solid, atmospheric decorations)
  environment: {
    level1: [
      { key: 'env-tree', path: '/assets/environment/level-1/tree.png', width: 107, height: 125 },
      { key: 'env-rock', path: '/assets/environment/level-1/rock.png', width: 64, height: 48 },
      { key: 'env-bush', path: '/assets/environment/level-1/bush.png', width: 64, height: 48 }
    ],
    level2: [
      { key: 'env-ruin', path: '/assets/environment/level-2/ruin.png', width: 64, height: 96 },
      { key: 'env-machinery', path: '/assets/environment/level-2/machinery.png', width: 64, height: 64 },
      { key: 'env-broken-pillar', path: '/assets/environment/level-2/broken-pillar.png', width: 64, height: 96 }
    ]
  },

  // UI Icons
  ui: {
    heart: {
      key: 'ui-heart',
      path: '/assets/ui/heart.png',
      width: 48,
      height: 48
    },
    energyIcon: {
      key: 'ui-energy-icon',
      path: '/assets/ui/energy-icon.png',
      width: 48,
      height: 48
    },
    appIcon: {
      key: 'app-icon',
      path: '/assets/icons/app-icon.png',
      width: 512,
      height: 512
    }
  },

  // Audio SFX & Music
  audio: {
    sfx: {
      jump: { key: 'sfx-jump', path: '/assets/audio/sfx/jump.wav' },
      collect: { key: 'sfx-collect', path: '/assets/audio/sfx/collect.wav' },
      damage: { key: 'sfx-damage', path: '/assets/audio/sfx/damage.wav' },
      checkpoint: { key: 'sfx-checkpoint', path: '/assets/audio/sfx/checkpoint.wav' },
      levelComplete: { key: 'sfx-level-complete', path: '/assets/audio/sfx/level-complete.wav' },
      buttonClick: { key: 'sfx-button-click', path: '/assets/audio/sfx/button-click.wav' }
    },
    music: {
      bgm: {
        key: 'bgm-track',
        path: '/assets/audio/music/background-music.mp3',
        urls: [
          '/assets/audio/music/background-music.mp3',
          '/assets/audio/music/background-music.ogg',
          '/assets/audio/music/background-music.wav'
        ]
      }
    }
  }
};

/**
 * Helper to flat-list all assets for checking and debugging
 */
export function getAllAssetEntries() {
  const list = [];
  function traverse(obj, prefix = '') {
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object') {
        if (val.path && val.key) {
          list.push({ ...val, category: prefix });
        } else if (Array.isArray(val)) {
          val.forEach((item, idx) => {
            if (item.path && item.key) list.push({ ...item, category: `${prefix}.${key}[${idx}]` });
          });
        } else {
          traverse(val, prefix ? `${prefix}.${key}` : key);
        }
      }
    }
  }
  traverse(ASSET_MANIFEST);
  return list;
}
