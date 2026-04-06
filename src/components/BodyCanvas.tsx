"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Point3D } from "@/types/point";
import PointCloud from "./PointCloud";
import QuantumStatus from "./QuantumStatus";

type BodyCanvasProps = {
  points: Point3D[];
};

export default function BodyCanvas({ points }: BodyCanvasProps) {
  const [mode, setMode] = useState<
    "superposition" | "entangled" | "collapsed"
  >("superposition");

  return (
    <div className="relative h-[700px] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-black">
      <QuantumStatus mode={mode} />

      <Canvas camera={{ position: [0, 0, 6.5], fov: 42 }}>
        <ambientLight intensity={1} />
        <PointCloud points={points} onModeChange={setMode} />
        <OrbitControls
          enablePan={false}
          minDistance={4.5}
          maxDistance={8}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
}