/* Desktop — the landing page behaves like an OS desktop.
 *
 * Folders, files and dock tools are all data-driven below. Opening any of them
 * shows a window; games are mounted from the shared games.js.
 */

/* ---------------------------------------------------------------- data --- */

const FOLDERS = [
    {
        name: 'Trezure',
        title: 'Trezure',
        body: 'Football-first fantasy: season-long leagues, weekly contests, and player-card collecting. Built with Flutter, on iOS and Android.',
        links: [{ label: 'playtrezure.com', href: 'https://playtrezure.com', meta: 'Live' },
                { label: 'Pitch deck', href: 'pitch.html', meta: 'PDF' }]
    },
    {
        name: 'Busy Cab',
        title: 'Busy Cab',
        body: 'A free browser arcade taxi game. Pick up passengers, floor it, get paid. Standard, Chaos and Zombie modes, with a career and a leaderboard.',
        links: [{ label: 'busycabgame.com', href: 'https://busycabgame.com', meta: 'Live' }]
    },
    {
        name: 'Bemore Labz',
        title: 'Bemore Labz',
        body: 'Chaos into systems. Ambition into software that lasts. A product and engineering lab.',
        links: [{ label: 'bemorelabz.com', href: 'https://bemorelabz.com', meta: 'Live' }]
    },
    {
        name: 'Projects',
        title: 'Projects',
        body: 'Everything in one place — pan around the board to see the work, the things I like, and a few playable toys.',
        links: [{ label: 'Open the board', href: 'board.html', meta: 'Interactive' }]
    },
    {
        name: 'Thoughts',
        title: 'Thoughts',
        body: 'Twenty-two posts on innovation, leadership, productivity and sport. Working with the garage door up.',
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

/* -------------------------------------------------------------- window --- */

const win = document.getElementById('window');
const scrim = document.getElementById('scrim');
const winTitle = document.getElementById('window-title');
const winBody = document.getElementById('window-body');
let activeCleanup = null;
let lastFocus = null;

function showWindow(title) {
    closeWindow();
    lastFocus = document.activeElement;
    winTitle.textContent = title;
    // Unhide before filling: the games size their canvas off the body width,
    // which is 0 while the window is still hidden.
    win.hidden = false;
    scrim.hidden = false;
}

function openFolder(i) {
    const f = FOLDERS[i];
    showWindow(f.title);
    const links = f.links.map((l) => {
        const ext = /^https?:/.test(l.href);
        return '<li><a href="' + l.href + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            '<span>' + l.label + (ext ? ' →' : '') + '</span>' +
            '<span class="dt-link-meta">' + l.meta + '</span></a></li>';
    }).join('');
    winBody.innerHTML = '<p>' + f.body + '</p><ul class="dt-links">' + links + '</ul>';
}

function openFile(i) {
    const f = FILES[i];
    showWindow(f.title);
    winBody.innerHTML = '<img src="' + f.src + '" alt="' + f.title + '">' +
        '<p class="bw-note">' + f.body + '</p>';
}

function openGame(i) {
    const d = DOCK[i];
    showWindow(d.name);
    if (d.game === 'pong') activeCleanup = mountPong(winBody);
    else if (d.game === 'paint') activeCleanup = mountPaint(winBody);
}

document.getElementById('trash').addEventListener('click', () => {
    showWindow('Trash');
    winBody.innerHTML = '<p>Empty.</p>' +
        '<p class="bw-note">Nothing thrown away yet.</p>';
});

function closeWindow() {
    if (activeCleanup) { activeCleanup(); activeCleanup = null; }
    winBody.innerHTML = '';
    win.hidden = true;
    scrim.hidden = true;
    if (lastFocus && document.contains(lastFocus)) { lastFocus.focus(); lastFocus = null; }
}

document.getElementById('window-close').addEventListener('click', closeWindow);
scrim.addEventListener('click', closeWindow);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !win.hidden) closeWindow();
});

/* --------------------------------------------------------------- clock --- */

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
