/* Desktop — the landing page behaves like an OS desktop.
 *
 * Folders, files and dock tools are all data-driven below. Opening any of them
 * shows a window; games are mounted from the shared games.js.
 */

/* ---------------------------------------------------------------- data --- */

const FOLDERS = [
    {
        name: 'Products',
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
        title: 'Skills',
        body: 'Agent skills I have written, installable as a Claude Code plugin.',
        skills: true,
        links: [{ label: 'github.com/josh2c/skills', href: 'https://github.com/josh2c/skills', meta: 'Repo' }]
    },
    {
        name: 'Thoughts',
        title: 'Thoughts',
        body: 'Twenty-two posts on innovation, leadership, productivity and sport.',
        links: [{ label: 'Read the blog', href: 'blog.html', meta: '22 posts' }]
    },
    {
        name: 'Elsewhere',
        title: 'Elsewhere',
        body: 'Where else to find me.',
        links: [{ label: 'Twitter / X', href: 'https://x.com/0talentt', meta: '@0talentt' }]
    }
];

/* Real files from the Trezure asset set, sitting on the desktop. */
const FILES = [
    { name: 'mascot.webp', src: 'board/img/tz-mascot-pirate.webp', title: 'mascot.webp',
      body: 'A seasonal variant of the Trezure mascot.' },
    { name: 'logo.webp', src: 'board/img/tz-logo.webp', title: 'logo.webp',
      body: 'The Trezure mark.' }
];

const DOCK = [
    { name: 'Paint', glyph: '🖌', game: 'paint' },
    { name: 'Pong', glyph: '🏓', game: 'pong' }
];

/* ----------------------------------------------------------- rendering --- */

function iconButton(label, className, inner) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'dt-icon ' + className;
    el.innerHTML = inner + '<span class="dt-icon-label">' + label + '</span>';
    return el;
}

const foldersEl = document.getElementById('folders');
FOLDERS.forEach((f, i) => {
    const el = iconButton(f.name, 'dt-folder-icon', '<span class="dt-folder" aria-hidden="true"></span>');
    el.addEventListener('click', () => openFolder(i));
    foldersEl.appendChild(el);
});

const filesEl = document.getElementById('files');
FILES.forEach((f, i) => {
    const el = iconButton(f.name, 'dt-file',
        '<img class="dt-file-thumb" src="' + f.src + '" alt="" aria-hidden="true">');
    el.addEventListener('click', () => openFile(i));
    filesEl.appendChild(el);
});

const dockEl = document.getElementById('dock');
DOCK.forEach((d, i) => {
    const el = iconButton(d.name, 'dt-dock-icon',
        '<span class="dt-tool" aria-hidden="true">' + d.glyph + '</span>');
    el.addEventListener('click', () => openGame(i));
    dockEl.appendChild(el);
});

/* The skills list is read from the repo rather than hardcoded, so adding a
 * skill on GitHub adds it here. Cached for a day; falls back to the repo link
 * if the unauthenticated API is rate-limited. */
const SKILLS_CACHE = 'jg-skills';
const SKILLS_TTL = 864e5;

function loadSkills(host) {
    if (!host) return;
    const render = (names) => {
        if (!names.length) return;
        host.innerHTML = '<ul class="dt-links">' + names.map((n) =>
            '<li><a href="https://github.com/josh2c/skills/tree/main/skills/' + n + '"' +
            ' target="_blank" rel="noopener noreferrer"><span>' + n + ' \u2192</span>' +
            '<span class="dt-link-meta">skill</span></a></li>').join('') + '</ul>';
    };
    try {
        const hit = JSON.parse(localStorage.getItem(SKILLS_CACHE) || 'null');
        if (hit && Date.now() - hit.at < SKILLS_TTL) { render(hit.names); return; }
    } catch (err) { /* ignore a bad cache */ }

    fetch('https://api.github.com/repos/josh2c/skills/contents/skills')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (!Array.isArray(d)) return;
            const names = d.filter((e) => e.type === 'dir').map((e) => e.name);
            try { localStorage.setItem(SKILLS_CACHE, JSON.stringify({ at: Date.now(), names })); } catch (err) { /* storage full */ }
            render(names);
        })
        .catch(() => { /* offline or rate-limited — the repo link still works */ });
}

/* -------------------------------------------------------------- window --- */
/* The window lives in board.js and is shared by both layers. This script is a
 * classic <script> so it runs before that module; the API is reached lazily at
 * click time, by which point it exists. */

function win() { return window.jgWindow; }

function openFolder(i) {
    const f = FOLDERS[i];
    const links = f.links.map((l) => {
        const ext = /^https?:/.test(l.href);
        return '<li><a href="' + l.href + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span>' + l.label + (ext ? ' \u2192' : '') + '</span>' +
            '<span class="dt-link-meta">' + l.meta + '</span></a></li>';
    }).join('');
    if (!win()) return;
    win().open(f.title, '<p>' + f.body + '</p><ul class="dt-links">' + links + '</ul>' +
        (f.skills ? '<div id="skills-list"></div>' : ''));
    if (f.skills) loadSkills(document.getElementById('skills-list'));
}

function openFile(i) {
    const f = FILES[i];
    if (!win()) return;
    win().open(f.title, '<img src="' + f.src + '" alt="' + f.title + '">' +
        '<p class="bw-note">' + f.body + '</p>');
}

function openGame(i) {
    const d = DOCK[i];
    if (!win()) return;
    if (d.game === 'pong' && typeof mountPong === 'function') { win().mount(d.name, mountPong); return; }
    if (d.game === 'paint' && typeof mountPaint === 'function') { win().mount(d.name, mountPaint); return; }
    win().open(d.name, '<p>' + d.name + ' is not wired up yet.</p>');
}

document.getElementById('trash').addEventListener('click', () => {
    if (!win()) return;
    win().open('Trash', '<p>Empty.</p><p class="bw-note">Nothing thrown away yet.</p>');
});

/* The hero is the way in: the board is already behind the desktop, so this
 * clears the furniture rather than loading a page. */
const heroEl = document.querySelector('.dt-hero');
if (heroEl) {
    heroEl.addEventListener('click', () => window.jgEnterBoard && window.jgEnterBoard());
    heroEl.setAttribute('role', 'button');
    heroEl.setAttribute('tabindex', '0');
    heroEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.jgEnterBoard && window.jgEnterBoard(); }
    });
}

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
