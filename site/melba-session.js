/* Mémoire de session de Melba (CW-003) : conserve la conversation après un rafraîchissement de la page.
   Minimisation : pas de coordonnées (un message qui en contient n'est jamais stocké), pas de propositions
   cliquables, durée limitée, purge après réservation. Stockage : sessionStorage (propre à l'onglet). */
(function (root) {
  const KEY = 'br-melba-session-v1';
  const TTL_MS = 30 * 60 * 1000;
  const MAX_MESSAGES = 20;
  const MAX_CHARS = 1000;
  const CONTACT = /[\w.+-]+@[\w-]+\.[\w.-]+|(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}|\b\d{10}\b/;
  // ANO-CW10-001 : un nom introduit par une formule explicite fait sortir le message de la mémoire.
  // Limite : un nom donné seul, sans formule, n'est pas détectable ici.
  const NAME_CUE = /\b(?:je\s+m['’]\s*appelle|mon\s+pr[ée]nom(?:\s+est)?|mon\s+nom(?:\s+est)?|je\s+suis|voici\s+mon|nom\s*:|pr[ée]nom\s*:)\s*:?\s*([\p{L}'’-]+(?:\s+[\p{L}'’-]+)?)?/iu;
  const norm = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Une valeur stockée n'est jamais rendue ni renvoyée au serveur sans ces contrôles.
  // Un nom annoncé est retenu : tout message qui le répète (y compris une réponse de Melba) est écarté.
  // ANO-CW10-001 (reliquat) : une réponse courte et majuscule donnée juste après une demande de nom ou de
  // coordonnées, ou juste après un message contenant un téléphone ou un e-mail, est traitée comme un nom seul.
  const ASKS_CONTACT = /\b(?:nom|pr[ée]nom|coordonn[ée]es?|t[ée]l[ée]phone|e-?mail|mail)\b/i;
  function isBareName(m, prev) {
    if (!m || m.role !== 'user') return false;
    const words = m.content.trim().split(/\s+/).filter(Boolean);
    if (!words.length || words.length > 4 || !/\p{Lu}/u.test(m.content)) return false;
    if (!prev) return false;
    return CONTACT.test(prev.content) || (prev.role === 'assistant' && ASKS_CONTACT.test(prev.content));
  }

  // Une valeur stockée n'est jamais rendue ni renvoyée au serveur sans ces contrôles.
  // Un nom annoncé ou un nom seul est retenu : tout message qui le répète (y compris une réponse de Melba) est écarté.
  function cleanHistory(list) {
    if (!Array.isArray(list)) return [];
    const valid = list.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
    const names = new Set();
    const addNames = t => t.split(/\s+/).map(norm).filter(w => w.length >= 3).forEach(w => names.add(w));
    valid.forEach(m => {
      for (const hit of m.content.matchAll(new RegExp(NAME_CUE.source, 'giu'))) {
        if (hit[1]) addNames(hit[1]);
      }
    });
    const bare = new Set();
    valid.forEach((m, i) => { if (isBareName(m, valid[i - 1])) { bare.add(m); addNames(m.content); } });
    const repeatsName = t => { const n = norm(t); return [...names].some(w => n.includes(w)); };
    return valid
      .filter(m => !bare.has(m) && !CONTACT.test(m.content) && !NAME_CUE.test(m.content) && !repeatsName(m.content))
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
