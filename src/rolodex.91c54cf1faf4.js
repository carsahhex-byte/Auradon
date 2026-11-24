import { ASSETS } from './assets.1602afe6ba3f.js';

const spriteDescriptions = [
  'Red bird with a swept crest and layered feathers',
  'Green horned quadruped with a rocky shell',
  'White and pale blue wolf with a jagged crest',
  'Green frog with a clover-tipped tail',
  'Cream-colored creature with orange autumn leaves',
  'Teal snail with a large purple spiral shell',
  'Pale blue dragon with a cloud above its back',
  'Teal creature with antennae and a golden ring',
  'Black and white orca-like creature with four flippers',
  'Brown birdlike creature with a leafy tree for a tail',
  'Golden dragon with two large wings',
];

const sprites = spriteDescriptions.map((description, index) => ({
  number: index + 1,
  name: `Aur-${index + 1}`,
  url: ASSETS[`aur${index + 1}`],
  description,
}));

export function rolodexMarkup(selected = 1) {
  const sprite = sprites[selected - 1] || sprites[0];
  const rows = sprites.map(({ number, name, url }) => `
    <li><button type="button" class="wz-rolodex-row" data-wz-action="select-aur" data-wz-aur="${number}" data-wz-focus="aur-${number}" aria-controls="wz-rolodex-preview" aria-pressed="${number === sprite.number}">
      <img src="${url}" alt="" draggable="false" loading="lazy">
      <span>${name}</span>
    </button></li>`).join('');

  return `<section class="wz-rolodex" aria-label="Aur collection">
    <figure id="wz-rolodex-preview" class="wz-rolodex-preview">
      <img src="${sprite.url}" alt="${sprite.description}" draggable="false">
      <figcaption>${sprite.name}</figcaption>
    </figure>
    <ol class="wz-rolodex-list" data-wz-scroll="rolodex-list" aria-label="Aur sprites" role="list">${rows}</ol>
  </section>`;
}
