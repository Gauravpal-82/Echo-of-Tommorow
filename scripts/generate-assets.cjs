const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function createPng(width, height, drawFn) {
  // RGBA buffer with 1 filter byte per row
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const color = drawFn(x, y, width, height) || [0, 0, 0, 0];
      rawData[pixelOffset] = Math.min(255, Math.max(0, color[0]));
      rawData[pixelOffset + 1] = Math.min(255, Math.max(0, color[1]));
      rawData[pixelOffset + 2] = Math.min(255, Math.max(0, color[2]));
      rawData[pixelOffset + 3] = Math.min(255, Math.max(0, color[3]));
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const checksum = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(checksum, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// WAV audio generator
function createWav(durationSec, sampleRate, genFn) {
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.max(-1, Math.min(1, genFn(t, durationSec)));
    const intVal = Math.floor(sampleVal * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

console.log('Generating placeholder illustrations and audio...');

// --- 1. PLAYER ASSETS ---
// Idle pose: hand-drawn adventurer with teal goggles, explorer coat, scarf, boots
const drawPlayer = (pose = 'idle') => (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  
  // Hand-drawn sketch outline helper
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // Head
  const headDist = dist(x, y, cx, cy - 24);
  if (headDist < 16) {
    if (headDist > 14) return [35, 45, 55, 255]; // outline
    // Face skin tone
    return [245, 215, 185, 255];
  }

  // Goggles band / hair
  if (Math.abs(x - cx) < 14 && y > cy - 36 && y < cy - 22) {
    if (Math.abs(y - (cy - 27)) < 3 && Math.abs(x - cx) < 12) {
      // Teal goggles
      return [30, 210, 200, 255];
    }
    // Auburn hair
    return [85, 45, 30, 255];
  }

  // Scarf
  if (Math.abs(x - cx) < 13 && y >= cy - 12 && y <= cy - 5) {
    return [40, 180, 160, 255];
  }

  // Cloak / Jacket
  let bodyYOffset = 0;
  if (pose === 'run') bodyYOffset = Math.sin(x * 0.2) * 2;
  if (pose === 'jump') bodyYOffset = -4;

  const inTorso = Math.abs(x - cx) < 15 && y > cy - 6 + bodyYOffset && y < cy + 24 + bodyYOffset;
  if (inTorso) {
    // Edge outline
    if (Math.abs(x - cx) > 13 || y === cy - 5 || y === cy + 23) return [30, 40, 50, 255];
    // Explorer amber coat with shading
    const shade = (x - cx) * 3;
    return [195 + shade, 130 + shade, 75 + shade, 255];
  }

  // Backpack on back
  if (x >= cx - 18 && x < cx - 12 && y > cy - 4 && y < cy + 18) {
    return [75, 50, 35, 255];
  }

  // Legs / Boots
  const leftLegX = cx - 6;
  const rightLegX = cx + 6;
  
  let leftLegY = cy + 24;
  let rightLegY = cy + 24;

  if (pose === 'run') {
    leftLegY += 4;
    rightLegY -= 2;
  } else if (pose === 'jump') {
    leftLegY -= 6;
    rightLegY -= 3;
  }

  const inLeftLeg = Math.abs(x - leftLegX) < 4 && y >= leftLegY && y < cy + 44;
  const inRightLeg = Math.abs(x - rightLegX) < 4 && y >= rightLegY && y < cy + 44;

  if (inLeftLeg || inRightLeg) {
    // Boots at bottom
    if (y > cy + 34) return [45, 30, 25, 255];
    // Dark explorer trousers
    return [55, 65, 80, 255];
  }

  // Glow aura for damage/jump
  if (pose === 'damage') {
    const fullDist = dist(x, y, cx, cy);
    if (fullDist < 52 && fullDist > 46) return [255, 80, 80, 160];
  }

  return [0, 0, 0, 0];
};

const playerAssets = [
  { path: 'public/assets/player/idle/player-idle.png', pose: 'idle' },
  { path: 'public/assets/player/run/player-run.png', pose: 'run' },
  { path: 'public/assets/player/jump/player-jump.png', pose: 'jump' },
  { path: 'public/assets/player/fall/player-fall.png', pose: 'jump' },
  { path: 'public/assets/player/damage/player-damage.png', pose: 'damage' },
  { path: 'public/assets/player/death/player-death.png', pose: 'damage' },
];

playerAssets.forEach(({ path: p, pose }) => {
  ensureDir(p);
  fs.writeFileSync(p, createPng(128, 128, drawPlayer(pose)));
});

// --- 2. BACKGROUNDS ---
// Level 1: The Lost Wilderness (Hand-drawn atmospheric misty forest with mountain silhouette)
const drawWildernessBg = (x, y, w, h) => {
  const ny = y / h;
  const nx = x / w;

  // Sky gradient: twilight soft violet to golden dawn
  const r = Math.floor(25 + ny * 60 + Math.sin(nx * 3) * 10);
  const g = Math.floor(35 + ny * 75);
  const b = Math.floor(65 + ny * 70);

  // Distant mountain silhouette
  const m1 = Math.sin(nx * 5) * 120 + Math.sin(nx * 12) * 50 + 480;
  if (y > m1) {
    const mist = Math.min(1, Math.max(0, (y - m1) / 300));
    const mr = Math.floor(40 * (1 - mist) + 30 * mist);
    const mg = Math.floor(55 * (1 - mist) + 50 * mist);
    const mb = Math.floor(75 * (1 - mist) + 65 * mist);
    return [mr, mg, mb, 255];
  }

  // Midground rolling pine hills
  const h1 = Math.sin(nx * 8 + 1) * 80 + Math.sin(nx * 19) * 35 + 680;
  if (y > h1) {
    return [24, 44, 38, 255];
  }

  return [r, g, b, 255];
};

ensureDir('public/assets/backgrounds/level-1/wilderness-background.png');
fs.writeFileSync('public/assets/backgrounds/level-1/wilderness-background.png', createPng(960, 540, drawWildernessBg));

// Level 2: The Broken Frontier (Hand-drawn industrial ruins & amber twilight)
const drawFrontierBg = (x, y, w, h) => {
  const ny = y / h;
  const nx = x / w;

  // Sky: deep charcoal to rich burnt copper
  const r = Math.floor(35 + ny * 100);
  const g = Math.floor(20 + ny * 50);
  const b = Math.floor(35 + ny * 45);

  // Distant futuristic ruined spires
  const spireMod = (x % 140);
  if (spireMod < 25 && y > 320) {
    return [30, 22, 28, 255];
  }

  // Foreground ruined bridge arches
  const bridgeY = Math.sin(nx * 6) * 60 + 440;
  if (y > bridgeY) {
    return [26, 20, 24, 255];
  }

  return [r, g, b, 255];
};

ensureDir('public/assets/backgrounds/level-2/frontier-background.png');
fs.writeFileSync('public/assets/backgrounds/level-2/frontier-background.png', createPng(960, 540, drawFrontierBg));

// --- 3. PLATFORMS & GROUND ---
// Wilderness ground & platform (mossy stone, grassy top edge)
const drawWildernessPlatform = (x, y, w, h) => {
  if (y < 4) return [0, 0, 0, 0];
  // Hand-drawn grass tufts on top
  const grassWiggle = Math.sin(x * 0.3) * 3;
  if (y < 12 + grassWiggle) {
    // Lush moss green
    return [78, 154, 72, 255];
  }
  if (y < 18 + grassWiggle) {
    // Soil transition
    return [54, 102, 58, 255];
  }
  // Layered stone rock
  const rockNoise = Math.sin(x * 0.1) * 8 + Math.cos(y * 0.2) * 6;
  const col = Math.floor(65 + rockNoise);
  // Bottom border outline
  if (y >= h - 4) return [30, 36, 40, 255];
  return [col, col + 12, col + 10, 255];
};

ensureDir('public/assets/platforms/level-1/wilderness-ground.png');
fs.writeFileSync('public/assets/platforms/level-1/wilderness-ground.png', createPng(256, 64, drawWildernessPlatform));

ensureDir('public/assets/platforms/level-1/wilderness-platform.png');
fs.writeFileSync('public/assets/platforms/level-1/wilderness-platform.png', createPng(256, 64, drawWildernessPlatform));

// Frontier ground & platform (metallic plating, bronze rivets, amber energy conduit)
const drawFrontierPlatform = (x, y, w, h) => {
  if (y < 4) return [0, 0, 0, 0];
  // Top metal flange
  if (y < 10) return [170, 130, 85, 255];
  // Amber energy conduit stripe
  if (y >= 14 && y <= 18) return [255, 175, 40, 255];
  // Rivets every 32px
  if ((x % 32 < 4) && y > 24 && y < 30) return [210, 160, 100, 255];
  // Weathered bronze-steel bulk
  if (y >= h - 4) return [35, 28, 30, 255];
  const noise = (x * 7 + y * 13) % 20;
  return [60 + noise, 50 + noise, 55 + noise, 255];
};

ensureDir('public/assets/platforms/level-2/frontier-ground.png');
fs.writeFileSync('public/assets/platforms/level-2/frontier-ground.png', createPng(256, 64, drawFrontierPlatform));

ensureDir('public/assets/platforms/level-2/frontier-platform.png');
fs.writeFileSync('public/assets/platforms/level-2/frontier-platform.png', createPng(256, 64, drawFrontierPlatform));

// --- 4. ENEMIES ---
// Ancient mechanical crawler with single red glowing optic
const drawEnemy = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);

  // Main round chassis
  if (dist < 26) {
    if (dist > 23) return [40, 35, 30, 255]; // outline
    // Bronze armor body
    return [160, 105, 55, 255];
  }

  // Glowing red eye visor in center
  const eyeDist = Math.hypot(x - (cx + 4), y - (cy - 2));
  if (eyeDist < 9) {
    if (eyeDist < 4) return [255, 220, 220, 255];
    return [255, 50, 50, 255];
  }

  // Mechanical spider-like legs
  if (y > cy + 12 && y < cy + 32 && (Math.abs(x - cx) > 16 && Math.abs(x - cx) < 36)) {
    return [60, 48, 40, 255];
  }

  return [0, 0, 0, 0];
};

ensureDir('public/assets/enemies/idle/enemy-idle.png');
fs.writeFileSync('public/assets/enemies/idle/enemy-idle.png', createPng(96, 96, drawEnemy));

ensureDir('public/assets/enemies/move/enemy-move.png');
fs.writeFileSync('public/assets/enemies/move/enemy-move.png', createPng(96, 96, drawEnemy));

// --- 5. COLLECTIBLE (ENERGY FRAGMENT) ---
// Glowing octahedral crystal with cyan core and sparkles
const drawCollectible = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  // Rhombus / crystal geometry
  if (dx / 18 + dy / 26 <= 1) {
    // Inner faceting
    if (dx < 6 && dy < 12) return [255, 255, 255, 255];
    if (x < cx) return [40, 230, 220, 255];
    return [20, 180, 190, 255];
  }

  // Outer soft cyan glow
  const haloDist = Math.hypot(x - cx, y - cy);
  if (haloDist < 30) {
    const alpha = Math.floor((1 - (haloDist - 16) / 14) * 120);
    return [60, 240, 230, Math.max(0, alpha)];
  }

  return [0, 0, 0, 0];
};

ensureDir('public/assets/collectibles/energy-fragment.png');
fs.writeFileSync('public/assets/collectibles/energy-fragment.png', createPng(64, 64, drawCollectible));

// --- 6. HAZARDS ---
// Spikes / Brambles
const drawSpikes = (x, y, w, h) => {
  const spikeWidth = 16;
  const localX = x % spikeWidth;
  const peakHeight = h - 6;
  const slope = Math.abs(localX - spikeWidth / 2) / (spikeWidth / 2);
  const allowedY = h - (1 - slope) * peakHeight;

  if (y >= allowedY) {
    // Sharp spike blade / spine
    if (Math.abs(localX - spikeWidth / 2) < 2) return [230, 230, 230, 255];
    // Red danger gradient towards base
    const grad = (y - allowedY) / (h - allowedY);
    return [Math.floor(160 + grad * 80), 30, 40, 255];
  }
  return [0, 0, 0, 0];
};

ensureDir('public/assets/hazards/spikes.png');
fs.writeFileSync('public/assets/hazards/spikes.png', createPng(64, 48, drawSpikes));

ensureDir('public/assets/hazards/hazard.png');
fs.writeFileSync('public/assets/hazards/hazard.png', createPng(64, 48, drawSpikes));

// --- 7. CHECKPOINT ---
// Ancient stone obelisk with glowing cyan rune
const drawCheckpoint = (x, y, w, h) => {
  const cx = w / 2;
  const dx = Math.abs(x - cx);

  // Stepped base
  if (y > h - 16 && dx < 36) return [70, 75, 85, 255];
  if (y > h - 28 && dx < 28) return [80, 85, 95, 255];

  // Tapered monolith body
  const taper = (y / h) * 14;
  if (y > 20 && dx < 12 + taper) {
    // Center glowing rune column
    if (dx < 4 && y > 35 && y < 75) {
      return [40, 245, 225, 255];
    }
    // Stone texture
    const shade = (x - cx) * 2;
    return [100 + shade, 105 + shade, 115 + shade, 255];
  }

  // Capstone pyramid
  if (y <= 20 && y >= 6 && dx < (20 - y) * 0.9) {
    return [120, 125, 135, 255];
  }

  return [0, 0, 0, 0];
};

ensureDir('public/assets/checkpoints/checkpoint.png');
fs.writeFileSync('public/assets/checkpoints/checkpoint.png', createPng(96, 128, drawCheckpoint));

// --- 8. FINISH GATE ---
// Glowing dimensional archway beacon
const drawFinishGate = (x, y, w, h) => {
  const cx = w / 2;
  const dist = Math.hypot(x - cx, (y - 96) * 0.8);

  // Archway pillars
  const isPillar = (x > 14 && x < 34) || (x > w - 34 && x < w - 14);
  if (isPillar && y > 40) {
    return [120, 110, 140, 255];
  }

  // Arch curve top
  if (y < 60 && dist > 36 && dist < 56) {
    return [140, 130, 160, 255];
  }

  // Swirling portal energy in center
  if (dist <= 36 && y > 30) {
    const swirl = Math.sin(dist * 0.4 + (x - cx) * 0.2);
    if (dist < 12) return [255, 255, 255, 255];
    return [Math.floor(180 + swirl * 60), 100, 255, 220];
  }

  return [0, 0, 0, 0];
};

ensureDir('public/assets/goals/finish-gate.png');
fs.writeFileSync('public/assets/goals/finish-gate.png', createPng(128, 192, drawFinishGate));

// --- 9. ENVIRONMENT DECORATIONS ---
// Tree
const drawTree = (x, y, w, h) => {
  const cx = w / 2;
  // Trunk
  if (Math.abs(x - cx) < 10 && y > h - 60) return [70, 45, 30, 255];
  // Foliage hand-drawn puff
  const foliageDist = Math.hypot(x - cx, y - (h - 100));
  if (foliageDist < 46) {
    if (foliageDist < 40) return [45, 115, 60, 255];
    return [30, 80, 45, 255];
  }
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-1/tree.png');
fs.writeFileSync('public/assets/environment/level-1/tree.png', createPng(128, 160, drawTree));

// Rock
const drawRock = (x, y, w, h) => {
  const cx = w / 2;
  const dist = Math.hypot(x - cx, (y - h / 2) * 1.5);
  if (dist < 28) {
    const shade = (x - cx) * 2;
    return [90 + shade, 95 + shade, 105 + shade, 255];
  }
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-1/rock.png');
fs.writeFileSync('public/assets/environment/level-1/rock.png', createPng(64, 48, drawRock));

// Bush
const drawBush = (x, y, w, h) => {
  const cx = w / 2;
  const dist = Math.hypot(x - cx, y - h / 2);
  if (dist < 24) return [55, 130, 70, 255];
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-1/bush.png');
fs.writeFileSync('public/assets/environment/level-1/bush.png', createPng(64, 48, drawBush));

// Level 2 Ruin & Machinery
const drawRuin = (x, y, w, h) => {
  if (x > 10 && x < 54 && y > 20) {
    if (x % 14 < 2) return [160, 130, 90, 255];
    return [90, 80, 95, 255];
  }
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-2/ruin.png');
fs.writeFileSync('public/assets/environment/level-2/ruin.png', createPng(64, 96, drawRuin));

const drawMachinery = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);
  // Cog wheel
  if (dist < 28) {
    if (dist < 10) return [40, 35, 40, 255];
    return [180, 120, 60, 255];
  }
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-2/machinery.png');
fs.writeFileSync('public/assets/environment/level-2/machinery.png', createPng(64, 64, drawMachinery));

const drawBrokenPillar = (x, y, w, h) => {
  if (x > 16 && x < 48 && y > 14) return [80, 75, 85, 255];
  return [0, 0, 0, 0];
};
ensureDir('public/assets/environment/level-2/broken-pillar.png');
fs.writeFileSync('public/assets/environment/level-2/broken-pillar.png', createPng(64, 96, drawBrokenPillar));

// --- 10. UI & ICONS ---
// Heart
const drawHeart = (x, y, w, h) => {
  const nx = (x - w / 2) / (w * 0.4);
  const ny = (y - h / 2 - 2) / (h * 0.4);
  // Heart formula: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
  const f = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * Math.pow(ny, 3);
  if (f <= 0) {
    if (f > -0.2) return [140, 20, 30, 255]; // outline
    return [240, 50, 65, 255];
  }
  return [0, 0, 0, 0];
};
ensureDir('public/assets/ui/heart.png');
fs.writeFileSync('public/assets/ui/heart.png', createPng(48, 48, drawHeart));

// Energy Icon
ensureDir('public/assets/ui/energy-icon.png');
fs.writeFileSync('public/assets/ui/energy-icon.png', createPng(48, 48, drawCollectible));

// App icon (512x512)
const drawAppIcon = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dist = Math.hypot(x - cx, y - cy);

  // Deep twilight gradient background
  const ny = y / h;
  const r = Math.floor(20 + ny * 35);
  const g = Math.floor(25 + ny * 45);
  const b = Math.floor(55 + ny * 60);

  // Center glowing mystic compass emblem
  if (dist < 170) {
    if (dist < 155 && dist > 145) return [255, 210, 100, 255];
    if (dist < 130 && dist > 120) return [40, 230, 220, 200];
    if (dist < 90) {
      const d = Math.abs(x - cx) + Math.abs(y - cy);
      if (d < 70) return [255, 255, 255, 255];
      return [40, 230, 220, 255];
    }
  }

  return [r, g, b, 255];
};
ensureDir('public/assets/icons/app-icon.png');
fs.writeFileSync('public/assets/icons/app-icon.png', createPng(512, 512, drawAppIcon));

// Empty placeholder markers in tiles and effects
ensureDir('public/assets/tiles/README.txt');
fs.writeFileSync('public/assets/tiles/README.txt', 'Custom tile graphics can be placed here.\n');
ensureDir('public/assets/effects/README.txt');
fs.writeFileSync('public/assets/effects/README.txt', 'Custom particle and effect sprites can be placed here.\n');

// --- 11. AUDIO FILES ---
const sfx = [
  {
    path: 'public/assets/audio/sfx/jump.wav',
    duration: 0.18,
    fn: (t, d) => {
      const f = 250 + (t / d) * 450;
      return Math.sin(2 * Math.PI * f * t) * (1 - t / d);
    }
  },
  {
    path: 'public/assets/audio/sfx/collect.wav',
    duration: 0.22,
    fn: (t, d) => {
      const f = t < d * 0.5 ? 587.33 : 880.00; // D5 -> A5 chime
      return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 12);
    }
  },
  {
    path: 'public/assets/audio/sfx/damage.wav',
    duration: 0.25,
    fn: (t, d) => {
      const f = 160 - (t / d) * 90;
      const noise = (Math.random() * 2 - 1) * 0.35;
      return (Math.sin(2 * Math.PI * f * t) * 0.65 + noise) * (1 - t / d);
    }
  },
  {
    path: 'public/assets/audio/sfx/checkpoint.wav',
    duration: 0.45,
    fn: (t, d) => {
      const f1 = 440;
      const f2 = 659.25;
      const f3 = 880;
      return (Math.sin(2 * Math.PI * f1 * t) * 0.3 +
              Math.sin(2 * Math.PI * f2 * t) * 0.4 +
              Math.sin(2 * Math.PI * f3 * t) * 0.3) * (1 - t / d);
    }
  },
  {
    path: 'public/assets/audio/sfx/level-complete.wav',
    duration: 0.75,
    fn: (t, d) => {
      // Fanfare arpeggio
      const step = Math.floor((t / d) * 4);
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      const f = freqs[Math.min(3, step)];
      return Math.sin(2 * Math.PI * f * t) * (1 - (t / d) * 0.7);
    }
  },
  {
    path: 'public/assets/audio/sfx/button-click.wav',
    duration: 0.08,
    fn: (t, d) => {
      const f = 700 - (t / d) * 300;
      return Math.sin(2 * Math.PI * f * t) * (1 - t / d);
    }
  }
];

sfx.forEach(({ path: p, duration, fn }) => {
  ensureDir(p);
  fs.writeFileSync(p, createWav(duration, 22050, fn));
});

console.log('Successfully generated all placeholder artwork and audio assets!');
