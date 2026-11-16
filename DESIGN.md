# FIGHTKARO — UI / UX DESIGN DOCUMENT v3

Research → reasoning → shipped specification. Ye document teen sawal answer karta hai:
home screen kashi asavi, baaki menus kase asave, aur match chalu asatana UI kashi
asavi. Pratyek decision mage ek kaaran aahe, ani jo ship zala to neeche "SHIPPED"
block madhe mapan-jokhim (measurement) sobat aahe.

Last updated: after PR #1 merge (3D lighting + 11 GLB roster) on top of UI v3.

---

## 1. METHOD

### Kaya evidence var? 

1. **Open-source fighting game source code** — measurements copy karnya sathi, guess
   nako mhanun:
   - `omf2097/openomf` → `src/game/scenes/arena.c`: health bar 100x8 px at (4,4),
     endurance bar 100x4 px at (4,13). Mhanje HP:stamina = 2:1 ani HUD margin 4 px.
   - `Jared-woodruff/OMF-2097-Remastered` → `src/test/hudBars.test.ts`: damage trail
     bar (pichla HP thoda vel white/red trail mhanun rahato), endurance <50% la flash.
   - `CableDorado2/Ikemen-Plus-Ultra`: round-win pips HUD plate var, announcer text
     bars var nahi.
   - OMF Remastered `src/platform/touch.ts`: stick radius 56 / deadzone 14 / knob 48,
     punch 76px, pause 44px.
2. **Commercial AAA fighting games** (Tekken 8, Street Fighter 6, Mortal Kombat 1,
   Guilty Gear Strive, KOF XV) — pattern level observation: bars fighters var,
   timer centre, resource bar HP khali, damage trail, pips plate var, single primary
   action per screen. (Web search blocked — HTTP 402 — so he research knowledge-based
   aahe, source code che numbers mhanun exact.)
3. **App cha swatah cha build** — 1440x900 desktop ani 390x844 phone var DOM
   measurements (`shots/eval/qameta.js`), karan model screenshots baghu shakat nahi.

### Non-negotiable constraints (project rules)

- Gameplay, combat frame data, super audio cue chain — lai touched nahi.
- Box rig kadhla gela, to parat nahi yeil. GLB load hot nahi to ghost fallback.
- GLB download sathi loading gate, 12s timeout.
- Har button la aslela action real: coin real match ne, finish real material var,
  mission real counter var.
- Devanagari nahi, Roman script. UI cha text English madhe.

---

## 2. DESIGN REASONING SESSION

### Problem statement

Purana build "game" hota pan "product" nahi: menu madhe card grid, glass panels,
random gradients, glow, ani chalnare fake buttons. Player la kadhi sangitla jat nahi
ki "aata kay zale" — model load hotana kahi gate navhta, super chalu asatana
navigation disappear hot hota.

### Chaar prashna, ani uttare

**Q1. Home screen var player la kay disla pahije?**
Uttar: pehla *khel kay aahe* (brand), nantar *kay karu shakto* (actions), shevta
*majha record* (state). Mhanun layout left-right split: brand block + nav, khali
record strip. Card grid nahi karan 8 actions sathi 8 cards = 8 hover states = 8
navigation stops, keyboard player la trias.

**Q2. Menu item madhe kay asave?**
Index (01–08), verb-led label (Fight / Training / Vault / Bazaar / Missions /
Profile / How to Play / Settings), ani ek line meta. Index mule keyboard focus la
ordinal mile, meta mule user la level-2 information mile (bina nava page ughadta).

**Q3. Character select madhe player kay shodhto?**
"Kon aahe" (face + name + team), "kasa aahe" (stats), "kay karto" (super + specials).
Mhanun: var pick plates (P1 left / CPU right), madhe grid, ujvi kade detail panel.
Fight button khali ekach — primary action duplicate nahi.

**Q4. Match madhe player cha dokyavar kay asave?**
Fakt teen: *majha HP kiti shillak*, *mazhi shakti kiti*, *kiti vel shillak*.
Baaki sarva decoration aahe. Mhanun HUD madhe 3 layers: portraits + name/team,
bars, ani centre plate (timer + round pips + gear). Kahi tari extra add karnyapurvi
prashna: "ha number player la decision ghyayla madat karto ka?" — nahi tar te
decoration, te jail.

### Brass & ink — panch niyam

1. **Ek chamfer**: 8px, sarvatra. Doosra angle nahi.
2. **Ink solid, glass nahi**: depth = ek inset highlight + ek drop shadow. Backdrop
   blur nako.
3. **Ek hairline**: 1px brass primary edge var. Border 3D nahi.
4. **Type**: condensed display labels (uppercase, 0.18em tracking), tabular numerals
   numbers sathi. Number kadhi shift hot nahi.
5. **Colour semantic only**: brass = state/primary, red = danger/P2, teal = shakti,
   cream = text. Gradient decorative karnya sathi nahi.

---

## 3. HOME SCREEN — SHIPPED SPEC

```
┌──────────────────────────────────────────────────────────────┐
│  FIGHTKARO            │  01  FIGHT        Kursi Match         │
│  Sansad Showdown      │  02  TRAINING     Dojo                │
│                       │  03  VAULT        Loadout             │
│  [A][B][C][D] theme   │  04  BAZAAR       Spend Coins         │
│                       │  05  MISSIONS     Directives          │
│                       │  06  PROFILE      Record              │
│                       │  07  HOW TO PLAY  Moves               │
│                       │  08  SETTINGS     Audio · UI          │
│  [◈ 680]  build · 1.0 │  Enter / Click                        │
└──────────────────────────────────────────────────────────────┘
```

- Brand mark: `FIGHT` cream + `KARO` brass (bhari weight). Sub: "Sansad Showdown".
- Nav: 76px row, hover/focus var 2px brass rail grows left→right, background brass
  0.06 tint. Focus ring keyboard sathi same rail — duplicating outline nahi.
- Theme switcher: A/B/C/D chips, active chip brass fill + dark ink text.
- Coin chip: menu-foot madhe chhota (28px), full chip economy screens var (42px).
- Build stamp: `meta[name=fk-build]` + "1.0", so player support la exact build sangto.
- Keyboard: ↑/↓ wrap, Enter activates, Esc no-op (menu already root).

Kaay **nahi** aahe: fake "Continue", news ticker menu var (to in-fight sathi), promo
banners, daily-login bait, non-functional social icons.

---

## 4. OTHER MENUS — SHIPPED SPEC

| Screen | Role | Layout | Primary action |
| --- | --- | --- | --- |
| `#select-screen` | kon ladhnar | plates + 6-col grid (11 cards) + detail | `Enter the Arena` |
| `#vs-screen` | load gate | face-off + stage + progress bar | auto-launch (12s cap) |
| `#pause-screen` | interrupt | panel: round + score + 5 actions | `Resume` |
| `#results-screen` | outcome | winner + both sides + 6 stats + pips | `Rematch` |
| `#training-screen` | practice | dummy roster + 3 toggles + reset | `Enter the Dojo` |
| `#vault-screen` | equip | owned finishes grid | `Equip` |
| `#bazaar-screen` | spend | 4 cards, price + afford state | `Buy` |
| `#missions-screen` | tasks | 4 rows: name, progress, claim | `Claim` |
| `#profile-screen` | history | main fighter + 6 stats + usage bars | Back |
| `#settings-screen` | audio/UI | 3 segments + volume slider | Back |
| `#moves-screen` | learn | control legend + per-fighter specials | Back |

**Select grid = 6 columns**, karan 11 fighters: 6+5 rows. 8 columns var cards 108px
khalil jaun face asapeksha chhota hoto.

**VS gate** — model download sathi. Progress 0→100% real `loadCharacterModel`
promises var, 12s timeout, 380ms breathe delay nantar launch. Kaaran: model
download hotana "konta hi fight" dakhvun player la dhoka denied.

**Pause** — engine state `matchActive = false` + music duck 0.08. Round ani score
panel var, karan 90% player pause madhe "mi kontya round madhe aahe" vicharto.

**Results** — 6 stats: Rounds, Time Left, Damage Dealt, Best Combo, Shakti Used,
Kursi Coins. Coins row mule economy transparent rahato: "itke ka mile" cha uttar
screen varach.

**Training Dojo** — dummy picker (11 faces), teen real toggles:
- Infinite Shakti → `p1.shakti = 100` pratyek frame
- Healing Dummy → `p2.hp = p2.maxHp` jेव्हा kami
- Freeze Clock → `game.timer = 60` pinned
Reset → dono fighters centre, HP full, timer 60. Dojo match career record madhe
count hot nahi (`training.active` guard `matchEnd` madhe).

**Vault** — fakt owned finishes. Equip → `glbMats` var emissive hex + intensity,
save `fk.profile.equip`. Late GLB attach zala tari tick madhe sync hoto.

**Bazaar** — 3 paid finishes (400 / 750 / 950) + 1 starter. Disabled state la
"Need 250 more" asa text, fake buy nahi. Koi IAP nahi, koi timer nahi.

**Missions** — 4 counters real match output var: supers >= 3, 5-hit combo,
2-0 sweep, 5 matches. Claim once, `claimed[]` madhe lock.

---

## 5. IN-FIGHT HUD — SHIPPED SPEC

```
┌──────────────────────────────────────────────────────────────────────┐
│ [face] MITRAMAN          ┌────────┐          CHARA KING  [face]      │
│        TEAM VAADA        │  42    │          TEAM LANTERN           │
│ ████████████████░░░░  28 │ ROUND 2│ 28  ░░░░███████████████         │
│ ▬▬▬▬▬▬▬▬ SHAKTI 80%    12 └────────┘  12  SHAKTI 100% ▬▬▬▬▬▬          │
└──────────────────────────────────────────────────────────────────────┘
```

| Token | Value | Kaaran |
| --- | --- | --- |
| `--hp-h` | 28px | OMF 8px x3.4 scale; 1440p var 28px chhaan vachta, mobile var 22px |
| `--sk-h` | 12px | HP:resource = 2:1 (OMF measurement) |
| `--slant` | 20px | HP ani shakti same angle — ekach visual family |
| portrait | 64px duotone | `mix-blend-mode: multiply`, brass halftone overlay |
| name | 17px display | condensed, uppercase, tracking 0.06em |
| pips | 12px, plate var | MK1 pattern: pips HUD plate var, announcer text bars var nahi |
| timer plate | 96x61 | digits 40px tabular; 10s khali `low` class → red pulse |
| gear / settings | 32px, top:140 panel 296px | pause madhe reach hoil asa distance, pan hud-la touch nahi |

**Damage trail** — `#p1-hp-dmg` white-to-red bar HP bar mage, 350ms lag. Kaaran:
player la "koncha damage just ala" cha spatial feedback milato; bina trail la HP
ekdum udun jate ani player confuse hoto.

**Shakti** — 0–100, bharte dmg formula var: attacker `dmg*0.9 + 2`, defender
`dmg*0.6`. 100% la text `SUPER READY` (0.9s pulse) — number vs word: word faster
vachta.

**Centre announcer** — `ROUND 1` / `FIGHT` / `K.O.` — 2.4s, HP bars var overlap
karnar nahi (screen centre free aahe karan timer plate khali aahe).

**Touch / phone** — `#touch-controls` 390px var: stick left 118px, punch right-116
bottom-34, kick right-28 bottom-64, special right-76 bottom-128, pause right-14
top-12 (OMF touch.ts numbers). In-fight settings madhe "Hide touch buttons" toggle
real: `body.hide-touch`.

**News ticker** — fight madhe khali ek line, satire flavour. `prefers-reduced-motion`
la animation band, text static.

---

## 6. THEMES — 4 CONCEPTS, EK CONTRACT

| ID | Naav | Ink | Accent | Kuthla sathi |
| --- | --- | --- | --- | --- |
| A | Obsidian | #05070a | brass #d8b26a | default / cinematic |
| B | Esports | #04070c | lime #c6f432 | bright room, stream overlay |
| C | Cyber | #06040c | magenta #ff2fd0 + cyan | night, RGB setup |
| D | Minimal | #f6f5f2 | ochre #8a6413 | daylight, projector |

Niym: fakt CSS variables badlat (`body[data-theme]`), layout/markup nahi. Mhanun
theme A cha screenshot geometry theme D sarkha exact. Colour semantics kayam:
red = danger, teal = shakti — theme madhe hi badalt nahi.

---

## 7. ECONOMY RULES (real, no dark pattern)

- Win **+60**, loss **+25**. Super **+10** pratyek. 5+ combo **+15**.
- Training match = 0 coins, 0 record. (Dojo practice la punish nahi karto.)
- Bazaar prices 400/750/950 — 4–7 matches = 1 item. Grind nahi, instant nahi.
- Missions 140–260 coins, ekda claim.
- Storage: `fk.profile` (matches, wins, supers, bestCombo, longest, usage, coins,
  owned[], equip, missions{}, claimed[]), `fk.theme`, `fk.ui.settings`.
- Migration: `loadProfile()` juna save normalise karto (coins 150 default, owned la
  `finish-bronze`, missions `{}`), mhanun juna player cha record udat nahi.

---

## 8. WHAT WE REJECTED

| Rejected | Kaaran |
| --- | --- |
| Card-grid dashboard home | 8 actions, 8 hover states, keyboard focus lost; fighting game la brand-first pahije |
| Glassmorphism panels | readability kharab, GPU cost, 4 themes madhe kaam karnar nahi |
| Random decorative gradients | "AI-generated" feeling; colour semantic asayla pahije |
| Fake "Season Pass" / countdown | data nahi, mhanun button pan nahi |
| 8-col select grid for 11 fighters | cards chhota hotat, face olakhaycha rahat nahi |
| Announcer text bars var | HP vachayla adhato (MK1 pips pattern var gelo) |
| Super cut-in full screen | super audio cue chain frame-synced aahe; full-screen cut scene mule desync |

---

## 9. IMPLEMENTATION MAP

| File | Role |
| --- | --- |
| `index.html` | 15 screens, HUD ids, touch controls, `meta[fk-build]` |
| `css/game.css` | tokens, HUD, screens, 4 theme override blocks, economy components |
| `js/screens.js` | navigation, VS gate, pause, results, profile, themes, economy, dojo |
| `js/engine.js` | combat, camera, HUD tick (rules untouched) |
| `js/fighter.js` | rig, GLB attach, `glbMats` (finish target) |
| `js/main.js` | boot, `window.FKUI`, `FKUI_SETTINGS` |
| `DESIGN.md` | he document |

Engine ↔ UI contract: `FKUI.onHit(attacker,dmg)`, `FKUI.onSuper(attacker)`,
`FKUI.matchEnd(game)`, `FKUI_SETTINGS.get/set/apply`, `FKUI.show(id)`.

Fonts: display = `Oswald`/condensed fallback chain, body = system UI, numerals =
`tabular-nums` everywhere a number changes (timer, HP, coins, combo).

---

## 10. QA EVIDENCE

DOM probes (`shots/eval/`), 1440x900 desktop + 390x844 phone:

- Menu: 8 items, theme A default, coin chip 150, no console errors.
- Theme switch A→C: `--ink` = `#06040c`, geometry unchanged.
- Vault/Bazaar/Missions/Training: sab render, 11 dummy cards, 4 bazaar cards, 4 rows.
- Dojo live: `hud.on` true, `p1.shakti = 100`, `timer = 60` frozen, dummy HP 10 → 100.
- Economy: 5 wins → 900 coins, results `+210`, buy 400 → 500, vault 2 cards, equip
  saved as `finish-emerald`, mission claim 500 → 680, menu chip 680. 0 errors.

---

## 11. KNOWN GAPS (honest list)

1. `fights/` audio bed files model-specific aahet, pan 4 nava fighters la shared
   bed vaparla — per-fighter unique bed ajun nahi.
2. Arena select (Sansad / Jantar / Sadak) la VFX budget same aahe; stage-specific
   light rig nahi.
3. Finish fakt emissive tint karto (colour map nahi badalt) — texture-level skin
   set Editor sathi rahila.
4. `build3.mjs` `src-base/original.html` madhun engine generate karto; PR #1 cha 3D
   work fakt `js/` madhe aahe, mhanun build pipeline re-sync honyasathi `src-base`
   update karava lagel. Tevhaparyant `js/` canonical maana.
