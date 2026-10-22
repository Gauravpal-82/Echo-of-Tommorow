// Generates a rich, full-fledged electronic adventure BGM track (16 bars @ 124 BPM, 44100Hz 16-bit stereo PCM WAV)
import fs from 'fs';
import path from 'path';

const sampleRate = 44100;
const bpm = 124;
const beatLen = 60 / bpm; // ~0.48387s
const barLen = beatLen * 4; // ~1.93548s
const totalBars = 16;
const totalDuration = barLen * totalBars; // ~30.9677s
const totalSamples = Math.floor(sampleRate * totalDuration);

console.log(`Generating BGM: ${totalBars} bars at ${bpm} BPM (${totalDuration.toFixed(2)}s, ${totalSamples} samples)...`);

const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Note frequencies (Hz)
const NOTES = {
  A1: 55.00, B1: 61.74, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00,
  A2: 110.00, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00,
  A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00
};

// Chords per bar (16 bars total)
const CHORDS = [
  // Section A
  { root: NOTES.A1, notes: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4], bass: [NOTES.A1, NOTES.A2] },
  { root: NOTES.A1, notes: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.C5], bass: [NOTES.A1, NOTES.A2] },
  { root: NOTES.F2, notes: [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4], bass: [NOTES.F2, NOTES.C3] },
  { root: NOTES.F2, notes: [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.A4], bass: [NOTES.F2, NOTES.C3] },
  { root: NOTES.C2, notes: [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4], bass: [NOTES.C2, NOTES.G2] },
  { root: NOTES.C2, notes: [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.E4], bass: [NOTES.C2, NOTES.G2] },
  { root: NOTES.G2, notes: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4], bass: [NOTES.G2, NOTES.D3] },
  { root: NOTES.G2, notes: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.B4], bass: [NOTES.G2, NOTES.D3] },
  // Section B
  { root: NOTES.D2, notes: [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.D4], bass: [NOTES.D2, NOTES.A2] },
  { root: NOTES.D2, notes: [NOTES.D3, NOTES.F3, NOTES.A3, NOTES.F4], bass: [NOTES.D2, NOTES.A2] },
  { root: NOTES.A1, notes: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4], bass: [NOTES.A1, NOTES.E2] },
  { root: NOTES.A1, notes: [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.C5], bass: [NOTES.A1, NOTES.E2] },
  { root: NOTES.F2, notes: [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4], bass: [NOTES.F2, NOTES.C3] },
  { root: NOTES.F2, notes: [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.A4], bass: [NOTES.F2, NOTES.C3] },
  { root: NOTES.E2, notes: [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.E4], bass: [NOTES.E2, NOTES.B2] },
  { root: NOTES.G2, notes: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4], bass: [NOTES.G2, NOTES.D3] }
];

// Lead melody notes (bar, beat within bar, durationInBeats, note)
const MELODY = [
  // Starts on Bar 4 into Bar 5
  { bar: 4, beat: 0, len: 1.5, note: NOTES.E4 },
  { bar: 4, beat: 1.5, len: 0.5, note: NOTES.G4 },
  { bar: 4, beat: 2, len: 1.0, note: NOTES.A4 },
  { bar: 4, beat: 3, len: 1.0, note: NOTES.C5 },
  // Bar 5
  { bar: 5, beat: 0, len: 2.0, note: NOTES.B4 },
  { bar: 5, beat: 2, len: 1.0, note: NOTES.G4 },
  { bar: 5, beat: 3, len: 1.0, note: NOTES.E4 },
  // Bar 6
  { bar: 6, beat: 0, len: 1.5, note: NOTES.D4 },
  { bar: 6, beat: 1.5, len: 0.5, note: NOTES.E4 },
  { bar: 6, beat: 2, len: 2.0, note: NOTES.G4 },
  // Bar 7
  { bar: 7, beat: 0, len: 1.5, note: NOTES.A4 },
  { bar: 7, beat: 1.5, len: 0.5, note: NOTES.B4 },
  { bar: 7, beat: 2, len: 2.0, note: NOTES.C5 },
  // Bar 8
  { bar: 8, beat: 0, len: 1.5, note: NOTES.D5 },
  { bar: 8, beat: 1.5, len: 0.5, note: NOTES.C5 },
  { bar: 8, beat: 2, len: 1.0, note: NOTES.A4 },
  { bar: 8, beat: 3, len: 1.0, note: NOTES.G4 },
  // Bar 9
  { bar: 9, beat: 0, len: 2.5, note: NOTES.F4 },
  { bar: 9, beat: 2.5, len: 0.5, note: NOTES.G4 },
  { bar: 9, beat: 3, len: 1.0, note: NOTES.A4 },
  // Bar 10
  { bar: 10, beat: 0, len: 2.0, note: NOTES.C5 },
  { bar: 10, beat: 2, len: 1.0, note: NOTES.D5 },
  { bar: 10, beat: 3, len: 1.0, note: NOTES.E5 },
  // Bar 11
  { bar: 11, beat: 0, len: 3.0, note: NOTES.A4 },
  { bar: 11, beat: 3, len: 1.0, note: NOTES.G4 },
  // Bar 12
  { bar: 12, beat: 0, len: 1.5, note: NOTES.F4 },
  { bar: 12, beat: 1.5, len: 0.5, note: NOTES.G4 },
  { bar: 12, beat: 2, len: 2.0, note: NOTES.A4 },
  // Bar 13
  { bar: 13, beat: 0, len: 2.0, note: NOTES.C5 },
  { bar: 13, beat: 2, len: 2.0, note: NOTES.B4 },
  // Bar 14
  { bar: 14, beat: 0, len: 1.5, note: NOTES.G4 },
  { bar: 14, beat: 1.5, len: 0.5, note: NOTES.A4 },
  { bar: 14, beat: 2, len: 2.0, note: NOTES.E4 },
  // Bar 15
  { bar: 15, beat: 0, len: 2.0, note: NOTES.G4 },
  { bar: 15, beat: 2, len: 2.0, note: NOTES.A4 }
];

// Helper: noise function for percussion
let noiseSeed = 42;
function fastNoise() {
  noiseSeed = (noiseSeed * 1664525 + 1013904223) | 0;
  return (noiseSeed / 2147483648);
}

// 1. Render Drums & Percussion
for (let bar = 0; bar < totalBars; bar++) {
  const barStart = bar * barLen;
  for (let beat = 0; beat < 4; beat++) {
    const beatTime = barStart + beat * beatLen;

    // Kick Drum (Four-on-the-floor: beats 0, 1, 2, 3)
    const kickSamples = Math.floor(sampleRate * 0.28);
    for (let i = 0; i < kickSamples; i++) {
      const idx = Math.floor((beatTime) * sampleRate) + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const env = Math.exp(-t * 22);
      // Pitch drop from 140Hz down to 42Hz
      const freq = 42 + 98 * Math.exp(-t * 38);
      const click = (i < 80) ? (fastNoise() * 0.3 * (1 - i / 80)) : 0;
      const wave = Math.sin(2 * Math.PI * freq * t) * env * 0.42 + click;
      left[idx] += wave;
      right[idx] += wave;
    }

    // Snare / Clap (Beats 1 and 3)
    if (beat === 1 || beat === 3) {
      const snareSamples = Math.floor(sampleRate * 0.24);
      for (let i = 0; i < snareSamples; i++) {
        const idx = Math.floor((beatTime) * sampleRate) + i;
        if (idx >= totalSamples) break;
        const t = i / sampleRate;
        const env = Math.exp(-t * 18);
        const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * 0.22;
        const noise = fastNoise() * env * 0.26;
        left[idx] += (noise + tone) * 0.88;
        right[idx] += (noise + tone) * 0.94;
      }
    }

    // 16th-note Hi-Hats
    for (let sub = 0; sub < 4; sub++) {
      const hatTime = beatTime + (sub * beatLen) / 4;
      const isOpen = (sub === 2 && (beat === 1 || beat === 3));
      const hatLenSec = isOpen ? 0.12 : 0.04;
      const hatSamples = Math.floor(sampleRate * hatLenSec);
      const decay = isOpen ? 25 : 85;
      const hatVol = (sub === 0) ? 0.14 : (sub === 2 ? 0.18 : 0.08);

      for (let i = 0; i < hatSamples; i++) {
        const idx = Math.floor(hatTime * sampleRate) + i;
        if (idx >= totalSamples) break;
        const t = i / sampleRate;
        const env = Math.exp(-t * decay);
        const wave = fastNoise() * env * hatVol;
        // Subtle stereo panning on hats
        left[idx] += wave * (sub % 2 === 0 ? 0.7 : 0.9);
        right[idx] += wave * (sub % 2 === 0 ? 0.9 : 0.7);
      }
    }
  }
}

// 2. Render Rolling Synth Bass (16th-note rhythmic driving bass)
for (let bar = 0; bar < totalBars; bar++) {
  const chord = CHORDS[bar % CHORDS.length];
  const barStart = bar * barLen;
  const sixteenth = beatLen / 4;

  for (let step = 0; step < 16; step++) {
    const stepTime = barStart + step * sixteenth;
    const isRoot = (step % 4 === 0);
    const isOctave = (step % 2 === 1);
    const noteFreq = isOctave ? chord.root * 2 : chord.root;
    const dur = sixteenth * 0.82;
    const numSamples = Math.floor(sampleRate * dur);

    for (let i = 0; i < numSamples; i++) {
      const idx = Math.floor(stepTime * sampleRate) + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const env = Math.pow(1 - i / numSamples, 1.4);
      // Filtered saw/square bass
      const phase = 2 * Math.PI * noteFreq * t;
      const saw = 2 * ((t * noteFreq) % 1) - 1;
      const sub = Math.sin(phase);
      const wave = (saw * 0.45 + sub * 0.55) * env * 0.28;
      left[idx] += wave;
      right[idx] += wave;
    }
  }
}

// 3. Render Arpeggio (Crystalline sparkling plucks)
for (let bar = 0; bar < totalBars; bar++) {
  const chord = CHORDS[bar % CHORDS.length];
  const barStart = bar * barLen;
  const sixteenth = beatLen / 4;
  const arpNotes = [chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[3], chord.notes[2], chord.notes[1]];

  for (let step = 0; step < 16; step++) {
    const stepTime = barStart + step * sixteenth;
    const note = arpNotes[step % arpNotes.length];
    const numSamples = Math.floor(sampleRate * (sixteenth * 1.8));

    for (let i = 0; i < numSamples; i++) {
      const idx = Math.floor(stepTime * sampleRate) + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const env = Math.exp(-t * 14);
      // Bright plucked triangle + sine
      const tri = Math.asin(Math.sin(2 * Math.PI * note * t)) * (2 / Math.PI);
      const sine = Math.sin(2 * Math.PI * note * 2 * t) * 0.35;
      const wave = (tri + sine) * env * 0.16;

      // Ping-pong stereo pan
      const panL = (step % 2 === 0) ? 0.85 : 0.35;
      const panR = (step % 2 === 0) ? 0.35 : 0.85;
      left[idx] += wave * panL;
      right[idx] += wave * panR;
    }
  }
}

// 4. Render Warm Ambient Pad (Sustained chords with gentle chorus)
for (let bar = 0; bar < totalBars; bar++) {
  const chord = CHORDS[bar % CHORDS.length];
  const barStart = bar * barLen;
  const numSamples = Math.floor(sampleRate * barLen);

  for (let i = 0; i < numSamples; i++) {
    const idx = Math.floor(barStart * sampleRate) + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    // Envelope: soft swell and release
    const fadeIn = Math.min(1, i / (sampleRate * 0.3));
    const fadeOut = Math.min(1, (numSamples - i) / (sampleRate * 0.3));
    const env = fadeIn * fadeOut * 0.12;

    let padL = 0;
    let padR = 0;
    for (const note of chord.notes) {
      // Detuned chorus
      const s1 = Math.sin(2 * Math.PI * note * 0.998 * t);
      const s2 = Math.sin(2 * Math.PI * note * 1.002 * t);
      padL += s1;
      padR += s2;
    }
    left[idx] += (padL / chord.notes.length) * env;
    right[idx] += (padR / chord.notes.length) * env;
  }
}

// 5. Render Lead Melody
for (const mel of MELODY) {
  const melTime = mel.bar * barLen + mel.beat * beatLen;
  const numSamples = Math.floor(sampleRate * (mel.len * beatLen));

  for (let i = 0; i < numSamples; i++) {
    const idx = Math.floor(melTime * sampleRate) + i;
    if (idx >= totalSamples) break;
    const t = i / sampleRate;
    // Vibrato after 0.2s
    const vib = (t > 0.2) ? Math.sin(2 * Math.PI * 5.5 * t) * (mel.note * 0.012) : 0;
    const freq = mel.note + vib;
    const fadeIn = Math.min(1, i / (sampleRate * 0.04));
    const fadeOut = Math.min(1, (numSamples - i) / (sampleRate * 0.08));
    const env = fadeIn * fadeOut * 0.22;

    const saw = 2 * ((t * freq) % 1) - 1;
    const tri = Math.asin(Math.sin(2 * Math.PI * freq * t)) * (2 / Math.PI);
    const wave = (tri * 0.7 + saw * 0.3) * env;

    left[idx] += wave * 0.95;
    right[idx] += wave * 0.95;
  }
}

// 6. Master Limiter & Normalization
let maxPeak = 0;
for (let i = 0; i < totalSamples; i++) {
  if (Math.abs(left[i]) > maxPeak) maxPeak = Math.abs(left[i]);
  if (Math.abs(right[i]) > maxPeak) maxPeak = Math.abs(right[i]);
}
console.log(`Peak audio level before normalization: ${maxPeak.toFixed(3)}`);
const norm = maxPeak > 0 ? (0.92 / maxPeak) : 1;

// Seamless loop smoothing: blend the first and last 2000 samples
const blendSamples = 2000;
for (let i = 0; i < blendSamples; i++) {
  const alpha = i / blendSamples;
  const startIdx = i;
  const endIdx = totalSamples - blendSamples + i;
  const blendedL = left[endIdx] * (1 - alpha) + left[startIdx] * alpha;
  const blendedR = right[endIdx] * (1 - alpha) + right[startIdx] * alpha;
  left[startIdx] = blendedL;
  right[startIdx] = blendedR;
  left[endIdx] = blendedL;
  right[endIdx] = blendedR;
}

// Encode to 16-bit PCM WAV Buffer
const numChannels = 2;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const dataSize = totalSamples * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * blockAlign, 28); // ByteRate
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < totalSamples; i++) {
  const sampleL = Math.max(-1, Math.min(1, left[i] * norm));
  const sampleR = Math.max(-1, Math.min(1, right[i] * norm));
  buffer.writeInt16LE(Math.floor(sampleL * 32767), offset);
  buffer.writeInt16LE(Math.floor(sampleR * 32767), offset + 2);
  offset += 4;
}

const outWav = path.resolve('public/assets/audio/music/background-music.wav');
fs.writeFileSync(outWav, buffer);
console.log(`Saved BGM WAV: ${outWav} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
