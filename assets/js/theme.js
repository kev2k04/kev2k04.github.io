/* =========================================================================
   Light / dark mode toggle.

   Independent of the Minecraft theme (which owns `data-theme` + `kl-theme`).
   Light/dark lives on `data-mode` (+ `kl-mode`); dark is the default and is
   represented by the *absence* of the attribute. The pre-paint inline script
   in head.html applies the saved mode before first paint to avoid a flash.
   ========================================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'kl-mode';
  var root = document.documentElement;

  function isLight() {
    return root.getAttribute('data-mode') === 'light';
  }

  function syncToggle(btn) {
    var on = isLight();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Switch to dark mode' : 'Switch to light mode');
    btn.setAttribute('title', on ? 'Switch to dark mode' : 'Switch to light mode');
  }

  function setMode(light) {
    if (light) root.setAttribute('data-mode', 'light');
    else root.removeAttribute('data-mode');
    try { localStorage.setItem(STORAGE_KEY, light ? 'light' : 'dark'); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll('.mode-toggle'), syncToggle);
  }

  function wire() {
    Array.prototype.forEach.call(document.querySelectorAll('.mode-toggle'), function (btn) {
      syncToggle(btn);
      btn.addEventListener('click', function () { setMode(!isLight()); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
