"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Point3D } from "@/types/point";
import { useFrame, useThree } from "@react-three/fiber";
import { generateEntanglementMap } from "@/lib/entanglement";

type PointCloudProps = {
  points: Point3D[];
};

export default function PointCloud({ points }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const { mouse, gl } = useThree();

  const [isCollapsed, setIsCollapsed] = useState(false);

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

  useEffect(() => {
    const canvas = gl.domElement;

    function handleClick() {
      setIsCollapsed((prev) => !prev);
    }

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl]);

  useFrame(() => {
    if (!pointsRef.current || !materialRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

    const hoverX = mouse.x * 2.2;
    const hoverY = mouse.y * 3.0;
    const hoverRadius = 0.22;

    let hoveredClusterId = -1;

    if (!isCollapsed) {
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

      if (isCollapsed) {
        // Day 5: 전체 collapse
        targetX = baseX;
        targetY = baseY;
        targetZ = baseZ;
        lerpFactor = 0.14;
      } else if (isDirectHover || isHoveredCluster) {
        // Day 4: 직접 hover cluster
        targetX = baseX;
        targetY = baseY;
        targetZ = baseZ;
        lerpFactor = 0.15;
      } else if (isLinkedCluster) {
        // Day 4: entangled cluster
        targetX = THREE.MathUtils.lerp(scatterX, baseX, 0.45);
        targetY = THREE.MathUtils.lerp(scatterY, baseY, 0.45);
        targetZ = THREE.MathUtils.lerp(scatterZ, baseZ, 0.45);
        lerpFactor = 0.08;
      }

      const nextX = THREE.MathUtils.lerp(currentX, targetX, lerpFactor);
      const nextY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const nextZ = THREE.MathUtils.lerp(currentZ, targetZ, lerpFactor);

      positionAttr.setXYZ(i, nextX, nextY, nextZ);

      const baseColor = 1 - point.brightness / 255;

      if (isCollapsed) {
        colorAttr.setXYZ(i, 1, 1, 1);
      } else if (isDirectHover || isHoveredCluster) {
        colorAttr.setXYZ(i, 1, 1, 1);
      } else if (isLinkedCluster) {
        colorAttr.setXYZ(i, 0.6, 0.8, 1);
      } else {
        colorAttr.setXYZ(i, baseColor, baseColor, baseColor);
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;

    // opacity 증가
    const targetOpacity = isCollapsed ? 1.0 : 0.95;
    materialRef.current.opacity = THREE.MathUtils.lerp(
      materialRef.current.opacity,
      targetOpacity,
      0.08
    );

    // 점 크기도 살짝 키우면 선명해 보임
    const targetSize = isCollapsed ? 0.038 : 0.03;
    materialRef.current.size = THREE.MathUtils.lerp(
      materialRef.current.size,
      targetSize,
      0.08
    );
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.03}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.95}
      />
    </points>
  );
}