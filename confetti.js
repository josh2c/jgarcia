/* Scatters the accent confetti behind content pages. Deterministic, so the
 * layout is stable between loads rather than reshuffling on every visit. */

(function () {
    const host = document.getElementById('confetti');
    if (!host) return;

    const ACCENTS = ['--jg-red', '--jg-yellow', '--jg-green', '--jg-blue'];
    const frag = document.createDocumentFragment();

    for (let i = 0; i < 22; i++) {
        const a = (i * 2654435761) % 1000 / 1000;
        const b = (i * 40503 + 7919) % 1000 / 1000;
        const chip = document.createElement('i');
        chip.style.left = (a * 97).toFixed(2) + '%';
        chip.style.top = (b * 95).toFixed(2) + '%';
        chip.style.background = 'var(' + ACCENTS[i % ACCENTS.length] + ')';
        const size = 6 + ((i * 13) % 3) * 3;
        chip.style.width = size + 'px';
        chip.style.height = size + 'px';
        frag.appendChild(chip);
    }
    host.appendChild(frag);
})();
