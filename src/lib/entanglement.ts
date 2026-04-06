import { BodyRegion, Point3D } from "@/types/point";

export type EntanglementMap = Record<number, number[]>;

const regionLinks: Record<BodyRegion, BodyRegion[]> = {
  hair: ["chest", "shoulders"],
  face: ["chest", "shoulders"],
  neck: ["face", "chest"],
  shoulders: ["face", "chest", "shoulders"],
  chest: ["face", "neck", "shoulders"],
  unknown: ["chest"],
};

export function generateEntanglementMap(points: Point3D[]): EntanglementMap {
  const clusterMeta = getClusterMeta(points);
  const clusterIds = Object.keys(clusterMeta).map(Number);

  const map: EntanglementMap = {};

  for (const clusterId of clusterIds) {
    const source = clusterMeta[clusterId];
    const allowedRegions = regionLinks[source.region] ?? ["chest"];

    const candidates = clusterIds.filter((id) => {
      if (id === clusterId) return false;
      const target = clusterMeta[id];
      return allowedRegions.includes(target.region);
    });

    const weighted = sortByDistanceAndShuffle(
      candidates,
      clusterMeta,
      clusterId
    );

    map[clusterId] = weighted.slice(0, 2);
  }

  return map;
}

function getClusterMeta(points: Point3D[]) {
  const grouped = new Map<
    number,
    { regionCount: Record<string, number>; sumX: number; sumY: number; count: number }
  >();

  for (const p of points) {
    const current = grouped.get(p.clusterId) ?? {
      regionCount: {},
      sumX: 0,
      sumY: 0,
      count: 0,
    };

    current.regionCount[p.region] = (current.regionCount[p.region] ?? 0) + 1;
    current.sumX += p.baseX;
    current.sumY += p.baseY;
    current.count += 1;

    grouped.set(p.clusterId, current);
  }

  const result: Record<number, { region: BodyRegion; x: number; y: number }> = {};

  for (const [clusterId, value] of grouped.entries()) {
    const dominantRegion = Object.entries(value.regionCount).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] as BodyRegion;

    result[clusterId] = {
      region: dominantRegion ?? "unknown",
      x: value.sumX / value.count,
      y: value.sumY / value.count,
    };
  }

  return result;
}

function sortByDistanceAndShuffle(
  candidates: number[],
  meta: Record<number, { region: BodyRegion; x: number; y: number }>,
  sourceId: number
) {
  const source = meta[sourceId];

  return [...candidates]
    .map((id) => {
      const target = meta[id];
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      return {
        id,
        score: dist + Math.random() * 20,
      };
    })
    .sort((a, b) => a.score - b.score)
    .map((item) => item.id);
}