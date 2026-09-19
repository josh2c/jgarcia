/* Cover — the front page index.
 *
 * Everything the site holds is listed here once, in one column: products,
 * client work, skills, writing, games. The folders that used to carry this on
 * a desktop are gone; this list is where that content lives now.
 *
 * Two of the groups cannot be written down, because they are read from
 * somewhere that keeps changing — the skills from the repo on GitHub, the
 * posts from blog.html. Both fill in after first paint and both degrade to a
 * plain link if the fetch fails.
 *
 * Opening something does not leave the cover. Posts and games mount into the
 * shared window manager on top of it; only genuinely external destinations
 * take you off the page.
 */

(function () {

/* ---------------------------------------------------------------- data --- */

/* Section marks come from the Pencil palette rather than a fixed hex, so they
 * invert with the page instead of going muddy in the dark theme. */
const SECTIONS = [
    {
        name: 'Engineering',
        tint: 'var(--ui-c-blue)',
        icon: "<path d='M4 19h16M6 19V9l6-5 6 5v10'/><path d='M10 19v-5h4v5'/>",
        links: [
            { label: 'How I build with AI — principles, sources, languages', href: 'engineering.html', meta: 'Library' }
        ]
    },
    {
        name: 'Projects',
        tint: 'var(--ui-c-yellow)',
        icon: "<path d='M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z'/><path d='M3 8.5 12 13l9-4.5M12 13v7'/>",
        links: [
            {
                label: 'Trezure',
                href: 'https://playtrezure.com',
                meta: 'Live',
                page: {
                    kind: 'Project',
                    standfirst: 'A football-first fantasy app \u2014 season-long leagues, weekly contests and collectable player cards, three ways to play in one place.',
                    shot: 'img/trezure.webp',
                    shotAlt: 'The Trezure landing page, showing a live draft in progress on a phone alongside player cards',
                    tech: ['Flutter', 'Dart', 'Supabase', 'PostgreSQL', 'Edge Functions', 'iOS', 'Android'],
                    body: [
                        'Most fantasy apps make you pick one format and live in it for the season. Trezure runs all three side by side, so a league, a weekly contest and a card collection are the same account and the same players.',
                        'Pack Draft and Dynasty are the two modes with the most in them \u2014 Pack Draft being the one that started the app, where you draft out of packs rather than off a board.',
                        'Flutter on the front, Supabase and PostgreSQL behind it, with row-level security doing the authorisation and edge functions doing the scoring. Real-time NFL and NBA stats arrive through a set of sync workers that run independently of the app.'
                    ],
                    linkLabel: 'playtrezure.com'
                }
            },
            {
                label: 'Busy Cab',
                href: 'https://busycabgame.com',
                meta: 'Live',
                page: {
                    kind: 'Project',
                    standfirst: 'An arcade taxi game in the browser: pick up passengers, floor it, and get paid before the clock runs out.',
                    shot: 'img/busycab.webp',
                    shotAlt: 'Busy Cab in play \u2014 a yellow cab on a low-poly city street with the shift timer running',
                    tech: ['TypeScript', 'Three.js', 'Vite', 'Capacitor', 'iOS', 'Android'],
                    body: [
                        'One global countdown that every drop-off extends, so the run ends when you stop being quick rather than at a fixed time. Fast drop-offs pay double, and hot cargo pays triple but comes with company.',
                        'Stop inside the beacon ring to pick up and drop off. Steering is on-screen buttons on a phone and WASD on a keyboard, and the same build runs in a browser or as an app through Capacitor.',
                        'Three.js and TypeScript, no engine. Every asset is original or CC0.'
                    ],
                    linkLabel: 'busycabgame.com'
                }
            },
            {
                label: 'Nodal',
                href: 'https://github.com/josh2c/nodal',
                meta: 'Rust',
                page: {
                    kind: 'Project',
                    standfirst: 'Git made branches cheap. Worktrees made branches parallel. Nodal makes their environments cheap, durable and manageable.',
                    tech: ['Rust', 'Cargo workspace', 'MIT', 'Pre-alpha'],
                    body: [
                        'Point it at a repository it has never been told about and it reads the worktrees you already have, then answers the questions you actually have about them: what is finished, what is unique to a checkout, how far behind it is, what it costs on disk. It writes nothing to do it.'
                    ],
                    code: {
                        caption: 'What it looks like',
                        text: '$ nodal\n\n  ~/projects/acme  (no project of nodal\u2019s; nothing was written)\n\n  WORKTREE          FOR  DONE             ONLY HERE  BEHIND             SIZE    AGE\n  ../acme-t8        \u2014    conflict         ^1         -49 (origin/main)  141 kB  21 d\n  ../acme-t14       \u2014    conflict         ^1         -43 (origin/main)  254 kB  21 d\n  ../acme-t21       \u2014    done (ancestor)  \u2014          -37 (origin/main)  276 kB  21 d\n  /tmp/scratch/h1   \u2014    prunable (gitdir file points to non-existent location)\n\n  2 worktrees are done and hold nothing unique: 558 kB. behind is measured\n  against origin/main, which last moved on 2026-08-23. nodal removed nothing.'
                    },
                    bodyAfter: [
                        'The last line is the part I care about. Nodal never fetches to make a number look fresher than it is \u2014 behind is only as new as your last fetch, so it reads how old that number is and says so rather than quietly hiding it.',
                        'Rust, MIT licensed, and pre-alpha \u2014 the foundation is built and tested, parts of the command surface are not, and the on-disk formats may still change.'
                    ],
                    linkLabel: 'View on GitHub'
                }
            },
            {
                label: 'Proton Pass for Omarchy',
                href: 'https://github.com/josh2c/omarchy-protonpass',
                meta: 'Widget',
                page: {
                    kind: 'Project',
                    standfirst: 'A keyboard-first Proton Pass widget for the Omarchy bar: find a login and copy a field to the clipboard without the secret ever appearing on screen.',
                    shot: 'img/omarchy-protonpass.webp',
                    shotAlt: 'The Proton Pass quick-access panel in the Omarchy bar',
                    tech: ['QML', 'JavaScript', 'Shell', 'Wayland', 'pass-cli'],
                    body: [
                        'It complements Proton\u2019s own apps rather than replacing them. Search login items across vaults by title or vault name, copy a username, password or TOTP code with one keystroke, and create a login with a generated password without leaving the panel. Recently used logins come first.',
                        'It never displays a retrieved secret. Values go from Proton\u2019s official pass-cli straight to the Wayland clipboard, marked sensitive \u2014 never into the panel, never into a log, never into a file. The plugin opens no connections of its own; only pass-cli talks to Proton, and signing in happens in Proton\u2019s own CLI so the password never passes through this code.',
                        'The only things it writes to disk are a list of recently used item IDs \u2014 no names, no secrets \u2014 and a one-way hash of the last value copied, used to clear the clipboard safely. SECURITY.md states every claim plainly and gives you the greps and tests to check each one yourself.',
                        'It needs a Proton plan that includes CLI access: personal Pass Plus, or business Pass Professional. Pass Essentials is not eligible.'
                    ],
                    linkLabel: 'View on GitHub'
                }
            },
            {
                label: 'Aim Training',
                href: 'https://josh2c.github.io/aimtraining/',
                meta: 'Live',
                page: {
                    kind: 'Project',
                    standfirst: 'A browser aim trainer on a 3D range. Flicking mode: thirty seconds, one target at a time, score by how fast you land each one.',
                    shot: 'img/aimtraining.webp',
                    shotAlt: 'The aim training range \u2014 a first-person view down a dark hall with a crosshair and the score and timer in the corner',
                    tech: ['Three.js', 'JavaScript', 'WebGL'],
                    body: [
                        'Flicking is the specific skill: the target is somewhere else, and the only thing being measured is how quickly you can put the crosshair on it and commit. One target at a time, so there is nothing to plan and nowhere to hide.',
                        'Three.js and plain JavaScript, no engine and no build step. It runs from a static page.'
                    ],
                    linkLabel: 'Play it'
                }
            },
            {
                label: 'GeoLocator',
                href: 'https://github.com/josh2c/geolocatorgame',
                meta: 'Flutter',
                page: {
                    kind: 'Project',
                    standfirst: 'A street-view guessing game: read the architecture, the signs and the vegetation, then drop a pin on the world map.',
                    tech: ['Flutter', 'Dart', 'Mapbox', 'Mapillary', 'iOS', 'Android'],
                    body: [
                        'You are dropped into street-level imagery somewhere in the world with no label and no coordinates, and the only evidence is what is in frame. Scoring is on accuracy and speed together, so a confident guess beats a slow careful one that lands no closer.',
                        'Street view comes from Mapillary and the guessing map is Mapbox, both inside a Flutter app that runs on iOS and Android.'
                    ],
                    linkLabel: 'View on GitHub'
                }
            }
        ]
    },
    {
        name: 'Skills',
        tint: 'var(--ui-c-green)',
        icon: "<path d='M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16'/>",
        skills: true,
        links: [{ label: 'github.com/josh2c/skills', href: 'https://github.com/josh2c/skills', meta: 'Repo' }]
    },
    {
        name: 'Thoughts',
        tint: 'var(--ui-c-purple)',
        icon: "<path d='M4 5h16M4 10h16M4 15h11M4 20h7'/>",
        posts: true
    },
    {
        name: 'Games',
        tint: 'var(--ui-c-red)',
        icon: "<rect x='2' y='7' width='20' height='11' rx='4'/><path d='M7 11v3M5.5 12.5h3'/><circle cx='16' cy='12' r='1'/><circle cx='18.5' cy='14.5' r='1'/>",
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
        tint: 'var(--ui-c-cyan)',
        icon: "<path d='M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'/><path d='M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18'/>",
        links: [{ label: 'Twitter / X', href: 'https://x.com/0talentt', meta: '@0talentt' }]
    }
];

/* ----------------------------------------------------------- rendering --- */

const col = document.getElementById('cv-col');
const scroller = document.getElementById('cv-scroll');
if (!col || !scroller) return;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const isExternal = (href) => /^https?:/.test(href);

/* One row shape for every entry, so the marker dot and the rhythm do not have
 * to know whether it is a link, a launcher or a heading. */
function rowInner(label, meta, external) {
    return '<span class="cv-label">' + esc(label) + '</span>' +
        (external ? '<span class="cv-out" aria-hidden="true">↗</span>' : '') +
        (meta ? '<span class="cv-meta">' + esc(meta) + '</span>' : '');
}

/* Anything with a `page` opens here rather than sending you away. The
 * destination is still one click further on, at the top of that page, but it
 * is worth a sentence about what a thing IS before the link to it — a bare
 * external link off the front page tells a reader nothing and spends their
 * attention on a tab they have to come back from. */
const PAGES = [];

function linkRow(l) {
    if (l.page) {
        PAGES.push(l);
        return '<li><button type="button" class="cv-row cv-item" data-page="' +
            (PAGES.length - 1) + '">' + rowInner(l.label, l.meta, false) + '</button></li>';
    }
    const ext = isExternal(l.href);
    return '<li><a class="cv-row cv-item" href="' + esc(l.href) + '"' +
        (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        rowInner(l.label, l.meta, ext) + '</a></li>';
}

function openPage(l) {
    const R = window.jgReader;
    if (!R) { window.open(l.href, '_blank', 'noopener'); return; }
    const p = l.page;
    const para = (list) => (list || []).map((t) => '<p>' + esc(t) + '</p>').join('');
    /* A terminal transcript is the screenshot for a command-line tool, so it
     * sits where a screenshot would: after the opening paragraph, before the
     * detail that explains it. */
    const code = p.code ? '<figure class="doc-term">' +
        (p.code.caption ? '<figcaption>' + esc(p.code.caption) + '</figcaption>' : '') +
        '<pre><code>' + esc(p.code.text) + '</code></pre></figure>' : '';

    R.open({
        kind: p.kind,
        title: l.label,
        standfirst: p.standfirst,
        shot: p.shot,
        shotAlt: p.shotAlt,
        tech: p.tech,
        html: para(p.body) + code + para(p.bodyAfter),
        source: l.href,
        sourceLabel: (p.linkLabel || 'Open') + ' \u2197'
    });
}

function groupEl(s) {
    const el = document.createElement('section');
    el.className = 'cv-group';
    el.style.setProperty('--cv-tint', s.tint);
    el.innerHTML =
        '<h2 class="cv-row cv-head">' +
            '<svg class="cv-ico" viewBox="0 0 24 24" aria-hidden="true">' + s.icon + '</svg>' +
            '<span class="cv-label">' + esc(s.name) + '</span>' +
        '</h2>' +
        '<ul class="cv-items">' + (s.links || []).map(linkRow).join('') + '</ul>';
    return el;
}

/* Called at the very bottom rather than here. A cached skills list renders
 * synchronously, and that render measures the column — which would reach the
 * marker's state before it is initialised if the build ran at this point. */
function build() {
    SECTIONS.forEach((s) => {
        const el = groupEl(s);
        const list = el.querySelector('.cv-items');

        if (s.games) mountGames(list, s.games);
        if (s.posts) mountPosts(list);
        if (s.skills) mountSkills(list);

        list.querySelectorAll('[data-page]').forEach((b) =>
            b.addEventListener('click', () => openPage(PAGES[Number(b.dataset.page)])));

        col.appendChild(el);
    });
}

/* A group waiting on a fetch says so, rather than sitting empty. */
function note(list, text) {
    const li = document.createElement('li');
    li.innerHTML = '<p class="cv-note">' + esc(text) + '</p>';
    list.appendChild(li);
    return li;
}

/* ---------------------------------------------------------------- games --- */

/* Mind Override ports live on their own namespace; Paint and Pong are plain
 * globals from games.js. Resolved at click time rather than at load, so a
 * listing does not have to care about script order. */
function mountGames(list, games) {
    list.insertAdjacentHTML('beforeend', games.map((g, i) =>
        '<li><button type="button" class="cv-row cv-item" data-game="' + i + '">' +
        rowInner(g.label, g.meta, false) + '</button></li>').join(''));

    list.querySelectorAll('[data-game]').forEach((b) => {
        b.addEventListener('click', () => {
            const g = games[Number(b.dataset.game)];
            const R = window.jgReader;
            const mount = (window.jgMindOverride && window.jgMindOverride[g.fn]) || window[g.fn];
            if (!R || typeof mount !== 'function') return;
            /* A game opens as a page like everything else. The dimensions the
             * window used are kept, but as the size of the stage rather than
             * of a pane — these size their canvas off the box they are handed,
             * and a game that can grow to the width of a monitor plays badly. */
            R.open({
                kind: 'Game',
                title: g.label,
                standfirst: g.meta,
                mount,
                stage: { width: g.width || 660, height: g.height || 620 }
            });
        });
    });
}

/* --------------------------------------------------------------- posts --- */

/* blog.html stays the source of truth — the cover reads the same markup the
 * reader does, so a new post appears here without being listed twice. */
function mountPosts(list) {
    const pending = note(list, 'Loading…');

    fetch('blog.html')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const posts = [...doc.querySelectorAll('.post')].map((p) => {
                const title = p.querySelector('.post-title');
                const link = p.querySelector('.read-more');
                const date = p.querySelector('.date');
                if (!title || !link) return null;
                return {
                    title: title.textContent.trim(),
                    href: link.getAttribute('href'),
                    date: date ? date.textContent.trim() : ''
                };
            }).filter(Boolean);

            if (!posts.length) throw new Error('empty');

            pending.remove();
            /* No date in the row. These titles are questions and they run
             * long; the date is the first thing the reader shows anyway, and
             * giving it a column here truncates the title that earns the
             * click. */
            list.insertAdjacentHTML('beforeend', posts.map((p, i) =>
                '<li><button type="button" class="cv-row cv-item" data-post="' + i +
                '" title="' + esc(p.title) + (p.date ? ' \u2014 ' + esc(p.date) : '') + '">' +
                rowInner(p.title, '', false) + '</button></li>').join(''));

            list.querySelectorAll('[data-post]').forEach((b) => {
                b.addEventListener('click', () => {
                    const p = posts[Number(b.dataset.post)];
                    if (window.jgReader) window.jgReader.openPost(p.href, p.title);
                });
            });
            measure();
        })
        .catch(() => {
            /* Opened from the file system, or offline. The blog is a real page
               either way, so fall back to it rather than showing nothing. */
            pending.outerHTML = linkRow({ label: 'All posts', href: 'blog.html', meta: 'Blog' });
            measure();
        });
}

/* -------------------------------------------------------------- skills --- */

const SKILLS_CACHE = 'jg-skills';
const SKILLS_TTL = 864e5;

/* Some skills are only a pointer at another one — `atlas` exists so that the
 * word works, and does nothing but call system-atlas. Listing both invites the
 * reasonable question of which is the real one, so the aliases are dropped and
 * the skill they point at is the one shown. They say so themselves, in their
 * own description, which is why this reads the frontmatter rather than keeping
 * a list of names here that would go stale. */
const isAlias = (meta) => /\balias for\b/i.test(meta && meta.description || '');

function mountSkills(list) {
    const pending = note(list, 'Loading\u2026');

    /* A skill opens as a page here rather than as a repo on GitHub. The link
     * to the source stays, at the top of that page. */
    const render = (names) => {
        pending.remove();
        if (names.length) {
            /* Before the repo link, not after it — the link is the footnote. */
            list.insertAdjacentHTML('afterbegin', names.map((n) =>
                '<li><button type="button" class="cv-row cv-item" data-skill="' + esc(n) + '">' +
                rowInner(n, 'Skill', false) + '</button></li>').join(''));

            list.querySelectorAll('[data-skill]').forEach((b) => {
                b.addEventListener('click', () => {
                    if (window.jgSkills) window.jgSkills.open(b.dataset.skill);
                });
            });
        }
        measure();
    };

    /* The directory listing gives the names; each skill's own frontmatter says
     * what it is and whether it is an alias. If the frontmatter cannot be read
     * the names are still shown — an unfiltered list beats no list. */
    const describe = (names) => {
        if (!window.jgSkills) return render(names);
        Promise.all(names.map((n) =>
            window.jgSkills.meta(n).then((m) => (isAlias(m) ? null : n)).catch(() => n)
        )).then((kept) => render(kept.filter(Boolean)));
    };

    try {
        const hit = JSON.parse(localStorage.getItem(SKILLS_CACHE) || 'null');
        if (hit && Date.now() - hit.at < SKILLS_TTL) { describe(hit.names); return; }
    } catch (err) { /* ignore a bad cache */ }

    fetch('https://api.github.com/repos/josh2c/skills/contents/skills')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (!Array.isArray(d)) throw new Error('rate-limited');
            const names = d.filter((e) => e.type === 'dir').map((e) => e.name);
            try {
                localStorage.setItem(SKILLS_CACHE, JSON.stringify({ at: Date.now(), names }));
            } catch (err) { /* storage full */ }
            describe(names);
        })
        .catch(() => { pending.remove(); measure(); });
}

/* --------------------------------------------------------------- marker -- */

/* One dot follows you down the column. It marks the row nearest a reading
 * line set above centre — the same place your eye sits when scanning a list,
 * and high enough that the marked row is never in the bottom fade.
 *
 * Row positions are measured once per scroll burst rather than per row per
 * frame: getBoundingClientRect on every row of a hundred-entry list, sixty
 * times a second, is the one thing on this page that could drop a frame. */
const FOCUS = 0.42;
let rows = [];
let near = null;
let queued = false;

function measure() {
    rows = [...col.querySelectorAll('.cv-row')];
    mark();
}

function mark() {
    if (!rows.length) return;
    const line = scroller.clientHeight * FOCUS;
    let best = null;
    let bestD = Infinity;

    for (const el of rows) {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - line);
        if (d < bestD) { bestD = d; best = el; }
    }

    if (best === near) return;
    if (near) near.classList.remove('is-near');
    near = best;
    if (near) near.classList.add('is-near');
}

scroller.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mark(); });
}, { passive: true });

window.addEventListener('resize', measure);

build();
measure();

/* ---------------------------------------------------------------- exit --- */

/* Handing over to the board. The button carries data-enter-board, which
 * board.js already binds, so all that is left here is the hash — a cover that
 * forgets you were on the board would send you back to the front every
 * reload. */
document.querySelectorAll('[data-enter-board]').forEach((el) => {
    el.addEventListener('click', () => {
        try { history.replaceState(null, '', '#board'); } catch (err) { /* file:// */ }
    });
});

document.querySelectorAll('[data-leave-board]').forEach((el) => {
    el.addEventListener('click', () => {
        try { history.replaceState(null, '', location.pathname + location.search); } catch (err) { /* file:// */ }
    });
});

})();
