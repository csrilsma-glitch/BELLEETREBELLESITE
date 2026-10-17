// Connecteur SimplyBook.me (API JSON-RPC publique).
// Identifiants lus dans les variables d'environnement Netlify :
//   SIMPLYBOOK_COMPANY  = identifiant de l'entreprise (ex. belleetrebellenailstudio)
//   SIMPLYBOOK_API_KEY  = clé API générée dans l'espace administrateur SimplyBook

const LOGIN_URL = 'https://user-api.simplybook.me/login';
const API_URL = 'https://user-api.simplybook.me/';

let cachedToken = null; // { token, expires } gardé le temps de la fonction

async function rpc(url, method, params, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  if (!res.ok) throw new Error('SimplyBook HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Erreur SimplyBook');
  return data.result;
}

async function getAuthHeaders() {
  const company = process.env.SIMPLYBOOK_COMPANY;
  const apiKey = process.env.SIMPLYBOOK_API_KEY;
  if (!company || !apiKey) throw new Error('SimplyBook non configuré');

  if (!cachedToken || cachedToken.expires < Date.now()) {
    const token = await rpc(LOGIN_URL, 'getToken', [company, apiKey]);
    cachedToken = { token, expires: Date.now() + 50 * 60 * 1000 };
  }
  return { 'X-Company-Login': company, 'X-Token': cachedToken.token };
}

async function call(method, params) {
  const headers = await getAuthHeaders();
  return rpc(API_URL, method, params, headers);
}

// Créneaux de départ disponibles pour un service à une date donnée.
// Retourne un tableau de chaînes "HH:MM".
async function startTimesFor(eventId, dateISO) {
  const matrix = await call('getStartTimeMatrix', [dateISO, dateISO, eventId]);
  const times = (matrix && matrix[dateISO]) || [];
  return times.map(t => t.slice(0, 5));
}

// Réserve un service à une date et une heure. Retourne l'identifiant de réservation.
async function bookOne({ eventId, dateISO, time, client }) {
  const clientData = { name: client.name, email: client.email, phone: client.phone };
  return call('book', [eventId, null, dateISO, time + ':00', clientData, {}, 1]);
}

module.exports = { call, startTimesFor, bookOne };
