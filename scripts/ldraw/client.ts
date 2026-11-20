
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import type { LDrawConfig } from './types.ts';

const getCandidates = (file: string): string[] => {
  // Library configuration files live at the root.
  if (file.toLowerCase() === 'ldconfig.ldr') {
    return ['LDConfig.ldr'];
  }

  const normalized = file.toLowerCase();

  if (normalized.startsWith('48/')) {
    return [`p/${normalized}`];
  }

  if (normalized.startsWith('s/')) {
    return [`parts/${normalized}`];
  }

  return [
    `parts/${normalized}`,
    `p/${normalized}`,
    `models/${normalized}`,
    normalized
  ];
};

const fetchText = async (url: string): Promise<string | null> => {
  const response = await fetch(url);

  if (!response.ok) return null;

  return response.text();
};

export const createLDrawClient = (config: LDrawConfig) => {
  const download = async (
    file: string
  ): Promise<string | null> => {
    const candidates = getCandidates(file);

    for (const candidate of candidates) {
      const content = await fetchText(
        `${config.mirror}/${candidate}`
      );

      if (content === null) continue;

      const destination = path.join(
        config.tempDir,
        candidate
      );

      await mkdir(path.dirname(destination), {
        recursive: true
      });

      await writeFile(destination, content, 'utf8');

      return content;
    }

    return null;
  };

  const downloadRequired = async (file: string) => {
    const content = await download(file);

    if (content === null) {
      throw new Error(`LDraw file not found: ${file}`);
    }

    return content;
  };

  return {
    download,
    downloadRequired
  };
};
