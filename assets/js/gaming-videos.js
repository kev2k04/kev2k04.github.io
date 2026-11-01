/* =========================================================================
   Gaming page video cards (_includes/passions/gaming.html). A card shows the
   YouTube thumbnail; clicking it swaps in the player, starting at the card's
   timestamp. Without JS the card is a plain link to the video on YouTube.
   ========================================================================= */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('[data-yt]'), function (card) {
    card.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;   // let modified clicks open YouTube
      e.preventDefault();
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.dataset.yt) +
        '?autoplay=1&rel=0&start=' + (parseInt(card.dataset.start, 10) || 0);
      iframe.title = card.dataset.title || 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.setAttribute('allowfullscreen', '');
      var frame = document.createElement('div');
      frame.className = 'gg-video__frame is-playing';
      frame.appendChild(iframe);
      card.replaceWith(frame);
      iframe.focus();
    });
  });
})();
