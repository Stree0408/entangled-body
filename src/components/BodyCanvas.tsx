"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Point3D } from "@/types/point";
import PointCloud from "./PointCloud";

type BodyCanvasProps = {
  points: Point3D[];
};

export default function BodyCanvas({ points }: BodyCanvasProps) {
  return (
    <div className="h-[700px] w-full rounded-2xl border border-neutral-800 bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={1} />
        <PointCloud points={points} />
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}