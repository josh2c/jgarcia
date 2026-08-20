/* Mind Override — six of the seven minigames from the Flutter app
 * (github.com/josh2c/mind_override), rebuilt in plain JS to run in a window.
 *
 * The rules, difficulty parameters and scoring formulas are taken from the
 * app's own docs/tier3_mechanics.md rather than reinvented, so a game plays the
 * way it plays there. What is deliberately dropped is the meta-layer: the XP
 * ladder, unlock thresholds, difficulty tiers and progression persistence.
 * Nobody grinds 350 XP to unlock a game on a personal site, so each game runs
 * at one chosen tier and keeps a streak instead.
 *
 * Vortex Assemble is not here. It is built on a physics engine with vortex
 * gravity, 80%-overlap snapping and graph traversal for completion — a rewrite
 * rather than a port.
 *
 * Every mount(host) returns a cleanup, which the window manager calls on close.
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------ tools --- */

    const rnd = (n) => Math.floor(Math.random() * n);
    const pick = (a) => a[rnd(a.length)];

    function shuffle(a) {
        const out = a.slice();
        for (let i = out.length - 1; i > 0; i--) {
            const j = rnd(i + 1);
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    }

    /* Levenshtein, capped. The app accepts an answer one character off:
     * "triangl", "trianglee" and "trianngle" all match "triangle". */
    function lev(a, b) {
        a = String(a).toLowerCase().trim();
        b = String(b).toLowerCase().trim();
        if (a === b) return 0;
        const m = a.length, n = b.length;
        if (Math.abs(m - n) > 2) return 99;
        let prev = Array.from({ length: n + 1 }, (_, i) => i);
        for (let i = 1; i <= m; i++) {
            const cur = [i];
            for (let j = 1; j <= n; j++) {
                cur[j] = Math.min(
                    prev[j] + 1,
                    cur[j - 1] + 1,
                    prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }
            prev = cur;
        }
        return prev[n];
    }

    const near = (a, b) => lev(a, b) <= 1;

    /* How many of the expected words the answer got, allowing one typo each
     * and ignoring order. */
    function scoreWords(answer, expected) {
        const got = String(answer).toLowerCase().trim().split(/\s+/).filter(Boolean);
        const want = expected.map((w) => w.toLowerCase());
        const used = new Set();
        let hits = 0;
        for (const w of want) {
            const i = got.findIndex((g, k) => !used.has(k) && near(g, w));
            if (i >= 0) { used.add(i); hits++; }
        }
        return hits;
    }

    const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond'];
    const COLOURS = [
        { name: 'red', hex: '#e0574a' },
        { name: 'blue', hex: '#3b82f6' },
        { name: 'green', hex: '#22c55e' },
        { name: 'amber', hex: '#e8a33d' },
        { name: 'violet', hex: '#a98ed2' },
        { name: 'teal', hex: '#2b9c96' }
    ];

    /* `pip` is not decoration. Every shape here is symmetric about its vertical
     * axis, so a flip is invisible on all of them, and a square or a diamond
     * rotated by a quarter turn is identical to itself. Pattern Spot would have
     * generated changes nobody could ever spot. The pip sits off both axes, so
     * any rotation or flip moves it somewhere visibly different. Memory Match
     * never rotates anything and leaves it off. */
    function shapeSvg(shape, hex, rot, flip, pip) {
        const t = 'rotate(' + (rot || 0) + ' 24 24)' + (flip ? ' scale(-1 1) translate(-48 0)' : '');
        // Off BOTH axes and off the 45-degree diagonal. On the diagonal a mirror
        // lands exactly where a rotation does, and four of the eight
        // orientations become the same picture. Kept close to the centre so it
        // still falls inside the narrowest shape, which is the triangle.
        const mark = pip ? '<circle cx="29" cy="21" r="2.6" fill="rgba(255,255,255,0.92)"/>' : '';
        const body = {
            circle: '<circle cx="24" cy="24" r="15"/>',
            square: '<rect x="10" y="10" width="28" height="28" rx="3"/>',
            triangle: '<path d="M24 8 41 38 7 38Z"/>',
            star: '<path d="M24 7 29 19 42 20 32 29 35 42 24 35 13 42 16 29 6 20 19 19Z"/>',
            diamond: '<path d="M24 7 40 24 24 41 8 24Z"/>'
        }[shape];
        return '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="' + hex +
            '" transform="' + t + '">' + body + mark + '</g></svg>';
    }

    /* One chrome for all six, so a game only has to fill the stage. */
    function shell(host, opts) {
        host.innerHTML =
            '<div class="mg">' +
                '<div class="mg-bar">' +
                    '<span class="mg-how"></span>' +
                    '<span class="mg-stat"></span>' +
                '</div>' +
                '<div class="mg-stage"></div>' +
                '<div class="mg-foot">' +
                    '<span class="mg-msg"></span>' +
                    '<button type="button" class="mg-go"></button>' +
                '</div>' +
            '</div>';

        const q = (s) => host.querySelector(s);
        const timers = new Set();
        const api = {
            stage: q('.mg-stage'),
            how: q('.mg-how'),
            stat: q('.mg-stat'),
            msg: q('.mg-msg'),
            go: q('.mg-go'),
            best: 0,
            streak: 0,
            after(ms, fn) { const t = setTimeout(fn, ms); timers.add(t); return t; },
            every(ms, fn) { const t = setInterval(fn, ms); timers.add(t); return t; },
            stop(t) { clearTimeout(t); clearInterval(t); timers.delete(t); },
            stopAll() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers.clear(); },
            say(m) { api.msg.textContent = m; },
            /* Streak is the only thing carried between rounds — the app's XP
             * ladder is deliberately not here. */
            tally(score) {
                api.streak = score >= 100 ? api.streak + 1 : 0;
                api.best = Math.max(api.best, api.streak);
                api.stat.textContent = 'Score ' + score + ' · streak ' + api.streak +
                    (api.best > api.streak ? ' · best ' + api.best : '');
            }
        };
        api.how.textContent = opts.how;
        return api;
    }

    /* A countdown that shows in the bar and fires once when it runs out. */
    function countdown(s, secs, label, done) {
        let left = secs;
        s.stat.textContent = label + ' ' + left + 's';
        const t = s.every(1000, () => {
            left--;
            s.stat.textContent = label + ' ' + Math.max(0, left) + 's';
            if (left <= 0) { s.stop(t); done(); }
        });
        return t;
    }

    /* ---------------------------------------------------- light squares --- */
    /* Grid of 7, 15% of it lit, six seconds to take it in. Replicate it. */

    function mountLightSquares(host) {
        const SIZE = 7, LIT = Math.round(SIZE * SIZE * 0.15), STUDY = 6;
        const s = shell(host, { how: 'Memorise the lit squares, then rebuild the pattern.' });
        let pattern = [], picked = new Set(), phase = 'idle';

        const cells = [];
        s.stage.className = 'mg-stage mg-grid';
        s.stage.style.setProperty('--n', SIZE);
        for (let i = 0; i < SIZE * SIZE; i++) {
            const c = document.createElement('button');
            c.type = 'button';
            c.className = 'mg-cell';
            c.addEventListener('click', () => {
                if (phase !== 'answer') return;
                if (picked.has(i)) { picked.delete(i); c.classList.remove('is-on'); }
                else { picked.add(i); c.classList.add('is-on'); }
            });
            s.stage.appendChild(c);
            cells.push(c);
        }

        function round() {
            phase = 'study';
            picked.clear();
            pattern = shuffle([...Array(SIZE * SIZE).keys()]).slice(0, LIT);
            cells.forEach((c, i) => c.classList.toggle('is-on', pattern.includes(i)));
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, STUDY, 'Study', () => {
                phase = 'answer';
                cells.forEach((c) => c.classList.remove('is-on'));
                s.stat.textContent = 'Pick ' + LIT;
                s.go.textContent = 'Check';
                s.go.disabled = false;
            });
        }

        function check() {
            phase = 'done';
            s.stopAll();
            let hit = 0;
            cells.forEach((c, i) => {
                const want = pattern.includes(i), got = picked.has(i);
                if (want && got) { hit++; c.classList.add('is-right'); }
                else if (want) c.classList.add('is-missed');
                else if (got) c.classList.add('is-wrong');
            });
            const score = Math.max(0, Math.round((hit / LIT) * 100) - (picked.size - hit) * 10);
            s.tally(score);
            s.say(hit + ' of ' + LIT + ' found' + (picked.size > hit ? ', ' + (picked.size - hit) + ' wrong' : ''));
            s.go.textContent = 'Again';
        }

        s.go.addEventListener('click', () => {
            if (phase === 'answer') return check();
            cells.forEach((c) => c.classList.remove('is-right', 'is-wrong', 'is-missed'));
            round();
        });

        s.go.textContent = 'Start';
        s.say('Seven squares light up.');
        return () => s.stopAll();
    }

    /* ----------------------------------------------------- quantum count --- */
    /* A swarm you cannot count one by one. Estimate it. Scored on a tolerance
     * band: exact is 110, inside the band falls off linearly, outside is zero. */

    function mountQuantumCount(host) {
        const COUNT_MIN = 34, COUNT_MAX = 62, TOL = 8, STUDY = 6;
        const s = shell(host, { how: 'Estimate how many dots. Within ' + TOL + ' still scores.' });
        s.stage.className = 'mg-stage mg-canvas-wrap';
        const canvas = document.createElement('canvas');
        s.stage.appendChild(canvas);
        const form = document.createElement('form');
        form.className = 'mg-answer';
        form.innerHTML = '<input type="number" inputmode="numeric" placeholder="how many?" min="1" max="999">' +
            '<button type="submit">Guess</button>';
        s.stage.appendChild(form);
        const input = form.querySelector('input');

        const ctx = canvas.getContext('2d');
        let dots = [], raf = 0, actual = 0, phase = 'idle';

        /* Measured on the canvas, and only once it is visible. Measuring the
         * stage while the canvas was still hidden gave a zero box, and sizing
         * off the stage rather than the element left the drawing buffer a
         * different shape from the box it is stretched into. */
        function size() {
            const r = canvas.getBoundingClientRect();
            canvas.width = Math.max(120, Math.round(r.width));
            canvas.height = Math.max(100, Math.round(r.height));
        }

        function frame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const d of dots) {
                d.x += d.vx; d.y += d.vy;
                if (d.x < d.r || d.x > canvas.width - d.r) d.vx *= -1;
                if (d.y < d.r || d.y > canvas.height - d.r) d.vy *= -1;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ctx.fillStyle = d.c;
                ctx.fill();
            }
            raf = requestAnimationFrame(frame);
        }

        function round() {
            phase = 'study';
            form.hidden = true;
            canvas.hidden = false;
            size();
            actual = COUNT_MIN + rnd(COUNT_MAX - COUNT_MIN + 1);
            dots = Array.from({ length: actual }, () => ({
                x: 12 + Math.random() * (canvas.width - 24),
                y: 12 + Math.random() * (canvas.height - 24),
                vx: (Math.random() - 0.5) * 1.7,
                vy: (Math.random() - 0.5) * 1.7,
                r: 4 + Math.random() * 3,
                c: pick(COLOURS).hex
            }));
            s.say('');
            s.go.textContent = 'Counting…';
            s.go.disabled = true;
            cancelAnimationFrame(raf);
            frame();
            countdown(s, STUDY, 'Look', () => {
                cancelAnimationFrame(raf);
                canvas.hidden = true;
                form.hidden = false;
                phase = 'answer';
                s.stat.textContent = 'Your guess';
                input.value = '';
                input.focus();
            });
        }

        function judge(guess) {
            phase = 'done';
            s.stopAll();
            const err = Math.abs(guess - actual);
            let score = 0;
            if (err === 0) score = 110;
            else if (err <= TOL) score = 100 - Math.round((err / TOL) * 50);
            s.tally(score);
            s.say(err === 0 ? 'Exactly ' + actual + '. Perfect.'
                : 'It was ' + actual + ', you were ' + err + ' out.');
            form.hidden = true;
            s.go.textContent = 'Again';
            s.go.disabled = false;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const g = parseInt(input.value, 10);
            if (phase === 'answer' && Number.isFinite(g)) judge(g);
        });

        s.go.addEventListener('click', () => { if (phase !== 'study') round(); });
        s.go.textContent = 'Start';
        s.say('They move, so counting one by one will not work.');
        form.hidden = true;
        canvas.hidden = true;

        return () => { cancelAnimationFrame(raf); s.stopAll(); };
    }

    /* ------------------------------------------------------- word flash --- */
    /* Exactly twenty words, fifteen distinct and five repeats, in the app's own
     * proportions. Every repeat is guaranteed to land after its first showing,
     * so "seen" is always answerable. */

    function mountWordFlash(host) {
        const POOL = ['APPLE', 'BANANA', 'CHERRY', 'DRAGON', 'ELEPHANT', 'FOREST', 'GUITAR',
            'HORIZON', 'ISLAND', 'JUNGLE', 'KEYBOARD', 'LEMON', 'MOUNTAIN', 'NEBULA', 'OCEAN',
            'PYRAMID', 'QUARTZ', 'ROCKET', 'SUNSET', 'TIGER', 'UMBRELLA', 'VOLCANO', 'WHISPER',
            'GALAXY', 'THUNDER', 'CRYSTAL', 'MEADOW', 'PHOENIX', 'SHADOW', 'BREEZE', 'CANYON',
            'EMBER', 'HARMONY', 'LANTERN', 'MIRROR', 'PRISM', 'RIVER', 'SPARK', 'VALLEY', 'WINTER'];
        const UNIQUE = 15, REPEAT = 5, TOTAL = UNIQUE + REPEAT, PER_WORD = 2600;

        const s = shell(host, { how: 'New word, or one you have already seen?' });
        s.stage.className = 'mg-stage mg-word';
        s.stage.innerHTML = '<span class="mg-big"></span><div class="mg-choice">' +
            '<button type="button" data-a="new">New <kbd>N</kbd></button>' +
            '<button type="button" data-a="seen">Seen <kbd>S</kbd></button></div>';
        const big = s.stage.querySelector('.mg-big');
        const buttons = [...s.stage.querySelectorAll('.mg-choice button')];

        let seq = [], at = 0, right = 0, phase = 'idle', tick = 0;

        function build() {
            const words = shuffle(POOL).slice(0, UNIQUE);
            const out = words.map((w) => ({ w, seen: false }));
            for (let i = 0; i < REPEAT; i++) {
                const w = pick(words);
                // Somewhere strictly after the word's first appearance.
                const first = out.findIndex((e) => e.w === w);
                const at = first + 1 + rnd(out.length - first);
                out.splice(at, 0, { w, seen: true });
            }
            return out;
        }

        function show() {
            if (at >= seq.length) return finish();
            big.textContent = seq[at].w;
            big.classList.remove('mg-flash');
            void big.offsetWidth;
            big.classList.add('mg-flash');
            s.stat.textContent = (at + 1) + ' / ' + TOTAL;
            tick = s.after(PER_WORD, () => answer(null));
        }

        function answer(said) {
            if (phase !== 'play') return;
            s.stop(tick);
            const want = seq[at].seen ? 'seen' : 'new';
            if (said === want) right++;
            big.classList.toggle('is-right', said === want);
            big.classList.toggle('is-wrong', said !== want);
            at++;
            s.after(180, () => {
                big.classList.remove('is-right', 'is-wrong');
                show();
            });
        }

        function finish() {
            phase = 'done';
            s.stopAll();
            big.textContent = right + ' / ' + TOTAL;
            const score = Math.round((right / TOTAL) * 100);
            s.tally(score);
            s.say(score === 100 ? 'Every one.' : right + ' right out of ' + TOTAL + '.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
            buttons.forEach((b) => (b.disabled = true));
        }

        buttons.forEach((b) => b.addEventListener('click', () => answer(b.dataset.a)));
        const key = (e) => {
            if (phase !== 'play') return;
            // Another game's window may be open with a text field focused.
            if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            if (e.key === 'n' || e.key === 'N') answer('new');
            if (e.key === 's' || e.key === 'S') answer('seen');
        };
        document.addEventListener('keydown', key);

        s.go.addEventListener('click', () => {
            seq = build(); at = 0; right = 0; phase = 'play';
            buttons.forEach((b) => (b.disabled = false));
            s.say('');
            s.go.textContent = 'Running…';
            s.go.disabled = true;
            show();
        });

        s.go.textContent = 'Start';
        big.textContent = '—';
        s.say('Twenty words. Five of them come round twice.');
        buttons.forEach((b) => (b.disabled = true));

        return () => { document.removeEventListener('keydown', key); s.stopAll(); };
    }

    /* ------------------------------------------------------ pattern spot --- */
    /* Two grids, a few seconds apart. Tap what moved. A change is a colour, a
     * shape, a rotation or a flip — the app's four types — and an extra tap
     * costs less than a miss, as it does there. */

    function mountPatternSpot(host) {
        const N = 3, CHANGES = 2, STUDY = 4;
        const s = shell(host, { how: 'Tap every cell that changed between the two grids.' });
        s.stage.className = 'mg-stage mg-grid mg-grid-lg';
        s.stage.style.setProperty('--n', N);

        let before = [], after = [], changed = [], tapped = new Set(), phase = 'idle';
        const cells = [];
        for (let i = 0; i < N * N; i++) {
            const c = document.createElement('button');
            c.type = 'button';
            c.className = 'mg-cell mg-tile';
            c.addEventListener('click', () => {
                if (phase !== 'answer') return;
                if (tapped.has(i)) { tapped.delete(i); c.classList.remove('is-on'); }
                else { tapped.add(i); c.classList.add('is-on'); }
            });
            s.stage.appendChild(c);
            cells.push(c);
        }

        const draw = (grid) => cells.forEach((c, i) => {
            c.innerHTML = shapeSvg(grid[i].shape, grid[i].colour.hex, grid[i].rot, grid[i].flip, true);
        });

        function mutate(cell) {
            const kind = pick(['colour', 'shape', 'rot', 'flip']);
            const out = Object.assign({}, cell);
            if (kind === 'colour') {
                while (out.colour === cell.colour) out.colour = pick(COLOURS);
            } else if (kind === 'shape') {
                while (out.shape === cell.shape) out.shape = pick(SHAPES);
            } else if (kind === 'rot') {
                out.rot = (cell.rot + pick([90, 180, 270])) % 360;
            } else {
                out.flip = !cell.flip;
            }
            return out;
        }

        function round() {
            phase = 'study';
            tapped.clear();
            cells.forEach((c) => c.classList.remove('is-on', 'is-right', 'is-wrong', 'is-missed'));
            before = Array.from({ length: N * N }, () => ({
                shape: pick(SHAPES), colour: pick(COLOURS), rot: pick([0, 90, 180, 270]), flip: false
            }));
            changed = shuffle([...Array(N * N).keys()]).slice(0, CHANGES);
            after = before.map((c, i) => (changed.includes(i) ? mutate(c) : c));
            draw(before);
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, STUDY, 'Study', () => {
                draw(after);
                phase = 'answer';
                s.stat.textContent = CHANGES + ' changed';
                s.go.textContent = 'Check';
                s.go.disabled = false;
            });
        }

        function check() {
            phase = 'done';
            s.stopAll();
            let found = 0;
            cells.forEach((c, i) => {
                const was = changed.includes(i), got = tapped.has(i);
                if (was && got) { found++; c.classList.add('is-right'); }
                else if (was) c.classList.add('is-missed');
                else if (got) c.classList.add('is-wrong');
            });
            const over = tapped.size - found;
            const score = Math.max(0, 100 - (CHANGES - found) * 25 - over * 10);
            s.tally(score);
            s.say(found + ' of ' + CHANGES + ' spotted' + (over ? ', ' + over + ' extra' : ''));
            s.go.textContent = 'Again';
        }

        s.go.addEventListener('click', () => (phase === 'answer' ? check() : round()));
        s.go.textContent = 'Start';
        s.say('Two cells will differ.');
        return () => s.stopAll();
    }

    /* ------------------------------------------------------ memory match --- */
    /* The app's flagship: a study screen, then a question about what was where.
     * Answers are fuzzy-matched a character either way, and getting one of the
     * two words is worth half, both from the original scoring. */

    function mountMemoryMatch(host) {
        const SLOTS = 4, STUDY = 9;
        const s = shell(host, { how: 'Memorise the slots, then answer one question about them.' });
        s.stage.className = 'mg-stage mg-slots';

        let cards = [], query = null, phase = 'idle', started = 0;
        const form = document.createElement('form');
        form.className = 'mg-answer mg-answer-wide';
        form.innerHTML = '<input type="text" autocomplete="off" spellcheck="false" placeholder="e.g. red triangle">' +
            '<button type="submit">Answer</button>';
        const input = form.querySelector('input');

        function round() {
            phase = 'study';
            const shapes = shuffle(SHAPES).slice(0, SLOTS);
            const colours = shuffle(COLOURS).slice(0, SLOTS);
            cards = shapes.map((shape, i) => ({ shape, colour: colours[i], slot: i + 1 }));
            s.stage.innerHTML = cards.map((c) =>
                '<div class="mg-slot"><span class="mg-slot-n">' + c.slot + '</span>' +
                shapeSvg(c.shape, c.colour.hex, 0, false) + '</div>').join('');
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, STUDY, 'Study', ask);
        }

        function ask() {
            phase = 'answer';
            const c = pick(cards);
            // Three question shapes, matching the app: whole card, one attribute,
            // and the chained one that goes the other way round.
            query = pick([
                { q: 'What was in slot ' + c.slot + '?', want: [c.colour.name, c.shape], hint: 'colour and shape' },
                { q: 'What shape was in slot ' + c.slot + '?', want: [c.shape], hint: 'shape' },
                { q: 'What colour was the ' + c.shape + '?', want: [c.colour.name], hint: 'colour' },
                { q: 'Which slot held the ' + c.colour.name + ' ' + c.shape + '?', want: [String(c.slot)], hint: 'slot number' }
            ]);
            s.stage.innerHTML = '<p class="mg-q">' + query.q + '</p>';
            s.stage.appendChild(form);
            input.placeholder = query.hint;
            input.value = '';
            s.stat.textContent = 'Answer';
            started = Date.now();
            input.focus();
        }

        function judge(text) {
            phase = 'done';
            s.stopAll();
            const hits = scoreWords(text, query.want);
            let score = Math.round((hits / query.want.length) * 100);
            if (query.want.length === 2 && hits === 1) score = 50;
            if (score === 100 && Date.now() - started < STUDY * 500) score += 10;
            s.tally(score);
            s.say(score >= 100 ? 'Right.' : 'It was “' + query.want.join(' ') + '”.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
            input.blur();
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (phase === 'answer') judge(input.value);
        });

        s.go.addEventListener('click', () => { if (phase !== 'study') round(); });
        s.go.textContent = 'Start';
        s.stage.innerHTML = '<p class="mg-q">Four slots, one question. A typo still counts.</p>';
        s.say('');
        return () => s.stopAll();
    }

    /* --------------------------------------------------- transform puzzle --- */
    /* A short rulebook, shown then taken away, and one input to run through it.
     * The app has text, numeric and visual rules; the visual ones are answered
     * by picking a shape rather than typing, since you cannot type a rotation. */

    function mountTransformPuzzle(host) {
        const STUDY = 9;
        const s = shell(host, { how: 'Learn the rules, then apply one from memory.' });
        s.stage.className = 'mg-stage mg-rules';

        const WORDS = ['ORBIT', 'PLANT', 'STONE', 'RIVER', 'CROWN', 'FLAME', 'GHOST', 'BRICK'];
        let rules = [], task = null, phase = 'idle';

        const form = document.createElement('form');
        form.className = 'mg-answer mg-answer-wide';
        form.innerHTML = '<input type="text" autocomplete="off" spellcheck="false" placeholder="result">' +
            '<button type="submit">Answer</button>';
        const input = form.querySelector('input');

        function makeRules() {
            const n1 = 2 + rnd(8), n2 = 2 + rnd(5);
            const suffix = pick(['ED', 'ING', 'ER']);
            const all = [
                { id: 'A', label: 'A · add “' + suffix + '”', kind: 'word',
                  run: (w) => w + suffix },
                { id: 'B', label: 'B · + ' + n1, kind: 'num', run: (v) => v + n1 },
                { id: 'C', label: 'C · × ' + n2, kind: 'num', run: (v) => v * n2 },
                { id: 'D', label: 'D · reverse it', kind: 'word',
                  run: (w) => w.split('').reverse().join('') },
                { id: 'E', label: 'E · drop the first letter', kind: 'word',
                  run: (w) => w.slice(1) },
                { id: 'F', label: 'F · rotate a quarter turn', kind: 'visual', run: (r) => (r + 90) % 360 }
            ];
            return shuffle(all).slice(0, 4);
        }

        function round() {
            phase = 'study';
            rules = makeRules();
            s.stage.innerHTML = '<ul class="mg-rulelist">' +
                rules.map((r) => '<li>' + r.label + '</li>').join('') + '</ul>';
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, STUDY, 'Study', ask);
        }

        function ask() {
            phase = 'answer';
            const r = pick(rules);
            if (r.kind === 'visual') {
                const shape = pick(['triangle', 'star', 'diamond', 'square']);
                const from = pick([0, 90, 180, 270]);
                const want = r.run(from);
                const opts = shuffle([want, (want + 90) % 360, (want + 180) % 360, (want + 270) % 360]);
                s.stage.innerHTML = '<p class="mg-q">Apply rule ' + r.id + ' to this.</p>' +
                    '<div class="mg-given">' + shapeSvg(shape, '#e8a33d', from, false, true) + '</div>' +
                    '<div class="mg-opts">' + opts.map((o) =>
                        '<button type="button" data-r="' + o + '">' +
                        shapeSvg(shape, '#5fbdb8', o, false, true) + '</button>').join('') + '</div>';
                s.stage.querySelectorAll('.mg-opts button').forEach((b) =>
                    b.addEventListener('click', () => judge(Number(b.dataset.r) === want ? 'ok' : 'no', String(want) + '°')));
            } else {
                const given = r.kind === 'num' ? String(3 + rnd(18)) : pick(WORDS);
                task = { want: String(r.run(r.kind === 'num' ? Number(given) : given)) };
                s.stage.innerHTML = '<p class="mg-q">Apply rule ' + r.id + ' to <b>' + given + '</b></p>';
                s.stage.appendChild(form);
                input.value = '';
                input.focus();
            }
            s.stat.textContent = 'Answer';
        }

        function judge(text, shown) {
            phase = 'done';
            s.stopAll();
            const ok = shown ? text === 'ok' : near(text, task.want);
            const score = ok ? 100 : 0;
            s.tally(score);
            s.say(ok ? 'Right.' : 'It was “' + (shown || task.want) + '”.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (phase === 'answer') judge(input.value, null);
        });

        s.go.addEventListener('click', () => { if (phase !== 'study') round(); });
        s.go.textContent = 'Start';
        s.stage.innerHTML = '<p class="mg-q">Four rules, nine seconds, then one of them comes back.</p>';
        s.say('');
        return () => s.stopAll();
    }

    window.jgMindOverride = {
        lightSquares: mountLightSquares,
        quantumCount: mountQuantumCount,
        wordFlash: mountWordFlash,
        patternSpot: mountPatternSpot,
        memoryMatch: mountMemoryMatch,
        transformPuzzle: mountTransformPuzzle,
        _tools: { lev, near, scoreWords, shuffle, shapeSvg, shell, countdown, SHAPES, COLOURS, rnd, pick }
    };
})();
