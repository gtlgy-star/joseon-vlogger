(function () {
  'use strict';

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  const responsiveViewport = 'width=device-width,initial-scale=1,viewport-fit=cover';
  const embeddedCanvas = new URLSearchParams(window.location.search).has('tablet_canvas');

  function fitTabletViewport() {
    const isMobileBrowser = /Android|iPad|iPhone|iPod|Mobile/i.test(navigator.userAgent);
    const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches;
    if (!embeddedCanvas && window.top === window.self && (hasTouch || isMobileBrowser)) {
      window.location.replace(new URL('tablet-shell.html', window.location.href));
      return;
    }
    if (viewport.content !== responsiveViewport) viewport.content = responsiveViewport;
  }

  fitTabletViewport();
  window.addEventListener('pageshow', fitTabletViewport);
})();
