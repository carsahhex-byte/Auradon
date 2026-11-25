import { getAuradon, getDamageMultiplier, getMove } from './auradon-catalog.9243f67ac43a.js';

const TURN_MANA = 2;
const GUARD = Object.freeze({ id: 'guard', name: 'Guard' });
const SHARPENED = Object.freeze({ id: 'sharpened', name: 'Sharpened' });
const UTILITY_EFFECTS = {
  guard: [GUARD],
  boost: [SHARPENED],
  weaponize: [SHARPENED, GUARD],
};

function snapshotTeam(team) {
  if (!Array.isArray(team?.members) || team.members.length < 1 || team.members.length > 6) {
    throw new Error('Choose a saved team with one to six Auradons.');
  }

  const members = team.members.map(member => {
    const don = getAuradon(member?.id);
    if (!don) throw new Error('This team contains an unavailable Auradon.');

    const moveIds = Array.isArray(member.moveIds) ? [...new Set(member.moveIds)] : [];
    const moves = moveIds.map(getMove);
    if (moves.length > 4 || moves.some(move => !move)) {
      throw new Error(`Equip up to four available moves for ${don.name} in ${team.name}.`);
    }
    if (!moves.some(move => move.damage > 0)) {
      throw new Error(`Equip at least one damaging move for ${don.name} in ${team.name}.`);
    }

    return { ...don, types: [...don.types], hp: don.maxHp, mana: don.maxMana, moveIds, effects: [] };
  });

  return { name: team.name, members, activeIndex: 0 };
}

export function createAuradonBattle(leftTeam, rightTeam) {
  return {
    sides: [snapshotTeam(leftTeam), snapshotTeam(rightTeam)],
    phase: 'turn',
    turn: 0,
    winner: null,
    message: 'Player 1 goes first.',
  };
}

function activeMember(state, sideIndex = state.turn) {
  const side = state.sides[sideIndex];
  return side.members[side.activeIndex];
}

function updateSide(state, sideIndex, side) {
  const sides = [...state.sides];
  sides[sideIndex] = side;
  return { ...state, sides };
}

function updateActiveMember(state, sideIndex, member) {
  const side = state.sides[sideIndex];
  const members = [...side.members];
  members[side.activeIndex] = member;
  return updateSide(state, sideIndex, { ...side, members });
}

function beginTurn(state, turn, message) {
  const member = activeMember(state, turn);
  const mana = Math.min(member.maxMana, member.mana + TURN_MANA);
  const next = updateActiveMember(state, turn, { ...member, mana });
  return { ...next, phase: 'turn', turn, message };
}

export function getAuradonMoveOptions(state) {
  if (state.phase !== 'turn') return [];
  const { mana, moveIds } = activeMember(state);
  const moves = moveIds.map(getMove);
  const cheapestAttack = moves.reduce((cheapest, move) => {
    if (move.damage > 0 && (!cheapest || move.mana < cheapest.mana)) return move;
    return cheapest;
  }, null);

  return moves.map(move => {
    // Every legal loadout can attack even when its damaging moves all exceed its mana.
    const exhausted = move === cheapestAttack && move.mana > mana;
    const cost = exhausted ? mana : move.mana;
    return { ...move, cost, exhausted, available: cost <= mana };
  });
}

function resolveUtility(state, attacker, move) {
  const grantedEffects = UTILITY_EFFECTS[move.utility];
  const effects = attacker.effects
    .filter(effect => !grantedEffects.some(granted => granted.id === effect.id))
    .concat(grantedEffects);
  const next = updateActiveMember(state, state.turn, { ...attacker, effects });
  const message = `${attacker.name} used ${move.name} and gained ${grantedEffects.map(effect => effect.name).join(' and ')}.`;
  return beginTurn(next, 1 - state.turn, message);
}

function resolveDamage(state, attacker, move) {
  const opponent = 1 - state.turn;
  const defender = activeMember(state, opponent);
  const multiplier = getDamageMultiplier(move.type, defender.types);
  const boost = attacker.effects.some(effect => effect.id === SHARPENED.id) ? 1.5 : 1;
  const reduction = defender.effects.some(effect => effect.id === GUARD.id) ? 0.5 : 1;
  const power = move.exhausted ? 0.5 : 1;
  const damage = Math.max(1, Math.round(move.damage * multiplier * boost * reduction * power));
  const hp = Math.max(0, defender.hp - damage);

  const afterAttack = updateActiveMember(state, state.turn, {
    ...attacker,
    effects: attacker.effects.filter(effect => effect.id !== SHARPENED.id),
  });
  const next = updateActiveMember(afterAttack, opponent, {
    ...defender,
    hp,
    effects: hp > 0 ? defender.effects.filter(effect => effect.id !== GUARD.id) : [],
  });

  const exhaustedText = move.exhausted ? ' while exhausted' : '';
  const effectivenessText = multiplier === 1 ? '' : ` (${multiplier}× type effectiveness)`;
  const hit = `${attacker.name} used ${move.name}${exhaustedText}. ${defender.name} took ${damage} damage${effectivenessText}.`;
  if (hp > 0) return beginTurn(next, opponent, hit);

  const faint = `${hit} ${defender.name} fainted.`;
  if (!next.sides[opponent].members.some(member => member.hp > 0)) {
    return { ...next, phase: 'finished', winner: state.turn, message: `${faint} Player ${state.turn + 1} wins.` };
  }
  return { ...next, phase: 'replacement', turn: opponent, message: `${faint} Choose a replacement.` };
}

export function applyAuradonMove(state, moveId) {
  if (state.phase !== 'turn') return { state, error: 'Moves are unavailable right now.' };
  const move = getAuradonMoveOptions(state).find(option => option.id === moveId);
  if (!move) return { state, error: 'That move is not equipped.' };
  if (!move.available) return { state, error: 'This Auradon does not have enough mana for that move.' };

  const active = activeMember(state);
  const attacker = { ...active, mana: active.mana - move.cost };
  const next = move.utility ? resolveUtility(state, attacker, move) : resolveDamage(state, attacker, move);
  return { state: next, error: null };
}

export function switchAuradon(state, index) {
  if (state.phase === 'finished') return { state, error: 'The battle has ended.' };
  const side = state.sides[state.turn];
  const member = Number.isInteger(index) ? side.members[index] : null;
  if (!member || member.hp <= 0 || index === side.activeIndex) {
    return { state, error: 'Choose an available Auradon on the bench.' };
  }

  const next = updateSide(state, state.turn, { ...side, activeIndex: index });
  const turn = state.phase === 'replacement' ? state.turn : 1 - state.turn;
  return { state: beginTurn(next, turn, `Player ${state.turn + 1} sent out ${member.name}.`), error: null };
}
