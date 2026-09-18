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

/* Tints are the desktop folder colours pulled darker. The originals were
 * chosen against a #3c4142 ground and sit at about 1.4:1 on near-white —
 * invisible. These are the same hues at a lightness that survives paper. */
const SECTIONS = [
    {
        name: 'Products',
        tint: '#c9791a',
        icon: "<path d='M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z'/><path d='M3 8.5 12 13l9-4.5M12 13v7'/>",
        links: [
            { label: 'Trezure — football-first fantasy', href: 'https://playtrezure.com', meta: 'Live' },
            { label: 'Trezure pitch deck', href: 'pitch.html', meta: 'Deck' },
            { label: 'Busy Cab — browser arcade taxi game', href: 'https://busycabgame.com', meta: 'Live' },
            { label: 'Bemore Labz — product & engineering lab', href: 'https://bemorelabz.com', meta: 'Live' }
        ]
    },
    {
        name: 'Client Work',
        tint: '#2f8f89',
        icon: "<rect x='3' y='7' width='18' height='13' rx='2'/><path d='M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18'/>",
        links: [
            { label: 'The Recovery Lab Society', href: 'https://github.com/josh2c/recovery-lab-society', meta: 'Catalog' },
            { label: 'Snow Motorsports', href: 'https://github.com/josh2c/shnowmotorsports-website', meta: 'Next.js' },
            { label: 'HotStart VC', href: 'https://github.com/josh2c/hotstartvc-website', meta: 'Fund site' },
            { label: 'AI Brokerage Pitch', href: 'https://github.com/josh2c/ai-brokerage-pitch', meta: 'Deck' }
        ]
    },
    {
        name: 'Skills',
        tint: '#5c9440',
        icon: "<path d='M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16'/>",
        skills: true,
        links: [{ label: 'github.com/josh2c/skills', href: 'https://github.com/josh2c/skills', meta: 'Repo' }]
    },
    {
        name: 'Thoughts',
        tint: '#7b5bb0',
        icon: "<path d='M4 5h16M4 10h16M4 15h11M4 20h7'/>",
        posts: true
    },
    {
        name: 'Games',
        tint: '#c04f7d',
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
        tint: '#a9603a',
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

function linkRow(l) {
    const ext = isExternal(l.href);
    return '<li><a class="cv-row cv-item" href="' + esc(l.href) + '"' +
        (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
        rowInner(l.label, l.meta, ext) + '</a></li>';
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

function mountSkills(list) {
    const pending = note(list, 'Loading…');

    const render = (names) => {
        if (!names.length) { pending.remove(); measure(); return; }
        pending.remove();
        /* Before the repo link, not after it — the link is the footnote. */
        list.insertAdjacentHTML('afterbegin', names.map((n) => linkRow({
            label: n,
            href: 'https://github.com/josh2c/skills/tree/main/skills/' + n,
            meta: 'Skill'
        })).join(''));
        measure();
    };

    try {
        const hit = JSON.parse(localStorage.getItem(SKILLS_CACHE) || 'null');
        if (hit && Date.now() - hit.at < SKILLS_TTL) { render(hit.names); return; }
    } catch (err) { /* ignore a bad cache */ }

    fetch('https://api.github.com/repos/josh2c/skills/contents/skills')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (!Array.isArray(d)) throw new Error('rate-limited');
            const names = d.filter((e) => e.type === 'dir').map((e) => e.name);
            try {
                localStorage.setItem(SKILLS_CACHE, JSON.stringify({ at: Date.now(), names }));
            } catch (err) { /* storage full */ }
            render(names);
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
