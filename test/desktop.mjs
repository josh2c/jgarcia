/* Run desktop.js against the real index.html markup and exercise the bin.
 *
 * Dragging an icon into the trash and clicking it to get everything back is
 * stateful, persists to localStorage and spans three functions — the kind of
 * thing that parses fine and throws on the first click.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { document, window, tick, clock, schedule, makeEl } from './dom.mjs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');

/* Build the page body from the real markup. */
const body = makeEl('body');
body.innerHTML = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>')).replace(/^<body[^>]*>/, '');
document.body = body;
// The shim's document only searches its own children, so the body has to
// actually be one of them or every querySelector from the page comes back null.
document.children = [body];
body.parent = document;
document.getElementById = (id) => body.querySelectorAll('[id]').find((e) => e.attrs.id === id) || null;
const store = new Map();

const sandbox = {
    document, console, Math, Date, Set, Map, Array, Object, String, Number, JSON, RegExp, Boolean,
    parseInt, parseFloat, isNaN,
    CSS: { escape: (s) => String(s).replace(/([ "'#.:>~+*\[\]()])/g, '\\$1') },
    localStorage: {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k)
    },
    setTimeout: (fn, ms) => schedule(fn, ms, false),
    setInterval: (fn, ms) => schedule(fn, ms, true),
    clearTimeout: (id) => clock.timers.delete(id),
    clearInterval: (id) => clock.timers.delete(id),
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    fetch: () => Promise.reject(new Error('offline in the harness')),
    MutationObserver: class { observe() {} disconnect() {} },
    DOMParser: class { parseFromString() { return makeEl('div'); } },
    jgWindows: null
};
sandbox.window = Object.assign(window, sandbox, { innerWidth: 1600, innerHeight: 900 });
sandbox.window.localStorage = sandbox.localStorage;

let fails = 0;
const ok = (label, cond, extra) => {
    if (!cond) fails++;
    console.log('    ' + (cond ? 'ok  ' : 'FAIL') + ' ' + label + (extra ? '  ' + extra : ''));
};

/* A reload means a fresh context as well as fresh markup: desktop.js declares
   top-level consts, and running it twice in one context is a redeclaration
   error rather than a second page load. localStorage is the deliberate
   exception — it is the thing being tested across reloads. */
function boot() {
    document.body.innerHTML = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>')).replace(/^<body[^>]*>/, '');
    const ctx = Object.assign({}, sandbox);
    ctx.window = Object.assign({}, sandbox.window, ctx);
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(new URL('desktop.js', root), 'utf8'), ctx);
    return ctx;
}

const surface = () => document.body.querySelector('.dt-surface');
/* Icons get their id via `el.dataset.id = ...`, which the shim does not mirror
   into attributes — so a [data-id] selector only finds the two widgets that
   carry the attribute literally in the markup. Match on the class instead. */
const byId = (id) => surface().querySelectorAll('.dt-drag').find((e) => e.dataset.id === id);
const trash = () => byId('trash');

/* Rects: the shim has no layout, so hand out positions from the inline styles
   the code itself wrote, and put the trash somewhere findable. */
function rects() {
    surface().querySelectorAll('.dt-drag').forEach((el) => {
        el.getBoundingClientRect = () => {
            const x = parseInt(el.style._left || '0', 10) || 0;
            const y = parseInt(el.style._top || '0', 10) || 0;
            return { left: x, top: y, right: x + 100, bottom: y + 100, width: 100, height: 100 };
        };
    });
}

/* The shim's style object is a stub, so record what gets written to it. */
const patchStyle = () => surface().querySelectorAll('.dt-drag').forEach((el) => {
    Object.defineProperty(el.style, 'left', { set(v) { el.style._left = v; }, get() { return el.style._left || ''; }, configurable: true });
    Object.defineProperty(el.style, 'top', { set(v) { el.style._top = v; }, get() { return el.style._top || ''; }, configurable: true });
});

function dragOnto(id, target) {
    const el = byId(id);
    const t = target.getBoundingClientRect();
    surface().dispatch('pointerdown', { button: 0, clientX: 10, clientY: 10, target: el });
    surface().dispatch('pointermove', { clientX: t.left + 20, clientY: t.top + 20, target: el });
    surface().dispatch('pointerup', { clientX: t.left + 20, clientY: t.top + 20, target: el });
}

console.log('  desktop: drag, bin, and give back');
try {
    let ctx = boot();
    patchStyle();
    rects();

    const draggables = surface().querySelectorAll('.dt-drag');
    const folders = draggables.filter((e) => (e.dataset.id || '').startsWith('folder:'));
    ok('every folder is draggable', folders.length === 6, folders.length + ' folders');
    ok('so are both widgets and the trash',
        !!byId('widget:clock') && !!byId('widget:readme') && !!byId('trash'));
    ok('and nothing else is left loose on the desktop',
        draggables.length === folders.length + 3, draggables.length + ' draggables in total');
    ok('the dock is gone; Paint and Pong live in the folder',
        !draggables.some((e) => (e.dataset.id || '').startsWith('tool:')));
    ok('the readme drags by its title bar only',
        byId('widget:readme').dataset.handle === '.dt-pad-bar');

    ok('the trash starts empty', /empty/i.test(trash().querySelector('.dt-icon-count').textContent),
        trash().querySelector('.dt-icon-count').textContent);

    dragOnto('folder:Games', trash());
    ok('dropping a folder on the trash hides it', byId('folder:Games').hidden === true);
    ok('and the trash says what is in it',
        /1 item/.test(trash().querySelector('.dt-icon-count').textContent),
        trash().querySelector('.dt-icon-count').textContent);
    ok('the trash shows as full', trash().classList.contains('is-full'));

    dragOnto('widget:clock', trash());
    ok('a widget can be binned too', byId('widget:clock').hidden === true);
    ok('the count keeps up', /2 items/.test(trash().querySelector('.dt-icon-count').textContent));

    ok('it survives a reload', JSON.parse(store.get('jg-desktop-trash')).length === 2,
        store.get('jg-desktop-trash'));

    trash().dispatch('click');
    ok('clicking the trash gives everything back',
        byId('folder:Games').hidden === false && byId('widget:clock').hidden === false);
    ok('and it is empty again', /empty/i.test(trash().querySelector('.dt-icon-count').textContent));
    ok('the restored items are placed apart, not stacked',
        byId('folder:Games').style.left !== byId('widget:clock').style.left ||
        byId('folder:Games').style.top !== byId('widget:clock').style.top,
        byId('folder:Games').style.left + '/' + byId('widget:clock').style.left);

    // The trash cannot bin itself.
    dragOnto('trash', trash());
    ok('the trash refuses to bin itself', trash().hidden === false &&
        /empty/i.test(trash().querySelector('.dt-icon-count').textContent));

    // Reboot with a full bin and check it comes back hidden.
    dragOnto('folder:Skills', trash());
    ctx = boot();
    patchStyle();
    rects();
    ok('a binned item is still binned after a reload', byId('folder:Skills').hidden === true);
    ok('and the count is restored', /1 item/.test(trash().querySelector('.dt-icon-count').textContent),
        trash().querySelector('.dt-icon-count').textContent);

    ctx.window.jgTidyDesktop();
    ok('tidy gives back anything in the bin', byId('folder:Skills').hidden === false);
} catch (e) {
    fails++;
    console.log('    FAIL threw: ' + e.message + '\n      ' + (e.stack || '').split('\n')[1]);
}

console.log('\n  ' + (fails ? fails + ' FAILURES' : 'all checks passed'));
process.exit(fails ? 1 : 0);
