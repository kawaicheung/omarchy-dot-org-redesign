(function () {
  function isTypingTarget(el) {
    if (!el) return false;
    return ['input', 'textarea', 'button', 'a'].includes(el.tagName.toLowerCase());
  }

  function init() {
    if (window.matchMedia('(max-width: 999px)').matches) return;

    const container = document.querySelector('.window.left');
    const logo = document.querySelector('.logo');
    const hint = document.querySelector('.controls-hint');
    const desktop = document.querySelector('.desktop');
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

    const ua = navigator.userAgent || '';
    const downloadLabel = 'Omarchy ISO (5.6GB)';

    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'download-btn';
    downloadBtn.href = 'https://iso.omarchy.org/omarchy-4.0.1.iso';
    downloadBtn.textContent = downloadLabel;
    container.appendChild(downloadBtn);

    const downloadStatus = document.querySelector('.download-status');

    const DIGIT_GLYPHS = {
      '0': ['111', '1 1', '1 1', '1 1', '111'],
      '1': [' 1 ', '11 ', ' 1 ', ' 1 ', '111'],
      '2': ['111', '  1', '111', '1  ', '111'],
      '3': ['111', '  1', '111', '  1', '111'],
      '4': ['1 1', '1 1', '111', '  1', '  1'],
      '5': ['111', '1  ', '111', '  1', '111'],
      '6': ['111', '1  ', '111', '1 1', '111'],
      '7': ['111', '  1', '  1', '  1', '  1'],
      '8': ['111', '1 1', '111', '1 1', '111'],
      '9': ['111', '1 1', '111', '  1', '111'],
    };

    function buildPixelGrid(className, cols, rows, bitmap) {
      const grid = document.createElement('div');
      grid.className = className;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = document.createElement('span');
          px.className = 'px' + (bitmap[row][col] !== ' ' && bitmap[row][col] !== '0' ? ' on' : '');
          grid.appendChild(px);
        }
      }
      return grid;
    }

    const scoreEl = document.createElement('div');
    scoreEl.className = 'score';
    (desktop || container).appendChild(scoreEl);

    let score = 0;
    function renderScore(n) {
      scoreEl.replaceChildren();
      String(n).split('').forEach((d) => {
        scoreEl.appendChild(buildPixelGrid('digit', 3, 5, DIGIT_GLYPHS[d] || DIGIT_GLYPHS['0']));
      });
    }
    renderScore(0);

    function addScore(points) {
      score += points;
      renderScore(score);
    }

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

      downloadBtn.classList.add('exploding');
      downloadBtn.addEventListener('animationend', () => downloadBtn.remove(), { once: true });
    }

    downloadBtn.addEventListener('click', () => {
      if (downloadBtn.dataset.downloading === 'true') return;
      downloadBtn.dataset.downloading = 'true';
      if (downloadStatus) downloadStatus.classList.add('is-visible');
      document.body.classList.add('is-downloading');
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

    function overlapsLogo(x, y, w, h) {
      const rowStart = Math.floor((y - metrics.logoTop) / metrics.charH);
      const rowEnd = Math.floor((y + h - metrics.logoTop) / metrics.charH);
      const colStart = Math.floor((x - metrics.logoLeft) / metrics.charW);
      const colEnd = Math.floor((x + w - metrics.logoLeft) / metrics.charW);

      for (let row = Math.max(0, rowStart); row <= Math.min(rows - 1, rowEnd); row++) {
        for (let col = Math.max(0, colStart); col <= Math.min(cols - 1, colEnd); col++) {
          if (grid[row][col] !== ' ') return true;
        }
      }
      return false;
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
      if (gameOver) return;
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

    const ASTEROID_BITMAP = [
      '0110',
      '1111',
      '1101',
      '0110',
    ];

    const shipRadius = 10;
    const ASTEROID_TYPES = [
      { size: 'small', px: 11, value: 10, speed: 150 },
      { size: 'medium', px: 17, value: 20, speed: 105 },
      { size: 'large', px: 27, value: 50, speed: 70 },
    ];

    const asteroids = [];
    let gameOver = false;
    let lastAsteroidTime = 0;
    let nextAsteroidDelay = 900 + Math.random() * 900;

    function spawnAsteroid(now) {
      const type = ASTEROID_TYPES[Math.floor(Math.random() * ASTEROID_TYPES.length)];
      const el = buildPixelGrid('asteroid ' + type.size, 4, 4, ASTEROID_BITMAP);
      layer.appendChild(el);
      asteroids.push({
        el,
        x: type.px / 2 + Math.random() * Math.max(0, metrics.layerWidth - type.px),
        y: -type.px,
        radius: type.px / 2,
        value: type.value,
        speed: type.speed,
      });
      lastAsteroidTime = now;
      nextAsteroidDelay = 900 + Math.random() * 900;
    }

    let destroyed = false;
    let lastTime = null;
    function loop(ts) {
      if (destroyed) return;

      if (document.body.classList.contains('is-downloading')) {
        const movementPanel = document.querySelector('.right-panel.movement');
        if (!movementPanel || !movementPanel.classList.contains('is-active')) {
          destroyed = true;
          layer.remove();
          scoreEl.remove();
          return;
        }
      }

      if (lastTime === null) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;

      if (!gameOver) {
        if (moveLeft) shipX -= shipSpeed * dt;
        if (moveRight) shipX += shipSpeed * dt;
        updateShipPosition();
      }

      const collected = downloadBtn.dataset.downloading === 'true';

      if (collected && desktop) {
        const layerRect = layer.getBoundingClientRect();
        metrics.layerWidth = desktop.getBoundingClientRect().right - layerRect.left;
      }

      if (collected && !gameOver) {
        scoreEl.classList.add('is-visible');

        if (ts - lastAsteroidTime > nextAsteroidDelay) {
          spawnAsteroid(ts);
        }

        for (let a = asteroids.length - 1; a >= 0; a--) {
          const rock = asteroids[a];
          rock.y += rock.speed * dt;

          const dx = rock.x - shipX;
          const dy = rock.y - shipY();
          if (Math.sqrt(dx * dx + dy * dy) < rock.radius + shipRadius) {
            gameOver = true;
            ship.classList.add('is-hit');
            setTimeout(() => document.body.classList.add('is-game-over'), 900);
            break;
          }

          if (rock.y - rock.radius > metrics.layerHeight) {
            rock.el.remove();
            asteroids.splice(a, 1);
            continue;
          }

          rock.el.style.left = rock.x + 'px';
          rock.el.style.top = rock.y + 'px';
        }
      }

      if (!collected) {
        const nextX = btnX + btnVX * dt;
        if (nextX <= 0) {
          btnX = 0;
          btnVX = Math.abs(btnVX);
        } else if (nextX + btnW >= metrics.layerWidth) {
          btnX = metrics.layerWidth - btnW;
          btnVX = -Math.abs(btnVX);
        } else if (overlapsLogo(nextX, btnY, btnW, btnH)) {
          btnVX = -btnVX;
        } else {
          btnX = nextX;
        }

        const nextY = btnY + btnVY * dt;
        if (nextY <= 0) {
          btnY = 0;
          btnVY = Math.abs(btnVY);
        } else if (nextY + btnH >= metrics.btnFloorY) {
          btnY = metrics.btnFloorY - btnH;
          btnVY = -Math.abs(btnVY);
        } else if (overlapsLogo(btnX, nextY, btnW, btnH)) {
          btnVY = -btnVY;
        } else {
          btnY = nextY;
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

        let hitAsteroid = -1;
        for (let a = 0; a < asteroids.length; a++) {
          const rock = asteroids[a];
          const dx = rock.x - beam.x;
          const dy = rock.y - beam.y;
          if (Math.sqrt(dx * dx + dy * dy) < rock.radius + 3) {
            hitAsteroid = a;
            break;
          }
        }
        if (hitAsteroid !== -1) {
          addScore(asteroids[hitAsteroid].value);
          asteroids[hitAsteroid].el.remove();
          asteroids.splice(hitAsteroid, 1);
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
            if (destroyAt(row, col)) {
              dirty = true;
              beam.el.remove();
              beams.splice(i, 1);
              continue;
            }
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
      if (destroyed) return;
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
