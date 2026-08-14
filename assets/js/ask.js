/* =========================================================================
   "Ask Kevin" chat page.

   Talks to {apiBase}/api/ask — a serverless function that holds the Anthropic
   key server-side. No key, prompt, or model name exists in this file; the
   browser only ever sends a message list and receives reply text.

   On plain GitHub Pages there are no serverless functions, so /api/ask would
   404 on every send. The page probes once on load and, if the endpoint isn't
   there, locks the composer with an honest empty state instead of letting
   people type into a dead form.
   ========================================================================= */
(function () {
  'use strict';

  var root = document.querySelector('.ask');
  if (!root) return;

  var apiBase = (root.getAttribute('data-api-base') || '').replace(/\/$/, '');
  var endpoint = apiBase + '/api/ask';

  var log = document.getElementById('ask-log');
  var form = document.getElementById('ask-form');
  var input = document.getElementById('ask-input');
  var send = document.getElementById('ask-send');
  var note = document.getElementById('ask-note');
  var suggest = document.getElementById('ask-suggest');

  /* The conversation as the API wants it. The greeting bubble is presentation
     only and deliberately not in here — the first turn must be the visitor's. */
  var history = [];
  var busy = false;

  /* ---------------- Rendering ------------------------------------------- */

  function scrollToEnd() {
    log.scrollTop = log.scrollHeight;
  }

  /* Replies come back as plain text. Split on blank lines into paragraphs and
     set textContent per paragraph — never innerHTML, so a reply can't inject
     markup into the page. */
  function addMessage(who, text, role) {
    var wrap = document.createElement('div');
    wrap.className = 'ask-msg ask-msg--' + role;

    var label = document.createElement('span');
    label.className = 'ask-msg__who';
    label.textContent = who;
    wrap.appendChild(label);

    var body = document.createElement('div');
    body.className = 'ask-msg__body';
    String(text).split(/\n{2,}/).forEach(function (para) {
      var trimmed = para.trim();
      if (!trimmed) return;
      var p = document.createElement('p');
      p.textContent = trimmed;
      body.appendChild(p);
    });
    wrap.appendChild(body);

    log.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  function addThinking() {
    var wrap = document.createElement('div');
    wrap.className = 'ask-msg ask-msg--bot ask-msg--pending';
    wrap.innerHTML =
      '<span class="ask-msg__who">Ask Kevin</span>' +
      '<div class="ask-msg__body"><span class="ask-dots" aria-label="Thinking">' +
      '<i></i><i></i><i></i></span></div>';
    log.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  function addError(text) {
    var wrap = addMessage('Ask Kevin', text, 'bot');
    wrap.classList.add('ask-msg--error');
    return wrap;
  }

  /* ---------------- Composer state -------------------------------------- */

  function setBusy(on) {
    busy = on;
    input.disabled = on;
    send.disabled = on;
    form.setAttribute('data-state', on ? 'busy' : 'idle');
  }

  function disablePermanently(message) {
    input.disabled = true;
    send.disabled = true;
    input.placeholder = 'Unavailable';
    form.setAttribute('data-state', 'off');
    if (suggest) suggest.hidden = true;
    note.textContent = message;
  }

  /* Grow the textarea with its content, up to a cap, so long questions are
     readable without turning the box into a scroll pit. */
  function autoGrow() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }

  /* ---------------- Sending --------------------------------------------- */

  function ask(question) {
    if (busy) return;
    var text = String(question || '').trim();
    if (!text) return;

    if (suggest) suggest.hidden = true;

    addMessage('You', text, 'you');
    history.push({ role: 'user', content: text });

    input.value = '';
    autoGrow();
    setBusy(true);
    var pending = addThinking();

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (res) {
        return res.json()
          .catch(function () { return null; })
          .then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        pending.remove();

        var data = result.data;
        if (!result.ok || !data || !data.reply) {
          var msg = (data && data.error) ||
            'Something went wrong reaching the assistant. Try again in a moment.';
          addError(msg);
          // Drop the unanswered turn so the next send isn't two user turns deep.
          history.pop();
          return;
        }

        addMessage('Ask Kevin', data.reply, 'bot');
        history.push({ role: 'assistant', content: data.reply });
      })
      .catch(function () {
        pending.remove();
        addError('Could not reach the assistant. Check your connection and try again.');
        history.pop();
      })
      .then(function () {
        setBusy(false);
        input.focus();
      });
  }

  /* ---------------- Wiring ---------------------------------------------- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    ask(input.value);
  });

  // Enter sends, Shift+Enter makes a new line — the convention people expect
  // from a chat box.
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input.value);
    }
  });

  input.addEventListener('input', autoGrow);

  if (suggest) {
    suggest.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-ask-chip]');
      if (chip) ask(chip.textContent.trim());
    });
  }

  /* ---------------- Availability probe ---------------------------------- */

  /* GET /api/ask is a health check that answers 200 { ok: true, ready }. On
     plain GitHub Pages there is no function, so the request 404s and we lock
     the composer. `ready: false` means the function is there but has no API
     key configured — also unusable, but worth a different message. */
  setBusy(true);
  fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('absent');
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) throw new Error('absent');
      if (data.ready === false) {
        disablePermanently(
          'This assistant is deployed but not configured yet, so it can’t ' +
          'answer right now. Everything it would tell you is on the ' +
          'Experience page — or just email me.'
        );
        return;
      }
      setBusy(false);
    })
    .catch(function () {
      disablePermanently(
        'This assistant runs on a serverless function that isn’t deployed on ' +
        'this host yet, so it can’t answer right now. Everything it would ' +
        'tell you is on the Experience page — or just email me.'
      );
    });
})();
