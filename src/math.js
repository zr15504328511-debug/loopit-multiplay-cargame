export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, s, dt) => lerp(a, b, 1 - Math.exp(-s * dt));
export const identity = () =>
  new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
export function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
  return o;
}
export function trs(t = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) {
  const [x, y, z, w] = q,
    x2 = x + x,
    y2 = y + y,
    z2 = z + z,
    xx = x * x2,
    xy = x * y2,
    xz = x * z2,
    yy = y * y2,
    yz = y * z2,
    zz = z * z2,
    wx = w * x2,
    wy = w * y2,
    wz = w * z2;
  return new Float32Array([
    (1 - yy - zz) * s[0],
    (xy + wz) * s[0],
    (xz - wy) * s[0],
    0,
    (xy - wz) * s[1],
    (1 - xx - zz) * s[1],
    (yz + wx) * s[1],
    0,
    (xz + wy) * s[2],
    (yz - wx) * s[2],
    (1 - xx - yy) * s[2],
    0,
    ...t,
    1,
  ]);
}
export function model(t, yaw = 0, pitch = 0, roll = 0, s = [1, 1, 1]) {
  return mul(
    trs(t, [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)], s),
    mul(
      trs([0, 0, 0], [Math.sin(pitch / 2), 0, 0, Math.cos(pitch / 2)]),
      trs([0, 0, 0], [0, 0, Math.sin(roll / 2), Math.cos(roll / 2)]),
    ),
  );
}
export function point(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}
export function normalize(a) {
  const l = Math.hypot(...a) || 1;
  return a.map((x) => x / l);
}
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export function lookAt(eye, target) {
  const z = normalize(sub(eye, target)),
    x = normalize(cross([0, 1, 0], z)),
    y = cross(z, x);
  return new Float32Array([
    x[0],
    y[0],
    z[0],
    0,
    x[1],
    y[1],
    z[1],
    0,
    x[2],
    y[2],
    z[2],
    0,
    -x.reduce((s, v, i) => s + v * eye[i], 0),
    -y.reduce((s, v, i) => s + v * eye[i], 0),
    -z.reduce((s, v, i) => s + v * eye[i], 0),
    1,
  ]);
}
export function perspective(fov, aspect, near = 0.15, far = 2000) {
  const f = 1 / Math.tan(fov / 2),
    nf = 1 / (near - far);
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]);
}
