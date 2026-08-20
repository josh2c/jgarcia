/* Actually play each game: start it, sit through the study phase on a fake
 * clock, answer, and check the score came out. Then close it and make sure
 * nothing is still ticking. */
import fs from 'node:fs';
import vm from 'node:vm';
import { document, window, tick, clock, schedule } from './dom.mjs';

const sandbox = {
    document, window, console,
    Math, Date, Set, Map, Array, Object, String, Number, JSON, RegExp, Boolean,
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

function fresh() {
    const host = document.createElement('div');
    return host;
}
const stat = (host) => (host.querySelector('.mg-stat') || {}).textContent || '';
const msg = (host) => (host.querySelector('.mg-msg') || {}).textContent || '';
const go = (host) => host.querySelector('.mg-go');

function run(name, fn) {
    console.log('  ' + name);
    try { fn(); } catch (e) { fails++; console.log('    FAIL threw: ' + e.message + '\n' + (e.stack || '').split('\n')[1]); }
}

/* ---- Light Squares ---- */
run('Light Squares', () => {
    const host = fresh();
    const cleanup = games.lightSquares(host);
    go(host).dispatch('click');
    ok('study phase counts down', /Study/.test(stat(host)), stat(host));
    tick(7000);
    ok('turns into an answer phase', /Pick/.test(stat(host)), stat(host));
    const cells = host.querySelectorAll('.mg-cell');
    ok('grid is 7x7', cells.length === 49, cells.length + ' cells');
    cells.slice(0, 7).forEach((c) => c.dispatch('click'));
    go(host).dispatch('click');
    ok('scores the round', /Score \d+/.test(stat(host)), stat(host));
    ok('says what happened', /found/.test(msg(host)), msg(host));
    cleanup();
    const before = clock.timers.size;
    tick(20000);
    ok('nothing left running after close', clock.timers.size <= before);
});

/* ---- Pattern Spot ---- */
run('Pattern Spot', () => {
    const host = fresh();
    const cleanup = games.patternSpot(host);
    go(host).dispatch('click');
    tick(5000);
    ok('asks for the changes', /changed/.test(stat(host)), stat(host));
    const cells = host.querySelectorAll('.mg-cell');
    ok('grid is 3x3', cells.length === 9, cells.length + ' cells');
    ok('every tile drew a shape', cells.every((c) => c.querySelector('svg')));
    cells[0].dispatch('click');
    cells[1].dispatch('click');
    go(host).dispatch('click');
    ok('scores the round', /Score \d+/.test(stat(host)), stat(host));
    ok('reports the spot count', /spotted/.test(msg(host)), msg(host));
    cleanup();
});

/* ---- Quantum Count ---- */
run('Quantum Count', () => {
    const host = fresh();
    const cleanup = games.quantumCount(host);
    go(host).dispatch('click');
    ok('canvas is showing', host.querySelector('canvas').hidden === false);
    tick(7000);
    const form = host.querySelector('.mg-answer');
    ok('swaps the canvas for the input', form.hidden === false && host.querySelector('canvas').hidden === true);
    const input = host.querySelector('input');
    input.value = '40';
    form.dispatch('submit');
    ok('scores the guess', /Score \d+/.test(stat(host)), stat(host));
    ok('reveals the real count', /It was \d+|Exactly \d+/.test(msg(host)), msg(host));
    cleanup();
    const before = clock.timers.size;
    tick(5000);
    ok('animation loop stopped', clock.timers.size <= before);
});

/* ---- Word Flash ---- */
run('Word Flash', () => {
    const host = fresh();
    const cleanup = games.wordFlash(host);
    go(host).dispatch('click');
    ok('starts at word 1 of 20', stat(host) === '1 / 20', stat(host));
    const buttons = host.querySelectorAll('.mg-choice button');
    ok('offers both answers', buttons.length === 2);
    // Answer all twenty, alternating, letting each transition settle.
    for (let i = 0; i < 20; i++) { buttons[i % 2].dispatch('click'); tick(400); }
    ok('finishes the run', /Score \d+/.test(stat(host)), stat(host));
    ok('reports a tally out of 20', /20/.test(msg(host)) || /Every one/.test(msg(host)), msg(host));
    cleanup();
});

/* ---- Memory Match ----
   Read the cards back off the DOM, parse the prompt the game printed, work out
   the right answer and type it. A game that never accepts a correct answer is
   exactly the failure this has to catch. */
const BAND = { '#f44336': 'red', '#2196f3': 'blue', '#4caf50': 'green', '#ffd21f': 'yellow', '#9c27b0': 'purple' };
const INK = { '#c62828': 'red', '#1565c0': 'blue', '#2e7d32': 'green', '#8a6300': 'yellow', '#6a1b9a': 'purple' };

function readCards(host) {
    return host.querySelectorAll('.mm-card').map((el) => {
        const band = (el.querySelector('.mm-band').attrs.style || '').match(/#[0-9a-f]{6}/i)[0].toLowerCase();
        const svg = el.querySelector('.mm-shape svg');
        const kid = svg.children[0].children[0];
        const shape = kid.tag === 'circle' ? 'circle'
            : kid.tag === 'path' ? 'triangle'
            : kid.attrs.x === '10' ? 'square' : 'rectangle';
        const lines = el.querySelectorAll('.mm-lines span');
        const inkOf = (n) => INK[(lines[n].attrs.style || '').match(/#[0-9a-f]{6}/i)[0].toLowerCase()];
        return {
            slot: Number(el.querySelector('.mm-n').textContent),
            shape, bgColor: BAND[band],
            colorWord: lines[0].textContent.toLowerCase(), colorInk: inkOf(0),
            digit: lines[1].textContent, digitInk: inkOf(1),
            shapeWord: lines[2].textContent.toLowerCase(), shapeInk: inkOf(2)
        };
    });
}
const ATTR_KEY = {
    'SHAPE': 'shape', 'BG COLOR': 'bgColor', 'COLOR WORD': 'colorWord', 'COLOR INK': 'colorInk',
    'DIGIT': 'digit', 'DIGIT INK': 'digitInk', 'SHAPE WORD': 'shapeWord', 'SHAPE INK': 'shapeInk'
};

run('Memory Match', () => {
    let perfect = 0, half = 0, rounds = 0;
    const seenAttrs = new Set();
    for (let n = 0; n < 40; n++) {
        const host = fresh();
        const cleanup = games.memoryMatch(host);
        go(host).dispatch('click');
        const cards = readCards(host);
        if (n === 0) {
            ok('shows three cards', cards.length === 3, cards.length + ' cards');
            ok('every attribute is readable from the card',
                cards.every((c) => c.shape && c.bgColor && c.colorWord && c.colorInk &&
                                   c.digit && c.digitInk && c.shapeWord && c.shapeInk));
        }
        tick(6000);
        const prompt = host.querySelector('.mm-prompt').textContent;
        const m = /^(.+?) FROM SLOT \((\d)\) AND (.+?) FROM SLOT \((\d)\)$/.exec(prompt);
        if (!m) { ok('prompt matches the app format', false, prompt); cleanup(); break; }
        seenAttrs.add(m[1]); seenAttrs.add(m[3]);
        if (m[2] === m[4]) ok('the two slots are always different', false, prompt);
        const want = [
            cards[Number(m[2]) - 1][ATTR_KEY[m[1]]],
            cards[Number(m[4]) - 1][ATTR_KEY[m[3]]]
        ];
        // Correct answer.
        host.querySelector('input').value = want.join(' ');
        host.querySelector('.mg-answer').dispatch('submit');
        const sc = Number((/Score (\d+)/.exec(stat(host)) || [])[1]);
        if (sc >= 100) perfect++;
        rounds++;
        cleanup();

        // And a half-right answer on a fresh round.
        const h2 = fresh();
        const c2 = games.memoryMatch(h2);
        go(h2).dispatch('click');
        const cards2 = readCards(h2);
        tick(6000);
        const p2 = /^(.+?) FROM SLOT \((\d)\) AND (.+?) FROM SLOT \((\d)\)$/.exec(
            h2.querySelector('.mm-prompt').textContent);
        h2.querySelector('input').value = cards2[Number(p2[2]) - 1][ATTR_KEY[p2[1]]] + ' zzzzz';
        h2.querySelector('.mg-answer').dispatch('submit');
        if (/Score 50\b/.test(stat(h2))) half++;
        c2();
    }
    ok('a correct answer always scores full', perfect === rounds, perfect + '/' + rounds);
    ok('one of two scores 50', half > 0, half + '/' + rounds + ' half-right rounds scored 50');
    ok('all eight attributes get asked', seenAttrs.size === 8,
        seenAttrs.size + ' seen: ' + [...seenAttrs].join(', '));
});

run('Memory Match, running out of time', () => {
    const host = fresh();
    const cleanup = games.memoryMatch(host);
    go(host).dispatch('click');
    tick(6000);
    ok('the answer phase is timed', /Answer \d+s/.test(stat(host)), stat(host));
    tick(12000);
    ok('timing out scores zero', /Score 0\b/.test(stat(host)), stat(host));
    cleanup();
});

/* ---- Transform Puzzle ---- */
run('Transform Puzzle', () => {
    let sawTyped = false, sawVisual = false;
    // The rule drawn is random, so run it until both answer modes have appeared.
    for (let attempt = 0; attempt < 60 && !(sawTyped && sawVisual); attempt++) {
        const host = fresh();
        const cleanup = games.transformPuzzle(host);
        go(host).dispatch('click');
        const rules = host.querySelectorAll('.mg-rulelist li');
        if (attempt === 0) ok('shows four rules', rules.length === 4, rules.length + ' rules');
        tick(10000);
        const opts = host.querySelectorAll('.mg-opts button');
        if (opts.length) {
            sawVisual = true;
            if (opts.length !== 4) ok('visual rule offers four choices', false, opts.length + ' choices');
            opts[0].dispatch('click');
        } else {
            sawTyped = true;
            const form = host.querySelector('.mg-answer');
            host.querySelector('input').value = 'whatever';
            form.dispatch('submit');
        }
        if (!/Score \d+/.test(stat(host))) ok('scores the round', false, stat(host));
        cleanup();
    }
    ok('typed rules reachable', sawTyped);
    ok('visual rule reachable', sawVisual);
});

/* Play it right, not just play it. A game that always reports zero would pass
 * every test above. */
run('Light Squares, played correctly', () => {
    const host = fresh();
    const cleanup = games.lightSquares(host);
    go(host).dispatch('click');
    const cells = host.querySelectorAll('.mg-cell');
    // Read the pattern off the board while it is still showing.
    const lit = cells.map((c, i) => (c.classList.contains('is-on') ? i : -1)).filter((i) => i >= 0);
    ok('lights 15% of the grid', lit.length === 7, lit.length + ' lit');
    tick(7000);
    ok('the board is cleared before answering', cells.every((c) => !c.classList.contains('is-on')));
    lit.forEach((i) => cells[i].dispatch('click'));
    go(host).dispatch('click');
    ok('a perfect round scores 100', /Score 100\b/.test(stat(host)), stat(host));
    ok('and starts a streak', /streak 1\b/.test(stat(host)), stat(host));
    // A second perfect round should carry the streak.
    go(host).dispatch('click');
    const lit2 = cells.map((c, i) => (c.classList.contains('is-on') ? i : -1)).filter((i) => i >= 0);
    tick(7000);
    lit2.forEach((i) => cells[i].dispatch('click'));
    go(host).dispatch('click');
    ok('streak carries between rounds', /streak 2\b/.test(stat(host)), stat(host));
    cleanup();
});

console.log('\n  ' + (fails ? fails + ' FAILURES' : 'all checks passed'));
process.exit(fails ? 1 : 0);
