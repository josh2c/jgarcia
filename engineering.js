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
 *   #/t/<id>      one topic
 *   #/l/<id>      one language
 *   #/e/<id>      one entry
 *   #/now         saved and not yet extracted
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

function home() {
    const ts = topics();

    return '<header class="eng-lead">' +
            '<p class="eng-kind">Engineering</p>' +
            '<h1>How I build with AI</h1>' +
            '<p class="eng-standfirst">The public half of my engineering library: the ' +
            'principles that survived distillation, the people I took them from, and what I ' +
            'am reading now. The working notes stay private — they are operational, and most ' +
            'useful while they are still messy.</p>' +
        '</header>' +

        section('Principles',
            L.PRINCIPLES.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +

        section('Topics',
            ts.map((t) => rowLink('#/t/' + t.id, t.name, t.has ? 'Workflow' : '', '')).join(''),
            { href: '#/prompts', label: 'All prompts →' }) +

        section('Languages',
            L.LANGS.map((l) => rowLink('#/l/' + l.id, l.name,
                l.engineers.length ? l.engineers.length + ' engineers' : '', '')).join('')) +

        section('Sources',
            PUBLIC.map(entryRow).join('')) +

        (QUEUED.length ? section('Now',
            '<p class="eng-note">Saved, not yet extracted. Listed because it is what I am ' +
            'working through — with nothing claimed about it until I have actually read it.</p>' +
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

        section('Topics', (p.topics || []).map((t) =>
            rowLink('#/t/' + t, topicName(t), '', '')).join(''));
}

function entry(id) {
    const e = byId(id);
    if (!e || (e.status !== 'public' && e.status !== 'queued')) return notFound();

    const queued = e.status === 'queued';
    const derived = L.PRINCIPLES.filter((p) => p.source === e.id);

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">' + esc(queued ? 'Queued' : (e.kind === 'technique' ? 'Technique' : 'Source')) + '</p>' +
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
            '<p class="eng-note">Saved, not yet extracted. I have not written up a technique ' +
            'for this, and I am not going to summarise something I have not read properly.</p>' : '') +

        block('lesson', e.by, e.lesson) +
        block('note', null, e.note) +
        block('workflow', null, e.workflow) +
        block('rec', null, e.rec) +

        section('Principles from this',
            derived.map((p) => rowLink('#/p/' + p.id, p.title, '', '')).join('')) +

        section('Filed under',
            (e.topics || []).map((t) => rowLink('#/t/' + t, topicName(t), '', '')).join('') +
            (e.langs || []).map((l) => {
                const lg = langById(l);
                return lg ? rowLink('#/l/' + lg.id, lg.name, '', '') : '';
            }).join(''));
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
            '<h2 class="eng-sec-h">The prompt I use</h2>' +
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
            'principles are what I point a model at — see ' +
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
            '<h2 class="eng-sec-h">The review prompt I use</h2>' +
            '<pre class="eng-pre"><code>' + esc(l.prompt) + '</code></pre>' +
        '</section>' : '') +

        section('Sources', es.map(entryRow).join(''));
}

/* Every prompt in the library, gathered. They live on their own pages; this
 * is only an index, because "which prompt do I want" is a question people
 * arrive with and it is otherwise answerable only by opening every topic. */
function prompts() {
    const fromTopics = (L.PRACTICES || []).filter((w) => w.prompt)
        .map((w) => ({ href: '#/t/' + w.topic, name: topicName(w.topic), meta: 'Topic' }));
    const fromLangs = L.LANGS.filter((l) => l.prompt)
        .map((l) => ({ href: '#/l/' + l.id, name: l.name, meta: 'Language' }));
    const all = fromTopics.concat(fromLangs);

    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Prompts</p>' +
            '<h1>The prompts I actually use</h1>' +
            '<p class="eng-standfirst">' + all.length + ' of them. Most are shaped the same ' +
            'way — say what to look at, in what order, and what not to decide alone.</p>' +
        '</header>' +
        section('Review and workflow', fromTopics.map((r) =>
            rowLink(r.href, r.name, r.meta, '')).join('')) +
        section('By language', fromLangs.map((r) =>
            rowLink(r.href, r.name, r.meta, '')).join(''));
}

function now() {
    return back() +
        '<header class="eng-lead">' +
            '<p class="eng-kind">Now</p>' +
            '<h1>What I am working through</h1>' +
            '<p class="eng-standfirst">Saved, not yet extracted. Nothing is claimed about ' +
            'any of it until I have read it properly and written the technique down.</p>' +
        '</header>' +
        section('Queue', QUEUED.map((e) => rowLink('#/e/' + e.id, e.title, e.by || '', '')).join(''));
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
        section('Topics', ws.map((w) => rowLink('#/t/' + w.topic, topicName(w.topic), 'Workflow', '')).join('')) +
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
    if (kind === 'p') html = principle(arg);
    else if (kind === 't') html = topic(arg);
    else if (kind === 'l') html = language(arg);
    else if (kind === 'e') html = entry(arg);
    else if (kind === 'q') html = search(arg);
    else if (kind === 'now') html = now();
    else if (kind === 'prompts') html = prompts();
    else html = home();

    view.innerHTML = html;
    if (scroller) scroller.scrollTop = 0;

    /* The box reflects the URL, so a shared search link arrives filled in. */
    if (searchEl && kind !== 'q') searchEl.value = '';
    if (searchEl && kind === 'q' && searchEl.value !== arg) searchEl.value = arg;

    document.title = (kind ? view.querySelector('h1').textContent + ' · ' : '') +
        'Engineering · Josh Garcia';
}

window.addEventListener('hashchange', render);

if (searchEl) {
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
