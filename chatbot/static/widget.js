// chatbot/static/widget.js — dependency-free streaming chat widget (~3KB gzipped)
(function () {
  const ORIGIN = new URL(document.currentScript.src).origin;
  const REFUSAL_STYLE = 'color:#6b6b72';

  // Matches the portfolio's "paper bento" theme: paper card on grey canvas,
  // coal ink, periwinkle/mint accents, wide Archivo display type, corner bracket.
  const css = `
  #pchat-btn{position:fixed;bottom:20px;right:20px;z-index:99999;width:58px;height:58px;border-radius:50%;
    border:none;cursor:pointer;background:#0c0c0d;color:#f6f6f4;font-size:22px;line-height:1;
    box-shadow:0 10px 28px rgba(12,12,13,.28);transition:transform .2s cubic-bezier(.2,.7,.2,1)}
  #pchat-btn:hover{transform:translateY(-2px) rotate(-8deg)}
  #pchat-btn:focus-visible{outline:2px solid #8286d8;outline-offset:3px}
  #pchat-panel{position:fixed;bottom:90px;right:20px;z-index:99999;width:min(370px,calc(100vw - 32px));
    height:500px;max-height:72vh;display:none;flex-direction:column;background:#f6f6f4;color:#0c0c0d;
    border:1px solid #dcdce0;border-radius:22px;box-shadow:0 18px 50px rgba(12,12,13,.18);overflow:hidden;
    font:14px/1.5 "Instrument Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  #pchat-panel.open{display:flex;animation:pchat-rise .35s cubic-bezier(.2,.7,.2,1) both}
  @keyframes pchat-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){#pchat-panel.open{animation:none}#pchat-btn{transition:none}}
  #pchat-head{position:relative;margin:10px 10px 0;padding:16px 44px 16px 18px;background:#8286d8;color:#fff;
    border-radius:16px;font:800 17px/1.1 "Archivo",system-ui,sans-serif;font-stretch:125%;letter-spacing:-.01em}
  #pchat-head::after{content:"";position:absolute;top:14px;right:14px;width:11px;height:11px;
    border-top:1.5px solid currentColor;border-right:1.5px solid currentColor;opacity:.7}
  #pchat-head small{display:block;margin-top:6px;font:500 10.5px/1.4 "JetBrains Mono",ui-monospace,monospace;
    font-stretch:100%;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.82)}
  #pchat-msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px}
  .pchat-m{max-width:85%;padding:9px 13px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
  .pchat-user{align-self:flex-end;background:#0c0c0d;color:#f6f6f4;border-bottom-right-radius:4px}
  .pchat-bot{align-self:flex-start;background:#e6e6e9;color:#0c0c0d;border-bottom-left-radius:4px}
  .pchat-src{align-self:flex-start;font:500 11px/1.5 "JetBrains Mono",ui-monospace,monospace;color:#6b6b72;padding:0 4px}
  .pchat-src a{color:#56565b;text-decoration:none;border-bottom:1px dashed currentColor}
  .pchat-src a:hover{color:#0c0c0d}
  #pchat-form{display:flex;gap:8px;padding:10px;margin:0 10px 10px;background:#fff;border:1px solid #dcdce0;border-radius:16px}
  #pchat-in{flex:1;min-width:0;padding:8px 6px;border:none;background:transparent;color:#0c0c0d;outline:none;font:inherit}
  #pchat-in::placeholder{color:#6b6b72}
  #pchat-send{padding:8px 16px;border:none;border-radius:999px;background:#a9dcd4;color:#0c0c0d;cursor:pointer;
    font:600 13px/1 "Instrument Sans",system-ui,sans-serif;transition:background .15s}
  #pchat-send:hover{background:#8fd0c6}
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
