import { Point3D } from "@/types/point";

export type EntanglementMap = Record<number, number[]>;

export function generateEntanglementMap(points: Point3D[]): EntanglementMap {
  const uniqueClusterIds = Array.from(new Set(points.map((p) => p.clusterId)));

  const map: EntanglementMap = {};

  for (const clusterId of uniqueClusterIds) {
    map[clusterId] = [];
  }

  for (const clusterId of uniqueClusterIds) {
    const candidates = uniqueClusterIds.filter((id) => id !== clusterId);

    shuffleArray(candidates);

    const linked = candidates.slice(0, 4);
    map[clusterId] = linked;
  }

  return map;
}

/*
  TODO:
  실제 구현에서는 Math.random() 기반 shuffle 대신
  IonQ simulator 또는 quantum backend에서 얻은 bitstring/seed를 사용해
  cluster 간 entanglement pairing을 생성할 예정.

  예:
  - quantum measurement 결과 -> cluster index 선택
  - chosen clusters -> linked pair map 구성
*/
function shuffleArray<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}