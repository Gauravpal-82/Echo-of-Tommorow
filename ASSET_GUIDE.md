# Echoes of Tomorrow - Asset Integration & Upload Guide

Welcome to the **Echoes of Tomorrow** asset customization pipeline! This guide gives you complete instructions on replacing temporary placeholder assets with your own hand-drawn illustrations and audio effects.

---

## 🎯 Quick Start: Top Priority Checklist (Upload These First)

If you are beginning your illustration work, start with these 8 core items in order of visual impact:

1. [ ] **Player Idle Illustration**: `public/assets/player/idle/player-idle.png` (128 × 128 px)
2. [ ] **Wilderness Ground**: `public/assets/platforms/level-1/wilderness-ground.png` (256 × 64 px)
3. [ ] **Wilderness Background**: `public/assets/backgrounds/level-1/wilderness-background.png` (960 × 540 px or 1920 × 1080 px)
4. [ ] **Energy Fragment Collectible**: `public/assets/collectibles/energy-fragment.png` (64 × 64 px)
5. [ ] **Frontier Ground**: `public/assets/platforms/level-2/frontier-ground.png` (256 × 64 px)
6. [ ] **Frontier Background**: `public/assets/backgrounds/level-2/frontier-background.png` (960 × 540 px or 1920 × 1080 px)
7. [ ] **Patrol Crawler Enemy**: `public/assets/enemies/idle/enemy-idle.png` (96 × 96 px)
8. [ ] **Ancient Checkpoint Monolith**: `public/assets/checkpoints/checkpoint.png` (96 × 128 px)

---

## 📁 Complete Folder Structure & File Specifications

### 1. Player Graphics (`public/assets/player/`)
Format: Transparent PNG with 32-bit RGBA color.
Recommended Frame Size: 128 × 128 px (Character centered with feet touching approximately Y=110px).

| Subfolder | Filename | Recommended Dimensions | Description |
|-----------|----------|------------------------|-------------|
| `idle/` | `player-idle.png` | 128 × 128 px | Standing idle pose with subtle breathing or calm stance. |
| `run/` | `player-run.png` | 128 × 128 px | Running forward stride. |
| `jump/` | `player-jump.png` | 128 × 128 px | Upward ascending leap with cloak flowing upward. |
| `fall/` | `player-fall.png` | 128 × 128 px | Downward descent pose. |
| `damage/` | `player-damage.png` | 128 × 128 px | Recoil / stun pose with shield or stagger effect. |
| `death/` | `player-death.png` | 128 × 128 px | Dissolving or fading into glowing particles. |

*Note: The physics engine uses a calibrated inner hitbox (38 × 84 px) centered at the bottom, so your artwork's transparent margins will not snag on platforms!*

---

### 2. Level Backgrounds (`public/assets/backgrounds/`)
Format: Seamless PNG or WebP.

| Subfolder | Filename | Recommended Dimensions | Theme & Mood |
|-----------|----------|------------------------|--------------|
| `level-1/` | `wilderness-background.png` | 960 × 540 px or 1920 × 1080 px | The Lost Wilderness: Twilight sky, rolling misty pine silhouettes, soft dawn mountains. |
| `level-2/` | `frontier-background.png` | 960 × 540 px or 1920 × 1080 px | The Broken Frontier: Deep copper/charcoal industrial twilight, ruined towers, cables. |

---

### 3. Platforms & Walkable Ground (`public/assets/platforms/`)
Format: Transparent PNG with clear top edge for walkability.

| Subfolder | Filename | Dimensions | Description |
|-----------|----------|------------|-------------|
| `level-1/` | `wilderness-ground.png` | 256 × 64 px | Mossy stone, grassy top crest, rocky lower strata. |
| `level-1/` | `wilderness-platform.png` | 256 × 64 px | Floating organic stone ledge with grass edging. |
| `level-2/` | `frontier-ground.png` | 256 × 64 px | Weathered iron plates, bronze rivets, glowing amber conduit. |
| `level-2/` | `frontier-platform.png` | 256 × 64 px | Elevated mechanical catwalk or scaffold platform. |

---

### 4. Enemies (`public/assets/enemies/`)
Format: Transparent PNG.

| Subfolder | Filename | Dimensions | Description |
|-----------|----------|------------|-------------|
| `idle/` | `enemy-idle.png` | 96 × 96 px | Ancient crawler automaton with single glowing red optic. |
| `move/` | `enemy-move.png` | 96 × 96 px | Mechanical walking pose or animated sprite frame. |

---

### 5. Collectibles (`public/assets/collectibles/`)
Format: Transparent PNG with glowing aura.

| Filename | Dimensions | Description |
|----------|------------|-------------|
| `energy-fragment.png` | 64 × 64 px | Octahedral glowing cyan crystal shard with soft outer bloom. Awards +100 points. |

---

### 6. Hazards (`public/assets/hazards/`)
Format: Transparent PNG.

| Filename | Dimensions | Description |
|----------|------------|-------------|
| `spikes.png` | 64 × 48 px | Sharp brambles / thorny spikes or dangerous crystals. |
| `hazard.png` | 64 × 48 px | Unstable energy rifts or electrified coils. |

---

### 7. Checkpoints & Goals (`public/assets/checkpoints/` & `public/assets/goals/`)
Format: Transparent PNG.

| Folder | Filename | Dimensions | Description |
|--------|----------|------------|-------------|
| `checkpoints/` | `checkpoint.png` | 96 × 128 px | Carved stone monolith obelisk; glows bright cyan when attuned. |
| `goals/` | `finish-gate.png` | 128 × 192 px | Ancient dimensional archway beacon marking the level exit. |

---

### 8. Environmental Scenery / Decorations (Non-solid)
Format: Transparent PNG. Placed for atmosphere in the background and foreground without collision.

- `public/assets/environment/level-1/tree.png` (128 × 160 px)
- `public/assets/environment/level-1/rock.png` (64 × 48 px)
- `public/assets/environment/level-1/bush.png` (64 × 48 px)
- `public/assets/environment/level-2/ruin.png` (64 × 96 px)
- `public/assets/environment/level-2/machinery.png` (64 × 64 px)
- `public/assets/environment/level-2/broken-pillar.png` (64 × 96 px)

---

### 9. User Interface & Icons (`public/assets/ui/` & `public/assets/icons/`)
- `public/assets/ui/heart.png` (48 × 48 px): Life heart indicator for the HUD.
- `public/assets/ui/energy-icon.png` (48 × 48 px): Fragment counter icon for the HUD.
- `public/assets/icons/app-icon.png` (512 × 512 px): PWA / app badge icon.

---

### 10. Sound Effects & Music (`public/assets/audio/`)
Format: WAV (16-bit PCM mono or stereo) or OGG/MP3.

- `public/assets/audio/sfx/jump.wav`
- `public/assets/audio/sfx/collect.wav`
- `public/assets/audio/sfx/damage.wav`
- `public/assets/audio/sfx/checkpoint.wav`
- `public/assets/audio/sfx/level-complete.wav`
- `public/assets/audio/sfx/button-click.wav`
- `public/assets/audio/music/background-music.ogg` (Optional ambient loop)

---

## 🛠️ How Replacement Works in Code

All graphic paths are registered in a single central file:
`src/config/assets.js`

If you place a new PNG at the existing path (e.g. `public/assets/player/idle/player-idle.png`), **no code changes are required**! The game automatically loads your illustration on next refresh.

If an asset is missing or corrupted, the game displays a clean development console warning and automatically substitutes a non-crashing procedural fallback so gameplay never breaks.
