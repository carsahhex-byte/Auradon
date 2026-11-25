import { ASSETS } from './assets.528a56f26ae4.js';
import { applyAuradonMove, createAuradonBattle, getAuradonMoveOptions, switchAuradon } from './auradon-battle.c5de8a8ae696.js';

const escapeBattleText = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const battleMoveIcons = {
  cinder: 'battleIconCinder',
  'fire-breath': 'battleIconBreath',
  pyroblast: 'battleIconPyroblast',
  sunsetter: 'battleIconSunsetter',
};

function battleIcon(key, className = '') {
  return `<img${className ? ` class="${className}"` : ''} src="${escapeBattleText(ASSETS[key])}" alt="" draggable="false">`;
}

function battlePortrait(member, stage = false) {
  const sprite = stage ? member.battleSprite || member.sprite : member.sprite;
  return `<img class="auradon-battle-sprite${member.hp ? '' : ' is-fainted'}" src="${escapeBattleText(sprite)}" alt="" draggable="false">`;
}

function battleMeter(label, current, maximum) {
  const health = label === 'HP';
  return `<div class="auradon-battle-meter ${health ? 'is-hp' : 'is-mana'}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="${maximum}" aria-valuenow="${current}">
    ${battleIcon(health ? 'battleIconHp' : 'battleIconMana')}
    <span class="auradon-battle-meter-label">${label}</span>
    <span class="auradon-battle-meter-track"><span style="--fill:${current / maximum * 100}%"></span></span>
    <span class="auradon-battle-meter-value">${current}/${maximum}</span>
  </div>`;
}

function battleStats(member, side, active) {
  const name = escapeBattleText(member.name);
  return `<section class="auradon-battle-stats${active ? ' is-active' : ''}" aria-label="Player ${side + 1} ${name} stats">
    <h2>${name}</h2>
    ${battleMeter('HP', member.hp, member.maxHp)}
    ${battleMeter('Mana', member.mana, member.maxMana)}
    <div class="auradon-battle-effects" aria-label="Status effects">${member.effects.map(effect => `<span>${escapeBattleText(effect.name)}</span>`).join('')}</div>
  </section>`;
}

function battleMove(move) {
  if (!move) return '<div class="auradon-battle-move auradon-battle-empty" aria-label="Empty move slot"><span>Empty</span></div>';
  const name = escapeBattleText(move.name);
  const type = escapeBattleText(move.type);
  const icon = battleMoveIcons[move.id];
  const descriptor = move.exhausted ? 'Exhausted · half damage' : move.utility ? 'Utility' : `Power ${move.rank}`;
  return `<button type="button" class="auradon-battle-move" data-don-move="${escapeBattleText(move.id)}" data-type="${type.toLowerCase()}"${move.available ? '' : ' disabled'} aria-label="${name}, ${type}, ${descriptor}, ${move.cost} mana"${move.description ? ` title="${escapeBattleText(move.description)}"` : ''}>
    <span class="auradon-battle-move-icon" aria-hidden="true">${icon ? battleIcon(icon) : type.slice(0, 2)}</span>
    <span class="auradon-battle-move-copy"><strong>${name}</strong><small>${move.cost} mana${move.exhausted ? ' · ½ damage' : ''}</small></span>
  </button>`;
}

function battleTurnTitle(match) {
  const side = match.phase === 'finished' ? match.winner : match.turn;
  const name = escapeBattleText(match.sides[side].name);
  const player = `Player ${side + 1}`;
  if (match.phase === 'finished') return `${player} wins · ${name}`;
  if (match.phase === 'replacement') return `${player} · Choose a replacement`;
  return `${player}’s turn · ${name}`;
}

function battleNav() {
  return `<nav class="battle-navigation auradon-battle-nav" aria-label="Battle navigation">
    <button type="button" data-don-battle="back">← Back</button><strong>Battle</strong><span></span>
  </nav>`;
}

function battleSetup(saved, selection, error) {
  if (!saved.length) return `<section class="auradon-battle-setup" aria-labelledby="auradon-battle-heading">
    <h1 id="auradon-battle-heading" tabindex="-1">Pass and play</h1>
    <p>Save a team in the Auradon Library to start a battle.</p>
    <button type="button" class="auradon-battle-button" data-don-battle="library">Open Auradon Library</button>
  </section>`;

  const select = side => `<label for="auradon-battle-player-${side}">Player ${side + 1}
    <select id="auradon-battle-player-${side}" data-don-team-side="${side}">
      ${saved.map(team => `<option value="${escapeBattleText(team.id)}"${team.id === selection[side] ? ' selected' : ''}>${escapeBattleText(team.name)} (${team.members.length})</option>`).join('')}
    </select>
  </label>`;
  return `<section class="auradon-battle-setup" aria-labelledby="auradon-battle-heading">
    <h1 id="auradon-battle-heading" tabindex="-1">Pass and play</h1>
    <div class="auradon-battle-team-selects">${select(0)}${select(1)}</div>
    <div class="auradon-battle-actions">
      <button type="button" class="auradon-battle-button" data-don-battle="start">Start battle</button>
      <button type="button" class="auradon-battle-button secondary" data-don-battle="library">Auradon Library</button>
    </div>
    ${error ? `<p class="auradon-battle-error" role="alert">${escapeBattleText(error)}</p>` : ''}
  </section>`;
}

function battleField(match, movesOpen, error) {
  const finished = match.phase === 'finished';
  const replacement = match.phase === 'replacement';
  const members = match.sides.map(entry => entry.members[entry.activeIndex]);
  const art = Object.entries({
    stat: 'battleStatBox', 'hp-track': 'battleHpTrack', 'hp-fill': 'battleHpFill',
    'mana-track': 'battleManaTrack', 'mana-fill': 'battleManaFill',
    panel: 'battleMovePanel', move: 'battleMoveButton', fight: 'battleFightButton',
    action: 'battleActionButton', escape: 'battleEscapeButton',
  }).map(([name, key]) => `--battle-${name}:url('${escapeBattleText(ASSETS[key])}')`).join(';');
  const moves = getAuradonMoveOptions(match);
  return `<div class="auradon-battle-size"><div class="auradon-battle-board" style="${art}">
    ${battleIcon('battleSeattle', 'auradon-battle-backdrop')}
    <p class="auradon-battle-wordmark" aria-hidden="true">Battle</p>
    <div class="auradon-battle-hud">${members.map((member, index) => battleStats(member, index, !finished && match.turn === index)).join('')}</div>
    <header class="auradon-battle-turn">
      <h1 id="auradon-battle-heading" tabindex="-1">${battleTurnTitle(match)}</h1>
      <p role="status">${escapeBattleText(match.message)}</p>
      ${error ? `<p class="auradon-battle-error" role="alert">${escapeBattleText(error)}</p>` : ''}
    </header>
    <section class="auradon-battle-arena" aria-label="Auradons in the arena">
      ${members.map((member, index) => `<div class="auradon-battle-combatant" data-side="${index}" role="img" aria-label="Player ${index + 1}, ${escapeBattleText(member.name)}">${battlePortrait(member, true)}</div>`).join('')}
    </section>
    <div class="auradon-battle-controls">
      <div class="auradon-battle-control-stage">
        ${finished ? `<button type="button" class="auradon-battle-fight" data-don-battle="new">Choose teams</button>` : ''}
        ${match.phase === 'turn' ? `<button type="button" class="auradon-battle-fight" data-don-battle="fight" aria-expanded="${movesOpen}" aria-controls="auradon-battle-moves"${movesOpen ? ' hidden' : ''}>${battleIcon('battleSwords')}Fight</button>` : ''}
        <section class="auradon-battle-hand" id="auradon-battle-moves" aria-labelledby="auradon-battle-moves-heading"${movesOpen ? '' : ' hidden'}>
          <header>
            <h2 id="auradon-battle-moves-heading">Moves</h2>
            <button type="button" data-don-battle="close-moves">Back</button>
          </header>
          <div class="auradon-battle-moves">${Array.from({ length: 4 }, (_, index) => battleMove(moves[index])).join('')}</div>
        </section>
      </div>
      <nav class="auradon-battle-options" aria-label="Battle options">
        <button type="button" disabled>${battleIcon('battleIconInventory')}Inventory</button>
        <button type="button" data-don-battle="escape" aria-haspopup="dialog">${battleIcon('battleIconEscape')}Escape</button>
        <button type="button" data-don-battle="team" aria-haspopup="dialog"${replacement ? ' aria-label="Auradons · Choose replacement" class="needs-replacement"' : ''}${finished ? ' disabled' : ''}>${battleIcon('battleIconAuradons')}Auradons</button>
      </nav>
    </div>
  </div></div>`;
}

function battleSwitchContents(match, pendingIndex, error) {
  const side = match.sides[match.turn];
  const pending = side.members[pendingIndex];
  const replacement = match.phase === 'replacement';
  return `<h2 id="auradon-battle-switch-title">${replacement ? 'Choose a replacement' : 'Switch Auradon'}</h2>
    <ul class="auradon-battle-switch-list">
      ${side.members.map((member, index) => {
        const current = index === side.activeIndex;
        const memberState = !member.hp ? 'Fainted' : current ? 'Active' : '';
        return `<li><button type="button" data-don-bench="${index}" aria-pressed="${index === pendingIndex}"${current || !member.hp ? ' disabled' : ''}>
          ${battlePortrait(member)}
          <strong>${escapeBattleText(member.name)}</strong><span>${member.hp}/${member.maxHp} HP</span>${memberState ? `<small>${memberState}</small>` : ''}
        </button></li>`;
      }).join('')}
    </ul>
    ${side.members.every((member, index) => index === side.activeIndex || member.hp === 0) ? '<p>No other Auradon can switch in.</p>' : ''}
    ${error ? `<p class="auradon-battle-error" role="alert">${escapeBattleText(error)}</p>` : ''}
    <div class="auradon-battle-actions">
      <button type="button" class="auradon-battle-button secondary" data-don-battle="cancel-switch">Back</button>
      ${pending ? `<button type="button" class="auradon-battle-button" data-don-battle="confirm-switch">Switch to ${escapeBattleText(pending.name)}</button>` : ''}
    </div>`;
}

function battleEscapeContents() {
  return `<h2 id="auradon-battle-switch-title">Leave battle?</h2>
    <p>End this match and return to team selection.</p>
    <div class="auradon-battle-actions">
      <button type="button" class="auradon-battle-button secondary" data-don-battle="cancel-escape" autofocus>Stay in battle</button>
      <button type="button" class="auradon-battle-button" data-don-battle="confirm-escape">Leave battle</button>
    </div>`;
}

export function createAuradonBattleUi({ root, teams, onBack, onLibrary }) {
  const heading = '#auradon-battle-heading';
  const fight = '[data-don-battle="fight"]';
  let match = null;
  let selection = [];
  let pendingIndex = null;
  let movesOpen = false;
  let error = '';

  function fitBoard() {
    const size = root.querySelector('.auradon-battle-size');
    if (!size || root.hidden) return;
    const height = window.visualViewport?.height ?? window.innerHeight;
    const width = Math.min(root.clientWidth, Math.max(320, height / 2), 432);
    const scale = width / 432;
    if (!scale) return;
    const logicalHeight = Math.max(864, height / scale);
    size.style.setProperty('--battle-scale', scale);
    size.style.setProperty('--battle-width', `${width}px`);
    size.style.setProperty('--battle-height', `${logicalHeight * scale}px`);
    size.style.setProperty('--battle-logical-height', `${logicalHeight}px`);
  }

  function render(focusSelector) {
    const saved = teams.getTeams();
    selection = [0, 1].map(side => saved.some(team => team.id === selection[side])
      ? selection[side]
      : (saved[side] ?? saved[0])?.id);
    root.innerHTML = `<div class="auradon-battle${match ? ' is-live' : ''}">
      ${match ? battleField(match, movesOpen, error) : battleNav() + battleSetup(saved, selection, error)}
      <dialog class="game-dialog auradon-battle-switch" aria-labelledby="auradon-battle-switch-title"></dialog>
    </div>`;
    fitBoard();
    if (focusSelector) (root.querySelector(focusSelector) || root.querySelector(heading))?.focus({ preventScroll: true });
  }

  function closeBattleDialog() {
    root.querySelector('dialog')?.close();
    pendingIndex = null;
  }

  function openBattleDialog(content) {
    const dialog = root.querySelector('dialog');
    dialog.innerHTML = content;
    if (!dialog.open) dialog.showModal();
    return dialog;
  }

  function openSwitch({ focusIndex = null, switchError = '' } = {}) {
    const dialog = openBattleDialog(battleSwitchContents(match, pendingIndex, switchError));
    if (focusIndex !== null) dialog.querySelector(`[data-don-bench="${focusIndex}"]`)?.focus();
  }

  function start() {
    const saved = teams.getTeams();
    try {
      match = createAuradonBattle(...selection.map(id => saved.find(team => team.id === id)));
      error = '';
    } catch (failure) {
      error = failure.message;
    }
    render(match ? heading : '[data-don-battle="start"]');
  }

  window.addEventListener('resize', fitBoard);
  window.visualViewport?.addEventListener('resize', fitBoard);

  root.addEventListener('change', event => {
    const control = event.target.closest('[data-don-team-side]');
    if (!control) return;
    selection[Number(control.dataset.donTeamSide)] = control.value;
    root.querySelector('.auradon-battle-error')?.remove();
    error = '';
  });

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.donMove) {
      const result = applyAuradonMove(match, button.dataset.donMove);
      match = result.state;
      error = result.error ?? '';
      if (!error) movesOpen = false;
      render(heading);
    } else if (button.dataset.donBench !== undefined) {
      pendingIndex = Number(button.dataset.donBench);
      openSwitch({ focusIndex: pendingIndex });
    } else {
      switch (button.dataset.donBattle) {
        case 'back': onBack(); break;
        case 'library': onLibrary(); break;
        case 'start': start(); break;
        case 'fight':
          movesOpen = true;
          render('[data-don-move]:not(:disabled)');
          break;
        case 'close-moves':
          movesOpen = false;
          render(fight);
          break;
        case 'escape': openBattleDialog(battleEscapeContents()); break;
        case 'cancel-escape':
        case 'cancel-switch': closeBattleDialog(); break;
        case 'confirm-escape':
        case 'new':
          closeBattleDialog();
          match = null;
          movesOpen = false;
          error = '';
          render(heading);
          break;
        case 'team':
          pendingIndex = null;
          openSwitch();
          break;
        case 'confirm-switch': {
          const result = switchAuradon(match, pendingIndex);
          if (result.error) {
            openSwitch({ focusIndex: pendingIndex, switchError: result.error });
          } else {
            closeBattleDialog();
            match = result.state;
            movesOpen = false;
            error = '';
            render(heading);
          }
          break;
        }
      }
    }
  });

  return {
    show() {
      root.hidden = false;
      render(heading);
    },
    hide() {
      closeBattleDialog();
      root.hidden = true;
    },
  };
}
