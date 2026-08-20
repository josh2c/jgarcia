/* Shared mini-games, used by both the desktop (index.html) and the board.
 * Each mount() fills the given host element and returns a cleanup function.
 */

/* Ported from the JoshOS portfolio (github.com/josh2c/joshgarcia) and
 * reworked to size off the window body rather than a fixed desktop window. */

function mountPong(host) {
    host.innerHTML = '<canvas id="pong-canvas"></canvas>' +
        '<p class="bw-note">Move your mouse to control the left paddle.</p>';
    const canvas = host.querySelector('#pong-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = host.clientWidth - 36;
    canvas.height = Math.round(canvas.width * 0.55);

    const paddleW = 10, paddleH = 60, ballSize = 10;
    let playerY = (canvas.height - paddleH) / 2;
    let cpuY = (canvas.height - paddleH) / 2;
    let bx = canvas.width / 2, by = canvas.height / 2;
    let sx = 4, sy = 4;
    let raf = null;

    const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.height / rect.height;
        playerY = Math.max(0, Math.min((e.clientY - rect.top) * scale - paddleH / 2, canvas.height - paddleH));
    };
    canvas.addEventListener('mousemove', onMove);

    const draw = () => {
        ctx.fillStyle = '#0b0b10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, playerY, paddleW, paddleH);
        ctx.fillRect(canvas.width - paddleW, cpuY, paddleW, paddleH);
        ctx.beginPath();
        ctx.arc(bx, by, ballSize / 2, 0, Math.PI * 2);
        ctx.fill();

        if (cpuY + paddleH / 2 < by) cpuY += 3;
        if (cpuY + paddleH / 2 > by) cpuY -= 3;
        cpuY = Math.max(0, Math.min(cpuY, canvas.height - paddleH));

        bx += sx; by += sy;
        if (by - ballSize / 2 < 0 || by + ballSize / 2 > canvas.height) sy = -sy;
        if (bx - ballSize / 2 < paddleW && by > playerY && by < playerY + paddleH) sx = Math.abs(sx);
        if (bx + ballSize / 2 > canvas.width - paddleW && by > cpuY && by < cpuY + paddleH) sx = -Math.abs(sx);
        if (bx < 0 || bx > canvas.width) { bx = canvas.width / 2; by = canvas.height / 2; sx = -sx; }

        raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('mousemove', onMove);
    };
}

function mountPaint(host) {
    host.innerHTML = '<canvas id="paint-canvas"></canvas>' +
        '<p class="bw-note">Click and drag to draw.</p>';
    const canvas = host.querySelector('#paint-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = host.clientWidth - 36;
    canvas.height = Math.round(canvas.width * 0.6);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let painting = false;
    const pos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width;
        return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
    };
    const start = (e) => { painting = true; ctx.beginPath(); const p = pos(e); ctx.moveTo(p.x, p.y); };
    const stop = () => { painting = false; ctx.beginPath(); };
    const drawTo = (e) => {
        if (!painting) return;
        const p = pos(e);
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointerleave', stop);
    canvas.addEventListener('pointermove', drawTo);

    return () => {
        canvas.removeEventListener('pointerdown', start);
        canvas.removeEventListener('pointerup', stop);
        canvas.removeEventListener('pointerleave', stop);
        canvas.removeEventListener('pointermove', drawTo);
    };
}
