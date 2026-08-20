/* Placement editor — opens on index.html#edit.
 *
 * The generator still lays the mechanical parts (ground, streets, river,
 * written sections). Everything else is scenery data you place by hand here,
 * then export as world.json for the site to load.
 *
 * Not linked from anywhere and cannot write to the server: Export downloads a
 * file, which is then committed alongside the rest of the site.
 */

export function initEditor(api) {
    const { THREE, scene, camera, canvas, parts, PALETTE } = api;

    let tool = 'place';                 // place | erase | pick
    let model = null;
    let rot = 0;                        // quarter turns
    let scale = 1;
    let painting = false;
    let lastCell = '';
    const undo = [];

    api.setFree(true);

    /* ------------------------------------------------------------- chrome -- */

    const style = document.createElement('style');
    style.textContent = `
    .ed {
      position: fixed; z-index: 400; top: 0; right: 0; height: 100%;
      width: 17rem; display: flex; flex-direction: column;
      background: var(--jg-paper, #f2efe4); color: var(--jg-ink, #2a2e2b);
      border-left: 2px solid var(--jg-ink, #2a2e2b);
      font-family: var(--jg-mono, monospace); font-size: 0.72rem;
    }
    .ed-head { padding: 0.7rem 0.9rem; border-bottom: 2px solid var(--jg-ink,#2a2e2b); display:flex; justify-content:space-between; align-items:center; }
    .ed-head b { font-size: 0.78rem; letter-spacing: 0.12em; }
    .ed-tools { display: flex; gap: 0.35rem; padding: 0.7rem 0.9rem; flex-wrap: wrap; border-bottom: 1px solid rgba(42,46,43,.2); }
    .ed button {
      font: inherit; cursor: pointer; padding: 0.32rem 0.55rem;
      background: transparent; color: inherit;
      border: 1px solid var(--jg-ink, #2a2e2b);
    }
    .ed button.on { background: var(--jg-ink,#2a2e2b); color: var(--jg-paper,#f2efe4); }
    .ed button:hover { background: var(--jg-yellow, #f0c060); color: var(--jg-ink,#2a2e2b); }
    .ed-pal { flex: 1; overflow-y: auto; padding: 0.5rem 0.9rem 1rem; }
    .ed-grp { margin-top: 0.8rem; }
    .ed-grp > span { display:block; font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.55; margin-bottom: 0.3rem; }
    .ed-grp div { display: grid; gap: 0.15rem; }
    .ed-m { text-align: left; border-color: transparent !important; padding: 0.2rem 0.35rem; }
    .ed-m.on { background: var(--jg-accent,#e8a33d); color: var(--jg-ink,#2a2e2b); }
    .ed-foot { padding: 0.7rem 0.9rem; border-top: 1px solid rgba(42,46,43,.2); display: grid; gap: 0.45rem; }
    .ed-stat { opacity: 0.7; line-height: 1.5; white-space: pre-line; word-break: break-all; }
    .ed-hint { position: fixed; z-index: 400; bottom: 1rem; left: 50%; transform: translateX(-50%);
      background: var(--jg-paper,#f2efe4); border: 2px solid var(--jg-ink,#2a2e2b);
      padding: 0.4rem 0.8rem; font-family: var(--jg-mono,monospace); font-size: 0.66rem; }
    body.is-editing .city-hint, body.is-editing .intro { display: none; }
    `;
    document.head.appendChild(style);
    document.body.classList.add('is-editing');

    const el = document.createElement('aside');
    el.className = 'ed';
    el.innerHTML = `
      <div class="ed-head"><b>PLACE</b><span id="ed-count">0</span></div>
      <div class="ed-tools">
        <button data-tool="place" class="on">Place</button>
        <button data-tool="erase">Erase</button>
        <button data-tool="pick">Pick</button>
        <button id="ed-rot">Rotate R</button>
        <button id="ed-undo">Undo</button>
      </div>
      <div class="ed-pal" id="ed-pal"></div>
      <div class="ed-foot">
        <div class="ed-stat" id="ed-sel">nothing selected</div>
        <button id="ed-export">Export world.json</button>
        <button id="ed-clear">Clear all scenery</button>
      </div>`;
    document.body.appendChild(el);

    const hint = document.createElement('div');
    hint.className = 'ed-hint';
    hint.textContent = 'drag empty space to pan · scroll to zoom · click to place · R rotate · X erase · ⌘Z undo';
    document.body.appendChild(hint);

    const pal = el.querySelector('#ed-pal');
    PALETTE.forEach((g) => {
        const wrap = document.createElement('div');
        wrap.className = 'ed-grp';
        wrap.innerHTML = `<span>${g.group}</span><div></div>`;
        const list = wrap.querySelector('div');
        g.models.forEach((m) => {
            const b = document.createElement('button');
            b.className = 'ed-m';
            b.textContent = m.split('/').pop().replace(/^low-detail-/, '').replace(/^building-(type-)?/, '');
            b.dataset.model = m;
            b.addEventListener('click', () => selectModel(m));
            list.appendChild(b);
        });
        pal.appendChild(wrap);
    });

    function selectModel(m) {
        model = m;
        tool = 'place';
        setTool('place');
        el.querySelectorAll('.ed-m').forEach((b) => b.classList.toggle('on', b.dataset.model === m));
        status();
    }

    function setTool(t) {
        tool = t;
        el.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
        status();
    }

    el.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
    el.querySelector('#ed-rot').addEventListener('click', () => { rot = (rot + 1) % 4; status(); });
    el.querySelector('#ed-undo').addEventListener('click', stepBack);
    el.querySelector('#ed-export').addEventListener('click', exportWorld);
    el.querySelector('#ed-clear').addEventListener('click', () => {
        if (!confirm('Remove every placed object? Streets, ground and the written sections stay.')) return;
        snapshot();
        api.setScenery([]);
        status();
    });

    function status() {
        el.querySelector('#ed-count').textContent = api.scenery.length;
        el.querySelector('#ed-sel').textContent =
            tool === 'place'
                ? (model ? `${model}\n${rot * 90}° · ×${scale.toFixed(2)} · ${snapFor(model)}×${snapFor(model)} plot` : 'pick a model from the palette')
                : tool === 'erase' ? 'click an object to remove it'
                : 'click an object to copy it to the brush';
    }

    /* -------------------------------------------------------------- edits -- */

    function snapshot() {
        undo.push(api.scenery.map((o) => ({ ...o })));
        if (undo.length > 40) undo.shift();
    }

    function stepBack() {
        const prev = undo.pop();
        if (!prev) return;
        api.setScenery(prev);
        status();
    }

    /* Ground-plane hit, snapped to the tile grid. */
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    /* Snapping. Buildings take a whole 2x2 plot — that is the module the kits
     * are drawn to. Props and planting snap to single tiles. */
    const PLOT = api.PLOT || 2;
    const BUILDING = /(building|house)/i;

    function snapFor(m) { return m && BUILDING.test(m) ? PLOT : 1; }

    function cellAt(e) {
        ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
        ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
        ray.setFromCamera(ndc, camera);
        if (!ray.ray.intersectPlane(plane, hitPoint)) return null;
        const T = api.TILE;
        const step = snapFor(model);
        // Plot centres sit on the half-tile, so a 2x2 plot lands between tiles.
        const i = Math.round(hitPoint.x / T / step) * step + (step === PLOT ? 0.5 : 0);
        const j = Math.round(hitPoint.z / T / step) * step + (step === PLOT ? 0.5 : 0);
        return { i, j, T, step };
    }

    /* Is a building already standing on this plot? */
    function occupied(x, z) {
        const r = api.TILE * PLOT * 0.5;
        return api.scenery.some((o) =>
            BUILDING.test(o.m) && Math.abs(o.x - x) < r && Math.abs(o.z - z) < r);
    }

    function nearestIndex(x, z) {
        const T = api.TILE;
        let best = -1, bestD = (T * 0.7) ** 2;
        api.scenery.forEach((o, k) => {
            const d = (o.x - x) ** 2 + (o.z - z) ** 2;
            if (d < bestD) { bestD = d; best = k; }
        });
        return best;
    }

    function apply(e, first) {
        const c = cellAt(e);
        if (!c) return;
        const key = c.i + ':' + c.j;
        if (!first && key === lastCell) return;      // one action per cell per drag
        lastCell = key;

        const x = c.i * c.T, z = c.j * c.T;

        if (tool === 'place') {
            if (!model || !parts[model]) return;
            // One building per plot: without this you can stack them into the
            // same ground, which is exactly what made the generated blocks a pile.
            if (BUILDING.test(model) && occupied(x, z)) return;
            if (first) snapshot();
            const next = api.scenery.slice();
            next.push({ m: model, x, z, r: rot * Math.PI / 2, s: scale });
            api.setScenery(next);
        } else if (tool === 'erase') {
            const k = nearestIndex(x, z);
            if (k < 0) return;
            if (first) snapshot();
            const next = api.scenery.slice();
            next.splice(k, 1);
            api.setScenery(next);
        } else {
            const k = nearestIndex(x, z);
            if (k < 0) return;
            const o = api.scenery[k];
            scale = o.s;
            rot = Math.round(o.r / (Math.PI / 2)) % 4;
            selectModel(o.m);
        }
        status();
    }

    /* Left button edits; anything else falls through to the camera. */
    canvas.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.altKey) return;      // alt-drag pans
        painting = true;
        lastCell = '';
        apply(e, true);
        e.stopPropagation();
    }, true);

    canvas.addEventListener('pointermove', (e) => {
        if (!painting) return;
        apply(e, false);
        e.stopPropagation();
    }, true);

    const stop = () => { painting = false; };
    canvas.addEventListener('pointerup', stop, true);
    canvas.addEventListener('pointercancel', stop, true);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'r' || e.key === 'R') { rot = (rot + 1) % 4; status(); }
        else if (e.key === 'x' || e.key === 'X') setTool(tool === 'erase' ? 'place' : 'erase');
        else if (e.key === '[') { scale = Math.max(0.4, scale - 0.1); status(); }
        else if (e.key === ']') { scale = Math.min(2.5, scale + 0.1); status(); }
        else if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); stepBack(); }
    });

    /* ------------------------------------------------------------- export -- */

    function exportWorld() {
        const data = {
            version: 1,
            tile: api.TILE,
            note: 'Scenery placements. Ground, streets, river and written sections stay procedural.',
            items: api.scenery.map((o) => ({
                m: o.m,
                x: +o.x.toFixed(3),
                z: +o.z.toFixed(3),
                r: +o.r.toFixed(4),
                s: +o.s.toFixed(3)
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'world.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    }

    status();
    console.log('[editor] ready —', api.scenery.length, 'objects loaded from the generator');
}
