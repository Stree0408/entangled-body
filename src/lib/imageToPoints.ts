import { BodyRegion, Point3D } from "@/types/point";

type ImageToPointsOptions = {
  imageSrc: string;
  maxWidth?: number;
  sampleStep?: number;
  brightnessThreshold?: number;
};

export async function imageToPoints({
  imageSrc,
  maxWidth = 160,
  sampleStep = 2,
  brightnessThreshold = 240,
}: ImageToPointsOptions): Promise<Point3D[]> {
  const img = await loadImage(imageSrc);

  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.floor(img.width * scale);
  const height = Math.floor(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context를 만들 수 없습니다.");
  }

  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  const points: Point3D[] = [];
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const index = (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a < 10) continue;

      const brightness = (r + g + b) / 3;
      if (brightness > brightnessThreshold) continue;

      const baseX = x - centerX;
      const baseY = -(y - centerY);
      const baseZ = 0;

      const region = classifyRegion({
        x: baseX,
        y: baseY,
        width,
        height,
        brightness,
      });

      const clusterId = getClusterId({
        x: baseX,
        y: baseY,
        width,
        height,
        gridCols: 10, // 더 작은 cluster로 쪼개고 싶을 시
        gridRows: 14, // 더 작은 cluster로 쪼개고 싶을 시 (더 큰 value)
      });

      const layers = 4;

      for (let i = 0; i < layers; i++) {
        const scatterX = baseX + (Math.random() - 0.5) * 2;
        const scatterY = baseY + (Math.random() - 0.5) * 2;
        const scatterZ = i * 2 + (Math.random() - 0.5) * 1.5;

        points.push({
          x: scatterX,
          y: scatterY,
          z: scatterZ,
          brightness,

          baseX,
          baseY,
          baseZ,

          scatterX,
          scatterY,
          scatterZ,

          region,
          clusterId,
        });
      }
    }
  }

  return points;
}

function classifyRegion({
  x,
  y,
  width,
  height,
  brightness,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  brightness: number;
}): BodyRegion {
  const halfW = width / 2;
  const halfH = height / 2;

  if (y > halfH * 0.35 && brightness < 110) {
    return "hair";
  }

  if (y > halfH * 0.02 && x > -halfW * 0.22 && x < halfW * 0.22) {
    return "face";
  }

  if (
    y > -halfH * 0.08 &&
    y <= halfH * 0.02 &&
    x > -halfW * 0.12 &&
    x < halfW * 0.12
  ) {
    return "neck";
  }

  if (
    y > -halfH * 0.28 &&
    y <= halfH * 0.02 &&
    (x < -halfW * 0.2 || x > halfW * 0.2)
  ) {
    return "shoulders";
  }

  if (x > -halfW * 0.28 && x < halfW * 0.28) {
    return "chest";
  }

  return "unknown";
}

function getClusterId({   // 점을 작은 격자 셀에 배정
  x,
  y,
  width,
  height,
  gridCols,
  gridRows,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  gridCols: number;
  gridRows: number;
}) {
  const normalizedX = (x + width / 2) / width;
  const normalizedY = (height / 2 - y) / height;

  const col = Math.max(0, Math.min(gridCols - 1, Math.floor(normalizedX * gridCols)));
  const row = Math.max(0, Math.min(gridRows - 1, Math.floor(normalizedY * gridRows)));

  return row * gridCols + col;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}