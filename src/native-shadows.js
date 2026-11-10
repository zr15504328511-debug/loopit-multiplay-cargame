import { identity, lookAt, mul, normalize, cross } from "./math.js";
const VS = `#version 300 es
precision highp float;layout(location=0)in vec3 position;layout(location=2)in vec2 uv;
layout(location=4)in mat4 instanceWorld;uniform mat4 world;uniform mat4 lightVP;uniform bool instanced;out vec2 texcoord;
void main(){texcoord=uv;gl_Position=lightVP*(instanced?instanceWorld*world:world)*vec4(position,1.);}`;
const FS = `#version 300 es
precision highp float;in vec2 texcoord;uniform bool cutout;uniform sampler2D tex;uniform float cutoff;
void main(){if(cutout&&texture(tex,texcoord).a<cutoff)discard;}`;
const ortho = (w, h, near, far) =>
  new Float32Array([
    2 / w,
    0,
    0,
    0,
    0,
    2 / h,
    0,
    0,
    0,
    0,
    -2 / (far - near),
    0,
    0,
    0,
    -(far + near) / (far - near),
    1,
  ]);
const unityMatrix = (m) => {
  const o = new Float32Array(m);
  for (let i = 0; i < 4; i++) o[i] *= -1;
  return o;
};
export class NativeShadows {
  constructor(renderer, settings) {
    this.r = renderer;
    this.gl = renderer.gl;
    this.settings = settings;
    this.maps = [];
    this.level = null;
    const gl = this.gl;
    this.program = gl.createProgram();
    for (const [type, source] of [
      [gl.VERTEX_SHADER, VS],
      [gl.FRAGMENT_SHADER, FS],
    ]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      gl.attachShader(this.program, s);
      gl.deleteShader(s);
    }
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(this.program));
    this.u = Object.fromEntries(
      ["world", "lightVP", "instanced", "cutout", "tex", "cutoff"].map((n) => [
        n,
        gl.getUniformLocation(this.program, n),
      ]),
    );
  }
  configure(level) {
    if (this.level === level) return;
    for (const m of this.maps) {
      this.gl.deleteTexture(m.texture);
      this.gl.deleteFramebuffer(m.framebuffer);
    }
    this.maps = [];
    this.level = level;
    const file =
      "level" +
      ([
        "savannah",
        "ski-resort",
        "west-coast",
        "formula",
        "rainbow-road",
      ].indexOf(level) +
        1);
    for (const config of this.settings.filter(
      (c) =>
        c.file === file &&
        c.enabled &&
        c.activeInHierarchy &&
        /Map$/.test(c.class),
    )) {
      const gl = this.gl,
        texture = gl.createTexture(),
        framebuffer = gl.createFramebuffer();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.DEPTH_COMPONENT24,
        config.mapWidth,
        config.mapHeight,
        0,
        gl.DEPTH_COMPONENT,
        gl.UNSIGNED_INT,
        null,
      );
      for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
        gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR);
      for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_COMPARE_MODE,
        gl.COMPARE_REF_TO_TEXTURE,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        texture,
        0,
      );
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw Error("Shadow framebuffer incomplete");
      const centers = [],
        keys = config.keyframes?.map((k) => k.matrix.slice(12, 15)) || [];
      // Source keyframes, worldSize, overlap and maximum count; browser CPU tile scheduling.
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i],
          b = keys[i + 1],
          distance = Math.hypot(...b.map((v, k) => v - a[k]));
        const segments = Math.max(
          1,
          Math.ceil(distance / (config.worldSize * (1 - config.tileOverlap))),
        );
        for (let j = 0; j < segments; j++)
          centers.push(a.map((v, k) => v + ((b[k] - v) * j) / segments));
      }
      if (keys.length) centers.push(keys.at(-1));
      if (centers.length > config.maxTileCount) {
        const a = keys[0],
          b = keys.at(-1);
        centers.length = 0;
        for (let j = 0; j < config.maxTileCount; j++)
          centers.push(
            a.map((v, k) => v + ((b[k] - v) * j) / (config.maxTileCount - 1)),
          );
      }
      this.maps.push({
        config,
        texture,
        framebuffer,
        centers,
        index: -1,
        matrix: identity(),
      });
    }
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  invalidateStatic() {
    for(const map of this.maps||[])if(map.config.class!=="DynamicShadowMap")map.index=-1;
  }
  prepare(level, eye, target, drawStatic, drawCar) {
    this.configure(level);
    const gl = this.gl,
      dir = this.r.lighting.sun.directionGLTF,
      forward = normalize(target.map((v, i) => v - eye[i]));
    for (const map of this.maps) {
      const c = map.config,
        dynamic = c.class === "DynamicShadowMap";
      const selected = eye.map(
        (v, i) =>
          v +
          forward[i] *
            (dynamic
              ? c.cameraForwardCenterOffset
              : c.cameraForwardTileSelectionOffset),
      );
      let center = selected,
        index = 0;
      if (!dynamic) {
        let best = Infinity;
        for (let i = 0; i < map.centers.length; i++) {
          const d = Math.hypot(
            ...map.centers[i].map((v, k) => v - selected[k]),
          );
          if (d < best) {
            best = d;
            index = i;
          }
        }
        if (map.index >= 0 && index !== map.index) {
          const old = Math.hypot(
            ...map.centers[map.index].map((v, k) => v - selected[k]),
          );
          if (old - best < c.tileSwitchHysteresis) index = map.index;
        }
        if (index === map.index) continue;
        center = map.centers[index];
        map.index = index;
      }
      const height = dynamic ? 2 * c.shadowDistance : c.worldSize,
        width = (height * c.mapWidth) / c.mapHeight;
      const depth = dynamic
        ? height * c.lightDepthCoverageMultiplier
        : Math.max(width, height) * 1.5;
      // Original camera snaps its light-plane center to shadow texels.
      const right = normalize(cross(dir, [0, 1, 0])),
        up = normalize(cross(right, dir));
      for (const [axis, step] of [
        [right, width / c.mapWidth],
        [up, height / c.mapHeight],
      ]) {
        const projection = center.reduce((s, v, i) => s + v * axis[i], 0),
          delta = Math.round(projection / step) * step - projection;
        center = center.map((v, i) => v + axis[i] * delta);
      }
      const eyeLight = center.map((v, i) => v + (dir[i] * depth) / 2);
      map.matrix = mul(
        ortho(width, height, 0.01, depth + 0.01),
        lookAt(eyeLight, center),
      );
      map.fadeEnd = Math.hypot(width / 2, height / 2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, map.framebuffer);
      gl.viewport(0, 0, c.mapWidth, c.mapHeight);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.u.lightVP, false, map.matrix);
      this.r.shadowPass = this;
      try {
        dynamic ? drawCar() : drawStatic();
      } finally {
        this.r.shadowPass = null;
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, 400, 580);
  }
  draw(gpu, world, material, roots = null) {
    if (
      /NoShadowCaster|Transparent|Waterfall|RainbowSprite/.test(
        material.shader || "",
      )
    )
      return;
    const gl = this.gl,
      u = this.u;
    gl.useProgram(this.program);
    gl.bindVertexArray(gpu.vao);
    gl.uniformMatrix4fv(u.world, false, world);
    gl.uniform1i(u.instanced, roots ? 1 : 0);
    gl.uniform1i(u.cutout, material.alpha === "MASK");
    gl.uniform1f(u.cutoff, material.alphaCutoff ?? 0.5);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(
      gl.TEXTURE_2D,
      material.texture || this.r.nativeSurfaces.white,
    );
    gl.uniform1i(u.tex, 0);
    if (roots) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.r.instanceBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(roots.flatMap((m) => Array.from(m))),
        gl.DYNAMIC_DRAW,
      );
      for (let i = 0; i < 4; i++) {
        gl.enableVertexAttribArray(4 + i);
        gl.vertexAttribPointer(4 + i, 4, gl.FLOAT, false, 64, i * 16);
        gl.vertexAttribDivisor(4 + i, 1);
      }
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        gpu.count,
        gl.UNSIGNED_INT,
        0,
        roots.length,
      );
      for (let i = 0; i < 4; i++) {
        gl.disableVertexAttribArray(4 + i);
        gl.vertexAttribDivisor(4 + i, 0);
      }
    } else gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_INT, 0);
  }
  bindings(unity = false) {
    const values = {},
      textures = {},
      direction = this.r.lighting.sun.directionGLTF;
    values._ShadowFadeLightDir = unity
      ? [-direction[0], direction[1], direction[2]]
      : direction;
    values._ShadowFadeLightDir2 = values._ShadowFadeLightDir;
    for (const m of this.maps) {
      const c = m.config,
        dyn = c.class === "DynamicShadowMap",
        prefix = dyn ? "_DynamicShadow" : "_StaticShadow",
        suffix = !dyn && c.staticShadowSlot === 1 ? "2" : "";
      values["hlslcc_mtx4x4" + prefix + "Matrix" + suffix] = unity
        ? unityMatrix(m.matrix)
        : m.matrix;
      values[prefix + "Strength" + suffix] = c.shadowStrength;
      values[prefix + "Bias" + suffix] = c.bias;
      values[prefix + "FadeEnd" + suffix] = m.fadeEnd;
      values[prefix + "FadeInvRange" + suffix] =
        1 / Math.max(0.001, c.fadeRange);
      textures["hlslcc_zcmp" + prefix + "Map" + suffix] = m.texture;
      if (dyn)
        values._DynamicShadowEdgeFadeInvWidth = [
          c.shadowDistance / c.edgeFadeWidth,
          c.shadowDistance / c.edgeFadeWidth,
        ];
    }
    return { values, textures };
  }
}
