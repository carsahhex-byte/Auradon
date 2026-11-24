import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuradonBattle, applyAuradonMove, getAuradonMoveOptions, switchAuradon } from '../src/auradon-battle.js';
import { getDamageMultiplier, getMove } from '../src/auradon-catalog.js';

function member(id, ...moveIds) {
  return { id, moveIds };
}

function team(name, ...members) {
  return { name, members };
}

function use(state, moveId) {
  const result = applyAuradonMove(state, moveId);
  assert.equal(result.error, null);
  return result.state;
}

test('pass and play switches or casts once and keeps mirrored saved teams independent', () => {
  const saved = team('Mirrors', member('Aur-1', 'cinder'), member('Aur-2', 'quake'));
  const initial = createAuradonBattle(saved, saved);
  const unknown = applyAuradonMove(initial, 'quake');
  assert.ok(unknown.error);
  assert.equal(unknown.state, initial);

  const switched = switchAuradon(initial, 1);
  assert.equal(switched.error, null);
  assert.equal(switched.state.turn, 1);
  assert.deepEqual(switched.state.sides.map(side => side.activeIndex), [1, 0]);
  const attacked = use(switched.state, 'cinder');
  assert.equal(attacked.turn, 0);
  assert.equal(attacked.sides[0].members[1].hp, 100 - getMove('cinder').damage);
  assert.equal(attacked.sides[1].members[1].hp, 100);
  assert.equal(initial.sides[0].activeIndex, 0);
  assert.deepEqual(saved.members, [member('Aur-1', 'cinder'), member('Aur-2', 'quake')]);
});

test('double weakness can force a free replacement and the last knockout ends play', () => {
  const initial = createAuradonBattle(
    team('Metal', member('Aur-2', 'rust-cut', 'sliver-sword')),
    team('Wild', member('Aur-3', 'sharp-claw'), member('Aur-5', 'sharp-claw')),
  );
  const firstHit = use(initial, 'sliver-sword');
  assert.equal(firstHit.sides[1].members[0].hp, 100 - 4 * getMove('sliver-sword').damage);
  const knockout = use(use(firstHit, 'sharp-claw'), 'rust-cut');
  assert.equal(knockout.phase, 'replacement');
  assert.equal(knockout.turn, 1);
  assert.equal(knockout.sides[1].members[0].hp, 0);
  assert.equal(applyAuradonMove(knockout, 'sharp-claw').state, knockout);
  assert.ok(switchAuradon(knockout, 0).error);

  const substitution = switchAuradon(knockout, 1).state;
  assert.equal(substitution.phase, 'turn');
  assert.equal(substitution.turn, 1);
  assert.equal(substitution.sides[1].activeIndex, 1);
  const final = ['sharp-claw', 'sliver-sword', 'sharp-claw', 'sliver-sword', 'sharp-claw', 'sliver-sword']
    .reduce(use, substitution);
  assert.equal(final.phase, 'finished');
  assert.equal(final.winner, 0);
  assert.ok(switchAuradon(final, 0).error);

  assert.equal(getDamageMultiplier('Nature', ['Earth', 'Air']), 1);
  assert.equal(getDamageMultiplier('Dragon', ['Void']), 2);
  assert.equal(getDamageMultiplier('Cosmic', ['Void']), 2);
});

test('utility moves consume the turn and apply their effects for one qualifying hit', () => {
  const initial = createAuradonBattle(
    team('Buffs', member('Aur-1', 'cinder', 'weaponize')),
    team('Earth', member('Aur-2', 'quake')),
  );
  const buffed = use(initial, 'weaponize');
  assert.equal(buffed.turn, 1);
  assert.equal(buffed.sides[1].members[0].hp, 100);
  assert.deepEqual(buffed.sides[0].members[0].effects.map(effect => effect.id), ['sharpened', 'guard']);

  const guarded = use(structuredClone(buffed), 'quake');
  assert.equal(guarded.sides[0].members[0].hp, 100 - getMove('quake').damage / 2);
  assert.deepEqual(guarded.sides[0].members[0].effects.map(effect => effect.id), ['sharpened']);
  const boosted = use(guarded, 'cinder');
  assert.equal(boosted.sides[1].members[0].hp, 100 - getMove('cinder').damage * 1.5);
  assert.deepEqual(boosted.sides[0].members[0].effects, []);
});

test('expensive-only loadouts can still attack after spending their mana', () => {
  const initial = createAuradonBattle(
    team('Fire', member('Aur-1', 'sunsetter')),
    team('Water', member('Aur-6', 'wave')),
  );
  const drained = ['sunsetter', 'wave', 'sunsetter', 'wave'].reduce(use, initial);
  const [move] = getAuradonMoveOptions(drained);
  assert.equal(move.exhausted, true);
  assert.equal(move.available, true);
  assert.equal(move.cost, drained.sides[0].members[0].mana);
  const finished = use(drained, move.id);
  assert.equal(finished.phase, 'finished');
  assert.equal(finished.sides[0].members[0].mana, 0);
});

test('a saved loadout can contain utility moves but needs a damaging move to start battle', () => {
  const utilityOnly = team('Utilities', member('Aur-1', 'merciful'));
  const offense = team('Fire', member('Aur-1', 'cinder'));
  assert.throws(() => createAuradonBattle(utilityOnly, offense), /one damaging move for Aur-1 in Utilities/);
});
