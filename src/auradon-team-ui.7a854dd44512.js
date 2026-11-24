import { AURADONS, AURADON_MOVES, AURADON_TYPES, defaultMoveIds, getAuradon, getDamageMultiplier } from './auradon-catalog.22215fdc449c.js';
import { MAX_AURADON_MOVES, MAX_AURADON_TEAM_NAME, MAX_AURADON_TEAM_SIZE } from './auradon-teams.da6a6c4b3554.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function sprite(don) {
  return `<img class="aur-team-sprite" src="${escapeHtml(don.sprite)}" alt="" draggable="false">`;
}

function typeLabel(types) {
  return `<span class="aur-team-types">${types.map(type => `<span data-don-type="${type.toLowerCase()}">${type}</span>`).join('')}</span>`;
}

function teamOptions(teams, selectedId) {
  return teams.map(team => `<option value="${escapeHtml(team.id)}"${team.id === selectedId ? ' selected' : ''}>${escapeHtml(team.name)}</option>`).join('');
}

function displayMatchups(types, getMultiplier, emptyMessage) {
  return types.length ? `<ul class="aur-team-matchups">${types.map(type => `<li><span>${type}</span><strong>${getMultiplier(type)}×</strong></li>`).join('')}</ul>` : `<p>${emptyMessage}</p>`;
}

function typeChart(don) {
  const incoming = type => getDamageMultiplier(type, don.types);
  const attack = don.types.map(type => {
    const multiplier = defense => getDamageMultiplier(type, [defense]);
    const strong = AURADON_TYPES.filter(defense => multiplier(defense) > 1);
    return `<section><h4>${type} attacks</h4>${displayMatchups(strong, multiplier, 'No bonus matchups.')}</section>`;
  }).join('');
  return `<div class="aur-team-chart">
    <section><h3>Strong against</h3>${attack}</section>
    <section><h3>Weak against</h3>${displayMatchups(AURADON_TYPES.filter(type => incoming(type) > 1), incoming, 'No weaknesses.')}</section>
    <section><h3>Resistant to</h3>${displayMatchups(AURADON_TYPES.filter(type => incoming(type) < 1), incoming, 'No resistances.')}</section>
  </div>`;
}

function availableMoves() {
  return AURADON_TYPES.map(type => {
    const typeMoves = AURADON_MOVES.filter(move => move.type === type);
    const content = typeMoves.length ? typeMoves.map(move => `<label class="aur-team-move">
      <input type="checkbox" data-don-move="${escapeHtml(move.id)}">
      <span class="aur-team-row-copy"><strong>${escapeHtml(move.name)}</strong>
        <small>${move.utility ? 'Utility' : `Rank ${move.rank}`} · ${move.mana} mana</small>
        ${move.description ? `<small>${escapeHtml(move.description)}</small>` : ''}
      </span>
    </label>`).join('') : '<p class="aur-team-no-moves">No moves listed.</p>';
    return `<details class="aur-team-move-group" data-don-move-group="${type}"><summary>${type}<span data-don-move-group-count aria-hidden="true"></span></summary>${content}</details>`;
  }).join('');
}

export function createAuradonTeamUi({ root, teams, onBack, onLibrary }) {
  root.classList.add('aur-team-root');
  root.innerHTML = '<main class="aur-team-page"></main><dialog class="aur-team-dialog" aria-labelledby="aur-team-dialog-title"></dialog>';
  const page = root.querySelector('.aur-team-page');
  const dialog = root.querySelector('.aur-team-dialog');
  const drafts = new Map();

  let screen = null;
  let draft;
  let selectedId = null;
  let currentDialog = null;
  let returnFocus = null;

  function focusPageControl(key) {
    if (key) [...page.querySelectorAll('[data-don-focus]')].find(button => button.dataset.donFocus === key)?.focus({ preventScroll: true });
  }

  function getDraft(team) {
    return drafts.get(team?.id ?? null) ?? { id: team?.id ?? null, name: team?.name ?? '', members: team?.members ?? [], unassignedMoves: new Map() };
  }

  function markDraft() {
    drafts.set(draft.id, draft);
  }

  function renderSlots() {
    const slots = Array.from({ length: MAX_AURADON_TEAM_SIZE }, (_, index) => {
      const member = draft.members[index];
      const don = member ? getAuradon(member.id) : null;
      if (!don) return `<li class="aur-team-slot aur-team-slot-empty" aria-label="Slot ${index + 1}, empty"></li>`;
      return `<li><button type="button" class="aur-team-slot" data-don-action="inspect" data-don-id="${don.id}" data-don-focus="slot-${don.id}" aria-label="Slot ${index + 1}, ${escapeHtml(don.name)}" aria-haspopup="dialog">${sprite(don)}</button></li>`;
    }).join('');
    return `<ul class="aur-team-slots" aria-label="Team slots">${slots}</ul>`;
  }

  function renderLibrary() {
    const selected = selectedId ? getAuradon(selectedId) : null;
    const savedTeams = teams.getTeams();
    const rows = AURADONS.map(don => {
      const onTeam = draft.members.some(member => member.id === don.id);
      return `<li><button type="button" class="aur-team-row${selectedId === don.id ? ' aur-team-row-current' : ''}" data-don-action="inspect" data-don-id="${don.id}" data-don-focus="roster-${don.id}" aria-haspopup="dialog">
        ${sprite(don)}<span class="aur-team-row-copy"><strong>${escapeHtml(don.name)}</strong>${typeLabel(don.types)}</span>${onTeam ? '<span class="aur-team-on-team">On team</span>' : ''}
      </button></li>`;
    }).join('');
    return `<section class="aur-team-panel aur-team-builder" aria-label="Build a team">
      <label class="aur-team-field"><span>Saved teams</span><select data-don-field="draft" data-don-focus="saved-teams" aria-label="Saved teams">${teamOptions(savedTeams, draft.id)}<option value=""${draft.id === null ? ' selected' : ''}>New team</option></select></label>
      ${renderSlots()}
      <form class="aur-team-save-form" data-don-form="save">
        <input data-don-field="name" aria-label="Team name" type="text" maxlength="${MAX_AURADON_TEAM_NAME}" placeholder="Team ${savedTeams.length + 1}" value="${escapeHtml(draft.name)}" autocomplete="off">
        <button type="submit" class="aur-team-button aur-team-primary"${draft.members.length ? '' : ' disabled'} data-don-focus="save">Save team</button>
      </form>
      <p class="aur-team-status" data-don-status role="status"></p>
    </section>
    <section class="aur-team-panel aur-team-preview" aria-label="Selected Auradon">
      ${selected ? `${sprite(selected)}<span class="aur-team-row-copy"><strong>${escapeHtml(selected.name)}</strong>${typeLabel(selected.types)}</span><button type="button" class="aur-team-button" data-don-action="chart" data-don-focus="chart" aria-haspopup="dialog">Type chart</button>` : '<p>Select an Auradon from the roster.</p>'}
    </section>
    <section class="aur-team-panel aur-team-roster" aria-labelledby="aur-team-roster-title">
      <h2 id="aur-team-roster-title">Roster</h2>
      <ul class="aur-team-list" data-don-scroll>${rows}</ul>
    </section>`;
  }

  function renderTeam() {
    const active = teams.getActiveTeam();
    if (!active) return `<section class="aur-team-panel aur-team-empty">
      <p>Build and save a team in the Auradon Library.</p>
      <button type="button" class="aur-team-button aur-team-primary" data-don-action="library">Open library</button>
    </section>`;
    const rows = active.members.map(member => {
      const don = getAuradon(member.id);
      return `<li><button type="button" class="aur-team-row" data-don-action="inspect" data-don-id="${don.id}" data-don-focus="team-${don.id}" aria-haspopup="dialog">
        ${sprite(don)}<span class="aur-team-row-copy"><strong>${escapeHtml(don.name)}</strong>${typeLabel(don.types)}</span><span class="aur-team-on-team">${member.moveIds.length}/${MAX_AURADON_MOVES} moves</span>
      </button></li>`;
    }).join('');
    return `<section class="aur-team-panel aur-team-active">
      <label class="aur-team-field"><span>Active team</span><select data-don-field="active" data-don-focus="active-team" aria-label="Active team">${teamOptions(teams.getTeams(), active.id)}</select></label>
      <ul class="aur-team-list" data-don-scroll aria-label="Team members">${rows}</ul>
      <button type="button" class="aur-team-button" data-don-action="library">Open library</button>
    </section>`;
  }

  function renderPage(focusKey) {
    const scrollTop = page.querySelector('[data-don-scroll]')?.scrollTop ?? 0;
    const title = screen === 'library' ? 'Auradon Library' : 'Auradons';
    page.innerHTML = `<header class="aur-team-header">
      <button type="button" class="aur-team-button aur-team-back" data-don-action="back" aria-label="Back">‹</button>
      <h1 tabindex="-1">${title}</h1>
    </header>
    <div class="aur-team-body">${screen === 'library' ? renderLibrary() : renderTeam()}</div>`;
    const list = page.querySelector('[data-don-scroll]');
    if (list) list.scrollTop = scrollTop;
    focusPageControl(focusKey);
  }

  function moveIdsFor(donId) {
    if (screen === 'team') return teams.getActiveTeam()?.members.find(member => member.id === donId)?.moveIds ?? [];
    return draft.members.find(member => member.id === donId)?.moveIds ?? draft.unassignedMoves.get(donId) ?? defaultMoveIds(donId);
  }

  function syncMoveToggles() {
    const moveIds = moveIdsFor(currentDialog.donId);
    const full = moveIds.length >= MAX_AURADON_MOVES;
    for (const input of dialog.querySelectorAll('[data-don-move]')) {
      input.checked = moveIds.includes(input.dataset.donMove);
      input.disabled = full && !input.checked;
    }
    for (const group of dialog.querySelectorAll('[data-don-move-group]')) {
      const selected = group.querySelectorAll('input:checked').length;
      group.querySelector('[data-don-move-group-count]').textContent = selected ? `${selected} equipped` : '';
    }
    dialog.querySelector('[data-don-move-count]').textContent = `${moveIds.length}/${MAX_AURADON_MOVES} moves equipped`;
    const help = dialog.querySelector('[data-don-move-help]');
    help.textContent = screen === 'library' ? 'Save your team to keep its equipped moves.' : teams.canPersist() ? 'Changes are saved to this team.' : 'Changes are saved for this session.';
    if (full) help.textContent += ' Turn off a move to equip another.';
  }

  function renderTabs(active) {
    return `<div class="aur-team-tabs" role="tablist" aria-label="Auradon details">
      ${['Stats', 'Moves'].map(label => {
        const key = label.toLowerCase();
        return `<button type="button" id="aur-team-tab-${key}" role="tab" aria-controls="aur-team-panel-${key}" aria-selected="${active === key}" tabindex="${active === key ? '0' : '-1'}" data-don-action="tab" data-don-tab="${key}">${label}</button>`;
      }).join('')}
    </div>`;
  }

  function renderInspector(don, tab) {
    const onTeam = screen === 'library' && draft.members.some(member => member.id === don.id);
    const canAdd = screen === 'library' && draft.members.length < MAX_AURADON_TEAM_SIZE;
    return `<header class="aur-team-dialog-header">
      <h2 id="aur-team-dialog-title">${escapeHtml(don.name)}</h2>
      <button type="button" class="aur-team-button aur-team-close" data-don-action="close" aria-label="Close Auradon details">×</button>
    </header>
    <div class="aur-team-hero">${sprite(don)}${typeLabel(don.types)}</div>
    ${renderTabs(tab)}
    <div class="aur-team-dialog-body">
      <section role="tabpanel" id="aur-team-panel-stats" aria-labelledby="aur-team-tab-stats" data-don-panel="stats"${tab === 'stats' ? '' : ' hidden'}>
        <dl class="aur-team-stats"><div><dt>HP</dt><dd>${don.maxHp}</dd></div><div><dt>Mana</dt><dd>${don.maxMana}</dd></div></dl>
        <button type="button" class="aur-team-button" data-don-action="inspect-chart">Type chart</button>
      </section>
      <section role="tabpanel" id="aur-team-panel-moves" aria-labelledby="aur-team-tab-moves" data-don-panel="moves"${tab === 'moves' ? '' : ' hidden'}>
        <p class="aur-team-move-count" data-don-move-count role="status"></p>
        <p class="aur-team-move-help" data-don-move-help></p>
        <div class="aur-team-move-groups">${availableMoves()}</div>
      </section>
    </div>
    ${screen === 'library' ? `<footer class="aur-team-dialog-footer">
      <button type="button" class="aur-team-button${onTeam ? '' : ' aur-team-primary'}" data-don-action="${onTeam ? 'remove' : 'add'}"${onTeam || canAdd ? '' : ' disabled'}>${onTeam ? 'Remove from team' : canAdd ? 'Add to team' : 'Team is full'}</button>
    </footer>` : ''}`;
  }

  function showDialog(donId, kind, fromDetails = false) {
    const don = getAuradon(donId);
    currentDialog = { donId, kind };
    dialog.innerHTML = kind === 'chart' ? `<header class="aur-team-dialog-header"><h2 id="aur-team-dialog-title">${escapeHtml(don.name)} type chart</h2><button type="button" class="aur-team-button aur-team-close" data-don-action="${fromDetails ? 'back-details' : 'close'}" aria-label="${fromDetails ? 'Back to Auradon details' : 'Close type chart'}">${fromDetails ? '‹' : '×'}</button></header><div class="aur-team-dialog-body">${typeChart(don)}</div>` : renderInspector(don, 'stats');
    if (kind === 'inspect') syncMoveToggles();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.aur-team-close').focus();
  }

  function changeTab(active) {
    for (const button of dialog.querySelectorAll('[data-don-tab]')) {
      const selected = button.dataset.donTab === active;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected) button.focus();
    }
    for (const panel of dialog.querySelectorAll('[data-don-panel]')) panel.hidden = panel.dataset.donPanel !== active;
    if (active === 'moves') {
      for (const group of dialog.querySelectorAll('[data-don-move-group]')) {
        if (getAuradon(currentDialog.donId).types.includes(group.dataset.donMoveGroup)) group.open = true;
      }
    }
    dialog.querySelector('.aur-team-dialog-body').scrollTop = 0;
  }

  function updateDraftMember(adding) {
    const donId = currentDialog.donId;
    const moveIds = moveIdsFor(donId);
    if (adding && draft.members.length < MAX_AURADON_TEAM_SIZE && !draft.members.some(member => member.id === donId)) draft.members.push({ id: donId, moveIds });
    if (!adding) {
      draft.unassignedMoves.set(donId, moveIds);
      draft.members = draft.members.filter(member => member.id !== donId);
      returnFocus = `roster-${donId}`;
    }
    markDraft();
    renderPage();
    dialog.close();
  }

  function changeMove(input) {
    if (!currentDialog || currentDialog.kind !== 'inspect') return;
    const { donId } = currentDialog;
    let moveIds = moveIdsFor(donId);
    const moveId = input.dataset.donMove;
    if (input.checked && !moveIds.includes(moveId) && moveIds.length < MAX_AURADON_MOVES) moveIds = [...moveIds, moveId];
    if (!input.checked) moveIds = moveIds.filter(id => id !== moveId);
    if (screen === 'team') {
      const activeId = teams.getActiveTeam()?.id;
      if (teams.updateMemberMoves(activeId, donId, moveIds)) {
        const libraryDraft = drafts.get(activeId);
        const member = libraryDraft?.members.find(item => item.id === donId);
        if (member) member.moveIds = moveIds;
        if (libraryDraft?.unassignedMoves.has(donId)) libraryDraft.unassignedMoves.set(donId, moveIds);
      }
      renderPage();
    } else {
      const member = draft.members.find(item => item.id === donId);
      if (member) member.moveIds = moveIds;
      else draft.unassignedMoves.set(donId, moveIds);
      markDraft();
    }
    syncMoveToggles();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-don-action]');
    if (!screen || !button) return;
    const { donAction, donId, donFocus, donTab } = button.dataset;
    switch (donAction) {
      case 'back': onBack(); break;
      case 'library': onLibrary(); break;
      case 'inspect':
        returnFocus = donFocus;
        if (screen === 'library') { selectedId = donId; renderPage(donFocus); }
        showDialog(donId, 'inspect');
        break;
      case 'chart':
        returnFocus = donFocus;
        showDialog(selectedId, 'chart');
        break;
      case 'inspect-chart': showDialog(currentDialog.donId, 'chart', true); break;
      case 'back-details':
        showDialog(currentDialog.donId, 'inspect');
        dialog.querySelector('[data-don-action="inspect-chart"]').focus();
        break;
      case 'tab': changeTab(donTab); break;
      case 'add': updateDraftMember(true); break;
      case 'remove': updateDraftMember(false); break;
      case 'close': dialog.close(); break;
    }
  });

  root.addEventListener('change', event => {
    if (!screen) return;
    const input = event.target;
    if (input.hasAttribute('data-don-move')) changeMove(input);
    if (input.dataset.donField === 'draft') {
      draft = getDraft(teams.getTeam(input.value));
      renderPage('saved-teams');
    }
    if (input.dataset.donField === 'active') {
      teams.setActiveTeam(input.value);
      renderPage('active-team');
    }
  });

  root.addEventListener('input', event => {
    if (screen !== 'library' || event.target.dataset.donField !== 'name') return;
    draft.name = event.target.value;
    markDraft();
  });

  root.addEventListener('submit', event => {
    if (screen !== 'library' || event.target.dataset.donForm !== 'save') return;
    event.preventDefault();
    const saved = teams.saveTeam(draft);
    if (!saved) return;
    drafts.delete(draft.id);
    draft = getDraft(saved);
    renderPage('save');
    page.querySelector('[data-don-status]').textContent = `${saved.name} saved${teams.canPersist() ? '.' : ' for this session.'}`;
  });

  dialog.addEventListener('keydown', event => {
    if (!event.target.hasAttribute('data-don-tab')) return;
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = event.target.dataset.donTab;
    changeTab(event.key === 'Home' || (event.key !== 'End' && current === 'moves') ? 'stats' : 'moves');
  });

  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    currentDialog = null;
    if (screen) focusPageControl(returnFocus);
    returnFocus = null;
  });

  return {
    show(view) {
      if (dialog.open) dialog.close();
      screen = view;
      root.hidden = false;
      if (screen === 'library') draft = getDraft(teams.getActiveTeam());
      renderPage();
      page.querySelector('h1').focus({ preventScroll: true });
    },
    hide() {
      screen = null;
      if (dialog.open) dialog.close();
      root.hidden = true;
    },
  };
}
