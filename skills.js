/* Skills — a skill, read here rather than on GitHub.
 *
 * A skill is a SKILL.md: YAML frontmatter carrying a name and a description,
 * then the instructions themselves. Clicking one on the cover used to hand you
 * to GitHub, which is a code host showing a document — the chrome, the file
 * tree and the raw-blob styling all argue with the thing you came to read.
 * This opens the same file as a document, and keeps the link to the repo for
 * anyone who wants the source.
 *
 * The markdown is rendered here rather than fetched pre-rendered, because
 * GitHub's markdown API is rate-limited for anonymous callers and raw.github
 * is not. What follows is a small renderer covering what these files actually
 * use: headings, fenced and inline code, tables, lists, quotes, rules, links
 * and emphasis. It is deliberately not a complete CommonMark implementation.
 */

(function () {

const RAW = 'https://raw.githubusercontent.com/josh2c/skills/main/skills/';
const REPO = 'https://github.com/josh2c/skills/tree/main/skills/';
const cache = new Map();

/* Placeholders for text lifted out of the document while the rest is
 * rewritten. Spelled out rather than using control characters, so a stray one
 * is visible in the output instead of invisible. */
const FENCE = (n) => '␂FENCE' + n + '␂';
const SPAN = (n) => '␂SPAN' + n + '␂';

const esc = (s) => String(s).replace(/[&<>]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ------------------------------------------------------------ inline --- */

/* Runs on already-escaped text. Code spans are lifted out first and put back
 * last, so a `**` inside backticks stays two asterisks. */
function inline(s) {
    const spans = [];
    s = s.replace(/`([^`]+)`/g, (m, c) => {
        spans.push('<code>' + c + '</code>');
        return SPAN(spans.length - 1);
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s.replace(/␂SPAN(\d+)␂/g, (m, i) => spans[Number(i)]);
}

const cell = (t) => inline(esc(t.trim()));

/* ------------------------------------------------------------- blocks --- */

function render(md) {
    /* Fenced code comes out whole before anything else touches the text —
     * every other rule here would happily reformat its contents. */
    const fences = [];
    md = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (m, body) => {
        fences.push('<pre><code>' +
            esc(body.replace(/\n+$/, '')) + '</code></pre>');
        return FENCE(fences.length - 1);
    });

    const lines = md.split('\n');
    const out = [];
    let i = 0;

    const isFence = (l) => /^␂FENCE\d+␂$/.test(l.trim());
    const isRule = (l) => /^(-{3,}|\*{3,}|_{3,})$/.test(l.trim());
    const isTableSep = (l) => /^\s*\|?[\s:|-]*-[\s:|-]*\|[\s:|-]*$/.test(l);
    const bullet = /^\s*[-*+]\s+(.*)$/;
    const number = /^\s*\d+[.)]\s+(.*)$/;

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { i++; continue; }

        if (isFence(line)) { out.push(line.trim()); i++; continue; }

        if (isRule(line)) { out.push('<hr>'); i++; continue; }

        /* Headings are demoted one level: the skill's name is already the
         * page title, so its own `# name` must not compete with it. */
        const head = /^(#{1,6})\s+(.*)$/.exec(line);
        if (head) {
            const l = Math.min(head[1].length + 1, 6);
            out.push('<h' + l + '>' + cell(head[2]) + '</h' + l + '>');
            i++;
            continue;
        }

        /* Table: a header row, a separator, then rows until the block ends. */
        if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const row = (l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|');
            const th = row(line).map((c) => '<th>' + cell(c) + '</th>').join('');
            i += 2;
            const body = [];
            while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
                body.push('<tr>' + row(lines[i]).map((c) => '<td>' + cell(c) + '</td>').join('') + '</tr>');
                i++;
            }
            /* Wrapped, because a table is the one block here with a width of
               its own and the reading column does not have it to give. */
            out.push('<div class="doc-scroll"><table><thead><tr>' +
                th + '</tr></thead><tbody>' + body.join('') + '</tbody></table></div>');
            continue;
        }

        if (/^>\s?/.test(line)) {
            const buf = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                buf.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            out.push('<blockquote>' + render(buf.join('\n')) + '</blockquote>');
            continue;
        }

        /* Lists. A wrapped continuation line is folded into the item above it
         * rather than starting one of its own. */
        if (bullet.test(line) || number.test(line)) {
            const ordered = !bullet.test(line);
            const pat = ordered ? number : bullet;
            const items = [];
            while (i < lines.length && lines[i].trim() && !isFence(lines[i]) && !isRule(lines[i])) {
                const hit = pat.exec(lines[i]);
                if (hit) items.push(cell(hit[1]));
                else if (items.length) items[items.length - 1] += ' ' + cell(lines[i]);
                else break;
                i++;
            }
            const tag = ordered ? 'ol' : 'ul';
            out.push('<' + tag + '>' +
                items.map((t) => '<li>' + t + '</li>').join('') + '</' + tag + '>');
            continue;
        }

        /* Paragraph: up to a blank line, or to whatever block starts next. */
        const para = [];
        while (i < lines.length && lines[i].trim() && !isFence(lines[i]) && !isRule(lines[i]) &&
               !/^#{1,6}\s/.test(lines[i]) && !/^>\s?/.test(lines[i]) &&
               !bullet.test(lines[i]) && !number.test(lines[i])) {
            para.push(lines[i]);
            i++;
        }
        if (para.length) out.push('<p>' + cell(para.join(' ')) + '</p>');
    }

    return out.join('\n').replace(/␂FENCE(\d+)␂/g, (m, n) => fences[Number(n)]);
}

/* -------------------------------------------------------- frontmatter --- */

/* Enough YAML for the handful of keys these files carry. A value may be
 * quoted, and may run onto following indented lines. */
function split(md) {
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(md);
    if (!m) return { meta: {}, body: md };

    const meta = {};
    let key = null;
    m[1].split('\n').forEach((line) => {
        const hit = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
        if (hit) {
            key = hit[1];
            meta[key] = hit[2].trim().replace(/^["']|["']$/g, '');
        } else if (key && /^\s+\S/.test(line)) {
            meta[key] += ' ' + line.trim();
        }
    });
    return { meta, body: md.slice(m[0].length) };
}

/* --------------------------------------------------------------- page --- */

/* The file's own first heading is usually the skill's name, which the page
 * title and the standfirst below already say twice over. */
function shown(md) {
    const { meta, body } = split(md);
    return {
        /* The standfirst is set as text, not markup — so the backticks a
         * description carries for the model's benefit would show up as
         * backticks. Nothing else in that one line needs formatting. */
        standfirst: (meta.description || '').replace(/`/g, ''),
        html: render(body).replace(/^\s*<h2>[^<]*<\/h2>\s*/, '')
    };
}

/* The frontmatter, without the body. The cover uses it to describe a skill,
 * and to spot the ones that are only a pointer at another. */
function meta(name) {
    if (cache.has(name)) return Promise.resolve(split(cache.get(name)).meta);
    return fetch(RAW + encodeURIComponent(name) + '/SKILL.md')
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
        .then((md) => { cache.set(name, md); return split(md).meta; });
}

window.jgSkills = {
    meta,

    open(name) {
        const R = window.jgReader;
        if (!R) return;

        const page = (extra) => Object.assign({
            kind: 'Skill',
            title: name,
            source: REPO + encodeURIComponent(name),
            sourceLabel: 'View on GitHub \u2197'
        }, extra);

        if (cache.has(name)) { R.open(page(shown(cache.get(name)))); return; }

        R.open(page({ html: '<p class="doc-note">Loading\u2026</p>' }));
        meta(name)
            .then(() => R.open(page(shown(cache.get(name)))))
            .catch(() => R.open(page({
                html: '<p>Could not load this skill.</p>' +
                      '<p class="doc-note">It is on GitHub either way.</p>'
            })));
    }
};

})();
