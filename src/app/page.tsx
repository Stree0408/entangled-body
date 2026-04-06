"use client";

import { useEffect, useState } from "react";
import { imageToPoints } from "@/lib/imageToPoints";
import { Point3D } from "@/types/point";
import BodyCanvas from "@/components/BodyCanvas";

export default function Page() {
  const [points, setPoints] = useState<Point3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);

        const result = await imageToPoints({
          imageSrc: "/body.png",
          maxWidth: 180,
          sampleStep: 2,
          brightnessThreshold: 210,
        });

        setPoints(result);
      } catch (err) {
        console.error(err);
        setError("error occured during creating points");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Entangled Body MVP</h1>
          <p className="text-neutral-400 mt-2">
          </p>
        </div>

        {loading && <p className="text-neutral-400">Loading...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-300">
                Numer of points created:{" "}
                <span className="font-bold text-white">{points.length}</span>
              </p>
            </div>

            <BodyCanvas points={points} />
          </>
        )}
      </div>
    </main>
  );
}