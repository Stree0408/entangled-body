import { Point3D } from "@/types/point";

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

      // 배경이 너무 밝으면 점으로 안 씀
      if (brightness > brightnessThreshold) continue;

      // 밝기를 이용해 약한 깊이감 부여
      const z = mapRange(255 - brightness, 0, 255, -20, 20);

      // points.push({
      //   x: x - centerX,
      //   y: -(y - centerY),
      //   z,
      //   brightness,
      // });

      const layers = 4;

      for (let i = 0; i < layers; i++) {
        points.push({
          x: x - centerX,
          y: -(y - centerY),
          z: i * 2 + (Math.random() - 0.5) * 1.5,
          brightness
        });
      }
      
    }
  }

  return points;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}