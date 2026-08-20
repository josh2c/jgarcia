/* Board — an infinite isometric plane of cards.
 *
 * The plane is a CSS 3D transform, not WebGL: rotateX(60deg) rotateZ(-45deg)
 * with no `perspective`, which makes it true isometric. Cards lie on it, and a
 * pool of identical tiles is repositioned as you pan so the board never ends
 * while the asset cost stays fixed.
 *
 * The landing state is the same board seen flat, top-down. Enter tips the
 * plane into isometric — one page throughout, no navigation.
 */

import { ITEMS, COL_W, ROW_H, TILE_W, TILE_H, HOME_X, HOME_Y } from './boarddata.js';

/* Screen<->board mapping for `rotateX(60deg) rotateZ(-45deg)`:
 *   sx = (bx + by) * SX
 *   sy = (by - bx) * SY
 * SY is SX * cos(60deg) — the vertical squash that sells the projection. */
const SX = Math.SQRT1_2;
const SY = Math.SQRT1_2 * 0.5;

/* Inverse of the above, so a screen drag becomes a board delta. Without it,
 * dragging right slides the board off along a diagonal. */
function screenToBoard(sx, sy) {
    if (!ISO) return { x: sx, y: sy };
    const a = sx / SX;
    const b = sy / SY;
    return { x: (a - b) / 2, y: (a + b) / 2 };
}

let ISO = false;            // the desktop shows the board flat; entering tips it
let entered = false;


/* ------------------------------------------------------------- build DOM -- */

function isClickable(item) {
    if (item.type === 'piece') return false;      // the dice is scenery here
    return item.type === 'img' || item.type === 'note' ||
           (item.type === 'quote' && item.href);
}

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildItem(item, index) {
    const el = document.createElement('div');
    el.className = 'bi bi-' + item.type +
        (item.tone ? ' t-' + item.tone : '') +
        (item.face ? ' q-' + item.face : '');
    // Solved per card in boarddata.js, not chosen here.
    if (item.fs) el.style.setProperty('--q-size', item.fs + 'px');
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = item.w + 'px';
    el.style.height = item.h + 'px';
    // 600 clears the 100 the desktop scrim sits at, so the dice stays lit
    // while the rest of the board dims behind the furniture.
    el.style.zIndex = item.type === 'piece' ? '600' : String(10 + (index % 40));
    // Staggered by distance from the dice, so the board assembles outward from
    // the card you were already looking at.
    el.style.setProperty('--in-delay', item.stagger + 'ms');

    if (item.type === 'note') {
        el.innerHTML =
            '<span class="n-num">' + esc(item.num) + ' ' + esc(item.title.toUpperCase()) + '</span>' +
            '<span class="n-head">' + esc(item.head) + '</span>' +
            '<span class="n-body">' + esc(item.body) + '</span>';
    } else if (item.type === 'quote') {
        el.innerHTML =
            '<span class="q-text">' + esc(item.text) + '</span>' +
            '<span class="q-attr">' + esc(item.attr) + '</span>';
    } else if (item.type === 'img' || item.type === 'piece') {
        el.innerHTML = '<img src="' + item.src + '" alt="' + esc(item.alt) + '" loading="lazy">';
        if (item.type === 'piece') {
            el.insertAdjacentHTML('beforeend',
                '<span class="bi-piece-cue">Enter the board \u2192</span>');
        }
    } else if (item.type === 'swatch') {
        el.style.background = item.hex;
        el.innerHTML = '<span class="sw-hex">' + esc(item.hex) + '</span>';
    } else if (item.type === 'ph') {
        el.innerHTML =
            '<span class="ph-label">' + esc(item.label) + '</span>' +
            '<span class="ph-meta">' + item.w + '×' + item.h + '</span>';
    }

    if (isClickable(item)) {
        el.classList.add('is-clickable');
        el.dataset.item = String(index);
    }
    return el;
}

/* The grid is drawn, not tiled. Every column has its own width and every row
 * its own height, so a repeating background gradient cannot describe it — and
 * a gradient at a size that does not divide the tile is what made the lines
 * restart at every seam before. Cumulative offsets cannot drift. */
function buildGrid(tile) {
    let x = 0;
    for (const w of COL_W.slice(0, -1)) {
        x += w;
        const el = document.createElement('span');
        el.className = 'board-line board-line-v';
        el.style.left = x + 'px';
        tile.appendChild(el);
    }
    let y = 0;
    for (const h of ROW_H.slice(0, -1)) {
        y += h;
        const el = document.createElement('span');
        el.className = 'board-line board-line-h';
        el.style.top = y + 'px';
        tile.appendChild(el);
    }
}

function buildTile() {
    const tile = document.createElement('div');
    tile.className = 'board-tile';
    tile.style.width = TILE_W + 'px';
    tile.style.height = TILE_H + 'px';
    buildGrid(tile);
    ITEMS.forEach((item, i) => tile.appendChild(buildItem(item, i)));
    return tile;
}

/* -------------------------------------------------------------- tiling --- */

const viewport = document.getElementById('viewport');
const surface = document.getElementById('surface');

/* The camera rests on the dice, so the piece sits where the desktop hero
 * already was and entering does not move it. */
let camX = HOME_X;
let camY = HOME_Y;
let tiles = [];

/* A screen rectangle maps back to a diamond in board space, so the tilted
 * board needs a wider spread of tiles than a flat one to stay covered. */
function coverageHalfExtent() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!ISO && !coverageIso) return { x: vw / 2, y: vh / 2 };
    const half = (vw / SX + vh / SY) / 4;
    return { x: half, y: half };
}

let coverageIso = false;   // forced true while the plane tips into isometric

function ensurePool(n) {
    while (tiles.length < n) {
        const tile = buildTile();
        surface.appendChild(tile);
        tiles.push(tile);
    }
    while (tiles.length > n) surface.removeChild(tiles.pop());
}

function render() {
    const ext = coverageHalfExtent();
    const startI = Math.floor((camX - ext.x) / TILE_W);
    const endI = Math.floor((camX + ext.x) / TILE_W);
    const startJ = Math.floor((camY - ext.y) / TILE_H);
    const endJ = Math.floor((camY + ext.y) / TILE_H);
    const cols = endI - startI + 1;
    const rows = endJ - startJ + 1;

    ensurePool(cols * rows);

    // Board point (camX, camY) sits at the surface centre, which is also the
    // transform origin — so it stays put under the isometric rotation.
    const ox = window.innerWidth / 2;
    const oy = window.innerHeight / 2;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tile = tiles[r * cols + c];
            const x = (startI + c) * TILE_W - camX + ox;
            const y = (startJ + r) * TILE_H - camY + oy;
            tile.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        }
    }
}

/* ------------------------------------------------------- desktop <-> board -- */

/* The menubar shows which layer you are on. */
function markMenubar(which) {
    const d = document.getElementById('mb-desktop');
    const b = document.getElementById('mb-board');
    if (d) d.classList.toggle('is-current', which === 'desktop');
    if (b) b.classList.toggle('is-current', which === 'board');
}

/* Entering is a handoff, not a swap. The ground is the same colour on both
 * sides, so nothing about it changes; the desktop furniture clears, the plane
 * tips, and the dice — already standing at the camera's resting point — simply
 * stops being the hero and starts being a piece on the board. */
function enterBoard(instant) {
    if (entered) return;
    entered = true;

    document.body.classList.remove('is-virgin');
    document.body.classList.remove('is-desktop');
    document.body.classList.add('is-board');
    markMenubar('board');

    coverageIso = true;
    render();

    if (instant) {
        ISO = true;
        document.body.classList.add('is-iso');
        render();
        markView('iso');
        return;
    }

    document.body.classList.add('is-entering');
    // Next frame, so the plane has a start value to rotate from.
    requestAnimationFrame(() => {
        ISO = true;
        document.body.classList.add('is-iso');
        render();
        markView('iso');
    });
    setTimeout(() => document.body.classList.remove('is-entering'), 1050);
}

/* Calling the desktop back is not the reverse of entering. Nothing about the
 * view changes — same position, same projection — the furniture simply comes
 * back over wherever you happen to be looking, and the board goes inert
 * behind it. Iso/Flat stays the only thing that moves the plane. */
function leaveBoard() {
    if (!entered) return;
    entered = false;

    document.body.classList.remove('is-board');
    document.body.classList.add('is-desktop');
    markMenubar('desktop');
}

window.jgEnterBoard = () => enterBoard(false);
window.jgLeaveBoard = leaveBoard;

document.querySelectorAll('[data-enter-board]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); enterBoard(false); });
});
document.querySelectorAll('[data-leave-board]').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); leaveBoard(); });
});

/* ----------------------------------------------------------- view toggle -- */

function markView(mode) {
    document.querySelectorAll('.bv-btn').forEach((b) => {
        b.classList.toggle('is-current', b.dataset.view === mode);
    });
}

function setView(mode) {
    const next = mode === 'iso';
    if (entered && next !== ISO) {
        // Must outlive the 950ms plane tip in board.css.
        document.body.classList.add('is-entering');
        setTimeout(() => document.body.classList.remove('is-entering'), 1050);
    }
    ISO = next;
    coverageIso = ISO;
    document.body.classList.toggle('is-iso', ISO);
    render();
    markView(mode);
}

document.querySelectorAll('.bv-btn').forEach((b) => {
    b.addEventListener('click', () => { if (entered) setView(b.dataset.view); });
});

/* ----------------------------------------------------------- panning ----- */

let dragging = false;
let moved = 0;
let lastX = 0, lastY = 0;
let velX = 0, velZ = 0;
let inertiaId = null;
let pointerId = null;
let downTarget = null;

viewport.addEventListener('pointerdown', (e) => {
    if (!entered) return;                       // the intro is a fixed view
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    // Stops the browser starting a native image/text drag, which cancels the
    // pointer stream mid-gesture and makes the board feel stuck.
    e.preventDefault();
    dragging = true;
    moved = 0;
    downTarget = e.target;
    lastX = e.clientX;
    lastY = e.clientY;
    velX = velZ = 0;
    pointerId = e.pointerId;
    viewport.setPointerCapture(pointerId);
    viewport.classList.add('is-dragging');
    if (inertiaId) { cancelAnimationFrame(inertiaId); inertiaId = null; }
    hideHint();
});

viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);

    const d = screenToBoard(dx, dy);
    camX -= d.x;
    camY -= d.y;
    velX = d.x;
    velZ = d.y;
    render();
});

function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    if (pointerId !== null && viewport.hasPointerCapture(pointerId)) {
        viewport.releasePointerCapture(pointerId);
    }
    pointerId = null;
    if (e && e.type === 'pointerup') maybeOpen();
    if (Math.abs(velX) > 1 || Math.abs(velZ) > 1) startInertia();
}

viewport.addEventListener('pointerup', endDrag);
viewport.addEventListener('pointercancel', endDrag);

function startInertia() {
    const step = () => {
        velX *= 0.94;
        velZ *= 0.94;
        camX -= velX;
        camY -= velZ;
        render();
        if (Math.abs(velX) > 0.15 || Math.abs(velZ) > 0.15) {
            inertiaId = requestAnimationFrame(step);
        } else {
            inertiaId = null;
        }
    };
    inertiaId = requestAnimationFrame(step);
}

/* Opening runs off the pointerdown target rather than a click listener:
 * setPointerCapture retargets the synthesized click to the viewport, so
 * e.target.closest() in a click handler would never find the card. */
function maybeOpen() {
    if (moved > 6 || !downTarget) return;      // moved => it was a pan
    const hit = downTarget.closest('.bi.is-clickable');
    if (hit) openItem(ITEMS[Number(hit.dataset.item)]);
}

/* The dice is the door. It is the only live thing on a frozen board, and it
 * works wherever the dice happens to be — including after you have panned
 * away and called the desktop back. */
surface.addEventListener('click', (e) => {
    if (entered) return;
    if (e.target.closest('.bi-piece')) enterBoard(false);
});

viewport.addEventListener('wheel', (e) => {
    if (!entered) return;
    e.preventDefault();
    const d = screenToBoard(e.deltaX, e.deltaY);
    camX += d.x;
    camY += d.y;
    render();
    hideHint();
}, { passive: false });

// Native HTML drag-and-drop would otherwise steal the gesture off any image.
viewport.addEventListener('dragstart', (e) => e.preventDefault());

window.addEventListener('resize', render);

/* ---------------------------------------------------------------- hint --- */

const hintEl = document.getElementById('hint');
let hintHidden = false;
function hideHint() {
    if (hintHidden || !hintEl) return;
    hintHidden = true;
    hintEl.classList.add('is-hidden');
}
setTimeout(hideHint, 9000);

/* -------------------------------------------------------------- window --- */
/* Cards open in the shared window manager. Loaded before this module, so it
 * is available immediately. */

function openItem(item) {
    const W = window.jgWindows;
    if (!item || !W) return;

    if (item.type === 'img') {
        W.open({ id: 'img:' + item.src, title: item.title, width: 460, height: 420,
                 html: '<img src="' + item.src + '" alt="' + esc(item.alt) + '">' +
                       '<p class="bw-note">' + esc(item.body) + '</p>' });
        return;
    }

    if (item.type === 'note') {
        W.open({ id: 'note:' + item.num, title: item.num + ' ' + item.title, width: 480, height: 320,
                 html: '<p><strong>' + esc(item.head) + '</strong></p><p>' + esc(item.body) + '</p>' });
        return;
    }

    if (item.type === 'quote' && item.href) {
        // A quote is a doorway to the post it came from.
        if (window.jgReader) window.jgReader.openPost(item.href, item.attr);
    }
}

/* -------------------------------------------------------------------- go --- */

render();

/* The cards assemble outward from the dice on first paint and never again.
 * Held for one frame so they have a start value to animate from, then
 * released for the longest stagger plus the longest transition. */
document.body.classList.add('is-booting', 'is-virgin');
requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove('is-booting');
}));

// Links from elsewhere arrive as index.html#board and should land on the board
// rather than making you cross the desktop again.
if (location.hash.includes('board')) enterBoard(true);
