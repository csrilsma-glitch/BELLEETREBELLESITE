/* Mémoire de session de Melba (CW-003) : conserve la conversation après un rafraîchissement de la page.
   Minimisation : pas de coordonnées (un message qui en contient n'est jamais stocké), pas de propositions
   cliquables, durée limitée, purge après réservation. Stockage : sessionStorage (propre à l'onglet). */
(function (root) {
  const KEY = 'br-melba-session-v1';
  const TTL_MS = 30 * 60 * 1000;
  const MAX_MESSAGES = 20;
  const MAX_CHARS = 1000;
  const CONTACT = /[\w.+-]+@[\w-]+\.[\w.-]+|(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}|\b\d{10}\b/;

  // Une valeur stockée n'est jamais rendue ni renvoyée au serveur sans ces contrôles.
  function cleanHistory(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .filter(m => !CONTACT.test(m.content))
      .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS), ...(typeof m.signature === 'string' ? { signature: m.signature } : {}) }))
      .slice(-MAX_MESSAGES);
  }

  function pack(state, now = Date.now()) {
    return JSON.stringify({
      v: 1,
      savedAt: now,
      history: cleanHistory(state.history),
      bookingContext: state.bookingContext && typeof state.bookingContext === 'object' ? state.bookingContext : null,
      contextSignature: typeof state.contextSignature === 'string' ? state.contextSignature : null,
    });
  }

  // Renvoie l'état restauré, ou null si absent, expiré, invalide ou d'une autre version.
  function unpack(raw, now = Date.now()) {
    if (typeof raw !== 'string') return null;
    let data;
    try { data = JSON.parse(raw); } catch (_) { return null; }
    if (!data || data.v !== 1 || typeof data.savedAt !== 'number') return null;
    if (now - data.savedAt > TTL_MS || now < data.savedAt) return null;
    const history = cleanHistory(data.history);
    if (!history.length) return null;
    return {
      history,
      bookingContext: data.bookingContext && typeof data.bookingContext === 'object' ? data.bookingContext : null,
      contextSignature: typeof data.contextSignature === 'string' ? data.contextSignature : null,
    };
  }

  function store() {
    try { return root.sessionStorage; } catch (_) { return null; }
  }

  function save(state) {
    const s = store();
    if (!s) return false;
    try { s.setItem(KEY, pack(state)); return true; } catch (_) { return false; }
  }

  function load(now = Date.now()) {
    const s = store();
    if (!s) return null;
    let raw = null;
    try { raw = s.getItem(KEY); } catch (_) { return null; }
    const state = unpack(raw, now);
    if (!state) { clear(); return null; }
    return state;
  }

  function clear() {
    const s = store();
    try { if (s) s.removeItem(KEY); } catch (_) { /* stockage indisponible : rien à purger */ }
  }

  const api = { KEY, TTL_MS, MAX_MESSAGES, cleanHistory, pack, unpack, save, load, clear };
  root.BRMelbaSession = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
