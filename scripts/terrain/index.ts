import { access } from 'node:fs/promises';
import {
  CENTER,
  ZOOM,
  EXAGGERATION,
  HEIGHTMAP_PATH,
  WATERMASK_PATH,
  NORMALMAP_PATH,
  SHADOWMAP_PATH,
  META_PATH,
  NOISE_TEXTURE_PATH,
} from './config.ts';
import { metersPerPixelAt } from './geo.ts';
import { computeFrame, loadElevations } from './tiles.ts';
import { findExtent, locateHighestPoint, detectWater, waterShareOf, quantize, toWatermask } from './analysis.ts';
import { computeNormalMap, computeShadowMap, buildMetadata, writeOutputs, computeNoiseTexture } from './bake.ts';

const exists = (path: string): Promise<boolean> =>
  access(path).then(() => true, () => false);

const main = async () => {
  const force = process.argv.includes('--force');
  const outputs = [HEIGHTMAP_PATH, WATERMASK_PATH, NORMALMAP_PATH, SHADOWMAP_PATH, NOISE_TEXTURE_PATH, META_PATH];
  const allExist = (await Promise.all(outputs.map(exists))).every(Boolean);

  if (allExist && !force) {
    console.log('Terrain already baked. Use --force to rebuild.');
    return;
  }

  const frame = computeFrame();
  const elevations = await loadElevations(frame);

  const extent = findExtent(elevations);
  const highestPoint = locateHighestPoint(elevations, frame, extent);
  console.log(
    `Elevation ${extent.min.toFixed(0)} to ${extent.max.toFixed(0)} m, ` +
    `${metersPerPixelAt(CENTER.lat, ZOOM).toFixed(1)} m per pixel`,
  );
  console.log(`Highest point at ${highestPoint.lat.toFixed(3)} N, ${highestPoint.lon.toFixed(3)} E`);

  const water = detectWater(elevations);
  console.log(`Water covers ${(waterShareOf(water) * 100).toFixed(1)}% of the frame`);

  console.log('Baking normal map...');
  const normalmap = computeNormalMap(elevations);

  console.log('Baking shadow map...');
  const shadowmap = computeShadowMap(elevations, EXAGGERATION);

  console.log('Baking noise texture...');
  const noisemap = computeNoiseTexture(1024);

  await writeOutputs(
    quantize(elevations, extent),
    toWatermask(water),
    normalmap,
    shadowmap,
    noisemap,
    buildMetadata(frame, extent),
  );

  console.log('Done.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
