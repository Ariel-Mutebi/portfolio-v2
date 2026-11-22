import { DoubleSide, ShaderMaterial, Vector2 } from 'three';
import type { TerrainMetadata } from './types.ts';
import type { TerrainTextures } from './textures.ts';
import vertexShader from './shaders/fullscreen.vert?raw';
import fragmentShader from './shaders/terrain.frag?raw';
import { threeColor } from '../../../lib/colors.ts';

export function createTerrainMaterial(textures: TerrainTextures, terrain: TerrainMetadata) {
  const uniforms = {
    uHeight: { value: textures.height },
    uNormalMap: { value: textures.normal },
    uShadowMap: { value: textures.shadow },
    uNoise: { value: textures.noise },
    uWater: { value: textures.water },
    uMinElevation: { value: terrain.minElevation },
    uMaxElevation: { value: terrain.maxElevation },
    uFieldColor: { value: threeColor('--color-pollen-50') },
    uMinorColor: { value: threeColor('--color-ebony-600') },
    uIndexColor: { value: threeColor('--color-ebony-950') },
    uWaterMapColor: { value: threeColor('--color-steel-400') },
    uTexel: { value: new Vector2(1 / terrain.width, 1 / terrain.height) },
    uMetersPerPixel: { value: terrain.metersPerPixel },
    uExaggeration: { value: 2.0 },
    uReal: { value: 1.0 }, // 1 = 3D, 0 = flat map
    uWaterColor: { value: threeColor('--color-steel-950') },
    uLowColor: { value: threeColor('--color-viridian-800') },
    uMidColor: { value: threeColor('--color-viridian-500') },
    uRockColor: { value: threeColor('--color-ebony-400') },
    uSnowColor: { value: threeColor('--color-ebony-50') },
    uSunColor: { value: threeColor('--color-pollen-100').multiplyScalar(0.9) },
    uAmbientColor: { value: threeColor('--color-steel-700').multiplyScalar(0.4) },
    uSkyColor: { value: threeColor('--color-steel-100') },
  };

  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: DoubleSide });
  return { material, uniforms };
}
