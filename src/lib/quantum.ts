export function getQuantumJitter(
  x: number,
  y: number,
  t: number,
  strength = 0.015
) {
  return {
    x: Math.sin(t + x * 0.12) * strength,
    y: Math.cos(t * 1.1 + y * 0.1) * strength,
    z: Math.sin(t * 1.4 + x * 0.08 + y * 0.08) * strength,
  };
}

export function lerp(current: number, target: number, alpha: number) {
  return current + (target - current) * alpha;
}