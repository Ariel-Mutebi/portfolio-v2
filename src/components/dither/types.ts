export type DitherOptions = {
  base: string;
  ink: string;
  /** Target cell size in CSS px */
  cell?: number;
  fps?: number;
};

export type DitherConfig = Required<DitherOptions>;

export type Cleanup = () => void;
