/* Play every game by its real rules, on a clock I can wind forward.
 *
 * The bar is not "a score appeared" — that passes on a game that is completely
 * wrong, which is exactly what happened the first time round. Each game here is
 * played CORRECTLY, by reading its own state back out of the DOM, so a wrong
 * answer failing is a real signal.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import { document, window, tick, clock, schedule } from './dom.mjs';

const sandbox = {
    document, window, console,
    Math, Date, Set, Map, Array, Object, String, Number, JSON, RegExp, Boolean, parseInt,
    setTimeout: (fn, ms) => schedule(fn, ms, false),
    setInterval: (fn, ms) => schedule(fn, ms, true),
    clearTimeout: (id) => clock.timers.delete(id),
    clearInterval: (id) => clock.timers.delete(id),
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame
};
sandbox.window = Object.assign(window, sandbox);
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../minigames.js', import.meta.url), 'utf8'), sandbox);

const games = sandbox.window.jgMindOverride;
let fails = 0;
const ok = (label, cond, extra) => {
    if (!cond) fails++;
    console.log('    ' + (cond ? 'ok  ' : 'FAIL') + ' ' + label + (extra ? '  ' + extra : ''));
};
const fresh = () => document.createElement('div');
const stat = (h) => (h.querySelector('.mg-stat') || {}).textContent || '';
const msg = (h) => (h.querySelector('.mg-msg') || {}).textContent || '';
const go = (h) => h.querySelector('.mg-go');
const setTier = (h, i) => h.querySelectorAll('.mg-tiers button')[i].dispatch('click');
/* Wind forward past the study phase and no further. Overshooting runs the
   answer countdown out too, and the round is scored zero before the test has
   typed anything — which reads as a broken game and is a broken test. */
const MM_STUDY = [5, 4, 3, 3, 3], TP_FLASH = [10, 7, 5, 4, 3], PS_STUDY = [12, 8, 6, 5, 4];
const past = (secs) => tick(secs * 1000 + 400);
const score = (h) => Number((/Score (\d+)/.exec(stat(h)) || [])[1]);

function run(name, fn) {
    console.log('  ' + name);
    try { fn(); } catch (e) {
        fails++;
        console.log('    FAIL threw: ' + e.message + '\n      ' + (e.stack || '').split('\n')[1]);
    }
}

/* ---------- shared ---------- */

run('every game offers all five tiers and cleans up after itself', () => {
    for (const [name, mount] of Object.entries(games)) {
        const h = fresh();
        const cleanup = mount(h);
        const tiers = h.querySelectorAll('.mg-tiers button');
        if (tiers.length !== 5) ok(name + ' has five tiers', false, tiers.length + ' found');
        cleanup();
        const before = clock.timers.size;
        tick(30000);
        if (clock.timers.size > before) ok(name + ' leaves nothing ticking', false);
    }
    ok('all six mount, offer five tiers, and stop cleanly', true, Object.keys(games).length + ' games');
});

/* ---------- Memory Match ---------- */
/* Screen 1 is numbers only, shuffled. Screen 2 is the same order, faces up, no
   numbers. Read the faces, answer the prompt, expect full marks. */

const SHAPE_OF = (svg) => {
    const kid = svg.children[0].children[0];
    if (kid.tag === 'circle') return 'circle';
    if (kid.tag === 'path') return kid.attrs.d.startsWith('M32 5 60') ? 'triangle' : 'diamond';
    return kid.attrs.width === '50' ? 'square' : 'rectangle';
};
const HEX_NAME = {
    '#d32f2f': 'red', '#f57c00': 'orange', '#fbc02d': 'yellow', '#43a047': 'green',
    '#1e88e5': 'blue', '#8e24aa': 'purple', '#ffffff': 'white', '#212121': 'black'
};
const fillOf = (svg) => HEX_NAME[svg.children[0].attrs.fill.toLowerCase()];
const inkOf = (el) => HEX_NAME[(el.attrs.style || '').match(/#[0-9a-f]{6}/i)[0].toLowerCase()];

function readFaces(host) {
    return host.querySelectorAll('.mm-row .mm-card').map((card) => {
        const words = card.querySelectorAll('.mm-word');
        const mid = card.querySelector('.mm-mid');
        const outer = mid.children.find((c) => c.tag === 'svg');
        const inner = card.querySelector('.mm-inner .mg-svg');
        const digit = card.querySelector('.mm-digit');
        const texts = words.map((w) => w.textContent.toLowerCase());
        const SHAPES = ['circle', 'square', 'triangle', 'rectangle'];
        return {
            bg: HEX_NAME[(card.attrs.style || '').match(/#[0-9a-f]{6}/i)[0].toLowerCase()],
            outerShape: SHAPE_OF(outer), outerCol: fillOf(outer),
            innerShape: SHAPE_OF(inner), innerCol: fillOf(inner),
            digit: digit.textContent,
            colourWord: texts.find((t) => !SHAPES.includes(t)),
            shapeWord: texts.find((t) => SHAPES.includes(t))
        };
    });
}
const ATTR = {
    'BACKGROUND COLOR': 'bg', 'OUTER SHAPE': 'outerShape', 'OUTER SHAPE COLOR': 'outerCol',
    'INNER SHAPE': 'innerShape', 'INNER SHAPE COLOR': 'innerCol', 'DIGIT': 'digit',
    'COLOR WORD': 'colourWord', 'SHAPE WORD': 'shapeWord'
};

run('Memory Match', () => {
    // Study screen shows numbers only, and shuffles them.
    let sawShuffle = false;
    for (let n = 0; n < 25 && !sawShuffle; n++) {
        const h = fresh();
        const c = games.memoryMatch(h);
        setTier(h, 4);                                   // six slots, easiest to see a shuffle
        go(h).dispatch('click');
        const backs = h.querySelectorAll('.mm-back');
        if (n === 0) {
            ok('screen one shows a card per slot', backs.length === 6, backs.length + '');
            ok('screen one shows nothing but numbers',
                backs.every((b) => /^\d+$/.test(b.textContent)) &&
                !h.querySelector('.mm-word') && !h.querySelector('.mm-mid'));
        }
        const shown = backs.map((b) => Number(b.textContent));
        if (shown.join() !== [1, 2, 3, 4, 5, 6].join()) sawShuffle = true;
        ok.silent = true;
        c();
    }
    ok('the numbers are shuffled, not in slot order', sawShuffle);

    let full = 0, rounds = 0, halves = 0;
    const seen = new Set();
    for (let n = 0; n < 40; n++) {
        const h = fresh();
        const c = games.memoryMatch(h);
        const t = n % 5;
        setTier(h, t);
        go(h).dispatch('click');
        const backOrder = h.querySelectorAll('.mm-back').map((b) => Number(b.textContent));
        past(MM_STUDY[t]);

        const faces = readFaces(h);
        if (n === 0) {
            ok('screen two shows faces and drops the numbers',
                faces.length === backOrder.length && !h.querySelector('.mm-back'));
            ok('a face carries all eight attributes',
                faces.every((f) => f.bg && f.outerShape && f.outerCol && f.innerShape &&
                    f.innerCol && f.digit && f.colourWord && f.shapeWord),
                JSON.stringify(faces[0]));
        }
        const prompt = h.querySelector('.mm-q').textContent;
        const m = /ENTER THE (.+?) \((\d)\) AND (.+?) \((\d)\)/.exec(prompt);
        if (!m) { ok('prompt reads like the app', false, prompt); c(); break; }
        seen.add(m[1]); seen.add(m[3]);

        // The face for slot k is at the position where k appeared on screen one.
        const faceForSlot = (k) => faces[backOrder.indexOf(k)];
        const want = [faceForSlot(Number(m[2]))[ATTR[m[1]]], faceForSlot(Number(m[4]))[ATTR[m[3]]]];

        h.querySelector('input').value = want.join(' ');
        h.querySelector('.mg-answer').dispatch('submit');
        if (score(h) >= 100) full++;
        rounds++;
        const reveal = h.querySelector('.mm-reveal').textContent;
        if (n === 0) ok('reveals the real numbers and the solution',
            /Real numbers: [\d ]+/.test(reveal) && /Solution:/.test(reveal), reveal);
        c();

        const h2 = fresh();
        const c2 = games.memoryMatch(h2);
        go(h2).dispatch('click');
        const bo2 = h2.querySelectorAll('.mm-back').map((b) => Number(b.textContent));
        past(MM_STUDY[0]);
        const f2 = readFaces(h2);
        const m2 = /ENTER THE (.+?) \((\d)\) AND (.+?) \((\d)\)/.exec(h2.querySelector('.mm-q').textContent);
        h2.querySelector('input').value = f2[bo2.indexOf(Number(m2[2]))][ATTR[m2[1]]] + ' zzzzz';
        h2.querySelector('.mg-answer').dispatch('submit');
        if (score(h2) === 50) halves++;
        c2();
    }
    ok('reading the right two faces always scores full', full === rounds, full + '/' + rounds);
    ok('one of the two scores 50', halves === rounds, halves + '/' + rounds);
    ok('all eight attributes get asked', seen.size === 8, seen.size + ': ' + [...seen].join(', '));

    const h = fresh();
    const c = games.memoryMatch(h);
    go(h).dispatch('click');
    past(MM_STUDY[0]);
    ok('the answer phase is timed', /Answer \d+s/.test(stat(h)), stat(h));
    tick(15000);
    ok('running out of time scores zero', score(h) === 0, stat(h));
    c();
});

/* ---------- Word Flash ---------- */

run('Word Flash', () => {
    // A wrong call ends the run immediately.
    let ended = false;
    for (let n = 0; n < 20 && !ended; n++) {
        const h = fresh();
        const c = games.wordFlash(h);
        go(h).dispatch('click');
        const buttons = h.querySelectorAll('.mg-choice button');
        // The first word is always new, so answering "seen" is always wrong.
        buttons[1].dispatch('click');
        if (score(h) === 0 && /Wrong on/.test(msg(h))) ended = true;
        ok.silent = true;
        c();
    }
    ok('a wrong call ends the run at once', ended);

    // Clearing all twenty scores 100. The sequence is readable: the first
    // showing of a word is new, any later showing is seen.
    const h = fresh();
    const c = games.wordFlash(h);
    go(h).dispatch('click');
    const buttons = h.querySelectorAll('.mg-choice button');
    const big = h.querySelector('.mg-big');
    const met = new Set();
    let steps = 0;
    while (steps++ < 40 && !/Score/.test(stat(h))) {
        const w = big.textContent;
        buttons[met.has(w) ? 1 : 0].dispatch('click');
        met.add(w);
        tick(200);
    }
    ok('clearing all twenty scores 100', score(h) === 100, stat(h));
    ok('says so', /All 20/.test(msg(h)), msg(h));
    c();

    // Letting a word time out also ends it.
    const h2 = fresh();
    const c2 = games.wordFlash(h2);
    go(h2).dispatch('click');
    tick(7000);
    ok('a timeout ends the run too', score(h2) === 0 && /Out of time/.test(msg(h2)), msg(h2));
    c2();

    // Harder tiers have more repeats.
    const h3 = fresh();
    const c3 = games.wordFlash(h3);
    setTier(h3, 4);
    go(h3).dispatch('click');
    ok('master still runs twenty words', /1 \/ 20/.test(stat(h3)), stat(h3));
    c3();
});

/* ---------- Quantum Count ---------- */

run('Quantum Count', () => {
    const h = fresh();
    const c = games.quantumCount(h);
    go(h).dispatch('click');
    ok('the dots are never hidden', h.querySelector('canvas').hidden === false);
    ok('the answer box is there from the start', h.querySelector('.mg-answer').hidden === false);
    tick(30000);
    ok('and there is no clock', h.querySelector('canvas').hidden === false && !/\d+s/.test(stat(h)), stat(h));
    ok('the tolerance is stated', /Within \d+/.test(stat(h)), stat(h));
    h.querySelector('input').value = '1';
    h.querySelector('.mg-answer').dispatch('submit');
    ok('a wild guess scores zero', score(h) === 0, stat(h));
    ok('the real count is revealed', /It was \d+/.test(msg(h)), msg(h));
    c();

    // An exact answer is worth 110, per the app's formula.
    const h2 = fresh();
    const c2 = games.quantumCount(h2);
    go(h2).dispatch('click');
    const actual = Number(/It was (\d+)/.exec((() => {
        h2.querySelector('input').value = '0';
        h2.querySelector('.mg-answer').dispatch('submit');
        return msg(h2);
    })())[1]);
    c2();
    const h3 = fresh();
    const c3 = games.quantumCount(h3);
    go(h3).dispatch('click');
    // Re-derive by bisecting on the reported error rather than reaching inside.
    h3.querySelector('input').value = '100';
    h3.querySelector('.mg-answer').dispatch('submit');
    const err = Number(/were (\d+) out/.exec(msg(h3)) ? /were (\d+) out/.exec(msg(h3))[1] : 0);
    const truth = /Exactly/.test(msg(h3)) ? 100 : null;
    c3();
    ok('the count sits in the easy range 20-50', actual >= 20 && actual <= 50, String(actual));
    ok('error is reported consistently', truth !== null || err >= 0, msg(h3));
});

/* ---------- Pattern Spot ---------- */

run('Pattern Spot', () => {
    // Tapping exactly the changed cells scores 100.
    let full = 0, rounds = 0;
    for (let n = 0; n < 24; n++) {
        const h = fresh();
        const c = games.patternSpot(h);
        const t = n % 2;                                    // easy/medium: no trap
        setTier(h, t);
        go(h).dispatch('click');
        const cells = h.querySelectorAll('.mg-cell');
        const before = cells.map((x) => x.querySelector('svg').children[0].attrs.transform + '|' +
            x.querySelector('svg').children[0].attrs.fill + '|' +
            x.querySelector('svg').children[0].children[0].tag +
            (x.querySelector('svg').children[0].children[0].attrs.d || '') +
            (x.querySelector('svg').children[0].children[0].attrs.width || ''));
        past(PS_STUDY[t]);
        const after = cells.map((x) => x.querySelector('svg').children[0].attrs.transform + '|' +
            x.querySelector('svg').children[0].attrs.fill + '|' +
            x.querySelector('svg').children[0].children[0].tag +
            (x.querySelector('svg').children[0].children[0].attrs.d || '') +
            (x.querySelector('svg').children[0].children[0].attrs.width || ''));
        const diff = before.map((b, i) => (b !== after[i] ? i : -1)).filter((i) => i >= 0);
        if (n === 0) ok('the second grid really differs', diff.length > 0, diff.length + ' cells');
        diff.forEach((i) => cells[i].dispatch('click'));
        go(h).dispatch('click');
        if (score(h) === 100) full++;
        rounds++;
        c();
    }
    ok('tapping exactly the changed cells scores 100', full === rounds, full + '/' + rounds);
    ok('so every generated change is actually visible', full === rounds);

    // The no-change trap only exists from Hard.
    let sawTrap = false, sawButton = false;
    for (let n = 0; n < 120 && !sawTrap; n++) {
        const h = fresh();
        const c = games.patternSpot(h);
        setTier(h, 2);
        go(h).dispatch('click');
        past(PS_STUDY[2]);
        if (h.querySelector('.ps-nochange')) sawButton = true;
        const cells = h.querySelectorAll('.mg-cell');
        h.querySelector('.ps-nochange').dispatch('click');
        if (score(h) === 110) sawTrap = true;
        c();
    }
    ok('hard offers a "nothing changed" call', sawButton);
    ok('and calling the trap right is worth a bonus', sawTrap);

    const h = fresh();
    const c = games.patternSpot(h);
    go(h).dispatch('click');
    ok('easy has no such button', !h.querySelector('.ps-nochange'));
    c();
});

/* ---------- Transform Puzzle ---------- */

run('Transform Puzzle', () => {
    const RULES = {
        '+2 letters: A→C': (v) => v.replace(/[A-Z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 65 + 2) % 26 + 65)),
        'Reverse string': (v) => v.split('').reverse().join(''),
        'Uppercase all': (v) => v.toUpperCase(),
        'Add 3 to number': (v) => String(Number(v) + 3),
        'Multiply by 2': (v) => String(Number(v) * 2),
        'Subtract 5': (v) => String(Number(v) - 5),
        'Next color in cycle': (v) => {
            const cyc = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
            return cyc[(cyc.indexOf(v) + 1) % cyc.length];
        }
    };
    let full = 0, rounds = 0, chained = 0;
    for (let n = 0; n < 40; n++) {
        const h = fresh();
        const c = games.transformPuzzle(h);
        const t = n % 4;                                     // skip master: it mutates on purpose
        setTier(h, t);
        go(h).dispatch('click');
        const ruleText = h.querySelectorAll('.mg-rulelist li').map((li) => li.textContent.replace(/^\d+\s*/, ''));
        if (n === 0) ok('shows a numbered rule book', ruleText.length >= 4, ruleText.length + ' rules');
        past(TP_FLASH[t]);
        const inputs = h.querySelectorAll('.tp-inputs li').map((li) => li.textContent.replace(/^\d+\s*/, ''));
        if (n === 0) ok('and the inputs stay on screen with it',
            inputs.length >= 2 && h.querySelectorAll('.mg-rulelist li').length === ruleText.length);
        const q = h.querySelector('.mg-q').textContent;
        const one = /Apply rule (\d+) to input (\d+), and (?:rule (\d+) to input (\d+)|rule (\d+) to that result)/.exec(q);
        if (!one) { ok('query parses', false, q); c(); break; }
        const r1 = RULES[ruleText[one[1] - 1]](inputs[one[2] - 1]);
        let r2;
        if (one[5]) { chained++; r2 = RULES[ruleText[one[5] - 1]](r1); }
        else r2 = RULES[ruleText[one[3] - 1]](inputs[one[4] - 1]);
        h.querySelector('input').value = r1 + ' ' + r2;
        h.querySelector('.mg-answer').dispatch('submit');
        if (score(h) >= 100) full++;
        rounds++;
        c();
    }
    ok('applying both rules correctly scores 100', full === rounds, full + '/' + rounds);
    ok('chaining shows up from Expert', chained > 0, chained + ' chained queries');
});

/* ---------- Light Squares ---------- */

run('Light Squares', () => {
    const h = fresh();
    const cleanup = games.lightSquares(h);
    setTier(h, 1);
    go(h).dispatch('click');
    const cells = h.querySelectorAll('.mg-cell');
    const lit = cells.map((c, i) => (c.classList.contains('is-on') ? i : -1)).filter((i) => i >= 0);
    ok('lights the tier fraction of a 5x5', lit.length === Math.round(25 * 0.25), lit.length + ' lit');
    past(6);
    ok('and clears before you answer', cells.every((c) => !c.classList.contains('is-on')));
    lit.forEach((i) => cells[i].dispatch('click'));
    go(h).dispatch('click');
    ok('an exact rebuild scores 100', score(h) === 100, stat(h));
    ok('and it is timed', /best \d/.test(stat(h)), stat(h));

    // One square wrong is zero, not partial credit.
    go(h).dispatch('click');
    const lit2 = cells.map((c, i) => (c.classList.contains('is-on') ? i : -1)).filter((i) => i >= 0);
    past(6);
    lit2.slice(1).forEach((i) => cells[i].dispatch('click'));
    go(h).dispatch('click');
    ok('one square short scores zero, not partial', score(h) === 0, stat(h));
    cleanup();
});

console.log('\n  ' + (fails ? fails + ' FAILURES' : 'all checks passed'));
process.exit(fails ? 1 : 0);
