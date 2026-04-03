export type Point3D = {
  // 현재 위치
  x: number;
  y: number;
  z: number;
  brightness: number;

  // 점이 원래 이미지 형태로 모였을 때 위치 
  baseX: number;
  baseY: number;
  baseZ: number;

  // 점이 평소 퍼져 있을 때 위치
  scatterX: number;
  scatterY: number;
  scatterZ: number;
};