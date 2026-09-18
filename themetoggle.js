/* Theme — Pencil Light and Pencil Dark.
 *
 * Two states. Light is the default and dark is opt in; the system preference
 * is deliberately not consulted, because this is a page of writing before it
 * is an application and it should arrive as the paper it was designed on.
 *
 * The attribute has to be on <html> before the first paint or the page flashes
 * the wrong theme, so the read-and-apply half of this is inlined in the head
 * of each page. This file is only the control.
 */

(function () {

const KEY = 'jg-theme';
const root = document.documentElement;

/* What is on screen right now. No attribute means the default, which is
 * light — the stylesheet has no dark branch that can apply on its own. */
function active() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function apply(mode) {
    root.setAttribute('data-theme', mode);
    try {
        localStorage.setItem(KEY, mode);
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
} else {
    mount();
}

window.jgTheme = { apply, toggle, active };

})();
