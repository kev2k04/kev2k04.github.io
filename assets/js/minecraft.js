/* =========================================================================
   Minecraft theme: toggle + "mine for intel" minigame.
   Everything here is inert in the professional theme (the mine section is
   hidden via CSS, and the toggle simply flips a data-attribute on <html>).
   ========================================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'kl-theme';
  var root = document.documentElement;

  function isMinecraft() {
    return root.getAttribute('data-theme') === 'minecraft';
  }

  /* ---------- Theme toggle --------------------------------------------- */
  function syncToggle(btn) {
    var on = isMinecraft();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var txt = btn.querySelector('.theme-toggle__text');
    var icon = btn.querySelector('.theme-toggle__icon');
    if (txt) txt.textContent = on ? 'Professional' : 'Minecraft';
    if (icon) icon.textContent = on ? '💼' : '⛏'; /* briefcase / pickaxe */
  }

  function setTheme(on) {
    if (on) root.setAttribute('data-theme', 'minecraft');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(STORAGE_KEY, on ? 'minecraft' : 'pro'); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), syncToggle);
    if (on) {
      updateProgress();
      if (!sessionStorage.getItem('kl-mc-greeted')) {
        toast('⛏ Pickaxe equipped! Scroll down and mine the ores.');
        try { sessionStorage.setItem('kl-mc-greeted', '1'); } catch (e) {}
      }
    }
  }

  function wireToggles() {
    Array.prototype.forEach.call(document.querySelectorAll('.theme-toggle'), function (btn) {
      syncToggle(btn);
      btn.addEventListener('click', function () { setTheme(!isMinecraft()); });
    });
  }

  /* ---------- Sound (generated, no assets) ----------------------------- */
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var actx = null;
  function ensureCtx() {
    if (!AudioCtx) return null;
    if (!actx) { try { actx = new AudioCtx(); } catch (e) { return null; } }
    if (actx.state === 'suspended') { try { actx.resume(); } catch (e) {} }
    return actx;
  }
  // Short filtered-noise "dig" thunk; higher/brighter on break.
  function playDig(broke) {
    var ctx = ensureCtx();
    if (!ctx) return;
    var dur = broke ? 0.18 : 0.08;
    var buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = broke ? 2400 : 900;
    var gain = ctx.createGain();
    gain.gain.value = broke ? 0.35 : 0.22;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  /* ---------- Mining --------------------------------------------------- */
  var ORE_COLORS = {
    coal:     ['#2b2b2b', '#454545'],
    iron:     ['#d8a878', '#b07b4f'],
    redstone: ['#e23b3b', '#a31515'],
    gold:     ['#f4d63b', '#c79a17'],
    emerald:  ['#2ecf6b', '#159a48'],
    diamond:  ['#5ef0e6', '#1fbdb0']
  };

  function spawnParticles(block, count) {
    var face = block.querySelector('.mc-block__face');
    if (!face) return;
    var ore = block.getAttribute('data-ore');
    var colors = ORE_COLORS[ore] || ['#9a9a9a', '#6a6a6a'];
    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'mc-particle';
      p.style.background = colors[i % colors.length];
      p.style.left = (20 + Math.random() * 60) + '%';
      p.style.top = (30 + Math.random() * 40) + '%';
      var dx = (Math.random() * 2 - 1) * 60;
      var dy = -(20 + Math.random() * 45);
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      face.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 650); })(p);
    }
  }

  function breakBlock(block) {
    if (block.classList.contains('is-mined')) return;
    block.classList.add('is-mined');
    block.setAttribute('aria-label',
      'Mined: ' + (block.querySelector('.mc-reward__title') || {}).textContent);
    var reward = block.querySelector('.mc-reward');
    if (reward) reward.hidden = false;
    spawnParticles(block, 14);
    playDig(true);
    updateProgress();
  }

  function hit(block) {
    if (block.classList.contains('is-mined')) return;
    var needed = parseInt(block.getAttribute('data-needed'), 10) || 4;
    var hits = (parseInt(block.getAttribute('data-hits'), 10) || 0) + 1;
    block.setAttribute('data-hits', hits);

    // crack stage 1..4 maps onto progress
    var stage = Math.min(4, Math.ceil((hits / needed) * 4));
    block.setAttribute('data-crack', stage);

    // restart the shake animation
    block.classList.remove('is-shake');
    void block.offsetWidth;
    block.classList.add('is-shake');

    spawnParticles(block, 4);

    if (hits >= needed) breakBlock(block);
    else playDig(false);
  }

  function updateProgress() {
    var blocks = document.querySelectorAll('.mc-block');
    var mined = document.querySelectorAll('.mc-block.is-mined');
    var total = document.getElementById('mc-total');
    var done = document.getElementById('mc-mined');
    if (total) total.textContent = blocks.length;
    if (done) done.textContent = mined.length;
    if (blocks.length && mined.length === blocks.length) {
      toast('🏆 Achievement unlocked: Full Disclosure! Every ore mined.');
    }
  }

  function wireMine() {
    var blocks = document.querySelectorAll('.mc-block');
    Array.prototype.forEach.call(blocks, function (block) {
      block.addEventListener('mousedown', function (e) {
        if (!isMinecraft()) return;
        e.preventDefault();
        hit(block);
      });
      // touch
      block.addEventListener('touchstart', function (e) {
        if (!isMinecraft()) return;
        e.preventDefault();
        hit(block);
      }, { passive: false });
      // keyboard accessibility
      block.addEventListener('keydown', function (e) {
        if (!isMinecraft()) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          hit(block);
        }
      });
    });
    updateProgress();
  }

  /* ---------- Toast ---------------------------------------------------- */
  var toastTimer = null;
  function toast(msg) {
    if (!isMinecraft()) return;
    var el = document.getElementById('mc-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mc-toast';
      el.className = 'mc-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-shown'); }, 3600);
  }

  /* ---------- Init ----------------------------------------------------- */
  function init() {
    wireToggles();
    wireMine();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
