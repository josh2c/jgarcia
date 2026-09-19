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
            { label: 'How I build with AI: principles, sources, languages', href: 'engineering.html', meta: 'Library' }
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
                    standfirst: 'A football-first fantasy app. Season-long leagues, weekly contests and collectable player cards, three ways to play against the same set of players.',
                    shot: 'img/trezure.webp',
                    shotAlt: 'The Trezure landing page, showing a live draft in progress on a phone alongside player cards',
                    tech: ['Flutter', 'Dart', 'Bloc', 'Freezed', 'Supabase', 'PostgreSQL', 'Edge Functions', 'iOS', 'Android'],
                    blocks: [
                        { p: 'Most fantasy apps make you pick a format in August and live with it until January. If your league dies in week four, that is the season. Trezure runs all three formats against one roster, so a dead league costs you an afternoon instead of a year.' },
                        { p: 'That choice drives the architecture. Three modes read and write the same players, the same cards and the same wallet, so each one is another chance to let somebody touch a row they should not.' },

                        { h: 'Authorization lives in the database' },
                        { p: 'The client does not decide what you can see. Row-level security in PostgreSQL filters every contest row by who is asking, before it reaches the app. A bug in a screen shows you nothing instead of showing you another player’s team.' },
                        { p: 'Scoring and payouts follow the same rule. They run in edge functions with the service role and never on the device. A phone that can work out your winnings can be made to work out the wrong ones.' },

                        { h: 'One feature, one folder' },
                        { p: 'Each feature is a self-contained module. The repository inside it is the only code allowed to talk to Supabase. Cubits hold state and make no network calls. Screens hold layout and no state. When drafting breaks there is one folder to open.' },
                        {
                            code: {
                                caption: 'A feature module',
                                lang: 'structure',
                                text: 'lib/features/pack_draft/\n├── cubit/          state, and the only place it changes\n├── models/         freezed unions: loading, loaded and error\n│                   are separate types, not one nullable bag\n├── repositories/   the only code here that talks to Supabase\n├── screens/        layout, no state\n└── widgets/'
                            }
                        },
                        { p: 'State is modelled as Freezed unions rather than one class full of nullable fields. Loading, loaded and failed are three separate types, so a screen cannot render a score that has not arrived yet.' },

                        { h: 'Stats are somebody else’s uptime' },
                        { p: 'Live NFL and NBA numbers arrive through sync workers that run outside the request path and write into Postgres. The app reads the database and never the provider. When a feed goes down on a Sunday, and it does, scores go stale instead of the app going dark.' },
                        { p: 'The repository is private, so this page covers the architecture rather than the source. Every feature follows the structure above.' }
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
                    standfirst: 'An arcade taxi game that has to be playable a second after the tab opens. A whole city, no real loading screen, nothing to download.',
                    shot: 'img/busycab.webp',
                    shotAlt: 'Busy Cab in play, a yellow cab on a low-poly city street with the shift timer running',
                    tech: ['TypeScript', 'Three.js', 'Vite', 'Capacitor', 'iOS', 'Android'],
                    blocks: [
                        { p: 'A browser game competes with the back button. Thirty seconds of downloading loses, which rules out shipping the city as a model file. So the city is computed instead, the same way every time the page loads.' },

                        { h: 'The city is a seed, not an asset' },
                        { p: 'An eleven by eleven grid of blocks comes out of a seeded PRNG, so the layout, the buildings, the trees and the billboards all follow from one number. Nothing downloads, and nothing changes between sessions. The street you learned yesterday is the street you get today, which matters when the game is mostly route learning.' },
                        {
                            code: {
                                caption: 'Deterministic, in about ten lines',
                                lang: 'typescript',
                                text: 'function mulberry32(seed: number) {\n  return function () {\n    seed |= 0\n    seed = (seed + 0x6d2b79f5) | 0\n    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)\n    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t\n    return ((t ^ (t >>> 14)) >>> 0) / 4294967296\n  }\n}\n\nconst BLOCKS = 11   // city blocks per side\nconst BLOCK  = 26   // block size\nconst ROAD   = 16   // road width'
                            }
                        },
                        { p: 'Anything repeated is an InstancedMesh: street lamps, road dashes, trees, poles. A few thousand objects cost one draw call each instead of a few thousand. That is what keeps a mid-range phone above thirty frames with a whole city on screen.' },

                        { h: 'No physics engine' },
                        { p: 'A cab that bumps into buildings does not need rigid bodies, solvers or a 200kB dependency. It needs to stay out of walls and to feel bad about hitting them. That is a circle against an axis-aligned box, in about twenty lines.' },
                        {
                            code: {
                                caption: 'Collide, slide, and pay for it',
                                lang: 'typescript',
                                text: '// Nearest point on the box to the cab’s centre.\nconst cx = clamp(pos.x, c.minX, c.maxX)\nconst cz = clamp(pos.z, c.minZ, c.maxZ)\nconst dx = pos.x - cx\nconst dz = pos.z - cz\nif (dx * dx + dz * dz >= radius * radius) continue   // clear\n\nconst d  = Math.sqrt(dx * dx + dz * dz)\nconst nx = dx / d\nconst nz = dz / d\npos.x = cx + nx * radius          // push out along the normal\npos.z = cz + nz * radius\n\n// Remove only the part of the velocity going INTO the wall, so the\n// cab slides along it instead of sticking. Scraping costs speed,\n// which is the whole penalty. There is no damage model.\nconst vn = vel.x * nx + vel.z * nz\nif (vn < 0) {\n  vel.x -= nx * vn\n  vel.z -= nz * vn\n  vel.multiplyScalar(0.75)\n}'
                            }
                        },
                        { p: 'The rest is arcade arithmetic. One countdown that every drop-off extends, so a run ends when you stop being quick rather than at a fixed time. Fast drop-offs pay double. Hot cargo pays triple and brings company. Capacitor wraps the same build for iOS and Android, and every asset is original or CC0.' },
                        { p: 'The repository is private, so this page covers the design rather than the source. The game itself is public and playable at the link above.' }
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
                    tech: ['Rust', 'Cargo workspace', 'clippy', 'MIT', 'Pre-alpha'],
                    blocks: [
                        { p: 'Running several agents at once means several worktrees, and worktrees pile up. After a month there are a dozen folders, each with its own node_modules, and no way to tell which ones still hold something. People leave them alone because deleting the wrong one loses work and nothing will say which one that is.' },
                        { p: 'So Nodal answers that question first, and never deletes anything.' },
                        {
                            code: {
                                caption: 'In a repository it has never been told about',
                                lang: 'console',
                                text: '$ nodal\n\n  ~/projects/acme  (no project of nodal’s; nothing was written)\n\n  WORKTREE          FOR  DONE             ONLY HERE  BEHIND             SIZE    AGE\n  ../acme-t8        —    conflict         ^1         -49 (origin/main)  141 kB  21 d\n  ../acme-t14       —    conflict         ^1         -43 (origin/main)  254 kB  21 d\n  ../acme-t21       —    done (ancestor)  —          -37 (origin/main)  276 kB  21 d\n  /tmp/scratch/h1   —    prunable (gitdir file points to non-existent location)\n\n  2 worktrees are done and hold nothing unique: 558 kB. behind is measured\n  against origin/main, which last moved on 2026-08-23. nodal removed nothing.'
                            }
                        },

                        { h: 'ONLY HERE is the column that matters' },
                        { p: 'It answers the question that stops people deleting anything: will this destroy work that exists nowhere else. A caret and a number mean that many commits live only in that folder. A dash means none do, and the folder is safe to drop.' },
                        { p: 'DONE is a separate question on purpose, read with git merge-tree rather than by checking whether a branch is an ancestor of main. A squash merge rewrites history, so an ancestor check reports squash-merged work as unmerged, and people learn to ignore the column. Reading the tree counts a squash as done.' },
                        { p: 'It also never fetches to make a number look better. Behind is only as fresh as your last fetch, so it reports how old that number is instead of quietly refreshing it. Reclaiming disk is a separate command you run yourself, and it refuses while a folder holds work that exists nowhere else.' },

                        { h: 'Complexity is the linter’s job' },
                        { p: 'The workspace splits in two. nodal-core knows about git and the filesystem, nodal-cli knows about arguments and printing. One directory per module, one file per concern, and branching kept inside small pure functions. Three lines of config hold it there, and they fail CI.' },
                        {
                            code: {
                                caption: 'clippy.toml',
                                lang: 'toml',
                                text: 'cognitive-complexity-threshold = 12\ntoo-many-lines-threshold      = 80\ntoo-many-arguments-threshold  = 5'
                            }
                        },
                        { p: 'This is the complexity ratchet from my engineering notes in the form that actually holds. A ceiling the build enforces means no reviewer spends attention arguing about the length of a function. Rust 1.88, MIT licensed, and pre-alpha: the foundation is built and tested, parts of the command surface are not, and the on-disk formats may still change.' }
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
                    standfirst: 'A keyboard-first Proton Pass widget for the Omarchy bar. Find a login and copy a field, without the secret being rendered anywhere.',
                    shot: 'img/omarchy-protonpass.webp',
                    shotAlt: 'The Proton Pass quick-access panel in the Omarchy bar',
                    tech: ['QML', 'Quickshell', 'JavaScript', 'Shell', 'Wayland', 'pass-cli'],
                    blocks: [
                        { p: 'Getting a password out of a manager and into a terminal usually means opening an app, finding the entry, revealing the value and reading it. The revealing step is the one worth removing. You rarely need to see a password. You need it on the clipboard.' },
                        { p: 'So the panel searches and copies, and never displays. That constraint is what decides where the boundary goes.' },

                        { h: 'The secret never enters the process that draws' },
                        { p: 'A bar widget is a long-lived UI process with a property system, a log and a scene graph. Anything that reaches it can end up in a binding, a debug print or a crash dump. Field values never get there. The UI handles item metadata, meaning titles, vault names and IDs, then asks a helper to copy by ID. The value goes from Proton’s official pass-cli straight to the Wayland clipboard, marked sensitive, without passing through anything that renders.' },
                        {
                            code: {
                                caption: 'Service.qml, the boundary stated and then kept',
                                lang: 'qml',
                                text: '// Headless Proton Pass service. Only non-secret item metadata crosses this\n// boundary; field values stay inside the helper and go directly to wl-copy.\n\nvar commandLine = [helperPath(), "copy",\n    "--share-id",      share,\n    "--item-id",       item,\n    "--field",         requestedField,\n    "--clear-seconds", String(intSetting("clipboardClearSeconds", 45, 0, 300))];\n\n// Note what is absent: the value. The UI names a field. It never holds one.'
                            }
                        },
                        { p: 'Signing in works the same way. It opens Proton’s own CLI in a terminal, so the password and any 2FA go straight to Proton, and the widget only checks afterwards that a session exists. It opens no connections of its own. The only thing that talks to Proton is Proton’s binary.' },

                        { h: 'What it writes down' },
                        { p: 'Two things reach the disk. A list of recently used item IDs, with no names and no secrets. And a one-way hash of the last value copied, which lets the widget confirm the clipboard still holds what it put there without keeping the value to compare against. Turning recents off deletes the list immediately.' },
                        { p: 'SECURITY.md states each of those claims and then gives you the greps and tests to check them yourself. It needs a Proton plan with CLI access: personal Pass Plus, or business Pass Professional. Pass Essentials is not eligible.' }
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
                    standfirst: 'A browser aim trainer on a 3D range. Thirty seconds, one target at a time, ten points a hit, so the score is a count of how many you land before the clock stops.',
                    shot: 'img/aimtraining.webp',
                    shotAlt: 'The aim training range, a first-person view down a dark hall with a crosshair and the score and timer in the corner',
                    tech: ['Three.js', 'JavaScript', 'WebGL', 'Pointer Lock API'],
                    blocks: [
                        { p: 'Flicking is one specific skill. The target is somewhere else, and the only thing being measured is how fast you can put the crosshair on it and commit. Most trainers bury that under modes, weapons and progression. This one has none of them.' },
                        { p: 'One target exists at a time. Hit it and the next appears immediately, so there is nothing to queue and nothing to plan.' },

                        { h: 'The crosshair is always the centre of the screen' },
                        { p: 'The Pointer Lock API captures the mouse, so there is no cursor and the camera rotates from raw movement deltas. That makes hit detection simple. The ray always starts at screen centre, so aiming depends on where the camera points rather than where a pointer happens to sit.' },
                        {
                            code: {
                                caption: 'The whole of shooting',
                                lang: 'javascript',
                                text: 'shoot() {\n    const now = performance.now();\n    if (now - this.lastShootTime < 100) return;   // one shot per 100ms\n    this.lastShootTime = now;\n\n    // Pointer is locked, so the crosshair is always (0, 0) in NDC.\n    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);\n\n    if (this.raycaster.intersectObject(this.currentTarget).length > 0) {\n        this.score += 10;\n        this.hits++;\n        this.spawnTarget();      // the next one, the instant this one dies\n    }\n}'
                            }
                        },
                        { p: 'The 100ms limiter is the one piece of design in it. Without it, holding the button down and sweeping the mouse would beat aiming, and the score would measure the mouse.' },
                        { p: 'Three.js and plain JavaScript. No engine, no build step, nothing to install. It runs as a static page.' }
                    ],
                    linkLabel: 'Play it',
                    source2: 'https://github.com/josh2c/aimtraining',
                    linkLabel2: 'Source'
                }
            },
            {
                label: 'GeoLocator',
                href: 'https://github.com/josh2c/geolocatorgame',
                meta: 'Flutter',
                page: {
                    kind: 'Project',
                    standfirst: 'A street-view guessing game. Read the architecture, the signs and the vegetation, then drop a pin on the world map.',
                    tech: ['Flutter', 'Dart', 'Mapbox', 'Mapillary', 'WebView', 'iOS', 'Android'],
                    blocks: [
                        { p: 'You start somewhere in the world at street level with no label and no coordinates. The only evidence is what is in frame. Then you put a pin on a map and find out how wrong you were.' },
                        { p: 'The well-known version of this game runs on Street View, which you cannot build on. This runs on Mapillary, which is open. That one substitution is where the engineering went.' },

                        { h: 'Two map stacks, doing different jobs' },
                        { p: 'The panorama is Mapillary’s viewer inside a WebView. The guessing map is Mapbox, rendered natively. Carrying two mapping dependencies looks like indecision until you try to drop either one. The native SDK has no panorama viewer, and a map you pan and pin inside a WebView feels wrong the moment you touch it. So the app uses a WebView where the web is better and native everywhere else.' },

                        { h: 'Coverage is not guaranteed, so the game searches' },
                        { p: 'Street View covers most places. Mapillary is crowd-sourced, so a random point on the globe often has nothing at all, and some of what it does have is ten years old or shot through a windscreen. Choosing a location is a search rather than a lookup: a bounding box around the candidate point, panoramas only, nothing older than 2019, and the first result that carries a usable image.' },
                        {
                            code: {
                                caption: 'Finding somewhere worth guessing',
                                lang: 'dart',
                                text: "final searchUrl = Uri.parse('https://graph.mapillary.com/images').replace(\n  queryParameters: {\n    'fields': 'id,thumb_1024_url',\n    'limit': '5',\n    // ~2km box around the candidate point, not the point itself\n    'bbox': '${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}',\n    'min_captured_at': '2019-01-01',   // no decade-old imagery\n    'is_pano': 'true',                 // panoramas only, or you cannot look around\n  },\n);"
                            }
                        },
                        { p: 'It asks for five results instead of one, because an image can come back without a usable URL, and a round that fails to load is worse than a round somewhere slightly duller. Tokens load from a .env file at startup rather than being compiled into the bundle.' },
                        { p: 'Scoring uses distance and time together, and a line is drawn between your guess and the answer when the round ends.' }
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
    /* A page is a list of blocks rather than two prose fields with a code
     * block wedged between them. These pages are read by engineers deciding
     * whether the code is worth their time, so an explanation has to be able
     * to sit directly against the lines it is explaining. */
    const html = (p.blocks || []).map((b) => {
        if (b.h) return '<h2>' + esc(b.h) + '</h2>';
        if (b.p) return '<p>' + esc(b.p) + '</p>';
        if (b.code) {
            return '<figure class="doc-term">' +
                '<figcaption>' + esc(b.code.caption || '') +
                    (b.code.lang ? '<span class="doc-lang">' + esc(b.code.lang) + '</span>' : '') +
                '</figcaption>' +
                '<pre><code>' + esc(b.code.text) + '</code></pre>' +
            '</figure>';
        }
        return '';
    }).join('');

    R.open({
        kind: p.kind,
        title: l.label,
        standfirst: p.standfirst,
        shot: p.shot,
        shotAlt: p.shotAlt,
        tech: p.tech,
        html: html,
        source: l.href,
        sourceLabel: (p.linkLabel || 'Open') + ' \u2197',
        source2: p.source2,
        sourceLabel2: p.linkLabel2 ? p.linkLabel2 + ' \u2197' : undefined
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

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

/* "April 1, 2025" into "2025-04-01". A date in a left gutter only works if
 * every one of them is the same width, which prose dates are not. Returns null
 * rather than guessing when the shape is unfamiliar, and the row then simply
 * has no date instead of a wrong one. */
function isoDate(text) {
    const m = /^\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*$/.exec(text || '');
    if (!m) return null;
    const month = MONTHS.indexOf(m[1].toLowerCase());
    if (month < 0) return null;
    return m[3] + '-' + String(month + 1).padStart(2, '0') + '-' + m[2].padStart(2, '0');
}

/* blog.html stays the source of truth. The cover reads the same markup the
 * reader does, so a new post appears here without being listed twice. */
function mountPosts(list) {
    const pending = note(list, 'Loading\u2026');

    fetch('blog.html')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const posts = [...doc.querySelectorAll('.post')].map((el) => {
                const title = el.querySelector('.post-title');
                const link = el.querySelector('.read-more');
                const date = el.querySelector('.date');
                if (!title || !link) return null;
                const raw = date ? date.textContent.trim() : '';
                return {
                    title: title.textContent.trim(),
                    href: link.getAttribute('href'),
                    raw,
                    iso: isoDate(raw)
                };
            }).filter(Boolean);

            if (!posts.length) throw new Error('empty');

            /* Sorted here rather than trusting the order in the page. The
             * markup is hand-maintained and one post is already filed out of
             * sequence; a list with a date column has to be in date order or
             * the column reads as an error. */
            posts.sort((a, b) => (b.iso || '').localeCompare(a.iso || ''));

            pending.remove();
            list.insertAdjacentHTML('beforeend', posts.map((post, i) =>
                '<li><button type="button" class="cv-row cv-item cv-post" data-post="' + i +
                '" title="' + esc(post.title) + (post.raw ? ' \u00b7 ' + esc(post.raw) : '') + '">' +
                '<span class="cv-date">' + esc(post.iso || '') + '</span>' +
                '<span class="cv-label">' + esc(post.title) + '</span>' +
                '</button></li>').join(''));

            list.querySelectorAll('[data-post]').forEach((b) => {
                b.addEventListener('click', () => {
                    const post = posts[Number(b.dataset.post)];
                    if (window.jgReader) {
                        window.jgReader.openPost(post.href, {
                            title: post.title, date: post.raw
                        });
                    }
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
