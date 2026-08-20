/* Board contents — a moodboard, nothing operational.
 *
 * Projects, skills and the games live on the desktop; this holds voice,
 * images, colour and things worth looking at.
 *
 * One tile of the infinite plane, TILE_W x TILE_H. x/y are the card's top-left
 * corner within the tile; keep everything inside a ~55px margin so nothing
 * straddles a seam when the tile repeats.
 *
 * Types: note (written section) · quote · img · swatch · ph
 */

export const TILE_W = 3050;
export const TILE_H = 2300;

/* Where the camera rests, and where the dice piece stands. Entering aligns the
 * hero with this exact point so the dice appears not to move — the board tips
 * into place around it. */
export const HOME_X = 1420;
export const HOME_Y = 1854;

const RAW = [
    /* The dice: a piece standing ON the board rather than a card lying on it.
       Centred on HOME so it is where the desktop hero already was. */
    { type: 'piece', x: HOME_X - 280, y: HOME_Y - 124, w: 560, h: 248, rot: 0,
      src: 'board/img/dice.webp', alt: 'Dice' },

    /* ---- row 1 ------------------------------------------------------- */
    { type: 'note', x:   70, y:   70, w: 430, h: 300, rot: -2, num: '01', title: 'About',
      head: 'A creative who codes, designs, and thinks big.',
      body: 'I build things end to end — the product, the look, and the way it gets talked about.' },
    { type: 'quote', x:  550, y:   90, w: 330, h: 210, rot: 3,
      text: 'Reality’s what’s done, bend it, and you’ve got next.', attr: 'Reality’s Bend',
      href: 'posts/reality-bend.html' },
    { type: 'img', x:  930, y:   80, w: 230, h: 230, rot: -4, src: 'board/img/tz-logo.webp',
      alt: 'Trezure logo', title: 'Trezure', body: 'The mark for the football-first fantasy app.' },
    { type: 'swatch', x: 1210, y:   90, w: 150, h: 150, rot: 4, hex: '#e8a33d' },
    { type: 'ph', x: 1410, y:   70, w: 320, h: 230, rot: -3, label: 'Setup — desk' },
    { type: 'quote', x: 1780, y:   90, w: 330, h: 200, rot: 2, dark: true,
      text: 'Good tools don’t push back, they glide.', attr: 'Tools That Fit',
      href: 'posts/tools-that-fit.html' },
    { type: 'ph', x: 2150, y:   70, w: 265, h: 240, rot: -2, label: 'Personal — photo' },
    { type: 'swatch', x: 2430, y:  100, w: 110, h: 110, rot: 5, hex: '#5fbdb8' },

    /* ---- row 2 ------------------------------------------------------- */
    { type: 'img', x:   80, y:  430, w: 260, h: 260, rot: 4, src: 'board/img/tz-mascot.webp',
      alt: 'Trezure mascot', title: 'Trezure mascot', body: 'Carries most of the personality in the app.' },
    { type: 'quote', x:  390, y:  440, w: 320, h: 200, rot: -3,
      text: 'Momentum isn’t a roar, it’s a hum that grows if you let it.', attr: 'Momentum’s Secret',
      href: 'posts/momentums-secret.html' },
    { type: 'ph', x:  760, y:  420, w: 260, h: 300, rot: 2, label: 'Setup — rig' },
    { type: 'note', x: 1060, y:  430, w: 450, h: 320, rot: -2, num: '02', title: 'Now',
      head: 'Building Trezure.',
      body: 'A daily fantasy sports app, plus Busy Cab and Bemore Labz. And I design websites professionally.' },
    { type: 'quote', x: 1560, y:  450, w: 320, h: 200, rot: 4,
      text: 'New breaks old, always.', attr: 'Innovation’s Price',
      href: 'posts/innovation-price.html' },
    { type: 'ph', x: 1930, y:  430, w: 300, h: 250, rot: -3, label: 'Personal — album art' },
    { type: 'quote', x: 2260, y:  450, w: 270, h: 200, rot: 3, dark: true,
      text: 'Failure’s a gift dressed as a punch.', attr: 'Failure’s Edge',
      href: 'posts/failure-edge.html' },

    /* ---- row 3 ------------------------------------------------------- */
    { type: 'quote', x:   70, y:  790, w: 330, h: 200, rot: 3,
      text: 'Time’s a one-shot deal, no refills.', attr: 'Time’s Trick',
      href: 'posts/time-trick.html' },
    { type: 'ph', x:  450, y:  780, w: 300, h: 250, rot: -2, label: 'Setup — workspace' },
    { type: 'img', x:  800, y:  780, w: 240, h: 240, rot: 4, src: 'board/img/tz-mascot-pirate.webp',
      alt: 'Pirate mascot', title: 'Pirate mascot', body: 'A seasonal variant.' },
    { type: 'quote', x: 1090, y:  800, w: 320, h: 200, rot: -3,
      text: 'Design’s the pulse, beyond looks, it’s fit.', attr: 'Design’s Soul',
      href: 'posts/design-soul.html' },
    { type: 'swatch', x: 1460, y:  830, w: 130, h: 130, rot: 5, hex: '#6e9b57' },
    { type: 'ph', x: 1640, y:  790, w: 290, h: 240, rot: 2, label: 'Personal — sneakers' },
    { type: 'quote', x: 1980, y:  800, w: 320, h: 210, rot: -4, dark: true,
      text: 'Curiosity starts as a nudge, then grips tight.', attr: 'Curiosity’s Pull',
      href: 'posts/curiosity-pull.html' },
    { type: 'swatch', x: 2360, y:  820, w: 130, h: 130, rot: 3, hex: '#2a2e2b' },

    /* ---- row 4 ------------------------------------------------------- */
    { type: 'ph', x:   80, y: 1120, w: 310, h: 250, rot: -3, label: 'Personal — film still' },
    { type: 'note', x:  440, y: 1110, w: 430, h: 300, rot: 2, num: '03', title: 'Also',
      head: 'Data, crypto, real estate and strategy games.',
      body: 'A hundred-odd Python problems solved for fun. I like systems you can take apart.' },
    { type: 'quote', x:  920, y: 1130, w: 320, h: 210, rot: -4,
      text: 'Big goals grab attention, but small wins pile up silently.', attr: 'Small Wins',
      href: 'posts/small-wins.html' },
    { type: 'img', x: 1290, y: 1120, w: 220, h: 220, rot: 3, src: 'board/img/tz-mascot-popup.webp',
      alt: 'Popup mascot', title: 'Popup mascot', body: 'Used for in-app moments.' },
    { type: 'quote', x: 1560, y: 1130, w: 330, h: 200, rot: -2,
      text: 'Chaos looks like a storm, but it’s where the real stuff takes root.', attr: 'Trust in Chaos',
      href: 'posts/trust-chaos.html' },
    { type: 'ph', x: 1940, y: 1120, w: 300, h: 250, rot: 4, label: 'Personal — travel' },
    { type: 'swatch', x: 2255, y: 1150, w: 130, h: 130, rot: -3, hex: '#f0c060' },
    { type: 'ph', x: 2400, y: 1130, w: 130, h: 200, rot: 2, label: 'Misc' },

    /* ---- row 5 ------------------------------------------------------- */
    { type: 'quote', x:   80, y: 1490, w: 330, h: 200, rot: 3,
      text: 'Plans start lean, then bloat, extra layers, noise.', attr: 'Simplicity',
      href: 'posts/simplicity.html' },
    { type: 'ph', x:  460, y: 1470, w: 280, h: 240, rot: -3, label: 'Personal — vinyl' },
    { type: 'quote', x:  790, y: 1490, w: 330, h: 210, rot: 2, dark: true,
      text: 'Every chase kicks off with a why, that quiet nudge that won’t let go.', attr: 'The Power of Why',
      href: 'posts/power-of-why.html' },
    { type: 'swatch', x: 1170, y: 1520, w: 130, h: 130, rot: -4, hex: '#8a7a63' },
    { type: 'quote', x: 1350, y: 1490, w: 330, h: 200, rot: 3,
      text: 'The unknown’s every start, blank slate, no script.', attr: 'The Unknown',
      href: 'posts/unknown.html' },
    { type: 'ph', x: 1730, y: 1470, w: 300, h: 250, rot: -2, label: 'Personal — game shelf' },
    { type: 'quote', x: 2080, y: 1490, w: 330, h: 210, rot: 4,
      text: 'Vision carries heft, it’s not a light thing.', attr: 'Vision’s Weight',
      href: 'posts/visions-weight.html' }
];


/* Fade-in order: outward from the dice, so entering reads as the board
 * assembling around the card you are already looking at. */
const far = Math.hypot(TILE_W, TILE_H);
export const ITEMS = RAW.map((it) => {
    const dx = (it.x + it.w / 2) - HOME_X;
    const dy = (it.y + it.h / 2) - HOME_Y;
    const d = Math.hypot(dx, dy) / far;
    return { ...it, stagger: it.type === 'piece' ? 0 : Math.round(60 + d * 620) };
});
