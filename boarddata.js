/* Board contents — a moodboard, nothing operational.
 *
 * Projects, skills and the games live on the desktop; this holds voice,
 * images, colour and things worth looking at.
 *
 * The layout is an editorial grid rather than a repeating module: COL_W and
 * ROW_H give every column its own width and every row its own height, and a
 * piece may span several of either. So a piece's proportions depend on where
 * it sits, not only on how many cells it takes — which is what lets a portrait
 * photo, a wide engraving and a square logo each fill their frame instead of
 * being letterboxed into one shared square.
 *
 * Nothing is rotated and every piece is inset by GUT, so a line always shows
 * between neighbours. x/y/w/h are generated from col/row/span, never hand-set.
 *
 * The tile is the exact sum of the tracks. It has to be — the tile repeats, so
 * anything else makes the grid jump at the seam, and no piece may hang over an
 * edge or it would collide with the next tile's contents.
 *
 * Placement is solved, not arranged: pieces are scattered so no two of a type
 * touch and no patch of the board is left dead, while every image is pulled
 * toward a cell shaped like the image. It settles with the scatter clean and
 * every picture filling 97-100% of its frame.
 *
 * Types: note (written section) · quote · img · swatch · ph
 */

export const COL_W = [300, 460, 380, 540, 340, 400, 300, 480, 360, 420, 320, 440];
export const ROW_H = [340, 420, 300, 460, 400, 300, 420, 340, 380];
export const GUT = 22;
export const TILE_W = 4740;
export const TILE_H = 3360;

/* Where the camera rests, and where the dice piece stands. Entering aligns the
 * hero with this exact point so the dice appears not to move — the board tips
 * into place around it. */
export const HOME_X = 2220;
export const HOME_Y = 1720;

const RAW = [
    /* The dice: a piece standing ON the board rather than a card lying on it.
       Centred on HOME so it is where the desktop hero already was. */
    { type: 'piece', x: HOME_X - 178, y: HOME_Y - 178, w: 356, h: 356,
      src: 'board/img/dice.webp', alt: 'Dice' },

    /* ---- row 1 ------------------------------------------------------- */
    { type: 'note', x:  782, y:  362, w:  876, h:  676, num: '01', title: 'About',
      head: 'A creative who codes, designs, and thinks big.',
      body: 'I build things end to end — the product, the look, and the way it gets talked about.' },
    { type: 'quote', x:   22, y: 3002, w:  716, h:  336,
      text: 'Reality’s what’s done, bend it, and you’ve got next.', attr: 'Reality’s Bend',
      href: 'posts/reality-bend.html' },
    { type: 'img', x: 2442, y: 1942, w:  256, h:  256, src: 'board/img/tz-logo.webp',
      alt: 'Trezure logo', title: 'Trezure', body: 'The mark for the football-first fantasy app.' },
    { type: 'swatch', x: 3222, y: 1542, w:  316, h:  356, hex: '#e8a33d' },
    { type: 'ph', x:  782, y:   22, w:  336, h:  296, label: 'Setup — desk' },
    { type: 'quote', x: 2742, y: 1542, w:  436, h:  356, dark: true,
      text: 'Good tools don’t push back, they glide.', attr: 'Tools That Fit',
      href: 'posts/tools-that-fit.html' },
    { type: 'img', x: 3582, y: 1942, w:  696, h: 1016, src: 'board/img/kobe.webp',
      alt: 'Kobe Bryant driving to the rim', title: 'Kobe',
      body: 'The one where the whole face is already past the defender. Obsession is not a personality trait, it is a schedule.' },
    { type: 'swatch', x:   22, y:  782, w:  256, h:  256, hex: '#5fbdb8' },

    /* ---- row 2 ------------------------------------------------------- */
    { type: 'img', x: 3582, y:  362, w:  376, h:  376, src: 'board/img/tz-mascot.webp',
      alt: 'Trezure mascot', title: 'Trezure mascot', body: 'Carries most of the personality in the app.' },
    { type: 'quote', x: 1162, y:   22, w:  496, h:  296,
      text: 'Momentum isn’t a roar, it’s a hum that grows if you let it.', attr: 'Momentum’s Secret',
      href: 'posts/momentums-secret.html' },
    { type: 'img', x:   22, y: 1082, w:  716, h:  416, src: 'board/img/omarchy.webp',
      alt: 'Omarchy wordmark in green pixel type', title: 'Omarchy',
      body: 'The Arch setup this site gets built on. Someone else\u2019s opinionated defaults, taken whole \u2014 the fastest way to stop fiddling with the desk and start using it.' },
    { type: 'note', x: 2042, y: 2242, w:  656, h:  376, num: '02', title: 'Now',
      head: 'Building Trezure.',
      body: 'A daily fantasy sports app, plus Busy Cab and Bemore Labz. And I design websites professionally.' },
    { type: 'quote', x: 3222, y:  782, w:  316, h:  256,
      text: 'New breaks old, always.', attr: 'Innovation’s Price',
      href: 'posts/innovation-price.html' },
    { type: 'ph', x: 3222, y: 1082, w:  316, h:  416, label: 'Personal — album art' },
    { type: 'quote', x:  322, y: 1542, w:  796, h:  356, dark: true,
      text: 'Failure’s a gift dressed as a punch.', attr: 'Failure’s Edge',
      href: 'posts/failure-edge.html' },

    /* ---- row 3 ------------------------------------------------------- */
    { type: 'quote', x: 3582, y:   22, w:  696, h:  296,
      text: 'Time’s a one-shot deal, no refills.', attr: 'Time’s Trick',
      href: 'posts/time-trick.html' },
    { type: 'ph', x: 4322, y:   22, w:  396, h:  716, label: 'Setup — workspace' },
    { type: 'img', x: 1702, y: 2662, w:  296, h:  296, src: 'board/img/tz-mascot-pirate.webp',
      alt: 'Pirate mascot', title: 'Pirate mascot', body: 'A seasonal variant.' },
    { type: 'quote', x: 3222, y: 2662, w:  316, h:  296,
      text: 'Design’s the pulse, beyond looks, it’s fit.', attr: 'Design’s Soul',
      href: 'posts/design-soul.html' },
    { type: 'swatch', x: 4322, y: 3002, w:  396, h:  336, hex: '#6e9b57' },
    { type: 'img', x: 2742, y: 3002, w:  436, h:  336, src: 'board/img/century.webp',
      alt: 'Black Toyota Century on the Bonneville salt flats', title: 'Toyota Century',
      body: 'Parked on the Bonneville salt. A V12 that never mentions it — the whole car is restraint, which is the part I keep stealing.' },
    { type: 'quote', x: 4002, y:  782, w:  716, h:  256, dark: true,
      text: 'Curiosity starts as a nudge, then grips tight.', attr: 'Curiosity’s Pull',
      href: 'posts/curiosity-pull.html' },
    { type: 'swatch', x:  322, y:   22, w:  416, h:  296, hex: '#2a2e2b' },

    /* ---- row 4 ------------------------------------------------------- */
    { type: 'img', x: 3582, y: 1082, w:  696, h:  416, src: 'board/img/octopus.webp',
      alt: 'Engraving of an octopus', title: 'Octopus',
      body: 'An old scientific engraving. Nine brains and no single one in charge — which is closer to how anything good actually gets built.' },
    { type: 'note', x: 1162, y: 3002, w:  836, h:  336, num: '03', title: 'Also',
      head: 'Data, crypto, real estate and strategy games.',
      body: 'A hundred-odd Python problems solved for fun. I like systems you can take apart.' },
    { type: 'quote', x: 1702, y: 2242, w:  296, h:  376,
      text: 'Big goals grab attention, but small wins pile up silently.', attr: 'Small Wins',
      href: 'posts/small-wins.html' },
    { type: 'img', x:  782, y: 3002, w:  336, h:  336, src: 'board/img/tz-mascot-popup.webp',
      alt: 'Popup mascot', title: 'Popup mascot', body: 'Used for in-app moments.' },
    { type: 'quote', x:  782, y: 2242, w:  336, h:  376,
      text: 'Chaos looks like a storm, but it’s where the real stuff takes root.', attr: 'Trust in Chaos',
      href: 'posts/trust-chaos.html' },
    { type: 'img', x: 2742, y:  782, w:  436, h:  256, src: 'board/img/raylewis.webp',
      alt: 'Ray Lewis in a Ravens 52 jersey', title: 'Ray Lewis',
      body: 'Ravens 52. Nobody ever accused him of saving something for the next play.' },
    { type: 'swatch', x: 4322, y: 1542, w:  396, h:  356, hex: '#f0c060' },
    { type: 'img', x:  322, y: 1942, w:  416, h:  676, src: 'board/img/seiko.webp',
      alt: 'Grand Seiko SBGA469 with a blue Spring Drive dial', title: 'Grand Seiko SBGA469',
      body: 'Spring Drive: the second hand glides instead of ticking. A dial finished like weather and a movement that refuses to make a sound about it.' },

    /* ---- row 5 ------------------------------------------------------- */
    { type: 'quote', x: 3582, y: 1542, w:  696, h:  356,
      text: 'Plans start lean, then bloat, extra layers, noise.', attr: 'Simplicity',
      href: 'posts/simplicity.html' },
    { type: 'img', x: 1162, y: 1082, w:  836, h:  816, src: 'board/img/marathon.webp',
      alt: 'The Marathon Don\u2019t Stop, a book about Nipsey Hussle', title: 'The Marathon Don\u2019t Stop',
      body: 'Rob Kenner on Nipsey Hussle. Own the block, then the building \u2014 build the thing where you already are instead of waiting to be let in somewhere else.' },
    { type: 'quote', x: 2442, y: 3002, w:  256, h:  336, dark: true,
      text: 'Every chase kicks off with a why, that quiet nudge that won’t let go.', attr: 'The Power of Why',
      href: 'posts/power-of-why.html' },
    { type: 'swatch', x:  782, y: 1942, w:  336, h:  256, hex: '#8a7a63' },
    { type: 'quote', x: 4322, y: 2242, w:  396, h:  376,
      text: 'The unknown’s every start, blank slate, no script.', attr: 'The Unknown',
      href: 'posts/unknown.html' },
    { type: 'img', x: 1702, y:   22, w:  296, h:  296, src: 'board/img/gohan.webp',
      alt: 'Gohan going Super Saiyan 2 at the Cell Games', title: 'Cell Games',
      body: 'The moment it finally turns. The interesting part was never the power \u2014 it was how long he refused to use it.' },
    { type: 'quote', x: 2042, y:  362, w:  656, h:  376,
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
