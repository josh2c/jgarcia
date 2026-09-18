/* Theme — Pencil Light and Pencil Dark.
 *
 * Three states, not two: light, dark, and "whatever the system says", which is
 * the default and the one most people should stay on. Choosing either of the
 * other two pins it and stores that choice.
 *
 * The attribute has to be on <html> before the first paint or the page flashes
 * the wrong theme, so the read-and-apply half of this is inlined in the head
 * of each page. This file is only the control.
 */

(function () {

const KEY = 'jg-theme';
const root = document.documentElement;

const stored = () => {
    try { return localStorage.getItem(KEY); } catch (err) { return null; }
};

/* What is actually on screen right now, whether that came from a stored
 * choice or from the system. */
function active() {
    const pinned = root.getAttribute('data-theme');
    if (pinned) return pinned;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(mode) {
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    try {
        if (mode === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, mode);
    } catch (err) { /* private window — the choice just will not survive */ }
    paint();
}

/* Sun and moon, drawn rather than fetched: one more request for two glyphs is
 * not a trade worth making. */
const SUN = "<circle cx='12' cy='12' r='4.2'/><path d='M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4'/>";
const MOON = "<path d='M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z'/>";

let buttons = [];

function paint() {
    const now = active();
    buttons.forEach((b) => {
        b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            (now === 'dark' ? SUN : MOON) + '</svg>';
        /* The label says what the button DOES, not what is currently on —
         * a control named after its own state reads backwards. */
        const to = now === 'dark' ? 'light' : 'dark';
        b.setAttribute('aria-label', 'Switch to Pencil ' + to);
        b.setAttribute('title', 'Pencil ' + to);
    });
}

function toggle() {
    apply(active() === 'dark' ? 'light' : 'dark');
}

function mount() {
    buttons = [...document.querySelectorAll('[data-theme-toggle]')];
    buttons.forEach((b) => b.addEventListener('click', toggle));
    paint();
}

/* Following the system means following it as it changes, not only at load. */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const onSystem = () => { if (!stored()) paint(); };
if (mq.addEventListener) mq.addEventListener('change', onSystem);
else if (mq.addListener) mq.addListener(onSystem);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}

window.jgTheme = { apply, toggle, active };

})();
