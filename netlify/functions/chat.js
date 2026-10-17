// Fonction serveur : relaie la conversation vers Claude, qui peut consulter
// et réserver dans le calendrier SimplyBook de Mélanie via des outils.
// La clé API Anthropic reste ici (variable ANTHROPIC_API_KEY).

const { startTimesFor, bookOne } = require('./simplybook');

const MODEL = 'claude-haiku-5-5';
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;
const MAX_TOOL_ROUNDS = 5;

// Prestations. Les durées doivent correspondre à celles de SimplyBook.
// sb = identifiant du service dans SimplyBook (variables SB_ID_* sur Netlify).
const SERVICES = [
  { id: 'gel', name: 'Pose gel', duration: 90, sb: process.env.SB_ID_GEL },
  { id: 'capsules', name: 'Pose capsules', duration: 90, sb: process.env.SB_ID_CAPSULES },
  { id: 'semi', name: 'Semi-permanent', duration: 45, sb: process.env.SB_ID_SEMI },
  { id: 'nailart', name: 'Nail art & déco', duration: 30, sb: process.env.SB_ID_NAILART },
  { id: 'depose', name: 'Dépose', duration: 30, sb: process.env.SB_ID_DEPOSE },
];

const SYSTEM_PROMPT = `Tu es l'assistante de Belle & Rebelle, nail studio de Mélanie à Flers (28 rue de Messei, 61100 Flers).
Tu réponds en français, de façon chaleureuse, courte et simple.

Prestations (durées indicatives) :
${SERVICES.map(s => `- ${s.name} (id: ${s.id}) : ${s.duration} min`).join('\n')}

Tu peux :
- présenter les prestations et conseiller ;
- vérifier les disponibilités avec l'outil check_availability ;
- réserver avec l'outil book_appointment, quand la cliente a confirmé.

Règles pour réserver :
1. Demande d'abord la date souhaitée, les prestations, puis vérifie les disponibilités.
2. Propose les horaires réellement disponibles, sans en inventer.
3. Avant de réserver, demande le nom, le téléphone et l'e-mail de la cliente.
4. Récapitule (prestations, date, heure, durée totale) et attends son accord explicite.
5. Ne réserve jamais sans cet accord.
6. Si une réservation échoue, ne promets rien : demande à la cliente d'appeler Mélanie au 06 62 28 75 45.

Plusieurs prestations enchaînées forment un seul rendez-vous continu. L'outil check_availability te donne les horaires qui conviennent pour toutes les prestations à la suite.`;

const TOOLS = [
  {
    name: 'check_availability',
    description: 'Retourne les heures de début possibles pour enchaîner une ou plusieurs prestations à une date donnée.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date au format AAAA-MM-JJ' },
        service_ids: { type: 'array', items: { type: 'string' }, description: 'Ids des prestations, dans l\'ordre' },
      },
      required: ['date', 'service_ids'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Réserve dans le calendrier SimplyBook les prestations enchaînées, à partir de l\'heure donnée. À utiliser seulement après accord de la cliente.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date au format AAAA-MM-JJ' },
        start: { type: 'string', description: 'Heure de début au format HH:MM' },
        service_ids: { type: 'array', items: { type: 'string' } },
        client_name: { type: 'string' },
        client_phone: { type: 'string' },
        client_email: { type: 'string' },
      },
      required: ['date', 'start', 'service_ids', 'client_name', 'client_phone', 'client_email'],
    },
  },
];

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}

function pickServices(ids) {
  const list = ids.map(id => SERVICES.find(s => s.id === id));
  if (!list.length || list.some(s => !s)) throw new Error('Prestation inconnue');
  return list;
}

// Heures de début où toutes les prestations, enchaînées, sont disponibles.
async function sequenceStarts(dateISO, services) {
  const cache = {};
  for (const s of services) cache[s.id] = new Set(await startTimesFor(s.sb, dateISO));

  const first = services[0];
  const candidates = [...cache[first.id]];
  return candidates.filter(time => {
    let offset = 0;
    for (const s of services) {
      const at = toHHMM(toMinutes(time) + offset);
      if (!cache[s.id].has(at)) return false;
      offset += s.duration;
    }
    return true;
  }).sort();
}

async function runTool(name, input) {
  if (name === 'check_availability') {
    const services = pickServices(input.service_ids);
    const starts = await sequenceStarts(input.date, services);
    const total = services.reduce((n, s) => n + s.duration, 0);
    return { date: input.date, total_minutes: total, available_starts: starts };
  }

  if (name === 'book_appointment') {
    const services = pickServices(input.service_ids);
    // Vérification juste avant d'enregistrer
    const starts = await sequenceStarts(input.date, services);
    if (!starts.includes(input.start)) {
      return { ok: false, message: 'Ce créneau n\'est plus disponible. Proposez un autre horaire.' };
    }

    const client = { name: input.client_name, phone: input.client_phone, email: input.client_email };
    let offset = 0;
    const booked = [];
    for (const s of services) {
      const at = toHHMM(toMinutes(input.start) + offset);
      try {
        await bookOne({ eventId: s.sb, dateISO: input.date, time: at, client });
        booked.push({ service: s.name, start: at });
      } catch (err) {
        console.error('Échec réservation', s.id, err.message);
        return {
          ok: false,
          message: 'La réservation n\'a pas pu être finalisée complètement. Demandez à la cliente d\'appeler Mélanie au 06 62 28 75 45.',
          booked_before_error: booked,
        };
      }
      offset += s.duration;
    }
    return { ok: true, booked, end: toHHMM(toMinutes(input.start) + offset) };
  }

  throw new Error('Outil inconnu');
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned.length ? cleaned : null;
}

async function callClaude(apiKey, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 500, system: SYSTEM_PROMPT, tools: TOOLS, messages }),
  });
  if (!res.ok) throw new Error('API Claude ' + res.status);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Méthode non autorisée' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'Assistante non configurée' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Requête invalide' });
  }

  const messages = cleanMessages(payload.messages);
  if (!messages) return json(400, { error: 'Aucun message' });

  try {
    let data = await callClaude(apiKey, messages);

    for (let round = 0; round < MAX_TOOL_ROUNDS && data.stop_reason === 'tool_use'; round++) {
      messages.push({ role: 'assistant', content: data.content });
      const results = [];
      for (const block of data.content.filter(b => b.type === 'tool_use')) {
        let output;
        try {
          output = await runTool(block.name, block.input);
        } catch (err) {
          console.error('Outil en erreur', block.name, err.message);
          output = { error: 'Service de réservation momentanément indisponible. Demandez à la cliente d\'appeler Mélanie.' };
        }
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) });
      }
      messages.push({ role: 'user', content: results });
      data = await callClaude(apiKey, messages);
    }

    const reply = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    return json(200, { reply: reply || 'Je suis désolée, je n\'ai pas de réponse. Vous pouvez appeler Mélanie au 06 62 28 75 45.' });
  } catch (err) {
    console.error('Erreur', err.message);
    return json(502, { error: 'Réponse indisponible, réessayez ou appelez Mélanie.' });
  }
};
