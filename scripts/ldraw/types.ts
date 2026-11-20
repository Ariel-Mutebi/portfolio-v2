export type LDrawConfig = {
  brick: string;
  mirror: string;
  tempDir: string;
  outputDir: string;
  threeRelease: string;
};

export type DownloadResult = {
  requested: string;
  resolved: string;
  content: string;
};

export type DependencyResult = {
  files: string[];
  count: number;
};
