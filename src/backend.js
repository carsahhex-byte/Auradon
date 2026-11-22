export const BACKEND_SERVICE = 'auradon-multiplayer';
export const MULTIPLAYER_STORAGE_KEY = 'auradon.multiplayer.v2';
export const LEGACY_MULTIPLAYER_STORAGE_KEY = 'auradon.multiplayer.v1';

export function createBackendVerifier() {
  let verifiedEndpoint = '';
  return async (endpoint, signal) => {
    if (endpoint === verifiedEndpoint) return;
    const response = await fetch(`${endpoint}/api/health`, {
      headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store', redirect: 'error', signal,
    });
    const health = await response.json().catch(() => null);
    if (!response.ok || health?.ok !== true || health.service !== BACKEND_SERVICE) {
      throw new Error('Use an Auradon game server. Check its address and the setup guide.');
    }
    verifiedEndpoint = endpoint;
  };
}
