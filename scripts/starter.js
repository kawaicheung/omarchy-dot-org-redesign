(function () {
  var backgrounds = [
    '0-winding-road.webp',
    '1-quattro.webp',
    '2-swirl-buck.webp',
    '3-sunset-lake.webp'
  ];
  var pick = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  var url = new URL('images/backgrounds/' + pick, document.baseURI).href;
  document.documentElement.style.setProperty('--wallpaper', 'url("' + url + '")');
})();

function initStarter() {
  const taglines = [
    'The OS for people that like computers.',
    'The NeeDoh of operating systems.',
    "It's pronounced OH-MA-CHEE mmmmk?",
    'Linux for the semi-dorks.',
    "Tired of the two-OS system? It's time."
  ];
  document.getElementById('tagline').innerHTML = taglines[Math.floor(Math.random() * taglines.length)];

  const clock = document.getElementById('clock');
  function tick() {
    const now = new Date();
    const day = now.toLocaleDateString(undefined, { weekday: 'long' });
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    clock.textContent = `${day} ${time}`;
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  const typed = document.getElementById('cli-typed');
  typed.style.setProperty('--char-count', typed.textContent.length);

  function showRightPanel(id) {
    const current = document.querySelector('.right-panel.is-active');
    const next = document.querySelector(`.right-panel[data-panel="${id}"]`);
    if (!next || next === current) return;

    document.querySelectorAll('[data-panel-target]').forEach((trigger) => {
      trigger.classList.toggle('is-selected', trigger.dataset.panelTarget === id);
    });

    const launcher = document.querySelector('.launcher');
    if (launcher) launcher.classList.toggle('is-shifted', id === 'youtube');

    function enterNext() {
      next.classList.add('is-active', 'is-entering');
      next.addEventListener('animationend', function onEnter() {
        next.removeEventListener('animationend', onEnter);
        next.classList.remove('is-entering');
      }, { once: true });
    }

    if (!current) {
      enterNext();
      return;
    }

    current.classList.remove('is-active');
    current.classList.add('is-exiting');
    current.addEventListener('animationend', function onExit() {
      current.removeEventListener('animationend', onExit);
      current.classList.remove('is-exiting');
      enterNext();
    }, { once: true });
  }
  document.querySelectorAll('[data-panel-target]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      showRightPanel(trigger.dataset.panelTarget);
    });
  });

  const launcherItems = Array.from(document.querySelectorAll('.launcher__item'));
  let menuIndex = Math.max(0, launcherItems.findIndex((item) => item.classList.contains('is-selected')));

  function focusMenuItem(index) {
    menuIndex = (index + launcherItems.length) % launcherItems.length;
    launcherItems.forEach((item, i) => {
      item.classList.toggle('is-focused', i === menuIndex);
    });
  }
  focusMenuItem(menuIndex);

  launcherItems.forEach((item, i) => {
    item.addEventListener('click', () => focusMenuItem(i));
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      focusMenuItem(menuIndex + 1);
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      focusMenuItem(menuIndex - 1);
    } else if (e.code === 'Enter') {
      e.preventDefault();
      launcherItems[menuIndex].click();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStarter);
} else {
  initStarter();
}
