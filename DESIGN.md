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

## 3D models

`models/*.glb` **sirf http se load hote hain**. `file://` par browser ka CORS
block lagta hai aur fighter placeholder box rig par reh jata hai - isliye
`Start FightKaro.bat` (`node serve.mjs`) hi entry point hai.
Select screen par card click = us character ka GLB preload, taaki fight
shuru hote hi asli model tayar ho. Fail hone par 3 retry, aur live download
progress badge fight ke neeche dikhta hai.
