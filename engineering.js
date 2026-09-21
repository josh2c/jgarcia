/* Engineering — the library, rendered.
 *
 * One column, one page, hash routes. No sidebar and no tree: the ways in are
 * principles, topics, languages and search, and every one of them is a query
 * over the same flat list of entries. Nothing is duplicated to appear in two
 * places, and no page exists that does not have content behind it.
 *
 * Views:
 *   #/            home — principles, topics, languages, now
 *   #/p/<id>      one principle, and what it came from
 *   #/a/<id>      one area, topics as sections
 *   #/l/<id>      one language
 *   #/e/<id>      one entry
 *   #/reading     saved links I have not read yet
 *   #/q/<query>   search
 */

(function () {

const L = window.jgLibrary;
const view = document.getElementById('eng-view');
const scroller = document.getElementById('eng-scroll');
const searchEl = document.getElementById('eng-search');
if (!L || !view) return;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Only these are ever rendered. `queued` is public but carries no claims, so
 * it is deliberately excluded from everything except Now. */
const PUBLIC = L.ENTRIES.filter((e) => e.status === 'public');
const QUEUED = L.ENTRIES.filter((e) => e.status === 'queued');

const byId = (id) => L.ENTRIES.find((e) => e.id === id);
const principleById = (id) => L.PRINCIPLES.find((p) => p.id === id);
const langById = (id) => L.LANGS.find((l) => l.id === id);

/* A topic exists because entries carry it, not because it is in a list. */
function topics() {
    const count = {};
    const bump = (t, n) => { count[t] = (count[t] || 0) + n; };

    PUBLIC.forEach((e) => (e.topics || []).forEach((t) => bump(t, 1)));
    L.PRINCIPLES.forEach((p) => (p.topics || []).forEach((t) => bump(t, 1)));
    /* A written-up practice is reason enough for a topic to exist — those are
     * the pages worth landing on even before a source is filed under them. */
    (L.PRACTICES || []).forEach((w) => bump(w.topic, 1));

    return Object.keys(count)
        .sort((a, b) => count[b] - count[a] || a.localeCompare(b))
        .map((id) => ({ id, name: L.TOPIC_NAMES[id] || id, has: !!practiceFor(id) }));
}

const practiceFor = (t) => (L.PRACTICES || []).find((w) => w.topic === t);
const areaById = (id) => (L.AREAS || []).find((a) => a.id === id);
const areaForTopic = (t) => (L.AREAS || []).find((a) => a.topics.includes(t));

/* Topics are sections now, so anything that used to point at a topic points at
 * the area holding it, deduplicated. */
function areaLinks(topicIds) {
    const seen = [];
    (topicIds || []).forEach((t) => {
        const a = areaForTopic(t);
        if (a && !seen.some((x) => x.id === a.id)) seen.push(a);
    });
    return seen.map((a) => rowLink('#/a/' + a.id, a.name, '', '')).join('');
}

const topicName = (id) => L.TOPIC_NAMES[id] || id;
const entriesForTopic = (t) => PUBLIC.filter((e) => (e.topics || []).includes(t));
const entriesForLang = (l) => PUBLIC.filter((e) => (e.langs || []).includes(l));

/* ------------------------------------------------------------- fragments -- */

const rowLink = (href, label, meta, sub) =>
    '<a class="eng-row" href="' + href + '">' +
        '<span class="eng-row-main">' +
            '<span class="eng-row-label">' + esc(label) + '</span>' +
            (sub ? '<span class="eng-row-sub">' + esc(sub) + '</span>' : '') +
        '</span>' +
        (meta ? '<span class="eng-row-meta">' + esc(meta) + '</span>' : '') +
    '</a>';

const entryRow = (e) => rowLink('#/e/' + e.id, e.title, e.by || '', '');

/* Every block that is somebody's words is labelled with whose. This is the
 * whole point of the field split in library.js — the renderer never has to
 * decide, because the field already decided. */
function block(kind, who, text) {
    if (!text) return '';
    return '<section class="eng-block eng-block-' + kind + '">' +
        '<h3 class="eng-block-h">' + esc(kind === 'lesson' ? 'The technique' :
            kind === 'note' ? 'My notes' :
            kind === 'workflow' ? 'How I apply it' : 'Why I recommend it') +
            (who ? '<span class="eng-by">' + esc(who) + '</span>' : '') +
        '</h3>' +
        '<p>' + esc(text) + '</p>' +
    '</section>';
}

const section = (title, body, more) => body ?
    '<section class="eng-sec">' +
        '<h2 class="eng-sec-h">' + esc(title) +
        (more ? '<a class="eng-more" href="' + more.href + '">' + esc(more.label) + '</a>' : '') +
        '</h2>' + body +
    '</section>' : '';

/* ----------------------------------------------------------------- views -- */

/* Topics grouped by area. An empty area is skipped, and anything not filed
 * into one still shows up under Elsewhere rather than vanishing quietly when a
 * new topic is added. */
/* One row per area, with what is inside it as the subtitle rather than as
 * twenty-one more links. */
function areaRows(ts) {
    const have = new Set(ts.map((t) => t.id));
    return (L.AREAS || []).map((a) => {
        const inside = a.topics.filter((t) => have.has(t)).map(topicName);
        if (!inside.length) return '';
        return rowLink('#/a/' + a.id, a.name, '', inside.join(' \u00b7 '));
    }).join('');
}

function home() {
    const ts = topics();

    return '<header class="eng-lead">' +
            '<p class="eng-kind">Engineering</p>' +
            '<h1>How I build with AI</h1>' +
            '<p class="eng-standfirst">Notes on using AI to build software. What I have ' +
            'settled on, where it came from, and what I am reading now. The working version ' +
            'of this lives in my own notes, which change too often to be worth publishing.</p>' +
        '</header>' +

        section('Principles',
            L.PRINCIPLES.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +

        section('Areas', areaRows(ts)) +

        /* Its own section rather than a link tucked beside a heading. These
         * are one of the two things people actually come here for, and they
         * were reachable only by noticing a small link. */
        section('Base prompts',
            startingPoints().map((r) =>
                rowLink('#/prompts/' + r.id, r.name, '', r.where)).join(''),
            { href: '#/prompts', label: 'Read them all →' }) +

        section('Languages',
            L.LANGS.map((l) => rowLink('#/l/' + l.id, l.name,
                l.engineers.length ? l.engineers.length + ' engineers' : '', '')).join('')) +

        section('Sources',
            PUBLIC.map(entryRow).join('')) +

        (QUEUED.length ? section('Reading list',
            '<p class="eng-note">Saved and not read yet. None of it counts as a ' +
            'recommendation until I have been through it.</p>' +
            QUEUED.map((e) => rowLink('#/e/' + e.id, e.title, e.by || '', '')).join('')) : '');
}

function principle(id) {
    const p = principleById(id);
    if (!p) return notFound();

    const src = p.source ? byId(p.source) : null;
    const related = PUBLIC.filter((e) =>
        e.id !== p.source && (e.topics || []).some((t) => (p.topics || []).includes(t)));

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Principle</p>' +
            '<h1>' + esc(p.title) + '</h1>' +
            '<p class="eng-standfirst">' + esc(p.body) + '</p>' +
        '</header>' +

        /* Where a principle came from somebody else, it says so here, at the
         * top, before anything else. */
        (src ? '<div class="eng-credit">' +
            'Adopted from <a href="#/e/' + src.id + '">' + esc(src.title) + '</a>' +
            (src.by ? ' by ' + esc(src.by) : '') + '.' +
        '</div>' : '') +

        '<p class="eng-note">From my notes on ' + esc(p.from) + '.</p>' +

        section('Related sources', related.length ? related.map(entryRow).join('') : '') +

        section('Filed under', areaLinks(p.topics));
}

function entry(id) {
    const e = byId(id);
    if (!e || (e.status !== 'public' && e.status !== 'queued')) return notFound();

    const queued = e.status === 'queued';
    const derived = L.PRINCIPLES.filter((p) => p.source === e.id);

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">' + esc(queued ? 'Unread' : (e.kind === 'technique' ? 'Technique' : 'Source')) + '</p>' +
            '<h1>' + esc(e.title) + '</h1>' +
            (e.by ? '<p class="eng-byline">' + esc(e.by) + '</p>' : '') +
        '</header>' +

        (e.url ? '<p class="eng-links">' +
            '<a class="eng-out" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' +
            'Read the original ↗</a>' +
            (e.url2 ? ' <a class="eng-out" href="' + esc(e.url2) + '" target="_blank" rel="noopener noreferrer">' +
                esc(e.url2Label || 'Also ↗') + '</a>' : '') +
        '</p>' : '') +

        (queued ?
            '<p class="eng-note">Saved and not read yet. I have not written anything up for ' +
            'it, and I am not going to summarise something I have not read.</p>' : '') +

        block('lesson', e.by, e.lesson) +
        block('note', null, e.note) +
        block('workflow', null, e.workflow) +
        block('rec', null, e.rec) +

        section('Principles from this',
            derived.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +

        section('Filed under',
            areaLinks(e.topics) +
            (e.langs || []).map((l) => {
                const lg = langById(l);
                return lg ? rowLink('#/l/' + lg.id, lg.name, '', '') : '';
            }).join(''));
}

/* An area page: its topics as sections, then everything filed under any of
 * them. This is the level with enough on it to be worth opening. */
function area(id) {
    const a = areaById(id);
    if (!a) return notFound();

    const inside = a.topics.filter((t) => practiceFor(t) || entriesForTopic(t).length ||
        L.PRINCIPLES.some((pr) => (pr.topics || []).includes(t)));

    const body = inside.map((t) => {
        const w = practiceFor(t);
        return '<h2 class="eng-topic-h" id="sec-' + esc(t) + '">' + esc(topicName(t)) + '</h2>' +
            (w && w.intro ? '<p class="eng-topic-intro">' + esc(w.intro) + '</p>' : '') +
            practice(w);
    }).join('');

    /* Only where there is something to jump between. A contents list above a
     * single section is furniture. These are buttons rather than anchors on
     * purpose: an href of #sec-x would overwrite the route in the address bar
     * and send the router somewhere it does not recognise. */
    const toc = inside.length > 1 ?
        '<nav class="eng-toc">' + inside.map((t) =>
            '<button type="button" data-jump="sec-' + esc(t) + '">' +
            esc(topicName(t)) + '</button>').join('') + '</nav>' : '';

    const ps = L.PRINCIPLES.filter((pr) => (pr.topics || []).some((t) => a.topics.includes(t)));
    const es = PUBLIC.filter((e) => (e.topics || []).some((t) => a.topics.includes(t)));

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Area</p>' +
            '<h1>' + esc(a.name) + '</h1>' +
            (a.intro ? '<p class="eng-standfirst">' + esc(a.intro) + '</p>' : '') +
        '</header>' +
        toc +
        body +
        section('Principles', ps.map((pr) => rowLink('#/p/' + pr.id, pr.title, '', '')).join('')) +
        section('Sources', es.map(entryRow).join(''));
}

function topic(id) {
    const es = entriesForTopic(id);
    const ps = L.PRINCIPLES.filter((p) => (p.topics || []).includes(id));
    const w = practiceFor(id);
    if (!es.length && !ps.length && !w) return notFound();

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Topic</p>' +
            '<h1>' + esc(topicName(id)) + '</h1>' +
            (w && w.intro ? '<p class="eng-standfirst">' + esc(w.intro) + '</p>' : '') +
        '</header>' +
        practice(w) +
        section('Principles', ps.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +
        section('Sources', es.map(entryRow).join(''));
}

/* The distilled workflow. `flow` is a sequence and reads as one; `checks` is
 * an unordered list of things to look at and must not pretend to be ordered. */
function practice(w) {
    if (!w) return '';

    const flow = w.flow && w.flow.length ?
        '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">The sequence</h2>' +
            '<ol class="eng-flow">' + w.flow.map((f) =>
                '<li>' + esc(f) + '</li>').join('') + '</ol>' +
        '</section>' : '';

    const checks = w.checks && w.checks.length ?
        '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">What I look at</h2>' +
            '<ul class="eng-list">' + w.checks.map((c) =>
                '<li>' + esc(c) + '</li>').join('') + '</ul>' +
        '</section>' : '';

    const rule = w.rule ?
        '<p class="eng-rule">' + esc(w.rule) + '</p>' : '';

    /* A table with no rows is a format, not data — the head alone is the
     * point, so it renders as an empty shape rather than being skipped. */
    const t = w.table;
    const table = t ?
        '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">' + esc(t.caption) + '</h2>' +
            '<div class="eng-scrollx"><table class="eng-table">' +
                '<thead><tr>' + t.head.map((h) =>
                    '<th>' + esc(h) + '</th>').join('') + '</tr></thead>' +
                (t.rows && t.rows.length ? '<tbody>' + t.rows.map((r) =>
                    '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') +
                    '</tbody>' : '') +
            '</table></div>' +
            (t.note ? '<p class="eng-note eng-note-t">' + esc(t.note) + '</p>' : '') +
        '</section>' : '';

    const prompt = w.prompt ?
        '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">Base prompt</h2>' +
            STARTER_NOTE +
            '<pre class="eng-pre"><code>' + esc(w.prompt) + '</code></pre>' +
        '</section>' : '';

    return rule + flow + table + checks + prompt;
}

function language(id) {
    const l = langById(id);
    if (!l) return notFound();
    const es = entriesForLang(id);

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Language</p>' +
            '<h1>' + esc(l.name) + '</h1>' +
            (l.philosophy ? '<p class="eng-standfirst">' + esc(l.philosophy) + '</p>' : '') +
        '</header>' +

        (l.engineers.length ? '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">Reference engineers</h2>' +
            '<p class="eng-note">Not people to imitate. Their documented design ' +
            'principles are what I point a model at. See ' +
            '<a href="#/p/reference-not-imitation">reference, do not imitate</a>.</p>' +
            l.engineers.map((n) =>
                '<div class="eng-row eng-row-static">' +
                    '<span class="eng-row-main">' +
                        '<span class="eng-row-label">' + esc(n.name) + '</span>' +
                        '<span class="eng-row-sub">' + esc(n.what) + '</span>' +
                    '</span>' +
                '</div>').join('') +
            (l.source ? '<p class="eng-note">' + esc(l.source) +
                (l.sourceUrl ? ' <a href="' + esc(l.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Source ↗</a>' : '') +
                '</p>' : '') +
        '</section>' : '') +

        (l.areas && l.areas.length ? '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">Point them at</h2>' +
            '<p class="eng-tags">' + l.areas.map((a) =>
                '<span class="eng-tag">' + esc(a) + '</span>').join('') + '</p>' +
        '</section>' : '') +

        (l.rules && l.rules.length ? '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">Rules</h2>' +
            '<ul class="eng-list">' + l.rules.map((r) =>
                '<li>' + esc(r) + '</li>').join('') + '</ul>' +
        '</section>' : '') +

        (l.prompt ? '<section class="eng-sec">' +
            '<h2 class="eng-sec-h">Base prompt</h2>' +
            STARTER_NOTE +
            '<pre class="eng-pre"><code>' + esc(l.prompt) + '</code></pre>' +
        '</section>' : '') +

        section('Sources', es.map(entryRow).join(''));
}

/* The starting points, gathered once and used by both the home page and the
 * page that prints them. */
function startingPoints() {
    const fromAreas = (L.PRACTICES || []).filter((w) => w.prompt).map((w) => ({
        id: w.topic,
        name: topicName(w.topic),
        where: (areaForTopic(w.topic) || {}).name || '',
        href: '#/a/' + ((areaForTopic(w.topic) || {}).id || ''),
        text: w.prompt
    }));
    const fromLangs = L.LANGS.filter((l) => l.prompt).map((l) => ({
        id: l.id, name: l.name, where: 'Language', href: '#/l/' + l.id, text: l.prompt
    }));
    return fromAreas.concat(fromLangs);
}

/* The caveat, wherever a prompt is shown. It is the opening move on a run, not
 * a macro: every one of them needs the project's own constraints pasted in
 * before it is worth sending. */
const STARTER_NOTE = '<p class="eng-note">I don\u2019t send these as-is. Each one gets ' +
    'the project\u2019s own constraints and conventions pasted in first.</p>';

/* Every starting point, printed rather than linked. It was a list of eleven
 * links to pages reachable from the home page anyway, which is the same
 * signpost problem the topic pages had. The prompts themselves are the one
 * thing here you would want in a single place, so the page shows them. */
function prompts() {
    const all = startingPoints();

    const block = (r) =>
        '<h2 class="eng-topic-h">' + esc(r.name) + '</h2>' +
        '<p class="eng-topic-from">' + esc(r.where) +
            ' \u00b7 <a href="' + r.href + '">in context \u2192</a></p>' +
        '<pre class="eng-pre"><code>' + esc(r.text) + '</code></pre>';

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Base prompts</p>' +
            '<h1>Prompts I start from</h1>' +
            '<p class="eng-standfirst">Eleven of them, in full. I don\u2019t run these ' +
            'as-is. Each one gets the project\u2019s constraints and conventions pasted in ' +
            'first, plus whatever is out of scope. They are all built the same way: say what ' +
            'to look at, in what order, and what not to decide without me.</p>' +
        '</header>' +
        '<nav class="eng-toc">' + all.map((r) =>
            '<button type="button" data-jump="sp-' + esc(r.id) + '">' +
            esc(r.name) + '</button>').join('') + '</nav>' +
        all.map((r) => '<div id="sp-' + esc(r.id) + '">' + block(r) + '</div>').join('');
}

function now() {
    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Reading list</p>' +
            '<h1>What I have not read yet</h1>' +
            '<p class="eng-standfirst">Links I have saved and not got to. Until I have been ' +
            'through one, there is nothing here worth quoting and I am not recommending it.</p>' +
        '</header>' +
        section('Saved', QUEUED.map((e) => rowLink('#/e/' + e.id, e.title, e.by || '', '')).join(''));
}

/* Substring match over everything a person might reasonably type: titles,
 * authors, the prose, the tags, the language names. Small enough that an
 * index would be more machinery than the problem deserves. */
function search(q) {
    const needle = q.toLowerCase().trim();
    if (!needle) return home();

    const hit = (s) => String(s || '').toLowerCase().includes(needle);

    const es = PUBLIC.filter((e) =>
        hit(e.title) || hit(e.by) || hit(e.lesson) || hit(e.note) || hit(e.workflow) ||
        hit(e.rec) || (e.topics || []).some((t) => hit(t) || hit(topicName(t))) ||
        (e.langs || []).some(hit));

    const ps = L.PRINCIPLES.filter((p) => hit(p.title) || hit(p.body) || hit(p.from));

    const ws = (L.PRACTICES || []).filter((w) => hit(topicName(w.topic)) || hit(w.intro) ||
        hit(w.rule) || hit(w.prompt) || (w.flow || []).some(hit) || (w.checks || []).some(hit));

    const ls = L.LANGS.filter((l) => hit(l.name) || hit(l.philosophy) ||
        (l.engineers || []).some((n) => hit(n.name) || hit(n.what)) ||
        hit(l.prompt) || (l.areas || []).some(hit));

    const total = es.length + ps.length + ls.length + ws.length;

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Search</p>' +
            '<h1>' + esc(q) + '</h1>' +
            '<p class="eng-standfirst">' + total + (total === 1 ? ' result' : ' results') + '</p>' +
        '</header>' +
        section('Principles', ps.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +
        section('Areas', areaLinks(ws.map((w) => w.topic))) +
        section('Languages', ls.map((l) => rowLink('#/l/' + l.id, l.name, '', '')).join('')) +
        section('Sources', es.map(entryRow).join('')) +
        (total ? '' : '<p class="eng-note">Nothing yet. The library is small on purpose ' +
            'and grows as I extract things properly.</p>');
}

const back = () => '<a class="eng-back" href="#/">← Library</a>';

const notFound = () => back() +
    '<header class="eng-lead"><h1>Not here</h1>' +
    '<p class="eng-standfirst">That page does not exist, or is not public.</p></header>';

/* ---------------------------------------------------------------- router -- */

function render() {
    const hash = location.hash.replace(/^#\/?/, '');
    const [kind, ...rest] = hash.split('/');
    const arg = decodeURIComponent(rest.join('/') || '');

    let html;
    /* Topics are sections inside an area now. Old links still work: they land
     * on the area that holds the topic. */
    if (kind === 't') {
        const holder = areaForTopic(arg);
        if (holder) { location.replace('#/a/' + holder.id); return; }
    }

    if (kind === 'p') html = principle(arg);
    else if (kind === 'a') html = area(arg);
    else if (kind === 'l') html = language(arg);
    else if (kind === 'e') html = entry(arg);
    else if (kind === 'q') html = search(arg);
    else if (kind === 'reading' || kind === 'now') html = now();
    else if (kind === 'prompts') html = prompts();
    else html = home();

    view.innerHTML = html;
    if (scroller) scroller.scrollTop = 0;

    /* #/prompts/<id> lands on that one rather than the top of the page. */
    if (kind === 'prompts' && arg) {
        const target = document.getElementById('sp-' + arg);
        if (target && scroller) {
            scroller.scrollTop = target.getBoundingClientRect().top + scroller.scrollTop - 24;
        }
    }

    /* The box reflects the URL, so a shared search link arrives filled in. */
    if (searchEl && kind !== 'q') searchEl.value = '';
    if (searchEl && kind === 'q' && searchEl.value !== arg) searchEl.value = arg;

    document.title = (kind ? view.querySelector('h1').textContent + ' · ' : '') +
        'Engineering · Josh Garcia';
}

/* Delegated, because render() replaces the view on every route change. */
view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-jump]');
    if (!b) return;
    const target = document.getElementById(b.dataset.jump);
    if (!target || !scroller) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const y = target.getBoundingClientRect().top + scroller.scrollTop - 24;
    scroller.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
});

window.addEventListener('hashchange', render);

if (searchEl) {
    /* "Search the library" does not fit a phone, and a clipped placeholder
     * reads as a broken input rather than a narrow one. */
    const narrow = window.matchMedia('(max-width: 640px)');
    const setPlaceholder = () => {
        searchEl.placeholder = narrow.matches ? 'Search' : 'Search the library';
    };
    setPlaceholder();
    if (narrow.addEventListener) narrow.addEventListener('change', setPlaceholder);
    else if (narrow.addListener) narrow.addListener(setPlaceholder);

    let t = null;
    searchEl.addEventListener('input', () => {
        clearTimeout(t);
        /* Typing rewrites the hash, so every search is a real URL you can send
         * to someone. Debounced so it does not write one per keystroke. */
        t = setTimeout(() => {
            const q = searchEl.value.trim();
            location.hash = q ? '#/q/' + encodeURIComponent(q) : '#/';
        }, 220);
    });
    searchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { searchEl.value = ''; location.hash = '#/'; searchEl.blur(); }
    });
}

render();

})();
