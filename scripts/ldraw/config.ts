import path from 'node:path';
import os from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import type { LDrawConfig } from './types.ts';

const THREE_RELEASE = 'r187';

export const createConfig = async (
  brick: string
): Promise<LDrawConfig> => ({
  brick,

  mirror: 'https://erik-larsen.github.io/ldraw',

  tempDir: await mkdtemp(
    path.join(os.tmpdir(), 'ldraw-pack-')
  ),

  outputDir: path.resolve('src/assets'),

  threeRelease: THREE_RELEASE
});
