export type BodyRegion =
  | "hair"
  | "face"
  | "neck"
  | "shoulders"
  | "chest"
  | "unknown";

export type Point3D = {
  x: number;
  y: number;
  z: number;
  brightness: number;

  baseX: number;
  baseY: number;
  baseZ: number;

  scatterX: number;
  scatterY: number;
  scatterZ: number;

  region: BodyRegion;
  clusterId: number;
};