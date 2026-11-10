import { model, mul, point } from './math.js';

// RGB values are sRGB material/UI colors. Renderer.draw
// recognizes nativeEvidence and decodes them before the linear scene pass.
export const ROOM_ART_PALETTE = Object.freeze({
  wood: [0.8113207817, 0.6596826911, 0.3788714707, 1],
  gold: [1, 0.6923077106, 0, 1],
  blue: [0, 0.870588, 1, 1],
  green: [0, 0.980392, 0.254902, 1],
  yellowText: [1, 0.819608, 0, 1],
});

export const ROOM_ART_ASSETS = Object.freeze({
  sling: 'assets/room/art-v2/slingshot-native.glb',
  lock: 'assets/native-ui/LockIcon-191.png',
  acacia: 'assets/prefabs/acacia-tree-l-03.glb',
  pine: 'assets/prefabs/pine-tree-s-08.glb',
  palm: 'assets/prefabs/palm-tree-coconut-l-01.glb',
  rock: 'assets/prefabs/rock-square-m-05.glb',
});

export const ROOM_SLING_METRICS = Object.freeze({
  defaultScale: 2.2,
  // All dimensions below are native model units, before placement.scale.
  width: 3.25, height: 2, depth: .25, clearWidth: 2.75,
  postCenters: [[-1.5, 0, 0], [1.5, 0, 0]],
  attachmentHeight: 1.796,
  launchDirection: [0, 0, 1],
});

const nativeColor = (color, evidence = 'room-art-v2:derived') => ({ color, nativeEvidence: evidence });
const placementScale = (scale, fallback = 1) => Array.isArray(scale) ? scale : [scale ?? fallback, scale ?? fallback, scale ?? fallback];
const placementMatrix = (p, fallback = 1) => model([p.x ?? 0, p.y ?? 0, p.z ?? 0], p.yaw ?? 0, 0, 0, placementScale(p.scale, fallback));

function cylinder(renderer, sides = 8) {
  const positions = [], normals = [], indices = [];
  const add = (p, n) => { positions.push(...p); normals.push(...n); return positions.length / 3 - 1; };
  // Unit radius in XY; thickness runs from -.5 to +.5 in Z.
  for (let i = 0; i < sides; i++) {
    const a = i * Math.PI * 2 / sides, b = (i + 1) * Math.PI * 2 / sides;
    const pa = [Math.cos(a), Math.sin(a)], pb = [Math.cos(b), Math.sin(b)];
    const n = [Math.cos((a + b) / 2), Math.sin((a + b) / 2), 0];
    const j = positions.length / 3;
    for (const [p, z] of [[pa, -.5], [pb, -.5], [pb, .5], [pa, .5]]) add([...p, z], n);
    indices.push(j, j + 1, j + 2, j, j + 2, j + 3);
    for (const z of [-.5, .5]) {
      const k = add([0, 0, z], [0, 0, Math.sign(z)]);
      add([...pa, z], [0, 0, Math.sign(z)]); add([...pb, z], [0, 0, Math.sign(z)]);
      indices.push(k, k + 1, k + 2);
    }
  }
  return renderer.mesh(positions, normals, null, new Uint32Array(indices));
}

function ropeMesh(renderer) {
  const positions = [], indices = [], radius = .035, sides = 6, steps = 8;
  // The original exported rope mesh is empty. This fixed curved tube is an
  // explicit lobby approximation; native posts and knots remain unchanged.
  for (const side of [-1, 1]) {
    const offset = positions.length / 3;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps, x = side * 1.5 * (1 - t), y = 1.796 + (.92 - 1.796) * t - .13 * Math.sin(t * Math.PI), z = -1.35 * t;
      const dx = -side * 1.5, dy = .92 - 1.796 - .13 * Math.PI * Math.cos(t * Math.PI), dz = -1.35;
      const length = Math.hypot(dx, dy, dz), tangent = [dx / length, dy / length, dz / length];
      const crossLength = Math.hypot(tangent[2], tangent[0]);
      const n = [-tangent[2] / crossLength, 0, tangent[0] / crossLength];
      const b = [tangent[1] * n[2], tangent[2] * n[0] - tangent[0] * n[2], -tangent[1] * n[0]];
      for (let k = 0; k < sides; k++) {
        const angle = k * Math.PI * 2 / sides;
        positions.push(...[x, y, z].map((v, i) => v + radius * (Math.cos(angle) * n[i] + Math.sin(angle) * b[i])));
      }
      if (j) for (let k = 0; k < sides; k++) {
        const a = offset + (j - 1) * sides + k, b = offset + (j - 1) * sides + (k + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  return renderer.mesh(positions, null, null, new Uint32Array(indices));
}

function nativeSlingView(asset) {
  const materials = new Map((asset.json.materials || []).map(m => [m.name, m.extras?.roomArtNativeMaterial]));
  return { ...asset, draws: asset.draws.map(d => {
    const m = materials.get(d.material.name);
    return { ...d, material: m ? { ...d.material, color: m.colors._Color, shader: m.shader,
      metallic: m.floats._Metallic, smoothness: m.floats._Glossiness,
      nativeEvidence: `${m.file}:${m.pathId}`, nativeProperties: m,
    } : d.material };
  }) };
}

/**
 * loadAsset receives manifest-style paths WITHOUT a leading slash, e.g.
 * p => loadGLB('/' + p, renderer). The caller owns/caches those GLB assets.
 * This module owns only its rope/sign meshes and lock texture.
 */
export async function loadRoomArt(renderer, loadAsset, manifest = {}) {
  const prefabNames = { acacia: 'Acacia_Tree_l_03', pine: 'Pine_Tree_s_08', palm: 'Palm_Tree_Coconut_l_01', rock: 'Rock_Square_m_05' };
  const paths = { sling: ROOM_ART_ASSETS.sling, ...Object.fromEntries(Object.entries(prefabNames).map(([key, name]) => [key, manifest.prefabs?.[name] || ROOM_ART_ASSETS[key]])) };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => [key, await loadAsset(path)]));
  const loaded = Object.fromEntries(entries), sling = nativeSlingView(loaded.sling);
  const response = await fetch('/' + ROOM_ART_ASSETS.lock);
  if (!response.ok) throw Error(`Room lock sprite: ${response.status}`);
  const lockTexture = renderer.texture(await createImageBitmap(await response.blob()));
  // Avoid edge wrap when the transparent sprite is viewed obliquely.
  renderer.gl.bindTexture(renderer.gl.TEXTURE_2D, lockTexture);
  renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_WRAP_S, renderer.gl.CLAMP_TO_EDGE);
  renderer.gl.texParameteri(renderer.gl.TEXTURE_2D, renderer.gl.TEXTURE_WRAP_T, renderer.gl.CLAMP_TO_EDGE);
  const disk = cylinder(renderer), rope = ropeMesh(renderer);
  const icon = renderer.mesh([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0],
    [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
    [0, 1, 1, 1, 1, 0, 0, 0], new Uint32Array([0, 1, 2, 0, 2, 3]));
  const gold = nativeColor(ROOM_ART_PALETTE.gold, 'sharedassets1.assets:37');
  const charcoal = nativeColor([.12, .19, .28, 1]);
  const whiteLock = { color: [1, 1, 1, 1], texture: lockTexture, alpha: 'MASK' };
  const scenery = Object.fromEntries(Object.keys(prefabNames).map(k => [k, loaded[k]]));
  let disposed = false;

  function drawLock(r, p = {}) {
    if (disposed || r.shadowPass) return;
    const { x = 0, y = 0, z = 0, time = 0, size = 1.6 } = p;
    const eye = r.eye;
    const yaw = p.billboard === false || !eye ? p.yaw ?? 0 : Math.atan2(eye[0] - x, eye[2] - z);
    const root = model([x, y + Math.sin(time * 1.7) * .035, z], yaw);
    r.draw(disk, mul(root, model([0, 0, 0], 0, 0, 0, [size * .55, size * .65, size * .11])), gold);
    r.draw(disk, mul(root, model([0, 0, size * .062], 0, 0, 0, [size * .49, size * .59, size * .025])), charcoal);
    r.draw(icon, mul(root, model([0, 0, size * .082], 0, 0, 0, [size * .57, size * .74, 1])), whiteLock, 1);
  }

  function drawSling(r, p = {}) {
    if (disposed) return;
    const root = placementMatrix(p, ROOM_SLING_METRICS.defaultScale);
    r.asset(sling, root);
    r.draw(rope, root, gold);
    if (p.feet !== false) for (const side of [-1, 1])
      r.draw(disk, mul(root, model([side * 1.5, .025, 0], 0, Math.PI / 2, 0, [.29, .29, .1])), gold);
    if (p.locked) {
      const anchor = point(root, [0, 1.42, -.2]);
      const scale = placementScale(p.scale, ROOM_SLING_METRICS.defaultScale);
      drawLock(r, { x: anchor[0], y: anchor[1], z: anchor[2], time: p.time, yaw: p.yaw, size: .78 * Math.min(...scale) });
    }
  }

  function drawScenery(r, placements = []) {
    if (disposed) return;
    const groups = new Map();
    for (const p of placements) {
      const key = p.kind || p.type || p.asset;
      const normalized = Object.keys(prefabNames).find(k => k === key || prefabNames[k] === key);
      const asset = scenery[normalized];
      if (!asset) throw Error(`Unknown room scenery '${key}'; use acacia, pine, palm or rock.`);
      if (!groups.has(asset)) groups.set(asset, []);
      groups.get(asset).push(placementMatrix(p));
    }
    for (const [asset, roots] of groups) r.instances(asset, roots);
  }

  return {
    drawSling, drawLock, drawScenery,
    assets: { ...scenery, sling }, paths, palette: ROOM_ART_PALETTE, metrics: ROOM_SLING_METRICS,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of [disk, rope, icon]) renderer.disposeMesh(mesh);
      renderer.gl.deleteTexture(lockTexture);
      // Cached GLBs belong to loadAsset; disposing them here would break the map.
    },
  };
}
