/* Reader — a post or a skill, opened as a page.
 *
 * One layer serves both, because they are the same thing to a reader: a title,
 * a line of context, and a body. Posts are read out of the real pages, so
 * blog.html and posts/*.html stay the source of truth and keep working as
 * ordinary URLs for direct links and search. Skills hand their body in already
 * rendered (skills.js), since theirs arrives as markdown.
 *
 * Nothing here duplicates the writing, and nothing here is a window: reading
 * is a mode, so it takes the whole surface and gives it back on Escape.
 */

(function () {

const cache = new Map();

/* ---------------------------------------------------------------- layer -- */

let layer = null;
let bodyEl = null;
let titleEl = null;
let kindEl = null;
let metaEl = null;
let standEl = null;
let srcEl = null;
let shotEl = null;
let techEl = null;
let lastFocus = null;
/* A mounted thing (a game) owns timers and an animation loop, so closing the
 * page has to tear it down. A closed page still running would be a real leak. */
let cleanup = null;

function build() {
    if (layer) return;

    layer = document.createElement('div');
    layer.className = 'doc-layer';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    /* Focus lands on the page itself rather than on Back: the dialog still
     * takes focus for the keyboard, without painting a focus ring around a
     * button the mouse user never asked for. */
    layer.tabIndex = -1;
    layer.hidden = true;
    layer.innerHTML =
        '<div class="doc-top">' +
            '<button type="button" class="doc-back">← Back</button>' +
            '<a class="doc-src" target="_blank" rel="noopener noreferrer"></a>' +
        '</div>' +
        '<div class="doc-col">' +
            '<p class="doc-kind"></p>' +
            '<h1 class="doc-title"></h1>' +
            '<p class="doc-standfirst"></p>' +
            '<p class="doc-meta"></p>' +
            '<figure class="doc-shot"><img alt="" loading="lazy" decoding="async"></figure>' +
            '<p class="doc-tech"></p>' +
            '<div class="doc-body"></div>' +
        '</div>';

    document.body.appendChild(layer);

    bodyEl = layer.querySelector('.doc-body');
    titleEl = layer.querySelector('.doc-title');
    kindEl = layer.querySelector('.doc-kind');
    metaEl = layer.querySelector('.doc-meta');
    standEl = layer.querySelector('.doc-standfirst');
    srcEl = layer.querySelector('.doc-src');
    shotEl = layer.querySelector('.doc-shot');
    techEl = layer.querySelector('.doc-tech');

    layer.querySelector('.doc-back').addEventListener('click', close);
}

/* The layer covers the board, which listens for keys of its own, so the
 * handler runs at capture and stops what it handles going any further. */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && layer && !layer.hidden) {
        e.stopPropagation();
        close();
    }
}, true);

function runCleanup() {
    if (typeof cleanup === 'function') {
        try { cleanup(); } catch (err) { /* a game that fails to stop must not trap the page */ }
    }
    cleanup = null;
}

function open(doc) {
    build();
    runCleanup();
    lastFocus = document.activeElement;

    kindEl.textContent = doc.kind || '';
    kindEl.hidden = !doc.kind;

    titleEl.textContent = doc.title || '';

    standEl.textContent = doc.standfirst || '';
    standEl.hidden = !doc.standfirst;

    metaEl.textContent = doc.meta || '';
    metaEl.hidden = !doc.meta;

    /* A screenshot, where there is one worth showing. The alt text is the
     * caption a reader would want if it never loads, not the filename. */
    if (doc.shot) {
        const img = shotEl.querySelector('img');
        img.src = doc.shot;
        img.alt = doc.shotAlt || '';
        shotEl.hidden = false;
    } else {
        shotEl.hidden = true;
    }

    /* What it is built with. A row of plain labels — this is a fact about the
     * project, not a badge collection. */
    if (doc.tech && doc.tech.length) {
        techEl.innerHTML = '<span class="doc-tech-h">Built with</span>' +
            doc.tech.map((t) => '<span class="doc-chip">' +
                String(t).replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) +
                '</span>').join('');
        techEl.hidden = false;
    } else {
        techEl.hidden = true;
    }

    if (doc.source) {
        srcEl.href = doc.source;
        srcEl.textContent = doc.sourceLabel || 'Open page ↗';
        srcEl.hidden = false;
    } else {
        srcEl.hidden = true;
    }

    /* A mounted thing gets a stage to fill; everything else is just markup. */
    let stage = null;
    layer.classList.toggle('is-stage', !!doc.mount);
    if (doc.mount) {
        bodyEl.innerHTML = '<div class="doc-stage"></div>';
        stage = bodyEl.firstElementChild;
        if (doc.stage) {
            stage.style.maxWidth = doc.stage.width + 'px';
            stage.style.height = doc.stage.height + 'px';
        }
    } else {
        bodyEl.innerHTML = doc.html || '';
    }

    layer.hidden = false;
    layer.scrollTop = 0;
    /* Force layout, so the browser has a start value to animate from. A frame
     * callback would do the same, except that frames do not run in a hidden
     * tab — and the class it would add is the only thing that makes the layer
     * visible, so a click landing as the tab goes to the background would open
     * a page nobody can see. */
    void layer.offsetHeight;
    layer.classList.add('is-open');
    layer.focus();

    /* Mounted last, and only once the layer is on screen: a hidden element has
     * no width, and these size their canvas off the stage they are given. */
    if (stage) cleanup = doc.mount(stage) || null;
}

function close() {
    if (!layer || layer.hidden) return;
    layer.classList.remove('is-open');
    runCleanup();
    /* Must outlive the fade in doc.css, or the next open starts mid-flight. */
    setTimeout(() => {
        layer.hidden = true;
        bodyEl.innerHTML = '';
    }, 340);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
}

/* ---------------------------------------------------------------- posts -- */

function get(url) {
    if (cache.has(url)) return Promise.resolve(cache.get(url));
    return fetch(url)
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            cache.set(url, doc);
            return doc;
        });
}

const FILE_NOTE = 'If you are opening this straight from the file system, the browser ' +
    'blocks these reads. Serving the folder over http fixes it.';

function openPost(href, title) {
    open({
        kind: 'Writing',
        title: title || 'Post',
        html: '<p class="doc-note">Loading…</p>',
        source: href,
        sourceLabel: 'Open page ↗'
    });

    get(href).then((doc) => {
        const t = doc.querySelector('.post-title, h1');
        const content = doc.querySelector('.post-content');
        const date = doc.querySelector('.date');
        const cat = doc.querySelector('.category');
        if (!content) throw new Error('no content');

        titleEl.textContent = t ? t.textContent.trim() : (title || 'Post');
        metaEl.textContent = [date && date.textContent.trim(), cat && cat.textContent.trim()]
            .filter(Boolean).join(' · ');
        metaEl.hidden = !metaEl.textContent;
        bodyEl.innerHTML = content.innerHTML;
        layer.scrollTop = 0;
    }).catch(() => {
        bodyEl.innerHTML = '<p>Could not load that post.</p>' +
            '<p class="doc-note">' + FILE_NOTE + '</p>';
    });
}

/* Kept for the board, which links a card straight at a post. */
function openBlog() {
    open({
        kind: 'Writing',
        title: 'Thoughts',
        html: '<p class="doc-note">Loading…</p>',
        source: 'blog.html',
        sourceLabel: 'Open page ↗'
    });

    get('blog.html').then((doc) => {
        const posts = [...doc.querySelectorAll('.post')];
        if (!posts.length) throw new Error('empty');

        bodyEl.innerHTML = '<ul class="doc-index">' + posts.map((p) => {
            const t = p.querySelector('.post-title');
            const link = p.querySelector('.read-more');
            if (!t || !link) return '';
            return '<li><a href="' + link.getAttribute('href') + '">' +
                t.textContent.trim() + '</a></li>';
        }).join('') + '</ul>';

        bodyEl.querySelectorAll('a[href]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                openPost(a.getAttribute('href'), a.textContent.trim());
            });
        });
    }).catch(() => {
        bodyEl.innerHTML = '<p>Could not load the blog.</p>' +
            '<p class="doc-note">' + FILE_NOTE + '</p>';
    });
}

window.jgReader = { open, close, openPost, openBlog };

})();
