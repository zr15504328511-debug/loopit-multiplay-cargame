import { identity, normalize } from "./math.js";
import { linearColor } from "./color-space.js";
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
export class NativePBS {
  static async create(renderer) {
    const source = await Promise.all(
      ["pbs.vert", "pbs.frag"].map(async (f) => {
        const r = await fetch("/assets/native-shaders/" + f);
        if (!r.ok) throw Error("Native shader " + r.status);
        return r.text();
      }),
    );
    return new NativePBS(renderer, source);
  }
  constructor(renderer, [vs, fs]) {
    this.r = renderer;
    const gl = (this.gl = renderer.gl);
    const compile = (kind, code) => {
      const s = gl.createShader(kind);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error("Native PBS: " + gl.getShaderInfoLog(s));
      return s;
    };
    const p = (this.program = gl.createProgram()),
      v = compile(gl.VERTEX_SHADER, vs),
      f = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    for (const [n, i] of Object.entries({
      in_POSITION0: 0,
      in_NORMAL0: 1,
      in_TEXCOORD0: 2,
      in_TEXCOORD1: 4,
    }))
      gl.bindAttribLocation(p, i, n);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw Error("Native PBS link: " + gl.getProgramInfoLog(p));
    gl.deleteShader(v);
    gl.deleteShader(f);
    this.u = new Map();
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const u = gl.getActiveUniform(p, i);
      this.u.set(
        u.name.replace(/\[0\]$/, ""),
        gl.getUniformLocation(p, u.name),
      );
    }
    const white = (this.white = gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, white);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const depth = (this.depth = gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, depth);
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
    this.defaultCube = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.defaultCube);
    for (let face = 0; face < 6; face++)
      gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([150, 160, 145, 255]),
      );
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.cubes = new Map();
    this.cube = this.defaultCube;
    this.cubePath = null;
  }
  async reflection(reflection) {
    if (!reflection) {
      this.cube = this.defaultCube;
      return;
    }
    const mips = reflection.mips || [{ file: reflection }],
      path = mips[0].file;
    if (!this.cubes.has(path))
      this.cubes.set(
        path,
        (async () => {
          const bitmaps = await Promise.all(
            mips.map(async (mip) => {
              const response = await fetch("/" + mip.file);
              if (!response.ok) throw Error("Reflection " + mip.file);
              return createImageBitmap(await response.blob(), {
                colorSpaceConversion: "none",
              });
            }),
          );
          const gl = this.gl,
            cube = gl.createTexture();
          for (let mip = 0; mip < bitmaps.length; mip++) {
            const bitmap = bitmaps[mip];
            if (bitmap.height !== bitmap.width * 6)
              throw Error("Unexpected original cubemap strip " + path);
            for (let face = 0; face < 6; face++) {
              const image = await createImageBitmap(
                bitmap,
                0,
                face * bitmap.width,
                bitmap.width,
                bitmap.width,
                { colorSpaceConversion: "none" },
              );
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
              gl.texImage2D(
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                mip,
                reflection.colorSpace === 1 ? gl.SRGB8_ALPHA8 : gl.RGBA8,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image,
              );
              image.close();
            }
            bitmap.close();
          }
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
          if (mips.length === 1) gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
          gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR,
          );
          gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_MAG_FILTER,
            gl.LINEAR,
          );
          gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_S,
            gl.CLAMP_TO_EDGE,
          );
          gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_WRAP_T,
            gl.CLAMP_TO_EDGE,
          );
          return cube;
        })(),
      );
    this.cube = await this.cubes.get(path);
    this.cubePath = path;
  }
  uniform(name, value) {
    const location = this.u.get(name);
    if (location === undefined) return;
    const gl = this.gl;
    if (typeof value === "number") gl.uniform1f(location, value);
    else if (value.length === 2) gl.uniform2fv(location, value);
    else if (value.length === 3) gl.uniform3fv(location, value);
    else gl.uniform4fv(location, value);
  }
  draw(gpu, world, material) {
    const gl = this.gl,
      r = this.r;
    gl.useProgram(this.program);
    gl.bindVertexArray(gpu.vao);
    const set = (n, v) => this.uniform(n, v),
      sun = r.lighting?.sun;
    set("hlslcc_mtx4x4unity_ObjectToWorld", world);
    set("hlslcc_mtx4x4unity_WorldToObject", inverseAffine(world));
    set("hlslcc_mtx4x4unity_MatrixVP", r.vp);
    set("_WorldSpaceCameraPos", r.eye);
    set("_MainTex_ST", [1, 1, 0, 0]);
    set("_DetailAlbedoMap_ST", [1, 1, 0, 0]);
    set("_Color", linearColor(material.color || [1, 1, 1, 1]));
    set("_Metallic", material.metallic || 0);
    set("_Glossiness", material.smoothness ?? 0.5);
    set(
      "_EmissionColor",
      linearColor([...(material.emission || [0, 0, 0]), 1]),
    );
    set("_WorldSpaceLightPos0", [
      ...(sun?.directionGLTF || normalize([-0.45, 0.85, -0.3])),
      0,
    ]);
    set("_LightColor0", sun?.colorIntensity || [0.85, 0.85, 0.85, 1]);
    const ambient = r.lighting?.ambientRGB || [0.4, 0.4, 0.4];
    for (let i = 0; i < 3; i++) {
      set("unity_SHA" + "rgb"[i], [0, 0, 0, ambient[i]]);
      set("unity_SHB" + "rgb"[i], [0, 0, 0, 0]);
    }
    set("unity_SHC", [0, 0, 0, 0]);
    for (const [name, value] of Object.entries(r.lighting?.ambientSH || {}))
      set(name, value);
    set("unity_SpecCube0_HDR", [1, 1, 0, 0]);
    const sky = r.sky || [0.7, 0.85, 0.85],
      fog = r.lighting?.skybox;
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
    set("_StarEmissionColor", [0, 0, 0, 0]);
    set("_StarRimParams", [0, 4, 0, 0]);
    const shadows = r.shadows?.bindings();
    for (const [name, value] of Object.entries(shadows?.values || {}))
      set(name, value);
    const textures = [
      ["_MainTex", material.texture || this.white, gl.TEXTURE_2D],
      [
        "_EmissionMap",
        material.emissionUsesMain ? material.texture || this.white : this.white,
        gl.TEXTURE_2D,
      ],
      ["unity_SpecCube0", this.cube, gl.TEXTURE_CUBE_MAP],
      ["_StaticShadowMap", this.white, gl.TEXTURE_2D],
      ["hlslcc_zcmp_StaticShadowMap", this.depth, gl.TEXTURE_2D],
      ["_DynamicShadowMap", this.white, gl.TEXTURE_2D],
      ["hlslcc_zcmp_DynamicShadowMap", this.depth, gl.TEXTURE_2D],
    ];
    textures.forEach(([name, texture, target], unit) => {
      const loc = this.u.get(name);
      if (loc === undefined) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(target, shadows?.textures[name] || texture);
      gl.uniform1i(loc, unit);
    });
    gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_INT, 0);
    r.drawCalls++;
    gl.activeTexture(gl.TEXTURE0);
  }
}
