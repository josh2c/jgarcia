/* Desktop — the landing page behaves like an OS desktop.
 *
 * Folders, files and dock tools are all data-driven below. Opening any of them
 * shows a window; games are mounted from the shared games.js.
 */

/* ---------------------------------------------------------------- data --- */

const FOLDERS = [
    {
        name: 'Products',
        color: '#e8a33d',
        icon: "<path d='M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z'/><path d='M3 8.5 12 13l9-4.5M12 13v7'/>",
        title: 'Products',
        body: 'Things I build and run myself.',
        links: [
            { label: 'Trezure — football-first fantasy', href: 'https://playtrezure.com', meta: 'Live' },
            { label: 'Trezure pitch deck', href: 'pitch.html', meta: 'PDF' },
            { label: 'Busy Cab — browser arcade taxi game', href: 'https://busycabgame.com', meta: 'Live' },
            { label: 'Bemore Labz — product & engineering lab', href: 'https://bemorelabz.com', meta: 'Live' }
        ]
    },
    {
        name: 'Client Work',
        color: '#5fbdb8',
        icon: "<rect x='3' y='7' width='18' height='13' rx='2'/><path d='M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18'/>",
        title: 'Client Work',
        body: 'Sites I have designed and built for other people.',
        links: [
            { label: 'The Recovery Lab Society', href: 'https://github.com/josh2c/recovery-lab-society', meta: 'Catalog' },
            { label: 'Snow Motorsports', href: 'https://github.com/josh2c/shnowmotorsports-website', meta: 'Next.js' },
            { label: 'HotStart VC', href: 'https://github.com/josh2c/hotstartvc-website', meta: 'Fund site' },
            { label: 'AI Brokerage Pitch', href: 'https://github.com/josh2c/ai-brokerage-pitch', meta: 'Deck' }
        ]
    },
    {
        name: 'Skills',
        color: '#8cbf6e',
        icon: "<path d='M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16'/>",
        title: 'Skills',
        body: 'Agent skills I have written, installable as a Claude Code plugin.',
        skills: true,
        links: [{ label: 'github.com/josh2c/skills', href: 'https://github.com/josh2c/skills', meta: 'Repo' }]
    },
    {
        name: 'Thoughts',
        color: '#a98ed2',
        icon: "<path d='M4 5h16M4 10h16M4 15h11M4 20h7'/>",
        title: 'Thoughts',
        body: 'Twenty-two posts on innovation, leadership, productivity and sport.',
        reader: true,
        count: '22 posts'
    },
    {
        name: 'Games',
        color: '#d97ba0',
        icon: "<rect x='2' y='7' width='20' height='11' rx='4'/><path d='M7 11v3M5.5 12.5h3'/><circle cx='16' cy='12' r='1'/><circle cx='18.5' cy='14.5' r='1'/>",
        title: 'Games',
        body: 'Six minigames from Mind Override, a cognitive-training app I built in Flutter, rebuilt here in plain JavaScript — same rules and scoring, without the XP ladder. Plus a sketchpad and a game of Pong.',
        games: [
            { label: 'Light Squares', fn: 'lightSquares', meta: 'Visual memory' },
            { label: 'Pattern Spot', fn: 'patternSpot', meta: 'Perception' },
            { label: 'Quantum Count', fn: 'quantumCount', meta: 'Estimation' },
            { label: 'Word Flash', fn: 'wordFlash', meta: 'Verbal memory' },
            { label: 'Memory Match', fn: 'memoryMatch', meta: 'Recall' },
            { label: 'Transform Puzzle', fn: 'transformPuzzle', meta: 'Logic' },
            { label: 'Paint', fn: 'mountPaint', meta: 'Sketchpad', width: 560, height: 440 },
            { label: 'Pong', fn: 'mountPong', meta: 'One paddle', width: 560, height: 420 }
        ]
    },
    {
        name: 'Elsewhere',
        color: '#cf8b5e',
        icon: "<path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'/><path d='M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18'/>",
        title: 'Elsewhere',
        body: 'Where else to find me.',
        links: [{ label: 'Twitter / X', href: 'https://x.com/0talentt', meta: '@0talentt' }]
    }
];

/* Real files from the Trezure asset set, sitting on the desktop. */
/* Stroked glyphs, matching the folder tiles — emoji rendered as a second
   visual language sitting next to them. */
/* ----------------------------------------------------------- rendering --- */

function iconButton(id, label, className, inner, count) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dt-icon dt-drag ' + className;
    el.dataset.id = id;
    // Name and count share one chip. They sit directly on the board now, and
    // white type on a cream card is 2.0:1 — the chip is what makes them read.
    el.innerHTML = inner +
        '<span class="dt-icon-cap">' +
            '<span class="dt-icon-label">' + label + '</span>' +
            (count ? '<span class="dt-icon-count">' + count + '</span>' : '') +
        '</span>';
    return el;
}

/* What the folder actually holds, shown under the name. */
function countFor(f) {
    if (f.count) return f.count;
    if (f.skills) return 'loading…';
    if (f.games) return f.games.length + ' games';
    const n = (f.links || []).length;
    return n ? n + (n === 1 ? ' item' : ' items') : '';
}

const iconsEl = document.getElementById('icons');

/* Each folder is one colour; the back, front and gradient shades come off it
 * by shifting HSL lightness, so the data carries a hex and nothing else.
 *
 * The five were checked against both things they have to survive: the grey
 * ground they stand on (3.7:1 at worst) and the glyph printed on them (3.0:1
 * at worst, dark ink on all five). They are also at least 91 apart in RGB, so
 * no two read as the same folder at a glance. */
function toHsl(hex) {
    const r = parseInt(hex.substr(1, 2), 16) / 255;
    const g = parseInt(hex.substr(3, 2), 16) / 255;
    const b = parseInt(hex.substr(5, 2), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = 60 * (mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4));
    const l = (mx + mn) / 2;
    return [h, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
}

function shade(hex, delta) {
    const [h, s, l0] = toHsl(hex);
    const l = Math.max(0, Math.min(1, l0 + delta));
    const a = s * Math.min(l, 1 - l);
    const ch = (n) => {
        const k = (n + h / 30) % 12;
        const v = Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
        return v.toString(16).padStart(2, '0');
    };
    return '#' + ch(0) + ch(8) + ch(4);
}

function paintFolder(el, hex) {
    if (!hex) return;
    el.style.setProperty('--fold-back', shade(hex, -0.08));
    el.style.setProperty('--fold-front', shade(hex, 0.05));
    el.style.setProperty('--fold-front-2', shade(hex, -0.03));
}

function folderMarkup(f) {
    return '<span class="dt-folder" aria-hidden="true">' +
             '<span class="f-back"></span>' +
             '<span class="f-card"></span><span class="f-card"></span><span class="f-card"></span>' +
             '<span class="f-front"><svg viewBox="0 0 24 24">' + (f.icon || '') + '</svg></span>' +
           '</span>';
}

FOLDERS.forEach((f, i) => {
    const el = iconButton('folder:' + f.name, f.name, 'dt-folder-icon', folderMarkup(f), countFor(f));
    paintFolder(el, f.color);
    el.addEventListener('click', () => openFolder(i));
    iconsEl.appendChild(el);
});

const trashEl = iconButton('trash', 'Trash', 'dt-trash-icon-wrap',
    '<span class="dt-trash-icon" aria-hidden="true"></span>', 'empty');
trashEl.addEventListener('click', emptyTrash);
iconsEl.appendChild(trashEl);

/* ------------------------------------------------------------- placement --
 * Icons are placed absolutely and dragged freely, positions kept in local
 * storage. Below the breakpoint they fall back to normal flow — dragging on a
 * phone fights scrolling, and there is no room to arrange anything anyway. */

const LAYOUT_KEY = 'jg-desktop-layout';
const TRASH_KEY = 'jg-desktop-trash';
/* Declared up here on purpose: the bin is restored during setup, well above
 * where the rest of its code lives, and a `let` assigned before its own
 * declaration is a ReferenceError rather than a warning. */
let binned = [];
const surfaceEl = document.querySelector('.dt-surface');

/* Everything you can pick up, wherever it lives in the markup. The widgets sit
 * in their own column rather than in the icon layer, so this cannot just walk
 * one parent's children. */
const dragEls = () => [...surfaceEl.querySelectorAll('.dt-drag')];
const byId = (id) => surfaceEl.querySelector('[data-id="' + CSS.escape(id) + '"]');
const CELL = 116;
const FREE = () => window.innerWidth > 1100;

function defaultLayout() {
    const out = {};
    const originX = 26, originY = 84;
    const cols = 3;
    FOLDERS.forEach((f, i) => {
        out['folder:' + f.name] = {
            x: originX + (i % cols) * CELL,
            y: originY + Math.floor(i / cols) * (CELL + 16)
        };
    });
    out.trash = { x: window.innerWidth - CELL - 40, y: window.innerHeight - CELL - 40 };
    // Where the widgets used to sit by CSS, now as real layout entries.
    const wide = Math.min(368, window.innerWidth * 0.34);
    const rx = Math.round(window.innerWidth - wide - Math.min(40, window.innerWidth * 0.03));
    out['widget:clock'] = { x: rx, y: 76 };
    out['widget:readme'] = { x: rx, y: 274 };
    return out;
}

function loadLayout() {
    try {
        const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
        if (saved && typeof saved === 'object') {
            // Only keys that still name a real icon. A saved layout outlives
            // the icons it was saved for, and merging it wholesale keeps
            // positions for things that no longer exist.
            const out = defaultLayout();
            for (const id of Object.keys(out)) if (saved[id]) out[id] = saved[id];
            return out;
        }
    } catch (err) { /* corrupt entry — fall back to the default arrangement */ }
    return defaultLayout();
}

let layout = loadLayout();

function saveLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (err) { /* full */ }
}

/* Keeps an icon on screen and clear of the menubar. */
function clampPos(p, el) {
    const w = el.offsetWidth || CELL, h = el.offsetHeight || CELL;
    return {
        x: Math.max(8, Math.min(window.innerWidth - w - 8, p.x)),
        y: Math.max(64, Math.min(window.innerHeight - h - 8, p.y))
    };
}

function applyLayout() {
    const free = FREE();
    iconsEl.classList.toggle('is-free', free);
    surfaceEl.classList.toggle('is-free', free);
    dragEls().forEach((el) => {
        if (!free) { el.style.left = el.style.top = ''; return; }
        // A binned item has no size to clamp against, so leave its last
        // position alone until it comes back out.
        if (el.hidden) return;
        const p = clampPos(layout[el.dataset.id] || { x: 26, y: 84 }, el);
        layout[el.dataset.id] = p;
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
    });
}

applyLayout();
window.addEventListener('resize', applyLayout);

/* Restore the bin before anything is placed: a binned item is hidden, and a
 * hidden item has no size to clamp a position against. */
binned = loadTrash();
binned.forEach((id) => { const el = byId(id); if (el) el.hidden = true; });
markTrash();
applyLayout();

/* Drag. A click still opens the icon as long as it barely moved — the same
 * threshold the board uses to tell a tap from a pan. */
let drag = null;

surfaceEl.addEventListener('pointerdown', (e) => {
    if (!FREE() || e.button !== 0) return;
    const el = e.target.closest('.dt-drag');
    if (!el) return;
    // Some things drag by a handle rather than anywhere on them — the readme is
    // a text field, and dragging it would mean never being able to select in it.
    const handle = el.dataset.handle;
    if (handle && !e.target.closest(handle)) return;
    const p = layout[el.dataset.id] || { x: 26, y: 84 };
    drag = { el, id: el.dataset.id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: 0 };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
});

surfaceEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    drag.moved = Math.abs(dx) + Math.abs(dy);
    if (drag.moved < 4) return;
    const p = clampPos({ x: drag.ox + dx, y: drag.oy + dy }, drag.el);
    drag.el.style.left = p.x + 'px';
    drag.el.style.top = p.y + 'px';
    layout[drag.id] = p;
    trashEl.classList.toggle('is-over', drag.id !== 'trash' && overTrash(e.clientX, e.clientY));
});

function endDrag(e) {
    if (!drag) return;
    drag.el.classList.remove('is-dragging');
    trashEl.classList.remove('is-over');
    if (drag.moved >= 4) {
        const el = drag.el;
        // Anything past the threshold was a move, so suppress the click that
        // follows or every drop would also open the folder.
        el.addEventListener('click', (ev) => ev.stopImmediatePropagation(), { capture: true, once: true });
        if (e && drag.id !== 'trash' && overTrash(e.clientX, e.clientY)) throwAway(drag.id);
        saveLayout();
    }
    drag = null;
}

surfaceEl.addEventListener('pointerup', endDrag);
surfaceEl.addEventListener('pointercancel', endDrag);

/* ---------------------------------------------------------------- bin --- */
/* Drop anything on the trash and it goes in. Click the trash and it gives
 * everything back, fanned out around itself rather than dumped in a pile. */

function loadTrash() {
    try {
        const raw = JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
        return Array.isArray(raw) ? raw.filter((id) => id !== 'trash' && byId(id)) : [];
    } catch (err) { return []; }
}
const saveTrash = () => {
    try { localStorage.setItem(TRASH_KEY, JSON.stringify(binned)); } catch (err) { /* full */ }
};

function overTrash(x, y) {
    const r = trashEl.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function markTrash() {
    trashEl.classList.toggle('is-full', binned.length > 0);
    const count = trashEl.querySelector('.dt-icon-count');
    if (count) {
        count.textContent = binned.length
            ? binned.length + (binned.length === 1 ? ' item' : ' items')
            : 'empty';
    }
}

function throwAway(id) {
    if (id === 'trash' || binned.includes(id)) return;
    const el = byId(id);
    if (!el) return;
    binned.push(id);
    el.hidden = true;
    saveTrash();
    markTrash();
}

function emptyTrash() {
    if (!binned.length) {
        if (window.jgWindows) {
            window.jgWindows.open({ id: 'trash', title: 'Trash', width: 380, height: 200,
                html: '<p>Empty.</p><p class="bw-note">Drag anything on the desktop onto it, ' +
                      'then click it again to get it back.</p>' });
        }
        return;
    }
    const r = trashEl.getBoundingClientRect();
    /* Spread away from the trash toward the middle of the screen, rather than
     * along a fixed up-and-left arc. The trash starts bottom-right but it is
     * draggable like everything else, and from a top-left corner that arc puts
     * every restored item off-screen, where clamping stacks them all in one
     * spot. */
    const dx = r.left < window.innerWidth / 2 ? 1 : -1;
    const dy = r.top < window.innerHeight / 2 ? 1 : -1;
    const STEP = 132;
    const placed = [];
    binned.forEach((id, i) => {
        const el = byId(id);
        if (!el) return;
        el.hidden = false;
        let p = clampPos({
            x: Math.round(r.left + dx * STEP * (1 + (i % 3))),
            y: Math.round(r.top + dy * STEP * (1 + Math.floor(i / 3)))
        }, el);
        // Clamping can land two items on the same pixel; step along until free.
        for (let guard = 0; guard < 40 && placed.some((q) => Math.abs(q.x - p.x) < 40 && Math.abs(q.y - p.y) < 40); guard++) {
            p = clampPos({ x: p.x + STEP, y: p.y }, el);
            if (p.x >= window.innerWidth - el.offsetWidth - 8) p = clampPos({ x: 26, y: p.y + STEP }, el);
        }
        placed.push(p);
        layout[id] = p;
    });
    binned = [];
    saveTrash();
    markTrash();
    saveLayout();
    applyLayout();
}

/* Put everything back where it started. No longer in the menubar — a
 * maintenance action does not belong next to Desktop and Board — but kept
 * reachable from the console, since it is the only way out of an arrangement
 * you regret short of clearing site data. */
window.jgTidyDesktop = function () {
    binned.forEach((id) => { const el = byId(id); if (el) el.hidden = false; });
    binned = [];
    saveTrash();
    markTrash();
    layout = defaultLayout();
    saveLayout();
    applyLayout();
};

/* The skills list is read from the repo rather than hardcoded, so adding a
 * skill on GitHub adds it here. Cached for a day; falls back to the repo link
 * if the unauthenticated API is rate-limited. */
const SKILLS_CACHE = 'jg-skills';
const SKILLS_TTL = 864e5;

/* The Skills tile cannot know its count until GitHub answers. */
function showSkillCount(n) {
    const tile = [...document.querySelectorAll('.dt-folder-icon')]
        .find((el) => el.querySelector('.dt-icon-label').textContent === 'Skills');
    const slot = tile && tile.querySelector('.dt-icon-count');
    if (slot) slot.textContent = n + (n === 1 ? ' skill' : ' skills');
}

function loadSkills(host) {
    // host may be null: the count is wanted on load, the list only when the
    // folder is opened. The guard belongs on the render, not the fetch.
    const render = (names) => {
        if (!host || !names.length) return;
        host.innerHTML = '<ul class="dt-links">' + names.map((n) =>
            '<li><a href="https://github.com/josh2c/skills/tree/main/skills/' + n + '"' +
            ' target="_blank" rel="noopener noreferrer"><span>' + n + ' \u2192</span>' +
            '<span class="dt-link-meta">skill</span></a></li>').join('') + '</ul>';
    };
    try {
        const hit = JSON.parse(localStorage.getItem(SKILLS_CACHE) || 'null');
        if (hit && Date.now() - hit.at < SKILLS_TTL) { render(hit.names); showSkillCount(hit.names.length); return; }
    } catch (err) { /* ignore a bad cache */ }

    fetch('https://api.github.com/repos/josh2c/skills/contents/skills')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (!Array.isArray(d)) return;
            const names = d.filter((e) => e.type === 'dir').map((e) => e.name);
            try { localStorage.setItem(SKILLS_CACHE, JSON.stringify({ at: Date.now(), names })); } catch (err) { /* storage full */ }
            render(names);
            showSkillCount(names.length);
        })
        .catch(() => { /* offline or rate-limited — the repo link still works */ });
}

/* -------------------------------------------------------------- window --- */
/* Folders open in the shared window manager, several at a time. */

function openFolder(i) {
    const f = FOLDERS[i];
    const W = window.jgWindows;
    if (!W) return;

    // Thoughts is the blog itself, read in place.
    if (f.reader) { if (window.jgReader) window.jgReader.openBlog(); return; }

    const links = (f.links || []).map((l) => {
        const ext = /^https?:/.test(l.href);
        return '<li><a href="' + l.href + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span>' + l.label + (ext ? ' \u2192' : '') + '</span>' +
            '<span class="dt-link-meta">' + l.meta + '</span></a></li>';
    }).join('');

    // A games folder lists launchers, not links: each opens the game in its own
    // window, so the folder can stay open while you pick another.
    const games = (f.games || []).map((g, n) =>
        '<li><button type="button" data-game="' + n + '">' +
        '<span>' + g.label + '</span>' +
        '<span class="dt-link-meta">' + g.meta + '</span></button></li>').join('');

    W.open({
        id: 'folder:' + f.name,
        title: f.title,
        width: 560,
        height: 400,
        mount: (body) => {
            body.innerHTML = '<p>' + f.body + '</p><ul class="dt-links">' + links + games + '</ul>' +
                (f.skills ? '<div id="skills-list"></div>' : '');
            if (f.skills) loadSkills(body.querySelector('#skills-list'));
            body.querySelectorAll('[data-game]').forEach((b) =>
                b.addEventListener('click', () => launchGame(f.games[Number(b.dataset.game)])));
        }
    });
}

/* Mind Override. The module fills the window body and hands back a cleanup,
 * which the window manager runs on close — these carry timers and an animation
 * loop, so a closed window still running would be a real leak. */
/* Two sources: the Mind Override ports live on their own namespace, Paint and
 * Pong are plain globals from games.js. Looked up at click time rather than at
 * load, since script order is not something a folder entry should have to know
 * about. */
function launchGame(g) {
    const W = window.jgWindows;
    const mount = (window.jgMindOverride && window.jgMindOverride[g.fn]) || window[g.fn];
    if (!W || typeof mount !== 'function') return;
    W.open({
        id: 'game:' + g.fn,
        title: g.label,
        width: g.width || 660,
        height: g.height || 620,
        mount: (body) => mount(body)
    });
}

/* Paintball lives in the menubar because it is the one control that has to
 * work in both layers — the dock it used to sit in fades out with the rest of
 * the furniture the moment you enter the board. */
const mbPaint = document.getElementById('mb-paintball');
if (mbPaint) {
    mbPaint.addEventListener('click', () => window.jgPaintball && window.jgPaintball.toggle());
    const sync = () => mbPaint.setAttribute('aria-pressed',
        String(document.body.classList.contains('is-armed')));
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/* Menubar entries that need script. */
/* --------------------------------------------------------------- clock --- */

/* ------------------------------------------------------------- readme --- */
/* The pad is a real editor, so it behaves like one: the filename picks up a
 * leading asterisk the moment you change anything, and the status line tracks
 * the caret. Edits are not stored — reload and it is the readme again. */

const padText = document.getElementById('pad-text');
const padPos = document.getElementById('pad-pos');
const padDirty = document.getElementById('pad-dirty');

if (padText) {
    const pristine = padText.value;

    const caret = () => {
        const upto = padText.value.slice(0, padText.selectionStart).split('\n');
        padPos.textContent = 'Ln ' + upto.length + ', Col ' + (upto[upto.length - 1].length + 1);
    };

    ['input', 'click', 'keyup', 'select', 'focus'].forEach((e) => padText.addEventListener(e, caret));
    padText.addEventListener('input', () => {
        padDirty.textContent = padText.value === pristine ? '' : '*';
    });
    caret();
}

const timeEl = document.getElementById('clock-time');
const dateEl = document.getElementById('clock-date');

function tick() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}
tick();
setInterval(tick, 10000);
