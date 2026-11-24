/* =========================================================================
   Hidden page trigger.

   Clicking (or tapping) the hero headshot three times in quick succession
   opens the hidden /vault/ page in a new tab. Nothing on the page hints at
   it: no cursor change, no tooltip, no visible state between clicks.
   ========================================================================= */
(function () {
  var portrait = document.querySelector('.hero__portrait img');
  if (!portrait) return;

  var CLICKS_NEEDED = 3;
  var WINDOW_MS = 900;   // all three clicks must land within this span
  var count = 0;
  var timer = null;

  portrait.addEventListener('click', function () {
    count += 1;
    clearTimeout(timer);

    if (count >= CLICKS_NEEDED) {
      count = 0;
      // Full URL on the current origin, so it works on localhost and live.
      // Opened inside the click handler so pop-up blockers allow it.
      var url = new URL('/vault/', window.location.href).href;
      window.open(url, '_blank', 'noopener');
      return;
    }

    timer = setTimeout(function () { count = 0; }, WINDOW_MS);
  });
})();
