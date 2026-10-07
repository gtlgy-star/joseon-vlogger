(function () {
  'use strict';

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;

  const responsiveViewport = 'width=device-width,initial-scale=1,viewport-fit=cover';
  const landscapeTabletViewport = 'width=1280,viewport-fit=cover';

  function isLandscape() {
    if (screen.orientation?.type) return screen.orientation.type.startsWith('landscape');
    return window.matchMedia('(orientation: landscape)').matches;
  }

  function fitTabletViewport() {
    const hasTouch = navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches;
    const content = hasTouch && isLandscape() ? landscapeTabletViewport : responsiveViewport;
    if (viewport.content !== content) viewport.content = content;
  }

  fitTabletViewport();
  window.addEventListener('orientationchange', () => window.setTimeout(fitTabletViewport, 120));
  window.addEventListener('pageshow', fitTabletViewport);
})();
