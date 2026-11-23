# Earth playtest

Earth is available alongside Fire and Water in shared-screen and two-screen battles. The current spellbook contains 20 slabs across those three elements and Fate.

## Start a battle

1. Open the game URL with `#battle-setup` to choose your players.
2. Set either seat to **Earth**. Each seat uses its element’s saved deck when available, with a 12-slab starter for empty slots.
3. Choose the other player’s element. In a mirror match, each player gets a separate copy of the same composition.
4. Start the battle and roll for initiative. Each player receives up to five opening slabs. The second player draws one additional slab when their first turn starts if the tower has one. Later draws and hand refreshes fill to six while cards remain.

Starting stats remain **100 HP, 3 Mana and 0 Shield**. Mana caps at **10**, Shield at **30**. Later own turns gain two Mana. Each turn allows one primary spell, Enhancement attempt or Aura activation. Fate responses retain the existing post-roll chain.

## Earth slabs

| Slab | Mana | Effect |
| --- | ---: | --- |
| OffoDefo (Earth-1) | 0 | Deal 5 damage and gain 5 Shield. On 7+, gain 5 additional Shield. |
| Bengal Shield (Earth-2) | 2 | Gain 10 Shield. On 6+, gain 1 Mana. |
| Earthbound (Earth-3) | 2 | Deal 5 damage. On 7+, gain 12 Shield. |
| Merciful (Earth-4) | 4 | Gain 3 Shield. On 6+, damage received during the opponent’s next turn bypasses your Shield and hits your HP. |
| Tectonic (Earth-5) | 5 | If Golem is active, deal 15 damage. |
| Metamorphic (Earth-6) | 4 | On 5+, gain Shield equal to half the damage taken across Shield and HP during the opponent’s most recent turn, rounded down. |

Earth-1 through Earth-4 roll before Fate, and their thresholds use the final Modified Roll after Loaded and Fate. Earth-4 always gains 3 Shield, grants no Mana, and only queues the incoming-damage bypass on 6+. Its gain can reach the Shield cap or trigger Golem at 20. A failed roll grants no new bypass status. Earth-5 resolves without dice or a Fate window. Earth-5 still pays its cost and uses the primary action when no Golem is active, but deals no damage. Read Slab shows the complete wording; Earth-4's shorter card copy is a space-saving summary.

The approved card names retain their numbered internal IDs, so saved Earth decks keep their compositions. Merciful's successful stone fragments remain around the wizard or Golem through the opponent's next turn and dissolve only after that actual turn ends.

## Golem timing

Shield gain reaching **20 or more** transforms the Earth wizard into Golem. Losing Shield afterward does not immediately remove that form. At the end of Earth's own turn:

- An unprotected Golem below 20 Shield reverts before attacking.
- An active Golem that remains deals a fixed **15 damage** to the opponent, using Shield before HP.
- Enhancement and Aura do not increase or get consumed by this automatic hit. Golem does not add a flat damage bonus to primary spells.

On a final 6+, every incoming damage hit during the opponent’s immediately next turn goes directly to Earth’s HP and preserves its Shield. The status is queued during Earth’s casting turn, active during that opposing turn, and expires after that opponent’s actual end-turn effects, including an automatic Golem strike. It is not consumed by the first hit. End Turn staging, refresh selection and cancellation do not expire it. Direct Shield-removal effects remain Shield removal.

An already-earned protection timer from a saved duel remains valid until its original expiry; loading the update does not replay or undo completed spells.

The **Form** stat shows Wizard or Golem. Its label changes to **HP Next** when the bypass is queued and **HP Now** while active. **Ward** is shown only for a protection timer retained from an earlier saved duel. Earth uses this form display rather than an Ember or Flow counter.

## What to verify while playing

- Start an Earth battle from a fresh browser profile and check that Spell Tower lists a 12-slab starter. With a compatible saved Earth deck, start a fresh duel and check that Spell Tower shows the saved composition.
- Choose Earth against Fire, Earth against Water and Earth against Earth. Repeat with Earth on the right. Both stat frames and wizard models should match their selected seats and face inward.
- Inspect the Earth slabs in battle. Check the green frames, illustration windows, and beige text areas on a phone.
- Build from 10 to 20 Shield with Earth-2. Shield should update at the spell's impact, followed by the Golem transformation; the old wizard model stays visible until that transformation completes.
- End a turn with an active Golem at 20 Shield. Against 5 opposing Shield, its automatic hit should remove that Shield and lower HP by 10.
- Repeat with 19 Shield and no Ward. It should revert without an automatic hit.
- Cast Earth-3: a final 6 deals 5 damage with no Shield gain; a final 7 deals 5 damage and gains 12 Shield. It costs 2 Mana.
- Cast Earth-4 at 17 Shield. It costs 4 Mana with no refund and always gains 3 Shield, reaching 20 and transforming Golem. A final 5 grants no new bypass; a final 6 queues it. Fate may raise or lower the final roll across that threshold.
- On the next opposing turn after a successful Earth-4, incoming attacks and an opposing Golem’s end-turn strike must lower Earth’s HP while preserving its Shield. The status must expire only after that turn’s end effects; later damage uses Shield normally again.
- During an automatic Golem strike, the ending player's hand should remain displayed. The handoff dialog should appear after the strike and gradual HP-bar movement both finish.

Two-screen testing requires the updated multiplayer server using combat rules `earth-golem-v3`. Restart an older server and create a new room before testing Earth.
