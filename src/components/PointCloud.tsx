"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Point3D } from "@/types/point";
import { useFrame, useThree } from "@react-three/fiber";

type PointCloudProps = {
  points: Point3D[];
};

export default function PointCloud({ points }: PointCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, index) => {
      positions[index * 3] = point.scatterX * 0.02;
      positions[index * 3 + 1] = point.scatterY * 0.02;
      positions[index * 3 + 2] = point.scatterZ * 0.02;

      const base = 1 - point.brightness / 255;
      colors[index * 3] = base;
      colors[index * 3 + 1] = base;
      colors[index * 3 + 2] = base;
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
    const positionAttr = geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;

    const hoverX = mouse.x * 2.2;
    const hoverY = mouse.y * 3.0;
    const radius = 0.25;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      const currentX = positionAttr.getX(i);
      const currentY = positionAttr.getY(i);

      const pointScreenX = point.baseX * 0.02;
      const pointScreenY = point.baseY * 0.02;

      const dx = pointScreenX - hoverX;
      const dy = pointScreenY - hoverY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const scatterX = point.scatterX * 0.02;
      const scatterY = point.scatterY * 0.02;
      const scatterZ = point.scatterZ * 0.02;

      const baseX = point.baseX * 0.02;
      const baseY = point.baseY * 0.02;
      const baseZ = point.baseZ * 0.02;

      const targetX = dist < radius ? baseX : scatterX;
      const targetY = dist < radius ? baseY : scatterY;
      const targetZ = dist < radius ? baseZ : scatterZ;

      const lerpFactor = dist < radius ? 0.2 : 0.08;

      const nextX = THREE.MathUtils.lerp(currentX, targetX, lerpFactor);
      const nextY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const nextZ = THREE.MathUtils.lerp(
        positionAttr.getZ(i),
        targetZ,
        lerpFactor
      );

      positionAttr.setXYZ(i, nextX, nextY, nextZ);

      const baseColor = 1 - point.brightness / 255;

      if (dist < radius) {
        colorAttr.setXYZ(i, 1, 1, 1);
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