import { point } from "./math.js";
// Browser follow-camera adaptation: preserve its rear position while clearing
// the actual reconstructed deck/terrain. Source GameCamera collision is unknown.
export function clearGroundSightline(eye, car, track) {
  let height = eye[1];
  for (let i = 0; i <= 18; i++) {
    const t = i / 20;
    const surface = track.ground(
      eye[0] + (car[0] - eye[0]) * t,
      eye[2] + (car[2] - eye[2]) * t,
    );
    if (!surface) continue;
    height = Math.max(height, (surface.height + 0.5 - car[1] * t) / (1 - t));
  }
  // Falling below a platform must not send the camera arbitrarily high.
  eye[1] = Math.max(eye[1], Math.min(height, car[1] + 28));
}
// Segment/triangle camera obstruction test against original static meshes.
export function blocksCamera(draw, eye, target) {
  if (!draw.worldPositions) {
    const a = new Float32Array(draw.positions.length),
      min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < a.length; i += 3) {
      const p = point(draw.world, [
        draw.positions[i],
        draw.positions[i + 1],
        draw.positions[i + 2],
      ]);
      for (let k = 0; k < 3; k++) {
        a[i + k] = p[k];
        min[k] = Math.min(min[k], p[k]);
        max[k] = Math.max(max[k], p[k]);
      }
    }
    draw.worldPositions = a;
    draw.bounds = { min, max };
  }
  const d = target.map((v, i) => v - eye[i]);
  let lo = 0,
    hi = 0.97;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-7) {
      if (eye[k] < draw.bounds.min[k] || eye[k] > draw.bounds.max[k])
        return false;
    } else {
      let a = (draw.bounds.min[k] - eye[k]) / d[k],
        b = (draw.bounds.max[k] - eye[k]) / d[k];
      if (a > b) [a, b] = [b, a];
      lo = Math.max(lo, a);
      hi = Math.min(hi, b);
      if (lo > hi) return false;
    }
  }
  const p = draw.worldPositions,
    ix = draw.indices;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3,
      b = ix[i + 1] * 3,
      c = ix[i + 2] * 3,
      e1 = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]],
      e2 = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]],
      h = [
        d[1] * e2[2] - d[2] * e2[1],
        d[2] * e2[0] - d[0] * e2[2],
        d[0] * e2[1] - d[1] * e2[0],
      ],
      det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
    if (Math.abs(det) < 1e-7) continue;
    const inv = 1 / det,
      s = [eye[0] - p[a], eye[1] - p[a + 1], eye[2] - p[a + 2]],
      u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) * inv;
    if (u < 0 || u > 1) continue;
    const q = [
        s[1] * e1[2] - s[2] * e1[1],
        s[2] * e1[0] - s[0] * e1[2],
        s[0] * e1[1] - s[1] * e1[0],
      ],
      v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) * inv;
    if (v < 0 || u + v > 1) continue;
    const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
    if (t > 0.001 && t < 0.97) return true;
  }
  return false;
}
