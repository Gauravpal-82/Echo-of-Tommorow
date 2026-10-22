/**
 * Level layouts and object configurations for Echoes of Tomorrow.
 * Exactly two distinct, handcrafted levels with real physical boundaries and calibrated jumps.
 */

export const LEVELS = {
  1: {
    id: 1,
    title: 'The Lost Wilderness',
    subtitle: 'Where nature reclaims the forgotten signals',
    worldWidth: 4300,
    worldHeight: 720,
    bgColor: 0x16202c,
    bgKey: 'bg-level-1',
    groundKey: 'plat-l1-ground',
    platformKey: 'plat-l1-piece',
    musicKey: 'bgm-track',
    
    // Spawn position
    playerStart: { x: 120, y: 520 },

    // Tutorial prompts for level 1
    tutorial: [
      { x: 180, y: 440, text: 'Use A / D or Arrow Keys to Move' },
      { x: 500, y: 440, text: 'Press Space, W, or Up to Jump over gaps' },
      { x: 920, y: 380, text: 'Collect Energy Fragments to power the path' },
      { x: 1450, y: 420, text: 'Danger! Jump over spikes and watch patrol routes' },
      { x: 1950, y: 420, text: 'Ancient Checkpoint: Touch to attune your respawn' },
      { x: 4140, y: 360, text: 'Step into the Finish Beacon to proceed' }
    ],

    // Platforms (Solid physics bodies)
    // Note: y is top-left or center based on setup; here we specify x, y, width, height
    platforms: [
      // Starting safe plateau
      { x: 0, y: 600, width: 640, height: 120, isGround: true },
      
      // Step jump over pit 1
      { x: 680, y: 560, width: 260, height: 48 },
      { x: 980, y: 520, width: 300, height: 48 },
      
      // Main middle meadow
      { x: 1320, y: 600, width: 770, height: 120, isGround: true },
      
      // Checkpoint zone ground
      { x: 2090, y: 600, width: 70, height: 120, isGround: true },
      { x: 2160, y: 600, width: 440, height: 120, isGround: true },

      // Final crossing platforms
      { x: 2600, y: 600, width: 260, height: 120, isGround: true },
      { x: 2860, y: 480, width: 340, height: 240, isGround: true },

      // Longer final route with staggered elevations and wider, jumpable gaps
      { x: 3280, y: 440, width: 220, height: 48 },
      { x: 3590, y: 500, width: 230, height: 48 },
      { x: 3890, y: 560, width: 180, height: 48 },
      { x: 4150, y: 520, width: 150, height: 200, isGround: true }
    ],

    // Energy Fragments (+100 score each)
    collectibles: [
      { id: 'c1_1', x: 380, y: 540 },
      { id: 'c1_2', x: 790, y: 490 },
      { id: 'c1_3', x: 1100, y: 430 },
      { id: 'c1_4', x: 1420, y: 540 },
      { id: 'c1_5', x: 1640, y: 530 },
      { id: 'c1_6', x: 1900, y: 520 },
      { id: 'c1_7', x: 2350, y: 540 },
      { id: 'c1_8', x: 2770, y: 470 },
      { id: 'c1_9', x: 3050, y: 410 },
      { id: 'c1_10', x: 3380, y: 380 },
      { id: 'c1_11', x: 3700, y: 440 },
      { id: 'c1_12', x: 3970, y: 500 },
      { id: 'c1_13', x: 4225, y: 460 }
    ],

    // Hazards (Spikes & thorny brambles - calibrated flush with platform tops)
    hazards: [
      { x: 1420, y: 568, width: 80, height: 32 },
      { x: 2420, y: 568, width: 80, height: 32 },
      { x: 3380, y: 408, width: 64, height: 32 },
      { x: 3930, y: 528, width: 64, height: 32 }
    ],

    // Patrolling Enemies
    enemies: [
      {
        id: 'e1_1',
        x: 1850,
        y: 560,
        patrolLeft: 1780,
        patrolRight: 2050,
        speed: 70
      },
      {
        id: 'e1_2',
        x: 3660,
        y: 460,
        patrolLeft: 3620,
        patrolRight: 3780,
        speed: 82
      }
    ],

    // Checkpoint
    checkpoint: {
      x: 2250,
      y: 600
    },

    // Goal
    finishGate: {
      x: 4225,
      y: 520
    },

    // Non-solid atmospheric decorations firmly rooted into solid ground plateaus
    decorations: [
      { key: 'env-tree', x: 260, y: 600, scale: 1.35 },
      { key: 'env-bush', x: 390, y: 600, scale: 0.85 },
      { key: 'env-rock', x: 470, y: 600, scale: 0.95 },
      { key: 'env-tree', x: 550, y: 600, scale: 1.2 },
      { key: 'env-rock', x: 1480, y: 600, scale: 1.0 },
      { key: 'env-tree', x: 1620, y: 600, scale: 1.4 },
      { key: 'env-bush', x: 1720, y: 600, scale: 0.8 },
      { key: 'env-rock', x: 1980, y: 600, scale: 0.95 },
      { key: 'env-tree', x: 2040, y: 600, scale: 1.3 },
      { key: 'env-bush', x: 2340, y: 600, scale: 0.85 },
      { key: 'env-tree', x: 2520, y: 600, scale: 1.25 },
      { key: 'env-rock', x: 2680, y: 600, scale: 0.9 },
      { key: 'env-bush', x: 2780, y: 600, scale: 0.8 },
      { key: 'env-tree', x: 2940, y: 480, scale: 1.3 },
      { key: 'env-rock', x: 3040, y: 480, scale: 0.95 },
      { key: 'env-tree', x: 3140, y: 480, scale: 1.2 },
      { key: 'env-tree', x: 4170, y: 520, scale: 1.1 }
    ]
  },

  2: {
    id: 2,
    title: 'The Broken Frontier',
    subtitle: 'Echoes among ancient machines and forgotten spires',
    worldWidth: 5000,
    worldHeight: 720,
    bgColor: 0x1f141d,
    bgKey: 'bg-level-2',
    groundKey: 'plat-l2-ground',
    platformKey: 'plat-l2-piece',
    musicKey: 'bgm-track',

    // Spawn position
    playerStart: { x: 140, y: 500 },

    tutorial: [
      { x: 260, y: 440, text: 'Frontier Sector: Elevated walkways ahead' },
      { x: 1200, y: 380, text: 'Patience: Watch enemy patrol boundaries' },
      { x: 2200, y: 340, text: 'Check the lower conduits for bonus fragments' },
      { x: 4320, y: 320, text: 'The final ascent is guarded. Time your jumps!' }
    ],

    // Solid Platforms
    platforms: [
      // Starting ramp
      { x: 0, y: 580, width: 500, height: 140, isGround: true },

      // Ascending stepped structure
      { x: 580, y: 510, width: 180, height: 40 },
      { x: 840, y: 440, width: 220, height: 40 },
      { x: 1140, y: 380, width: 260, height: 40 },

      // Lower conduit bridge (alternative risky path)
      { x: 920, y: 620, width: 340, height: 50 },

      // Middle fortress terrace
      { x: 1480, y: 490, width: 580, height: 230, isGround: true },

      // Chasm crossing steps
      { x: 2140, y: 460, width: 170, height: 40 },
      { x: 2380, y: 400, width: 180, height: 40 },

      // Checkpoint haven
      { x: 2640, y: 480, width: 380, height: 240, isGround: true },

      // Final elevated ruin assault
      { x: 3100, y: 420, width: 190, height: 40 },
      { x: 3360, y: 360, width: 200, height: 40 },

      // Final terminal summit
      { x: 3620, y: 440, width: 180, height: 280, isGround: true },

      // Extended final gauntlet
      { x: 3890, y: 400, width: 170, height: 40 },
      { x: 4165, y: 460, width: 210, height: 40 },
      { x: 4470, y: 380, width: 180, height: 40 },
      { x: 4745, y: 440, width: 255, height: 280, isGround: true }
    ],

    // Energy Fragments
    collectibles: [
      { id: 'c2_1', x: 320, y: 510 },
      { id: 'c2_2', x: 670, y: 440 },
      { id: 'c2_3', x: 950, y: 370 },
      { id: 'c2_4', x: 1080, y: 550 }, // Lower bonus
      { id: 'c2_5', x: 1560, y: 420 },
      { id: 'c2_6', x: 1770, y: 420 },
      { id: 'c2_7', x: 2220, y: 390 },
      { id: 'c2_8', x: 2470, y: 330 },
      { id: 'c2_9', x: 2780, y: 410 },
      { id: 'c2_10', x: 3200, y: 350 },
      { id: 'c2_11', x: 3460, y: 290 },
      { id: 'c2_12', x: 3670, y: 370 },
      { id: 'c2_13', x: 3970, y: 340 },
      { id: 'c2_14', x: 4260, y: 400 },
      { id: 'c2_15', x: 4550, y: 320 },
      { id: 'c2_16', x: 4860, y: 380 }
    ],

    // Hazards (Plasma conduits and high-energy barbs - calibrated flush with platforms)
    hazards: [
      { x: 1140, y: 588, width: 80, height: 32 },
      { x: 1740, y: 458, width: 96, height: 32 },
      { x: 2840, y: 448, width: 80, height: 32 },
      { x: 4220, y: 428, width: 72, height: 32 },
      { x: 4515, y: 348, width: 64, height: 32 }
    ],

    // Patrolling enemies (carefully positioned away from hazard zones)
    enemies: [
      {
        id: 'e2_1',
        x: 1600,
        y: 450,
        patrolLeft: 1510,
        patrolRight: 1680,
        speed: 85
      },
      {
        id: 'e2_2',
        x: 1940,
        y: 450,
        patrolLeft: 1870,
        patrolRight: 2020,
        speed: 95
      },
      {
        id: 'e2_3',
        x: 3180,
        y: 380,
        patrolLeft: 3130,
        patrolRight: 3260,
        speed: 90
      }
    ],

    // Checkpoint
    checkpoint: {
      x: 2720,
      y: 480
    },

    // Final Goal
    finishGate: {
      x: 4870,
      y: 440
    },

    // Non-solid atmospheric decorations firmly rooted into solid ground plateaus
    decorations: [
      { key: 'env-ruin', x: 280, y: 580, scale: 1.0 },
      { key: 'env-machinery', x: 420, y: 580, scale: 0.85 },
      { key: 'env-broken-pillar', x: 1540, y: 490, scale: 1.0 },
      { key: 'env-machinery', x: 1680, y: 490, scale: 0.8 },
      { key: 'env-broken-pillar', x: 1960, y: 490, scale: 0.95 },
      { key: 'env-ruin', x: 2020, y: 490, scale: 0.85 },
      { key: 'env-ruin', x: 2680, y: 480, scale: 0.95 },
      { key: 'env-machinery', x: 2940, y: 480, scale: 0.85 },
      { key: 'env-broken-pillar', x: 3700, y: 440, scale: 1.0 },
      { key: 'env-machinery', x: 4780, y: 440, scale: 0.85 },
      { key: 'env-ruin', x: 4940, y: 440, scale: 1.0 }
    ]
  }
};
