import type {
  DependencyResult,
  LDrawConfig
} from './types.ts';
import { createLDrawClient } from './client.ts';

const extractDependencies = (content: string): string[] =>
  content
    .split(/\r?\n/)
    .filter((line) => /^\s*1\s/.test(line))
    .map((line) => line.trim().split(/\s+/).slice(14).join(' '))
    .filter(Boolean);

export const createDependencyResolver = (
  config: LDrawConfig
) => {
  const client = createLDrawClient(config);

  const resolve = async (
    rootFile: string
  ): Promise<DependencyResult> => {
    const visited = new Set<string>();

    const visit = async (file: string): Promise<void> => {
      const key = file.toLowerCase();

      if (visited.has(key)) return;

      // Mark before recursion to prevent circular references.
      visited.add(key);

      const content = await client.downloadRequired(file);

      const dependencies = extractDependencies(content);

      await Promise.all(
        dependencies.map(visit)
      );
    };

    await visit(rootFile);

    return {
      files: [...visited],
      count: visited.size
    };
  };

  return { resolve };
};
