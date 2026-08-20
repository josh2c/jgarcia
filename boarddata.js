/* Board contents — a moodboard, nothing operational.
 *
 * Projects, skills and the games live on the desktop; this holds voice,
 * images, colour and things worth looking at.
 *
 * Every piece sits in one square of a CELL grid, 10 columns by 7 rows to a
 * tile, inset by a 20px gutter so the line always shows between neighbours.
 * Nothing is rotated and nothing spans two cells: x/y are always
 * col * CELL + 20 and row * CELL + 20, and w/h are always CELL - 40.
 *
 * The tile is an exact multiple of CELL in both axes. It has to be — the tile
 * repeats, so a cell that doesn't divide it makes the grid jump at the seam.
 *
 * Placement is generated rather than hand-set: pieces are scattered so no two
 * of a type touch, no patch of squares is left dead, and no run of them reads
 * as a wall. Roughly half the squares stay empty on purpose.
 *
 * Types: note (written section) · quote · img · swatch · ph
 */

export const CELL = 380;
export const TILE_W = 3800;
export const TILE_H = 2660;

/* Where the camera rests, and where the dice piece stands. Entering aligns the
 * hero with this exact point so the dice appears not to move — the board tips
 * into place around it. */
export const HOME_X = 1710;
export const HOME_Y = 1330;

const RAW = [
    /* The dice: a piece standing ON the board rather than a card lying on it.
       Centred on HOME so it is where the desktop hero already was. */
    { type: 'piece', x: HOME_X - 170, y: HOME_Y - 170, w: 340, h: 340,
      src: 'board/img/dice.webp', alt: 'Dice' },

    /* ---- row 1 ------------------------------------------------------- */
    { type: 'note', x:   20, y:  400, w: 340, h: 340, num: '01', title: 'About',
      head: 'A creative who codes, designs, and thinks big.',
      body: 'I build things end to end — the product, the look, and the way it gets talked about.' },
    { type: 'quote', x: 1920, y: 1540, w: 340, h: 340,
      text: 'Reality’s what’s done, bend it, and you’ve got next.', attr: 'Reality’s Bend',
      href: 'posts/reality-bend.html' },
    { type: 'img', x:   20, y: 2300, w: 340, h: 340, src: 'board/img/tz-logo.webp',
      alt: 'Trezure logo', title: 'Trezure', body: 'The mark for the football-first fantasy app.' },
    { type: 'swatch', x: 3060, y:  780, w: 340, h: 340, hex: '#e8a33d' },
    { type: 'ph', x:   20, y: 1540, w: 340, h: 340, label: 'Setup — desk' },
    { type: 'quote', x:  400, y: 1920, w: 340, h: 340, dark: true,
      text: 'Good tools don’t push back, they glide.', attr: 'Tools That Fit',
      href: 'posts/tools-that-fit.html' },
    { type: 'ph', x: 3060, y:   20, w: 340, h: 340, label: 'Personal — photo' },
    { type: 'swatch', x:  400, y: 2300, w: 340, h: 340, hex: '#5fbdb8' },

    /* ---- row 2 ------------------------------------------------------- */
    { type: 'img', x:   20, y: 1160, w: 340, h: 340, src: 'board/img/tz-mascot.webp',
      alt: 'Trezure mascot', title: 'Trezure mascot', body: 'Carries most of the personality in the app.' },
    { type: 'quote', x:  400, y:   20, w: 340, h: 340,
      text: 'Momentum isn’t a roar, it’s a hum that grows if you let it.', attr: 'Momentum’s Secret',
      href: 'posts/momentums-secret.html' },
    { type: 'ph', x: 1540, y: 1920, w: 340, h: 340, label: 'Setup — rig' },
    { type: 'note', x: 2300, y:  400, w: 340, h: 340, num: '02', title: 'Now',
      head: 'Building Trezure.',
      body: 'A daily fantasy sports app, plus Busy Cab and Bemore Labz. And I design websites professionally.' },
    { type: 'quote', x: 1160, y: 1920, w: 340, h: 340,
      text: 'New breaks old, always.', attr: 'Innovation’s Price',
      href: 'posts/innovation-price.html' },
    { type: 'ph', x:  780, y: 1540, w: 340, h: 340, label: 'Personal — album art' },
    { type: 'quote', x: 2680, y: 1160, w: 340, h: 340, dark: true,
      text: 'Failure’s a gift dressed as a punch.', attr: 'Failure’s Edge',
      href: 'posts/failure-edge.html' },

    /* ---- row 3 ------------------------------------------------------- */
    { type: 'quote', x:  400, y: 1160, w: 340, h: 340,
      text: 'Time’s a one-shot deal, no refills.', attr: 'Time’s Trick',
      href: 'posts/time-trick.html' },
    { type: 'ph', x:   20, y:  780, w: 340, h: 340, label: 'Setup — workspace' },
    { type: 'img', x: 1160, y:  780, w: 340, h: 340, src: 'board/img/tz-mascot-pirate.webp',
      alt: 'Pirate mascot', title: 'Pirate mascot', body: 'A seasonal variant.' },
    { type: 'quote', x: 1920, y:  780, w: 340, h: 340,
      text: 'Design’s the pulse, beyond looks, it’s fit.', attr: 'Design’s Soul',
      href: 'posts/design-soul.html' },
    { type: 'swatch', x:  780, y:  780, w: 340, h: 340, hex: '#6e9b57' },
    { type: 'img', x: 1160, y: 2300, w: 340, h: 340, src: 'board/img/century.webp',
      alt: 'Black Toyota Century on the Bonneville salt flats', title: 'Toyota Century',
      body: 'Parked on the Bonneville salt. A V12 that never mentions it — the whole car is restraint, which is the part I keep stealing.' },
    { type: 'quote', x: 1160, y: 1160, w: 340, h: 340, dark: true,
      text: 'Curiosity starts as a nudge, then grips tight.', attr: 'Curiosity’s Pull',
      href: 'posts/curiosity-pull.html' },
    { type: 'swatch', x: 3440, y: 1920, w: 340, h: 340, hex: '#2a2e2b' },

    /* ---- row 4 ------------------------------------------------------- */
    { type: 'img', x: 1920, y: 1160, w: 340, h: 340, src: 'board/img/octopus.webp',
      alt: 'Engraving of an octopus', title: 'Octopus',
      body: 'An old scientific engraving. Nine brains and no single one in charge — which is closer to how anything good actually gets built.' },
    { type: 'note', x:  780, y:   20, w: 340, h: 340, num: '03', title: 'Also',
      head: 'Data, crypto, real estate and strategy games.',
      body: 'A hundred-odd Python problems solved for fun. I like systems you can take apart.' },
    { type: 'quote', x: 1920, y: 2300, w: 340, h: 340,
      text: 'Big goals grab attention, but small wins pile up silently.', attr: 'Small Wins',
      href: 'posts/small-wins.html' },
    { type: 'img', x: 1160, y: 1540, w: 340, h: 340, src: 'board/img/tz-mascot-popup.webp',
      alt: 'Popup mascot', title: 'Popup mascot', body: 'Used for in-app moments.' },
    { type: 'quote', x: 1160, y:   20, w: 340, h: 340,
      text: 'Chaos looks like a storm, but it’s where the real stuff takes root.', attr: 'Trust in Chaos',
      href: 'posts/trust-chaos.html' },
    { type: 'ph', x: 2300, y:  780, w: 340, h: 340, label: 'Personal — travel' },
    { type: 'swatch', x: 2680, y: 2300, w: 340, h: 340, hex: '#f0c060' },
    { type: 'ph', x: 2300, y: 1920, w: 340, h: 340, label: 'Misc' },

    /* ---- row 5 ------------------------------------------------------- */
    { type: 'quote', x: 3440, y: 2300, w: 340, h: 340,
      text: 'Plans start lean, then bloat, extra layers, noise.', attr: 'Simplicity',
      href: 'posts/simplicity.html' },
    { type: 'ph', x: 3060, y: 1920, w: 340, h: 340, label: 'Personal — vinyl' },
    { type: 'quote', x: 3440, y: 1540, w: 340, h: 340, dark: true,
      text: 'Every chase kicks off with a why, that quiet nudge that won’t let go.', attr: 'The Power of Why',
      href: 'posts/power-of-why.html' },
    { type: 'swatch', x: 1920, y: 1920, w: 340, h: 340, hex: '#8a7a63' },
    { type: 'quote', x: 3440, y:  400, w: 340, h: 340,
      text: 'The unknown’s every start, blank slate, no script.', attr: 'The Unknown',
      href: 'posts/unknown.html' },
    { type: 'ph', x: 1540, y:  400, w: 340, h: 340, label: 'Personal — game shelf' },
    { type: 'quote', x: 2680, y:   20, w: 340, h: 340,
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
