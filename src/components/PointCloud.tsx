"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Point3D } from "@/types/point";
import { Canvas } from "@react-three/fiber";

type PointCloudProps = {
  points: Point3D[];
};

export default function PointCloud({ points }: PointCloudProps) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);

    points.forEach((point, index) => {
      positions[index * 3] = point.x * 0.02;
      positions[index * 3 + 1] = point.y * 0.02;
      positions[index * 3 + 2] = point.z * 0.02;
    });

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    return bufferGeometry;
  }, [points]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="white"
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}