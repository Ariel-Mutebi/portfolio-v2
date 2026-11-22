import {
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  RedFormat,
  RGBAFormat,
  RepeatWrapping,
  UnsignedByteType,
} from 'three';
import type { TerrainMetadata } from './types.ts';

export interface TextureUrls {
  heightmapUrl: string;
  watermaskUrl: string;
  normalmapUrl: string;
  shadowmapUrl: string;
  noisemapUrl: string;
}

const halfFloatLookup = Uint16Array.from({ length: 65536 }, (_, stored) =>
  DataUtils.toHalfFloat(stored / 65535),
);

const fetchBuffer = async (url: string) => (await fetch(url)).arrayBuffer();

function makeTexture(
  data: Uint8Array | Uint16Array,
  width: number,
  height: number,
  format: typeof RedFormat | typeof RGBAFormat,
  type: typeof UnsignedByteType | typeof HalfFloatType,
) {
  const texture = new DataTexture(data, width, height, format, type);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

async function loadHeight(url: string, { width, height }: TerrainMetadata) {
  const stored = new Uint16Array(await fetchBuffer(url));
  const halves = Uint16Array.from(stored, (v) => halfFloatLookup[v]);
  const texture = makeTexture(halves, width, height, RedFormat, HalfFloatType);
  texture.generateMipmaps = true; // the shader's biased lookup needs these
  texture.minFilter = LinearMipmapLinearFilter;
  return texture;
}

async function loadBytes(
  url: string,
  { width, height }: TerrainMetadata,
  format: typeof RedFormat | typeof RGBAFormat,
) {
  return makeTexture(new Uint8Array(await fetchBuffer(url)), width, height, format, UnsignedByteType);
}

async function loadNoise(url: string) {
  const data = new Uint8Array(await fetchBuffer(url));
  const size = Math.sqrt(data.length / 4);
  const texture = makeTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

export async function loadTerrainTextures(urls: TextureUrls, terrain: TerrainMetadata) {
  const [height, water, normal, shadow, noise] = await Promise.all([
    loadHeight(urls.heightmapUrl, terrain),
    loadBytes(urls.watermaskUrl, terrain, RedFormat),
    loadBytes(urls.normalmapUrl, terrain, RGBAFormat),
    loadBytes(urls.shadowmapUrl, terrain, RedFormat),
    loadNoise(urls.noisemapUrl),
  ]);
  return { height, water, normal, shadow, noise };
}

export type TerrainTextures = Awaited<ReturnType<typeof loadTerrainTextures>>;
