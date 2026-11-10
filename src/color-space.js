// Unity ColorSpace.Linear project: material Color values decode, Vector/global values do not.
export const toLinear = (v) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
export const linearColor = (v) => v.map((x, i) => (i < 3 ? toLinear(x) : x));

// TerrainBaker.CSMain: source biome colors/side colors/top spread are mesh attributes.
export function terrainBiome(globals, z) {
  const arrays = Object.fromEntries(
    (globals.globalColorArrays || []).map((a) => [
      a.name,
      a.colors.map((c) => [
        ...c.slice(0, 3),
        a.alphaIsSignedMag ? 2 * c[3] - 1 : c[3],
      ]),
    ]),
  );
  const floats = Object.fromEntries(
    (globals.globalFloatArrays || []).map((a) => [a.name, a.values]),
  );
  const transition =
    globals.globalFloats?.find((a) => a.name === "TransitionDist")?.value || 10;
  const distances = floats.DistArr || [];
  let i = distances.findIndex((d) => z < d + transition);
  if (i < 0) i = distances.length;
  let t =
    i < distances.length
      ? Math.min(
          1,
          Math.max(0, (z - distances[i] + transition) / (2 * transition)),
        )
      : 0;
  t = t * t * (3 - 2 * t);
  const blend = (a) => {
    const x = a?.[i] ?? a?.at(-1),
      y = a?.[i + 1] ?? x;
    return Array.isArray(x)
      ? x.map((v, k) => v + (y[k] - v) * t)
      : (x || 0) + ((y || 0) - (x || 0)) * t;
  };
  return {
    top: blend(arrays.MainColor) || [1, 1, 1, 0],
    side: blend(arrays.SideColor) || [1, 1, 1, 0],
    spread: blend(floats.TopSpreadsArr),
  };
}
