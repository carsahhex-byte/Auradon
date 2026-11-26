import assert from 'node:assert/strict';
import test from 'node:test';
import { AURADON_MOVES } from '../src/auradon-catalog.js';
import { AURADON_MOVE_EFFECTS, getAuradonMoveEffect } from '../src/auradon-move-effects.js';

test('every battle move has a pixel effect on the correct combatant', () => {
  assert.deepEqual(
    Object.keys(AURADON_MOVE_EFFECTS).sort(),
    AURADON_MOVES.map(move => move.id).sort(),
  );

  for (const move of AURADON_MOVES) {
    const effect = getAuradonMoveEffect(move.id);
    assert.equal(Boolean(effect.self), Boolean(move.utility), move.name);
  }
});
