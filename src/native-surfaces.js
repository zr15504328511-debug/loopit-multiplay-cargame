import { identity, normalize } from "./math.js";
import { linearColor } from "./color-space.js";

const SUPPORTED = new Set([
  "EnvKit/Bridge",
  "Custom/Road",
  "Custom/WorldTextured_Triplanar",
  "Custom/WorldTextured_TriplanarNoShadowCaster",
  "Custom/CityTrack",
  "EnvKit/Level1Terrain",
  "EnvKit/SnowyTerrain",
  "EnvKit/WestCoastTerrain",
  "EnvKit/FormulaTerrain",
  "EnvKit/RiverlandTerrain_Standard_Waterfall_FlowBands",
]);
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const reflectionX = (m) => {
  const out = new Float32Array(m);
  for (let i = 0; i < 16; i += 4) out[i] = -out[i];
  return out;
};
const reflectedVP = (m) => {
  const out = new Float32Array(m);
  for (let i = 0; i < 4; i++) out[i] = -out[i];
  return out;
};
function inverseAffine(m) {
  const a = m[0],
    b = m[4],
    c = m[8],
    d = m[1],
    e = m[5],
    f = m[9],
    g = m[2],
    h = m[6],
    i = m[10];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) return identity();
  const k = 1 / det,
    o = new Float32Array([
      (e * i - f * h) * k,
      (f * g - d * i) * k,
      (d * h - e * g) * k,
      0,
      (c * h - b * i) * k,
      (a * i - c * g) * k,
      (b * g - a * h) * k,
      0,
      (b * f - c * e) * k,
      (c * d - a * f) * k,
      (a * e - b * d) * k,
      0,
      0,
      0,
      0,
      1,
    ]);
  for (let j = 0; j < 3; j++)
    o[12 + j] = -(o[j] * m[12] + o[4 + j] * m[13] + o[8 + j] * m[14]);
  return o;
}

export class NativeSurfaces {
  static supports(shaderName) {
    return SUPPORTED.has(shaderName);
  }
  supports(shaderName) {
    return this.programs.has(shaderName);
  }
  static async create(renderer) {
    const response = await fetch("/assets/native-surfaces/manifest.json");
    if (!response.ok) throw Error("Native surface manifest " + response.status);
    const manifest = await response.json(),
      source = await Promise.all(
        Object.entries(manifest.programs).map(async ([name, p]) => {
          const stages = await Promise.all(
            [p.vertex, p.fragment].map(async (file) => {
              const r = await fetch("/" + file);
              if (!r.ok) throw Error("Native surface shader " + file);
              return r.text();
            }),
          );
          return [name, p, stages];
        }),
      );
    const result = new NativeSurfaces(renderer, manifest, source);
    await Promise.all(
      Object.entries(manifest.textures).map(async ([key, t]) => {
        const levels = await Promise.all(
          (t.mips || [t]).map(async (mip) => {
            const r = await fetch("/" + mip.file);
            if (!r.ok) throw Error("Native surface texture " + mip.file);
            const bytes = new Uint8Array(await r.arrayBuffer());
            if (bytes.length !== mip.width * mip.height * 4)
              throw Error("Invalid native RGBA " + key);
            return { ...mip, bytes };
          }),
        );
        result.textures.set(
          key,
          result.texture(t.width, t.height, levels[0].bytes, { ...t, levels }),
        );
      }),
    );
    return result;
  }
  constructor(renderer, manifest, source) {
    this.r = renderer;
    this.gl = renderer.gl;
    this.manifest = manifest;
    this.programs = new Map();
    this.textures = new Map();
    this.globalCache = new WeakMap();
    const gl = this.gl;
    for (const [name, config, stages] of source) {
      const p = gl.createProgram(),
        shaders = [];
      for (let i = 0; i < 2; i++) {
        const s = gl.createShader(i ? gl.FRAGMENT_SHADER : gl.VERTEX_SHADER);
        gl.shaderSource(s, stages[i]);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
          throw Error(name + ": " + gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
        shaders.push(s);
      }
      for (const [n, location] of Object.entries({
        in_POSITION0: 0,
        in_NORMAL0: 1,
        in_TEXCOORD0: 2,
        in_COLOR0: 3,
        in_TEXCOORD1: 4,
      }))
        gl.bindAttribLocation(p, location, n);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw Error(name + ": " + gl.getProgramInfoLog(p));
      shaders.forEach((s) => gl.deleteShader(s));
      const uniforms = new Map();
      for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
        const u = gl.getActiveUniform(p, i);
        uniforms.set(u.name.replace(/\[0\]$/, ""), {
          type: u.type,
          size: u.size,
          location: gl.getUniformLocation(p, u.name),
        });
      }
      this.programs.set(name, {
        program: p,
        uniforms,
        defaults: config.defaults,
        colorProperties: new Set(config.colorProperties),
      });
    }
    this.white = this.texture(1, 1, new Uint8Array([255, 255, 255, 255]));
    this.depth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depth);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT16,
      1,
      1,
      0,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_SHORT,
      new Uint16Array([65535]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_COMPARE_MODE,
      gl.COMPARE_REF_TO_TEXTURE,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  }
  texture(width, height, bytes, metadata = {}) {
    const gl = this.gl,
      t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    const levels = metadata.levels || [{ width, height, bytes }],
      sampler = metadata.sampler || {};
    for (let mip = 0; mip < levels.length; mip++) {
      const l = levels[mip];
      gl.texImage2D(
        gl.TEXTURE_2D,
        mip,
        metadata.colorSpace === 1 ? gl.SRGB8_ALPHA8 : gl.RGBA8,
        l.width,
        l.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        l.bytes,
      );
    }
    const filter = sampler.m_FilterMode ?? 1,
      mipped = levels.length > 1;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels.length - 1);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mipped
        ? [
            gl.NEAREST_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_LINEAR,
          ][filter]
        : filter === 0
          ? gl.NEAREST
          : gl.LINEAR,
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      filter === 0 ? gl.NEAREST : gl.LINEAR,
    );
    const wrap = (v) =>
      [gl.REPEAT, gl.CLAMP_TO_EDGE, gl.MIRRORED_REPEAT][v] || gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap(sampler.m_WrapU));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap(sampler.m_WrapV));
    return t;
  }
  detailTexture(grid) {
    const gl = this.gl,
      texture = gl.createTexture(),
      data = new Float32Array(grid.detail.length);
    // Original shaders sample Unity world X. CPU grids are in reflected glTF X.
    for (let z = 0; z < grid.nz; z++)
      for (let x = 0; x < grid.nx; x++) {
        const from = (z * grid.nx + x) * 4,
          to = (z * grid.nx + grid.nx - 1 - x) * 4;
        data.set(grid.detail.subarray(from, from + 4), to);
      }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      grid.nx,
      grid.nz,
      0,
      gl.RGBA,
      gl.FLOAT,
      data,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }
  globalValues(environment) {
    const g = environment?.lighting?.globals;
    if (!g) return { values: {}, textures: {} };
    if (this.globalCache.has(g)) return this.globalCache.get(g);
    const values = {},
      textures = {};
    for (const c of g.globalColors || []) {
      values["_Global" + c.name + "1"] = c.color1;
      values["_Global" + c.name + "2"] = c.color2;
    }
    for (const c of g.globalFloats || []) values["_Global" + c.name] = c.value;
    for (const c of g.globalColorArrays || [])
      values["_Global" + c.name] = c.colors.flatMap((v) => [
        v[0],
        v[1],
        v[2],
        c.alphaIsSignedMag ? v[3] * 2 - 1 : v[3],
      ]);
    for (const c of g.globalFloatArrays || [])
      values["_Global" + c.name] = c.values;
    for (const c of g.globalTextures || [])
      textures["_Global" + c.name] = this.textures.get(
        c.texture.file + ":" + c.texture.pathId,
      );
    const result = { values, textures };
    this.globalCache.set(g, result);
    return result;
  }
  set(p, name, value) {
    const u = p.uniforms.get(name),
      gl = this.gl;
    if (!u || value == null) return;
    if (typeof value === "number") {
      if (finite(value) && u.type === gl.FLOAT) gl.uniform1f(u.location, value);
      return;
    }
    if (!value.length || Array.from(value).some((x) => !finite(x))) return;
    const max =
        u.size *
        (u.type === gl.FLOAT_VEC4
          ? 4
          : u.type === gl.FLOAT_VEC3
            ? 3
            : u.type === gl.FLOAT_VEC2
              ? 2
              : 1),
      v = value.length > max ? value.slice(0, max) : value;
    if (u.type === gl.FLOAT) gl.uniform1fv(u.location, v);
    else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(u.location, v);
    else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(u.location, v);
    else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(u.location, v);
  }
  draw(gpu, world, material) {
    const p = this.programs.get(material.shader);
    if (!p) return false;
    const gl = this.gl,
      r = this.r,
      n = material.nativeProperties || {},
      globals = this.globalValues(r.environment),
      sun = r.lighting?.sun;
    gl.useProgram(p.program);
    gl.bindVertexArray(gpu.vao);
    const set = (name, value) => this.set(p, name, value);
    // The original procedural texture coordinates need Unity world X, not glTF X.
    const unityWorld = reflectionX(world);
    set("hlslcc_mtx4x4unity_ObjectToWorld", unityWorld);
    set("hlslcc_mtx4x4unity_WorldToObject", inverseAffine(unityWorld));
    set("hlslcc_mtx4x4unity_MatrixVP", reflectedVP(r.vp));
    set("_WorldSpaceCameraPos", [-r.eye[0], r.eye[1], r.eye[2]]);
    const materialValue = (name, value) =>
      p.colorProperties.has(name) ? linearColor(value) : value;
    for (const [name, value] of Object.entries(p.defaults))
      set(name, materialValue(name, value));
    for (const [name, value] of Object.entries(n.floats || {}))
      set(name, value);
    for (const [name, value] of Object.entries(n.colors || {}))
      set(name, materialValue(name, value));
    const direction = sun?.directionGLTF || normalize([-0.45, 0.85, -0.3]);
    set("_WorldSpaceLightPos0", [-direction[0], direction[1], direction[2], 0]);
    set("_LightColor0", sun?.colorIntensity || [0.85, 0.85, 0.85, 1]);
    const ambient = r.lighting?.ambientRGB || [0.4, 0.4, 0.4];
    for (let i = 0; i < 3; i++) {
      set("unity_SHA" + "rgb"[i], [0, 0, 0, ambient[i]]);
      set("unity_SHB" + "rgb"[i], [0, 0, 0, 0]);
    }
    set("unity_SHC", [0, 0, 0, 0]);
    // Runtime SH is packed for reflected glTF X; reverse those terms for Unity normals.
    for (const [name, value] of Object.entries(r.lighting?.ambientSH || {})) {
      const v = [...value];
      if (/^unity_SHA/.test(name)) v[0] *= -1;
      if (/^unity_SHB/.test(name)) {
        v[0] *= -1;
        v[3] *= -1;
      }
      set(name, v);
    }
    const fog = r.lighting?.skybox,
      sky = r.sky || [0.7, 0.85, 0.85];
    set("_SkyboxTopColor", fog?.topColor || [...sky, 1]);
    set("_SkyboxHorizonColor", fog?.horizonColor || [...sky, 1]);
    set("_SkyboxBottomColor", fog?.bottomColor || [...sky, 1]);
    set("_FogStart", fog?.fogStart ?? r.fogFar * 0.45);
    set("_FogRcpRange", 1 / Math.max(0.0001, fog?.fogRange ?? r.fogFar * 0.55));
    set("_FogEditorMultiplier", fog?.maxFogOpacity ?? 1);
    set("_StaticShadowStrength", 0);
    set("_DynamicShadowStrength", 0);
    set("_StaticShadowDebugMode", 0);
    set("_ShadowFadeLightDir", [0, 1, 0]);
    set("hlslcc_mtx4x4_StaticShadowMatrix", identity());
    set("hlslcc_mtx4x4_DynamicShadowMatrix", identity());
    set("_DynamicShadowEdgeFadeInvWidth", [1, 1]);
    // Safe per-draw fallbacks for a level omitting a global; exact globals override below.
    set("_GlobalRoadColor1", n.colors?._RoadColor1 || [0.5, 0.5, 0.5, 1]);
    set("_GlobalRoadColor2", n.colors?._RoadColor2 || [0.7, 0.7, 0.7, 1]);
    set("_GlobalTopTiling", n.floats?._TopTiling ?? 0.2);
    set("_GlobalSideTiling", 0.1);
    set("_GlobalCurbColor1", n.colors?._CurbColorRed || [1, 0.5, 0.5, 1]);
    set("_GlobalCurbColor2", n.colors?._CurbColorWhite || [1, 1, 1, 1]);
    set("_GlobalCurbTiling", n.floats?._CurbTiling ?? 0.5);
    set("_GlobalMainColor", [0.6, 0.5, 0.2, 0]);
    set("_GlobalSideColor", [0.6, 0.5, 0.2, 0]);
    set("_GlobalDetailColor", new Array(4).fill([0.6, 0.5, 0.2, 0]).flat());
    set("_GlobalTopSpreadsArr", [0, 0, 0, 0]);
    for (const [name, value] of Object.entries(globals.values))
      set(name, value);
    // A missing finishDistance disables the native checker threshold instead of drawing it at z=0.
    set("_FinishDistance", finite(r.finishDistance) ? r.finishDistance : 1e8);
    const time = r.time || 0,
      near = 0.15,
      far = 2000;
    set("_Time", [time / 20, time, time * 2, time * 3]);
    set("_ProjectionParams", [1, near, far, 1 / far]);
    set("_ZBufferParams", [
      1 - far / near,
      far / near,
      (1 - far / near) / far,
      1 / near,
    ]);
    set("unity_SpecCube0_HDR", [1, 1, 0, 0]);
    const shadows = r.shadows?.bindings(true);
    for (const [name, value] of Object.entries(shadows?.values || {}))
      set(name, value);
    for (const [name, value] of Object.entries(material.uniforms || {}))
      set(name, value);
    let unit = 0;
    for (const [name, u] of p.uniforms) {
      if (u.type === gl.SAMPLER_CUBE) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, r.nativePBS.cube);
        gl.uniform1i(u.location, unit++);
        continue;
      }
      if (u.type !== gl.SAMPLER_2D && u.type !== gl.SAMPLER_2D_SHADOW) continue;
      let texture =
        material.textures?.[name] ||
        shadows?.textures[name] ||
        (u.type === gl.SAMPLER_2D_SHADOW ? this.depth : globals.textures[name]);
      if (!texture && n.textures?.[name]) {
        const t = n.textures[name];
        texture = this.textures.get(t.file + ":" + t.pathId);
        set(name + "_ST", [...(t.scale || [1, 1]), ...(t.offset || [0, 0])]);
      }
      if (!texture && name === "_MainTex") texture = material.texture;
      if (name === "_CameraDepthTexture") texture = r.linearFrame.depth;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture || this.white);
      gl.uniform1i(u.location, unit++);
    }
    gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_INT, 0);
    r.drawCalls++;
    gl.activeTexture(gl.TEXTURE0);
    return true;
  }
}
