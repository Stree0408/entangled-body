"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Point3D } from "@/types/point";
import { useFrame, useThree } from "@react-three/fiber";
import { generateEntanglementMap } from "@/lib/entanglement";

type PointCloudProps = {
  points: Point3D[];
};

export default function PointCloud({ points }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const entanglementMap = useMemo(() => {
    return generateEntanglementMap(points);
  }, [points]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, index) => {
      positions[index * 3] = point.scatterX * 0.02;
      positions[index * 3 + 1] = point.scatterY * 0.02;
      positions[index * 3 + 2] = point.scatterZ * 0.02;

      const baseColor = 1 - point.brightness / 255;
      colors[index * 3] = baseColor;
      colors[index * 3 + 1] = baseColor;
      colors[index * 3 + 2] = baseColor;
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    bufferGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    return bufferGeometry;
  }, [points]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

    const hoverX = mouse.x * 2.2;
    const hoverY = mouse.y * 3.0;
    const hoverRadius = 0.22;

    let hoveredClusterId = -1;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const px = point.baseX * 0.02;
      const py = point.baseY * 0.02;

      const dx = px - hoverX;
      const dy = py - hoverY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hoverRadius) {
        hoveredClusterId = point.clusterId;
        break;
      }
    }

    const linkedClusters =
      hoveredClusterId >= 0 ? entanglementMap[hoveredClusterId] ?? [] : [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      const currentX = positionAttr.getX(i);
      const currentY = positionAttr.getY(i);
      const currentZ = positionAttr.getZ(i);

      const pointScreenX = point.baseX * 0.02;
      const pointScreenY = point.baseY * 0.02;

      const dx = pointScreenX - hoverX;
      const dy = pointScreenY - hoverY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const baseX = point.baseX * 0.02;
      const baseY = point.baseY * 0.02;
      const baseZ = point.baseZ * 0.02;

      const scatterX = point.scatterX * 0.02;
      const scatterY = point.scatterY * 0.02;
      const scatterZ = point.scatterZ * 0.02;

      const isDirectHover = dist < hoverRadius;
      const isHoveredCluster = point.clusterId === hoveredClusterId;
      const isLinkedCluster = linkedClusters.includes(point.clusterId);

      let targetX = scatterX;
      let targetY = scatterY;
      let targetZ = scatterZ;
      let lerpFactor = 0.05;

      if (isDirectHover || isHoveredCluster) {
        targetX = baseX;
        targetY = baseY;
        targetZ = baseZ;
        lerpFactor = 0.15;
      } else if (isLinkedCluster) {
        targetX = THREE.MathUtils.lerp(scatterX, baseX, 2.3);   // 반응 더 강하게 주고 싶을 때
        targetY = THREE.MathUtils.lerp(scatterY, baseY, 0.45);
        targetZ = THREE.MathUtils.lerp(scatterZ, baseZ, 0.45);
        lerpFactor = 0.08;
      }

      const nextX = THREE.MathUtils.lerp(currentX, targetX, lerpFactor);
      const nextY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const nextZ = THREE.MathUtils.lerp(currentZ, targetZ, lerpFactor);

      positionAttr.setXYZ(i, nextX, nextY, nextZ);

      const baseColor = 1 - point.brightness / 255;

      if (isDirectHover || isHoveredCluster) {
        colorAttr.setXYZ(i, 1, 1, 1);
      } else if (isLinkedCluster) {
        colorAttr.setXYZ(i, 0.6, 0.8, 1);
      } else {
        colorAttr.setXYZ(i, baseColor, baseColor, baseColor);
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.95}
      />
    </points>
  );
}