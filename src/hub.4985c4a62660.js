import { ASSETS, ASSET_CROPS, MAP_UI_CROPS } from './assets.ade5b847b81c.js';
import { MAX_HP, MAX_MANA, MAX_SHIELD, MAX_FLOW, MAX_EMBERS } from './effects.17b76112a157.js';
import { createStarterDeck, getBattleDeck, getDeckValidation, validateDeck, validateDeckSlot, normalizeDeckSlot } from './decks.937e5d31de2c.js';
import { SPELLBOOK_1, SPELLBOOK_2, getDeckSpellbook, ACTIVE_SPELLBOOK_ID } from './spellbooks.20bd769300e2.js';
import { createHubStorage, restoreHubDraft as restoreDraft } from './hub-storage.48f0ef05401f.js';
import { ELEMENTS, ELEMENT_INFO } from './elements.f91c53cdab44.js';
import { DISTRICTS, getDistrict, normalizeDistrictId } from './districts.41d180c8958a.js';
import { roughScreenStone, roughWizardPortrait, roughPartyArt } from './hub-art.4e60c5536f07.js';
import { pixelIconMarkup } from './pixel-icons.5b791d388b81.js';
import { rolodexMarkup } from './rolodex.5ddc947888a4.js';

const HUB_SCREENS = new Set(['title', 'home', 'character', 'friends', 'dons', 'storybook', 'battle-setup']);
const MAP_MENU_TITLES = Object.freeze({
  'menu/dons': 'Auradons',
  'menu/inventory': 'Inventory',
  'menu/storybook': 'Storybook',
  'menu/settings': 'Settings',
  'menu/friends': 'Friends',
  'menu/auradon-library': 'Auradon Library',
  'menu/battle': 'Battle',
});

export function isHubScreen(screen) {
  return HUB_SCREENS.has(screen) || Object.hasOwn(MAP_MENU_TITLES, screen);
}

// The square artwork includes ocean around the city. Its artwork and labels
// share one coordinate system, so the coast moves with every pan and zoom.
const MAP_SIZE = 2048;
const mapScale = (width, height, zoom) => Math.max(width, height) / MAP_SIZE * zoom;
const escapeHub = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cloneHub = value => structuredClone(value);
const elementName = value => ELEMENT_INFO[value]?.name || 'Fire';
const elementSymbol = value => pixelIconMarkup(value, 'wz-school-icon') || '✧';
const deckSignature = deck => JSON.stringify([...deck.entries].sort((a, b) => a.spellId.localeCompare(b.spellId)));


function hubArt(key, className = '', cropOverride = null) {
  const crop = ASSET_CROPS[key] && { ...ASSET_CROPS[key], ...cropOverride };
  if (!crop || !ASSETS[key]) return '';
  return `<span class="wz-cropped ${className}" style="aspect-ratio:${crop.w}/${crop.h}${crop.clipPath?`;clip-path:${crop.clipPath}`:''}"><img alt="" draggable="false" src="${escapeHub(ASSETS[key])}" style="width:${crop.width / crop.w * 100}%;height:${crop.height / crop.h * 100}%;left:${-crop.x / crop.w * 100}%;top:${-crop.y / crop.h * 100}%"></span>`;
}

function mapUiArt(name, className = '') {
  const crop=MAP_UI_CROPS[name];
  return crop?hubArt(crop.asset,`wz-map-ui-art ${className}`,crop):'';
}

function mapBannerArt() {
  // Sample unlettered parchment from each side of the original banner.
  const parchment = [
    hubArt('mapTitle', '', { x: 308, y: 235, w: 130, h: 268 }),
    hubArt('mapTitle', '', { x: 1692, y: 235, w: 106, h: 268 }),
  ].join('').repeat(5);
  return `<span class="wz-map-banner-face" aria-hidden="true">${mapUiArt('mapBanner')}<span class="wz-map-banner-parchment">${parchment}</span><span class="wz-map-banner-label">Auradon</span></span>`;
}

function mapFrameArt() {
  return `<div class="wz-map-frame-art" aria-hidden="true">${[
    ['mapFrameTop','wz-frame-top'],['mapFrameBottom','wz-frame-bottom'],
    ['mapFrameLeft','wz-frame-left'],['mapFrameRight','wz-frame-right'],
    ['mapFrameNW','wz-frame-nw'],['mapFrameNE','wz-frame-ne'],
    ['mapFrameSW','wz-frame-sw'],['mapFrameSE','wz-frame-se'],
  ].map(([name,style])=>mapUiArt(name,style)).join('')}</div>`;
}

function hubHead(element) {
  if (element === 'earth') return hubArt('earthMage');
  return element === 'water'
    ? hubArt('waterMage', '', { x: 362, y: 114, w: 620, h: 490 })
    : hubArt('fireMage', '', { x: 240, y: 117, w: 640, h: 500 });
}

function hubIcon(name, className = '') {
  const positions = { character: '0% 0%', deck: '50% 0%', friends: '100% 0%', battle: '0% 100%', pin: '50% 100%', compass: '100% 100%' };
  const symbols = { character: '♟', deck: '▤', friends: '♟♟', battle: '⚔', pin: '◆', compass: '✦' };
  return `<span class="wz-icon ${className}" aria-hidden="true" style="--wz-icon-position:${positions[name] || positions.compass}"><span>${symbols[name] || '✦'}</span></span>`;
}

/** Mobile navigation, profile, and the Dons Rolodex. The battle host owns duel state. */
export function createHub({ root, onBattle = () => {}, onMultiplayer = () => {}, onAccount = () => {}, onSaveLocal = () => {}, onMapMenuDestination = () => false, assets = {} }) {
  if (!root) throw new Error('The Auradon hub needs a root element.');
  root.classList.add('wz-hub-root');
  root.hidden = true;
  const scene = assets.titleScene || ASSETS.titleScene || ASSETS.forest;
  const map = assets.seattleExpanded || ASSETS.seattleExpanded;
  const atlas = assets.iconAtlas || ASSETS.iconAtlas;
  const storybookPaper = assets.storybookPaper || ASSETS.storybookPaper;
  if (scene) root.style.setProperty('--wz-title-scene', `url("${scene}")`);
  if (map) root.style.setProperty('--wz-map-scene', `url("${map}")`);
  if (storybookPaper) root.style.setProperty('--wz-storybook-paper', `url("${storybookPaper}")`);
  if (atlas) {
    root.style.setProperty('--wz-icon-atlas', `url("${atlas}")`);
    root.classList.add('wz-has-atlas');
  }

  let deviceStorage = null;
  try { deviceStorage = globalThis.localStorage; } catch {}
  const persistence = createHubStorage(deviceStorage);
  let storageAvailable = persistence.isAvailable();
  let screen = 'title';
  let visible = false;
  let selectedAur = 1;
  let selectedBattleElements = ['fire', 'water'];
  let battleSetupReturn = 'home';
  let storybookDistrictId = null;
  let mapReturnDistrictId = null;
  const expandedDistricts = new Set();
  const mapStart = { zoom: 4, cx: .505, cy: .436 };
  let mapView = { ...mapStart };
  let mapDrag = null;
  let suppressMapClickUntil = 0;
  const mapObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => applyMapView()) : null;
  let notice = '';
  let activeMigrationNotice = '';
  let noticeTimer;
  let profile = { name: 'Auradon', element: 'fire' };
  const emptyBook = bookId => ({ savedDecks: Object.fromEntries(ELEMENTS.map(element => [element, createStarterDeck(element, bookId)])), drafts: null, cloudDecks: null });
  let books = { [SPELLBOOK_1]: emptyBook(SPELLBOOK_1), [SPELLBOOK_2]: emptyBook(SPELLBOOK_2) };
  for (const book of Object.values(books)) book.drafts = cloneHub(book.savedDecks);
  let activeAccountId = null;
  let accountUsername = '';
  let accountStatus = { state: 'guest', message: '' };
  let guestSnapshot = null;

  const restored = persistence.load();
  storageAvailable = restored.available;
  if (restored.state) {
    const { savedDecks, drafts, cloudDecks } = restored.state;
    ({ profile, accountId: activeAccountId, accountUsername } = restored.state);
    books[SPELLBOOK_1] = { savedDecks, drafts, cloudDecks };
    if (restored.state.spellbook2) books[SPELLBOOK_2] = restored.state.spellbook2;
    if (activeAccountId) accountStatus = { state: 'offline', message: 'Saved on this device. Connect to sync your account.' };
    if (restored.recovered) notice = 'Your saved Auradon data was restored from this device.';
    activeMigrationNotice = restored.state.activeMigrationNotice || '';
  }
  if (!storageAvailable) notice = 'Device storage is unavailable. You can still play with starter decks.';
  selectedBattleElements = defaultBattleElements(profile.element);
  guestSnapshot = activeAccountId ? restored.guestSnapshot : snapshotHub();
  // Promote recovered saves to stable mirrored keys before the next update.
  if (restored.state) persistHub();

  function snapshotHub() {
    return cloneHub({ profile, ...books[SPELLBOOK_1], spellbook2: books[ACTIVE_SPELLBOOK_ID], selectedSpellbookId: ACTIVE_SPELLBOOK_ID, activeMigrationNotice });
  }
  function persistHub() {
    const stored = persistence.save({ ...snapshotHub(), accountId: activeAccountId, accountUsername });
    storageAvailable = persistence.isAvailable();
    if (stored && !activeAccountId) guestSnapshot = snapshotHub();
    return stored;
  }
  function messageHub(text) {
    notice = text;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice = ''; if (visible) render(); }, 4500);
  }
  function footerHub() {
    const build = document.querySelector('meta[name="auradon-build"]')?.content;
    const storageLabel = !storageAvailable ? 'DEVICE SAVING UNAVAILABLE' : !activeAccountId ? 'SAVED ON THIS DEVICE' : accountStatus.state === 'synced' ? 'ACCOUNT DECKS SYNCED' : accountStatus.state === 'syncing' ? 'SYNCING ACCOUNT…' : 'SAVED LOCALLY · SYNC PENDING';
    return `<footer class="wz-footer"><span>${storageLabel}</span><span>${build && build !== 'development' ? `BUILD ${escapeHub(build)}` : 'AURADON · FIRST JOURNEY'}</span></footer>`;
  }
  function accountPanelHub() {
    return `<button class="wz-account-entry" data-wz-action="account"><span aria-hidden="true">✦</span><span><strong>${activeAccountId ? escapeHub(accountUsername || 'Your account') : 'Sign in to Auradon'}</strong><small>${escapeHub(activeAccountId ? accountStatus.message || 'Your profile and decks follow your account.' : 'Keep your saved decks across phones.')}</small></span><b aria-hidden="true">›</b></button>`;
  }
  function topHub(title, subtitle = '') {
    return `<header class="wz-header"><button class="wz-back" data-wz-action="home" aria-label="Back to Seattle map">‹</button><div><p class="wz-eyebrow">${subtitle || 'AURADON · SEATTLE'}</p><h1 tabindex="-1">${title}</h1></div><button class="wz-mini-avatar" data-wz-action="character" aria-label="Open your character">${hubHead(profile.element)}</button></header>`;
  }
  function profileElements() {
    return `<div class="wz-element-switch" role="group" aria-label="Choose your wizard element">${ELEMENTS.map(id => `<button class="wz-element-tab wz-${id} ${profile.element === id ? 'wz-active' : ''}" data-wz-action="profile-element" data-wz-element="${id}" data-wz-focus="profile-${id}" aria-pressed="${profile.element === id}"><span aria-hidden="true">${elementSymbol(id)}</span> ${elementName(id)}</button>`).join('')}</div>`;
  }
  function titleHub() {
    return `<section class="wz-phone wz-title-screen"><div class="wz-title-shade"></div><div class="wz-title-brand"><p class="wz-eyebrow">A LITTLE MAGIC. A WHOLE CITY.</p><h1 tabindex="-1">Auradon</h1><p class="wz-title-subtitle">YOUR JOURNEY BEGINS IN SEATTLE</p></div><div class="wz-title-entry"><span class="wz-spark wz-spark-left" aria-hidden="true">✦</span><button class="wz-pixel-button wz-enter" data-wz-action="enter">Enter Game <span aria-hidden="true">→</span></button><span class="wz-spark wz-spark-right" aria-hidden="true">✦</span><p>EXPLORE THE CITY. FIND YOUR MAGIC.</p><button class="wz-title-account" data-wz-action="account">${activeAccountId ? 'Your account' : 'Sign in / Create account'}</button></div><div class="wz-title-bottom"><span class="wz-tiny-star" aria-hidden="true">✧</span><p>FIRE · WATER · EARTH · FATE</p></div>${footerHub()}</section>`;
  }
  function mapMenuHub() {
    const choices = Object.entries(MAP_MENU_TITLES).map(([route, title]) => `
      <button type="button" class="wz-map-menu-row" data-wz-action="map-menu-destination" data-wz-destination="${route}" data-wz-focus="${route}">
        <span>${title}</span><span aria-hidden="true">›</span>
      </button>`).join('');
    return `<dialog id="wz-game-menu" class="wz-map-menu" aria-labelledby="wz-map-menu-title">
      <div class="wz-map-menu-sheet">
        <header class="wz-map-menu-header">
          <h2 id="wz-map-menu-title">Game menu</h2>
          <button type="button" class="wz-map-menu-close" data-wz-action="close-map-menu" data-wz-focus="map-menu-close" aria-label="Close game menu">×</button>
        </header>
        <nav class="wz-map-menu-options" data-wz-scroll="map-menu-options" aria-label="Game screens">${choices}</nav>
      </div>
    </dialog>`;
  }
  function mapMenuScreenHub(title) {
    return `<section class="wz-phone wz-panel-screen wz-menu-screen">
      <header class="wz-header">
        <button type="button" class="wz-back" data-wz-action="home" aria-label="Back to Seattle map">‹</button>
        <h1 tabindex="-1">${title}</h1>
      </header>
    </section>`;
  }
  function openMapMenu() {
    const menu = root.querySelector('#wz-game-menu');
    if (!menu || menu.open) return;
    menu.showModal();
    root.querySelector('.wz-map-menu-trigger')?.setAttribute('aria-expanded', 'true');
  }
  function closeMapMenu() {
    const menu = root.querySelector('#wz-game-menu');
    if (!menu?.open) return;
    menu.close();
    root.querySelector('.wz-map-menu-trigger')?.setAttribute('aria-expanded', 'false');
  }
  root.addEventListener('close', event => {
    if (event.target.id === 'wz-game-menu' && root.contains(event.target) && !event.target.open) {
      root.querySelector('.wz-map-menu-trigger')?.setAttribute('aria-expanded', 'false');
    }
  }, true);

  function homeHub() {
    return `<section class="wz-phone wz-home-screen">
      <div class="wz-home-stone" aria-hidden="true">${Array.from({length:72},()=>mapUiArt('mapStoneTexture','wz-map-stone-tile')).join('')}</div>
      <header class="wz-map-header"><button type="button" class="wz-small-wordmark wz-map-back" data-wz-action="title" aria-label="Return to Auradon title screen" title="Back to title">${mapUiArt('mapTopBack')}</button><button type="button" class="wz-profile-chip wz-map-banner" data-wz-action="character" aria-label="Open ${escapeHub(profile.name)}’s ${elementName(profile.element)} character" title="Open your character">${mapBannerArt()}</button></header>
      <div class="wz-map-toolbar"><div class="wz-map-view-controls" role="group" aria-label="Map view"><button type="button" class="wz-map-toolbar-fit" data-wz-action="map-overview" aria-label="Show the whole Seattle map" title="Whole map">${mapUiArt('mapToolbarFit')}</button><button type="button" data-wz-action="map-zoom-out" aria-label="Zoom out on map">${mapUiArt('mapToolbarZoomOut')}</button><output class="wz-map-zoom" aria-label="Map zoom">4×</output><button type="button" data-wz-action="map-zoom-in" aria-label="Zoom in on map">${mapUiArt('mapToolbarZoomIn')}</button><button type="button" data-wz-action="map-center" aria-label="Center map on South Lake Union" title="South Lake Union">${mapUiArt('mapToolbarCompass')}</button></div></div>
      <div class="wz-map-frame">
      <div class="wz-map-viewport" tabindex="0" role="region" aria-label="Seattle district map, drag to explore" aria-describedby="wz-map-instructions">
        <div class="wz-map-world">
          <div class="wz-map-art" aria-hidden="true"></div>
          <div class="wz-map-city" aria-label="Storybook districts">
          ${DISTRICTS.map(item => `<button type="button" class="wz-district-marker" data-wz-action="district" data-wz-district="${item.id}" data-wz-focus="district-${item.id}" style="left:${item.position.x*100}%;top:${item.position.y*100}%;--wz-marker-offset-y:${({1:4,10:-4,14:4,15:-4})[item.id]||0}px" aria-label="District ${item.id}: ${escapeHub(item.name)}. Open Storybook chapter." title="${item.id} · ${escapeHub(item.name)}"><span class="wz-district-number" aria-hidden="true">${item.id}</span></button>`).join('')}
          <div class="wz-you-marker" role="img" aria-label="Your location, preview position only"><img src="${escapeHub(assets.wizardLocation || ASSETS.wizardLocation)}" alt="" draggable="false"></div>
          </div>
        </div>
      </div>
      ${mapFrameArt()}
      <button type="button" class="wz-map-menu-trigger" data-wz-action="open-map-menu" data-wz-focus="map-menu-trigger" aria-label="Game menu" aria-haspopup="dialog" aria-controls="wz-game-menu" aria-expanded="false"><span class="wz-map-menu-glyph" aria-hidden="true"></span></button>
      </div>
      <p id="wz-map-instructions" class="sr-only">Drag the map with a mouse or finger. Tap a numbered district to read its Storybook chapter. Fit shows the complete city. With the map focused, use arrow keys to explore, plus and minus to zoom, or Home to center South Lake Union.</p>

      <p class="wz-map-preview">PREVIEW LOCATION</p>${footerHub()}${mapMenuHub()}</section>`;
  }

  function storybookHub() {
    return `<section class="wz-phone wz-panel-screen wz-storybook-screen">${topHub('Storybook', 'YOUR SEATTLE JOURNEY')}<div class="wz-storybook-scroll" data-wz-scroll="storybook"><div class="wz-journal-districts">${DISTRICTS.map(item => `<details class="wz-journal-district" id="wz-story-district-${item.id}" data-wz-story-district="${item.id}" ${expandedDistricts.has(item.id)?'open':''}><summary id="wz-district-summary-${item.id}" data-wz-focus="journal-${item.id}" aria-controls="wz-district-content-${item.id}"><span class="wz-journal-number" aria-hidden="true">${item.id}</span><span><strong>${escapeHub(item.name)}</strong></span><span class="wz-journal-arrow" aria-hidden="true"><i></i></span></summary><div class="wz-district-content" id="wz-district-content-${item.id}"><h2 class="wz-mainquest-title">Mainquest ${item.id}</h2><p class="wz-mainquest-boss"${item.boss?'':' aria-hidden="true"'}>${escapeHub(item.boss)||'&nbsp;'}</p></div></details>`).join('')}</div></div>${footerHub()}</section>`;
  }
  function resetStorybook() {
    storybookDistrictId=null;
    expandedDistricts.clear();
    for(const details of root.querySelectorAll('[data-wz-story-district][open]'))details.open=false;
  }
  function focusStorybookDistrict(id) {
    const details=root.querySelector(`[data-wz-story-district="${id}"]`);
    const scroll=root.querySelector('.wz-storybook-scroll');
    if(!details||!scroll)return;
    details.open=true;
    expandedDistricts.add(id);
    scroll.scrollTop+=details.getBoundingClientRect().top-scroll.getBoundingClientRect().top-10;
    details.querySelector('summary')?.focus({preventScroll:true});
  }
  root.addEventListener('toggle',event=>{
    const details=event.target;
    if(!visible||screen!=='storybook'||!root.contains(details)||!details.matches?.('[data-wz-story-district]'))return;
    const id=normalizeDistrictId(details.dataset.wzStoryDistrict);
    if(id===null)return;
    if(details.open)expandedDistricts.add(id);else expandedDistricts.delete(id);
  },true);
  function characterHub() {
    const saved = books[ACTIVE_SPELLBOOK_ID].savedDecks[profile.element];
    const total = getDeckValidation(getBattleDeck(saved, profile.element)).total;
    return `<section class="wz-phone wz-panel-screen wz-character-screen wz-rough-screen">${roughScreenStone('character')}${topHub('Your Wizard', 'CHARACTER')}<div class="wz-page-scroll" data-wz-scroll="character">${accountPanelHub()}<div class="wz-character-stage wz-${profile.element}"><span class="wz-character-halo"></span>${roughWizardPortrait(profile.element, 'wz-character-art') || hubArt(`${profile.element}Mage`, 'wz-character-art')}<div class="wz-character-plaque"><strong>${escapeHub(profile.name)}</strong><span>${elementName(profile.element)} wizard</span></div></div><div class="wz-paper-panel"><form class="wz-profile-form"><label for="wz-character-name">Wizard name</label><div class="wz-name-row"><input id="wz-character-name" name="wizardName" maxlength="24" value="${escapeHub(profile.name)}" autocomplete="nickname" data-wz-focus="wizard-name"><button class="wz-small-button" type="submit">Save</button></div></form><p class="wz-field-label">YOUR ELEMENT</p>${profileElements()}<p class="wz-element-help">Your element chooses your wizard portrait and your default battle element.</p><div class="wz-stat-heading">DUEL STARTING STATS · CURRENT / MAXIMUM</div><div class="wz-profile-stats"><div><span>HP</span><strong>${MAX_HP} / ${MAX_HP}</strong></div><div><span>MANA</span><strong>3 / ${MAX_MANA}</strong></div><div><span>SHIELD</span><strong>0 / ${MAX_SHIELD}</strong></div><div><span>${profile.element === 'earth' ? 'GOLEM' : profile.element === 'water' ? 'FLOW' : 'EMBERS'}</span><strong>${profile.element === 'earth' ? 'Inactive' : `0 / ${profile.element === 'water' ? MAX_FLOW : MAX_EMBERS}`}</strong></div></div><div class="wz-profile-deck">${hubIcon('deck')}<span>${elementName(profile.element)} ${saved?.entries.length ? 'saved' : 'starter'} deck<small>${total} ${total === 1 ? 'slab' : 'slabs'}</small></span></div></div><p class="wz-page-note">Your name, element, and saved decks stay on this device. Story progression will grow with the city.</p></div>${footerHub()}</section>`;
  }
  function friendsHub() {
    return `<section class="wz-phone wz-panel-screen wz-friends-screen wz-rough-screen">${roughScreenStone('friends')}${topHub('Your Party', 'FRIENDS')}<div class="wz-page-scroll" data-wz-scroll="friends"><div class="wz-party-art" aria-hidden="true">${roughPartyArt()}</div><div class="wz-empty-party"><p class="wz-eyebrow">ADVENTURES ARE BETTER TOGETHER</p><h2>A place for your party.</h2><p>Your friends list and messages will live here. For now, invite a friend to a battle with a room code.</p><div class="wz-friend-features"><span>${hubIcon('friends')} Add friends</span><span>${hubIcon('battle')} Challenge a wizard</span><span class="wz-message-feature"><i aria-hidden="true">▤</i> Send messages</span></div><span class="wz-preview-tag">FRIENDS SCREEN PREVIEW</span></div><div class="wz-local-play-panel"><strong>Bring a friend into the battle.</strong><p>Create a room or join with a code to test on two screens.</p><button class="wz-pixel-button" data-wz-action="multiplayer">${hubIcon('battle')} Create or join a battle</button><button class="wz-small-button wz-shared-screen" data-wz-action="battle">Play on this screen</button></div></div>${footerHub()}</section>`;
  }
  function donsHub() {
    return `<section class="wz-phone wz-panel-screen wz-rolodex-screen wz-rough-screen">${roughScreenStone('deck')}${topHub('Rolodex', 'DONS')}${rolodexMarkup(selectedAur)}${footerHub()}</section>`;
  }

  function battleSetupHub() {
    const saved = getSavedDecks();
    const decks = getBattleDecks(saved);
    const players = selectedBattleElements.map((selected, seat) => {
      const { total } = getDeckValidation(decks[selected]);
      const kind = saved[selected]?.entries.length ? 'saved' : 'starter';
      const schools = ELEMENTS.map(element => {
        const { total } = getDeckValidation(decks[element]);
        return `<button type="button" class="wz-element-tab wz-${element} ${selected === element ? 'wz-active' : ''}" data-wz-action="battle-element" data-wz-seat="${seat}" data-wz-element="${element}" data-wz-focus="battle-${seat}-${element}" aria-pressed="${selected === element}"><span aria-hidden="true">${elementSymbol(element)}</span><strong>${elementName(element)}</strong><small>${total} ${total === 1 ? 'slab' : 'slabs'}</small></button>`;
      }).join('');
      return `<fieldset class="wz-battle-player"><legend>Player ${seat + 1}</legend><div class="wz-battle-portrait">${roughWizardPortrait(selected)}</div><div class="wz-battle-schools" role="group" aria-label="Player ${seat + 1} element">${schools}</div><p class="wz-battle-deck-status">${elementName(selected)} ${kind} deck · ${total} ${total === 1 ? 'slab' : 'slabs'}</p></fieldset>`;
    }).join('');
    return `<section class="wz-phone wz-panel-screen wz-battle-setup-screen wz-rough-screen">${roughScreenStone('battle')}<header class="wz-header"><button type="button" class="wz-back" data-wz-action="battle-setup-back" aria-label="Back">‹</button><div><p class="wz-eyebrow">TWO WIZARDS · ONE SCREEN</p><h1 tabindex="-1">Choose your battle</h1></div><span aria-hidden="true">⚔</span></header><div class="wz-page-scroll" data-wz-scroll="battle-setup"><p class="wz-battle-intro">Each player chooses an element. You can both choose the same one.</p><div class="wz-battle-player-grid">${players}</div><button type="button" class="wz-small-button wz-battle-online" data-wz-action="multiplayer">Room-code battle →</button><button type="button" class="wz-pixel-button wz-battle-start" data-wz-action="start-local-battle">Start battle →</button></div>${footerHub()}</section>`;
  }

  function defaultBattleElements(first) {
    const decks = getSavedDecks();
    const second = ELEMENTS.find(id => id !== first && validateDeck(decks[id]))
      || (validateDeck(decks[first]) ? first : ELEMENTS.find(id => id !== first));
    return [first, second];
  }

  function showBattleChooser({ element = profile.element } = {}) {
    notice = '';
    if (screen !== 'battle-setup') battleSetupReturn = screen === 'title' ? 'home' : screen;
    selectedBattleElements = defaultBattleElements(ELEMENTS.includes(element) ? element : profile.element);
    show('battle-setup');
  }

  function startSelectedBattle() {
    const decks = getBattleDecks();
    onBattle({ decks, selectedElements: [...selectedBattleElements], forceNew: true, element: selectedBattleElements[0], spellbookId: ACTIVE_SPELLBOOK_ID, profile: getProfile() });
  }

  function applyMapView() {
    const viewport = root.querySelector('.wz-map-viewport');
    const world = viewport?.querySelector('.wz-map-world');
    if (!viewport || !world || !viewport.clientWidth || !viewport.clientHeight) return;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const scale = mapScale(width, height, mapView.zoom);
    const worldWidth = MAP_SIZE * scale;
    const worldHeight = MAP_SIZE * scale;
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    mapView.cx = worldWidth <= width ? .5 : clamp(mapView.cx, width / (2 * worldWidth), 1 - width / (2 * worldWidth));
    mapView.cy = worldHeight <= height ? .5 : clamp(mapView.cy, height / (2 * worldHeight), 1 - height / (2 * worldHeight));
    world.style.transform = `translate3d(${width / 2 - mapView.cx * worldWidth}px,${height / 2 - mapView.cy * worldHeight}px,0) scale(${scale})`;
    world.style.setProperty('--wz-marker-scale', String(1 / scale));
    viewport.dataset.mapZoom = String(mapView.zoom);
    viewport.dataset.mapCenterX = String(mapView.cx);
    viewport.dataset.mapCenterY = String(mapView.cy);
    const output = root.querySelector('.wz-map-zoom');
    if (output) output.textContent = `${Number(mapView.zoom.toFixed(1))}×`;
    const zoomIn = root.querySelector('[data-wz-action="map-zoom-in"]');
    const zoomOut = root.querySelector('[data-wz-action="map-zoom-out"]');
    if (zoomIn) zoomIn.disabled = mapView.zoom >= 8;
    if (zoomOut) zoomOut.disabled = mapView.zoom <= 1;
    root.querySelector('[data-wz-action="map-overview"]')?.setAttribute('aria-pressed', String(mapView.zoom === 1));
  }
  function zoomMap(factor) {
    mapView.zoom = Math.max(1, Math.min(8, mapView.zoom * factor));
    applyMapView();
  }
  function finishMapDrag(event) {
    if (!mapDrag || (event && event.pointerId !== mapDrag.pointerId)) return;
    const drag = mapDrag;
    mapDrag = null;
    if (drag.moved) suppressMapClickUntil = Date.now() + 400;
    drag.viewport.classList.remove('wz-dragging');
    if (drag.viewport.hasPointerCapture?.(drag.pointerId)) drag.viewport.releasePointerCapture(drag.pointerId);
  }
  root.addEventListener('pointerdown', event => {
    const viewport = event.target.closest('.wz-map-viewport');
    if (!viewport || !root.contains(viewport) || event.button !== 0 || event.isPrimary === false || mapDrag) return;
    mapDrag = { pointerId: event.pointerId, viewport, x: event.clientX, y: event.clientY, cx: mapView.cx, cy: mapView.cy, moved: false };
  });
  root.addEventListener('pointermove', event => {
    if (!mapDrag || event.pointerId !== mapDrag.pointerId) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) { finishMapDrag(event); return; }
    const dx = event.clientX - mapDrag.x;
    const dy = event.clientY - mapDrag.y;
    if (!mapDrag.moved && Math.hypot(dx, dy) < 6) return;
    if (!mapDrag.moved) {
      mapDrag.moved = true;
      mapDrag.viewport.setPointerCapture(event.pointerId);
      mapDrag.viewport.classList.add('wz-dragging');
    }
    event.preventDefault();
    const scale = mapScale(mapDrag.viewport.clientWidth, mapDrag.viewport.clientHeight, mapView.zoom);
    mapView.cx = mapDrag.cx - dx / (MAP_SIZE * scale);
    mapView.cy = mapDrag.cy - dy / (MAP_SIZE * scale);
    applyMapView();
  });
  root.addEventListener('pointerup', finishMapDrag);
  root.addEventListener('pointercancel', finishMapDrag);
  root.addEventListener('lostpointercapture', event => {
    if (event.target === mapDrag?.viewport) finishMapDrag(event);
  });
  window.addEventListener('pointerup', finishMapDrag);
  window.addEventListener('pointercancel', finishMapDrag);
  window.addEventListener('blur', () => finishMapDrag());
  root.addEventListener('keydown', event => {
    if (!event.target.matches('.wz-map-viewport')) return;
    const viewport = event.target;
    const scale = mapScale(viewport.clientWidth, viewport.clientHeight, mapView.zoom);
    const step = event.shiftKey ? 120 : 45;
    if (event.key === 'ArrowLeft') mapView.cx -= step / (MAP_SIZE * scale);
    else if (event.key === 'ArrowRight') mapView.cx += step / (MAP_SIZE * scale);
    else if (event.key === 'ArrowUp') mapView.cy -= step / (MAP_SIZE * scale);
    else if (event.key === 'ArrowDown') mapView.cy += step / (MAP_SIZE * scale);
    else if (event.key === '+' || event.key === '=') zoomMap(1.25);
    else if (event.key === '-') zoomMap(1 / 1.25);
    else if (event.key === 'Home' || event.key === '0') mapView = { ...mapStart };
    else return;
    event.preventDefault();
    applyMapView();
  });
  window.addEventListener('resize', applyMapView);

  function render() {
    finishMapDrag();
    mapObserver?.disconnect();
    const scrolls = new Map([...root.querySelectorAll('[data-wz-scroll]')].map(node => [node.dataset.wzScroll, node.scrollTop]));
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = active?.dataset.wzFocus;
    const selection = active?.tagName === 'INPUT' && active.type === 'text' ? [active.selectionStart, active.selectionEnd] : null;
    const reopenMenu = screen === 'home' && root.querySelector('#wz-game-menu')?.open;
    if (reopenMenu) closeMapMenu();
    root.dataset.wzScreen = screen;
    const page = Object.hasOwn(MAP_MENU_TITLES, screen) ? mapMenuScreenHub(MAP_MENU_TITLES[screen])
      : ({ title: titleHub, home: homeHub, character: characterHub, friends: friendsHub, dons: donsHub, storybook: storybookHub, 'battle-setup': battleSetupHub }[screen])();
    root.innerHTML = page + (notice ? `<div class="wz-notice" role="status">${escapeHub(notice)}</div>` : '');
    if (reopenMenu) openMapMenu();
    applyMapView();
    const mapViewport = root.querySelector('.wz-map-viewport');
    if (mapViewport) mapObserver?.observe(mapViewport);
    for (const node of root.querySelectorAll('[data-wz-scroll]')) node.scrollTop = scrolls.get(node.dataset.wzScroll) || 0;
    if (focusKey) {
      const target = [...root.querySelectorAll('[data-wz-focus]')].find(node => node.dataset.wzFocus === focusKey);
      target?.focus({ preventScroll: true });
      if (selection && target?.setSelectionRange) target.setSelectionRange(...selection);
    }
  }
  function show(nextScreen = 'title', options = {}) {
    const next = isHubScreen(nextScreen) ? nextScreen : 'title';
    const previous = screen;
    closeMapMenu();
    const districtId=next==='storybook'?normalizeDistrictId(options.districtId):null;
    const changed = !visible || next !== screen || next==='storybook'&&districtId!==storybookDistrictId;
    if(screen==='storybook'||next==='storybook')resetStorybook();
    if(next==='storybook'){
      storybookDistrictId=districtId;
      if(districtId!==null)expandedDistricts.add(districtId);
    }
    screen = next;
    visible = true;
    root.hidden = false;
    const hash=next==='storybook'&&districtId!==null?`#storybook/district/${districtId}`:`#${next}`;
    if (options.history !== false && location.hash !== hash) history.pushState({ auradonScreen: next, districtId }, '', hash);
    render();
    if(next==='storybook'&&districtId!==null)focusStorybookDistrict(districtId);
    else if(next==='home'&&Object.hasOwn(MAP_MENU_TITLES, previous))root.querySelector('.wz-map-menu-trigger')?.focus({preventScroll:true});
    else if(next==='home'&&previous==='storybook'&&mapReturnDistrictId!==null)root.querySelector(`[data-wz-district="${mapReturnDistrictId}"]`)?.focus({preventScroll:true});
    else if(changed){
      if(next==='storybook')root.querySelector('.wz-storybook-scroll').scrollTop=0;
      root.querySelector('h1')?.focus({preventScroll:true});
    }
  }
  function hide() { closeMapMenu(); finishMapDrag(); mapObserver?.disconnect(); resetStorybook(); visible = false; root.hidden = true; }
  function getSavedDecks() { return cloneHub(books[ACTIVE_SPELLBOOK_ID].savedDecks); }
  function getBattleDecks(saved = getSavedDecks()) {
    return Object.fromEntries(ELEMENTS.map(element => [element, getBattleDeck(saved[element], element)]));
  }
  function setDeckNotice(message) {
    if (!message) return;
    activeMigrationNotice = [activeMigrationNotice, message].filter(Boolean).join(' ');
    messageHub(message);
    persistHub();
    if (visible) render();
  }
  function getProfile() { return cloneHub(profile); }
  function getLocalData() { return { profile: getProfile(), decks: cloneHub(books[SPELLBOOK_1].savedDecks), spellbook2Decks: getSavedDecks() }; }
  function savedLocalHub() {
    if (!activeAccountId) guestSnapshot = snapshotHub();
    try { Promise.resolve(onSaveLocal(getLocalData())).catch(() => {}); } catch {}
  }
  function restoreBookState(candidate, bookId) {
    const result = emptyBook(bookId);
    result.drafts = {};
    for (const id of ELEMENTS) {
      const deck = candidate?.savedDecks?.[id];
      if (deck?.element === id && getDeckSpellbook(deck) === bookId && validateDeckSlot(deck)) result.savedDecks[id] = normalizeDeckSlot(deck);
      result.drafts[id] = restoreDraft(candidate?.drafts?.[id], id, result.savedDecks[id], bookId);
    }
    result.cloudDecks = candidate?.cloudDecks ? cloneHub(candidate.cloudDecks) : null;
    return result;
  }
  function applyAccountData(account) {
    const validDecks = (decks, bookId) => ELEMENTS.every(id => (id === 'earth' && decks?.[id] === undefined) || (decks?.[id]?.element === id && getDeckSpellbook(decks[id]) === bookId && validateDeckSlot(decks[id])));
    if (!account || typeof account.id !== 'string' || !account.id || !ELEMENTS.includes(account.profile?.element)
      || !validDecks(account.decks, SPELLBOOK_1) || (account.spellbook2Decks !== undefined && !validDecks(account.spellbook2Decks, SPELLBOOK_2))) {
      throw new Error('The account profile or saved decks are invalid.');
    }
    const switching = activeAccountId !== account.id;
    let prior = snapshotHub();
    if (switching) {
      if (activeAccountId) persistence.cacheAccount(activeAccountId, prior);
      else { guestSnapshot = prior; persistence.cacheGuest(prior); }
      prior = persistence.readAccount(account.id);
    }
    activeMigrationNotice = '';
    activeAccountId = account.id;
    accountUsername = String(account.username || '').slice(0, 24);
    profile = { name: String(account.profile.name || 'Auradon').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || 'Auradon', element: account.profile.element };
    for (const bookId of [SPELLBOOK_1, SPELLBOOK_2]) {
      const previous = bookId === SPELLBOOK_1 ? prior : prior?.spellbook2;
      const received = bookId === SPELLBOOK_1 ? account.decks : account.spellbook2Decks;
      const next = restoreBookState(previous, bookId);
      if (received) {
        next.savedDecks = Object.fromEntries(ELEMENTS.map(id => [id, normalizeDeckSlot(received[id] || createStarterDeck(id, bookId))]));
        next.cloudDecks = cloneHub(next.savedDecks);
        for (const id of ELEMENTS) {
          const previousDraft = restoreDraft(previous?.drafts?.[id], id, next.savedDecks[id], bookId);
          const previousSaved = previous?.savedDecks?.[id];
          const previousCloud = previous?.cloudDecks?.[id] || previousSaved;
          const wasDirty = validateDeckSlot(previousSaved) && (deckSignature(previousDraft) !== deckSignature(previousSaved) || deckSignature(previousDraft) !== deckSignature(previousCloud));
          next.drafts[id] = wasDirty ? previousDraft : cloneHub(next.savedDecks[id]);
        }
      }
      books[bookId] = next;
    }
    activeMigrationNotice = account.activeMigrationNotice || account.migrationMessage || '';
    accountStatus = { state: 'synced', message: 'Profile and saved decks are synced to your account.' };
    persistHub();
    if (visible) render();
  }
  function clearAccountData() {
    if (!activeAccountId) return;
    persistence.cacheAccount(activeAccountId, snapshotHub());
    const guest = persistence.readGuest() || guestSnapshot;
    profile = guest?.profile && ELEMENTS.includes(guest.profile.element) ? cloneHub(guest.profile) : { name: 'Auradon', element: 'fire' };
    books[SPELLBOOK_1] = restoreBookState(guest, SPELLBOOK_1);
    books[SPELLBOOK_2] = restoreBookState(guest?.spellbook2, SPELLBOOK_2);
    books[SPELLBOOK_1].cloudDecks = books[SPELLBOOK_2].cloudDecks = null;
    activeMigrationNotice = guest?.activeMigrationNotice || '';
    activeAccountId = null; accountUsername = ''; accountStatus = { state: 'guest', message: '' };
    persistHub();
    if (visible) render();
  }
  function setAccountStatus(status = {}) {
    accountStatus = { ...accountStatus, ...status };
    if (typeof status.username === 'string') accountUsername = status.username.slice(0, 24);
    if (visible) render();
  }
  function battleHub() { onBattle({ element: profile.element }); }

  root.addEventListener('click', event => {
    if (event.detail > 0 && Date.now() < suppressMapClickUntil && event.target.closest('.wz-map-viewport')) { event.preventDefault(); return; }
    if (event.target.id === 'wz-game-menu') { closeMapMenu(); return; }
    const button = event.target.closest('[data-wz-action]');
    if (!button || !root.contains(button) || button.disabled) return;
    switch (button.dataset.wzAction) {
      case 'enter': show('home'); break;
      case 'title': case 'home': case 'character': case 'friends': case 'dons': show(button.dataset.wzAction); break;
      case 'open-map-menu': openMapMenu(); break;
      case 'close-map-menu': closeMapMenu(); break;
      case 'map-menu-destination': {
        const route = button.dataset.wzDestination;
        if (Object.hasOwn(MAP_MENU_TITLES, route) && !onMapMenuDestination(route)) show(route);
        break;
      }
      case 'select-aur': selectedAur = Number(button.dataset.wzAur); render(); break;
      case 'district': {
        const id=normalizeDistrictId(button.dataset.wzDistrict);
        if(getDistrict(id)){mapReturnDistrictId=id;show('storybook',{districtId:id});}
        break;
      }
      case 'map-zoom-in': zoomMap(1.25); break;
      case 'map-zoom-out': zoomMap(1 / 1.25); break;
      case 'map-center': mapView = { ...mapStart }; applyMapView(); break;
      case 'map-overview': mapView = { zoom: 1, cx: .5, cy: .5 }; applyMapView(); break;
      case 'storybook': show('storybook'); break;
      case 'battle': battleHub(); break;
      case 'battle-setup-back': show(battleSetupReturn); break;
      case 'battle-element': {
        const seat = Number(button.dataset.wzSeat);
        if ([0, 1].includes(seat) && ELEMENTS.includes(button.dataset.wzElement)) selectedBattleElements[seat] = button.dataset.wzElement;
        render();
        break;
      }
      case 'start-local-battle': startSelectedBattle(); break;
      case 'multiplayer': onMultiplayer({ decks: getSavedDecks(), profile: getProfile() }); break;
      case 'account': onAccount(); break;
      case 'profile-element': if (!ELEMENTS.includes(button.dataset.wzElement)) break; profile.element = button.dataset.wzElement; persistHub(); savedLocalHub(); render(); break;
    }
  });
  root.addEventListener('submit', event => {
    if (!event.target.matches('.wz-profile-form')) return;
    event.preventDefault();
    const name = new FormData(event.target).get('wizardName');
    profile.name = String(name || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24) || 'Auradon';
    const stored = persistHub();
    savedLocalHub();
    messageHub(stored ? 'Your wizard name is saved.' : 'Name updated for this session. Device saving is unavailable.');
    render();
  });
  return { show, hide, render, showBattleChooser, setDeckNotice, getSavedDecks, getSelectedSpellbookId: () => ACTIVE_SPELLBOOK_ID, getProfile, getLocalData, applyAccountData, clearAccountData, setAccountStatus, isVisible: () => visible };
}
