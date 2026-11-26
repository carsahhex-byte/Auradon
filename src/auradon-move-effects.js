// Colors are the base, highlight, and shadow of each effect in that order.
function effect(shape, colors, duration, size, count, description, details = {}) {
  return Object.freeze({
    shape, colors: Object.freeze(colors), duration, size, count, description, ...details,
  });
}

export const AURADON_MOVE_EFFECTS = Object.freeze({
  cinder: effect('orb', ['#f56836', '#ffce64', '#a32635'], 320, 3, 4,
    'A small orange ember jumps toward the target.', { variant: 'ember' }),
  'fire-breath': effect('stream', ['#fa522f', '#ffb74e', '#a52530'], 390, 6, 10,
    'A short plume of orange flame fans out from the caster.'),
  pyroblast: effect('beam', ['#ff592c', '#ffdf75', '#ad2638'], 620, 9, 12,
    'A beam of fire shoots across the arena and explodes on impact.', { variant: 'fire' }),
  sunsetter: effect('meteor', ['#ff8735', '#fff09c', '#b12c3c'], 940, 13, 15,
    'Flames gather around the caster before a meteor falls from the sky.'),

  wave: effect('wave', ['#3d9edc', '#b8f1ff', '#29549c'], 360, 5, 6,
    'A low blue wave rolls across the ground.'),
  'tide-beam': effect('beam', ['#30afd2', '#b1f9ff', '#256593'], 400, 7, 7,
    'A narrow jet of bright blue water shoots across the arena.'),
  carbonate: effect('bubbles', ['#62bcdc', '#d5fbff', '#355b9f'], 470, 7, 10,
    'A cluster of blue bubbles rises and pops.'),
  'oceans-rift': effect('wave', ['#557cda', '#bff4ff', '#233e8c'], 530, 11, 12,
    'Two tall blue crests surge apart around the target.', { variant: 'split' }),

  quake: effect('fissure', ['#ad764a', '#f1c68b', '#543a35'], 360, 5, 6,
    'A jagged crack opens along the ground.'),
  'earth-blast': effect('shower', ['#ad7653', '#efc48b', '#644532'], 410, 6, 8,
    'A burst of rough stones pelts the target.', { variant: 'rocks' }),
  tectonic: effect('spikes', ['#a58467', '#e4bb8c', '#5e423d'], 460, 9, 8,
    'A row of stone ridges erupts from the arena floor.'),
  earthbound: effect('slam', ['#a67a58', '#ecc297', '#664437'], 550, 12, 12,
    'A large boulder strikes the ground and scatters rubble.', { variant: 'weight' }),
  merciful: effect('ring', ['#c69b60', '#f9e0ab', '#76513a'], 420, 9, 6,
    'A warm stone shield forms around the caster.', { variant: 'guard', self: true }),

  'air-slice': effect('slash', ['#88c5be', '#e4fff7', '#51979b'], 310, 5, 4,
    'A thin crescent of pale air cuts across the target.', { variant: 'crescent' }),
  'forceful-winds': effect('stream', ['#91b4d9', '#e1f7ff', '#4f7799'], 390, 6, 9,
    'Several pale gusts push past the target.', { variant: 'wind' }),
  gale: effect('spiral', ['#8abed8', '#e6faff', '#4f76a8'], 460, 9, 10,
    'Wind curls in a tight spiral around the target.'),
  'wind-storm': effect('spiral', ['#8eabdc', '#f0faff', '#495b92'], 550, 12, 16,
    'A tall, wide cyclone whips around the target.', { variant: 'vortex' }),

  'dragon-blade': effect('slash', ['#a65bd1', '#f4bdff', '#60358c'], 350, 8, 6,
    'A thick violet blade cuts diagonally.'),
  'draconic-blast': effect('orb', ['#bb65eb', '#ffcbfa', '#613294'], 450, 9, 10,
    'A violet orb strikes and throws off magenta sparks.'),
  'draco-thunder': effect('bolt', ['#bf79f8', '#ffe0ff', '#6637a4'], 500, 10, 9,
    'Forked purple lightning crashes around the target.', { variant: 'storm' }),

  'shooting-star': effect('shower', ['#dca2fd', '#fff0b0', '#7161c3'], 360, 5, 3,
    'A small group of gold stars streaks downward.', { variant: 'stars' }),
  eclipse: effect('ring', ['#9e83ec', '#ffe8bc', '#302651'], 480, 11, 8,
    'A dark disk appears with a bright rim.', { variant: 'eclipse' }),
  'meteor-blitz': effect('shower', ['#e990bf', '#ffe7a8', '#70419a'], 550, 9, 10,
    'A shower of pink and gold meteors strikes in quick succession.', { variant: 'meteors' }),

  bolt: effect('bolt', ['#ffcb47', '#fff6b5', '#b07b36'], 300, 5, 5,
    'A small yellow zigzag snaps across the field.'),
  'lightning-beam': effect('beam', ['#ffe369', '#fffdd4', '#a98645'], 390, 7, 10,
    'A bright, jagged line of electricity connects caster and target.', { variant: 'lightning' }),
  thunderclap: effect('ring', ['#efb94b', '#fff7c0', '#a8793b'], 430, 10, 12,
    'A bright electric shock ring expands from the hit.', { variant: 'spark' }),
  raigeki: effect('bolt', ['#f4c34f', '#fff8a7', '#bb7633'], 550, 12, 14,
    'Several golden lightning bolts rain down.', { variant: 'storm' }),

  'sharp-claw': effect('slash', ['#f39a7d', '#fff0d3', '#98586d'], 320, 6, 5,
    'Three short claw marks rake across the target.', { variant: 'claws' }),
  'scissor-cut': effect('slash', ['#ff9b91', '#fff0e8', '#a34f70'], 390, 9, 8,
    'Two quick blades cross in a scissor cut.', { variant: 'cross' }),
  mammoth: effect('slam', ['#b39173', '#f9e4b7', '#6e4f48'], 500, 11, 10,
    'A heavy stomp kicks dust out to both sides.', { variant: 'stomp' }),
  'sharpness-5': effect('ring', ['#ffe197', '#fff9de', '#a77354'], 390, 8, 8,
    'A sharp golden glint flashes around the caster.', { variant: 'spark', self: true }),

  swallow: effect('spiral', ['#8059a3', '#ca9be6', '#3b254a'], 390, 7, 9,
    'A dark purple spiral curls inward.', { variant: 'inward' }),
  'shadow-blast': effect('orb', ['#674587', '#c692e2', '#291e3b'], 460, 8, 11,
    'A shadowy orb with a violet rim bursts at the target.', { variant: 'shadow' }),
  'false-reap': effect('slash', ['#ab7abc', '#e1bcf0', '#503056'], 500, 11, 12,
    'A broad violet crescent sweeps like a scythe.', { variant: 'crescent' }),

  'vine-swat': effect('roots', ['#76a34b', '#cae782', '#41613a'], 350, 5, 5,
    'A thin green vine lashes across the ground.'),
  'bud-bud-blast': effect('shower', ['#93c36e', '#f8d5b3', '#4d7a53'], 430, 6, 9,
    'Small buds scatter in a spray of pale petals.', { variant: 'leaves' }),
  'dead-orchard': effect('roots', ['#8d9252', '#d6c17e', '#55473c'], 530, 11, 13,
    'Dry orchard roots branch up around the target.'),

  'rust-cut': effect('slash', ['#b97556', '#edb190', '#6b4148'], 330, 5, 6,
    'A rusty slash leaves a spray of copper flecks.'),
  'sliver-sword': effect('slash', ['#a7b4c5', '#f1f6ff', '#546076'], 400, 9, 7,
    'A bright sliver of steel sweeps across the target.', { variant: 'crescent' }),
  tungsten: effect('slam', ['#858da5', '#d2dbe8', '#474f65'], 510, 10, 10,
    'A dense gray weight hits with a metallic scatter.', { variant: 'weight' }),
  weaponize: effect('ring', ['#b0bec7', '#eff9ff', '#576c81'], 470, 10, 9,
    'Steel plates snap into place around the caster.', { variant: 'armor', self: true }),
});

export function getAuradonMoveEffect(id) {
  return Object.hasOwn(AURADON_MOVE_EFFECTS, id) ? AURADON_MOVE_EFFECTS[id] : undefined;
}
