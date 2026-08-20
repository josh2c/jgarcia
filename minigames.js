/* Mind Override — six games from josh2c/mind_override, rebuilt in plain JS.
 *
 * Written against the Dart, not the docs. The docs summarise, and the summaries
 * mislead where it matters: "8 card attributes" turned out to describe a Stroop
 * face sitting behind a shuffled-number memory task, and Word Flash's "identify
 * repeated words" turned out to be sudden death.
 *
 * Difficulty is the app's own, all five tiers, chosen by the player:
 *
 *   Memory Match   slots 3/4/4/5/6   study 5/4/3/3/3s   answer 10/7/5/4/3s
 *   Pattern Spot   grid 2/3/3/4/4    study 12/8/6/5/4s  changes 1/2/3/4/4
 *   Word Flash     5/4/3/2/2s a word, 15+5 / 13+7 / 12+8 / 11+9 / 10+10
 *   Quantum Count  20-50 .. 200-300 dots, tolerance 10/7/5/3/2
 *   Transform      rules 4/5/6/6/7   flash 10/7/5/4/3s  answer 10/7/5/4/3s
 *   Light Squares  15/25/35/45/55% of the grid lit
 *
 * Dropped on purpose: the XP ladder, unlock thresholds, progression storage,
 * Gauntlet mode. Vortex Assemble is absent — physics, vortex gravity and
 * graph-traversal completion is a rewrite, not a port.
 *
 * Every mount(host) returns a cleanup, which the window manager runs on close.
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------ tools --- */

    const rnd = (n) => Math.floor(Math.random() * n);
    const pick = (a) => a[rnd(a.length)];
    const TIERS = ['Easy', 'Medium', 'Hard', 'Expert', 'Master'];

    function shuffle(a) {
        const out = a.slice();
        for (let i = out.length - 1; i > 0; i--) {
            const j = rnd(i + 1);
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    }

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    /* Levenshtein, capped. The app accepts an answer one character out. */
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
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                    prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = cur;
        }
        return prev[n];
    }

    const near = (a, b) => lev(a, b) <= 1;

    /* Both expected words, in any order, each allowed one typo. */
    function scoreWords(answer, expected) {
        const got = String(answer).toLowerCase().trim().split(/\s+/).filter(Boolean);
        const used = new Set();
        let hits = 0;
        for (const w of expected.map((x) => String(x).toLowerCase())) {
            const i = got.findIndex((g, k) => !used.has(k) && near(g, w));
            if (i >= 0) { used.add(i); hits++; }
        }
        return hits;
    }

    /* ---------------------------------------------------------- drawing --- */

    const PALETTE = [
        { name: 'red', hex: '#d32f2f' },
        { name: 'orange', hex: '#f57c00' },
        { name: 'yellow', hex: '#fbc02d' },
        { name: 'green', hex: '#43a047' },
        { name: 'blue', hex: '#1e88e5' },
        { name: 'purple', hex: '#8e24aa' },
        { name: 'white', hex: '#ffffff' },
        { name: 'black', hex: '#212121' }
    ];
    const BRIGHT = PALETTE.slice(0, 6);

    function lum(hex) {
        const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
            .map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    /* Any ink lands on any background here, deliberately — the card puts every
     * colour against every other. Outlining the type is what keeps white on
     * orange and yellow on white legible. */
    const outline = (hex) => (lum(hex) > 0.4 ? '#111' : '#fff');

    const SHAPE_PATH = {
        circle: '<circle cx="32" cy="32" r="26"/>',
        square: '<rect x="7" y="7" width="50" height="50"/>',
        triangle: '<path d="M32 5 60 58 4 58Z"/>',
        rectangle: '<rect x="4" y="16" width="56" height="32"/>',
        star: '<path d="M32 5 39 24 59 25 43 37 48 57 32 46 16 57 21 37 5 25 25 24Z"/>',
        diamond: '<path d="M32 4 58 32 32 60 6 32Z"/>',
        arrow: '<path d="M6 24h28V10l24 22-24 22V40H6Z"/>'
    };

    /* Every shape carries a dark edge, so a yellow shape on a white card is
     * still a shape. The original relies on fill alone and loses those pairs. */
    function shapeSvg(shape, hex, opts) {
        const o = opts || {};
        const t = 'rotate(' + (o.rot || 0) + ' 32 32)' +
            (o.flip === 'h' ? ' scale(-1 1) translate(-64 0)' : '') +
            (o.flip === 'v' ? ' scale(1 -1) translate(0 -64)' : '');
        return '<svg viewBox="0 0 64 64" aria-hidden="true" class="mg-svg">' +
            '<g transform="' + t + '" fill="' + hex + '" stroke="rgba(0,0,0,0.55)" stroke-width="2">' +
            SHAPE_PATH[shape] + '</g></svg>';
    }

    /* ------------------------------------------------------------ shell --- */

    function shell(host, opts) {
        host.innerHTML =
            '<div class="mg">' +
                '<div class="mg-bar"><span class="mg-how"></span><span class="mg-stat"></span></div>' +
                '<div class="mg-stage"></div>' +
                '<div class="mg-foot">' +
                    '<span class="mg-msg"></span>' +
                    '<span class="mg-right">' +
                        '<span class="mg-tiers" role="group" aria-label="Difficulty">' +
                            TIERS.map((t, i) => '<button type="button" data-t="' + i + '"' +
                                (i === 0 ? ' class="is-on"' : '') + '>' + t + '</button>').join('') +
                        '</span>' +
                        '<button type="button" class="mg-go"></button>' +
                    '</span>' +
                '</div>' +
            '</div>';

        const q = (sel) => host.querySelector(sel);
        const timers = new Set();
        const tierButtons = host.querySelectorAll('.mg-tiers button');
        let tier = 0;

        const api = {
            stage: q('.mg-stage'),
            how: q('.mg-how'),
            stat: q('.mg-stat'),
            msg: q('.mg-msg'),
            foot: q('.mg-foot'),
            go: q('.mg-go'),
            best: 0,
            streak: 0,
            tier: () => tier,
            lockTiers(on) { tierButtons.forEach((b) => { b.disabled = !!on; }); },
            after(ms, fn) { const t = setTimeout(fn, ms); timers.add(t); return t; },
            every(ms, fn) { const t = setInterval(fn, ms); timers.add(t); return t; },
            stop(t) { clearTimeout(t); clearInterval(t); timers.delete(t); },
            stopAll() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers.clear(); },
            say(m) { api.msg.textContent = m; },
            tally(score, extra) {
                api.streak = score >= 100 ? api.streak + 1 : 0;
                api.best = Math.max(api.best, api.streak);
                api.stat.textContent = 'Score ' + score + ' · streak ' + api.streak +
                    (api.best > api.streak ? ' (best ' + api.best + ')' : '') +
                    (extra ? ' · ' + extra : '');
            }
        };

        tierButtons.forEach((b) => b.addEventListener('click', () => {
            tier = Number(b.dataset.t);
            tierButtons.forEach((o) => o.classList.toggle('is-on', o === b));
            if (opts.onTier) opts.onTier(tier);
        }));

        api.how.textContent = opts.how;
        return api;
    }

    /* Counts down in the status slot and fires once at zero. */
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

    /* ------------------------------------------------------ memory match --- */
    /* Two screens, and the first one is the whole game.
     *
     * Screen 1 shows nothing but a position number on each card, SHUFFLED — the
     * third card along might be slot 1. You memorise which slot sits where.
     *
     * Screen 2 puts the same cards in the same order with their faces up and no
     * numbers, next to the question and the answer box. You read the answer off
     * a card you can see, provided you remember which one it is.
     *
     * A face carries eight queryable things: background colour, outer shape and
     * its colour, inner shape and its colour, a digit, a colour word and a shape
     * word. The words are bait — "WHITE" printed in orange on a yellow card —
     * and which of the two sits on top varies. */

    const MM = {
        slots: [3, 4, 4, 5, 6],
        study: [5, 4, 3, 3, 3],
        answer: [10, 7, 5, 4, 3],
        shapes: ['circle', 'square', 'triangle', 'rectangle'],
        attrs: [
            { label: 'BACKGROUND COLOR', of: (c) => c.bg.name },
            { label: 'OUTER SHAPE', of: (c) => c.outer },
            { label: 'OUTER SHAPE COLOR', of: (c) => c.outerCol.name },
            { label: 'INNER SHAPE', of: (c) => c.inner },
            { label: 'INNER SHAPE COLOR', of: (c) => c.innerCol.name },
            { label: 'DIGIT', of: (c) => String(c.digit) },
            { label: 'COLOR WORD', of: (c) => c.colourWord },
            { label: 'SHAPE WORD', of: (c) => c.shapeWord }
        ]
    };

    function mountMemoryMatch(host) {
        const s = shell(host, { how: 'Memorise which slot number sits where, then read the answer off the faces.' });
        let cards = [], order = [], query = null, phase = 'idle', started = 0;

        const form = document.createElement('form');
        form.className = 'mg-answer mg-answer-wide';
        form.innerHTML = '<input type="text" autocomplete="off" spellcheck="false" placeholder="two words">' +
            '<button type="submit">Answer</button>';
        const input = form.querySelector('input');

        function makeCard(slot) {
            const bg = pick(PALETTE);
            let outerCol = pick(PALETTE);
            while (outerCol.name === bg.name) outerCol = pick(PALETTE);
            let innerCol = pick(PALETTE);
            while (innerCol.name === outerCol.name) innerCol = pick(PALETTE);
            return {
                slot, bg,
                outer: pick(MM.shapes), outerCol,
                inner: pick(MM.shapes), innerCol,
                digit: 1 + rnd(9), digitInk: pick(PALETTE),
                colourWord: pick(PALETTE).name, colourInk: pick(PALETTE),
                shapeWord: pick(MM.shapes), shapeInk: pick(PALETTE),
                swapped: Math.random() < 0.5
            };
        }

        const word = (text, ink) =>
            '<span class="mm-word" style="color:' + ink.hex + ';-webkit-text-stroke:0.6px ' +
            outline(ink.hex) + '">' + esc(String(text).toUpperCase()) + '</span>';

        function face(c) {
            const w = [word(c.colourWord, c.colourInk), word(c.shapeWord, c.shapeInk)];
            if (c.swapped) w.reverse();
            return '<div class="mm-card" style="background:' + c.bg.hex + '">' + w[0] +
                '<span class="mm-mid">' + shapeSvg(c.outer, c.outerCol.hex) +
                    '<span class="mm-inner">' + shapeSvg(c.inner, c.innerCol.hex) + '</span>' +
                    '<span class="mm-digit" style="color:' + c.digitInk.hex + ';-webkit-text-stroke:0.7px ' +
                        outline(c.digitInk.hex) + '">' + c.digit + '</span>' +
                '</span>' + w[1] + '</div>';
        }

        function round() {
            const t = s.tier();
            phase = 'study';
            s.lockTiers(true);
            cards = Array.from({ length: MM.slots[t] }, (_, i) => makeCard(i + 1));
            // Shuffled for display, and the SAME order is reused on the answer
            // screen — that mapping is the only thing worth memorising.
            order = shuffle(cards);
            s.stage.className = 'mg-stage mm-stage';
            s.stage.innerHTML = '<p class="mm-title">Memorise the position numbers</p>' +
                '<div class="mm-row">' + order.map((c) =>
                    '<div class="mm-card mm-back"><span>' + c.slot + '</span></div>').join('') + '</div>';
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, MM.study[t], 'Study', ask);
        }

        function ask() {
            const t = s.tier();
            phase = 'answer';
            const attrs = shuffle(MM.attrs);
            const n = cards.length;
            const a = 1 + rnd(n);
            let b = 1 + rnd(n);
            while (b === a) b = 1 + rnd(n);
            query = {
                text: 'Enter the ' + attrs[0].label + ' (' + a + ') and ' + attrs[1].label + ' (' + b + ')',
                want: [attrs[0].of(cards[a - 1]), attrs[1].of(cards[b - 1])]
            };
            s.stage.innerHTML = '<div class="mm-row">' + order.map(face).join('') + '</div>' +
                '<p class="mm-q">' + esc(query.text.toUpperCase()) + '</p>';
            s.stage.appendChild(form);
            input.value = '';
            started = Date.now();
            input.focus();
            countdown(s, MM.answer[t], 'Answer', () => judge(''));
        }

        function judge(text) {
            if (phase !== 'answer') return;
            phase = 'done';
            s.stopAll();
            s.lockTiers(false);
            const hits = scoreWords(text, query.want);
            let score = hits === 2 ? 100 : hits === 1 ? 50 : 0;
            if (score === 100 && Date.now() - started < MM.answer[s.tier()] * 500) score += 10;
            s.tally(score);
            s.stage.insertAdjacentHTML('beforeend',
                '<p class="mm-reveal">Real numbers: ' + order.map((c) => c.slot).join(' ') +
                '<br>Solution: ' + esc(query.want.join(' ').toUpperCase()) + '</p>');
            s.say(hits === 2 ? 'Both right.' : hits === 1 ? 'Half of it.' : 'Neither.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
            input.blur();
        }

        form.addEventListener('submit', (e) => { e.preventDefault(); judge(input.value); });
        s.go.addEventListener('click', () => { if (phase !== 'study') round(); });
        s.go.textContent = 'Start';
        s.stage.className = 'mg-stage mm-stage';
        s.stage.innerHTML = '<p class="mm-title">First the numbers, shuffled. Then the faces, without them.</p>';
        return () => s.stopAll();
    }

    /* ------------------------------------------------------- word flash --- */
    /* Twenty words, some coming round a second time. Call each new or seen. One
     * wrong call, or one word you let time out, and the run is over — the app
     * emits WordFlashFailure for both. */

    const WF = {
        seconds: [5, 4, 3, 2, 2],
        unique: [15, 13, 12, 11, 10],
        repeat: [5, 7, 8, 9, 10],
        pool: ['APPLE', 'BANANA', 'CHERRY', 'DRAGON', 'ELEPHANT', 'FOREST', 'GUITAR', 'HORIZON',
            'ISLAND', 'JUNGLE', 'KEYBOARD', 'LEMON', 'MOUNTAIN', 'NEBULA', 'OCEAN', 'PYRAMID',
            'QUARTZ', 'ROCKET', 'SUNSET', 'TIGER', 'UMBRELLA', 'VOLCANO', 'WHISPER', 'GALAXY',
            'THUNDER', 'CRYSTAL', 'MEADOW', 'PHOENIX', 'SHADOW', 'BREEZE', 'CANYON', 'EMBER',
            'HARMONY', 'LANTERN', 'MIRROR', 'PRISM', 'RIVER', 'SPARK', 'VALLEY', 'WINTER']
    };

    function mountWordFlash(host) {
        const s = shell(host, { how: 'New word, or one you have already seen? A single mistake ends the run.' });
        s.stage.className = 'mg-stage mg-word';
        s.stage.innerHTML = '<span class="mg-big"></span><div class="mg-choice">' +
            '<button type="button" data-a="new">New <kbd>N</kbd></button>' +
            '<button type="button" data-a="seen">Seen <kbd>S</kbd></button></div>';
        const big = s.stage.querySelector('.mg-big');
        const buttons = s.stage.querySelectorAll('.mg-choice button');
        let seq = [], at = 0, phase = 'idle', tick = 0;

        function build(t) {
            const words = shuffle(WF.pool).slice(0, WF.unique[t]);
            const out = words.map((w) => ({ w, seen: false }));
            for (let i = 0; i < WF.repeat[t]; i++) {
                const w = pick(words);
                const first = out.findIndex((e) => e.w === w);
                out.splice(first + 1 + rnd(out.length - first), 0, { w, seen: true });
            }
            return out;
        }

        function show() {
            if (at >= seq.length) return finish(true);
            big.textContent = seq[at].w;
            big.classList.remove('mg-flash');
            void big.offsetWidth;
            big.classList.add('mg-flash');
            let left = WF.seconds[s.tier()];
            const label = () => { s.stat.textContent = (at + 1) + ' / ' + seq.length + ' · ' + Math.max(0, left) + 's'; };
            label();
            tick = s.every(1000, () => { left--; label(); if (left <= 0) { s.stop(tick); answer(null); } });
        }

        function answer(said) {
            if (phase !== 'play') return;
            s.stop(tick);
            const want = seq[at].seen ? 'seen' : 'new';
            if (said !== want) { big.classList.add('is-wrong'); return finish(false, want, seq[at].w, said === null); }
            big.classList.add('is-right');
            at++;
            s.after(170, () => { big.classList.remove('is-right'); show(); });
        }

        function finish(cleared, want, word, timedOut) {
            phase = 'done';
            s.stopAll();
            s.lockTiers(false);
            s.tally(cleared ? 100 : 0, cleared ? null : 'survived ' + at + '/' + seq.length);
            big.textContent = cleared ? 'CLEARED' : word;
            s.say(cleared ? 'All ' + seq.length + ' of them.'
                : (timedOut ? 'Out of time on ' : 'Wrong on ') + word + ' — it was ' + want + '.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
            buttons.forEach((b) => { b.disabled = true; });
        }

        buttons.forEach((b) => b.addEventListener('click', () => answer(b.dataset.a)));
        const key = (e) => {
            if (phase !== 'play') return;
            if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            if (e.key === 'n' || e.key === 'N') answer('new');
            if (e.key === 's' || e.key === 'S') answer('seen');
        };
        document.addEventListener('keydown', key);

        s.go.addEventListener('click', () => {
            seq = build(s.tier());
            at = 0;
            phase = 'play';
            s.lockTiers(true);
            big.classList.remove('is-wrong', 'is-right');
            buttons.forEach((b) => { b.disabled = false; });
            s.say('');
            s.go.textContent = 'Running…';
            s.go.disabled = true;
            show();
        });

        s.go.textContent = 'Start';
        big.textContent = '—';
        s.say('Clear all twenty without a miss.');
        buttons.forEach((b) => { b.disabled = true; });
        return () => { document.removeEventListener('keydown', key); s.stopAll(); };
    }

    /* ----------------------------------------------------- quantum count --- */
    /* Nothing is hidden and nothing is timed. The dots keep moving and the box
     * is right there — the difficulty is only that a moving swarm cannot be
     * counted one at a time. */

    const QC = { low: [20, 50, 100, 150, 200], high: [50, 100, 150, 200, 300], tol: [10, 7, 5, 3, 2] };

    function mountQuantumCount(host) {
        const s = shell(host, { how: 'Estimate the swarm. Nothing is hidden and there is no clock.' });
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
            const t = s.tier();
            phase = 'live';
            s.lockTiers(true);
            form.hidden = false;
            size();
            actual = QC.low[t] + rnd(QC.high[t] - QC.low[t] + 1);
            const base = actual > 150 ? 2.2 : actual > 80 ? 3 : 4.2;
            dots = Array.from({ length: actual }, () => ({
                x: 10 + Math.random() * (canvas.width - 20),
                y: 10 + Math.random() * (canvas.height - 20),
                vx: (Math.random() - 0.5) * 1.6,
                vy: (Math.random() - 0.5) * 1.6,
                r: base + Math.random() * 1.4,
                c: pick(BRIGHT).hex
            }));
            input.value = '';
            s.stat.textContent = 'Within ' + QC.tol[t];
            s.say('');
            s.go.textContent = 'Counting…';
            s.go.disabled = true;
            cancelAnimationFrame(raf);
            frame();
            input.focus();
        }

        function judge(guess) {
            const t = s.tier();
            phase = 'done';
            s.lockTiers(false);
            cancelAnimationFrame(raf);
            const err = Math.abs(guess - actual);
            let score = 0;
            if (err <= QC.tol[t]) score = 100 - Math.round((err / QC.tol[t]) * 50) + (err === 0 ? 10 : 0);
            s.tally(score);
            s.say(err === 0 ? 'Exactly ' + actual + '.' : 'It was ' + actual + ', you were ' + err + ' out.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const g = parseInt(input.value, 10);
            if (phase === 'live' && Number.isFinite(g)) judge(g);
        });

        s.go.addEventListener('click', () => { if (phase !== 'live') round(); });
        s.go.textContent = 'Start';
        s.say('They move, so counting one by one will not work.');
        form.hidden = true;
        return () => { cancelAnimationFrame(raf); s.stopAll(); };
    }

    /* ------------------------------------------------------ pattern spot --- */
    /* One grid, then a second. Tap what changed — a colour, a shape, a rotation
     * or a flip. From Hard up there is a one-in-ten chance nothing changed at
     * all, and calling that is worth a bonus. */

    const PS = {
        grid: [2, 3, 3, 4, 4],
        study: [12, 8, 6, 5, 4],
        changes: [1, 2, 3, 4, 4],
        shapes: ['square', 'circle', 'triangle', 'star', 'arrow', 'diamond'],
        flips: [null, 'h', 'v']
    };

    function mountPatternSpot(host) {
        const s = shell(host, { how: 'Tap every cell that changed. An extra tap costs less than a miss.' });
        let before = [], after = [], changed = [], tapped = new Set(), trap = false, phase = 'idle', cells = [];

        const noChange = document.createElement('button');
        noChange.type = 'button';
        noChange.className = 'ps-nochange';
        noChange.textContent = 'Nothing changed';

        function build(n) {
            s.stage.className = 'mg-stage mg-grid mg-grid-lg';
            s.stage.style.setProperty('--n', n);
            s.stage.innerHTML = '';
            cells = [];
            for (let i = 0; i < n * n; i++) {
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
        }

        const draw = (g) => cells.forEach((c, i) =>
            (c.innerHTML = shapeSvg(g[i].shape, g[i].colour.hex, { rot: g[i].rot, flip: g[i].flip })));

        function mutate(cell) {
            const out = Object.assign({}, cell);
            switch (pick(['colour', 'shape', 'rot', 'flip'])) {
                case 'colour':
                    out.colour = pick(BRIGHT.filter((c) => c.name !== cell.colour.name));
                    break;
                case 'shape':
                    out.shape = pick(PS.shapes.filter((x) => x !== cell.shape));
                    break;
                case 'rot':
                    out.rot = pick([0, 90, 180, 270].filter((r) => r !== cell.rot));
                    break;
                default:
                    out.flip = pick(PS.flips.filter((f) => f !== cell.flip));
            }
            return out;
        }

        function round() {
            const t = s.tier(), n = PS.grid[t];
            phase = 'study';
            s.lockTiers(true);
            tapped.clear();
            build(n);
            before = Array.from({ length: n * n }, () => ({
                shape: pick(PS.shapes), colour: pick(BRIGHT),
                rot: pick([0, 90, 180, 270]), flip: pick(PS.flips)
            }));
            trap = t >= 2 && Math.random() < 0.1;
            changed = trap ? [] : shuffle([...Array(n * n).keys()]).slice(0, PS.changes[t]);
            after = before.map((c, i) => (changed.includes(i) ? mutate(c) : c));
            draw(before);
            noChange.remove();
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, PS.study[t], 'Study', () => {
                draw(after);
                phase = 'answer';
                // From Hard the count is withheld: knowing it would give the
                // no-change trap away for free.
                s.stat.textContent = t >= 2 ? 'Tap the changes' : PS.changes[t] + ' changed';
                s.go.textContent = 'Check';
                s.go.disabled = false;
                if (t >= 2) s.foot.insertBefore(noChange, s.msg.nextSibling);
            });
        }

        function check(saidNoChange) {
            if (phase !== 'answer') return;
            phase = 'done';
            s.stopAll();
            s.lockTiers(false);
            noChange.remove();
            let score;
            if (trap) {
                score = saidNoChange ? 110 : 0;
                s.say(saidNoChange ? 'Nothing changed, and you called it.' : 'Nothing had changed.');
            } else if (saidNoChange) {
                score = 0;
                s.say('Something did change — ' + changed.length + ' of them.');
                cells.forEach((c, i) => { if (changed.includes(i)) c.classList.add('is-missed'); });
            } else {
                let found = 0;
                cells.forEach((c, i) => {
                    const was = changed.includes(i), got = tapped.has(i);
                    if (was && got) { found++; c.classList.add('is-right'); }
                    else if (was) c.classList.add('is-missed');
                    else if (got) c.classList.add('is-wrong');
                });
                const over = tapped.size - found;
                score = Math.max(0, 100 - (changed.length - found) * 25 - over * 10);
                s.say(found + ' of ' + changed.length + ' spotted' + (over ? ', ' + over + ' extra' : ''));
            }
            s.tally(score);
            s.go.textContent = 'Again';
        }

        noChange.addEventListener('click', () => check(true));
        s.go.addEventListener('click', () => (phase === 'answer' ? check(false) : round()));
        s.go.textContent = 'Start';
        s.stage.className = 'mg-stage';
        s.say('Two grids, a few seconds apart.');
        return () => s.stopAll();
    }

    /* --------------------------------------------------- transform puzzle --- */
    /* The rule book flashes, then the inputs appear, then a two-part query. Both
     * stay on screen — this is a timed application test, not a memory one. From
     * Expert the second part may chain onto the first's output, and at Master a
     * rule quietly mutates after you have read the book.
     *
     * The app's eighth rule, "Rotate 90 CW", is absent: its result is an
     * orientation, and there is no way to type one as half of a two-word
     * answer. */

    const TP = {
        rules: [4, 5, 6, 6, 7],
        flash: [10, 7, 5, 4, 3],
        answer: [10, 7, 5, 4, 3],
        cycle: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
        book: [
            { d: '+2 letters: A→C', kind: 'text',
              run: (v) => v.replace(/[A-Z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 65 + 2) % 26 + 65)) },
            { d: 'Reverse string', kind: 'text', run: (v) => v.split('').reverse().join('') },
            { d: 'Uppercase all', kind: 'text', run: (v) => v.toUpperCase() },
            { d: 'Add 3 to number', kind: 'num', run: (v) => String(Number(v) + 3) },
            { d: 'Multiply by 2', kind: 'num', run: (v) => String(Number(v) * 2) },
            { d: 'Subtract 5', kind: 'num', run: (v) => String(Number(v) - 5) },
            { d: 'Next color in cycle', kind: 'colour',
              run: (v) => TP.cycle[(TP.cycle.indexOf(v) + 1) % TP.cycle.length] }
        ]
    };

    function mountTransformPuzzle(host) {
        const s = shell(host, { how: 'Apply two rules to two inputs. Everything stays on screen; the clock is the test.' });
        s.stage.className = 'mg-stage mg-rules';
        let rules = [], inputs = [], want = null, phase = 'idle';

        const form = document.createElement('form');
        form.className = 'mg-answer mg-answer-wide';
        form.innerHTML = '<input type="text" autocomplete="off" spellcheck="false" placeholder="two results">' +
            '<button type="submit">Answer</button>';
        const input = form.querySelector('input');

        const kindOf = (v) => (/^-?\d+$/.test(v) ? 'num' : TP.cycle.includes(v) ? 'colour' : 'text');

        const ofKind = (k) => {
            if (k === 'num') return String(1 + rnd(20));
            if (k === 'colour') return pick(TP.cycle);
            const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return Array.from({ length: 3 + rnd(3) }, () => L[rnd(26)]).join('');
        };

        /* Inputs are dealt AFTER the rules, one guaranteed for every kind of
         * rule on the table. Dealt independently, a book of three text rules
         * and a pair of numbers has no legal question in it, and the only way
         * out was to redeal the whole round — which silently restarted the
         * study clock under the player. */
        function makeInputs(t) {
            const need = [...new Set(rules.map((r) => r.kind))];
            const n = Math.max(t === 0 ? 2 : 4, need.length);
            const out = need.map(ofKind);
            while (out.length < n) out.push(ofKind(pick(need)));
            return shuffle(out);
        }

        const rulesHtml = (mut) => '<ol class="mg-rulelist">' + rules.map((r, i) =>
            '<li' + (i === mut ? ' class="is-mutated"' : '') + '><b>' + (i + 1) + '</b> ' +
            esc(r.d) + '</li>').join('') + '</ol>';
        const inputsHtml = () => '<ul class="tp-inputs">' + inputs.map((v, i) =>
            '<li><b>' + (i + 1) + '</b> ' + esc(v) + '</li>').join('') + '</ul>';

        function round() {
            const t = s.tier();
            phase = 'flash';
            s.lockTiers(true);
            rules = shuffle(TP.book).slice(0, Math.min(TP.rules[t], TP.book.length));
            inputs = makeInputs(t);
            s.stage.innerHTML = rulesHtml(-1);
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, TP.flash[t], 'Rules', ask);
        }

        function ask() {
            const t = s.tier();
            phase = 'answer';
            let mut = -1;
            if (t === 4 && Math.random() < 0.2) {
                mut = rnd(rules.length);
                const alt = TP.book.filter((r) => r.kind === rules[mut].kind && r.d !== rules[mut].d);
                if (alt.length) rules[mut] = pick(alt);
            }
            // A rule can only be asked of an input it can actually take.
            const fits = (r) => inputs.map((v, i) => ({ v, i })).filter((x) => kindOf(x.v) === r.kind);
            const usable = rules.map((r, i) => ({ r, i, ins: fits(r) })).filter((c) => c.ins.length);
            const a = pick(usable);
            const pa = pick(a.ins);
            const r1 = a.r.run(pa.v);

            let second = '', r2;
            if (t >= 3 && Math.random() < 0.5) {
                const chainable = rules.map((r, i) => ({ r, i })).filter((c) => c.r.kind === kindOf(r1));
                if (chainable.length) {
                    const b = pick(chainable);
                    r2 = b.r.run(r1);
                    second = 'rule ' + (b.i + 1) + ' to that result';
                }
            }
            if (!second) {
                const rest = usable.filter((c) => c.i !== a.i);
                const b = pick(rest.length ? rest : usable);
                const pb = pick(b.ins);
                r2 = b.r.run(pb.v);
                second = 'rule ' + (b.i + 1) + ' to input ' + (pb.i + 1);
            }
            want = [r1, r2];

            s.stage.innerHTML = rulesHtml(mut) + inputsHtml() +
                '<p class="mg-q">Apply rule ' + (a.i + 1) + ' to input ' + (pa.i + 1) + ', and ' + second + '.</p>';
            s.stage.appendChild(form);
            input.value = '';
            input.focus();
            countdown(s, TP.answer[t], 'Answer', () => judge(''));
        }

        function judge(text) {
            if (phase !== 'answer') return;
            phase = 'done';
            s.stopAll();
            s.lockTiers(false);
            const hits = scoreWords(text, want);
            s.tally(hits === 2 ? 100 : hits === 1 ? 50 : 0);
            s.say(hits === 2 ? 'Both right.' : 'Answer was “' + want.join(' ') + '”.');
            s.go.textContent = 'Again';
            s.go.disabled = false;
        }

        form.addEventListener('submit', (e) => { e.preventDefault(); judge(input.value); });
        s.go.addEventListener('click', () => { if (phase !== 'flash') round(); });
        s.go.textContent = 'Start';
        s.stage.innerHTML = '<p class="mg-q">A rule book, then inputs, then two of them to apply.</p>';
        return () => s.stopAll();
    }

    /* ---------------------------------------------------- light squares --- */
    /* Lit squares, then a blank grid. Rebuild it exactly — the app scores this
     * all or nothing — and it times you, keeping your best. Grid size is the
     * player's, as it is there. */

    const LS = { lit: [0.15, 0.25, 0.35, 0.45, 0.55], study: [7, 6, 5, 4, 4] };

    function mountLightSquares(host) {
        const s = shell(host, { how: 'Rebuild the pattern exactly. Every lit square, and nothing else.' });
        let size = 5, pattern = [], picked = new Set(), phase = 'idle', started = 0, bestTime = null, cells = [];

        const grid = document.createElement('div');
        const row = document.createElement('div');
        row.className = 'ls-size';
        row.innerHTML = 'Grid <input type="range" min="3" max="8" value="5"><span>5×5</span>';
        const slider = row.querySelector('input');
        const label = row.querySelector('span');

        function build() {
            grid.className = 'mg-grid';
            grid.style.setProperty('--n', size);
            grid.innerHTML = '';
            cells = [];
            for (let i = 0; i < size * size; i++) {
                const c = document.createElement('button');
                c.type = 'button';
                c.className = 'mg-cell';
                c.addEventListener('click', () => {
                    if (phase !== 'answer') return;
                    if (picked.has(i)) { picked.delete(i); c.classList.remove('is-on'); }
                    else { picked.add(i); c.classList.add('is-on'); }
                });
                grid.appendChild(c);
                cells.push(c);
            }
        }

        slider.addEventListener('input', () => {
            if (phase === 'study' || phase === 'answer') return;
            size = Number(slider.value);
            label.textContent = size + '×' + size;
            build();
        });

        function round() {
            const t = s.tier();
            phase = 'study';
            s.lockTiers(true);
            slider.disabled = true;
            picked.clear();
            build();
            const lit = Math.max(1, Math.round(size * size * LS.lit[t]));
            pattern = shuffle([...Array(size * size).keys()]).slice(0, lit);
            cells.forEach((c, i) => c.classList.toggle('is-on', pattern.includes(i)));
            s.say('');
            s.go.textContent = 'Studying…';
            s.go.disabled = true;
            countdown(s, LS.study[t], 'Study', () => {
                cells.forEach((c) => c.classList.remove('is-on'));
                phase = 'answer';
                started = Date.now();
                s.stat.textContent = 'Rebuild ' + lit;
                s.go.textContent = 'Check';
                s.go.disabled = false;
            });
        }

        function check() {
            if (phase !== 'answer') return;
            phase = 'done';
            s.stopAll();
            s.lockTiers(false);
            slider.disabled = false;
            const secs = (Date.now() - started) / 1000;
            const hit = pattern.filter((i) => picked.has(i)).length;
            const exact = picked.size === pattern.length && hit === pattern.length;
            cells.forEach((c, i) => {
                const want = pattern.includes(i), got = picked.has(i);
                if (want && got) c.classList.add('is-right');
                else if (want) c.classList.add('is-missed');
                else if (got) c.classList.add('is-wrong');
            });
            if (exact && (bestTime === null || secs < bestTime)) bestTime = secs;
            s.tally(exact ? 100 : 0, bestTime === null ? null : 'best ' + bestTime.toFixed(1) + 's');
            s.say(exact ? 'Exact, in ' + secs.toFixed(1) + 's.'
                : hit + ' of ' + pattern.length + ', ' + (picked.size - hit) + ' wrong.');
            s.go.textContent = 'Again';
        }

        s.go.addEventListener('click', () => {
            if (phase === 'answer') return check();
            cells.forEach((c) => c.classList.remove('is-right', 'is-wrong', 'is-missed'));
            round();
        });

        s.stage.className = 'mg-stage ls-stage';
        s.stage.appendChild(grid);
        s.stage.appendChild(row);
        build();
        s.go.textContent = 'Start';
        s.say('Exact or nothing.');
        return () => s.stopAll();
    }

    window.jgMindOverride = {
        memoryMatch: mountMemoryMatch,
        patternSpot: mountPatternSpot,
        quantumCount: mountQuantumCount,
        wordFlash: mountWordFlash,
        transformPuzzle: mountTransformPuzzle,
        lightSquares: mountLightSquares
    };
})();
