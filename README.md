# Sansad Showdown - The Great Kursi Fight

3D browser fighting game. Desi neta roster, real recorded SFX, keyframed skeletal
animation, leg IK, impact VFX and a cinematic camera.

## Run

Double click `Start FightKaro.bat` - it starts the local server and opens the game.

> `index.html` ko seedha double-click mat karo. Browsers `file://` par
> `models/*.glb` block karte hain, isliye fighters purane box rig par
> fallback ho jate hain. Hamesha `Start FightKaro.bat` (ya neeche wala
> server) use karo.

```bash
node serve.mjs        # http://localhost:8150
```

## Layout

| path | what |
| --- | --- |
| `index.html` | page shell + HUD markup |
| `css/game.css` | all UI / HUD styling |
| `js/vendor/three.min.js` | three.js r128 |
| `js/vendor/GLTFLoader.js` | glTF 2.0 loader (Draco + WebP support) |
| `js/vendor/DRACOLoader.js` + `js/vendor/draco/` | Draco mesh decoder |
| `js/data.js` | roster, move frame data, combo scaling |
| `js/clips.js` | real character -> GLB map, animation clip table, hit timings |
| `js/audio.js` | AudioBank - the real fightkaro.com sound set + music beds |
| `js/vfx.js` | ImpactFX - sparks, shockwaves, dust, impact light |
| `js/props.js` | super-move props (chakra, aloo machine, cauldron, bulldozer...) |
| `js/rig.js` | pose math + per-move keyframe clips (primitive fallback rig) |
| `js/fighter.js` | NetaFighter rig, GLB character, two-bone leg IK |
| `js/engine.js` | match engine, combat, camera, HUD |
| `js/main.js` | bootstrap + `window.FK` debug hooks |
| `models/` | 11 rigged GLB netas with their own animation clips |
| `faces/` | 11 face portraits used by the select screen |
| `audio/` | real recordings shipped with the live game |

## Controls (Laptop & Keyboard)

- **Move**: `A` / `D` or `←` / `→` arrows (or Numpad `4` / `6`)
- **Jump**: `W` / `↑` arrow / `E` / `Space` (when Shakti < 100) / Numpad `8`
- **Crouch**: `S` / `↓` arrow / Numpad `2`
- **Block**: Hold Back (`A` or `←` when facing right)
- **Punch**: `J` / `Z` / `F` / Numpad `1`
- **Kick**: `K` / `X` / `H` / Numpad `2`
- **Grab**: `I` / `C` / `G` / Numpad `3` (Unblockable Kursi Grab)
- **Special Moves**: Forward + Punch (`→ + J`), Forward + Kick (`→ + K`), Down + Kick (`↓ + K` Chappal Sweep)
- **Shakti Super (100%)**: `L` / `Space` / `V` / `U` / `O` / `Numpad 0` / `Enter`
- **Touch / Mobile**: On-screen D-pad and combat buttons

## Characters and animation

Each neta is the real rigged GLB from fightkaro.com (`models/*.glb`, Draco
compressed, WebP textures). Every character carries its own clip set, and the
engine maps its move keys onto those clips: strikes are scrubbed so the impact
frame of the animation is exactly where the hitbox fires, guard/walk/crouch/
block/hit/knockdown/getup all use the character's own clips, and the stance
loop is per character. If the GLBs cannot load (`file://`), a primitive
capsule rig with keyframed poses takes over so the game still plays.

## Sound sources

Every clip in `audio/` is a real recording shipped with the live fightkaro.com
game - 100+ files: punch impacts, whoosh, block, gong, round calls, KO sting,
win/lose jingles, per-character voice lines, super beds and releases, UI ticks,
menu/fight music beds. There are no oscillator or generated noises anywhere.
See `audio/README.txt` for the grouping.

## Debug

```js
FK.status()        // state snapshot
FK.move('p1','KICK_2')
FK.sound('hit_heavy')
FK.view(0, 2.4, 6, 0, 1.2, 0)   // freeze + inspect
FK.unfreeze()
```
