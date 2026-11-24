import { ASSETS } from './assets.js';

export const AURADON_TYPES = Object.freeze([
  'Fire', 'Water', 'Earth', 'Air', 'Ice', 'Dragon',
  'Cosmic', 'Electric', 'Wild', 'Void', 'Nature', 'Metal',
]);

export const AURADONS = Object.freeze([
  ['Aur-1', 'aur1', ['Fire']],
  ['Aur-2', 'aur2', ['Earth']],
  ['Aur-3', 'aur3', ['Ice', 'Wild']],
  ['Aur-4', 'aur4', ['Nature']],
  ['Aur-5', 'aur5', ['Nature', 'Wild']],
  ['Aur-6', 'aur6', ['Water']],
  ['Aur-6.1', 'aur61', ['Water']],
  ['Aur-7', 'aur7', ['Dragon', 'Air']],
  ['Aur-8', 'aur8', ['Cosmic']],
  ['Aur-9', 'aur9', ['Water']],
  ['Aur-10', 'aur10', ['Nature']],
  ['Aur-11', 'aur11', ['Dragon', 'Electric']],
].map(([id, asset, types]) => Object.freeze({
  id,
  name: id,
  sprite: ASSETS[asset],
  types: Object.freeze(types),
  maxHp: 100,
  maxMana: 10,
})));

// Damage and mana are playtest values. Array order is the permanent power rank.
const rankStats = [
  { damage: 12, mana: 0 },
  { damage: 20, mana: 2 },
  { damage: 30, mana: 4 },
  { damage: 44, mana: 6 },
];

const rankedMoves = {
  Fire: [
    ['cinder', 'Cinder'],
    ['fire-breath', 'Fire Breath'],
    ['pyroblast', 'Pyroblast'],
    ['sunsetter', 'Sunsetter'],
  ],
  // Xineoph is reserved for later use.
  Water: [
    ['wave', 'Wave'],
    ['tide-beam', 'Tide Beam'],
    ['carbonate', 'Carbonate'],
    ['oceans-rift', 'Oceans Rift'],
  ],
  Earth: [
    ['quake', 'Quake'],
    ['earth-blast', 'Earth Blast'],
    ['tectonic', 'Tectonic'],
    ['earthbound', 'Earthbound'],
  ],
  Air: [
    ['air-slice', 'Air Slice'],
    ['forceful-winds', 'Forceful Winds'],
    ['gale', 'Gale'],
    ['wind-storm', 'Wind Storm'],
  ],
  Dragon: [
    ['dragon-blade', 'Dragon Blade'],
    ['draconic-blast', 'Dragonic Blast'],
    ['draco-thunder', 'Draco Thunder'],
  ],
  Cosmic: [
    ['shooting-star', 'Shooting Star'],
    ['eclipse', 'Eclipse'],
    ['meteor-blitz', 'Meteor Blitz'],
  ],
  Electric: [
    ['bolt', 'Bolt'],
    ['lightning-beam', 'Lightning Beam'],
    ['thunderclap', 'Thunderclap'],
    ['raigeki', 'Raigeki'],
  ],
  Wild: [
    ['sharp-claw', 'Sharp Claw'],
    ['scissor-cut', 'Scissor Cut'],
    ['mammoth', 'Mammoth'],
  ],
  Void: [
    ['swallow', 'Swallow'],
    ['shadow-blast', 'Shadow Blast'],
    ['false-reap', 'False Reap'],
  ],
  Nature: [
    ['vine-swat', 'Vine Swat'],
    ['bud-bud-blast', 'Bud Bud Blast'],
    ['dead-orchard', 'Dead Orchard'],
  ],
  Metal: [
    ['rust-cut', 'Rust Cut'],
    ['sliver-sword', 'Sliver Sword'],
    ['tungsten', 'Tungsten'],
  ],
};

const utilityMoves = {
  Earth: {
    id: 'merciful', name: 'Merciful', utility: 'guard', mana: 2,
    description: 'Halves the damage of the next hit this Auradon takes.',
  },
  Wild: {
    id: 'sharpness-5', name: 'Sharpness 5', utility: 'boost', mana: 2,
    description: 'Boosts this Auradon’s next damaging move by 50%.',
  },
  Metal: {
    id: 'weaponize', name: 'Weaponize', utility: 'weaponize', mana: 4,
    description: 'Boosts the next damaging move by 50% and halves the damage of the next hit taken.',
  },
};

export const AURADON_MOVES = Object.freeze(AURADON_TYPES.flatMap(type => {
  const moves = (rankedMoves[type] ?? []).map(([id, name], index) => Object.freeze({
    id, name, type, rank: index + 1, ...rankStats[index], utility: null,
  }));
  const utility = utilityMoves[type];
  if (utility) moves.push(Object.freeze({ ...utility, type, rank: null, damage: 0 }));
  return moves;
}));

const auradonsById = new Map(AURADONS.map(auradon => [auradon.id, auradon]));
const auradonMovesById = new Map(AURADON_MOVES.map(move => [move.id, move]));

export function getAuradon(id) {
  return auradonsById.get(id);
}

export function getMove(id) {
  return auradonMovesById.get(id);
}

export function defaultMoveIds(donId) {
  const auradon = getAuradon(donId);
  if (!auradon) return [];
  return AURADON_MOVES.filter(move => auradon.types.includes(move.type))
    .sort((first, second) => (first.rank ?? Infinity) - (second.rank ?? Infinity))
    .slice(0, 4)
    .map(move => move.id);
}

const strongAgainst = {
  Dragon: ['Void'],
  Cosmic: ['Void', 'Dragon'],
  Void: ['Cosmic'],
  Nature: ['Water', 'Earth'],
  Metal: ['Wild', 'Dragon'],
};

const weakAgainst = {
  Water: ['Nature'],
  Ice: ['Fire', 'Earth', 'Metal'],
  Cosmic: ['Void'],
  Electric: ['Earth'],
  Void: ['Cosmic'],
  Wild: ['Metal'],
  Nature: ['Ice', 'Fire'],
  Metal: ['Fire', 'Earth'],
};

const resists = {
  Fire: ['Ice', 'Metal'],
  Water: ['Earth', 'Ice'],
  Earth: ['Air', 'Ice', 'Electric'],
  Air: ['Earth', 'Nature'],
  Ice: ['Air'],
  Dragon: ['Fire', 'Water', 'Air', 'Electric', 'Earth'],
  Electric: ['Air'],
  Metal: ['Nature', 'Cosmic', 'Void', 'Dragon', 'Ice', 'Air', 'Wild'],
};

export function getDamageMultiplier(moveType, defenderTypes) {
  // An outgoing strength and a matching incoming weakness describe the same hit.
  // In this playtest, Dragon's outgoing strength also covers Void.
  let multiplier = 1;
  for (const type of new Set(defenderTypes)) {
    const isWeak = strongAgainst[moveType]?.includes(type) || weakAgainst[type]?.includes(moveType);
    if (isWeak) multiplier *= 2;
    if (resists[type]?.includes(moveType)) multiplier *= 0.5;
  }
  return multiplier;
}
