/* Paintball — arm it from the dock, then shoot the page.
 *
 * A full-screen canvas sits over everything. Clicking fires a ball from the
 * muzzle to the cursor; it lands as an irregular splat with satellite droplets
 * and a drip, then fades out over several seconds. Hold to keep firing.
 *
 * Each splat is rendered once into its own small offscreen canvas and then
 * blitted per frame — drawing a hundred irregular paths every frame would not
 * hold 60fps once the screen fills up.
 */

(function () {
    const COLORS = ['#ff3b6b', '#ffd23f', '#3ec1ff', '#4ade80', '#ff8c42', '#b47cff'];
    const MAX_SPLATS = 140;       // oldest are dropped past this
    const LIFE = 9000;            // ms a splat lives
    const FADE_FROM = 0.55;       // fraction of life before it starts fading
    const FIRE_EVERY = 90;        // ms between shots while held
    const FLIGHT = 110;           // ms from muzzle to target

    let armed = false;
    let canvas = null, ctx = null;
    let splats = [], shots = [];
    let raf = null, lastFire = 0, firing = false;
    let gunEl = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ------------------------------------------------------------ canvas -- */

    function ensure() {
        if (canvas) return;

        canvas = document.createElement('canvas');
        canvas.className = 'pb-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);

        gunEl = document.createElement('div');
        gunEl.className = 'pb-gun';
        // Placeholder marker, drawn rather than modelled. Swap the contents of
        // this element for <img src="…"> when the real art exists.
        gunEl.innerHTML = `
          <svg viewBox="0 0 220 150" aria-hidden="true">
            <g fill="none" stroke="#1b1f1d" stroke-width="5" stroke-linejoin="round">
              <rect x="18" y="62" width="128" height="30" rx="4" fill="#2f3a36"/>
              <rect x="140" y="66" width="66" height="17" rx="3" fill="#42504a"/>
              <circle cx="70" cy="44" r="26" fill="#e8a33d"/>
              <path d="M54 92 L48 132 L82 132 L76 92 Z" fill="#2f3a36"/>
              <rect x="96" y="90" width="14" height="18" rx="3" fill="#1b1f1d"/>
              <path d="M120 92 L112 118 L140 118 L134 92 Z" fill="#42504a"/>
            </g>
          </svg>`;
        document.body.appendChild(gunEl);
    }

    function resize() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* ------------------------------------------------------------- splat -- */

    /* Pre-renders one splat so the frame loop only has to blit it. */
    function makeSplat(x, y, color) {
        const size = 26 + Math.random() * 34;
        const pad = size * 2.4;
        const off = document.createElement('canvas');
        off.width = off.height = Math.ceil(pad * 2);
        const c = off.getContext('2d');
        c.translate(pad, pad);
        c.fillStyle = color;

        // Main blob: a closed curve through jittered radii, so no two match.
        const pts = 12 + Math.floor(Math.random() * 6);
        const radii = [];
        for (let i = 0; i < pts; i++) radii.push(size * (0.7 + Math.random() * 0.55));
        c.beginPath();
        for (let i = 0; i <= pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const r = radii[i % pts];
            const nx = Math.cos(a) * r, ny = Math.sin(a) * r;
            if (i === 0) c.moveTo(nx, ny);
            else {
                const pa = ((i - 1) / pts) * Math.PI * 2;
                const pr = radii[(i - 1) % pts];
                const mx = (Math.cos(pa) * pr + nx) / 2;
                const my = (Math.sin(pa) * pr + ny) / 2;
                c.quadraticCurveTo(Math.cos(pa) * pr, Math.sin(pa) * pr, mx, my);
            }
        }
        c.closePath();
        c.fill();

        // Satellite droplets thrown outward.
        const drops = 4 + Math.floor(Math.random() * 5);
        for (let i = 0; i < drops; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = size * (1.1 + Math.random() * 1.1);
            const r = size * (0.06 + Math.random() * 0.16);
            c.beginPath();
            c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r, r * (0.7 + Math.random() * 0.6), a, 0, Math.PI * 2);
            c.fill();
        }

        // A drip, because paint runs.
        if (Math.random() < 0.65) {
            const dx = (Math.random() - 0.5) * size * 0.6;
            const len = size * (0.5 + Math.random() * 1.1);
            const w = size * 0.16;
            c.beginPath();
            c.moveTo(dx - w, size * 0.5);
            c.quadraticCurveTo(dx, size * 0.5 + len, dx + w, size * 0.5);
            c.closePath();
            c.fill();
            c.beginPath();
            c.arc(dx, size * 0.5 + len, w * 0.9, 0, Math.PI * 2);
            c.fill();
        }

        return { img: off, x, y, pad, born: performance.now() };
    }

    /* -------------------------------------------------------------- loop -- */

    function muzzle() {
        if (!gunEl) return { x: window.innerWidth * 0.82, y: window.innerHeight };
        const r = gunEl.getBoundingClientRect();
        return { x: r.left + r.width * 0.92, y: r.top + r.height * 0.5 };
    }

    function fire(x, y) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        if (reduced) { land(x, y, color); return; }
        const m = muzzle();
        shots.push({ x0: m.x, y0: m.y, x1: x, y1: y, color, born: performance.now() });
        if (gunEl) {
            gunEl.classList.remove('is-kick');
            void gunEl.offsetWidth;              // restart the animation
            gunEl.classList.add('is-kick');
        }
        start();
    }

    function land(x, y, color) {
        splats.push(makeSplat(x, y, color));
        if (splats.length > MAX_SPLATS) splats.shift();
        start();
    }

    function frame() {
        const now = performance.now();
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = splats.length - 1; i >= 0; i--) {
            const s = splats[i];
            const t = (now - s.born) / LIFE;
            if (t >= 1) { splats.splice(i, 1); continue; }
            ctx.globalAlpha = t < FADE_FROM ? 1 : 1 - (t - FADE_FROM) / (1 - FADE_FROM);
            ctx.drawImage(s.img, s.x - s.pad, s.y - s.pad);
        }

        for (let i = shots.length - 1; i >= 0; i--) {
            const b = shots[i];
            const t = (now - b.born) / FLIGHT;
            if (t >= 1) {
                land(b.x1, b.y1, b.color);
                shots.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            // Grows as it travels, so it reads as coming toward the glass.
            ctx.arc(b.x0 + (b.x1 - b.x0) * t, b.y0 + (b.y1 - b.y0) * t, 4 + t * 7, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;

        if (splats.length || shots.length) raf = requestAnimationFrame(frame);
        else raf = null;
    }

    function start() { if (!raf) raf = requestAnimationFrame(frame); }

    /* ------------------------------------------------------------- input -- */

    function onDown(e) {
        if (!armed || e.button !== 0) return;
        // The rail and dock stay usable so you can disarm without a keyboard.
        if (e.target.closest('.menubar, .cv-layer, .win, .pb-exit')) return;
        e.preventDefault();
        // Capture phase, so this is the board's pan handler's only chance to
        // see the event. Firing a shot should not also drag the board out from
        // under you, or open the card you were shooting at.
        e.stopPropagation();
        firing = true;
        lastFire = 0;
        pump(e.clientX, e.clientY);
    }

    let pointer = { x: 0, y: 0 };
    function onMove(e) { pointer.x = e.clientX; pointer.y = e.clientY; }
    function onUp() { firing = false; }

    /* Held fire, rate-limited — this is the zerg rush. */
    function pump(x, y) {
        const now = performance.now();
        if (now - lastFire >= FIRE_EVERY) { lastFire = now; fire(x, y); }
        if (!firing) return;
        requestAnimationFrame(() => { if (firing) pump(pointer.x || x, pointer.y || y); });
    }

    /* -------------------------------------------------------------- arm --- */

    function arm() {
        ensure();
        armed = true;
        document.body.classList.add('is-armed');
        document.addEventListener('pointerdown', onDown, true);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    }

    function disarm() {
        armed = false;
        firing = false;
        document.body.classList.remove('is-armed');
        document.removeEventListener('pointerdown', onDown, true);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
    }

    function clear() {
        splats = [];
        shots = [];
        if (ctx) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    document.addEventListener('keydown', (e) => {
        if (!armed) return;
        // The readme is a real text field. Typing a "c" into it should write a
        // c, not wipe the canvas.
        const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable;
        if (e.key === 'Escape') return disarm();
        if (!typing && (e.key === 'c' || e.key === 'C')) clear();
    });

    document.addEventListener('click', (e) => {
        if (e.target.id === 'pb-clear') { e.preventDefault(); clear(); }
        if (e.target.id === 'pb-stop') { e.preventDefault(); disarm(); }
    });

    /* Swallow the click a shot generates. Blocking pointerdown is not enough:
     * click is synthesised separately, and without this a shot at the dice
     * would fire and enter the board at the same time. */
    document.addEventListener('click', (e) => {
        if (!armed) return;
        if (e.target.closest('.menubar, .cv-layer, .win, .pb-exit')) return;
        e.preventDefault();
        e.stopPropagation();
    }, true);

    window.jgPaintball = {
        toggle() { armed ? disarm() : arm(); },
        arm, disarm, clear,
        get armed() { return armed; }
    };

    /* The menubar button. It lives with the board controls rather than on the
     * cover, because the board is the only thing worth shooting — and it is
     * the one control whose pressed state is held on the body, so it has to
     * watch for arming that happened by keyboard or from the console. */
    const mbPaint = document.getElementById('mb-paintball');
    if (mbPaint) {
        mbPaint.addEventListener('click', () => window.jgPaintball.toggle());
        const sync = () => mbPaint.setAttribute('aria-pressed',
            String(document.body.classList.contains('is-armed')));
        new MutationObserver(sync).observe(document.body,
            { attributes: true, attributeFilter: ['class'] });
        sync();
    }
})();
