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

const drawWildernessPlatform = (x, y, w, h) => {
  if (y < 4) return [0, 0, 0, 0];
  const grassWiggle = Math.sin(x * 0.3) * 3;
  if (y < 12 + grassWiggle) {
    return [78, 154, 72, 255]; // lush grass
  }
  if (y < 18 + grassWiggle) {
    return [54, 102, 58, 255]; // soil
  }
  const rockNoise = Math.sin(x * 0.1) * 8 + Math.cos(y * 0.2) * 6;
  const col = Math.floor(65 + rockNoise);
  if (y >= h - 4) return [30, 36, 40, 255];
  return [col, col + 12, col + 10, 255];
};

const groundPath = 'public/assets/platforms/level-1/wilderness-ground.png';
const platPath = 'public/assets/platforms/level-1/wilderness-platform.png';

fs.mkdirSync(path.dirname(groundPath), { recursive: true });

if (!fs.existsSync(groundPath)) {
  fs.writeFileSync(groundPath, createPng(256, 64, drawWildernessPlatform));
  console.log('Restored wilderness-ground.png');
}

if (!fs.existsSync(platPath)) {
  fs.writeFileSync(platPath, createPng(256, 64, drawWildernessPlatform));
  console.log('Restored wilderness-platform.png');
}
