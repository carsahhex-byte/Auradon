import { defaultMoveIds, getAuradon, getMove } from './auradon-catalog.22215fdc449c.js';

export const AURADON_TEAMS_SAVE_KEY = 'auradon.teams.v1';
export const MAX_AURADON_TEAM_SIZE = 6;
export const MAX_AURADON_MOVES = 4;
export const MAX_AURADON_TEAM_NAME = 30;

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function readMoveIds(moveIds) {
  return Array.isArray(moveIds)
    ? [...new Set(moveIds.filter(id => typeof id === 'string' && getMove(id)))].slice(0, MAX_AURADON_MOVES)
    : [];
}

function readMembers(members) {
  if (!Array.isArray(members)) return [];
  const found = new Set();
  const result = [];
  for (const member of members) {
    const id = member?.id;
    if (typeof id !== 'string' || found.has(id) || !getAuradon(id)) continue;
    found.add(id);
    result.push({ id, moveIds: readMoveIds(member.moveIds ?? defaultMoveIds(id)) });
    if (result.length === MAX_AURADON_TEAM_SIZE) break;
  }
  return result;
}

function readName(name) {
  return typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_AURADON_TEAM_NAME) : '';
}

function readTeams(value) {
  const teams = [];
  const seen = new Set();
  if (Array.isArray(value?.teams)) {
    for (const team of value.teams) {
      const id = team?.id;
      const name = readName(team?.name);
      const members = readMembers(team?.members);
      if (typeof id !== 'string' || !id || !name || !members.length || seen.has(id)) continue;
      seen.add(id);
      teams.push({ id, name, members });
    }
  }
  return { teams, activeTeamId: seen.has(value?.activeTeamId) ? value.activeTeamId : teams[0]?.id ?? null };
}

export function createAuradonTeams(storage = browserStorage()) {
  let memory = { teams: [], activeTeamId: null };
  let disk = storage;

  function read() {
    if (!disk) return memory;
    let data;
    try { data = disk.getItem(AURADON_TEAMS_SAVE_KEY); } catch { disk = null; return memory; }
    try { memory = readTeams(JSON.parse(data)); } catch { return memory; }
    return memory;
  }

  function write(value) {
    memory = value;
    try { disk?.setItem(AURADON_TEAMS_SAVE_KEY, JSON.stringify(value)); } catch { disk = null; }
  }

  function getTeams() {
    return structuredClone(read().teams);
  }

  function getActiveTeam() {
    const { teams, activeTeamId } = read();
    return structuredClone(teams.find(team => team.id === activeTeamId) ?? null);
  }

  function getTeam(id) {
    return structuredClone(read().teams.find(team => team.id === id) ?? null);
  }

  function saveTeam(candidate) {
    const current = read();
    const index = current.teams.findIndex(team => team.id === candidate?.id);
    const members = readMembers(candidate?.members);
    if (!members.length) return null;
    const id = index < 0 ? globalThis.crypto?.randomUUID?.() || `team-${Date.now()}-${Math.random().toString(36).slice(2)}` : current.teams[index].id;
    const name = readName(candidate?.name) || (index < 0 ? `Team ${current.teams.length + 1}` : current.teams[index].name);
    const team = { id, name, members };
    const teams = current.teams.slice();
    if (index < 0) teams.push(team);
    else teams[index] = team;
    write({ teams, activeTeamId: current.activeTeamId ?? id });
    return structuredClone(team);
  }

  function setActiveTeam(id) {
    const current = read();
    if (!current.teams.some(team => team.id === id)) return false;
    write({ ...current, activeTeamId: id });
    return true;
  }

  function updateMemberMoves(teamId, donId, moveIds) {
    const current = read();
    const team = current.teams.find(item => item.id === teamId);
    const member = team?.members.find(item => item.id === donId);
    if (!member) return false;
    member.moveIds = readMoveIds(moveIds);
    write(current);
    return true;
  }

  return { getTeams, getActiveTeam, getTeam, saveTeam, setActiveTeam, updateMemberMoves, canPersist: () => Boolean(disk) };
}
