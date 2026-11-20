import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { LDrawConfig } from './types.ts';
import { createLDrawClient } from './client.ts';
import { createDependencyResolver } from './resolver.ts';
import { createPacker } from './packer.ts';

export const createPipeline = (config: LDrawConfig) => {
  const client = createLDrawClient(config);
  const resolver = createDependencyResolver(config);
  const packer = createPacker(config);

  const build = async () => {
    console.log(`\nBuilding LEGO brick: ${config.brick}\n`);

    // 1. Download colour definitions.
    await client.downloadRequired('LDConfig.ldr');

    // 2. Download the root brick.
    const brickContent = await client.downloadRequired(
      config.brick
    );

    // 3. Store the root brick in models/.
    const modelDirectory = path.join(
      config.tempDir,
      'models'
    );

    await mkdir(modelDirectory, {
      recursive: true
    });

    await writeFile(
      path.join(modelDirectory, config.brick),
      brickContent,
      'utf8'
    );

    // 4. Resolve all dependencies.
    const dependencies = await resolver.resolve(
      config.brick
    );

    console.log(
      `\nResolved ${dependencies.count} LDraw files.`
    );

    // 5. Pack using the official Three.js utility.
    const output = await packer.pack(config.brick);

    console.log('\nBuild complete!');
    console.log(`Output: ${output}\n`);

    return output;
  };

  return { build };
};
