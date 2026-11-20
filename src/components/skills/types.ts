export interface LegoSceneConfig {
  backgroundColor?: string;
  modelPath?: string;
  modelScale?: number;
  cameraPosition?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface LegoSceneInstance {
  destroy: () => void;
}
