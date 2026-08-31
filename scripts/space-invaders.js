(function () {
  function isTypingTarget(el) {
    if (!el) return false;
    return ['input', 'textarea', 'button', 'a'].includes(el.tagName.toLowerCase());
  }

  function init() {
    const container = document.querySelector('.window--left');
    const logo = document.querySelector('.logo');
    const hint = document.querySelector('.controls-hint');
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

    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'download-btn';
    downloadBtn.href = 'https://iso.omarchy.org/omarchy-4.0.1.iso';
    downloadBtn.textContent = 'Download ISO (5.6GB)';
    container.appendChild(downloadBtn);

    const downloadStatus = document.querySelector('.download-status');

    function explodeDownloadButton() {
      const btnRect = downloadBtn.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const cx = btnRect.left - layerRect.left + btnRect.width / 2;
      const cy = btnRect.top - layerRect.top + btnRect.height / 2;

      const shardCount = 10;
      for (let i = 0; i < shardCount; i++) {
        const shard = document.createElement('div');
        shard.className = 'explosion-shard';
        const angle = (Math.PI * 2 * i) / shardCount + Math.random() * 0.6;
        const dist = 24 + Math.random() * 28;
        shard.style.left = cx + 'px';
        shard.style.top = cy + 'px';
        shard.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
        shard.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
        layer.appendChild(shard);
        shard.addEventListener('animationend', () => shard.remove(), { once: true });
      }

      downloadBtn.classList.add('download-btn--exploding');
      downloadBtn.addEventListener('animationend', () => downloadBtn.remove(), { once: true });
    }

    downloadBtn.addEventListener('click', () => {
      if (downloadBtn.dataset.downloading === 'true') return;
      downloadBtn.dataset.downloading = 'true';
      if (downloadStatus) downloadStatus.classList.add('is-visible');
      explodeDownloadButton();
    });

    const downloadCta = document.querySelector('[data-download-cta]');
    if (downloadCta) {
      downloadCta.addEventListener('click', (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        downloadBtn.click();
      });
    }

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
      metrics.floorY = hint
        ? hint.getBoundingClientRect().top - layerRect.top - 6
        : metrics.layerHeight;
      metrics.btnFloorY = metrics.floorY / 2;
    }
    measure();

    let btnW = 0;
    let btnH = 0;
    function measureBtn() {
      const rect = downloadBtn.getBoundingClientRect();
      btnW = rect.width;
      btnH = rect.height;
    }
    measureBtn();

    let btnX = Math.random() * Math.max(0, metrics.layerWidth - btnW);
    let btnY = 0;
    let btnVX = 90;
    let btnVY = 65;

    function positionBtn() {
      downloadBtn.style.left = btnX + 'px';
      downloadBtn.style.top = btnY + 'px';
    }
    positionBtn();

    window.addEventListener('resize', () => {
      measure();
      measureBtn();
      btnX = Math.min(btnX, Math.max(0, metrics.layerWidth - btnW));
      btnY = Math.min(btnY, Math.max(0, metrics.btnFloorY - btnH));
    });

    container.addEventListener('animationend', (e) => {
      if (e.target !== container) return;
      measure();
      measureBtn();
    }, { once: true });

    const shipY = () => metrics.floorY - 8;
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

      const beamEl = document.createElement('div');
      beamEl.className = 'invaders-beam';
      layer.appendChild(beamEl);
      beams.push({
        el: beamEl,
        x: shipX,
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

      const collected = downloadBtn.dataset.downloading === 'true';
      if (!collected) {
        btnX += btnVX * dt;
        btnY += btnVY * dt;
        if (btnX <= 0) {
          btnX = 0;
          btnVX = Math.abs(btnVX);
        } else if (btnX + btnW >= metrics.layerWidth) {
          btnX = metrics.layerWidth - btnW;
          btnVX = -Math.abs(btnVX);
        }
        if (btnY <= 0) {
          btnY = 0;
          btnVY = Math.abs(btnVY);
        } else if (btnY + btnH >= metrics.btnFloorY) {
          btnY = metrics.btnFloorY - btnH;
          btnVY = -Math.abs(btnVY);
        }
        positionBtn();
      }

      let dirty = false;
      for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        beam.y -= beamSpeed * dt;

        if (!collected && beam.x >= btnX && beam.x <= btnX + btnW && beam.y >= btnY && beam.y <= btnY + btnH) {
          downloadBtn.click();
          beam.el.remove();
          beams.splice(i, 1);
          continue;
        }

        if (beam.y <= -20) {
          beam.el.remove();
          beams.splice(i, 1);
          continue;
        }

        if (beam.y <= metrics.logoBottom) {
          const row = Math.floor((beam.y - metrics.logoTop) / metrics.charH);
          const col = Math.floor((beam.x - metrics.logoLeft) / metrics.charW);
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            if (destroyAt(row, col)) dirty = true;
          }
        }

        beam.el.style.left = beam.x + 'px';
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
