/* Windows — a small window manager, so folders behave like an OS rather than
 * a modal. Several open at once, dragged by the title bar, resized from the
 * corner, raised on focus, cascaded so a new one never lands exactly on the
 * last, and closed independently.
 *
 * window.jgWindows.open({ id, title, html })            static content
 * window.jgWindows.open({ id, title, mount })           mount(body) -> cleanup
 * Reopening a live id focuses that window instead of duplicating it.
 */

(function () {
    const MIN_W = 280, MIN_H = 180;
    const CASCADE = 28;
    const open = new Map();          // id -> record
    let top = 400;                   // z-index counter
    let opened = 0;                  // cascade position

    let layer = null;
    function ensure() {
        if (layer) return layer;
        layer = document.createElement('div');
        layer.className = 'win-layer';
        document.body.appendChild(layer);
        return layer;
    }

    const small = () => window.innerWidth < 760;

    function raise(rec) {
        rec.el.style.zIndex = String(++top);
        open.forEach((r) => r.el.classList.toggle('is-focused', r === rec));
    }

    function place(rec, w, h) {
        if (small()) {
            // On a phone a cascade is useless — fill the screen instead.
            Object.assign(rec.el.style, {
                left: '2vw', top: '4.5rem',
                width: '96vw', height: 'calc(100vh - 7rem)'
            });
            return;
        }
        const step = (opened++ % 6) * CASCADE;
        const x = Math.round((window.innerWidth - w) / 2 - CASCADE * 1.5 + step);
        const y = Math.round(Math.max(72, (window.innerHeight - h) / 2 - CASCADE) + step);
        Object.assign(rec.el.style, {
            left: Math.max(8, x) + 'px',
            top: y + 'px',
            width: w + 'px',
            height: h + 'px'
        });
    }

    /* Keeps the title bar reachable — a window dragged off-screen is lost. */
    function clamp(rec) {
        const r = rec.el.getBoundingClientRect();
        const maxX = window.innerWidth - 90;
        const maxY = window.innerHeight - 44;
        let x = parseFloat(rec.el.style.left) || 0;
        let y = parseFloat(rec.el.style.top) || 0;
        if (r.left > maxX) x = maxX;
        if (r.top > maxY) y = maxY;
        if (r.right < 90) x = 90 - r.width;
        if (y < 0) y = 0;
        rec.el.style.left = x + 'px';
        rec.el.style.top = y + 'px';
    }

    function close(id) {
        const rec = open.get(id);
        if (!rec) return;
        if (rec.cleanup) { try { rec.cleanup(); } catch (err) { /* keep closing */ } }
        rec.el.remove();
        open.delete(id);
    }

    function openWindow(opts) {
        const id = opts.id || 'w' + Math.random().toString(36).slice(2);

        const live = open.get(id);
        if (live) { raise(live); return live; }

        const el = document.createElement('section');
        el.className = 'win';
        el.innerHTML = `
          <header class="win-bar">
            <span class="win-title"></span>
            <span class="win-actions">
              <button type="button" class="win-btn win-max" aria-label="Maximise">▢</button>
              <button type="button" class="win-btn win-close" aria-label="Close">✕</button>
            </span>
          </header>
          <div class="win-body"></div>
          <span class="win-grip" aria-hidden="true"></span>`;

        const rec = { id, el, cleanup: null };
        el.querySelector('.win-title').textContent = opts.title || '';
        ensure().appendChild(el);
        open.set(id, rec);

        place(rec, opts.width || 620, opts.height || 460);
        raise(rec);

        const body = el.querySelector('.win-body');
        if (opts.mount) {
            // Mounted after sizing: the games measure the body, and it reads 0
            // while the element is unsized.
            rec.cleanup = opts.mount(body) || null;
        } else {
            body.innerHTML = opts.html || '';
        }

        el.addEventListener('pointerdown', () => raise(rec), true);
        el.querySelector('.win-close').addEventListener('click', () => close(id));
        el.querySelector('.win-max').addEventListener('click', () => {
            el.classList.toggle('is-max');
            if (!el.classList.contains('is-max')) clamp(rec);
        });

        dragBy(el.querySelector('.win-bar'), rec, 'move');
        dragBy(el.querySelector('.win-grip'), rec, 'size');

        return rec;
    }

    /* One handler for both moving and resizing — they differ only in which
     * numbers the delta is applied to. */
    function dragBy(handle, rec, mode) {
        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('.win-btn')) return;
            if (rec.el.classList.contains('is-max')) return;
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);

            const r = rec.el.getBoundingClientRect();
            const sx = e.clientX, sy = e.clientY;
            const ox = r.left, oy = r.top, ow = r.width, oh = r.height;
            rec.el.classList.add('is-dragging');

            const move = (ev) => {
                const dx = ev.clientX - sx, dy = ev.clientY - sy;
                if (mode === 'move') {
                    rec.el.style.left = ox + dx + 'px';
                    rec.el.style.top = oy + dy + 'px';
                } else {
                    rec.el.style.width = Math.max(MIN_W, ow + dx) + 'px';
                    rec.el.style.height = Math.max(MIN_H, oh + dy) + 'px';
                }
            };
            const up = () => {
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', up);
                rec.el.classList.remove('is-dragging');
                if (mode === 'move') clamp(rec);
            };
            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', up);
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !open.size) return;
        // Close the front-most window only, the way an OS would.
        let front = null;
        open.forEach((r) => {
            if (!front || +r.el.style.zIndex > +front.el.style.zIndex) front = r;
        });
        if (front) close(front.id);
    });

    window.addEventListener('resize', () => open.forEach(clamp));

    window.jgWindows = {
        open: openWindow,
        close,
        closeAll() { [...open.keys()].forEach(close); },
        get count() { return open.size; }
    };
})();
