/* A DOM small enough to run the games in, and a clock I can wind forward.
 * Not a browser — no layout, no painting — but enough to catch the errors that
 * only appear when the code actually executes: a null querySelector, a method
 * that does not exist, a timer that fires into a torn-down game. */

let ids = 0;

function parse(html) {
    const out = [];
    const stack = [{ children: out }];
    const re = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(html))) {
        const [, close, tag, attrs, selfClose, text] = m;
        if (text != null) {
            const t = text.trim();
            if (t) stack[stack.length - 1].children.push({ text: t });
            continue;
        }
        if (close) { if (stack.length > 1) stack.pop(); continue; }
        const el = makeEl(tag);
        for (const a of attrs.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) el.setAttribute(a[1], a[2]);
        const parent = stack[stack.length - 1];
        el.parent = parent.tag ? parent : null;
        parent.children.push(el);
        if (!selfClose && !/^(br|img|input|circle|rect|path|hr)$/i.test(tag)) stack.push(el);
    }
    return out;
}

function makeEl(tag) {
    const el = {
        tag: String(tag).toLowerCase(),
        id: ++ids,
        children: [],
        attrs: {},
        style: { setProperty() {}, removeProperty() {} },
        listeners: {},
        _attrsRef: null,
        _classes: new Set(),
        value: '',
        disabled: false,
        hidden: false,
        _text: null,
        parent: null
    };
    /* Reading it has to walk the parsed children too. Returning only what was
     * assigned made every element built from innerHTML look empty. */
    Object.defineProperty(el, 'textContent', {
        get: () => {
            if (el._text !== null) return el._text;
            let out = '';
            const walk = (n) => n.children.forEach((c) => {
                if (c.text) out += c.text + ' ';
                else if (c.tag) walk(c);
            });
            walk(el);
            return out.trim();
        },
        set: (v) => { el._text = String(v); el.children = []; }
    });
    /* In a real DOM `el.dataset.id = 'x'` sets the data-id ATTRIBUTE, which is
       what [data-id="x"] selectors then match on. A plain object does not, so
       any code that writes a dataset and reads it back by selector silently
       finds nothing. */
    el._attrsRef = el.attrs;
    el.dataset = new Proxy({}, {
        set(t, k, v) {
            t[k] = String(v);
            el._attrsRef['data-' + String(k).replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())] = String(v);
            return true;
        },
        get(t, k) { return t[k]; },
        has(t, k) { return k in t; },
        deleteProperty(t, k) { delete t[k]; return true; }
    });

    el.classList = {
        add: (...c) => c.forEach((x) => el._classes.add(x)),
        remove: (...c) => c.forEach((x) => el._classes.delete(x)),
        toggle: (c, on) => (on === undefined ? (el._classes.has(c) ? el._classes.delete(c) : el._classes.add(c))
            : (on ? el._classes.add(c) : el._classes.delete(c))),
        contains: (c) => el._classes.has(c)
    };
    Object.defineProperty(el, 'className', {
        get: () => [...el._classes].join(' '),
        set: (v) => { el._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
    });
    Object.defineProperty(el, 'innerHTML', {
        get: () => '',
        set: (v) => { el.children = parse(String(v)); el.children.forEach((c) => { if (c.tag) c.parent = el; }); }
    });
    Object.defineProperty(el, 'tagName', { get: () => el.tag.toUpperCase() });
    Object.defineProperty(el, 'offsetWidth', { get: () => 100 });
    el.setAttribute = (k, v) => {
        el.attrs[k] = v;
        if (k === 'class') el.className = v;
        if (k.startsWith('data-')) el.dataset[k.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = v;
        if (k === 'type') el.type = v;
    };
    el.getAttribute = (k) => el.attrs[k];
    el.appendChild = (c) => { c.parent = el; el.children.push(c); return c; };
    el.insertBefore = (c, ref) => {
        c.parent = el;
        const i = el.children.indexOf(ref);
        if (i < 0) el.children.push(c); else el.children.splice(i, 0, c);
        return c;
    };
    el.insertAdjacentHTML = (where, html) => {
        const kids = parse(String(html));
        kids.forEach((k) => { if (k.tag) k.parent = el; });
        if (where === 'afterbegin') el.children.unshift(...kids);
        else el.children.push(...kids);
    };
    el.remove = () => {};
    el.focus = () => {};
    el.blur = () => {};
    el.setPointerCapture = () => {};
    el.releasePointerCapture = () => {};
    el.getBoundingClientRect = () => ({ width: 400, height: 320, top: 0, left: 0 });
    el.getContext = () => ctx2d;
    el.addEventListener = (t, fn) => { (el.listeners[t] ||= []).push(fn); };
    el.removeEventListener = (t, fn) => {
        el.listeners[t] = (el.listeners[t] || []).filter((f) => f !== fn);
    };
    el.dispatch = (type, ev = {}) => {
        const e = Object.assign({ type, target: el, preventDefault() {}, stopPropagation() {} }, ev);
        (el.listeners[type] || []).forEach((fn) => fn(e));
    };
    el.walk = function* () { yield el; for (const c of el.children) if (c.tag) yield* c.walk(); };
    el.querySelectorAll = (sel) => {
        const parts = sel.split(',').map((s) => s.trim());
        const one = (n, t) => {
            if (t.startsWith('.')) return n._classes.has(t.slice(1));
            if (t.startsWith('#')) return n.attrs.id === t.slice(1);
            if (t.startsWith('[')) {
                const m = /^\[([\w-]+)(?:=["']?(.*?)["']?)?\]$/.exec(t);
                if (!m) return false;
                return m[2] === undefined ? m[1] in n.attrs
                    : String(n.attrs[m[1]]) === m[2].replace(/\\(.)/g, '$1');
            }
            return n.tag === t;
        };
        /* Descendant selectors have to walk up. Matching only the last part
         * made ".mg-opts button" match every button on the stage, including
         * the submit button of a form that has nothing to do with it. */
        const hit = (n) => parts.some((p) => {
            const seq = p.split(/\s+/);
            if (!one(n, seq[seq.length - 1])) return false;
            let node = n.parent, i = seq.length - 2;
            while (i >= 0) {
                if (!node) return false;
                if (one(node, seq[i])) i--;
                node = node.parent;
            }
            return true;
        });
        const out = [];
        for (const n of el.walk()) if (n !== el && hit(n)) out.push(n);
        out.forEach = Array.prototype.forEach.bind(out);
        return out;
    };
    el.querySelector = (sel) => el.querySelectorAll(sel)[0] || null;
    /* Walks up, not down. Every delegated handler on the page uses it, so
       without it the first pointerdown throws. */
    el.closest = (sel) => {
        const parts = sel.split(',').map((s) => s.trim());
        const hit = (n, t) => {
            if (t.startsWith('.')) return n._classes.has(t.slice(1));
            if (t.startsWith('#')) return n.attrs.id === t.slice(1);
            if (t.startsWith('[')) return t.slice(1, -1).split('=')[0] in n.attrs;
            return n.tag === t;
        };
        let n = el;
        while (n && n.tag) {
            if (parts.some((p) => hit(n, p.split(/\s+/).pop()))) return n;
            n = n.parent;
        }
        return null;
    };
    return el;
}

const ctx2d = {
    clearRect() {}, beginPath() {}, arc() {}, fill() {}, fillRect() {},
    set fillStyle(v) {}, get fillStyle() { return '#000'; }
};

/* A clock I control, so a six-second study phase costs nothing to sit through. */
const clock = { now: 0, timers: new Map(), seq: 0 };
function schedule(fn, ms, repeat) {
    const id = ++clock.seq;
    clock.timers.set(id, { fn, at: clock.now + (ms || 0), every: repeat ? (ms || 0) : 0 });
    return id;
}
function tick(ms) {
    const end = clock.now + ms;
    let guard = 0;
    while (guard++ < 100000) {
        let next = null, nextId = 0;
        for (const [id, t] of clock.timers) if (t.at <= end && (!next || t.at < next.at)) { next = t; nextId = id; }
        if (!next) break;
        clock.now = next.at;
        if (next.every) next.at = clock.now + next.every;
        else clock.timers.delete(nextId);
        next.fn();
    }
    clock.now = end;
}

const document = makeEl('#document');
document.createElement = makeEl;
document.addEventListener = (t, fn) => { (document.listeners[t] ||= []).push(fn); };
document.removeEventListener = (t, fn) => {
    document.listeners[t] = (document.listeners[t] || []).filter((f) => f !== fn);
};
document.body = makeEl('body');

const window = {
    innerWidth: 1400, innerHeight: 900,
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame: (fn) => schedule(fn, 16, false),
    cancelAnimationFrame: (id) => clock.timers.delete(id)
};

export { document, window, makeEl, tick, clock, schedule };
