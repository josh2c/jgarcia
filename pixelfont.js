/* A 5x7 pixel font, used to lay written content into the scene as voxel text.
 * Each glyph is seven rows of five columns; 'X' is a block. */

export const FONT = {
    'A': '.XXX./X...X/X...X/XXXXX/X...X/X...X/X...X',
    'B': 'XXXX./X...X/X...X/XXXX./X...X/X...X/XXXX.',
    'C': '.XXX./X...X/X..../X..../X..../X...X/.XXX.',
    'D': 'XXXX./X...X/X...X/X...X/X...X/X...X/XXXX.',
    'E': 'XXXXX/X..../X..../XXXX./X..../X..../XXXXX',
    'F': 'XXXXX/X..../X..../XXXX./X..../X..../X....',
    'G': '.XXX./X...X/X..../X.XXX/X...X/X...X/.XXX.',
    'H': 'X...X/X...X/X...X/XXXXX/X...X/X...X/X...X',
    'I': 'XXXXX/..X../..X../..X../..X../..X../XXXXX',
    'J': '....X/....X/....X/....X/X...X/X...X/.XXX.',
    'K': 'X...X/X..X./X.X../XX.../X.X../X..X./X...X',
    'L': 'X..../X..../X..../X..../X..../X..../XXXXX',
    'M': 'X...X/XX.XX/X.X.X/X.X.X/X...X/X...X/X...X',
    'N': 'X...X/XX..X/X.X.X/X..XX/X...X/X...X/X...X',
    'O': '.XXX./X...X/X...X/X...X/X...X/X...X/.XXX.',
    'P': 'XXXX./X...X/X...X/XXXX./X..../X..../X....',
    'Q': '.XXX./X...X/X...X/X...X/X.X.X/X..X./.XX.X',
    'R': 'XXXX./X...X/X...X/XXXX./X.X../X..X./X...X',
    'S': '.XXXX/X..../X..../.XXX./....X/....X/XXXX.',
    'T': 'XXXXX/..X../..X../..X../..X../..X../..X..',
    'U': 'X...X/X...X/X...X/X...X/X...X/X...X/.XXX.',
    'V': 'X...X/X...X/X...X/X...X/X...X/.X.X./..X..',
    'W': 'X...X/X...X/X...X/X.X.X/X.X.X/XX.XX/X...X',
    'X': 'X...X/X...X/.X.X./..X../.X.X./X...X/X...X',
    'Y': 'X...X/X...X/.X.X./..X../..X../..X../..X..',
    'Z': 'XXXXX/....X/...X./..X../.X.../X..../XXXXX',
    '0': '.XXX./X...X/X..XX/X.X.X/XX..X/X...X/.XXX.',
    '1': '..X../.XX../..X../..X../..X../..X../.XXX.',
    '2': '.XXX./X...X/....X/...X./..X../.X.../XXXXX',
    '3': 'XXXXX/...X./..XX./....X/....X/X...X/.XXX.',
    '4': '...X./..XX./.X.X./X..X./XXXXX/...X./...X.',
    '5': 'XXXXX/X..../XXXX./....X/....X/X...X/.XXX.',
    '6': '..XX./.X.../X..../XXXX./X...X/X...X/.XXX.',
    '7': 'XXXXX/....X/...X./..X../.X.../.X.../.X...',
    '8': '.XXX./X...X/X...X/.XXX./X...X/X...X/.XXX.',
    '9': '.XXX./X...X/X...X/.XXXX/....X/...X./.XX..',
    ' ': '...../...../...../...../...../...../.....',
    '.': '...../...../...../...../...../..XX./..XX.',
    ',': '...../...../...../...../..XX./..XX./.XX..',
    "'": '..X../..X../...../...../...../...../.....',
    '-': '...../...../...../.XXX./...../...../.....',
    ':': '...../..XX./..XX./...../..XX./..XX./.....',
    '?': '.XXX./X...X/....X/...X./..X../...../..X..',
    '!': '..X../..X../..X../..X../..X../...../..X..',
    '&': '.XX../X..X./X.X../.X.../X.X.X/X..X./.XX.X',
    '/': '....X/...X./...X./..X../.X.../.X.../X....'
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;

/* Turns a string into block coordinates. Returns {cells:[{cx,cy}], width}
 * with cx measured left-to-right and cy top-to-bottom in glyph pixels. */
export function layout(text, spacing = 1) {
    const cells = [];
    let cx = 0;
    for (const raw of text.toUpperCase()) {
        const g = FONT[raw] || FONT[' '];
        g.split('/').forEach((row, y) => {
            row.split('').forEach((c, x) => {
                if (c === 'X') cells.push({ cx: cx + x, cy: y });
            });
        });
        cx += GLYPH_W + spacing;
    }
    return { cells, width: Math.max(0, cx - spacing) };
}
