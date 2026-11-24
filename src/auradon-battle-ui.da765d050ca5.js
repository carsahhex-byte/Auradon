import { ASSETS, ASSET_CROPS } from './assets.1602afe6ba3f.js';
import { applyAuradonMove, createAuradonBattle, getAuradonMoveOptions, switchAuradon } from './auradon-battle.cd6dec661608.js';

const escapeBattleText = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function battleArt(key, className, crop = ASSET_CROPS[key]) {
  const { width, height, x, y, w, h } = crop;
  return `<span class="art ${className}" style="--art-ratio:${w}/${h}" aria-hidden="true"><img src="${ASSETS[key]}" alt="" draggable="false" style="width:${width / w * 100}%;height:${height / h * 100}%;left:${-x / w * 100}%;top:${-y / h * 100}%"></span>`;
}

function moveFrame() {
  const crop = (x, y, w, h) => ({ width: 1217, height: 1293, x, y, w, h });
  return `<div class="hand-frame-shell" aria-hidden="true">
    ${battleArt('handFrame', 'frame-center', crop(140, 320, 900, 650))}
    ${battleArt('handFrame', 'frame-top', crop(135, 178, 190, 40))}
    ${battleArt('handFrame', 'frame-bottom', crop(135, 1058, 930, 43))}
    ${battleArt('handFrame', 'frame-left', crop(14, 300, 40, 650))}
    ${battleArt('handFrame', 'frame-right', crop(1163, 300, 41, 650))}
    ${battleArt('handFrame', 'frame-tl', crop(13, 176, 105, 105))}
    ${battleArt('handFrame', 'frame-tr', crop(1099, 176, 105, 105))}
    ${battleArt('handFrame', 'frame-bl', crop(13, 996, 105, 105))}
    ${battleArt('handFrame', 'frame-br', crop(1099, 996, 105, 105))}
  </div>`;
}

function battlePortrait(member, className = '') {
  return `<img class="auradon-battle-sprite ${className}" src="${escapeBattleText(member.sprite)}" alt="" draggable="false">`;
}

function battleMeter(label, current, maximum) {
  return `<div class="auradon-battle-meter is-${label.toLowerCase()}" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="${maximum}" aria-valuenow="${current}">
    <div><span>${label}</span><strong>${current}/${maximum}</strong></div>
    <span class="auradon-battle-meter-track"><span style="--fill:${current / maximum * 100}%"></span></span>
  </div>`;
}

function battleStats(member, side, active) {
  const name = escapeBattleText(member.name);
  return `<section class="auradon-battle-stats${active ? ' is-active' : ''}" aria-label="Player ${side + 1} ${name} stats">
    ${battleArt(side === 0 ? 'fireFrame' : 'waterFrame', 'auradon-battle-stat-art')}
    <div class="auradon-battle-stat-content">
      <h2>${name}</h2>
      ${battleMeter('HP', member.hp, member.maxHp)}
      ${battleMeter('Mana', member.mana, member.maxMana)}
      <div class="auradon-battle-effects" aria-label="Status effects">${member.effects.map(effect => `<span>${escapeBattleText(effect.name)}</span>`).join('')}</div>
    </div>
  </section>`;
}

function battleMove(move) {
  if (!move) return '<div class="auradon-battle-move auradon-battle-empty" aria-label="Empty move slot"><span>Empty</span></div>';
  const name = escapeBattleText(move.name);
  const type = escapeBattleText(move.type);
  const descriptor = move.exhausted ? 'Exhausted · half damage' : move.utility ? 'Utility' : `Power ${move.rank}`;
  return `<button type="button" class="auradon-battle-move" data-don-move="${escapeBattleText(move.id)}" data-type="${type.toLowerCase()}"${move.available ? '' : ' disabled'} aria-label="${name}, ${type}, ${descriptor}, ${move.cost} mana"${move.description ? ` title="${escapeBattleText(move.description)}"` : ''}>
    <span class="auradon-battle-move-type">${type}</span><strong>${name}</strong>
    <span class="auradon-battle-move-meta">${descriptor} <span>${move.cost} mana</span></span>
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

function battleNav(match) {
  return `<nav class="battle-navigation auradon-battle-nav" aria-label="Battle navigation">
    <button type="button" data-don-battle="back">← Back</button><strong>Battle</strong>
    ${match ? '<button type="button" data-don-battle="new">New battle</button>' : '<span></span>'}
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

function battleField(match, error) {
  const side = match.sides[match.turn];
  const moves = getAuradonMoveOptions(match);
  const finished = match.phase === 'finished';
  const replacement = match.phase === 'replacement';
  const members = match.sides.map(entry => entry.members[entry.activeIndex]);
  return `<div class="auradon-battle-board">
    <section class="auradon-battle-arena" aria-label="Arena" style="--arena-forest:url('${ASSETS.forest}')">
      <div class="auradon-battle-wordmark" aria-hidden="true">Auradon</div>
      <div class="auradon-battle-standoff" aria-hidden="true">
        ${battlePortrait(members[0], `faces-right${members[0].hp ? '' : ' is-fainted'}`)}
        <span>VS</span>
        ${battlePortrait(members[1], members[1].hp ? '' : 'is-fainted')}
      </div>
    </section>
    <div class="auradon-battle-hud">${members.map((member, index) => battleStats(member, index, !finished && match.turn === index)).join('')}</div>
    <header class="auradon-battle-turn">
      <h1 id="auradon-battle-heading" tabindex="-1">${battleTurnTitle(match)}</h1>
      <p role="status">${escapeBattleText(match.message)}</p>
      ${error ? `<p class="auradon-battle-error" role="alert">${escapeBattleText(error)}</p>` : ''}
    </header>
    <section class="auradon-battle-hand" aria-labelledby="auradon-battle-moves-heading">
      ${moveFrame()}
      <div class="auradon-battle-hand-content">
        <h2 id="auradon-battle-moves-heading">Moves</h2>
        <div class="auradon-battle-hand-grid">
          <div class="auradon-battle-moves">${Array.from({ length: 4 }, (_, index) => battleMove(moves[index])).join('')}</div>
          <div class="auradon-battle-utility-art" aria-label="Inactive battle features">
            <button type="button" aria-label="Enhance" disabled>${battleArt('enhanceButtons', '', ASSET_CROPS.enhanceFire)}</button>
            <button type="button" aria-label="Aura" disabled>${battleArt('auraButton', '')}</button>
          </div>
        </div>
      </div>
    </section>
    <div class="auradon-battle-footer">
      ${finished ? '<button type="button" class="auradon-battle-button" data-don-battle="new">Choose teams</button>' : `<button type="button" class="auradon-battle-button auradon-battle-team-button" data-don-battle="team" aria-haspopup="dialog">
        <strong>${replacement ? 'Choose replacement' : 'Your team'}</strong>
        <span class="auradon-battle-team-sprites" aria-hidden="true">${side.members.map(member => battlePortrait(member, member.hp ? '' : 'is-fainted')).join('')}</span>
      </button>`}
    </div>
  </div>`;
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
          ${battlePortrait(member, member.hp ? '' : 'is-fainted')}
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

export function createAuradonBattleUi({ root, teams, onBack, onLibrary }) {
  let match = null;
  let selection = [];
  let pendingIndex = null;
  let error = '';

  function render({ focus = false } = {}) {
    const saved = teams.getTeams();
    selection = [0, 1].map(side => saved.some(team => team.id === selection[side])
      ? selection[side]
      : (saved[side] ?? saved[0])?.id);
    root.innerHTML = `<div class="auradon-battle">${battleNav(match)}
      ${match ? battleField(match, error) : battleSetup(saved, selection, error)}
      <dialog class="game-dialog auradon-battle-switch" aria-labelledby="auradon-battle-switch-title"></dialog>
    </div>`;
    if (focus) root.querySelector('#auradon-battle-heading')?.focus();
  }

  function closeSwitch() {
    root.querySelector('dialog')?.close();
    pendingIndex = null;
  }

  function openSwitch({ focusIndex = null, switchError = '' } = {}) {
    const dialog = root.querySelector('dialog');
    dialog.innerHTML = battleSwitchContents(match, pendingIndex, switchError);
    if (!dialog.open) dialog.showModal();
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
    render({ focus: Boolean(match) });
    if (!match) root.querySelector('[data-don-battle="start"]')?.focus();
  }

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
      render({ focus: true });
    } else if (button.dataset.donBench !== undefined) {
      pendingIndex = Number(button.dataset.donBench);
      openSwitch({ focusIndex: pendingIndex });
    } else {
      switch (button.dataset.donBattle) {
        case 'back': onBack(); break;
        case 'library': onLibrary(); break;
        case 'start': start(); break;
        case 'new':
          match = null;
          error = '';
          render({ focus: true });
          break;
        case 'team':
          pendingIndex = null;
          openSwitch();
          break;
        case 'cancel-switch': closeSwitch(); break;
        case 'confirm-switch': {
          const result = switchAuradon(match, pendingIndex);
          if (result.error) {
            openSwitch({ focusIndex: pendingIndex, switchError: result.error });
          } else {
            closeSwitch();
            match = result.state;
            error = '';
            render({ focus: true });
          }
          break;
        }
      }
    }
  });

  return {
    show() {
      root.hidden = false;
      render({ focus: true });
    },
    hide() {
      closeSwitch();
      root.hidden = true;
    },
  };
}
