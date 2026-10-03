// Termadoro's website. The Rust app (compiled to WebAssembly) draws the orb
// and its name onto the canvas; this file sizes the canvas to the window, runs
// the animation loop, and looks after the words below the name (how to
// install it), which the page sets itself in smaller type.
import init, { Game } from './pkg/termadoro_web.js';

const screen = document.getElementById('screen');
const canvas = document.getElementById('term');
const install = document.getElementById('install');
const command = document.getElementById('command');
const tabs = [...install.querySelectorAll('.tab')];
const copyButton = install.querySelector('.copy');
const copyLabel = copyButton.querySelector('span');
const soundButton = document.getElementById('sound');
const soundLabel = soundButton.querySelector('span');
const maker = document.querySelector('#by a');

const COMMANDS = [
  'brew install bobbydotdesign/tap/termadoro',
  'curl -fsSL https://github.com/bobbydotdesign/termadoro-releases/releases/latest/download/install.sh | sh',
];

let game = null;
let method = 0;

// A grid that fills the window, with cells about twice as tall as they are
// wide like a terminal's: roughly 100+ columns on a laptop, and never text
// smaller than 6×12 pixels on a phone.
function grid() {
  // A hidden page can measure as 0×0; fall back to the window, then a guess.
  const rect = screen.getBoundingClientRect();
  const width = rect.width || window.innerWidth || 800;
  const height = rect.height || window.innerHeight || 600;
  const size = Math.max(6, Math.min(14, Math.floor(Math.min(width / 100, height / 68))));
  const cols = Math.max(20, Math.floor(width / size));
  const rows = Math.max(10, Math.floor(height / (size * 2)));
  return { cols, rows, cellW: width / cols, cellH: height / rows, dpr: window.devicePixelRatio || 1 };
}

// Keep the orb clear of the words in the corners.
function place() {
  if (!game) return;
  const rect = install.getBoundingClientRect();
  game.reserve(Math.max(0, screen.getBoundingClientRect().bottom - rect.top) + 16);
}

function loop(now) {
  try {
    game.frame(now);
    place();
  } catch (err) {
    // Something broke inside the drawing: show the text version rather than
    // a frozen screen.
    console.error(err);
    fallback();
    return;
  }
  requestAnimationFrame(loop);
}

function fallback() {
  document.body.classList.add('fallback');
}

// Homebrew or the script.
function show(i) {
  method = i;
  tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(Number(tab.dataset.method) === i)));
  command.textContent = COMMANDS[i];
  place();
}

let copiedTimer = null;
async function copyCommand() {
  const text = COMMANDS[method];
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(area);
    area.select();
    try { document.execCommand('copy'); } catch {}
    area.remove();
  }
  copyButton.classList.add('done');
  copyLabel.textContent = 'copied';
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copyButton.classList.remove('done');
    copyLabel.textContent = 'copy';
  }, 2000);
}

tabs.forEach((tab) => tab.addEventListener('click', () => show(Number(tab.dataset.method))));
// Copying is a touch, too: Termadoro answers it.
copyButton.addEventListener('click', () => {
  copyCommand();
  if (game) touch();
});

// Termadoro looks towards the pointer; touched, it answers, and its music
// begins (a browser only lets sound start from a click or a key).
let overOrb = false;
canvas.addEventListener('pointermove', (e) => {
  if (!game) return;
  game.pointer(e.offsetX, e.offsetY);
  overOrb = game.over_orb(e.offsetX, e.offsetY);
});
canvas.addEventListener('pointerleave', () => {
  game?.pointer(-1, -1);
  overOrb = false;
});

// The pointer, as a mote of light: the dot is exact, the halo drifts after
// it and swells near anything that can be touched.
const mote = document.getElementById('mote');
const halo = document.getElementById('halo');
let aim = null;
let drift = null;
window.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  aim = { x: e.clientX, y: e.clientY };
  drift ??= { ...aim };
  mote.style.transform = `translate(${aim.x}px, ${aim.y}px)`;
  document.body.classList.add('moved');
  const near = overOrb || !!e.target.closest?.('button, a');
  halo.classList.toggle('near', near);
});
document.addEventListener('pointerleave', () => document.body.classList.remove('moved'));
function haloStep() {
  if (aim && drift) {
    drift.x += (aim.x - drift.x) * 0.14;
    drift.y += (aim.y - drift.y) * 0.14;
    halo.style.transform = `translate(${drift.x}px, ${drift.y}px)`;
  }
  requestAnimationFrame(haloStep);
}
requestAnimationFrame(haloStep);
canvas.addEventListener('click', (e) => {
  if (game?.over_orb(e.offsetX, e.offsetY)) touch();
});

function touch() {
  game.touch();
  showSound();
}

function showSound() {
  soundLabel.textContent = game.sound_on() ? 'silence' : 'sound';
}

function toggleSound() {
  if (!game) return;
  game.set_sound(!game.sound_on());
  showSound();
}

soundButton.addEventListener('click', toggleSound);

// The maker's name decodes under the pointer, as Termadoro's does.
const GLYPHS = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ#%+=/<>';
let decoding = null;
maker.addEventListener('pointerenter', () => {
  const word = maker.dataset.word || (maker.dataset.word = maker.textContent);
  const start = performance.now();
  cancelAnimationFrame(decoding);
  const step = (now) => {
    const settled = Math.floor((now - start) / 45);
    maker.textContent = [...word]
      .map((c, i) => (i < settled ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join('');
    if (settled < word.length) decoding = requestAnimationFrame(step);
  };
  decoding = requestAnimationFrame(step);
});

window.addEventListener('keydown', (e) => {
  // Leave browser shortcuts (reload, copy, dev tools…) alone.
  if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  // Tab moves between the buttons when one has focus; otherwise it switches
  // the install method, as in the terminal.
  const onButton = document.activeElement instanceof HTMLButtonElement;
  if (e.key === 'Tab' && !onButton) {
    e.preventDefault();
    show(1 - method);
  } else if (e.key === 'ArrowLeft') {
    show(0);
  } else if (e.key === 'ArrowRight') {
    show(1);
  } else if (e.key === 'c' || e.key === 'C') {
    copyCommand();
    if (game) touch();
  } else if ((e.key === 'b' || e.key === 'B') && game) {
    touch();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleSound();
  }
});

async function start() {
  try {
    await init();
    const g = grid();
    game = new Game(canvas, g.cols, g.rows, g.cellW, g.cellH, g.dpr);
  } catch (err) {
    console.error(err);
    fallback();
    return;
  }
  place();
  requestAnimationFrame(loop);

  // Canvas text doesn't make the browser fetch a web font, so ask for it,
  // then redraw with it (the words below the name use it too).
  const fonts = ['400', '700'].map((w) => document.fonts?.load(`${w} 16px "JetBrains Mono"`));
  Promise.allSettled(fonts).then(() => {
    game.invalidate();
    place();
  });

  let resizing;
  new ResizeObserver(() => {
    clearTimeout(resizing);
    resizing = setTimeout(() => {
      const g = grid();
      game.resize(g.cols, g.rows, g.cellW, g.cellH, g.dpr);
      place();
    }, 80);
  }).observe(screen);
}

start();
