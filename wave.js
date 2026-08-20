/* Wave — the transition between the desktop and the board.
 *
 * Water rises with a foam edge until it covers the screen, the layers are
 * swapped underneath while nothing is visible, then it recedes. Hiding the
 * swap is the point: no part of the change has to survive being watched, which
 * is what went wrong when the plane tipped behind a fading curtain.
 *
 *   window.jgWave.play(onCover)   -> Promise, resolves when the water is gone
 */

(function () {
    const RISE = 460;      // ms for the water to cover the screen
    const HOLD = 90;       // ms fully covered, so the swap is never glimpsed
    const FALL = 700;      // ms to recede

    let canvas = null, ctx = null;

    function ensure() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        canvas.className = 'wave-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
        size();
        window.addEventListener('resize', size);
    }

    function size() {
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* The waterline: three sine waves of different lengths, so the edge never
     * repeats visibly the way a single wave does. */
    function edgeAt(x, t, amp) {
        return Math.sin(x * 0.011 + t * 2.1) * amp
             + Math.sin(x * 0.023 - t * 1.4) * amp * 0.5
             + Math.sin(x * 0.005 + t * 0.7) * amp * 0.8;
    }

    function draw(level, t) {
        const w = innerWidth, h = innerHeight;
        ctx.clearRect(0, 0, w, h);

        // level 0 = off the bottom, 1 = fully covered
        const amp = 16 + 10 * Math.sin(t * 3);
        const base = h - level * (h + 120) + 60;

        const body = ctx.createLinearGradient(0, base - 60, 0, h);
        body.addColorStop(0, 'rgba(126, 200, 214, 0.96)');
        body.addColorStop(0.35, 'rgba(58, 148, 172, 0.99)');
        body.addColorStop(1, 'rgba(30, 104, 132, 1)');

        ctx.beginPath();
        ctx.moveTo(0, h + 10);
        ctx.lineTo(0, base + edgeAt(0, t, amp));
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, base + edgeAt(x, t, amp));
        ctx.lineTo(w, h + 10);
        ctx.closePath();
        ctx.fillStyle = body;
        ctx.fill();

        // Foam sits on the waterline, thicker where the edge is rising.
        ctx.beginPath();
        ctx.moveTo(0, base + edgeAt(0, t, amp));
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, base + edgeAt(x, t, amp));
        for (let x = w; x >= 0; x -= 8) {
            ctx.lineTo(x, base + edgeAt(x, t, amp) + 16 + 10 * Math.sin(x * 0.03 + t * 4));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        // Bubbles along the crest.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let i = 0; i < 60; i++) {
            const x = ((i * 137.5) % w);
            const y = base + edgeAt(x, t, amp) + 6 + ((i * 53) % 26);
            const r = 1.5 + ((i * 7) % 5);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const easeOut = (x) => 1 - Math.pow(1 - x, 3);
    const easeIn = (x) => x * x * x;

    function play(onCover) {
        // Reduced motion: swap immediately, no water.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            if (onCover) onCover();
            return Promise.resolve();
        }

        ensure();
        canvas.classList.add('is-on');
        const t0 = performance.now();
        let swapped = false;

        return new Promise((resolve) => {
            const step = (now) => {
                const t = (now - t0) / 1000;
                const ms = now - t0;

                if (ms < RISE) {
                    draw(easeOut(ms / RISE), t);
                    requestAnimationFrame(step);
                    return;
                }

                if (!swapped) {
                    swapped = true;
                    if (onCover) onCover();     // nothing is visible right now
                }

                if (ms < RISE + HOLD) {
                    draw(1, t);
                    requestAnimationFrame(step);
                    return;
                }

                const fall = (ms - RISE - HOLD) / FALL;
                if (fall < 1) {
                    draw(1 - easeIn(fall), t);
                    requestAnimationFrame(step);
                    return;
                }

                ctx.clearRect(0, 0, innerWidth, innerHeight);
                canvas.classList.remove('is-on');
                resolve();
            };
            requestAnimationFrame(step);
        });
    }

    window.jgWave = { play };
})();
