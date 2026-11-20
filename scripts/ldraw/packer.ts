import path from 'node:path';
import { writeFile, access, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import type { LDrawConfig } from './types.ts';

const PACKER_URL = (
  release: string
) =>
  `https://raw.githubusercontent.com/mrdoob/three.js/${release}/utils/packLDrawModel.mjs`;

const runProcess = (
  command: string,
  args: string[],
  cwd: string
): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit'
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Packer exited with code ${code}`)
        );
      }
    });
  });

export const createPacker = (config: LDrawConfig) => {
  const pack = async (brick: string): Promise<string> => {
    const packerUrl = PACKER_URL(config.threeRelease);

    const response = await fetch(packerUrl);

    if (!response.ok) {
      throw new Error(
        `Could not download Three.js packer: ${response.status}`
      );
    }

    const packerPath = path.join(
      config.tempDir,
      'packLDrawModel.mjs'
    );

    await writeFile(
      packerPath,
      await response.text(),
      'utf8'
    );

    const inputPath = `models/${brick}`;

    await runProcess(
      process.execPath,
      [packerPath, inputPath],
      config.tempDir
    );

    // This is the exact output naming convention
    // used by Three.js's official utility.
    const packedPath = path.join(
      config.tempDir,
      `${inputPath}_Packed.mpd`
    );

    await access(packedPath);

    const outputPath = path.join(
      config.outputDir,
      `${path.parse(brick).name}.mpd`
    );

    const { mkdir } = await import('node:fs/promises');

    await mkdir(config.outputDir, {
      recursive: true
    });

    await copyFile(packedPath, outputPath);

    return outputPath;
  };

  return { pack };
};
