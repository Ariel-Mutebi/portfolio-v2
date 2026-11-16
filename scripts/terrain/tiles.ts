import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp, { type OutputInfo } from 'sharp';
import { TILE, TILE_URL, CACHE_DIR, ZOOM, CENTER, WIDTH, HEIGHT } from './config.ts';
import { range, toWorldPixel } from './geo.ts';
import type { Frame } from './types.ts';

export const computeFrame = (): Frame => {
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

const decodeElevation = (r: number, g: number, b: number) => r * 256 + g + b / 256 - 32768;

const decodeTile = ({ data, info }: { data: Buffer; info: OutputInfo }) =>
  Float32Array.from({ length: info.width * info.height }, (_, pixel) => {
    const offset = pixel * info.channels;
    return decodeElevation(data[offset], data[offset + 1], data[offset + 2]);
  });

const downloadTile = async (x: number, y: number): Promise<Buffer> => {
  const response = await fetch(`${TILE_URL}/${ZOOM}/${x}/${y}.png`);
  if (!response.ok) {
    throw new Error(`Tile ${ZOOM}/${x}/${y} failed with status ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

const getTileBytes = async (x: number, y: number): Promise<Buffer> => {
  const file = `${CACHE_DIR}/${ZOOM}-${x}-${y}.png`;
  const cached = await readFile(file).catch(() => null);
  if (cached) return cached;
  const bytes = await downloadTile(x, y);
  await writeFile(file, bytes);
  return bytes;
};

const loadTile = async (x: number, y: number): Promise<Float32Array> => {
  const bytes = await getTileBytes(x, y);
  const decoded = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
  return decodeTile(decoded);
};

const loadTileGrid = (frame: Frame): Promise<Float32Array[][]> =>
  Promise.all(
    range(frame.firstRow, frame.lastRow).map((y) =>
      Promise.all(range(frame.firstCol, frame.lastCol).map((x) => loadTile(x, y))),
    ),
  );

const sampleElevation = (tileGrid: Float32Array[][], frame: Frame, col: number, row: number) => {
  const worldX = frame.left + col;
  const worldY = frame.top + row;
  const tile =
    tileGrid[Math.floor(worldY / TILE) - frame.firstRow][
    Math.floor(worldX / TILE) - frame.firstCol
    ];
  return tile[(worldY % TILE) * TILE + (worldX % TILE)];
};

export const stitch = (tileGrid: Float32Array[][], frame: Frame) =>
  Float32Array.from({ length: WIDTH * HEIGHT }, (_, i) =>
    sampleElevation(tileGrid, frame, i % WIDTH, Math.floor(i / WIDTH)),
  );

export async function loadElevations(frame: Frame): Promise<Float32Array> {
  await mkdir(CACHE_DIR, { recursive: true });
  const tileGrid = await loadTileGrid(frame);
  console.log(`Loaded ${tileGrid.flat().length} tiles`);
  return stitch(tileGrid, frame);
}
