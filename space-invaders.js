(function () {
  function isTypingTarget(el) {
    if (!el) return false;
    return ['input', 'textarea', 'button', 'a'].includes(el.tagName.toLowerCase());
  }

  function init() {
    const container = document.querySelector('.window--left');
    const logo = document.querySelector('.logo');
    if (!container || !logo) return;

    const layer = document.createElement('div');
    layer.className = 'invaders-layer';
    container.appendChild(layer);

    const ship = document.createElement('div');
    ship.className = 'invaders-ship';
    ship.innerHTML =
      '<svg viewBox="0 0 9 6" shape-rendering="crispEdges">' +
      '<rect x="4" y="0" width="1" height="1" fill="currentColor"/>' +
      '<rect x="3" y="1" width="3" height="2" fill="currentColor"/>' +
      '<rect x="0" y="3" width="9" height="3" fill="currentColor"/>' +
      '</svg>';
    layer.appendChild(ship);

    let grid = logo.textContent.split('\n').map((line) => line.split(''));
    const rows = grid.length;
    const cols = grid.reduce((max, line) => Math.max(max, line.length), 0);
    grid = grid.map((line) => {
      while (line.length < cols) line.push(' ');
      return line;
    });

    function renderLogo() {
      logo.textContent = grid.map((line) => line.join('')).join('\n');
    }

    function destroyAt(row, col) {
      if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
      if (grid[row][col] === ' ') return false;
      grid[row][col] = ' ';
      return true;
    }

    const metrics = {};
    function measure() {
      const layerRect = layer.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      metrics.charW = logoRect.width / cols;
      metrics.charH = logoRect.height / rows;
      metrics.logoLeft = logoRect.left - layerRect.left;
      metrics.logoTop = logoRect.top - layerRect.top;
      metrics.logoBottom = metrics.logoTop + logoRect.height;
      metrics.layerWidth = layerRect.width;
      metrics.layerHeight = layerRect.height;
    }
    measure();
    window.addEventListener('resize', measure);

    const shipY = () => metrics.layerHeight - 18;
    let shipX = 0;
    const shipSpeed = 280;
    let moveLeft = false;
    let moveRight = false;

    function updateShipPosition() {
      shipX = Math.max(0, Math.min(metrics.layerWidth, shipX));
      ship.style.left = shipX + 'px';
      ship.style.top = shipY() + 'px';
    }
    shipX = metrics.layerWidth / 2;
    updateShipPosition();

    const beams = [];
    const beamSpeed = 480;
    const shotCooldown = 220;
    let lastShotTime = 0;

    function fire(now) {
      if (now - lastShotTime < shotCooldown) return;
      if (beams.length >= 6) return;
      lastShotTime = now;

      const col = Math.round((shipX - metrics.logoLeft) / metrics.charW);
      const beamEl = document.createElement('div');
      beamEl.className = 'invaders-beam';
      layer.appendChild(beamEl);
      beams.push({
        el: beamEl,
        col: Math.max(0, Math.min(cols - 1, col)),
        y: shipY(),
      });
    }

    let lastTime = null;
    function loop(ts) {
      if (lastTime === null) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;

      if (moveLeft) shipX -= shipSpeed * dt;
      if (moveRight) shipX += shipSpeed * dt;
      updateShipPosition();

      let dirty = false;
      for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        beam.y -= beamSpeed * dt;

        if (beam.y <= -20) {
          beam.el.remove();
          beams.splice(i, 1);
          continue;
        }

        if (beam.y <= metrics.logoBottom) {
          const row = Math.floor((beam.y - metrics.logoTop) / metrics.charH);
          if (row >= 0 && row < rows) {
            if (destroyAt(row, beam.col)) dirty = true;
          }
        }

        beam.el.style.left = beam.col * metrics.charW + metrics.logoLeft + metrics.charW / 2 + 'px';
        beam.el.style.top = beam.y + 'px';
      }
      if (dirty) renderLogo();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.code === 'ArrowLeft') {
        moveLeft = true;
        e.preventDefault();
      } else if (e.code === 'ArrowRight') {
        moveRight = true;
        e.preventDefault();
      } else if (e.code === 'Space') {
        e.preventDefault();
        fire(performance.now());
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft') moveLeft = false;
      else if (e.code === 'ArrowRight') moveRight = false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
