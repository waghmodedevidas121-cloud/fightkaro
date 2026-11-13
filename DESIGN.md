# DESIGN - HUD / UI ground truth

Har HUD measurement koi guess nahi hai. Neeche ke open-source fighting games
se `REA` research karke liya gaya hai, phir 1440x900 aur 390x844 par verify kiya.

## Sources

| source | kya liya |
| --- | --- |
| `omf2097/openomf` - `src/game/scenes/arena.c` | health bar 100x8 px at (4,4), endurance 100x4 px at (4,13) -> 2:1 health:stamina, 4px HUD margin, x3.4 scale to screen |
| `Jared-woodruff/OMF-2097-Remastered` - `src/test/hudBars.test.ts` | damage trail bar (pichla HP white trail), endurance bar <50% par flash |
| `CableDorado2/Ikemen-Plus-Ultra` | round-win pips HUD plate par, announcer kabhi bars ke upar nahi |
| `src/platform/touch.ts` (OMF Remastered) | stick radius 56 / deadzone 14 / knob 48, punch 76px right:116 bottom:34, kick right:28 bottom:64, special right:76 bottom:128, pause 44px right:14 top:12 |

## Layout jo ship hua

- `--hp-h: 28px`, `--sk-h: 12px`, `--slant: 20px` (diagonal clip HP + shakti par same angle)
- portrait 64px duotone (`mix-blend-mode: multiply`), name 17px, pips 12px
- timer plate 96x61, digits 40px, gear 32px, settings panel 296px at `top:140px`
- shakti readout meter ke andar (`position:absolute` plate), 540px se neeche hidden
- breakpoints 1080 / 860 / 540 px + `touch-on` / `touch-off` / `hint-off` / `sound-off`

## Settings

`localStorage` key `fk.ui.settings` - `{ touch: 'auto'|'on'|'off', hint, sound }`.
`touch: 'auto'` non-touch device par **off** resolve hota hai, isliye laptop / PC par
on-screen skill buttons by default hide rahte hain (keyboard se khelo).

## Super audio sync

Blind `setTimeout` voice nahi. Har cue animation phase se bandha hai:

- t=0 activation shout + `super_charge`
- strike phase change -> `release_<char>` + bed cut
- progress >= 0.75 -> ek `super_hit` + `boom`

## 3D models & loading screen

- **Box rig permanently removed**: `rigGroup.visible = false` at construction.
- **VS Battle Prep loading gate**: match shuru hone se pehle real `models/*.glb` load hone ka wait karta hai (`#vs-screen` with progress bar & fighter portraits). Slow connection par 12s timeout safety net.
- **Ghost beam fallback**: Model load fail hone par box rig ke bajaye soft glowing light column fighter ko mark karta hai (`showGhost()`).
- `models/*.glb` **sirf http se load hote hain**. `file://` par browser ka CORS
block lagta hai - isliye `Start FightKaro.bat` (`node serve.mjs`) hi entry point hai.
Select screen par card click = us character ka GLB preload.

## UI v3 Screen Architecture

Reverse-engineered from AAA fighting games (TEKKEN 8, Street Fighter 6, Guilty Gear -Strive-, KOF XV) with an original "brass & ink" visual design language:

| Screen | Id | Features |
| --- | --- | --- |
| Satire Notice | `#disclaimer-screen` | Fictional parody notice with "I Understand" entry |
| Boot | `#boot-screen` | Engine initialization progress bar & status hint |
| Main Menu | `#menu-screen` | Brand mark, 01-04 keyboard/click nav, roster preview, live career record card |
| Character Select | `#select-screen` | P1 vs CPU pick plates, 8-card roster grid, dynamic stat radar/bars, arena selector |
| VS / Battle Prep | `#vs-screen` | Faceoff screen with model download gate & progress bar |
| Battle HUD | `#hud` | Slanted chamfered HP bars with damage trail, cyan shakti gauge, timer box, clean controls hint |
| Pause Menu | `#pause-screen` | Background blur, Resume / Restart / Settings / Quit options, live score |
| Match Results | `#results-screen` | Victory/defeat kicker, 1:1 fighter portraits, combat stats (combo, shakti, time, damage), Rematch / Select / Menu actions |
| Settings | `#settings-screen` | Master sound, music slider, touch buttons (Auto/On/Off), controls hint, career reset |
| Career Profile | `#profile-screen` | Most played neta card, matches/wins/win rate/supers/combo/longest stats, per-neta usage breakdown (`localStorage`) |
| How to Play | `#moves-screen` | Full keyboard controls legend, core rules, specials list for all 8 netas |
