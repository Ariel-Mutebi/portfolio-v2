import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp, { type OutputInfo } from 'sharp';
import type { LonLat, TerrainMetadata } from '../src/components/hero/types.ts';

/** Where the frame sits on the world map, and which tiles overlap it. */
type Frame = {
  left: number;
  top: number;
  firstCol: number;
  lastCol: number;
  firstRow: number;
  lastRow: number;
};

/** The lowest and highest elevation in meters. */
type Extent = { min: number; max: number };

/**
 * Settings. CENTER is the middle of the frame in degrees. ZOOM decides the detail level
 * (each step up halves the meters per pixel). WIDTH and HEIGHT are the output size in
 * pixels. TILE is the size of one downloaded tile, which is fixed at 256 by the dataset.
 */
const CENTER: LonLat = { lat: 0.0, lon: 29.9 };
const ZOOM = 10;
const WIDTH = 2048;
const HEIGHT = 1152;
const TILE = 256;
const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const CACHE_DIR = '.cache/terrain';
const HEIGHTMAP_PATH = 'src/assets/terrain/heightmap.bin';
const WATERMASK_PATH = 'src/assets/terrain/watermask.bin';
const META_PATH = 'src/data/terrain.json';

/**
 * Water detection settings. A pixel counts as flat when every pixel within FLAT_RADIUS
 * of it differs in elevation by less than FLAT_TOLERANCE meters. The flat mask is then
 * blurred SMOOTHING_PASSES times with a box of SMOOTHING_RADIUS pixels, which removes
 * specks and gives the shader a soft edge to threshold at 0.5.
 */
const FLAT_RADIUS = 1;
const FLAT_TOLERANCE = 0.03;
const SMOOTHING_RADIUS = 3;
const SMOOTHING_PASSES = 3;

/** Resolves to true if the file exists, false otherwise. Used to skip re-baking. */
const exists = (path: string): Promise<boolean> =>
  access(path).then(() => true, () => false);

/** Lists the whole numbers from start to end inclusive: range(3, 5) gives [3, 4, 5]. */
const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** Keeps a value between low and high: clamp(12, 0, 10) gives 10. */
const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * Converts a longitude and latitude into a pixel position on the world map at a given
 * zoom, measured from the top-left corner. This is the Web Mercator projection, the
 * same one the tile grid is built on. At zoom 11 the world map is 524,288 pixels wide.
 */
const toWorldPixel = (lon: number, lat: number, zoom: number) => {
  const worldSize = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  };
};

/** The reverse of toWorldPixel: a world map pixel position back to a longitude and latitude. */
const toLonLat = (x: number, y: number, zoom: number): LonLat => {
  const worldSize = TILE * 2 ** zoom;
  const mercatorY = Math.PI - (2 * Math.PI * y) / worldSize;
  return {
    lon: (x / worldSize) * 360 - 180,
    lat: (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI,
  };
};

/** Real-world distance one pixel covers. It shrinks away from the equator, so latitude matters. */
const metersPerPixelAt = (lat: number, zoom: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

/**
 * Terrarium stores an elevation across a pixel's three color channels, like the digits of
 * a number. Red and green are the high and low digits, and blue holds fractions of a meter.
 * Subtracting 32768 allows negative elevations (below sea level).
 */
const decodeElevation = (r: number, g: number, b: number) => r * 256 + g + b / 256 - 32768;

/**
 * Works out where our frame sits on the world map and which tiles overlap it. The result
 * is a plain object: left and top are the frame's top-left corner in world pixels, and
 * the first/last column and row are the range of tiles we need to download.
 */
const computeFrame = (): Frame => {
  const center = toWorldPixel(CENTER.lon, CENTER.lat, ZOOM);
  const left = Math.floor(center.x - WIDTH / 2);
  const top = Math.floor(center.y - HEIGHT / 2);
  return {
    left,
    top,
    firstCol: Math.floor(left / TILE),
    lastCol: Math.floor((left + WIDTH - 1) / TILE),
    firstRow: Math.floor(top / TILE),
    lastRow: Math.floor((top + HEIGHT - 1) / TILE),
  };
};

/**
 * Turns one decoded PNG tile into a flat list of elevations in meters, one number per
 * pixel, row by row. Float32Array.from with a length and a function builds the list by
 * calling the function once per index, with no loop and no mutation on our side.
 */
const decodeTile = ({ data, info }: { data: Buffer; info: OutputInfo }) =>
  Float32Array.from({ length: info.width * info.height }, (_, pixel) => {
    const offset = pixel * info.channels;
    return decodeElevation(data[offset], data[offset + 1], data[offset + 2]);
  });

/** Downloads one tile's PNG file and returns its raw bytes. Throws if the server refuses. */
const downloadTile = async (x: number, y: number): Promise<Buffer> => {
  const response = await fetch(`${TILE_URL}/${ZOOM}/${x}/${y}.png`);
  if (!response.ok) {
    throw new Error(`Tile ${ZOOM}/${x}/${y} failed with status ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

/**
 * Returns a tile's PNG bytes, from the local cache if we have them, otherwise by
 * downloading and then saving a copy. This is why reruns are instant.
 */
const getTileBytes = async (x: number, y: number): Promise<Buffer> => {
  const file = `${CACHE_DIR}/${ZOOM}-${x}-${y}.png`;
  const cached = await readFile(file).catch(() => null);
  if (cached) return cached;
  const bytes = await downloadTile(x, y);
  await writeFile(file, bytes);
  return bytes;
};

/** Gets one tile all the way to a list of 65,536 elevations in meters. */
const loadTile = async (x: number, y: number): Promise<Float32Array> => {
  const bytes = await getTileBytes(x, y);
  const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  return decodeTile(decoded);
};

/**
 * Loads every tile the frame needs, in parallel. The result is a grid (an array of rows,
 * each row an array of tiles) laid out the way the tiles sit on the map, so
 * tileGrid[0][0] is the north-west tile.
 */
const loadTileGrid = (frame: Frame): Promise<Float32Array[][]> =>
  Promise.all(
    range(frame.firstRow, frame.lastRow).map((y) =>
      Promise.all(range(frame.firstCol, frame.lastCol).map((x) => loadTile(x, y))),
    ),
  );

/**
 * Finds the elevation at one output pixel. The pixel's world position is the frame's
 * corner plus the pixel's offset. Dividing by the tile size says which tile it falls in,
 * and the remainder says which pixel inside that tile.
 */
const sampleElevation = (tileGrid: Float32Array[][], frame: Frame, col: number, row: number) => {
  const worldX = frame.left + col;
  const worldY = frame.top + row;
  const tile =
    tileGrid[Math.floor(worldY / TILE) - frame.firstRow][
    Math.floor(worldX / TILE) - frame.firstCol
    ];
  return tile[(worldY % TILE) * TILE + (worldX % TILE)];
};

/**
 * Merges the tile grid into one continuous elevation list for our frame. Each of the
 * WIDTH * HEIGHT output pixels asks sampleElevation where its value lives. The index i
 * converts to a column (i % WIDTH) and a row (floor(i / WIDTH)). Row 0 is the north edge.
 */
const stitch = (tileGrid: Float32Array[][], frame: Frame) =>
  Float32Array.from({ length: WIDTH * HEIGHT }, (_, i) =>
    sampleElevation(tileGrid, frame, i % WIDTH, Math.floor(i / WIDTH)),
  );

/**
 * Finds the lowest and highest elevation. We use reduce instead of Math.min(...values),
 * because spreading 2.4 million numbers into a function call overflows the call stack.
 */
const findExtent = (values: Float32Array): Extent => ({
  min: values.reduce((lowest, value) => Math.min(lowest, value), Infinity),
  max: values.reduce((highest, value) => Math.max(highest, value), -Infinity),
});

/**
 * Finds where the highest pixel sits, as a longitude and latitude.
 * For this frame it should land near Margherita Peak, 0.38 N, 29.87 E.
 */
const locateHighestPoint = (elevations: Float32Array, frame: Frame, extent: Extent): LonLat => {
  const index = elevations.indexOf(extent.max);
  return toLonLat(frame.left + (index % WIDTH), frame.top + Math.floor(index / WIDTH), ZOOM);
};

/**
 * Combines each pixel with its neighbors along one axis, within `radius` pixels either
 * side, using `pick` (Math.min or Math.max) and starting from `initial`. Coordinates are
 * clamped at the frame edges, so border pixels behave as if the frame continued
 * unchanged beyond them.
 */
const windowFilter = (
  values: Float32Array,
  radius: number,
  axis: 'x' | 'y',
  pick: (a: number, b: number) => number,
  initial: number,
) => {
  const offsets = range(-radius, radius);
  return Float32Array.from(values, (_, i) => {
    const col = i % WIDTH;
    const row = Math.floor(i / WIDTH);
    return offsets.reduce((best, offset) => {
      const c = axis === 'x' ? clamp(col + offset, 0, WIDTH - 1) : col;
      const r = axis === 'y' ? clamp(row + offset, 0, HEIGHT - 1) : row;
      return pick(best, values[r * WIDTH + c]);
    }, initial);
  });
};

/**
 * The lowest value in a square around every pixel. A square window can be done as two
 * cheap passes, one along x and one along y, instead of one expensive two-dimensional pass.
 */
const minFilter = (values: Float32Array, radius: number) =>
  windowFilter(
    windowFilter(values, radius, 'x', Math.min, Infinity),
    radius,
    'y',
    Math.min,
    Infinity,
  );

/** The highest value in a square around every pixel. The counterpart of minFilter. */
const maxFilter = (values: Float32Array, radius: number) =>
  windowFilter(
    windowFilter(values, radius, 'x', Math.max, -Infinity),
    radius,
    'y',
    Math.max,
    -Infinity,
  );

/** Averages every pixel with its neighbors in a square, as two passes (x then y). */
const boxBlur = (values: Float32Array, radius: number) => {
  const size = 2 * radius + 1;
  const add = (a: number, b: number) => a + b;
  const averaged = (axis: 'x' | 'y', input: Float32Array) =>
    windowFilter(input, radius, axis, add, 0).map((sum) => sum / size);
  return averaged('y', averaged('x', values));
};

/**
 * Returns a soft water field from 0 (land) to 1 (water). Lakes in the elevation data are
 * flattened to a single height, so a pixel is flat when the spread of elevations around
 * it is tiny. Blurring the flat mask rounds its corners and erases specks, and the shader
 * later draws the shoreline where the field crosses 0.5.
 */
const detectWater = (elevations: Float32Array) => {
  const highest = maxFilter(elevations, FLAT_RADIUS);
  const lowest = minFilter(elevations, FLAT_RADIUS);
  const flat = Float32Array.from(elevations, (_, i) =>
    highest[i] - lowest[i] < FLAT_TOLERANCE ? 1 : 0,
  );
  return range(1, SMOOTHING_PASSES).reduce((soft) => boxBlur(soft, SMOOTHING_RADIUS), flat);
};

/** Converts the soft water field (0 to 1) into bytes (0 to 255), the format we store on disk. */
const toWatermask = (water: Float32Array) =>
  Uint8Array.from(water, (value) => Math.round(value * 255));

/** The fraction of the frame that is clearly water (field above 0.5), from 0 to 1. */
const waterShareOf = (water: Float32Array) =>
  water.filter((value) => value > 0.5).length / water.length;

/**
 * Squeezes each elevation into a whole number from 0 to 65535, so it fits in two bytes.
 * 0 means the lowest point in the frame, and 65535 the highest. The shader undoes this
 * later with mix(minElevation, maxElevation, storedValue).
 */
const quantize = (elevations: Float32Array, { min, max }: Extent) =>
  Uint16Array.from(elevations, (meters) => Math.round(((meters - min) / (max - min)) * 65535));

/**
 * Collects everything the shader and the page need to interpret the heightmap: its size,
 * how to undo the squeeze, the real-world scale per pixel, and the latitude and longitude
 * of the frame's edges (useful for coordinate labels on the map later).
 */
const buildMetadata = (frame: Frame, { min, max }: Extent): TerrainMetadata => {
  const northWest = toLonLat(frame.left, frame.top, ZOOM);
  const southEast = toLonLat(frame.left + WIDTH, frame.top + HEIGHT, ZOOM);
  return {
    width: WIDTH,
    height: HEIGHT,
    minElevation: min,
    maxElevation: max,
    metersPerPixel: metersPerPixelAt(CENTER.lat, ZOOM),
    zoom: ZOOM,
    center: CENTER,
    bounds: {
      west: northWest.lon,
      east: southEast.lon,
      north: northWest.lat,
      south: southEast.lat,
    },
  };
};

/** Writes the heightmap, the water mask, and the metadata to disk, creating folders if needed. */
const writeOutputs = async (
  quantized: Uint16Array,
  watermask: Uint8Array,
  metadata: TerrainMetadata,
) => {
  await mkdir('src/assets/terrain', { recursive: true });
  await mkdir('src/data', { recursive: true });
  await writeFile(HEIGHTMAP_PATH, Buffer.from(quantized.buffer));
  await writeFile(WATERMASK_PATH, watermask);
  await writeFile(META_PATH, JSON.stringify(metadata, null, 2));
};

/**
 * The whole pipeline in order: skip if already baked, compute the frame, load the tiles,
 * stitch them, measure the extent, detect water, then quantize and write the results.
 */
const main = async () => {
  const force = process.argv.includes('--force');
  const alreadyBaked = (
    await Promise.all([exists(HEIGHTMAP_PATH), exists(WATERMASK_PATH), exists(META_PATH)])
  ).every(Boolean);
  if (alreadyBaked && !force) {
    console.log('Terrain already baked. Use --force to rebuild.');
    return;
  }

  await mkdir(CACHE_DIR, { recursive: true });
  const frame = computeFrame();
  const tileGrid = await loadTileGrid(frame);
  console.log(`Loaded ${tileGrid.flat().length} tiles`);

  const elevations = stitch(tileGrid, frame);
  const extent = findExtent(elevations);
  const highestPoint = locateHighestPoint(elevations, frame, extent);
  console.log(
    `Elevation ${extent.min.toFixed(0)} to ${extent.max.toFixed(0)} m, ` +
    `${metersPerPixelAt(CENTER.lat, ZOOM).toFixed(1)} m per pixel`,
  );
  console.log(`Highest point at ${highestPoint.lat.toFixed(3)} N, ${highestPoint.lon.toFixed(3)} E`);

  const water = detectWater(elevations);
  console.log(`Water covers ${(waterShareOf(water) * 100).toFixed(1)}% of the frame`);

  await writeOutputs(quantize(elevations, extent), toWatermask(water), buildMetadata(frame, extent));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
