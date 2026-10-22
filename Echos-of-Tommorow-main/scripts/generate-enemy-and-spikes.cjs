const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  crcTable[i] = c;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
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

function createPng(width, height, drawFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0;
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
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdrData),
    createChunk('IDAT', deflated),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

// 1. ENEMY AUTOMATON (Spherical bronze crawler with snout, tail, mechanical legs, and glowing blue eye)
// Matches user's Enemy-removebg-preview.png
const drawEnemyAutomaton = (frame = 0) => (x, y, w, h) => {
  const cx = w * 0.52;
  const cy = h * 0.44;

  // Snout on left
  const inSnout = (x >= cx - 36 && x <= cx - 18 && y >= cy - 6 && y <= cy + 6);
  if (inSnout) {
    if (x <= cx - 33 || y === cy - 6 || y === cy + 6) return [25, 20, 18, 255]; // dark outline
    return [85, 60, 48, 255]; // dark bronze snout
  }

  // Tail on right
  const inTail = (x >= cx + 22 && x <= cx + 38 && y >= cy - 8 && y <= cy + 4);
  if (inTail) {
    const tailY = (x - (cx + 22)) * -0.3;
    if (Math.abs(y - (cy + tailY)) < 5) {
      if (Math.abs(y - (cy + tailY)) > 3) return [25, 20, 18, 255];
      return [90, 65, 50, 255];
    }
  }

  // Four spindly mechanical legs below
  // Leg wobble for walk animation
  const legWiggle = frame === 1 ? Math.sin(x * 0.2) * 2 : 0;
  
  // Left legs (front/back)
  const isLeg1 = (Math.abs(x - (cx - 18 + legWiggle)) < 3 && y >= cy + 18 && y <= cy + 32);
  const isLeg2 = (Math.abs(x - (cx - 6 - legWiggle)) < 3 && y >= cy + 18 && y <= cy + 30);
  // Right legs
  const isLeg3 = (Math.abs(x - (cx + 10 + legWiggle)) < 3 && y >= cy + 18 && y <= cy + 30);
  const isLeg4 = (Math.abs(x - (cx + 22 - legWiggle)) < 3 && y >= cy + 18 && y <= cy + 32);

  // Leg feet pads
  const isFoot1 = (Math.abs(x - (cx - 21)) < 5 && y >= cy + 30 && y <= cy + 34);
  const isFoot4 = (Math.abs(x - (cx + 25)) < 5 && y >= cy + 30 && y <= cy + 34);

  if (isLeg1 || isLeg2 || isLeg3 || isLeg4 || isFoot1 || isFoot4) {
    return [40, 32, 28, 255];
  }

  // Main barrel body (round/oval)
  const dx = (x - cx) / 24;
  const dy = (y - cy) / 21;
  const distSq = dx * dx + dy * dy;

  if (distSq <= 1.0) {
    // Dark outer casing border
    if (distSq > 0.88) {
      return [30, 22, 18, 255];
    }

    // Outer bronze casing ring with shading
    if (distSq > 0.55) {
      const shade = (x - cx) * 2;
      return [115 + shade, 80 + shade, 60 + shade, 255];
    }

    // Inner eye bevel ring
    if (distSq > 0.45) {
      return [20, 35, 45, 255]; // dark bezel
    }

    // Glowing cyan-blue optic lens in center
    const eyeDist = Math.hypot(x - cx, y - cy);
    if (eyeDist <= 12) {
      // Hot white center glow
      if (eyeDist < 4) {
        return [220, 250, 255, 255];
      }
      // Bright cyan energy
      if (eyeDist < 8) {
        return [40, 215, 245, 255];
      }
      // Deep blue optic rim
      return [14, 130, 190, 255];
    }
  }

  return [0, 0, 0, 0];
};

// 2. SPIKES HAZARD (4 sharp triangular pyramid spikes with sandstone/bronze facets)
// Matches user's Spikes-removebg-preview.png
const drawPyramidSpikes = (x, y, w, h) => {
  const numSpikes = 4;
  const spikeWidth = w / numSpikes; // e.g. 128 / 4 = 32px per spike
  const spikeIndex = Math.floor(x / spikeWidth);
  const localX = x - (spikeIndex * spikeWidth);
  const peakX = spikeWidth * 0.5;
  const peakY = 6;
  const baseY = h - 6;

  // Pyramid slope test
  const normalizedDistFromCenter = Math.abs(localX - peakX) / (spikeWidth * 0.44);
  const allowedY = peakY + normalizedDistFromCenter * (baseY - peakY);

  if (y >= allowedY && y <= baseY + 4) {
    // Rocky dark base at bottom
    if (y > baseY - 4) {
      const rockNoise = ((x * 13 + y * 17) % 25);
      return [55 + rockNoise, 45 + rockNoise, 40 + rockNoise, 255];
    }

    // Facet division line running down from apex
    if (Math.abs(localX - peakX) < 1.5) {
      return [35, 30, 28, 255]; // dark facet crease
    }

    // Left facet: Illuminated warm light sandstone / pale bronze
    if (localX < peakX) {
      const grad = (y - peakY) / (baseY - peakY);
      const r = Math.floor(215 - grad * 35);
      const g = Math.floor(190 - grad * 35);
      const b = Math.floor(165 - grad * 35);
      return [r, g, b, 255];
    }

    // Right facet: Shaded darker bronze stone
    const grad = (y - peakY) / (baseY - peakY);
    const r = Math.floor(145 - grad * 40);
    const g = Math.floor(125 - grad * 40);
    const b = Math.floor(110 - grad * 35);
    return [r, g, b, 255];
  }

  return [0, 0, 0, 0];
};

// Generate Enemy files
const enemyDir = 'public/assets/enemies';
fs.mkdirSync(`${enemyDir}/idle`, { recursive: true });
fs.mkdirSync(`${enemyDir}/move`, { recursive: true });

fs.writeFileSync(`${enemyDir}/idle/enemy-idle.png`, createPng(96, 96, drawEnemyAutomaton(0)));
fs.writeFileSync(`${enemyDir}/move/enemy-move.png`, createPng(96, 96, drawEnemyAutomaton(1)));
console.log('Successfully generated enemy-idle.png and enemy-move.png matching user upload!');

// Generate Spikes files
const hazardDir = 'public/assets/hazards';
fs.mkdirSync(hazardDir, { recursive: true });

fs.writeFileSync(`${hazardDir}/spikes.png`, createPng(128, 48, drawPyramidSpikes));
fs.writeFileSync(`${hazardDir}/hazard.png`, createPng(128, 48, drawPyramidSpikes));
console.log('Successfully generated spikes.png and hazard.png matching user upload!');
