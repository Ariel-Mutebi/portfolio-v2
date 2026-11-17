import type { LonLat } from '../../src/components/hero/types.ts';

export const CENTER: LonLat = { lat: 0.0, lon: 29.9 };
export const ZOOM = 11;
export const WIDTH = 2048;
export const HEIGHT = 1152;
export const TILE = 256;
export const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
export const CACHE_DIR = '.cache/terrain';

export const HEIGHTMAP_PATH = 'src/assets/terrain/heightmap.bin';
export const WATERMASK_PATH = 'src/assets/terrain/watermask.bin';
export const NORMALMAP_PATH = 'src/assets/terrain/normalmap.bin';
export const SHADOWMAP_PATH = 'src/assets/terrain/shadowmap.bin';
export const NOISE_TEXTURE_PATH = 'src/assets/terrain/noise.bin';
export const META_PATH = 'src/data/terrain.json';

export const FLAT_RADIUS = 1;
export const FLAT_TOLERANCE = 0.001;
export const SMOOTHING_RADIUS = 3;
export const SMOOTHING_PASSES = 3;

/** Sun direction used for baking the shadow map. Must match the shader's lightDir. */
export const SUN_DIRECTION = { x: -0.6, y: 0.6, z: 0.8 };

/** Terrain exaggeration used for baking shadows. Must match uExaggeration in scene.ts. */
export const EXAGGERATION = 2.0;
