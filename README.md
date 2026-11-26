# Auradon · Seattle spell slab prototype

A mobile-first pixel-art game with a Seattle map, an Auradon team library, and a two-player battle arena. Saved Auradon teams can face each other on one screen. The original wizard duels also support separate browsers connected to a room server.

[Open Auradon](https://carsahhex-byte.github.io/Auradon/#title) starts at the title screen. A new duel starts at **100 / 100 HP, 3 / 10 Mana, and 0 / 30 Shield**; the second number is each resource's maximum.

## Run

Requires Node.js 24 or later, including its built-in SQLite support for accounts. There are no npm dependencies to install. Shared-screen play needs no credentials or external services. Two-screen play needs the included room server running locally or on an HTTPS host.

```sh
cd Auradon
npm start
```

The server listens on port **5173**. Set `PORT` to use another port. `npm run dev` starts the same development server; refresh the browser after editing files.

```sh
npm test          # game engine, deck validation, and spell-effect tests
npm run build    # syntax validation and a static release in dist/
npm run build:web # hosted review build, including optional galleries and experiments
npm run build:production # game-only hosted release, with optimized artwork
npm run preview  # serve the built release on port 5173
npm run multiplayer # serve the built app and room API on port 8788
```

The frontend can run on a static web server at a project path such as `/Auradon/`. The browser stores shared-screen duels and guest decks. Signing in syncs the account profile and saved Fire, Water, and Earth decks across devices. Two-screen play sends actions to the room server and stores a private room token for reconnecting.

Guest profiles, local duels, and existing guest decks share Auradon-specific storage across releases on the same browser and origin.

For two phones on the same Wi-Fi, run `npm run build:web` followed by `npm run multiplayer`. Open `http://YOUR_MAC_WIFI_IP:8788/#title` in Safari on both phones. Find the Mac's address in **System Settings → Wi-Fi → Details → TCP/IP**. Open the room lobby at `#online`, enter the same **Game server address**, and use **Create battle →** or **Join →** with the eight-character room code. Keep the Mac awake and the server running. Remote players need an HTTPS game server. See the [multiplayer setup guide](docs/multiplayer.md).

## Screens and battles

### Home map

The title screen opens the expanded Seattle map. Use the top controls to zoom, fit the whole map, or return to South Lake Union. The wizard icon marks the preview location. Selecting one of the 14 grey district markers **1–12, 14 and 15** opens its Storybook page with that district expanded. **14** is South Lake Union, and **15** is Seattle Center, which includes Queen Anne. Storybook lists each district’s **Mainquest N** label and assigned boss name.

The circular button in the lower-left corner opens the map menu. The menu slides up over the lower half of the map. Each destination opens a navy page with its title and a **Back** button.

| Menu title | Route |
| --- | --- |
| Auradons | `#menu/dons` |
| Inventory | `#menu/inventory` |
| Storybook | `#menu/storybook` |
| Settings | `#menu/settings` |
| Friends | `#menu/friends` |
| Auradon Library | `#menu/auradon-library` |
| Battle | `#menu/battle` |

The Rolodex is at `#dons`, the Friends screen at `#friends`, and the room lobby at `#online`. Character stores your wizard name and element and links to account sign-in.

### Auradon teams and moves

In **Auradon Library**, add up to six Auradons to a team and save it with a name. You can save multiple teams and choose which one appears in **Auradons**. Open a team member to view its sprite, Stats and Moves. Use the type dropdowns in **Moves** to choose up to four moves for that member. Saved teams and move selections are stored on this device.

In **Battle**, select a saved team for each player. The Seattle arena shows the first player close on the left and the second player farther away on the right. Choose **Fight** to open your four moves. Choosing a move plays a short pixel effect, then shows the outcome. Players who prefer reduced motion see the result immediately. All Auradon moves cost 0 mana during this playtest. To switch, open **Auradons**, select a reserve and confirm. A replacement after a knockout is free. **Escape** opens a confirmation before ending the match. The Ice move list is pending, and Xineoph is reserved for later.

Each attack uses its move’s type against each defending type and multiplies the results. A weakness (2×) and a resistance (0.5×) cancel. An Ice/Wild Auradon takes 4× from Metal. Dragon and Cosmic each deal 2× damage to Void in this playtest. A single matchup that appears as both an outgoing strength and an incoming weakness counts once.

### Rolodex

In the Rolodex, scroll the vertical list of thumbnails and choose any entry from **Aur-1** through **Aur-11**. The selected Don appears in the large panel above the list. Each approved sprite uses at most 16 colors and has a transparent background.

#### Don type and starter reference

| Don | Type | Starter plan |
| --- | --- | --- |
| Aur-1 | Fire | Fire starter with planned final type Fire/Air |
| Aur-2 | Earth | Earth starter with planned final type Earth/Metal |
| Aur-3 | Ice/Wild | |
| Aur-4 | Nature | |
| Aur-5 | Nature/Wild | |
| Aur-6 | Water | Evolves from Aur-6.1 |
| Aur-6.1 | Water | Water starter and pre-evolution of Aur-6. Temporary tag. |
| Aur-7 | Dragon/Air | |
| Aur-8 | Cosmic | |
| Aur-9 | Water | |
| Aur-10 | Nature | |
| Aur-11 | Dragon/Electric | |
| Flixerces | Fire/Air | Provisional typing |
| Samuram | Earth/Metal | Provisional typing |

### Wizard duels

The current spellbook contains **Heatbox, Blaze, Charred Blade, Xineoph, Sunsetter, Anti-Furnace, Sea bolt, Swell, Carbonate, Pacific, Poseidon’s Rift, OffoDefo, Bengal Shield, Earthbound, Merciful, Tectonic, Metamorphic, Fortune, Misfortune, and Twist**. Spell Tower shows the deck in use during a battle.

Choose Fire, Water, or Earth for each player when starting a battle. Each seat uses its compatible saved deck or a 12-slab starter for an empty slot. The starter is assigned for the match and the saved slot stays empty. Saved compositions can contain **1–30 slabs** of one element plus Fate, with unlimited copies per spell. See the [deck and spellbook reference](docs/decklists.md).

Start shared-screen play from the Friends screen at `#friends`, or use the battle chooser at `#battle-setup`. The room lobby is at `#online`. Guest rooms use each device’s saved deck or starter. Signed-in rooms use the account’s saved deck or the server’s starter for the selected element. Each player has a private hand and can reconnect by player token. The room server validates actions and handles shuffling and dice. Rooms are held in memory, so a server restart can end a match.

## Accounts and saved decks

Open **Account** from the title or Character screen. Create a username and password on your game server to carry over this device’s profile and compatible saved decks. Sign in to that account on another device to use the same profile and decks. Signing out brings back the guest profile and its decks.

The server stores accounts, legal decks, salted password hashes, and hashed 30-day sessions in SQLite. `npm run multiplayer` uses `data/auradon.sqlite` by default; set `AURADON_ACCOUNT_DB_PATH` to another persistent file. This is separate from room storage: accounts survive a server restart when the database file is retained, while active rooms still reset. Database files are excluded from Git and Docker build contexts. Remote sign-in needs HTTPS. The beta has no email service or automated password recovery.

For hosted accounts, choose persistent storage and back it up. An ephemeral free instance can lose account data on a redeploy even though the login code works. The Docker image uses `/data/auradon.sqlite`; mount a named volume at `/data`. The [setup guide](docs/multiplayer.md) includes account setup, persistent-disk settings, and backup instructions.

## Hosting on Netlify

Import `carsahhex-byte/Auradon` in Netlify and choose production branch **`main`**. The committed `netlify.toml` selects `npm run build:production`, publish directory `dist`, and Node 24. Open the generated site at `/#title`. Future pushes can deploy automatically without GitHub Pages. Follow the [step-by-step Netlify setup guide](docs/netlify.md).

Netlify serves the static game. Configure a separate HTTPS game server for accounts and two-screen play. Add the final Netlify origin to that server’s `AURADON_ALLOWED_ORIGINS` and enter the server address in the app. Guest saves belong to their original website origin. Account profiles and saved decks follow the account across sites that use the same game server.

## Hosting on GitHub Pages

The connected repository is `carsahhex-byte/Auradon`. Run `npm run deploy:pages` to test, build the hosted release, and upload only `dist/` to its `gh-pages` branch. The deployment script uses a temporary Git index and preserves the current source branch and working tree. It never force-pushes. To prepare a deployment commit without uploading it, build with `npm run build:production` and run `node scripts/deploy-pages.js`. The publisher requires the game-only distribution, which omits optional artwork-review galleries and the drawing experiment while preserving the complete game, all runtime art, and the original files in this repository.

Enable hosting once in the repository's **Settings → Pages**:

1. Set **Source** to **Deploy from a branch**.
2. Select **gh-pages** and **/ (root)**.
3. Click **Save**, then wait for GitHub's Pages deployment to complete.

The project site is `https://carsahhex-byte.github.io/Auradon/`. Verify the Pages deployment in GitHub Actions after each publish.

Later `npm run deploy:pages` uploads update the same site. Shared-screen play needs no extra hosting account, image service, custom domain, or application API key. Two-screen play also requires a running room server; its separate deployment is described in [docs/multiplayer.md](docs/multiplayer.md). GitHub account/plan eligibility for Pages is determined by GitHub's settings page.

Hosted CSS and every JavaScript module use filenames hashed from their final content, including rewritten dependency imports. `build-info.json`, the `auradon-build` HTML metadata, and the build number in game Settings identify the release. Each hosted build also provides `auradon-<build-id>.html` and records that fresh launch address in `build-info.json`; it opens the same game and shares the same saved decks and duels. A hosted entry checks for a newer release without using a cached manifest. It redirects before interaction, or offers an update button after interaction so a running game is not unexpectedly reloaded. The GitHub Pages deployment script retains older launch addresses as aliases to the latest release. On Netlify, share and bookmark the stable base address followed by `/#title`.

For a no-install version, build the project and open **`dist/auradon.html`** directly in a browser. This single-file version includes all scripts, styles, and the supplied artwork. Hosted saves are shared across game paths on the same origin, including the fresh launch file for each update. Different domains or browser profiles have separate saves; file-based storage support depends on the browser.

## Artwork and layout

The uploaded PNGs remain unmodified in `public/graphics/`, including graphics reserved for later updates. New AI-generated title, Seattle map, icon, and app artwork provide the mobile preview. `src/assets.js` maps the graphics used by this version and records crop metadata that hides transparent export margins at rendering time. Pixel rendering keeps the art crisp. The hand frame uses nine-slice layout so its corners remain intact as the card area changes size.

The hosted build uses the required images from `public/optimized/`, encoded as lossless WebP with content-hashed filenames for caching. Their decoded RGBA pixels are byte-for-byte identical to the originals, and they load separately rather than being embedded in the HTML. Original and unused artwork and the large standalone download are excluded from the hosted release.

The active named slabs keep the existing hand size and frames. Xineoph uses its approved solid-gold phoenix illustration, with flowing light blades, sparkles and a subtle fiery background. Charred Blade retains its rough 8-bit flaming sword. Existing uploaded PNG bytes remain unchanged; both illustrations are separate assets displayed inside the existing slab frames. Internal Fire/Water IDs keep asset references stable while visible names change. Shared source PNG slab sheets and crop IDs keep their existing filenames; one sheet supplies several cards, so it is not renamed after an individual spell. Display-name metadata provides the name-to-art organization without copying or modifying pixels. All **13 active slabs** share one proportional rules size: **17 px at a 170 px card width**, without shrinking dense descriptions. Heavy titles stay at the top of the parchment; compact rules sit centered below them, with bold roll thresholds. The upper-left yellow number is the Mana cost, and Read Slab keeps the complete effect text. Selecting Fate uses the supplied Cast Fate artwork.

Slabs retain their original black outer corners, dark pixel outlines and interior artwork. Bold threshold numbers use tinted blocks, with the earlier font sizing and standard hover/selection styling restored. Source art and saved data are preserved.

After replacing source PNGs, regenerate their optimized copies with `npm run optimize:art`. That optional authoring command requires Python and Pillow with WebP support; running, testing, building, and deploying the retained files require only Node.js and Git. The web build verifies source and optimized SHA-256 hashes and rejects stale or damaged copies.

The Fire and Water stat frames use rough pixel-art icons for element, HP, Mana,
Shield and Loaded. Compact card rules use a sword for outgoing damage, a heart
for healing, and matching Shield, Mana and die symbols; flames mean Embers and
water drops mean Flow. Short formulas preserve base values, multipliers,
optional spending, “extra” versus “instead,” and after-spell Flow timing. Fate
shows its modifier beside the die symbol, still changing the Modified Roll.
Full words remain available to accessibility tools and in Read Slab; the spell
catalog and combat calculations are unchanged.

The battle arena uses the forest's original **1024 × 1536 (2:3 portrait)** canvas. One uniform scale fits it to the available screen; the forest is never stretched or cropped to widen the board. On Mac screens, its top and bottom meet the viewport edges, with side gutters. Narrower screens fit the width and center the board vertically. The other screens use a mobile layout that adapts to the viewport, with an independently scrolling Rolodex list.

Battle wizards walk in from their seat's side after **Continue** in a new duel's opening dialog, then idle facing each other on the grass. Fire and Water retain their original directional entrance atlas; Earth retains its walk sheet. No keyboard controls are added. Resuming a duel starts them idle; reduced motion places them there immediately. Original source PNGs remain unmodified. The larger mage portraits remain on Character and handoff screens.

The approved [wisp-free idle animations](designs/idle-wisp-free-review/README.md) now play in battle for **Fire, Water and Earth**. Each keeps eight breathing steps at 160 ms per step, with one blink every second cycle: a 16-step, 2.56-second loop. Measured foot anchors keep each wizard on the grass, and either seat can face inward. HUD updates and returning from a spell preserve the idle clock; hidden screens pause it, and reduced motion uses a still pose. Golem keeps its own existing idle sheet. The earlier [Fire/Water gallery](designs/idle-previews/README.md) remains an archived preview with its original particles and timing.

The separate [Earth and Air preview pack](designs/earth-air-previews/README.md), emitted by a review build at `previews/earth-air/`, preserves the earlier walking, idle, casting and effect artwork with an offline viewer and ZIP. Earth is now playable; Air remains a preview. The archived gallery keeps its original assets independently of the current battle selections.

The Dons, Character, Friends, and battle-selection screens use pixel-art controls, parchment, and navy stone. Earth uses the supplied green-and-gold stat frame. Spell Tower and Discard Pile show a tower and a tray of spent slabs, with live counts in their plaques.

Thirteen active elemental spells use their own approved effect sheets after Fate ends. Their existing caster poses remain anchored, including Earth in Golem form and either arena seat. The effects retain a one-second particle hold and the quick 210 ms hit flash. Shield follow-through belongs to the caster; conditional reward flourishes use the final Modified Roll. Each played Fate briefly displays its signed modifier and pixel symbol above the dice for 600 ms before the next response or resolution. Skips stay immediate. Merciful's successful stone fragments persist until the opponent's next turn actually ends, with restored active fragments shown after a reload. These visual callbacks never reapply combat effects.

Named charges sit in front of the caster's face and hand, mirrored toward the opponent. Shields and Merciful remain around the caster; Earthbound and Tectonic form on the ground from the start. Sunsetter uses only the existing heavy Fire charge, followed by a meteor from above and an expanded explosion. Poseidon's Rift forms a whirlpool, raises a separate trident, turns it toward the opponent during a half-second hover, then accelerates into a diving strike. Swell circles the caster's feet with separate rear and front wave layers. Heatbox's flame hoop stays at the feet on a base roll, rises to the head on 7+, and descends into a burst with sparkles on 10+. Earthbound's 7+ hit builds a temporary stone shell around the caster, flashes white and fades; this visual never changes the actual Golem rules. All variants use the final Modified Roll after Fate.

Enhancement keeps its original 6+ animation, adds a stronger ring and sparkles on 9+, and uses two rings and a larger sparkle burst on 12+. Idle Fire, Water and Earth wizards also show subtle school-colored mana glimmers at 5, 7, 9 and 10 Mana. The glimmers drop to the appropriate tier as Mana is spent, pause offscreen, and clear during spell playback and hit reactions. They are cosmetic and grant no battle bonus.

**Xineoph and Pacific** use dedicated transparent creature atlases: a bold fiery phoenix for Xineoph and a blue dolphin for Pacific. Their existing card illustrations, costs and printed effects stay unchanged. Xineoph keeps its deep-red caster and charge artwork, while flight, afterimages and impact use a separate clean effects sheet, excluding the stray hat from the caster sheet's first flight cell. Pacific retains its existing atlas. New flame and wave arcs replace the former straight light blades in the battle animations.

Both charges grow for 500 ms, then eight distinct pixel-art pulse frames loop twice at 62.5 ms per frame during the 500–1500 ms charged hold, keeping the wizard's feet fixed. Two formation frames play for 100 ms each at 1.5 and 1.6 seconds. Three wing or tail poses begin at 1.7, 1.825 and 1.95 seconds; the flame or wave arcs appear on the third pose. Flight begins at 2.075 seconds and swoops for 900 ms into one combined impact at **2.975 seconds**. Two faint pixel afterimages trail by 45 and 90 ms during flight only, follow the mirrored path and clear before impact, on cancellation and at completion. Fire normally travels left to right; Water travels right to left. The defender keeps the quick **210 ms red flash** and **340 ms impact window**, finishing at **3.315 seconds**. HP, Mana and elemental changes appear once at impact. Fate responses finish before the primary animation starts; reconnecting or reloading a completed cast does not replay it. Xineoph still costs 2 Mana, deals 10 base damage, gains 2 Embers and gains 1 Mana on 7+. Pacific still costs 2 Mana, deals 6 + 2 × existing Flow damage, deals 5 extra on 10+ and gains two total Flow after resolution.

A successful Enhancement plays its two-second elemental jump **after its Fate chain ends**, showing the award at 500 ms; a final modified total below 6 shows **MISS** without an animation. Aura forms for 500 ms, then holds a full one-second particle loop before controls unlock at 1.5 seconds. Its green ring keeps looping under the wizard's feet through three subsequent owner turns, excluding activation, and fizzles for 500 ms at expiry. Reconnecting restores an active ring without replaying its formation. Reduced motion completes action visuals immediately and shows active Aura as a static ring.

The engine resolves and saves each action once. Mana costs are paid normally; displayed results update at impact, battle actions wait for the animation to finish, and victory appears afterward. Newly completed local and online actions animate once; reloading or resuming does not replay history. Health bars ease in and out over 800 ms from impact, including healing, and keep moving through display updates. Victory also waits until the losing bar reaches zero. Animation callbacks do not apply combat effects or alter saved decks.

The Seattle map keeps its existing square landmark bitmap, ocean, islands and geography. **Fit / 1×** fills the map panel; panning and zooming move the city and grey Storybook markers together. The approved rough Home atlas supplies the live frames, header, toolbar and navigation-button artwork through CSS crops. Its source PNG remains unchanged, and runtime copies use the lossless optimized-art pipeline. Controls retain their existing actions and stay outside the map. The page backdrop remains separate from the map panel. No district mini-map art, GPS system or quest engine is added; card, deck, combat and account functions are unchanged.

The approved combat set is preserved in [designs/animation-previews/v2-one-second](designs/animation-previews/v2-one-second/README.md): ten unchanged PNG sheets for Enhancement, Aura, casts, attacks, shields, power-ups, projectiles and hit reactions, with lossless optimized copies. Each held-effect sequence has eight moving frames at 125 ms each for a full one-second linger. The separate gallery and ZIP at `previews/combat-linger-v2/` remain artwork references in review builds, and are omitted from game-only production uploads. Live targets use the original quick hit response; the longer v2 hit-reaction sheet remains available in that reference pack.

Wizards stand on the grass around logical y450. Stat panels begin at y480, with the hand and turn controls on the stone-and-dirt area below. The hand has three slabs in the top row and up to three in the bottom row (with two centered for a five-slab hand), with the discard and tower signs at its sides. Both wizards' Enhancement percentages and Aura countdowns appear on the left of the hand frame. The right side shows one Fire-red or Water-blue Enhancement button for the active wizard, with a green Aura button below. The refresh drawer keeps its existing behavior, and the combat log opens over the board without changing the forest dimensions.

Use **Larger view** for a larger, scrollable portrait board and **Fit screen** to return. Active Fire spells have no Ember-spending choice or cost. Held Embers are used automatically as a damage bonus when an outgoing damaging Fire spell resolves; non-damaging spells and end of turn keep them.

## Implemented rules

- Both wizards start at **100 HP**, with **3 Mana**, zero Shield, zero Embers/Flow, zero Loaded, **0% Enhancement**, and no active Aura. Caps are **100 HP, 10 Mana, 30 Shield, 5 Embers/Flow, and 30% Enhancement**. Aura supplies a separate fixed **10%** while active.
- Each saved deck deals **up to 5 opening slabs**, limited by its available cards. Both players roll one opening d6; higher starts and ties reroll both. Fate and Loaded do not modify initiative. The second player draws one extra slab when their first own turn starts, **only if a tower card is available**, up to the six-slab hand limit.
- **Start new shared-screen duel** deals a fresh opening hand using the saved decks. **Resume saved shared-screen duel** keeps the existing hands and progress; it does not deal an opening hand again. Later turn draws and hand refreshes fill up to six in either case.
- A round is one turn per wizard, starting with the initiative winner. Each wizard gains **2 Mana** and draws up to six at the beginning of their own turns after their opening turn. Unspent Mana carries over up to the cap.
- Each player uses **one main action per own turn**: cast a primary spell, attempt Enhancement, or activate Aura. Fire and Water slabs are primary spells; Fate does not use this allowance. Cast Spell pays printed Mana. Active spells do not charge an Ember cost at cast. Held Embers remain available through the roll and Fate, then are consumed on outgoing Fire damage before new printed gains. Archived spells retain their historical spending definitions for save compatibility.
- All **10 active primary spells** roll **2d6**. Blaze costs **0 Mana** and gains **1 Ember**, plus **1 Mana on a final Modified Roll of 6+**. Swell also costs **0 Mana** and guarantees **1 Mana on cast before dice**, capped at 10; after resolution it gains normal **1 Flow**, plus **1 extra Flow on 7+**, capped at 5. Both use the primary slot, eligible Loaded and post-roll Fate, and retain power-up animations. The roll and eligible Loaded appear before Fate. Higher thresholds replace lower outcomes of the same effect; separately printed additional effects still apply.
- Fate is an **open response chain** for spell rolls and Enhancement rolls, starting with the defender and alternating after each response. Select and cast **one eligible Fate slab at a time**. Each cast gives the other player a response and resets the consecutive-pass count. **Two consecutive passes** end the chain and resolve the pending spell or Enhancement; a player without eligible Fate passes automatically. A player who passed can respond again if a later Fate slab is played. There is no three-window limit.
- Fortune gives **+4** to the caster of the pending spell or Enhancement; Misfortune gives **−4** when used by that caster's opponent. These roles stay fixed throughout the chain. Either player may choose **+2 or −2** for each Twist. Skip Fate clears the staged selection and passes. Fate updates the Modified Roll without rerolling the original dice; the displayed total includes both players' modifiers and may be negative.
- **Enhancement** starts at **0%** for each player. Once on the active player's own turn, **instead of a primary spell or Aura**, they may pay **0 Mana** to roll **2d6 once**, then use the ordinary defender-first Fate chain. The **final Modified Roll** determines the highest qualifying award: **6–8 adds 10 percentage points**, **9–11 adds 20**, and **12+ adds 30**. Award it **once after the chain closes**, adding to stored Enhancement up to **30% total**; below 6 gains nothing. A failed attempt still uses the main action. The bonus stays banked until the player's next outgoing damaging primary spell resolves, then resets to **0%**, even if Shield absorbs all damage. Non-damaging spells, Fate and self-damage preserve it. A new duel resets it, and reaching the cap disables further attempts until it is consumed.
- **Aura** costs **1 Mana** and uses the turn's main action instead of a spell or Enhancement. It immediately grants a fixed **10% outgoing damage bonus** for **three subsequent turns of its owner, excluding the activation turn**. It does not stack and cannot be recast while active; it can be activated again after expiry. The counter starts at three and stays at three when activation ends. It then decrements only when that owner actually passes each of their next three turns, including a confirmed hand refresh. Opening End Turn or selecting refresh cards does not advance the countdown; opponent turns do not reduce it.
- Enhancement uses Fate but **does not apply or consume Loaded** and grants no Embers/Flow. Aura has no dice roll or Fate window, leaves Loaded unused, and grants no Embers/Flow. Existing unused Loaded still expires at the end of its owner's turn. Any of the three main actions prevents the other two that turn.
- Enhancement and Aura add together, up to **40%**. For outgoing Fire attacks, add **5% per held Ember**, capped at **25%**: Fire can therefore reach **65% total damage bonus** with 5 Embers, 30% Enhancement and 10% Aura. Apply the combined percentage to completed base damage and round once, halves up, **before Shield**. For example, Charred Blade's 30 damage on 7+ with 5 Embers becomes 38; Sunsetter's 65 on 8+ with all three bonuses becomes 107. Water receives no Ember percentage. These bonuses do not increase self-damage, healing, resources, Shield gains or Shield removal. Damaging resolution consumes Enhancement; outgoing damaging Fire resolution also consumes the held Ember bank, even when Shield absorbs the whole hit. Aura follows its countdown. The combat log records the applied bonus breakdown, base and boosted damage, Shield absorption and HP damage.
- Loaded gained from a spell queues for that wizard's **next own turn**, stacks, applies once to that turn's first spell roll, and expires **only when that turn actually passes** if unused. Opening End Turn or staging a refresh does not expire it. A bonus earned this turn does not modify this turn's roll.
- Opponent damage consumes Shield before HP. **Self-damage bypasses the caster's Shield.** Shield removal happens before damage when printed. Healing stops at 100 HP; reaching zero HP ends the duel.
- Fire gains only printed Embers, capped at five. Embers have no turn or round expiry: non-damaging spells, Water damage and self-damage keep them. Outgoing Fire damage uses and clears the held bank before that spell's printed new gains. Xineoph cast with 3 Embers deals 12 from its 10 base damage, then ends at 2 Embers. Charred Blade on 7+ with 5 Embers deals 38, then ends at 2. Sunsetter on 8+ with 5 Embers deals 81, then ends at zero. Fire has no automatic Ember gain for casting.
- Water damage and healing use **Flow before resolution**. After the spell's effects, every Water spell grants **1 Flow**. Printed **additional Flow** adds to that default, capped at five. Water-2 on 8+ grants two Flow total; Water-9 always grants two Flow total. Fate grants no automatic Flow.
- After a primary spell, Enhancement attempt or Aura activation, Cast Spell, Enhancement and Aura stay disabled until that player's next own turn. Active Aura also prevents recasting it, and 30% Enhancement prevents another attempt. End Turn reveals the blue Hand Refresh button and turns red. End Turn again passes without refreshing. Hand Refresh turns red and lets the player select any number of slabs including zero; clicking that red confirmation discards the selections, draws up to six, and passes immediately. Clicking End Turn during refresh cancels the refresh and opens a fresh End Turn choice; it does not pass until End Turn is clicked again.
- With no dialog open, **click or tap elsewhere, including other controls and the outer gutters**, to cancel an unconfirmed End Turn drawer or Hand Refresh choice and clear its marks. The clicked control then acts if valid; clicking a card from the End Turn drawer returns to the main phase and selects it. Card checks during refresh keep that mode open, and its red Hand Refresh confirmation commits it. Background taps also clear an uncommitted primary or Fate selection; clearing Fate keeps the same responder and pass count. Cast Spell, Cast Fate, Skip Fate and confirmed refreshes/passes commit immediately and cannot be undone. Canceling staging never restores an already-used main action; unused Loaded expires and Aura counts down only on the actual pass.
- Pending spell or Enhancement dice, Fate decisions, and resolution block ending the turn. Spell Tower and discard counts track card movement; the played primary is discarded once. Enhancement uses no primary slab, but Fate played for it is discarded normally. Aura uses no slab. Local control changes use handoffs. Read Slab shows full text, and Spell Tower lists deck composition without exposing draw order.
- Version **14** saves use the `nov4-v2.1` catalog and validate pending spell/Enhancement Fate chains, dice, stats, zones, Enhancement, Aura, turn allowances and refresh progress. Current-catalog versions **10–13** migrate. Version 13 retains hands, decks, banks, Aura and counters; already-awarded Enhancement outcomes keep their historical award and are not replayed or recalculated. A saved Enhancement awaiting its first roll now gets the new Fate chain after that roll. Version 12 retains Enhancement and starts with no active Aura; versions 10/11 start with 0% Enhancement and no Aura while their older Fate history is upgraded. Existing guest deck keys are retained with additional named-collection backups; older compositions containing retired cards require review. Old-catalog duels remain retired; old deck IDs are not reinterpreted as new cards, and account migration retains credentials while archiving replaced old deck data.

## Spellbook and saved decks

`src/spells.js` retains historical definitions from the November 4 Master Spellbook and the user-added slabs for saved-data validation. `src/spellbooks.js` exposes only the current 20-slab collection. Heatbox/Blaze/Charred Blade/Xineoph/Sunsetter retain Fire-2/15/6/11/14; Sea bolt/Swell/Carbonate/Pacific/Poseidon's Rift retain Water-2/0/12/9/14. Effects execute in `src/effects.js`; combat timing lives in `src/game.js`.

Xineoph costs **2 Mana**, deals **10 damage**, gains **2 Embers**, and gains **1 Mana on 7+**. Carbonate costs **3 Mana** and retains its Flow damage and conditional healing. Swell gains **1 Mana on cast**, then normal Flow plus one additional Flow on 7+. Charred Blade remains **5 Mana** and deals **20 damage**, or **30 and gains 2 Embers on 7+**; it has no separate 10+ tier. Sunsetter remains **8 Mana** and deals **55 damage**, or **65 on 8+**, without an Ember-spending cost. Five held Embers boost its 8+ hit to **81**, or **107** with 30% Enhancement plus 10% Aura. Blaze remains **0 Mana**, gains **1 Ember**, and gains **1 Mana on 6+**.

Anti-Furnace (`Fire-16`) costs **3 Mana** and deals **10 base damage**. On **7+**, it first removes up to **15 Shield**, then deals normal damage. If the special Shield hit removes nothing, it grants **2 Embers**; the ordinary Fire hit consumes old Ember damage bonuses before those new Embers are granted. Metamorphic (`Earth-6`) costs **4 Mana**. On **5+**, it grants Shield equal to **half the actual Shield plus HP damage received during the opponent’s most recent turn, rounded down**. It grants zero if the opponent used no damaging primary spell that turn. Normal Shield caps apply. The two new spells have no spell animation yet. Their cards use the classic matching Fire/green Earth frames, beige text panels and pixel icons.

Compatible current-book saves refresh old card names while preserving paid costs, completed outcomes and historical logs. A former test duel containing Fire-5 is archived instead of substituting Fire-6 into a committed action. Compatible earlier decks migrate to the active pool, including replacement of Fire-5 copies with Charred Blade. Legacy deck data remains backed up. Fate retains its existing 0-Mana cost and post-roll response chain. Completed historical damage is preserved without replay. Pending Fire spells resolve once under the current rules. A pending old Sunsetter's reserved Embers are restored exactly once into its bank, then consumed by its damage bonus on resolution; completed old Sunsetter outcomes remain historical.

See the [spell IDs, Mana costs, and decklist format](docs/decklists.md).

## Current limits

If the tower runs out, drawing stops, so automatic draws and hand refresh can produce fewer than six cards. No reshuffle or fatigue rule is invented. There is no AI opponent. Online rooms support Fire, Water, and Earth, use in-memory match storage, and do not add a turn-timeout rule, friend lists, chat, or photo uploads. Username/password accounts and saved decks use persistent SQLite storage when the configured database file is retained.

The in-game settings/handbook describes the active rules and local two-player flow.

## Separate experiments

[Spell Sketch](prototypes/glyph-duel/README.md) is a standalone drawing-duel experiment emitted at `dist/prototypes/glyph-duel/` by `npm run build:web` (serve it locally with `npm run preview`), with local two-player pass-and-play, solo practice and an offline download. Memorize a Circle, Square or Triangle, then draw and counter it on a timed block grid. It has no connection to Auradon accounts, saved decks or live combat, and remote two-phone play is not implemented for this experiment.

## Project structure

- `src/spells.js` — current master spell metadata, catalog version, and PDF source references.
- `src/decks.js` — saved-deck validation, battle starters, and portable deck format compatibility.
- `src/effects.js` — executable Fire and Water effects, roll requirements, and Ember-spending choices.
- `src/game.js` — pure game-state transitions, post-roll Fate/refresh phases, slab instances, and versioned save validation.
- `src/main.js` — battle rendering, local/remote interactions, browser persistence, and hub integration.
- `src/multiplayer.js` — room lobby, private player session, server actions, polling, and reconnecting.
- `src/multiplayer.css` — mobile two-screen lobby layout.
- `src/accounts.js` / `src/accounts.css` — account sign-in, saved-deck synchronization, and account-screen layout.
- `src/hub.js` — hub navigation, battle setup, and local profile and deck persistence.
- `src/hub.css` — mobile hub layout and pixel-styled controls.
- `src/rolodex.js` / `src/rolodex.css` — creature portraits, thumbnail list, and Rolodex styling.
- `src/style.css` — responsive arena and card styling.
- `src/assets.js` — uploaded graphic mapping and rendering crop metadata.
- `src/optimized-art.js` — generated filenames and integrity hashes for hosted artwork.
- `src/hub-storage.js` — stable guest/device save keys, compatible recovery and account separation.
- `public/graphics/` — source PNGs, including the approved Rolodex sprites.
- `public/optimized/` — pixel-identical, hashed WebP copies and generation manifest.
- `public/art/` — earlier prototype art and the application favicon.
- `test/game.test.js` — phase locks, refresh, conservation, drawing, damage, victory, and save tests.
- `test/decks.test.js` — saved-deck validation, starter composition, and element restrictions.
- `docs/decklists.md` — current catalog, battle deck rules, and portable format compatibility.
- `docs/multiplayer.md` — two-device local setup, remote hosting resources, room flow, and troubleshooting.
- `server/` — authoritative room server, private player views, SQLite accounts/decks/sessions, validation, and built-frontend serving.
- `Dockerfile` — optional Node 24 container build for a room-server host.
- `scripts/` — Node server, static build, GitHub Pages deployment, and optional artwork optimizer.

Automated checks cover the current catalog, costs and thresholds, caps, Flow timing, optional and mandatory Ember spending, self-damage, open post-roll Fate chains and passes, Twist signs, Loaded timing, Enhancement attempts and consumption, Aura cost and owner-turn expiry, combined damage rounding, compact slab text, saved-deck validation and starter fallback, turn/refresh rules, card conservation, accounts, room privacy, and save compatibility. Browser checks exercise the Rolodex, battle setup, battle controls, and responsive layout.
