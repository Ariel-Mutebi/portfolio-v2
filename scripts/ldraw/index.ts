import { rm } from 'node:fs/promises';
import { createConfig } from './config.ts';
import { createPipeline } from './pipeline.ts';

const main = async () => {
  const config = await createConfig('3031.dat');

  try {
    const pipeline = createPipeline(config);
    await pipeline.build();
  } finally {
    await rm(config.tempDir, {
      recursive: true,
      force: true
    });
  }
};

main().catch((error: unknown) => {
  console.error('\nLEGO build failed:', error);
  process.exitCode = 1;
});
