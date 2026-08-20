/* Desktop — the landing page behaves like an OS desktop.
 *
 * Folders, files and dock tools are all data-driven below. Opening any of them
 * shows a window; games are mounted from the shared games.js.
 */

/* ---------------------------------------------------------------- data --- */

const FOLDERS = [
    {
        name: 'Products',
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
        icon: "<path d='M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16'/>",
        title: 'Skills',
        body: 'Agent skills I have written, installable as a Claude Code plugin.',
        skills: true,
        links: [{ label: 'github.com/josh2c/skills', href: 'https://github.com/josh2c/skills', meta: 'Repo' }]
    },
    {
        name: 'Thoughts',
        icon: "<path d='M4 5h16M4 10h16M4 15h11M4 20h7'/>",
        title: 'Thoughts',
        body: 'Twenty-two posts on innovation, leadership, productivity and sport.',
        reader: true,
        count: '22 posts'
    },
    {
        name: 'Elsewhere',
        icon: "<path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'/><path d='M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18'/>",
        title: 'Elsewhere',
        body: 'Where else to find me.',
        links: [{ label: 'Twitter / X', href: 'https://x.com/0talentt', meta: '@0talentt' }]
    }
];

/* Real files from the Trezure asset set, sitting on the desktop. */
/* Stroked glyphs, matching the folder tiles — emoji rendered as a second
   visual language sitting next to them. */
const DOCK = [
    { name: 'Paint', game: 'paint',
      icon: "<path d='M15 4 20 9 9.5 19.5a3 3 0 0 1-1.5.8L4 21l.7-4a3 3 0 0 1 .8-1.5z'/><path d='M13.5 5.5 18.5 10.5'/>" },
    { name: 'Pong', game: 'pong',
      icon: "<rect x='3' y='4' width='18' height='16' rx='2'/><path d='M12 4v16M6 9v6M18 9v6'/>" },
    { name: 'Paintball', mode: 'paintball',
      icon: "<circle cx='12' cy='12' r='8'/><circle cx='12' cy='12' r='3.4'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3'/>" }
];

/* ----------------------------------------------------------- rendering --- */

function iconButton(id, label, className, inner, count) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dt-icon ' + className;
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
    const n = (f.links || []).length;
    return n ? n + (n === 1 ? ' item' : ' items') : '';
}

const iconsEl = document.getElementById('icons');

function folderMarkup(f) {
    return '<span class="dt-folder" aria-hidden="true">' +
             '<span class="f-back"></span>' +
             '<span class="f-card"></span><span class="f-card"></span><span class="f-card"></span>' +
             '<span class="f-front"><svg viewBox="0 0 24 24">' + (f.icon || '') + '</svg></span>' +
           '</span>';
}

FOLDERS.forEach((f, i) => {
    const el = iconButton('folder:' + f.name, f.name, 'dt-folder-icon', folderMarkup(f), countFor(f));
    el.addEventListener('click', () => openFolder(i));
    iconsEl.appendChild(el);
});

DOCK.forEach((d, i) => {
    const el = iconButton('tool:' + d.name, d.name, 'dt-dock-icon',
        '<span class="dt-tool" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24">' + (d.icon || '') + '</svg></span>');
    el.addEventListener('click', () => openGame(i));
    iconsEl.appendChild(el);
});

const trashEl = iconButton('trash', 'Trash', 'dt-trash-icon-wrap',
    '<span class="dt-trash-icon" aria-hidden="true"></span>');
trashEl.addEventListener('click', () => {
    if (!window.jgWindows) return;
    window.jgWindows.open({ id: 'trash', title: 'Trash', width: 380, height: 220,
        html: '<p>Empty.</p><p class="bw-note">Nothing thrown away yet.</p>' });
});
iconsEl.appendChild(trashEl);

/* ------------------------------------------------------------- placement --
 * Icons are placed absolutely and dragged freely, positions kept in local
 * storage. Below the breakpoint they fall back to normal flow — dragging on a
 * phone fights scrolling, and there is no room to arrange anything anyway. */

const LAYOUT_KEY = 'jg-desktop-layout';
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
    DOCK.forEach((d, i) => {
        out['tool:' + d.name] = { x: originX + i * CELL, y: window.innerHeight - CELL - 40 };
    });
    out.trash = { x: window.innerWidth - CELL - 40, y: window.innerHeight - CELL - 40 };
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
    [...iconsEl.children].forEach((el) => {
        if (!free) { el.style.left = el.style.top = ''; return; }
        const p = clampPos(layout[el.dataset.id] || { x: 26, y: 84 }, el);
        layout[el.dataset.id] = p;
        el.style.left = p.x + 'px';
        el.style.top = p.y + 'px';
    });
}

applyLayout();
window.addEventListener('resize', applyLayout);

/* Drag. A click still opens the icon as long as it barely moved — the same
 * threshold the board uses to tell a tap from a pan. */
let drag = null;

iconsEl.addEventListener('pointerdown', (e) => {
    if (!FREE() || e.button !== 0) return;
    const el = e.target.closest('.dt-icon');
    if (!el) return;
    const p = layout[el.dataset.id];
    drag = { el, id: el.dataset.id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: 0 };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
});

iconsEl.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    drag.moved = Math.abs(dx) + Math.abs(dy);
    if (drag.moved < 4) return;
    const p = clampPos({ x: drag.ox + dx, y: drag.oy + dy }, drag.el);
    drag.el.style.left = p.x + 'px';
    drag.el.style.top = p.y + 'px';
    layout[drag.id] = p;
});

function endDrag() {
    if (!drag) return;
    drag.el.classList.remove('is-dragging');
    // Anything past the threshold was a move, so suppress the click that
    // follows or every drop would also open the folder.
    if (drag.moved >= 4) {
        const el = drag.el;
        el.addEventListener('click', (ev) => ev.stopImmediatePropagation(), { capture: true, once: true });
        saveLayout();
    }
    drag = null;
}

iconsEl.addEventListener('pointerup', endDrag);
iconsEl.addEventListener('pointercancel', endDrag);

/* Put everything back where it started. */
window.jgTidyDesktop = function () {
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

    W.open({
        id: 'folder:' + f.name,
        title: f.title,
        width: 560,
        height: 400,
        mount: (body) => {
            body.innerHTML = '<p>' + f.body + '</p><ul class="dt-links">' + links + '</ul>' +
                (f.skills ? '<div id="skills-list"></div>' : '');
            if (f.skills) loadSkills(body.querySelector('#skills-list'));
        }
    });
}

function openGame(i) {
    const d = DOCK[i];
    // Paintball is a mode over the whole page, not something in a window.
    if (d.mode === 'paintball') {
        if (window.jgPaintball) window.jgPaintball.toggle();
        return;
    }
    const W = window.jgWindows;
    if (!W) return;
    if (d.game === 'pong' && typeof mountPong === 'function') {
        W.open({ id: 'game:pong', title: 'Pong', width: 560, height: 420, mount: mountPong });
        return;
    }
    if (d.game === 'paint' && typeof mountPaint === 'function') {
        W.open({ id: 'game:paint', title: 'Paint', width: 560, height: 440, mount: mountPaint });
        return;
    }
}

/* Menubar entries that need script. */
const mbThoughts = document.getElementById('mb-thoughts');
if (mbThoughts) mbThoughts.addEventListener('click', () => window.jgReader && window.jgReader.openBlog());

const mbTidy = document.getElementById('mb-tidy');
if (mbTidy) mbTidy.addEventListener('click', () => window.jgTidyDesktop && window.jgTidyDesktop());

/* --------------------------------------------------------------- clock --- */

/* The latest post is read from blog.html so the panel cannot go stale as you
 * publish. The markup in the page is the fallback. */
fetch('blog.html')
    .then((r) => (r.ok ? r.text() : null))
    .then((html) => {
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const post = doc.querySelector('.post');
        if (!post) return;
        const title = post.querySelector('.post-title');
        const date = post.querySelector('.date');
        const cat = post.querySelector('.category');
        const href = post.querySelector('.read-more');
        const t = document.querySelector('.dt-panel-title');
        const m = document.querySelector('.dt-panel-meta');
        const a = document.querySelector('.dt-panel-body');
        if (t && title) t.textContent = title.textContent;
        if (m && date) m.textContent = date.textContent + (cat ? ' · ' + cat.textContent : '');
        if (a && href) a.setAttribute('href', href.getAttribute('href'));
    })
    .catch(() => { /* offline — the markup in the page stands */ });

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
