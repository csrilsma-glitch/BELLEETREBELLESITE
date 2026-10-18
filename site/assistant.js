// Widget de chat de l'assistante Belle & Rebelle.
// Envoie les messages à /.netlify/functions/chat (la clé API n'est jamais dans ce fichier).
(function () {
  const toggle = document.getElementById('assistant-toggle');
  const panel = document.getElementById('assistant-panel');
  const log = document.getElementById('assistant-log');
  const form = document.getElementById('assistant-form');
  const input = document.getElementById('assistant-input');
  if (!toggle || !panel || !log || !form || !input) return;

  const history = [];
  let busy = false;

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'assistant-msg assistant-' + role;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  }

  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    setOpen(open);
    if (open && log.childElementCount === 0) {
      addMessage('bot', 'Bonjour ! Je suis Melba, l’assistante de Belle & Rebelle. Posez-moi vos questions sur les prestations, ou dites-moi ce que vous souhaitez. Pour plusieurs prestations le même jour, je vous aide à réserver.');
    }
  });

  document.getElementById('assistant-close').addEventListener('click', () => setOpen(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    input.value = '';
    addMessage('user', text);
    history.push({ role: 'user', content: text });

    const typing = document.createElement('div');
    typing.className = 'assistant-msg assistant-bot assistant-typing';
    typing.textContent = '…';
    log.appendChild(typing);

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();
      if (!res.ok) {
        addMessage('bot', data.error || 'Désolée, je ne peux pas répondre pour le moment. Vous pouvez appeler Mélanie au 06 62 28 75 45.');
      } else {
        addMessage('bot', data.reply);
        history.push({ role: 'assistant', content: data.reply });
      }
    } catch (err) {
      typing.remove();
      addMessage('bot', 'Problème de connexion. Vous pouvez appeler Mélanie au 06 62 28 75 45.');
    } finally {
      busy = false;
    }
  });
})();
