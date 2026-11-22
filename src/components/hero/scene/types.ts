/** A position on the globe, in degrees. */
export type LonLat = { lon: number; lat: number };

/**
 * The contents of terrain.json. The bake script writes it, and the hero code reads it,
 * so both import this one definition and the compiler catches any mismatch.
 */
export type TerrainMetadata = {
  width: number;
  height: number;
  minElevation: number;
  maxElevation: number;
  metersPerPixel: number;
  zoom: number;
  center: LonLat;
  bounds: { west: number; east: number; north: number; south: number };
};
