"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Point3D } from "@/types/point";
import { generateEntanglementMap } from "@/lib/entanglement";
import { getQuantumJitter } from "@/lib/quantum";

type PointCloudProps = {
  points: Point3D[];
  onModeChange?: (
    mode: "superposition" | "entangled" | "collapsed"
  ) => void;
};

type ClusterCenter = {
  clusterId: number;
  x: number;
  y: number;
  z: number;
};

type Edge = {
  from: number;
  to: number;
};

type Pulse = {
  from: number;
  to: number;
  startTime: number;
  duration: number;
};

const POSITION_SCALE = 0.02;
const HOVER_RADIUS = 0.2;

export default function PointCloud({
  points,
  onModeChange,
}: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const pointsMaterialRef = useRef<THREE.PointsMaterial>(null);

  const lineRef = useRef<THREE.LineSegments>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null);

  const pulseRef = useRef<THREE.Points>(null);
  const pulseMaterialRef = useRef<THREE.PointsMaterial>(null);

  const { mouse, gl } = useThree();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [hoveredClusterId, setHoveredClusterId] = useState<number>(-1);

  const entanglementMap = useMemo(() => {
    return generateEntanglementMap(points);
  }, [points]);

  const clusterCenters = useMemo<ClusterCenter[]>(() => {
    const map = new Map<
      number,
      { sumX: number; sumY: number; sumZ: number; count: number }
    >();

    for (const p of points) {
      const current = map.get(p.clusterId) ?? {
        sumX: 0,
        sumY: 0,
        sumZ: 0,
        count: 0,
      };

      current.sumX += p.baseX;
      current.sumY += p.baseY;
      current.sumZ += p.baseZ;
      current.count += 1;

      map.set(p.clusterId, current);
    }

    return Array.from(map.entries()).map(([clusterId, value]) => ({
      clusterId,
      x: (value.sumX / value.count) * POSITION_SCALE,
      y: (value.sumY / value.count) * POSITION_SCALE,
      z: (value.sumZ / value.count) * POSITION_SCALE,
    }));
  }, [points]);

  const clusterCenterMap = useMemo(() => {
    const map = new Map<number, ClusterCenter>();
    for (const c of clusterCenters) {
      map.set(c.clusterId, c);
    }
    return map;
  }, [clusterCenters]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    const seen = new Set<string>();

    for (const [fromClusterIdStr, linked] of Object.entries(entanglementMap)) {
      const from = Number(fromClusterIdStr);

      for (const to of linked) {
        const key = from < to ? `${from}-${to}` : `${to}-${from}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!clusterCenterMap.has(from) || !clusterCenterMap.has(to)) continue;
        result.push({ from, to });
      }
    }

    return result;
  }, [entanglementMap, clusterCenterMap]);

  const pointsGeometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, index) => {
      positions[index * 3] = point.scatterX * POSITION_SCALE;
      positions[index * 3 + 1] = point.scatterY * POSITION_SCALE;
      positions[index * 3 + 2] = point.scatterZ * POSITION_SCALE;

      const baseColor = 1 - point.brightness / 255;
      colors[index * 3] = baseColor;
      colors[index * 3 + 1] = baseColor;
      colors[index * 3 + 2] = baseColor;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [points]);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(edges.length * 2 * 3);
    const colors = new Float32Array(edges.length * 2 * 3);

    edges.forEach((edge, index) => {
      const from = clusterCenterMap.get(edge.from);
      const to = clusterCenterMap.get(edge.to);
      if (!from || !to) return;

      const i = index * 6;

      positions[i] = from.x;
      positions[i + 1] = from.y;
      positions[i + 2] = from.z;

      positions[i + 3] = to.x;
      positions[i + 4] = to.y;
      positions[i + 5] = to.z;

      colors[i] = 0.18;
      colors[i + 1] = 0.02;
      colors[i + 2] = 0.04;

      colors[i + 3] = 0.18;
      colors[i + 4] = 0.02;
      colors[i + 5] = 0.04;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [edges, clusterCenterMap]);

  const pulseGeometry = useMemo(() => {
    const maxPulseCount = Math.max(edges.length, 1);
    const positions = new Float32Array(maxPulseCount * 3);
    const colors = new Float32Array(maxPulseCount * 3);

    for (let i = 0; i < maxPulseCount; i++) {
      positions[i * 3] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [edges.length]);

  useEffect(() => {
    const canvas = gl.domElement;

    function handleClick() {
      setIsCollapsed((prev) => {
        const next = !prev;

        if (next) {
          setPulses([]);
          onModeChange?.("collapsed");
        } else {
          onModeChange?.(hoveredClusterId >= 0 ? "entangled" : "superposition");
        }

        return next;
      });
    }

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl, onModeChange, hoveredClusterId]);

  useEffect(() => {
    if (!points.length) return;

    let pulseInterval: number | null = null;
    let lastHoveredCluster = -1;

    const tick = () => {
      if (isCollapsed) {
        setHoveredClusterId(-1);
        return;
      }

      const hoverX = mouse.x * 2.2;
      const hoverY = mouse.y * 3.0;

      let nextHoveredClusterId = -1;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const px = point.baseX * POSITION_SCALE;
        const py = point.baseY * POSITION_SCALE;

        const dx = px - hoverX;
        const dy = py - hoverY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS) {
          nextHoveredClusterId = point.clusterId;
          break;
        }
      }

      setHoveredClusterId(nextHoveredClusterId);

      if (nextHoveredClusterId === -1) {
        lastHoveredCluster = -1;
        onModeChange?.("superposition");
        return;
      }

      onModeChange?.("entangled");

      const now = performance.now();

      if (lastHoveredCluster !== nextHoveredClusterId) {
        lastHoveredCluster = nextHoveredClusterId;

        const linked = entanglementMap[nextHoveredClusterId] ?? [];
        const newPulses: Pulse[] = linked.map((to, index) => ({
          from: nextHoveredClusterId,
          to,
          startTime: now + index * 110,
          duration: 700,
        }));

        setPulses(newPulses);
      }
    };

    tick();
    pulseInterval = window.setInterval(tick, 180);

    return () => {
      if (pulseInterval) window.clearInterval(pulseInterval);
    };
  }, [mouse.x, mouse.y, points, isCollapsed, entanglementMap, onModeChange]);

  useFrame(() => {
    if (
      !pointsRef.current ||
      !pointsMaterialRef.current ||
      !lineRef.current ||
      !pulseRef.current
    ) {
      return;
    }

    const now = performance.now();
    const time = now * 0.001;

    const pointGeometry = pointsRef.current.geometry;
    const pointPositionAttr = pointGeometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const pointColorAttr = pointGeometry.getAttribute(
      "color"
    ) as THREE.BufferAttribute;

    const lineGeometry = lineRef.current.geometry;
    const lineColorAttr = lineGeometry.getAttribute(
      "color"
    ) as THREE.BufferAttribute;

    const pulseGeometry = pulseRef.current.geometry;
    const pulsePositionAttr = pulseGeometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const pulseColorAttr = pulseGeometry.getAttribute(
      "color"
    ) as THREE.BufferAttribute;

    const linkedClusters =
      hoveredClusterId >= 0 ? entanglementMap[hoveredClusterId] ?? [] : [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      const currentX = pointPositionAttr.getX(i);
      const currentY = pointPositionAttr.getY(i);
      const currentZ = pointPositionAttr.getZ(i);

      const hoverX = mouse.x * 2.2;
      const hoverY = mouse.y * 3.0;

      const pointScreenX = point.baseX * POSITION_SCALE;
      const pointScreenY = point.baseY * POSITION_SCALE;

      const dx = pointScreenX - hoverX;
      const dy = pointScreenY - hoverY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const baseX = point.baseX * POSITION_SCALE;
      const baseY = point.baseY * POSITION_SCALE;
      const baseZ = point.baseZ * POSITION_SCALE;

      const scatterX = point.scatterX * POSITION_SCALE;
      const scatterY = point.scatterY * POSITION_SCALE;
      const scatterZ = point.scatterZ * POSITION_SCALE;

      const jitter = getQuantumJitter(point.baseX, point.baseY, time, 0.01);

      const isDirectHover = dist < HOVER_RADIUS;
      const isHoveredCluster = point.clusterId === hoveredClusterId;
      const isLinkedCluster = linkedClusters.includes(point.clusterId);

      let targetX = scatterX + jitter.x;
      let targetY = scatterY + jitter.y;
      let targetZ = scatterZ + jitter.z;
      let lerpFactor = 0.045;

      if (isCollapsed) {
        targetX = baseX;
        targetY = baseY;
        targetZ = baseZ;
        lerpFactor = 0.14;
      } else if (isDirectHover || isHoveredCluster) {
        targetX = baseX;
        targetY = baseY;
        targetZ = baseZ;
        lerpFactor = 0.15;
      } else if (isLinkedCluster) {
        targetX = THREE.MathUtils.lerp(scatterX, baseX, 0.35);
        targetY = THREE.MathUtils.lerp(scatterY, baseY, 0.35);
        targetZ = THREE.MathUtils.lerp(scatterZ, baseZ, 0.35);
        lerpFactor = 0.07;
      }

      const nextX = THREE.MathUtils.lerp(currentX, targetX, lerpFactor);
      const nextY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const nextZ = THREE.MathUtils.lerp(currentZ, targetZ, lerpFactor);

      pointPositionAttr.setXYZ(i, nextX, nextY, nextZ);

      const baseColor = 1 - point.brightness / 255;

      if (isCollapsed) {
        pointColorAttr.setXYZ(i, 1, 1, 1);
      } else if (isDirectHover || isHoveredCluster) {
        pointColorAttr.setXYZ(i, 1, 1, 1);
      } else if (isLinkedCluster) {
        pointColorAttr.setXYZ(i, 0.72, 0.82, 1.0);
      } else {
        pointColorAttr.setXYZ(i, baseColor, baseColor, baseColor);
      }
    }

    pointPositionAttr.needsUpdate = true;
    pointColorAttr.needsUpdate = true;

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const baseIndex = i * 2;

      const isHoveredEdge =
        hoveredClusterId >= 0 &&
        (edge.from === hoveredClusterId || edge.to === hoveredClusterId);

      let r = 0.18;
      let g = 0.02;
      let b = 0.04;

      if (!isCollapsed && isHoveredEdge) {
        r = 0.82;
        g = 0.12;
        b = 0.18;
      }

      lineColorAttr.setXYZ(baseIndex, r, g, b);
      lineColorAttr.setXYZ(baseIndex + 1, r, g, b);
    }

    lineColorAttr.needsUpdate = true;

    const activePulses = pulses.filter(
      (pulse) => now >= pulse.startTime && now <= pulse.startTime + pulse.duration
    );

    const maxPulseCount = pulsePositionAttr.count;

    for (let i = 0; i < maxPulseCount; i++) {
      if (i >= activePulses.length) {
        pulsePositionAttr.setXYZ(i, 9999, 9999, 9999);
        pulseColorAttr.setXYZ(i, 1, 1, 1);
        continue;
      }

      const pulse = activePulses[i];
      const from = clusterCenterMap.get(pulse.from);
      const to = clusterCenterMap.get(pulse.to);

      if (!from || !to) {
        pulsePositionAttr.setXYZ(i, 9999, 9999, 9999);
        continue;
      }

      const progress = THREE.MathUtils.clamp(
        (now - pulse.startTime) / pulse.duration,
        0,
        1
      );

      const x = THREE.MathUtils.lerp(from.x, to.x, progress);
      const y = THREE.MathUtils.lerp(from.y, to.y, progress);
      const z = THREE.MathUtils.lerp(from.z, to.z, progress);

      pulsePositionAttr.setXYZ(i, x, y, z);

      const glow = 0.7 + 0.3 * Math.sin(progress * Math.PI);
      pulseColorAttr.setXYZ(i, 0.82 * glow, 0.9 * glow, 1.0 * glow);
    }

    pulsePositionAttr.needsUpdate = true;
    pulseColorAttr.needsUpdate = true;

    const pointTargetOpacity = isCollapsed ? 1.0 : 0.92;
    pointsMaterialRef.current.opacity = THREE.MathUtils.lerp(
      pointsMaterialRef.current.opacity,
      pointTargetOpacity,
      0.08
    );

    const pointTargetSize = isCollapsed ? 0.038 : 0.028;
    pointsMaterialRef.current.size = THREE.MathUtils.lerp(
      pointsMaterialRef.current.size,
      pointTargetSize,
      0.08
    );

    if (lineMaterialRef.current) {
      const targetLineOpacity =
        isCollapsed ? 0.0 : hoveredClusterId >= 0 ? 0.42 : 0.08;

      lineMaterialRef.current.opacity = THREE.MathUtils.lerp(
        lineMaterialRef.current.opacity,
        targetLineOpacity,
        0.08
      );
    }

    if (pulseMaterialRef.current) {
      const targetPulseOpacity =
        isCollapsed ? 0.0 : hoveredClusterId >= 0 ? 1.0 : 0.0;

      pulseMaterialRef.current.opacity = THREE.MathUtils.lerp(
        pulseMaterialRef.current.opacity,
        targetPulseOpacity,
        0.12
      );
    }
  });

  return (
    <group>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          ref={lineMaterialRef}
          vertexColors
          transparent
          opacity={0.08}
        />
      </lineSegments>

      <points ref={pulseRef} geometry={pulseGeometry}>
        <pointsMaterial
          ref={pulseMaterialRef}
          size={0.055}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>

      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          ref={pointsMaterialRef}
          size={0.028}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </points>
    </group>
  );
}