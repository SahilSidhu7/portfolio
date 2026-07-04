// chatbot/static/widget.js — dependency-free streaming chat widget (~3KB gzipped)
(function () {
  const ORIGIN = new URL(document.currentScript.src).origin;
  const REFUSAL_STYLE = 'color:#a79ec0';

  const css = `
  #pchat-btn{position:fixed;bottom:20px;right:20px;z-index:99999;width:56px;height:56px;border-radius:50%;
    border:none;cursor:pointer;background:#8674f4;color:#fff;font-size:24px;box-shadow:0 4px 20px rgba(0,0,0,.35)}
  #pchat-panel{position:fixed;bottom:88px;right:20px;z-index:99999;width:min(360px,calc(100vw - 32px));
    height:480px;max-height:70vh;display:none;flex-direction:column;background:#171321;color:#f0edf7;
    border:1px solid #2a2438;border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,.5);overflow:hidden;
    font:14px/1.5 system-ui,sans-serif}
  #pchat-panel.open{display:flex}
  #pchat-head{padding:12px 16px;background:#1e1930;border-bottom:1px solid #2a2438;font-weight:600}
  #pchat-head small{display:block;font-weight:400;color:#a79ec0;font-size:11px}
  #pchat-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
  .pchat-m{max-width:85%;padding:8px 12px;border-radius:10px;white-space:pre-wrap;word-wrap:break-word}
  .pchat-user{align-self:flex-end;background:#8674f4;color:#fff}
  .pchat-bot{align-self:flex-start;background:#1e1930;border:1px solid #2a2438}
  .pchat-src{align-self:flex-start;font-size:11px;color:#a79ec0;padding:0 4px}
  .pchat-src a{color:#a493ff;text-decoration:none}
  #pchat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #2a2438;background:#1e1930}
  #pchat-in{flex:1;padding:9px 12px;border-radius:8px;border:1px solid #2a2438;background:#171321;
    color:#f0edf7;outline:none;font:inherit}
  #pchat-send{padding:9px 14px;border:none;border-radius:8px;background:#8674f4;color:#fff;cursor:pointer;font:inherit}
  #pchat-send:disabled{opacity:.5;cursor:default}`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'pchat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.textContent = '✦';

  const panel = document.createElement('div');
  panel.id = 'pchat-panel';
  panel.innerHTML = `
    <div id="pchat-head">Ask about this site<small>AI answers from this website's content — runs on our own server</small></div>
    <div id="pchat-msgs"></div>
    <form id="pchat-form"><input id="pchat-in" placeholder="Type a question…" autocomplete="off">
    <button id="pchat-send" type="submit">Send</button></form>`;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  const msgs = panel.querySelector('#pchat-msgs');
  const form = panel.querySelector('#pchat-form');
  const input = panel.querySelector('#pchat-in');
  const send = panel.querySelector('#pchat-send');

  btn.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  function add(cls, text) {
    const el = document.createElement('div');
    el.className = 'pchat-m ' + cls;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  async function ask(question) {
    add('pchat-user', question);
    const bot = add('pchat-bot', '…');
    send.disabled = true;
    try {
      const resp = await fetch(ORIGIN + '/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!resp.ok || !resp.body) throw new Error('bad response');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const ev of events) {
          if (!ev.startsWith('data: ')) continue;
          const data = JSON.parse(ev.slice(6));
          if (data.delta) {
            text += data.delta;
            bot.textContent = text;
            msgs.scrollTop = msgs.scrollHeight;
          }
          if (data.done && data.sources && data.sources.length) {
            const src = document.createElement('div');
            src.className = 'pchat-src';
            src.append('Sources: ');
            data.sources.forEach((s, i) => {
              const a = document.createElement('a');
              a.href = s; a.target = '_blank'; a.rel = 'noopener';
              a.textContent = new URL(s).pathname || s;
              if (i) src.append(' · ');
              src.appendChild(a);
            });
            msgs.appendChild(src);
          }
        }
      }
      if (!text) bot.textContent = 'The assistant is currently unavailable.';
    } catch (e) {
      bot.textContent = 'The assistant is currently unavailable.';
      bot.setAttribute('style', REFUSAL_STYLE);
    } finally {
      send.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = '';
    ask(q);
  });
})();
