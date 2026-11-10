// Runtime terrain grids, meshes, materials and collision surfaces.
import { terrainBiome } from "./color-space.js";
import { MeshContact } from "./mesh-contact.js";
import { loadSceneCollisions, colliderMatrix, transformCollisionMesh } from "./scene-collisions.js";
const identity = new Float32Array([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);
const normal = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
const defaultReader = async (url, kind) => {
  const r = await fetch(url);
  if (!r.ok) throw Error(`Native terrain ${r.status}: ${url}`);
  return kind === "json" ? r.json() : r.arrayBuffer();
};
function typed(data, Type) {
  if (data instanceof Type) return data;
  if (ArrayBuffer.isView(data))
    return new Type(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    );
  return new Type(data);
}
export class NativeTerrain {
  constructor(data) {
    this.data = data;
    this.grids = data.grids || [];
    this.meshes = data.meshes || [];
    this.instances = data.instances || [];
    this.chunks = [];
    this.textures = [];
    this.surfaceCells = new Map();
    this.collisionOwners = data.sceneCollisions?.owners || [];
    this.collisionMeshes = data.sceneCollisions?.meshes || [];
    this.dynamicColliders = data.sceneCollisions?.dynamic || [];
    this.sceneOwners=new Map();
    for(const owner of this.collisionOwners)if(!owner.instance) {
      if(!this.sceneOwners.has(owner.name))this.sceneOwners.set(owner.name,[]);
      this.sceneOwners.get(owner.name).push(owner);
    }
    const solidMeshes=[...this.meshes,...this.collisionMeshes];
    this.meshContact = new MeshContact(solidMeshes,this.grids);
    // Added source TrackSection decks are absent from the exported scene GLB.
    // A hash of upward triangles makes their exact rebuilt surface testable too.
    for (const m of solidMeshes) {
      if (/barrier|booster/i.test(m.name + " " + m.sourcePrefab?.name))
        continue;
      if (
        /tube/i.test(m.name + " " + m.sourcePrefab?.name) &&
        !m.collisionIndices
      )
        continue;
      const p = m.positions,
        index = m.collisionIndices || m.indices;
      for (let k = 0; k < index.length; k += 3) {
        const a = index[k] * 3,
          b = index[k + 1] * 3,
          c = index[k + 2] * 3,
          v = [
            p[a],
            p[a + 1],
            p[a + 2],
            p[b],
            p[b + 1],
            p[b + 2],
            p[c],
            p[c + 1],
            p[c + 2],
          ],
          u = [v[3] - v[0], v[4] - v[1], v[5] - v[2]],
          w = [v[6] - v[0], v[7] - v[1], v[8] - v[2]],
          n = normal([
            u[1] * w[2] - u[2] * w[1],
            u[2] * w[0] - u[0] * w[2],
            u[0] * w[1] - u[1] * w[0],
          ]);
        if (n[1] < (m.scenery ? 0.7 : 0.35)) continue;
        const triangle = { v, n, name: m.name, owner:m.owner, scenery:m.scenery };
        for (
          let z = Math.floor(Math.min(v[2], v[5], v[8]) / 8);
          z <= Math.floor(Math.max(v[2], v[5], v[8]) / 8);
          z++
        )
          for (
            let x = Math.floor(Math.min(v[0], v[3], v[6]) / 8);
            x <= Math.floor(Math.max(v[0], v[3], v[6]) / 8);
            x++
          ) {
            const key = x + ":" + z;
            if (!this.surfaceCells.has(key)) this.surfaceCells.set(key, []);
            this.surfaceCells.get(key).push(triangle);
          }
      }
    }
  }
  /** Reader hook makes exactly the browser surface available in Node tests. */
  static async load(reference, reader = defaultReader) {
    const data =
      typeof reference === "string"
        ? await reader(reference, "json")
        : reference.file
          ? await reader(reference.file, "json")
          : reference;
    const grids = await Promise.all(
      (data.grids || []).map(async (g) => ({
        ...g,
        heights: typed(await reader(g.heights, "binary"), Float32Array),
        detail: typed(await reader(g.detail, "binary"), Float32Array),
        colors: g.colors
          ? typed(await reader(g.colors, "binary"), Float32Array)
          : null,
      })),
    );
    const meshes = await Promise.all(
      (data.meshes || []).map(async (m) => ({
        ...m,
        positions: typed(await reader(m.positions, "binary"), Float32Array),
        indices: typed(await reader(m.indices, "binary"), Uint32Array),
        collisionIndices: m.collisionIndices
          ? typed(await reader(m.collisionIndices, "binary"), Uint32Array)
          : null,
        colors: typed(await reader(m.colors, "binary"), Float32Array),
        sourceColors: m.sourceColors
          ? typed(await reader(m.sourceColors, "binary"), Float32Array)
          : null,
        uv: m.uv ? typed(await reader(m.uv, "binary"), Float32Array) : null,
      })),
    );
    const sceneCollisions=data.id?await loadSceneCollisions(data.id,data.instances||[],reader):null;
    return NativeTerrain.fromData({ ...data, grids, meshes, sceneCollisions });
  }
  static fromData(data) {
    return new NativeTerrain(data);
  }
  updateColliders(body) {
    const moving=this.dynamicColliders.filter(d=>!d.owner.hit && Math.abs(d.owner.baseMatrix[14]-body.z)<20);
    this.dynamicContact=moving.length?new MeshContact(moving.map(d=>transformCollisionMesh(d.shape,colliderMatrix(d.owner,body.elapsed||0),d.owner))):null;
  }
  sceneOwner(path,world) {
    const owners=this.sceneOwners.get(path)||[];
    return owners.find(o=>o.baseMatrix && Math.hypot(o.baseMatrix[12]-world[12],o.baseMatrix[13]-world[13],o.baseMatrix[14]-world[14])<.02)||owners[0];
  }
  sampleGrid(g, x, z) {
    const u = (x - g.origin[0]) / g.step[0],
      v = (z - g.origin[1]) / g.step[1],
      ix = Math.floor(u),
      iz = Math.floor(v);
    if (ix < 0 || iz < 0 || ix >= g.nx - 1 || iz >= g.nz - 1) return null;
    const a = iz * g.nx + ix,
      ids = [a, a + 1, a + g.nx, a + g.nx + 1],
      h = ids.map((i) => g.heights[i]);
    if (h.some((v) => !Number.isFinite(v))) return null;
    const tx = u - ix,
      tz = v - iz,
      // Match build()'s p-r-q / q-r-s diagonal. Bilinear height creates a
      // different surface, especially at carved riverbanks and steep edges.
      lower = tx + tz <= 1,
      weights = lower ? [1-tx-tz, tx, tz, 0] : [0, 1-tz, 1-tx, tx+tz-1],
      height =
        h.reduce((s, v, i) => s + v * weights[i], 0) +
        (g.visualHeightOffset || 0),
      dx = (lower ? h[1]-h[0] : h[3]-h[2]) / g.step[0],
      dz = (lower ? h[2]-h[0] : h[3]-h[1]) / g.step[1],
      detailWeights = [(1-tx)*(1-tz), tx*(1-tz), (1-tx)*tz, tx*tz],
      detail = [0, 1, 2, 3].map((c) =>
        ids.reduce((s, i, k) => s + g.detail[i * 4 + c] * detailWeights[k], 0),
      );
    return {
      height,
      normal: normal([-dx, 1, -dz]),
      road: detail[3] > 0.08 || g.generator === "TrackSection",
      detail,
      water: !!g.water,
      source: "native-environment",
      generator: g.generator,
    };
  }
  sample(x, z, maxHeight = Infinity) {
    let best = null;
    for (const g of this.grids) {
      // TrackSection already has exact triangles below. Its old hidden
      // height raster bridged real gaps and joined overlapping road decks.
      if (g.hidden) continue;
      const s = this.sampleGrid(g, x, z);
      if (s && s.height <= maxHeight && (!best || s.height > best.height)) best = s;
    }
    for (const t of this.surfaceCells.get(
      Math.floor(x / 8) + ":" + Math.floor(z / 8),
    ) || []) {
      if(t.owner?.hit || (this.ignorePassThrough && t.owner?.applePassThrough))continue;
      const a = t.v,
        d = (a[5] - a[8]) * (a[0] - a[6]) + (a[6] - a[3]) * (a[2] - a[8]);
      if (Math.abs(d) < 1e-9) continue;
      const u = ((a[5] - a[8]) * (x - a[6]) + (a[6] - a[3]) * (z - a[8])) / d,
        v = ((a[8] - a[2]) * (x - a[6]) + (a[0] - a[6]) * (z - a[8])) / d,
        w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-5) continue;
      const height = u * a[1] + v * a[4] + w * a[7];
      if (height <= maxHeight && (!best || height > best.height))
        best = {
          height,
          normal: t.n,
          road: !t.scenery,
          detail: [0, 0, 0, 1],
          water: false,
          source: t.scenery ? "native-scene-collider" : "native-section",
          generator: t.name,
        };
    }
    return best;
  }
  build(renderer) {
    this.dispose(renderer);
    for (const grid of this.grids) {
      if (grid.hidden) continue;
      const ref = grid.sourceMaterial;
      const exact =
        renderer.nativeSurfaces?.manifest?.terrainMaterials?.[
          ref?.file + ":" + ref?.pathId
        ];
      const native = exact && renderer.nativeSurfaces.supports(exact.shader);
      const detailTexture = native
        ? renderer.nativeSurfaces.detailTexture(grid)
        : null;
      if (detailTexture) this.textures.push(detailTexture);
      const nativeMaterial = native
        ? {
            shader: exact.shader,
            nativeProperties: exact,
            textures: { _SDFTex: detailTexture },
            uniforms: {
              _SDFCenterXZ: [
                -(grid.origin[0] + ((grid.nx - 1) * grid.step[0]) / 2),
                grid.origin[1] + ((grid.nz - 1) * grid.step[1]) / 2,
              ],
              _SDFSizeXZ: [grid.nx * grid.step[0], grid.nz * grid.step[1]],
            },
          }
        : null;
      const rows = Math.max(2, Math.floor(40 / grid.step[1]));
      for (let z0 = 0; z0 < grid.nz - 1; z0 += rows) {
        const z1 = Math.min(grid.nz - 1, z0 + rows),
          positions = [],
          normals = [],
          colors = [],
          sideColors = [],
          spreads = [],
          indices = [],
          map = new Map();
        const add = (ix, iz) => {
          const source = iz * grid.nx + ix;
          if (map.has(source)) return map.get(source);
          const target = positions.length / 3,
            x = grid.origin[0] + ix * grid.step[0],
            z = grid.origin[1] + iz * grid.step[1],
            h = grid.heights[source],
            left = grid.heights[source - (ix > 0 ? 1 : 0)],
            right = grid.heights[source + (ix < grid.nx - 1 ? 1 : 0)],
            back = grid.heights[source - (iz > 0 ? grid.nx : 0)],
            front = grid.heights[source + (iz < grid.nz - 1 ? grid.nx : 0)],
            dx =
              Number.isFinite(left) && Number.isFinite(right)
                ? (right - left) / (2 * grid.step[0])
                : 0,
            dz =
              Number.isFinite(back) && Number.isFinite(front)
                ? (front - back) / (2 * grid.step[1])
                : 0;
          positions.push(x, h + (grid.visualHeightOffset || 0), z);
          normals.push(...normal([-dx, 1, -dz]));
          if (native && exact.shader === "EnvKit/Level1Terrain") {
            const biome = terrainBiome(this.data.lighting.globals, z);
            colors.push(...biome.top);
            sideColors.push(...biome.side);
            spreads.push(biome.spread, 0);
          } else
            colors.push(
              ...(grid.colors?.subarray(source * 4, source * 4 + 4) || [
                1, 1, 1, 1,
              ]),
            );
          map.set(source, target);
          return target;
        };
        for (let iz = z0; iz < z1; iz++)
          for (let ix = 0; ix < grid.nx - 1; ix++) {
            let a = iz * grid.nx + ix;
            if (
              [a, a + 1, a + grid.nx, a + grid.nx + 1].some(
                (i) => !Number.isFinite(grid.heights[i]),
              )
            )
              continue;
            const p = add(ix, iz),
              q = add(ix + 1, iz),
              r = add(ix, iz + 1),
              s = add(ix + 1, iz + 1);
            indices.push(p, r, q, q, r, s);
          }
        if (indices.length)
          this.chunks.push({
            gpu: renderer.mesh(
              new Float32Array(positions),
              new Float32Array(normals),
              sideColors.length ? new Float32Array(sideColors) : null,
              new Uint32Array(indices),
              new Float32Array(colors),
              {
                uvSize: sideColors.length ? 4 : 2,
                uv1: spreads.length ? new Float32Array(spreads) : null,
              },
            ),
            minZ: grid.origin[1] + z0 * grid.step[1],
            maxZ: grid.origin[1] + z1 * grid.step[1],
            material: nativeMaterial || { color: [1, 1, 1, 1] },
            water: grid.water,
          });
      }
    }
    for (const m of this.meshes) {
      const exact = m.materialReference,
        useNative =
          !!exact &&
          !!m.sourceColors &&
          renderer.nativeSurfaces?.supports(exact.shader),
        material = useNative
          ? {
              color: exact.colors?._Color || [1, 1, 1, 1],
              shader: exact.shader,
              nativeEvidence: exact.file + ":" + exact.pathId,
              nativeProperties: exact,
            }
          : { color: [1, 1, 1, 1] };
      this.chunks.push({
        gpu: renderer.mesh(
          m.positions,
          null,
          m.uv,
          m.indices,
          useNative ? m.sourceColors : m.colors,
        ),
        minZ: m.bounds.min[2],
        maxZ: m.bounds.max[2],
        material,
        sourceMaterial: m.material,
      });
    }
    return this;
  }
  draw(renderer, carZ) {
    for (const c of this.chunks)
      if (!c.water && c.maxZ >= carZ - 55 && c.minZ <= carZ + 350)
        renderer.draw(c.gpu, identity, c.material);
  }
  drawWater(renderer, carZ) {
    const visible = this.chunks.filter(
      (c) => c.water && c.maxZ >= carZ - 55 && c.minZ <= carZ + 350,
    );
    if (!visible.length) return;
    renderer.linearFrame.resolveDepth();
    const gl = renderer.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    for (const c of visible.sort((a, b) => b.minZ - a.minZ))
      renderer.draw(c.gpu, identity, c.material);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }
  dispose(renderer) {
    for (const c of this.chunks) renderer.disposeMesh(c.gpu);
    for (const texture of this.textures) renderer.gl.deleteTexture(texture);
    this.textures = [];
    this.chunks = [];
  }
}
