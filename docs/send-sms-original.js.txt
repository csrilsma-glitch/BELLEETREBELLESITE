// Belle & Rebelle — SMS transactionnels Brevo
const crypto = require('node:crypto');

function authorized(header, secret) {
  if (!secret || !header?.startsWith('Bearer ')) return false;
  const supplied = Buffer.from(header.slice(7), 'utf8');
  const expected = Buffer.from(secret, 'utf8');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }
  if (!authorized(event.headers?.authorization || event.headers?.Authorization, process.env.SMS_ADMIN_TOKEN)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé' }) };
  }
  if (!process.env.BREVO_API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Configuration SMS indisponible' }) };
  }
  let data;
  try { data = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) }; }
  const phone = String(data.phone || '').trim().replace(/[\s.-]/g, '');
  if (!/^\+33[1-9]\d{8}$/.test(phone)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Numéro français requis au format +33XXXXXXXXX' }) };
  }
  const payload = {
    sender: 'BELREBELLE',
    recipient: phone,
    content: 'Belle & Rebelle : ceci est un SMS de test de notre futur systeme de reservation.',
    type: 'transactional',
    tag: 'test-technique'
  };
  try {
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Brevo SMS test error', response.status, result.code || 'unknown');
      return { statusCode: 502, body: JSON.stringify({ error: 'Envoi refusé par Brevo', code: result.code || null }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Demande de SMS acceptée par Brevo', messageId: result.messageId || null }) };
  } catch (error) {
    console.error('Brevo SMS test failure', error.name);
    return { statusCode: 502, body: JSON.stringify({ error: 'Service SMS indisponible' }) };
  }
};
