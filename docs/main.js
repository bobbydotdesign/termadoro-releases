// Termadoro's website. The Rust app (compiled to WebAssembly) draws every
// cell; this file sizes the canvas to the window, runs the animation loop, and
// passes the install box's keys, clicks and copy requests through.
import init, { Game } from './pkg/termadoro_web.js';

const screen = document.getElementById('screen');
const canvas = document.getElementById('term');

let game = null;

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

function loop(now) {
  try {
    game.frame(now);
  } catch (err) {
    // Something broke inside the game: show the text version rather than a
    // frozen screen.
    console.error(err);
    fallback();
    return;
  }
  requestAnimationFrame(loop);
}

function fallback() {
  document.body.classList.add('fallback');
}

// Hand off anything the app asked for: text to copy or a page to open.
function errands() {
  const text = game.take_copy();
  if (text) copy(text);
  const link = game.take_link();
  if (link) window.open(link, '_blank', 'noopener');
}

async function copy(text) {
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
    canvas.focus({ preventScroll: true });
  }
}

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
  canvas.focus({ preventScroll: true });
  requestAnimationFrame(loop);

  // Canvas text doesn't make the browser fetch a web font, so ask for it,
  // then redraw with it.
  const fonts = ['400', '700', 'italic 400'].map((w) => document.fonts?.load(`${w} 16px "JetBrains Mono"`));
  Promise.allSettled(fonts).then(() => game.invalidate());

  let resizing;
  new ResizeObserver(() => {
    clearTimeout(resizing);
    resizing = setTimeout(() => {
      const g = grid();
      game.resize(g.cols, g.rows, g.cellW, g.cellH, g.dpr);
    }, 80);
  }).observe(screen);
}

window.addEventListener('keydown', (e) => {
  // Leave browser shortcuts (reload, copy, dev tools…) alone.
  if (!game || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
  if (game.key(e.key, e.shiftKey)) {
    e.preventDefault();
    errands();
  }
});

canvas.addEventListener('click', (e) => {
  if (!game) return;
  game.click(e.offsetX, e.offsetY);
  errands();
});

canvas.addEventListener('pointermove', (e) => {
  if (game) canvas.style.cursor = game.clickable(e.offsetX, e.offsetY) ? 'pointer' : 'default';
});

start();
