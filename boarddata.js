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
    { type: 'note', x:   22, y: 3002, w:  716, h:  336, num: '01', title: 'About',
      head: 'A creative who codes, designs, and thinks big.',
      body: 'I build things end to end: the product, the look, and the way it gets talked about.' },
    { type: 'img', x:  782, y: 3002, w:  336, h:  336, src: 'board/img/tz-logo.webp',
      alt: 'Trezure logo', title: 'Trezure', body: 'The mark for the football-first fantasy app.' },
    { type: 'swatch', x: 1702, y: 2242, w:  296, h:  376, hex: '#e8a33d' },
        { type: 'img', x: 2742, y: 1542, w:  796, h: 1076, src: 'board/img/kobe.webp',
      alt: 'Kobe Bryant driving to the rim', title: 'Kobe',
      body: 'The one where the whole face is already past the defender. Obsession is not a personality trait, it is a schedule.' },
    { type: 'swatch', x: 1702, y:  362, w:  296, h:  376, hex: '#5fbdb8' },

    /* ---- row 2 ------------------------------------------------------- */
    { type: 'img', x:   22, y: 1942, w:  256, h:  256, src: 'board/img/tz-mascot.webp',
      alt: 'Trezure mascot', title: 'Trezure mascot', body: 'Carries most of the personality in the app.' },
    { type: 'img', x: 4002, y: 1082, w:  716, h:  416, src: 'board/img/omarchy.webp',
      alt: 'Omarchy wordmark in green pixel type', title: 'Omarchy',
      body: 'The Arch setup this site gets built on. Someone else\u2019s opinionated defaults, taken whole \u2014 the fastest way to stop fiddling with the desk and start using it.' },
    { type: 'note', x: 3582, y: 2242, w:  696, h:  376, num: '02', title: 'Now',
      head: 'Building Trezure.',
      body: 'A daily fantasy sports app, plus Busy Cab and Bemore Labz. And I design websites professionally.' },
    { type: 'ph', x: 4002, y: 3002, w:  716, h:  336, label: 'Personal, album art' },

    /* ---- row 3 ------------------------------------------------------- */
        { type: 'img', x: 2042, y: 2242, w:  356, h:  376, src: 'board/img/tz-mascot-pirate.webp',
      alt: 'Pirate mascot', title: 'Pirate mascot', body: 'A seasonal variant.' },
    { type: 'swatch', x: 2442, y: 2242, w:  256, h:  376, hex: '#6e9b57' },
    { type: 'img', x: 2742, y: 3002, w:  436, h:  336, src: 'board/img/century.webp',
      alt: 'Black Toyota Century on the Bonneville salt flats', title: 'Toyota Century',
      body: 'Parked on the Bonneville salt. A V12 that never mentions it. The whole car is restraint, and that is the part I keep stealing.' },
    { type: 'swatch', x:  782, y:  362, w:  336, h:  376, hex: '#2a2e2b' },

    /* ---- row 4 ------------------------------------------------------- */
    { type: 'img', x: 3582, y:  362, w:  696, h:  376, src: 'board/img/octopus.webp',
      alt: 'Engraving of an octopus', title: 'Octopus',
      body: 'An old scientific engraving. Nine brains and no single one in charge, which is closer to how anything good actually gets built.' },
    { type: 'note', x:  782, y: 1942, w:  876, h:  676, num: '03', title: 'Also',
      head: 'Data, crypto, real estate and strategy games.',
      body: 'A hundred-odd Python problems solved for fun. I like systems you can take apart.' },
    { type: 'img', x:  322, y: 1082, w:  416, h:  416, src: 'board/img/tz-mascot-popup.webp',
      alt: 'Popup mascot', title: 'Popup mascot', body: 'Used for in-app moments.' },
    { type: 'img', x:   22, y:  362, w:  716, h:  376, src: 'board/img/raylewis.webp',
      alt: 'Ray Lewis in a Ravens 52 jersey', title: 'Ray Lewis',
      body: 'Ravens 52. Nobody ever accused him of saving something for the next play.' },
    { type: 'swatch', x: 2042, y: 1082, w:  356, h:  416, hex: '#f0c060' },
    { type: 'img', x: 1162, y: 1082, w:  496, h:  816, src: 'board/img/seiko.webp',
      alt: 'Grand Seiko SBGA469 with a blue Spring Drive dial', title: 'Grand Seiko SBGA469',
      body: 'Spring Drive: the second hand glides instead of ticking. A dial finished like weather and a movement that refuses to make a sound about it.' },

    /* ---- row 5 ------------------------------------------------------- */
    { type: 'img', x: 2042, y: 3002, w:  356, h:  336, src: 'board/img/marathon.webp',
      alt: 'The Marathon Don\u2019t Stop, a book about Nipsey Hussle', title: 'The Marathon Don\u2019t Stop',
      body: 'Rob Kenner on Nipsey Hussle. Own the block, then the building \u2014 build the thing where you already are instead of waiting to be let in somewhere else.' },
    { type: 'swatch', x: 3582, y: 3002, w:  376, h:  336, hex: '#8a7a63' },
    { type: 'img', x: 2042, y:  362, w:  656, h:  676, src: 'board/img/gohan.webp',
      alt: 'Gohan going Super Saiyan 2 at the Cell Games', title: 'Cell Games',
      body: 'The moment it finally turns. The interesting part was never the power \u2014 it was how long he refused to use it.' },

    /* ---- more voice, so the board reads rather than just decorates ---- */

    { type: 'img', x: 2742, y:  782, w:  436, h:  256, src: 'board/img/todo.webp',
      alt: 'Aoi Todo from Jujutsu Kaisen, arms folded', title: 'Todo',
      body: 'Jujutsu Kaisen. The one who asks the question first and fights afterwards \u2014 the whole bit is that taste tells you more about someone than a r\u00e9sum\u00e9 does.' },

    { type: 'img', x: 1162, y:  362, w:  496, h:  376, src: 'board/img/desk.webp',
      alt: 'A desk at dusk with a laptop, a monitor and a lit tower', title: 'The rig',
      body: 'Two machines, more keyboards than hands, and a window doing the lighting for free. Most of this site was built at it.' },

    { type: 'img', x:   22, y: 2242, w:  716, h:  376, src: 'board/img/liquiddeath.webp',
      alt: 'A variety pack of Liquid Death sparkling energy', title: 'Liquid Death',
      body: 'Death to drowsy. Here for the branding as much as the caffeine \u2014 nobody else would put a death metal logo on a can of water and mean it.' },

    /* ---- other people's words. A moodboard collects what resonates,
         not the owner's own back catalogue. ---- */
    { type: 'quote', x: 1162, y: 2662, w:  496, h:  296, tone: 'amber', face: 'shout', fs: 102,
      text: 'Less, but better.',
      attr: 'Dieter Rams' },
    { type: 'quote', x:  782, y:   22, w:  336, h:  296, tone: 'paper', face: 'script', fs: 49,
      text: 'Good design is as little design as possible.',
      attr: 'Dieter Rams' },
    { type: 'quote', x: 1162, y:  782, w:  496, h:  256, tone: 'blue', face: 'serif', fs: 35,
      text: 'Design is not just what it looks like and feels like. Design is how it works.',
      attr: 'Steve Jobs' },
    { type: 'quote', x: 1702, y:  782, w:  296, h:  716, tone: 'paper', face: 'display', fs: 39,
      text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.',
      attr: 'Antoine de Saint-Exupéry' },
    { type: 'quote', x: 4322, y:   22, w:  396, h:  296, tone: 'paperblue', face: 'caps', fs: 30,
      text: 'The details are not the details. They make the design.',
      attr: 'Charles Eames' },
    { type: 'quote', x: 1162, y:   22, w:  836, h:  296, tone: 'ink', face: 'serif', fs: 56,
      text: 'Absorb what is useful, discard what is useless, add what is essentially your own.',
      attr: 'Bruce Lee' },
    { type: 'quote', x: 3222, y: 1082, w:  316, h:  416, tone: 'paper', face: 'serif', fs: 39,
      text: 'Once you decide on your occupation, you must immerse yourself in your work.',
      attr: 'Jiro Ono' },
    { type: 'quote', x: 3582, y:   22, w:  376, h:  296, tone: 'clay', face: 'caps', fs: 29,
      text: 'The life of a designer is a life of fight against the ugliness.',
      attr: 'Massimo Vignelli' },
    { type: 'quote', x: 3222, y:  362, w:  316, h:  376, tone: 'paper', face: 'caps', fs: 30,
      text: 'Design is so simple, that’s why it is so complicated.',
      attr: 'Paul Rand' },
    { type: 'quote', x: 2442, y: 1542, w:  256, h:  356, tone: 'teal', face: 'shout', fs: 55,
      text: 'God is in the details.',
      attr: 'Mies van der Rohe' },
    { type: 'quote', x:  322, y:  782, w:  416, h:  256, tone: 'amber', face: 'shout', fs: 60,
      text: 'Make something people want.',
      attr: 'Y Combinator' },
    { type: 'quote', x: 4002, y:  782, w:  716, h:  256, tone: 'paper', face: 'display', fs: 36,
      text: 'If you are not embarrassed by the first version of your product, you’ve launched too late.',
      attr: 'Reid Hoffman' },
    { type: 'quote', x: 4002, y: 2662, w:  276, h:  296, tone: 'paperblue', face: 'serif', fs: 31,
      text: 'It is only by going through a volume of work that you will close that gap.',
      attr: 'Ira Glass' },
    { type: 'quote', x: 3222, y:  782, w:  316, h:  256, tone: 'blue', face: 'shout', fs: 60,
      text: 'Real artists ship.',
      attr: 'Steve Jobs' },
    { type: 'quote', x:  782, y: 1542, w:  336, h:  356, tone: 'paper', face: 'script', fs: 51,
      text: 'Make it work, make it right, make it fast.',
      attr: 'Kent Beck' },
    { type: 'quote', x:   22, y:  782, w:  256, h:  256, tone: 'ink', face: 'shout', fs: 45,
      text: 'Perfect is the enemy of good.',
      attr: 'Voltaire' },
    { type: 'quote', x: 1702, y: 1942, w:  296, h:  256, tone: 'paper', face: 'script', fs: 47,
      text: 'Talk is cheap. Show me the code.',
      attr: 'Linus Torvalds' },
    { type: 'quote', x: 1702, y: 2662, w:  296, h:  296, tone: 'teal', face: 'caps', fs: 28,
      text: 'The best way to predict the future is to invent it.',
      attr: 'Alan Kay' },
    { type: 'quote', x: 4322, y: 1942, w:  396, h:  256, tone: 'paper', face: 'caps', fs: 29,
      text: 'Premature optimization is the root of all evil.',
      attr: 'Donald Knuth' },
    { type: 'quote', x:  782, y:  782, w:  336, h:  256, tone: 'paperblue', face: 'script', fs: 41,
      text: 'Simplicity is prerequisite for reliability.',
      attr: 'Edsger Dijkstra' },
    { type: 'quote', x: 3582, y: 2662, w:  376, h:  296, tone: 'paper', face: 'caps', fs: 29,
      text: 'Debugging is twice as hard as writing the code in the first place.',
      attr: 'Brian Kernighan' },
    { type: 'quote', x: 4002, y: 1542, w:  716, h:  356, tone: 'clay', face: 'display', fs: 46,
      text: 'A complex system that works is invariably found to have evolved from a simple system that worked.',
      attr: 'John Gall' },
    { type: 'quote', x: 2442, y: 1082, w:  256, h:  416, tone: 'paper', face: 'serif', fs: 32,
      text: 'Organizations design systems that mirror their own communication structure.',
      attr: 'Melvin Conway' },
    { type: 'quote', x:  322, y: 1542, w:  416, h:  656, tone: 'ink', face: 'serif', fs: 58,
      text: 'All problems in computer science can be solved by another level of indirection.',
      attr: 'David Wheeler' },
    { type: 'quote', x:  782, y: 2662, w:  336, h:  296, tone: 'paper', face: 'caps', fs: 29,
      text: 'Adding manpower to a late software project makes it later.',
      attr: 'Fred Brooks' },
    { type: 'quote', x:   22, y:   22, w:  256, h:  296, tone: 'amber', face: 'serif', fs: 26,
      text: 'The most dangerous phrase in the language is, we’ve always done it this way.',
      attr: 'Grace Hopper' },
    { type: 'quote', x: 2042, y: 2662, w:  656, h:  296, tone: 'paper', face: 'display', fs: 39,
      text: 'If you’ve chosen the right data structures, the algorithms will almost always be self-evident.',
      attr: 'Rob Pike' },
    { type: 'quote', x: 2742, y: 2662, w:  436, h:  296, tone: 'blue', face: 'caps', fs: 31,
      text: 'Everything should be made as simple as possible, but no simpler.',
      attr: 'Albert Einstein' },
    { type: 'quote', x: 2042, y:   22, w:  356, h:  296, tone: 'paperblue', face: 'script', fs: 59,
      text: 'The highest human act is to inspire.',
      attr: 'Nipsey Hussle' },
    { type: 'quote', x:  322, y:   22, w:  416, h:  296, tone: 'ink', face: 'shout', fs: 74,
      text: 'The marathon continues.',
      attr: 'Nipsey Hussle' },
    { type: 'quote', x: 3582, y: 1942, w:  376, h:  256, tone: 'paper', face: 'script', fs: 47,
      text: 'I’m not a businessman, I’m a business, man.',
      attr: 'Jay-Z' },
    { type: 'quote', x: 3222, y: 2662, w:  316, h:  296, tone: 'teal', face: 'script', fs: 44,
      text: 'Play long-term games with long-term people.',
      attr: 'Naval Ravikant' },
    { type: 'quote', x: 4002, y:   22, w:  276, h:  296, tone: 'paper', face: 'script', fs: 49,
      text: 'Earn with your mind, not your time.',
      attr: 'Naval Ravikant' },
    { type: 'quote', x: 2442, y: 1942, w:  256, h:  256, tone: 'clay', face: 'script', fs: 39,
      text: 'Every battle is won before it is ever fought.',
      attr: 'Sun Tzu' },
    { type: 'quote', x:   22, y: 2662, w:  716, h:  296, tone: 'blue', face: 'serif', fs: 49,
      text: 'When you want something, all the universe conspires in helping you to achieve it.',
      attr: 'The Alchemist' },
    { type: 'quote', x: 2442, y:   22, w:  256, h:  296, tone: 'paper', face: 'serif', fs: 28,
      text: 'It’s the possibility of having a dream come true that makes life interesting.',
      attr: 'The Alchemist' },
    { type: 'quote', x: 2742, y:   22, w:  796, h:  296, tone: 'paperblue', face: 'display', fs: 46,
      text: 'There is only one thing that makes a dream impossible to achieve: the fear of failure.',
      attr: 'The Alchemist' },
    { type: 'quote', x: 4322, y: 2662, w:  396, h:  296, tone: 'paper', face: 'serif', fs: 39,
      text: 'The secret of life is to fall seven times and to get up eight times.',
      attr: 'The Alchemist' },
    { type: 'quote', x: 1702, y: 1542, w:  296, h:  356, tone: 'amber', face: 'serif', fs: 36,
      text: 'People are capable, at any time in their lives, of doing what they dream of.',
      attr: 'The Alchemist' },
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
