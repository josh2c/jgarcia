/* Board — an open isometric city.
 *
 * There is no slab and no edge: a detailed core holds the streets, the written
 * zones, a river and a park, and a thinning sprawl runs outward from it until
 * it dissolves into the fog. The plane reads as continuing past the horizon
 * rather than sitting in a box. Landmark buildings carry real content and are
 * clickable; everything else is scenery.
 *
 * The landing state is not a separate page: it is the same scene viewed
 * head-on at the title frame. Pressing Enter animates the CAMERA from that
 * pose into the isometric one, so the frame appears to rotate as you move
 * around it and you end up inside the city. One page throughout.
 *
 * Orthographic camera, so this is true isometric — no vanishing point.
 * Models are Kenney (CC0).
 */

import * as THREE from 'three';
import { GLTFLoader } from './vendor/jsm/loaders/GLTFLoader.js';
import { layout, GLYPH_H } from './pixelfont.js';

/* Surface any failure — a silent hang is the worst outcome here. */
const loadingText = document.getElementById('loading-text');
function fail(msg, err) {
    if (loadingText) loadingText.textContent = msg;
    if (err) console.error(err);
}
window.addEventListener('error', (e) => fail('Something broke: ' + e.message, e.error));

loadingText.textContent = 'Loading models…';

/* --------------------------------------------------------------- config --- */

/* Tile coordinates are world-centred: tile 0 is the middle of the board and
 * world x = tile * TILE. The camera can see roughly +-35 tiles at any moment
 * and travels 30 tiles down the route, so WORLD covers everything visible on
 * an ultrawide with margin — and nothing beyond it. */
const WORLD = 60;                // half-extent of the generated world, tiles
const CORE = 22;                 // detailed city corridor, half-extent
const BLOCK = 5;                 // tiles between streets
const SEED = 20260819;

/* Model ids are "kit/name": Kenney reuses names across kits (building-a exists
 * in both commercial and industrial), and the id doubles as the load path. */

/* --- commercial: the downtown ------------------------------------------- */
const TOWERS  = ['a','b','c','d','e'].map((k) => 'city/building-skyscraper-' + k);
const MIDRISE = ['a','b','c','d','e','f'].map((k) => 'city/building-' + k);
const SMALL   = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n']
                  .map((k) => 'city/low-detail-building-' + k)
                  .concat(['city/low-detail-building-wide-a', 'city/low-detail-building-wide-b']);

/* --- suburban: houses, and its OWN trees and yard pieces, authored to the
       same scale as the buildings. This is what the nature kit was standing in
       for, badly. ------------------------------------------------------- */
// Kept to those that fit a 2x2 plot; the rest were trimmed for weight.
const HOUSES = 'abcdefghijklops'.split('').map((k) => 'suburban/building-type-' + k);
const YARD   = ['suburban/driveway-long', 'suburban/path-long', 'suburban/path-stones-long',
                'suburban/planter', 'suburban/tree-small', 'suburban/tree-large',
                'suburban/fence-1x3', 'suburban/fence-2x2', 'suburban/fence-3x3', 'suburban/fence-low'];

/* --- industrial --------------------------------------------------------- */
// Seven industrial models are wider than a 2x2 plot and were dropped rather
// than given a special case that would overlap their neighbours.
const WORKS  = 'defghijkmnopt'.split('').map((k) => 'industrial/building-' + k);
const STACKS = ['industrial/chimney-basic', 'industrial/chimney-small',
                'industrial/chimney-medium', 'industrial/chimney-large', 'industrial/detail-tank'];

/* --- streets ------------------------------------------------------------ */
const ROADS  = ['roads/road-straight', 'roads/road-crossroad', 'roads/road-bridge', 'roads/road-crossing'];
const PROPS  = ['roads/light-square', 'roads/electricity-pole', 'roads/dumpster', 'roads/construction-cone'];
const CARS   = ['taxi','sedan','suv','police','delivery','firetruck'].map((k) => 'cars/' + k);

/* --- open country: only used well away from buildings, where the different
       authoring scale does not read as an error. ------------------------- */
const TREES  = ['tree_default','tree_tall','tree_cone','tree_blocks','tree_detailed','tree_pineDefaultA'].map((k) => 'nature/' + k);
const SHRUBS = ['plant_bush','plant_bushLarge','grass','grass_large','flower_purpleA','flower_redA','mushroom_red'].map((k) => 'nature/' + k);
const ROCKS  = ['rock_largeA','rock_largeC','rock_smallA','rock_smallC'].map((k) => 'nature/' + k);
const DESERT = ['cactus_short','cactus_tall','rock_smallA','rock_largeC'].map((k) => 'nature/' + k);
const CAMP   = ['tent_smallOpen','campfire_logs','log','stump_round','crop_pumpkin','statue_obelisk'].map((k) => 'nature/' + k);
const NATURE = [...new Set([...TREES, ...SHRUBS, ...ROCKS, ...DESERT, ...CAMP])];

/* Cel-shaded palette: teal sky, warm paper and stone, vermilion and yellow
 * accents, near-black ink. Matches theme.css. */
const PAL = {
    sky:    0x5fbdb8,
    skyFar: 0x8ed6d1,
    ink:    0x2a2e2b,
    paper:  0xf2efe4,
    stone:  0xded9c8,
    stoneD: 0xc8c2ae,
    sage:   0x9bb08a,
    grass:  0x6e9b57,
    water:  0x58a8b0,
    road:   0xc4bfae,
    accent: 0xe8a33d,
    yellow: 0xf0c060,
    green:  0x6e9b57,
    blue:   0x6b8ca3,
    brown:  0x8a7a63,
    muted:  0x55605a
};

/* Written content that lives in the world rather than on a page. Each zone
 * clears a rectangle of city and lays the text out in blocks on the ground,
 * with a raised section bar alongside it. gx/gz is the zone's top-left tile. */
const ZONES = [
    {
        num: '01', title: 'About', gx: -9, gz: -17, w: 15, h: 8,
        head: 'A CREATIVE',
        lines: ['WHO CODES, DESIGNS,', 'AND THINKS BIG.']
    },
    {
        num: '02', title: 'Now', gx: -10, gz: -2, w: 17, h: 8,
        head: 'BUILDING',
        lines: ['TREZURE, A DAILY FANTASY', 'SPORTS APP. AND I DESIGN', 'WEBSITES PROFESSIONALLY.']
    },
    {
        num: '03', title: 'Also', gx: -9, gz: 13, w: 16, h: 7,
        head: 'DATA, CRYPTO,',
        lines: ['REAL ESTATE AND', 'STRATEGY GAMES.']
    }
];

/* The river cuts across between the first and second sections, so the route
 * passes through it. Tile range on the centred grid. */
/* How large the written sections are relative to the world. At 1.0 each apron
 * was 26x11 tiles — over half the screen, blank. */
const TEXT_SCALE = 0.6;

/* A Kenney building spans about two road tiles, so the placement module is a
 * 2x2 plot — four plots to a 4x4 block, exactly as in Kenney's own renders. */
const PLOT = 2;

/* Which way the models face by default. Flip by Math.PI if they end up with
 * their backs to the street. */
const FACE_OFFSET = 0;

/* Suburban ships trees at the same scale as its houses. */
const YARD_TREES = ['suburban/tree-small', 'suburban/tree-large'];

const RIVER_Z0 = -7, RIVER_Z1 = -5;

/* Deterministic PRNG so the city feels random but never reshuffles. */
function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

/* ----------------------------------------------------------------- three -- */

const canvas = document.getElementById('stage');
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch (err) {
    fail('This scene needs WebGL, which this browser cannot start.', err);
    throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(PAL.sky);
renderer.outputColorSpace = THREE.SRGBColorSpace;   // keep the colormap true

const scene = new THREE.Scene();

const CAM_DIST = 220;                 // fog is tuned around this standoff
// Fog fades toward the sky colour so the board dissolves into it.
scene.fog = new THREE.Fog(PAL.sky, CAM_DIST - 20, CAM_DIST + 150);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 900);

/* Two camera poses. The intro looks straight down the +Z axis at the title
 * frame; the board pose is the isometric three-quarter view. Entering just
 * animates between them. */
/* All framing is expressed in tiles and resolved once TILE is measured, so the
 * composition holds whatever scale Kenney's models turn out to be. */
let FRAME_Y = 26;
const POSE_INTRO = { dir: new THREE.Vector3(0, 0, 1), target: new THREE.Vector3(0, 26, 0), zoom: 9 };
const POSE_BOARD = { dir: new THREE.Vector3(1, 1, 1).normalize(), target: new THREE.Vector3(0, 0, 0), zoom: 13 };

function resolveFraming() {
    FRAME_Y = TILE * 30;
    POSE_INTRO.target.set(0, FRAME_Y, 0);
    POSE_INTRO.zoom = TILE * 8.5;      // frames the title slab with a margin
    POSE_BOARD.zoom = TILE * 13;       // ~26 tiles tall: zoomed into the city
    if (!entered) { zoom = POSE_INTRO.zoom; target.copy(POSE_INTRO.target); }
}

let zoom = POSE_INTRO.zoom;
const camDir = POSE_INTRO.dir.clone();
const target = POSE_INTRO.target.clone();
let entered = false;
let freeCamera = false;     // editing frees the camera from the route

function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -zoom * aspect;
    camera.right = zoom * aspect;
    camera.top = zoom;
    camera.bottom = -zoom;
    camera.updateProjectionMatrix();
}

function placeCamera() {
    camera.position.copy(target).addScaledVector(camDir, CAM_DIST);
    camera.lookAt(target);
}

scene.add(new THREE.AmbientLight(0xffffff, 0.95));
const key = new THREE.DirectionalLight(0xfff6e2, 1.55);
key.position.set(50, 80, 30);
scene.add(key);
const rim = new THREE.DirectionalLight(0x5fbdb8, 0.35);
rim.position.set(-45, 25, -35);
scene.add(rim);

/* ---------------------------------------------------------------- loading -- */

const loader = new GLTFLoader();
const fill = document.getElementById('loading-fill');
const loadingEl = document.getElementById('loading');

/* If world.json is present it wins over the generator. Missing is normal and
 * not an error — the generator is the fallback. */
let HAND_PLACED = null;

function loadWorld() {
    return fetch('world.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (d && Array.isArray(d.items) && d.items.length) HAND_PLACED = d.items;
        })
        .catch(() => { /* no world.json — generate instead */ });
}

const NEEDED = [...new Set([...TOWERS, ...MIDRISE, ...SMALL, ...HOUSES, ...YARD,
                           ...WORKS, ...STACKS, ...ROADS, ...PROPS, ...CARS, ...NATURE])];
const parts = {};
let done = 0;

/* Which kit a model came from, so it loads next to the right colormap. */
/* Measured against the 1-unit road tile:
 *   city/roads  authored at city scale already
 *   cars        3.25 units long -> a car three road tiles long
 *   nature      trees 1.7 tall -> as tall as a tower  */
/* The four city kits are authored to sit together at 1.0. Nature and Cars come
 * from different families and need bringing into line. */
const KIT_SCALE = { city: 1, roads: 1, suburban: 1, industrial: 1, cars: 0.13, nature: 0.3 };

function kitOf(id) { return id.split('/')[0]; }

function loadOne(name) {
    return new Promise((resolve) => {
        loader.load('city/models/' + name + '.glb', (gltf) => {
            const found = [];
            const k = KIT_SCALE[kitOf(name)] || 1;
            const fit = new THREE.Matrix4().makeScale(k, k, k);
            gltf.scene.updateWorldMatrix(true, true);
            gltf.scene.traverse((o) => {
                if (!o.isMesh) return;
                const geo = o.geometry.clone();
                geo.applyMatrix4(o.matrixWorld);
                if (k !== 1) geo.applyMatrix4(fit);      // normalise to city scale
                // Kenney's nature kit ships metallicFactor 1 with no environment
                // map, which renders almost black. Force it dielectric.
                const mat = o.material;
                if (mat && mat.isMeshStandardMaterial) { mat.metalness = 0; mat.roughness = 0.9; }
                found.push({ geometry: geo, material: mat });
            });
            if (found.length) parts[name] = found;
            done++;
            fill.style.width = Math.round((done / NEEDED.length) * 100) + '%';
            resolve();
        }, undefined, () => { done++; resolve(); });   // never stall on one bad file
    });
}

/* ------------------------------------------------------------------ build -- */

let TILE = 1;
const clickTargets = [];

function sizeOf(name) {
    const ps = parts[name];
    if (!ps || !ps.length) return { x: 1, y: 1, z: 1 };
    const box = new THREE.Box3();
    ps.forEach((p) => {
        p.geometry.computeBoundingBox();
        box.union(p.geometry.boundingBox);
    });
    return { x: box.max.x - box.min.x, y: box.max.y - box.min.y, z: box.max.z - box.min.z };
}

/* Buildings get a per-instance tint; everything else keeps its own colour. */
const TINT = new THREE.Color();

function instance(name, transforms, tint, parent) {
    const ps = parts[name];
    if (!ps || !ps.length || !transforms.length) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    ps.forEach((part) => {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, transforms.length);
        transforms.forEach((t, i) => {
            q.setFromAxisAngle(up, t.rot || 0);
            const sc = t.scale || 1;
            m.compose(new THREE.Vector3(t.x, t.y || 0, t.z), q, new THREE.Vector3(sc, sc, sc));
            mesh.setMatrixAt(i, m);
            if (tint) {
                // A narrow warm-to-cool spread. Wider than this and the city
                // stops looking like one place.
                const h = 0.08 + rand() * 0.42;
                TINT.setHSL(h, 0.10 + rand() * 0.10, 0.72 + rand() * 0.2);
                mesh.setColorAt(i, TINT);
            }
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.frustumCulled = false;
        (parent || scene).add(mesh);
    });
}

/* Grouped model palette, used by the editor. */
const PALETTE = [
    { group: 'Houses',     models: HOUSES },
    { group: 'Yard',       models: YARD },
    { group: 'Downtown',   models: TOWERS.concat(MIDRISE) },
    { group: 'Small',      models: SMALL },
    { group: 'Industrial', models: WORKS },
    { group: 'Stacks',     models: STACKS },
    { group: 'Street',     models: PROPS },
    { group: 'Roads',      models: ROADS },
    { group: 'Trees',      models: TREES },
    { group: 'Planting',   models: SHRUBS },
    { group: 'Rocks',      models: ROCKS },
    { group: 'Desert',     models: DESERT },
    { group: 'Camp',       models: CAMP }
];

/* Which model sets accept a tint. */
const BUILDINGS_TINT = new Set([...TOWERS, ...MIDRISE, ...SMALL, ...HOUSES, ...WORKS]);

/* A single placeable copy of a model, for landmarks and traffic. */
function makeModel(name) {
    const ps = parts[name];
    if (!ps || !ps.length) return null;
    if (ps.length === 1) return new THREE.Mesh(ps[0].geometry, ps[0].material);
    const g = new THREE.Group();
    ps.forEach((p) => g.add(new THREE.Mesh(p.geometry, p.material)));
    return g;
}

const markers = [];
let titleFrame = null;
let HALF = 0;               // half-width of the city in world units

/* The view travels a fixed path rather than roaming free: it threads the three
 * written zones, taking in a couple of landmarks on the way. Dragging and
 * scrolling move along it; letting go settles on the nearest stop. */
let PATH = null;            // THREE.CatmullRomCurve3
let STOPS = [];             // u values of the stops, for snapping
let u = 0;                  // current position along the path, 0..1

/* The route through the city, named by the things actually placed in it.
 * `zone` entries point at a written zone; `lot` entries at a landmark. */
const TOUR = [
    { zone: '01' },
    { zone: '02' },
    { zone: '03' }
];

/* Resolves a tour entry to a label and a tile position, reading straight from
 * ZONES so the rail can never list a section that is not there. */
function resolveTour() {
    return TOUR.map((step) => {
        if (step.zone) {
            const z = ZONES.find((v) => v.num === step.zone);
            if (!z) return null;
            return { label: z.num + ' ' + z.title, gx: z.gx + Math.round(z.w / 2), gz: z.gz + Math.round(z.h / 2) };
        }
        return null;   // landmarks were dropped; the rail carries those links
    }).filter(Boolean);
}

let TOUR_STOPS = [];

function buildPath() {
    TOUR_STOPS = resolveTour();
    const tile = (gx, gz) => new THREE.Vector3(at(gx), 0, at(gz));
    const pts = TOUR_STOPS.map((t) => tile(t.gx, t.gz));
    // Straight run from the first section to the last. Scrolling moves along
    // one axis only — no weaving left and right between sections.
    PATH = new THREE.LineCurve3(pts[0], pts[pts.length - 1]);

    // Stops are each section's position along that run.
    const a = pts[0], b = pts[pts.length - 1];
    const span = a.distanceTo(b) || 1;
    STOPS = pts.map((p) => Math.max(0, Math.min(1, a.distanceTo(p) / span)));
}

function renderStopList() {
    const host = document.getElementById('stops');
    if (!host) return;
    host.innerHTML = '';
    TOUR_STOPS.forEach((t, i) => {
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.stop = String(i);
        a.textContent = t.label;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            if (!entered) enterBoard(true);
            goToStop(i);
        });
        host.appendChild(a);
    });
}

function applyPath() {
    if (!PATH) return;
    target.copy(PATH.getPoint(Math.max(0, Math.min(1, u))));
    placeCamera();
}

const at = (i) => i * TILE;

/* Ground: a single large plane. There is deliberately no slab and no edge —
 * the city should read as an open isometric plane running past the horizon,
 * not a diorama sitting in a box. */
function buildGround() {
    const g = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD * TILE * 5, WORLD * TILE * 5),
        new THREE.MeshLambertMaterial({ color: PAL.stone })
    );
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.04;
    scene.add(g);
}

/* Environment districts, on the centred tile grid. Inside one, the city gives
 * way to that environment entirely. */
const DISTRICTS = [
    { name: 'forest',   cx: -44, cz: -38, r: 16, set: TREES,  scatter: SHRUBS, density: 0.55 },
    { name: 'woodland', cx:  40, cz: -44, r: 14, set: TREES,  scatter: SHRUBS, density: 0.48 },
    { name: 'desert',   cx:  46, cz:  26, r: 16, set: DESERT, scatter: ROCKS,  density: 0.30 },
    { name: 'badlands', cx: -42, cz:  40, r: 14, set: ROCKS,  scatter: DESERT, density: 0.32 },
    { name: 'camp',     cx:  34, cz: -18, r:  9, set: CAMP,   scatter: TREES,  density: 0.28 }
];

function districtAt(i, j) {
    for (const d of DISTRICTS) {
        const dx = i - d.cx, dz = j - d.cz;
        if (dx * dx + dz * dz < d.r * d.r) return d;
    }
    return null;
}

/* ------------------------------------------------------------- block plan --
 * The BLOCK is the unit, never the tile. Each block between streets is given
 * one type and then filled consistently. Density falls off outward by changing
 * the MIX of block types — streets are never removed, because a grid with
 * holes in it reads as rubble rather than as a sparser city.
 */

const BLOCK_TYPES = ['tower', 'dense', 'works', 'row', 'plot', 'park', 'open'];

function blockType(bi, bj) {
    // bi/bj are block indices; centre of the block in tiles:
    const ci = bi * BLOCK + BLOCK / 2;
    const cj = bj * BLOCK + BLOCK / 2;

    if (districtAt(ci, cj)) return 'district';

    const ring = Math.max(Math.abs(ci), Math.abs(cj));      // distance from centre
    const r = rand();

    // Beyond the detailed corridor everything thins toward open country.
    if (ring > CORE) {
        const t = 1 - Math.min(1, (ring - CORE) / (WORLD - CORE));
        if (r < 0.30 * t) return 'row';
        if (r < 0.58 * t) return 'plot';
        if (r < 0.58 * t + 0.28) return 'park';
        return 'open';
    }

    // Inside the corridor, character comes from the band.
    if (cj < RIVER_Z0) {
        // Neighbourhood — plots and greenery, deliberately loose.
        if (r < 0.62) return 'plot';
        if (r < 0.80) return 'park';
        if (r < 0.92) return 'row';
        return 'open';
    }

    // Downtown — taller and denser the further past the river.
    const depth = Math.min(1, (cj - RIVER_Z1) / (CORE - RIVER_Z1));
    if (r < 0.14 + depth * 0.20) return 'tower';
    if (r < 0.50 + depth * 0.16) return 'dense';
    if (r < 0.62) return 'works';
    if (r < 0.84) return 'row';
    if (r < 0.94) return 'park';
    return 'open';
}

/* --------------------------------------------------------------- the world --
 * Scenery is held as DATA (`scenery`), not built straight into the scene, so
 * the editor can add to it, delete from it and export it. Ground, streets,
 * water and the written sections stay procedural — they are the mechanical
 * parts that placement by hand would only make tedious. */

let ROAD_LANES = [];
let scenery = [];                 // [{ m, x, z, r, s }]
let sceneryGroup = null;

function build() {
    TILE = Math.max(sizeOf('road-straight').x, sizeOf('road-straight').z) || 1;
    HALF = CORE * TILE;
    resolveFraming();
    buildGround();
    buildPath();
    renderStopList();

    scenery = [];
    const put = (name, t) => scenery.push({ m: name, x: t.x, z: t.z, r: t.rot || 0, s: t.scale || 1 });
    const at = (i) => i * TILE;

    const roadT = [], crossT = [], bridgeT = [], riverT = [], padT = [];
    const vLines = new Map(), hLines = new Map();
    const note = (map, key, pos) => { const e = map.get(key) || []; e.push(pos); map.set(key, e); };

    const inZone = (i, j) => ZONES.some((z) =>
        i >= z.gx - 1 && i <= z.gx + z.w && j >= z.gz - 2 && j <= z.gz + z.h);
    const isRiver = (j) => j >= RIVER_Z0 && j <= RIVER_Z1;

    // --- streets and water: laid first, and never punctured -----------------
    for (let i = -WORLD; i <= WORLD; i++) {
        for (let j = -WORLD; j <= WORLD; j++) {
            const roadI = ((i % BLOCK) + BLOCK) % BLOCK === 0;
            const roadJ = ((j % BLOCK) + BLOCK) % BLOCK === 0;

            if (isRiver(j)) {
                if (roadI) { bridgeT.push({ x: at(i), z: at(j), rot: Math.PI / 2 }); note(vLines, i, at(j)); }
                else riverT.push({ x: at(i), z: at(j) });
                continue;
            }
            if (inZone(i, j)) continue;

            if (roadI && roadJ) { crossT.push({ x: at(i), z: at(j) }); note(vLines, i, at(j)); note(hLines, j, at(i)); }
            else if (roadI) { roadT.push({ x: at(i), z: at(j), rot: Math.PI / 2 }); note(vLines, i, at(j)); }
            else if (roadJ) { roadT.push({ x: at(i), z: at(j) }); note(hLines, j, at(i)); }
        }
    }

    // --- blocks -------------------------------------------------------------
    const b0 = Math.floor(-WORLD / BLOCK), b1 = Math.ceil(WORLD / BLOCK);
    for (let bi = b0; bi <= b1; bi++) {
        for (let bj = b0; bj <= b1; bj++) {
            const type = blockType(bi, bj);
            if (type === 'open') continue;

            const i0 = bi * BLOCK + 1, j0 = bj * BLOCK + 1;   // interior, inside the streets
            const n = BLOCK - 1;

            // Skip a block that any written section reaches into.
            let blocked = false;
            for (let a = 0; a < n && !blocked; a++)
                for (let b = 0; b < n && !blocked; b++)
                    if (inZone(i0 + a, j0 + b) || isRiver(j0 + b)) blocked = true;
            if (blocked) continue;

            const dist = type === 'district' ? districtAt(i0 + n / 2, j0 + n / 2) : null;

            // Pavement pad: frontage, so the street network reads as the gap
            // between masses rather than the masses themselves.
            if (type !== 'park' && type !== 'district') {
                padT.push({ x: at(i0 + (n - 1) / 2), z: at(j0 + (n - 1) / 2), w: n * TILE * 0.94 });
            }

            if (dist) {
                // Open country: scattered, no plots.
                for (let a2 = 0; a2 < n; a2++) for (let b2 = 0; b2 < n; b2++) {
                    const x = at(i0 + a2), z = at(j0 + b2);
                    if (rand() < dist.density) put(pick(dist.set), { x, z, rot: rand() * Math.PI * 2, scale: 0.85 + rand() * 0.5 });
                    else if (rand() < dist.density) put(pick(dist.scatter), { x, z, rot: rand() * Math.PI * 2, scale: 0.8 + rand() * 0.5 });
                }
                continue;
            }

            if (type === 'park') {
                for (let a2 = 0; a2 < n; a2++) for (let b2 = 0; b2 < n; b2++) {
                    const x = at(i0 + a2), z = at(j0 + b2);
                    if (rand() < 0.5) put(pick(YARD_TREES), { x, z, rot: rand() * Math.PI * 2, scale: 0.9 + rand() * 0.5 });
                    else if (rand() < 0.25) put('suburban/planter', { x, z, rot: rand() * Math.PI * 2 });
                }
                continue;
            }

            // --- built blocks: FOUR PLOTS, two by two ----------------------
            // A Kenney building is 1.3-2.5 units on a 1-unit road tile, so it
            // needs a 2x2 tile plot. Placing one per tile is what made them
            // interpenetrate.
            for (let pi = 0; pi < 2; pi++) {
                for (let pj = 0; pj < 2; pj++) {
                    const cx = at(i0 + pi * PLOT + (PLOT - 1) / 2);
                    const cz = at(j0 + pj * PLOT + (PLOT - 1) / 2);

                    // Face the nearer street, so blocks have frontage.
                    const face = (pj === 0 ? Math.PI : 0) + FACE_OFFSET;

                    if (type === 'tower') {
                        if (pi === 0 && pj === 0) put(pick(TOWERS), { x: cx, z: cz, rot: face });
                        else if (rand() < 0.5) put(pick(SMALL), { x: cx, z: cz, rot: face });
                        continue;
                    }

                    if (type === 'dense') {
                        put(pick(rand() < 0.45 ? MIDRISE : SMALL), { x: cx, z: cz, rot: face });
                        continue;
                    }

                    if (type === 'works') {
                        put(pick(WORKS), { x: cx, z: cz, rot: face });
                        if (rand() < 0.45) put(pick(STACKS), { x: cx + TILE * 0.7, z: cz + TILE * 0.6, rot: 0 });
                        continue;
                    }

                    if (type === 'row') {
                        if (rand() < 0.85) put(pick(SMALL), { x: cx, z: cz, rot: face });
                        continue;
                    }

                    // plot — a house, its driveway to the street, and planting
                    if (rand() < 0.82) {
                        put(pick(HOUSES), { x: cx, z: cz, rot: face });
                        const toward = pj === 0 ? -1 : 1;
                        put('suburban/driveway-long', { x: cx + TILE * 0.45, z: cz + toward * TILE * 0.85, rot: face });
                        if (rand() < 0.7) put(pick(YARD_TREES), { x: cx - TILE * 0.6, z: cz + toward * TILE * 0.6, rot: rand() * Math.PI * 2 });
                        if (rand() < 0.4) put('suburban/planter', { x: cx - TILE * 0.55, z: cz, rot: face });
                    } else if (rand() < 0.6) {
                        put(pick(YARD_TREES), { x: cx, z: cz, rot: rand() * Math.PI * 2, scale: 0.9 + rand() * 0.4 });
                    }
                }
            }
        }
    }

    instance('road-straight', roadT);
    instance('road-crossroad', crossT);
    instance('road-bridge', bridgeT);

    flatTiles(riverT, PAL.water, 0.03);
    flatPads(padT, PAL.paper);

    // --- lanes: continuous runs only ---------------------------------------
    ROAD_LANES = [];
    const MIN_RUN = TILE * 7;
    const addRuns = (alongX, fixed, positions) => {
        positions.sort((a, b) => a - b);
        let start = positions[0], prev = positions[0];
        const flush = () => { if (prev - start >= MIN_RUN) ROAD_LANES.push({ alongX, fixed, min: start, max: prev }); };
        for (let k = 1; k < positions.length; k++) {
            const p = positions[k];
            if (p - prev > TILE * 1.5) { flush(); start = p; }
            prev = p;
        }
        flush();
    };
    vLines.forEach((e, i) => addRuns(false, at(i), e));
    hLines.forEach((e, j) => addRuns(true, at(j), e));

    // A hand-placed world.json replaces the generated scenery outright.
    if (HAND_PLACED) {
        scenery = HAND_PLACED;
        console.log('[board] world.json loaded —', scenery.length, 'hand-placed objects');
    }
    renderScenery();
    ZONES.forEach(buildZone);
    titleFrame = buildTitleFrame();
    POSE_INTRO.target.copy(titleFrame.position);
    if (!entered) { target.copy(POSE_INTRO.target); placeCamera(); }
    buildConfetti();
    buildTraffic();
    placeCamera();
}

/* Rebuilds every scenery instance from `scenery`. Called once at startup and
 * again after each edit — a few thousand instances rebuild in a few ms. */
function renderScenery() {
    if (sceneryGroup) {
        sceneryGroup.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
        scene.remove(sceneryGroup);
    }
    sceneryGroup = new THREE.Group();
    scene.add(sceneryGroup);

    const byModel = {};
    scenery.forEach((it) => { (byModel[it.m] = byModel[it.m] || []).push(it); });
    Object.entries(byModel).forEach(([name, list]) => {
        instance(name, list.map((it) => ({ x: it.x, z: it.z, rot: it.r, scale: it.s })),
                 BUILDINGS_TINT.has(name), sceneryGroup);
    });
}

/* Flat coloured tiles laid on the ground (water). */
function flatTiles(list, color, y) {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(TILE, TILE),
        new THREE.MeshLambertMaterial({ color }), list.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    list.forEach((t, i) => {
        m.compose(new THREE.Vector3(t.x, y, t.z), q, new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
}

/* Pavement pads, one per built block. */
function flatPads(list, color) {
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshLambertMaterial({ color }), list.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    list.forEach((t, i) => {
        m.compose(new THREE.Vector3(t.x, 0.015, t.z), q, new THREE.Vector3(t.w, t.w, 1));
        mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
}

/* ---------------------------------------------------------- written text --
 * Sections are laid into the world as blocks on the ground, with a raised
 * section bar alongside. */

const ZONE_ACCENT = { '01': PAL.accent, '02': PAL.green, '03': PAL.yellow };

function textCells(text, originX, originZ, size, out) {
    const { cells } = layout(text);
    cells.forEach((c) => { out.push({ x: originX + c.cx * size, z: originZ + c.cy * size }); });
}

/* One flat block per text cell, with a few speckled in accent colours. */
function blockText(cells, size, y, color, speckle) {
    if (!cells.length) return;
    const geo = new THREE.BoxGeometry(size, size * 0.5, size);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color }), cells.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    cells.forEach((c, i) => {
        m.compose(new THREE.Vector3(c.x, y, c.z), q, one);
        mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    scene.add(mesh);

    if (!speckle) return;
    const accents = [PAL.accent, PAL.yellow, PAL.green, PAL.brown];
    cells.forEach((c) => {
        if (rand() > 0.07) return;
        const chip = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: accents[Math.floor(rand() * 4)] }));
        chip.position.set(c.x, y + 0.02, c.z);
        scene.add(chip);
    });
}

function buildZone(z) {
    const x0 = at(z.gx), z0 = at(z.gz);

    // A cleared apron so the writing sits on open ground.
    const apron = new THREE.Mesh(
        new THREE.PlaneGeometry(z.w * TILE, z.h * TILE),
        new THREE.MeshLambertMaterial({ color: PAL.paper })
    );
    apron.rotation.x = -Math.PI / 2;
    apron.position.set(x0 + (z.w * TILE) / 2, 0.02, z0 + (z.h * TILE) / 2);
    scene.add(apron);

    // Section bar with a coloured cap on its leading edge.
    const barW = z.w * TILE * 0.86, barH = TILE * 0.55, barD = TILE * 1.1;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, barD),
        new THREE.MeshLambertMaterial({ color: PAL.paper }));
    bar.position.set(x0 + barW / 2, barH / 2, z0 - TILE * 0.6);
    scene.add(bar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(TILE * 0.5, barH * 1.25, barD),
        new THREE.MeshLambertMaterial({ color: ZONE_ACCENT[z.num] || PAL.accent }));
    cap.position.set(x0 - TILE * 0.1, barH * 0.62, z0 - TILE * 0.6);
    scene.add(cap);

    const labelCells = [];
    textCells(z.num + ' ' + z.title.toUpperCase(), x0 + TILE * 0.6, z0 - TILE * 0.95, TILE * 0.16, labelCells);
    blockText(labelCells, TILE * 0.15, barH + 0.05, PAL.ink);

    const headSize = TILE * TEXT_SCALE * 0.28;
    const bodySize = TILE * TEXT_SCALE * 0.16;
    let cursor = z0 + TILE * 1.4;

    const headCells = [];
    textCells(z.head, x0 + TILE * 0.8, cursor, headSize, headCells);
    blockText(headCells, headSize * 0.92, 0.06, PAL.ink, true);
    cursor += GLYPH_H * headSize + TILE * 0.7;

    const bodyCells = [];
    z.lines.forEach((line) => {
        textCells(line, x0 + TILE * 0.8, cursor, bodySize, bodyCells);
        cursor += GLYPH_H * bodySize + TILE * 0.35;
    });
    blockText(bodyCells, bodySize * 0.92, 0.05, PAL.muted);
}

/* ----------------------------------------------------------- title frame -- */

const GLYPHS = {
    J: ['....X', '....X', '....X', '....X', 'X...X', 'X...X', '.XXX.'],
    G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXX.']
};
const ACCENTS = [PAL.accent, PAL.yellow, PAL.green, PAL.brown];

function buildTitleFrame() {
    const g = new THREE.Group();
    const px = TILE * 1.1;
    const letters = ['J', 'G'];
    const cols = letters.length * 6 - 1;
    const rows = 7;

    const cream = new THREE.MeshLambertMaterial({ color: PAL.paper });
    const cube = new THREE.BoxGeometry(px, px, px * 0.8);

    letters.forEach((ch, li) => {
        GLYPHS[ch].forEach((row, r) => {
            row.split('').forEach((c, k) => {
                if (c !== 'X') return;
                const accent = rand() < 0.12;
                const m = new THREE.Mesh(cube, accent
                    ? new THREE.MeshLambertMaterial({ color: ACCENTS[Math.floor(rand() * ACCENTS.length)] })
                    : cream);
                m.position.set((li * 6 + k - (cols - 1) / 2) * px, ((rows - 1) / 2 - r) * px, 0);
                g.add(m);
            });
        });
    });

    const w = (cols + 3) * px, h = (rows + 3) * px, bar = px * 0.9, d = px * 1.5;
    const frameMat = new THREE.MeshLambertMaterial({ color: PAL.stoneD });
    const backMat = new THREE.MeshLambertMaterial({ color: PAL.stone });
    [[0, h / 2, w + bar * 2, bar], [0, -h / 2, w + bar * 2, bar],
     [-w / 2 - bar / 2, 0, bar, h], [w / 2 + bar / 2, 0, bar, h]].forEach(([x, y, bw, bh]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, d), frameMat);
        m.position.set(x, y, 0);
        g.add(m);
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, px * 0.3), backMat);
    back.position.z = -px * 0.6;
    g.add(back);

    // Beside the first section, not over it: at this zoom the section already
    // fills the screen vertically, so the frame sits to its side.
    const anchor = TOUR_STOPS[0];
    const ax = anchor ? at(anchor.gx) : 0;
    const az = anchor ? at(anchor.gz) : 0;
    g.scale.setScalar(0.5);
    g.position.set(ax + TILE * 9, FRAME_Y, az + TILE * 33);
    scene.add(g);
    return g;
}

function buildConfetti() {
    const geo = new THREE.BoxGeometry(TILE * 0.7, TILE * 0.7, TILE * 0.7);
    for (let i = 0; i < 70; i++) {
        const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
            color: ACCENTS[Math.floor(rand() * ACCENTS.length)]
        }));
        m.position.set((rand() - 0.5) * TILE * 130, FRAME_Y + (rand() - 0.5) * TILE * 60, (rand() - 0.5) * TILE * 130);
        scene.add(m);
    }
}

/* ---------------------------------------------------------------- traffic -- */

const traffic = [];

function buildTraffic() {
    if (!ROAD_LANES.length) return;
    const lane = TILE * 0.22;

    for (let n = 0; n < 14; n++) {   // ~1 per lane segment
        const car = makeModel(pick(CARS));
        if (!car) continue;

        // Cars are placed on lanes that were actually laid, so they cannot end
        // up driving over grass, water or the written sections.
        const road = ROAD_LANES[Math.floor(rand() * ROAD_LANES.length)];
        const dir = rand() < 0.5 ? 1 : -1;

        car.userData = {
            alongX: road.alongX,
            fixed: road.fixed + dir * lane,     // correct side of the road
            min: road.min,
            max: road.max,
            t: road.min + rand() * (road.max - road.min),
            speed: (3.2 + rand() * 2.6) * dir
        };
        car.rotation.y = road.alongX
            ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2)
            : (dir > 0 ? 0 : Math.PI);
        scene.add(car);
        traffic.push(car);
    }
}

function driveTraffic(dt) {
    traffic.forEach((car) => {
        const d = car.userData;
        d.t += d.speed * dt;
        // Wrap within the lane's own extent rather than the board's, so a car
        // never runs off the end of its road.
        if (d.t > d.max) d.t = d.min;
        if (d.t < d.min) d.t = d.max;
        if (d.alongX) car.position.set(d.t, 0, d.fixed);
        else car.position.set(d.fixed, 0, d.t);
    });
}

/* ---------------------------------------------------------------- enter --- */

const introEl = document.getElementById('intro');
const railEl = document.getElementById('rail');

let tween = null;   // { t, dur, from, to }

function enterBoard(instant) {
    if (entered) return;
    entered = true;
    document.body.classList.remove('is-intro');
    document.body.classList.add('is-entered');

    if (instant) {
        if (PATH) { u = STOPS[0]; POSE_BOARD.target.copy(PATH.getPoint(u)); }
        camDir.copy(POSE_BOARD.dir);
        target.copy(POSE_BOARD.target);
        zoom = POSE_BOARD.zoom;
        resize();
        placeCamera();
        return;
    }
    if (PATH) { u = STOPS[0]; POSE_BOARD.target.copy(PATH.getPoint(u)); }
    tween = {
        t: 0,
        dur: 2.0,
        from: { dir: camDir.clone(), target: target.clone(), zoom },
        to: POSE_BOARD
    };
}

/* Ease so the camera swings away smoothly and settles rather than snapping. */
function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

function stepTween(dt) {
    if (!tween) return;
    tween.t = Math.min(1, tween.t + dt / tween.dur);
    const k = easeInOut(tween.t);

    camDir.copy(tween.from.dir).lerp(tween.to.dir, k).normalize();
    target.copy(tween.from.target).lerp(tween.to.target, k);
    zoom = tween.from.zoom + (tween.to.zoom - tween.from.zoom) * k;
    resize();
    placeCamera();
    if (tween.t >= 1) tween = null;
}

document.getElementById('enter').addEventListener('click', () => enterBoard(false));
document.getElementById('nav-board').addEventListener('click', (e) => {
    e.preventDefault();
    if (!entered) enterBoard(false);
});

/* ------------------------------------------------------------- interaction -- */

let dragging = false, moved = 0, lastX = 0, lastY = 0;

/* Dragging moves you along the path. The old version hand-rolled the screen
 * -> world mapping with hard-coded trig and got it wrong; this projects the
 * path itself to screen space and matches the pointer against it, so the world
 * genuinely follows the cursor. */

let snapping = false;

/* How far along the path one pixel of drag is worth, at the current point.
 * Returns a screen-space vector (px per unit of u) so the drag can be matched
 * against the direction the path actually runs on screen. */
function pathScreenVector(atU) {
    const eps = 0.004;
    const a = PATH.getPoint(Math.max(0, Math.min(1, atU)));
    const b = PATH.getPoint(Math.max(0, Math.min(1, atU + eps)));
    const w = window.innerWidth / 2, h = window.innerHeight / 2;
    const pa = a.clone().project(camera);
    const pb = b.clone().project(camera);
    return {
        x: (pb.x - pa.x) * w / eps,
        y: -(pb.y - pa.y) * h / eps
    };
}

function dragAlongPath(dx, dy) {
    if (freeCamera) { panFree(dx, dy); return; }
    if (!PATH) return;
    const v = pathScreenVector(u);
    const len2 = v.x * v.x + v.y * v.y;
    if (len2 < 1e-6) return;
    // Negative: dragging right should pull the world right, moving the camera
    // backwards along the path.
    u = Math.max(0, Math.min(1, u - (dx * v.x + dy * v.y) / len2));
    applyPath();
}

/* Free pan, derived from the camera basis rather than assumed trigonometry. */
function panFree(dx, dy) {
    const k = (zoom * 2) / window.innerHeight;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    right.y = 0; up.y = 0;
    right.normalize(); up.normalize();
    target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    placeCamera();
}

function nearestStop() {
    let best = STOPS[0], bestD = Infinity;
    STOPS.forEach((sv) => {
        const d = Math.abs(sv - u);
        if (d < bestD) { bestD = d; best = sv; }
    });
    return best;
}

canvas.addEventListener('pointerdown', (e) => {
    if (!entered || tween) return;          // the intro is a fixed pose
    dragging = true; moved = 0;
    snapping = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
    hideHint();
});

canvas.addEventListener('pointermove', (e) => {
    if (!entered) return;
    if (!dragging) { canvas.classList.toggle('is-over', !!pickAt(e)); return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    dragAlongPath(dx, dy);
});

function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('is-dragging');
    if (e && e.type === 'pointerup' && moved < 6) {
        const hit = pickAt(e);
        if (hit) { openContent(hit.object.userData.content); return; }
    }
    snapping = true;                        // settle onto the nearest stop
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* Scrolling walks the same path. Hold ctrl/cmd to zoom instead. */
canvas.addEventListener('wheel', (e) => {
    if (!entered || tween) return;
    e.preventDefault();
    hideHint();
    if (freeCamera || e.ctrlKey || e.metaKey) {
        zoom = Math.min(TILE * 30, Math.max(TILE * 6, zoom * (1 + Math.sign(e.deltaY) * 0.12)));
        resize();
        return;
    }
    snapping = false;
    u = Math.max(0, Math.min(1, u + e.deltaY * 0.0009));
    applyPath();
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { snapping = true; }, 260);
}, { passive: false });

let wheelIdle = null;

/* Jump straight to a stop — used by the rail. */
function goToStop(i) {
    if (!STOPS.length) return;
    u = STOPS[Math.max(0, Math.min(STOPS.length - 1, i))];
    snapping = false;
    applyPath();
}
window.jgGoToStop = goToStop;

/* The games used to live in landmark buildings. With those dropped, the rail
 * opens them instead. */
document.querySelectorAll('[data-game]').forEach((el) => {
    el.addEventListener('click', (e) => {
        e.preventDefault();
        openContent({ title: el.textContent, game: el.dataset.game });
    });
});


const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickAt(e) {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(clickTargets, false)[0];
}

/* ---------------------------------------------------------------- window --- */

const win = document.getElementById('window');
const scrim = document.getElementById('scrim');
const winTitle = document.getElementById('window-title');
const winBody = document.getElementById('window-body');
let cleanup = null;

function openContent(c) {
    if (!c) return;
    closeWindow();
    winTitle.textContent = c.title;
    win.hidden = false;
    scrim.hidden = false;

    if (c.game === 'pong' && typeof mountPong === 'function') { cleanup = mountPong(winBody); return; }
    if (c.game === 'paint' && typeof mountPaint === 'function') { cleanup = mountPaint(winBody); return; }

    const links = (c.links || []).map((l) => {
        const ext = /^https?:/.test(l.href);
        return '<li><a href="' + l.href + '"' +
            (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            l.label + ' →</a></li>';
    }).join('');
    winBody.innerHTML = '<p>' + c.body + '</p>' +
        (links ? '<ul class="dt-links">' + links + '</ul>' : '');
}

function closeWindow() {
    if (cleanup) { cleanup(); cleanup = null; }
    winBody.innerHTML = '';
    win.hidden = true;
    scrim.hidden = true;
}

document.getElementById('window-close').addEventListener('click', closeWindow);
scrim.addEventListener('click', closeWindow);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !win.hidden) closeWindow();
});

/* ------------------------------------------------------------------ hint --- */

const hintEl = document.getElementById('hint');
let hintHidden = false;
function hideHint() {
    if (hintHidden) return;
    hintHidden = true;
    hintEl.classList.add('is-hidden');
}
setTimeout(hideHint, 8000);

/* -------------------------------------------------------------------- go --- */

window.addEventListener('resize', resize);

const clock = new THREE.Clock();
function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    stepTween(dt);
    driveTraffic(dt);

    // Content markers bob, so the clickable lots announce themselves.
    const t = clock.getElapsedTime();
    markers.forEach((m, i) => {
        // Absolute, not accumulated — adding each frame would drift them away.
        m.mesh.position.y = m.baseY + Math.sin(t * 2 + i) * 0.18;
        m.mesh.rotation.y = t * 0.8;
    });

    // Settle: once you let go, the view eases onto the nearest stop so it
    // always comes to rest framing a piece of written content.
    if (entered && snapping && !dragging && !tween && PATH && !freeCamera) {
        const goal = nearestStop();
        const d = goal - u;
        if (Math.abs(d) > 0.0004) {
            u += d * (1 - Math.pow(0.0025, dt));   // frame-rate independent
            applyPath();
        } else {
            u = goal;
            applyPath();
            snapping = false;
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
}

resize();
Promise.all([loadWorld(), ...NEEDED.map(loadOne)])
    .then(() => {
        if (!Object.keys(parts).length) { fail('Could not load the city models.'); return; }
        loadingText.textContent = 'Building the board…';
        build();
        loadingEl.classList.add('is-done');
        frame();
        // Links from elsewhere on the site arrive as index.html#board and
        // should skip the intro rather than replay it.
        if (location.hash.includes('board')) enterBoard(true);

        // #edit loads the placement editor. It is not linked anywhere and can
        // only download a file — it never writes to the server.
        if (location.hash.includes('edit')) {
            enterBoard(true);
            import('./editor.js')
                .then((m) => m.initEditor({
                    THREE, scene, camera, canvas, parts,
                    get TILE() { return TILE; },
                    PLOT,
                    get scenery() { return scenery; },
                    setScenery(next) { scenery = next; renderScenery(); },
                    renderScenery,
                    PALETTE,
                    setFree(on) { freeCamera = on; },
                    panTo(x, z) { target.set(x, 0, z); placeCamera(); },
                    setZoom(z) { zoom = z; resize(); }
                }))
                .catch((err) => fail('Editor failed to load: ' + err.message, err));
        }
    })
    .catch((err) => fail('Could not build the board: ' + err.message, err));
