import { identity, mul, trs, point } from "./math.js";
const sizes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const types = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};
export async function loadGLB(url, renderer) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`${r.status}: ${url}`);
  const data = await r.arrayBuffer(),
    dv = new DataView(data);
  if (dv.getUint32(0, true) !== 0x46546c67) throw Error("Invalid GLB " + url);
  let json, bin;
  for (let o = 12; o < data.byteLength;) {
    const n = dv.getUint32(o, true),
      type = dv.getUint32(o + 4, true);
    if (type === 0x4e4f534a)
      json = JSON.parse(
        new TextDecoder().decode(new Uint8Array(data, o + 8, n)),
      );
    if (type === 0x004e4942) bin = data.slice(o + 8, o + 8 + n);
    o += 8 + n;
  }
  const read = (i) => {
    const a = json.accessors[i],
      v = json.bufferViews[a.bufferView],
      T = types[a.componentType],
      n = sizes[a.type],
      start = (v.byteOffset || 0) + (a.byteOffset || 0),
      stride = v.byteStride || n * T.BYTES_PER_ELEMENT;
    let out;
    if (stride === n * T.BYTES_PER_ELEMENT)
      out = new T(bin, start, a.count * n);
    else {
      out = new T(a.count * n);
      for (let k = 0; k < a.count; k++)
        out.set(new T(bin, start + k * stride, n), k * n);
    }
    return out;
  };
  const images = await Promise.all(
    (json.images || []).map(async (im) => {
      const v = json.bufferViews[im.bufferView],
        blob = new Blob(
          [bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength)],
          { type: im.mimeType },
        );
      return renderer.texture(await createImageBitmap(blob));
    }),
  );
  const materials = (json.materials || []).map((m) => {
    const p = m.pbrMetallicRoughness || {};
    return {
      name: m.name,
      color: p.baseColorFactor || [1, 1, 1, 1],
      texture: p.baseColorTexture
        ? images[json.textures[p.baseColorTexture.index].source]
        : null,
      alpha: m.alphaMode || "OPAQUE",
      double: m.doubleSided,
    };
  });
  const meshes =
    json.meshes?.map((m) =>
      m.primitives
        .filter((p) => p.mode === undefined || p.mode === 4)
        .map((p) => {
          const positions = read(p.attributes.POSITION),
            indices =
              p.indices !== undefined
                ? read(p.indices)
                : new Uint32Array(
                    Array.from({ length: positions.length / 3 }, (_, i) => i),
                  );
          return {
            gpu: renderer.mesh(
              positions,
              p.attributes.NORMAL !== undefined
                ? read(p.attributes.NORMAL)
                : null,
              p.attributes.TEXCOORD_0 !== undefined
                ? read(p.attributes.TEXCOORD_0)
                : null,
              indices,
              p.attributes.COLOR_0 !== undefined
                ? read(p.attributes.COLOR_0)
                : null,
            ),
            positions,
            indices,
            material: materials[p.material] || { color: [0.7, 0.7, 0.7, 1] },
          };
        }),
    ) || [];
  const nodes = [],
    draws = [];
  const native = renderer.nativeModels,
    binding = native?.files[url.replace(/^\//, "")];
  const walk = (i, parent, path) => {
    const n = json.nodes[i],
      world = mul(
        parent,
        n.matrix
          ? new Float32Array(n.matrix)
          : trs(n.translation, n.rotation, n.scale),
      ),
      name = path + "/" + (n.name || i),
      node = {
        index: i,
        name: n.name || "",
        path: name,
        world,
        position: point(world, [0, 0, 0]),
        raw: n,
      };
    nodes.push(node);
    if (n.mesh !== undefined)
      for (const mesh of meshes[n.mesh]) {
        const materials = binding?.nodes[name]?.materials || [];
        const exact = materials
          .map((id) => native.materials[id])
          .find((m) => m?.name === mesh.material.name);
        const material = exact
          ? {
              ...mesh.material,
              color: exact.colors._Color || mesh.material.color,
              metallic: exact.floats._Metallic || 0,
              smoothness: exact.floats._Glossiness ?? 0.5,
              emission: exact.colors._EmissionColor?.slice(0, 3) || [0, 0, 0],
              emissionUsesMain:
                exact.textures._EmissionMap?.pathId ===
                  exact.textures._MainTex?.pathId && !!exact.textures._MainTex,
              alphaCutoff: exact.floats._Cutoff ?? 0.5,
              shader: exact.shader,
              nativeEvidence: `${exact.file}:${exact.pathId}`,
              nativeProperties: exact,
            }
          : mesh.material;
        draws.push({
          ...mesh,
          material,
          world,
          node,
          nativeRendererEnabled: binding?.nodes[name]?.rendererEnabled,
          nativeActive: binding?.nodes[name]?.activeInHierarchy,
        });
      }
    for (const c of n.children || []) walk(c, world, name);
  };
  for (const i of json.scenes[json.scene || 0].nodes) walk(i, identity(), "");
  return {
    url,
    json,
    nodes,
    draws,
    materials,
    dispose() {
      for (const m of meshes) for (const p of m) renderer.disposeMesh(p.gpu);
      for (const t of images) renderer.gl.deleteTexture(t);
    },
  };
}
