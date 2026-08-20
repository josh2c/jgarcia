/* Board contents.
 *
 * One tile of the infinite plane, TILE_W x TILE_H. x/y are the card's top-left
 * corner within the tile; keep everything inside a ~60px margin so nothing
 * straddles a seam when the tile repeats.
 *
 * Types: note (written section) · quote · img · link · game · swatch · ph
 */

export const TILE_W = 2600;
export const TILE_H = 2000;

export const ITEMS = [
    /* ---- row 1 ------------------------------------------------------- */
    { type: 'note', x:   70, y:   70, w: 430, h: 300, rot: -2, num: '01', title: 'About',
      head: 'A creative who codes, designs, and thinks big.',
      body: 'I build things end to end — the product, the look, and the way it gets talked about.' },
    { type: 'quote', x:  550, y:  100, w: 330, h: 210, rot: 3,
      text: 'Reality’s what’s done, bend it, and you’ve got next.', attr: 'Reality’s Bend',
      href: 'posts/reality-bend.html' },
    { type: 'img', x:  930, y:   80, w: 230, h: 230, rot: -4, src: 'board/img/tz-logo.webp',
      alt: 'Trezure logo', title: 'Trezure', body: 'The mark for the football-first fantasy app.' },
    { type: 'swatch', x: 1210, y:   90, w: 150, h: 150, rot: 4, hex: '#e8a33d', name: 'Amber' },
    { type: 'ph', x: 1410, y:   70, w: 300, h: 220, rot: -3, label: 'Trezure — app screen' },
    { type: 'link', x: 1760, y:   90, w: 320, h: 200, rot: 2, ltitle: 'Trezure',
      ldesc: 'Season-long leagues, weekly contests, player-card collecting.',
      url: 'https://playtrezure.com' },
    { type: 'game', x: 2130, y:  100, w: 240, h: 200, rot: -3, game: 'pong', name: 'Pong' },
    { type: 'swatch', x: 2400, y:  110, w: 120, h: 120, rot: 5, hex: '#5fbdb8', name: 'Teal' },

    /* ---- row 2 ------------------------------------------------------- */
    { type: 'img', x:   80, y:  430, w: 260, h: 260, rot: 4, src: 'board/img/tz-mascot.webp',
      alt: 'Trezure mascot', title: 'Trezure mascot', body: 'Carries most of the personality in the app.' },
    { type: 'quote', x:  390, y:  440, w: 310, h: 200, rot: -3, dark: true,
      text: 'Time’s a one-shot deal, no refills.', attr: 'Time’s Trick',
      href: 'posts/time-trick.html' },
    { type: 'ph', x:  750, y:  420, w: 250, h: 300, rot: 2, label: 'Personal — photo' },
    { type: 'note', x: 1050, y:  430, w: 450, h: 330, rot: -2, num: '02', title: 'Now',
      head: 'Building Trezure.',
      body: 'A daily fantasy sports app, plus Busy Cab and Bemore Labz. And I design websites professionally.' },
    { type: 'quote', x: 1550, y:  450, w: 300, h: 190, rot: 4,
      text: 'New breaks old, always. Safety’s a cage.', attr: 'Innovation’s Price',
      href: 'posts/innovation-price.html' },
    { type: 'game', x: 1900, y:  460, w: 230, h: 190, rot: -4, game: 'paint', name: 'Paint' },
    { type: 'ph', x: 2180, y:  430, w: 280, h: 240, rot: 3, label: 'Busy Cab — gameplay' },

    /* ---- row 3 ------------------------------------------------------- */
    { type: 'quote', x:   70, y:  790, w: 320, h: 200, rot: 3,
      text: 'You kick something off, tight at first. Then it bends, spreads, finds its own legs.',
      attr: 'Limits of Control', href: 'posts/limits-control.html' },
    { type: 'link', x:  440, y:  810, w: 310, h: 200, rot: -2, ltitle: 'Busy Cab',
      ldesc: 'Pick up passengers. Floor it. Get paid.', url: 'https://busycabgame.com' },
    { type: 'img', x:  800, y:  780, w: 240, h: 240, rot: 4, src: 'board/img/tz-mascot-pirate.webp',
      alt: 'Pirate mascot', title: 'Pirate mascot', body: 'A seasonal variant.' },
    { type: 'ph', x: 1090, y:  820, w: 260, h: 200, rot: -3, label: 'Personal — sneakers' },
    { type: 'quote', x: 1400, y:  800, w: 300, h: 200, rot: 2, dark: true,
      text: 'Small wins stack. That’s the whole trick.', attr: 'Small Wins',
      href: 'posts/small-wins.html' },
    { type: 'swatch', x: 1750, y:  830, w: 130, h: 130, rot: -5, hex: '#6e9b57', name: 'Green' },
    { type: 'ph', x: 1930, y:  790, w: 290, h: 230, rot: 3, label: 'Personal — album art' },
    { type: 'game', x: 2270, y:  810, w: 220, h: 190, rot: -2, game: 'soon', name: 'Snake' },

    /* ---- row 4 ------------------------------------------------------- */
    { type: 'ph', x:   80, y: 1140, w: 300, h: 230, rot: -3, label: 'Personal — film still' },
    { type: 'note', x:  430, y: 1130, w: 420, h: 300, rot: 2, num: '03', title: 'Also',
      head: 'Data, crypto, real estate and strategy games.',
      body: 'A hundred-odd Python problems solved for fun. I like systems you can take apart.' },
    { type: 'quote', x:  900, y: 1150, w: 310, h: 200, rot: -4,
      text: 'The grind is just showing up when no one answers.', attr: 'The Grind',
      href: 'posts/the-grind.html' },
    { type: 'img', x: 1260, y: 1140, w: 220, h: 220, rot: 3, src: 'board/img/tz-mascot-popup.webp',
      alt: 'Popup mascot', title: 'Popup mascot', body: 'Used for in-app moments.' },
    { type: 'link', x: 1530, y: 1150, w: 320, h: 200, rot: -2, ltitle: 'Bemore Labz',
      ldesc: 'Chaos into systems. Ambition into software that lasts.',
      url: 'https://bemorelabz.com' },
    { type: 'ph', x: 1900, y: 1130, w: 270, h: 240, rot: 4, label: 'Personal — travel' },
    { type: 'swatch', x: 2220, y: 1160, w: 130, h: 130, rot: -3, hex: '#2a2e2b', name: 'Ink' },
    { type: 'ph', x: 2380, y: 1140, w: 150, h: 210, rot: 2, label: 'Misc' },

    /* ---- row 5 ------------------------------------------------------- */
    { type: 'quote', x:   80, y: 1500, w: 320, h: 200, rot: 3,
      text: 'Simplicity is the hard part. Everything else is decoration.', attr: 'Simplicity',
      href: 'posts/simplicity.html' },
    { type: 'link', x:  450, y: 1520, w: 300, h: 190, rot: -3, ltitle: 'Twitter',
      ldesc: 'Where I think out loud.', url: 'https://x.com/0talentt' },
    { type: 'ph', x:  800, y: 1490, w: 260, h: 230, rot: 2, label: 'Personal — vinyl' },
    { type: 'quote', x: 1110, y: 1510, w: 330, h: 200, rot: -2, dark: true,
      text: 'Curiosity pulls harder than discipline pushes.', attr: 'Curiosity’s Pull',
      href: 'posts/curiosity-pull.html' },
    { type: 'game', x: 1490, y: 1520, w: 220, h: 190, rot: 4, game: 'soon', name: 'Breakout' },
    { type: 'ph', x: 1760, y: 1490, w: 290, h: 240, rot: -3, label: 'Personal — game shelf' },
    { type: 'quote', x: 2100, y: 1510, w: 320, h: 200, rot: 2,
      text: 'Tools that fit disappear. That’s how you know.', attr: 'Tools That Fit',
      href: 'posts/tools-that-fit.html' }
];
