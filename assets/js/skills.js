/* =========================================================================
   Skill popup — click an "Areas of Expertise" tag to open a small dialog that
   showcases how Kevin has used that skill (and, when set, links to a project /
   shows a screenshot). One reusable overlay; content is filled from the clicked
   tag's data-* attributes. Scrim / Back / Esc close it.
   ========================================================================= */
(function () {
  var overlay = document.getElementById('skill-overlay');
  if (!overlay) return;

  var titleEl = document.getElementById('skill-modal-title');
  var blurbEl = overlay.querySelector('[data-skill-blurb-out]');
  var linkEl  = overlay.querySelector('[data-skill-link-out]');
  var linkTextEl = overlay.querySelector('[data-skill-link-text]');
  var mediaEl = overlay.querySelector('[data-skill-media]');
  var imgEl   = overlay.querySelector('[data-skill-img]');
  var scrim   = overlay.querySelector('.skill-scrim');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lastFocus = null;
  var closeTimer = null;

  function open(btn) {
    lastFocus = btn;
    titleEl.textContent = btn.getAttribute('data-skill-name') || '';
    blurbEl.textContent = btn.getAttribute('data-skill-blurb') || '';

    var link = btn.getAttribute('data-skill-link');
    if (link) {
      linkEl.href = link;
      if (linkTextEl) linkTextEl.textContent = btn.getAttribute('data-skill-link-label') || 'View project';
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
    }

    var img = btn.getAttribute('data-skill-image');
    if (img) {
      imgEl.src = img;
      imgEl.alt = (btn.getAttribute('data-skill-name') || '') + ' project';
      mediaEl.hidden = false;
    } else {
      mediaEl.hidden = true;
    }

    clearTimeout(closeTimer);
    overlay.hidden = false;
    document.body.classList.add('exp-lock');
    requestAnimationFrame(function () { overlay.classList.add('is-active'); });
    var back = overlay.querySelector('[data-skill-close]');
    if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
  }

  function close() {
    if (overlay.hidden) return;
    overlay.classList.remove('is-active');
    var finish = function () {
      overlay.hidden = true;
      document.body.classList.remove('exp-lock');
      if (lastFocus) { try { lastFocus.focus(); } catch (e) {} }
    };
    if (reduce) finish();
    else { clearTimeout(closeTimer); closeTimer = setTimeout(finish, 320); }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-skill]'), function (btn) {
    btn.addEventListener('click', function () { open(btn); });
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === scrim || e.target.closest('[data-skill-close]')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) { close(); }
  });
})();
