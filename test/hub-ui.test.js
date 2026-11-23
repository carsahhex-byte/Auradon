import test from 'node:test';
import assert from 'node:assert/strict';
import { createHub } from '../src/hub.js';
import { accountData } from '../src/accounts.js';
import { createStarterDeck, getDeckValidation, setDeckQuantity } from '../src/decks.js';
import { createHubStorage } from '../src/hub-storage.js';
import { ELEMENTS } from '../src/elements.js';
import { SPELLBOOK_1, SPELLBOOK_2 } from '../src/spellbooks.js';

class BrowserStorage {
  items = new Map();
  get length() { return this.items.size; }
  key(index) { return [...this.items.keys()][index] ?? null; }
  getItem(key) { return this.items.get(key) ?? null; }
  setItem(key, value) { this.items.set(key, String(value)); }
}

// The event boundary is sufficient here: rendering and click handlers remain
// real, while browser layout and artwork are covered by visual checks.
class HubRoot {
  classList = { add() {} };
  style = { setProperty() {} };
  dataset = {};
  listeners = new Map();
  innerHTML = '';
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  contains(node) { return Boolean(node); }
  click(action, data = {}) {
    const target = { dataset: { wzAction: action, ...data }, disabled: false, closest() { return this; } };
    this.listeners.get('click')({ target, detail: 0 });
  }
}

const book = bookId => ({ savedDecks: Object.fromEntries(ELEMENTS.map(element => [element, createStarterDeck(element, bookId)])), drafts: null, cloudDecks: null });
function setupHub(t, { profileElement = 'earth', ready = ['earth'] } = {}) {
  const storage = new BrowserStorage();
  const mockGlobal = (name, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; });
  };
  const legacy = book(SPELLBOOK_1), active = book(SPELLBOOK_2);
  for (const element of ready) active.savedDecks[element] = setDeckQuantity(active.savedDecks[element], ({ earth: 'Earth-1', fire: 'Fire-11', water: 'Water-1' })[element], 3);
  legacy.drafts = structuredClone(legacy.savedDecks);
  active.drafts = structuredClone(active.savedDecks);
  createHubStorage(storage).save({ profile: { name: 'Test wizard', element: profileElement }, ...legacy, spellbook2: active });
  const location = { hash: '#home' };
  mockGlobal('localStorage', storage);
  mockGlobal('location', location);
  mockGlobal('history', { pushState(_state, _title, hash) { location.hash = hash; } });
  mockGlobal('document', { activeElement: null, querySelector() { return null; } });
  mockGlobal('window', { addEventListener() {} });
  t.mock.method(globalThis, 'setTimeout', () => 0);
  const root = new HubRoot(), battles = [];
  const hub = createHub({ root, onBattle: details => battles.push(details) });
  return { root, hub, battles, storage };
}
const pressed = (root, seat, element) => new RegExp(`data-wz-seat="${seat}" data-wz-element="${element}"[^>]*aria-pressed="true"`).test(root.innerHTML);

test('shared-screen chooser starts Earth mirrors with the existing saved deck', t => {
  const { root, hub, battles } = setupHub(t);
  hub.showBattleChooser();
  assert.equal(root.dataset.wzScreen, 'battle-setup');
  assert.match(root.innerHTML, /Player 1/);
  assert.match(root.innerHTML, /Player 2/);
  assert.equal(pressed(root, 0, 'earth'), true);
  root.click('battle-element', { wzSeat: '1', wzElement: 'earth' });
  root.click('start-local-battle');
  assert.equal(battles.length, 1);
  assert.deepEqual(battles[0].selectedElements, ['earth', 'earth']);
  assert.equal(battles[0].forceNew, true);
  assert.deepEqual(battles[0].decks.earth.entries, [{ spellId: 'Earth-1', quantity: 3 }]);
  assert.deepEqual(hub.getSavedDecks().fire.entries, []);
  assert.deepEqual(hub.getSavedDecks().water.entries, []);
});

test('empty slots use starter decks without writing to saved decks', t => {
  const { root, hub, battles } = setupHub(t, { ready: [] });
  hub.showBattleChooser();
  root.click('battle-element', { wzSeat: '1', wzElement: 'water' });
  assert.equal(pressed(root, 0, 'earth'), true);
  assert.equal(pressed(root, 1, 'water'), true);
  assert.match(root.innerHTML, /Water starter deck · 12 slabs/);
  root.click('start-local-battle');
  assert.equal(battles.length, 1);
  assert.deepEqual(battles[0].selectedElements, ['earth', 'water']);
  for (const element of ELEMENTS) {
    assert.equal(getDeckValidation(battles[0].decks[element]).total, 12);
    assert.deepEqual(hub.getSavedDecks()[element].entries, []);
  }
});

test('the Home menu exposes seven titled pages and returns to the map from each', t => {
  const { root, hub } = setupHub(t);
  const destinations = [
    ['dons', 'Dons'], ['inventory', 'Inventory'], ['storybook', 'Storybook'],
    ['settings', 'Settings'], ['friends', 'Friends'], ['auradon-library', 'Auradon Library'],
    ['online-battle', 'Online battle'],
  ];
  hub.show('home');
  assert.match(root.innerHTML, /aria-controls="wz-game-menu" aria-expanded="false"/);
  assert.match(root.innerHTML, /<dialog id="wz-game-menu"/);
  for (const [slug, title] of destinations) {
    const route = `menu/${slug}`;
    assert.ok(root.innerHTML.includes(`data-wz-destination="${route}"`));
    root.click('map-menu-destination', { wzDestination: route });
    assert.equal(location.hash, `#${route}`);
    assert.ok(root.innerHTML.includes(`<h1 tabindex="-1">${title}</h1>`));
    assert.doesNotMatch(root.innerHTML, /wz-map-viewport|wz-rolodex-list/);
    root.click('home');
    assert.equal(location.hash, '#home');
  }
});

test('the Rolodex route updates the large portrait for all 11 entries', t => {
  const { root, hub, battles, storage } = setupHub(t, { profileElement: 'fire', ready: ['earth', 'fire'] });
  hub.show('title');
  assert.match(root.innerHTML, /<h1 tabindex="-1">Auradon<\/h1>/);
  hub.show('home');
  assert.match(root.innerHTML, /wz-map-banner-label">Auradon<\/span>/);
  const before = new Map(storage.items);
  hub.show('dons');
  assert.equal(location.hash, '#dons');
  assert.match(root.innerHTML, /<h1 tabindex="-1">Rolodex<\/h1>/);
  assert.match(root.innerHTML, /<figcaption>Aur-1<\/figcaption>/);
  assert.doesNotMatch(root.innerHTML, /Spell Workshop|save-deck|deck-upload/);
  for (let index = 1; index <= 11; index++) {
    root.click('select-aur', { wzAur: String(index) });
    assert.ok(root.innerHTML.includes(`<figcaption>Aur-${index}</figcaption>`));
    assert.match(root.innerHTML, new RegExp(`data-wz-aur="${index}"[^>]*aria-pressed="true"`));
    assert.equal((root.innerHTML.match(/aria-pressed="true"/g) || []).length, 1);
  }
  assert.deepEqual(storage.items, before);
  hub.show('friends');
  root.click('battle');
  assert.equal(battles.at(-1).element, 'fire');
  assert.equal(battles.at(-1).selectedElements, undefined);
  hub.showBattleChooser();
  assert.equal(pressed(root, 0, 'fire'), true);
});

test('Earth character uses Golem status and supports the Earth profile accent', t => {
  const { root, hub } = setupHub(t);
  hub.show('character');
  assert.match(root.innerHTML, /wz-character-stage wz-earth/);
  assert.match(root.innerHTML, /GOLEM<\/span><strong>Inactive/);
  assert.doesNotMatch(root.innerHTML, /Runes/i);
});

test('account switching keeps guest and account saved decks in their own slots', t => {
  const { root, hub, storage, battles } = setupHub(t);
  const account = { id: 'alice-earth', username: 'alice', profile: { name: 'Alice', element: 'earth' },
    decks: book(SPELLBOOK_1).savedDecks, spellbook2Decks: book(SPELLBOOK_2).savedDecks };
  account.spellbook2Decks.earth = setDeckQuantity(account.spellbook2Decks.earth, 'Earth-2', 5);
  hub.applyAccountData(account);
  hub.showBattleChooser();
  root.click('start-local-battle');
  assert.deepEqual(battles[0].decks.earth, account.spellbook2Decks.earth);
  assert.deepEqual(createHubStorage(storage).readAccount(account.id).spellbook2.savedDecks.earth, account.spellbook2Decks.earth);
  hub.clearAccountData();
  assert.equal(hub.getProfile().name, 'Test wizard');
  assert.deepEqual(hub.getSavedDecks().earth.entries, [{ spellId: 'Earth-1', quantity: 3 }]);
  hub.applyAccountData(account);
  assert.equal(createHubStorage(storage).load().state.accountId, account.id);
});

test('account payload migrates absent Earth slots without changing Fire, Water, or its input', () => {
  const decks = { fire: setDeckQuantity(createStarterDeck('fire'), 'Fire-1', 4), water: createStarterDeck('water') };
  const spellbook2Decks = { fire: setDeckQuantity(createStarterDeck('fire', SPELLBOOK_2), 'Fire-11', 4), water: createStarterDeck('water', SPELLBOOK_2) };
  const input = { profile: { name: 'Returning wizard', element: 'water' }, decks, spellbook2Decks };
  const before = structuredClone(input), normalized = accountData(input);
  assert.deepEqual(input, before);
  for (const element of ['fire', 'water']) {
    assert.deepEqual(normalized.decks[element], input.decks[element]);
    assert.deepEqual(normalized.spellbook2Decks[element], input.spellbook2Decks[element]);
  }
  assert.deepEqual(normalized.decks.earth, createStarterDeck('earth'));
  assert.deepEqual(normalized.spellbook2Decks.earth, createStarterDeck('earth', SPELLBOOK_2));
});

test('Earth account payload allows unlimited copies within 30 slabs and rejects illegal Earth slots', () => {
  const decks = book(SPELLBOOK_1).savedDecks, spellbook2Decks = book(SPELLBOOK_2).savedDecks;
  decks.earth = setDeckQuantity(decks.earth, 'Earth-1', 30);
  spellbook2Decks.earth = setDeckQuantity(spellbook2Decks.earth, 'Earth-1', 30);
  const input = { profile: { name: 'Earth wizard', element: 'earth' }, decks, spellbook2Decks };
  const normalized = accountData(input);
  assert.equal(normalized.spellbook2Decks.earth.entries[0].quantity, 30);
  for (const earth of [null, { element: 'earth', entries: [{ spellId: 'Fire-1', quantity: 1 }] }, { element: 'earth', entries: [{ spellId: 'Earth-1', quantity: 31 }] }]) {
    assert.throws(() => accountData({ ...input, decks: { ...decks, earth } }));
  }
});
