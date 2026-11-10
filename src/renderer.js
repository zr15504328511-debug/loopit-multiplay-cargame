import {
  identity,
  mul,
  perspective,
  lookAt,
  model,
  point,
  normalize,
  cross,
} from "./math.js";
import { NativePBS } from "./native-pbs.js";
import { NativeSurfaces } from "./native-surfaces.js";
import { LinearFrame } from "./linear-frame.js";
import { linearColor } from "./color-space.js";
import { NativeShadows } from "./native-shadows.js";
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=2) in vec2 uv;layout(location=3) in vec4 color;
layout(location=4) in mat4 instanceWorld;
uniform mat4 world;uniform mat4 vp;uniform bool instanced;out vec3 vNormal;out vec3 vWorld;out vec2 vUV;out vec4 vColor;
void main(){mat4 m=instanced?instanceWorld*world:world;vec4 p=m*vec4(position,1.);vWorld=p.xyz;vNormal=normalize(transpose(inverse(mat3(m)))*normal);vUV=uv;vColor=color;gl_Position=vp*p;}`;
const FS = `#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vWorld;in vec2 vUV;in vec4 vColor;uniform vec4 tint;uniform sampler2D tex;uniform bool textured;uniform bool painted;uniform vec3 paint;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;uniform vec3 skyTop;uniform vec3 skyHorizon;uniform vec3 skyBottom;uniform float fogStart;uniform float fogRange;uniform float fogOpacity;uniform float unlit;out vec4 outColor;
vec3 sky(vec3 ray){return mix(skyHorizon,ray.y>0.?skyTop:skyBottom,1.-pow(1.-abs(ray.y),3.));}
void main(){vec4 c=tint*vColor;if(textured)c*=texture(tex,vUV);if(c.a<.25)discard;if(painted){float hi=max(c.r,max(c.g,c.b));float lo=min(c.r,min(c.g,c.b));float mask=smoothstep(.12,.3,(hi-lo)/max(.001,hi))*smoothstep(.035,.15,hi);c.rgb=mix(c.rgb,paint*(.36+.64*hi),mask);}vec3 n=normalize(vNormal);float sun=max(0.,dot(n,sunDirection));vec3 light=mix(vec3(.63)+sun*sunColor*.43,vec3(1.),unlit);vec3 col=c.rgb*light;vec3 delta=vWorld-eye;float f=smoothstep(fogStart,fogStart+fogRange,length(delta))*fogOpacity;outColor=vec4(mix(col,sky(normalize(delta)),f),c.a);}`;
const SKY_VS = `#version 300 es
out vec2 screen;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);screen=p*2.-1.;gl_Position=vec4(screen,1.,1.);}`;
const SKY_FS = `#version 300 es
precision highp float;in vec2 screen;uniform vec3 forward;uniform vec3 right;uniform vec3 up;uniform vec2 view;uniform vec3 topColor;uniform vec3 horizonColor;uniform vec3 bottomColor;out vec4 outColor;
void main(){vec3 ray=normalize(forward+right*screen.x*view.x+up*screen.y*view.y);float t=1.-pow(1.-abs(ray.y),3.);outColor=vec4(mix(horizonColor,ray.y>0.?topColor:bottomColor,t),1.);}`;
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = (this.gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    }));
    if (!gl)
      throw Error("WebGL2 is unavailable. Enable hardware acceleration.");
    const shader = (type, code) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = (this.program = gl.createProgram());
    gl.attachShader(p, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(p));
    this.u = Object.fromEntries(
      [
        "world",
        "vp",
        "tint",
        "tex",
        "textured",
        "painted",
        "paint",
        "eye",
        "sunDirection",
        "sunColor",
        "skyTop",
        "skyHorizon",
        "skyBottom",
        "fogStart",
        "fogRange",
        "fogOpacity",
        "unlit",
        "instanced",
      ].map((k) => [k, gl.getUniformLocation(p, k)]),
    );
    this.skyProgram = gl.createProgram();
    gl.attachShader(this.skyProgram, shader(gl.VERTEX_SHADER, SKY_VS));
    gl.attachShader(this.skyProgram, shader(gl.FRAGMENT_SHADER, SKY_FS));
    gl.linkProgram(this.skyProgram);
    if (!gl.getProgramParameter(this.skyProgram, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(this.skyProgram));
    this.skyUniforms = Object.fromEntries(
      [
        "forward",
        "right",
        "up",
        "view",
        "topColor",
        "horizonColor",
        "bottomColor",
      ].map((n) => [n, gl.getUniformLocation(this.skyProgram, n)]),
    );
    this.skyVAO = gl.createVertexArray();
    this.instanceBuffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    this.drawCalls = 0;
    this.cube = this.makeCube();
    this.disk = this.makeDisk();
    this.white = { color: [1, 1, 1, 1] };
    this.linearFrame = new LinearFrame(gl);
  }
  texture(bitmap) {
    const gl = this.gl,
      t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.SRGB8_ALPHA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      bitmap,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    bitmap.close?.();
    return t;
  }
  async initOriginalMaterials() {
    this.nativePBS = await NativePBS.create(this);
    this.nativeSurfaces = await NativeSurfaces.create(this);
    this.shadows = new NativeShadows(
      this,
      await (await fetch("/assets/native-surfaces/shadows.json")).json(),
    );
  }
  mesh(pos, norm, uv, indices, colors, options = {}) {
    const gl = this.gl,
      vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [];
    const attr = (loc, data, size, def) => {
      if (!data) {
        gl.disableVertexAttribArray(loc);
        gl.vertexAttrib4f(loc, ...def);
        return;
      }
      const b = gl.createBuffer();
      buffers.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    if (!norm) {
      norm = new Float32Array(pos.length);
      for (let i = 0; i < indices.length; i += 3) {
        let a = indices[i] * 3,
          b = indices[i + 1] * 3,
          c = indices[i + 2] * 3;
        const u = [
            pos[b] - pos[a],
            pos[b + 1] - pos[a + 1],
            pos[b + 2] - pos[a + 2],
          ],
          v = [
            pos[c] - pos[a],
            pos[c + 1] - pos[a + 1],
            pos[c + 2] - pos[a + 2],
          ],
          n = [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0],
          ];
        for (const k of [a, b, c])
          for (let j = 0; j < 3; j++) norm[k + j] += n[j];
      }
    }
    attr(0, new Float32Array(pos), 3);
    attr(1, new Float32Array(norm), 3);
    attr(
      2,
      uv ? new Float32Array(uv) : null,
      options.uvSize || 2,
      [0, 0, 0, 1],
    );
    attr(4, options.uv1 || null, 2, [0, 0, 0, 1]);
    let col = colors ? new Float32Array(colors) : null;
    attr(
      3,
      col,
      col && col.length / (pos.length / 3) === 3 ? 3 : 4,
      [1, 1, 1, 1],
    );
    const b = gl.createBuffer();
    buffers.push(b);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
    const idx =
      indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, buffers, count: idx.length };
  }
  disposeMesh(m) {
    this.gl.deleteVertexArray(m.vao);
    m.buffers.forEach((b) => this.gl.deleteBuffer(b));
  }
  begin(
    eye,
    target,
    { sky = [0.73, 0.85, 0.89], fogFar = 750, fov = 52 } = {},
  ) {
    // User-requested render surface: exactly 400 × 580, independent of DPR.
    const gl = this.gl,
      w = 400,
      h = 580;
    const scale = Math.min(1, innerWidth / w, innerHeight / h);
    this.canvas.parentElement.style.transform = `translate(-50%,-50%) scale(${scale})`;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    this.linearFrame.begin();
    gl.clearColor(...sky, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fog = this.lighting?.skybox,
      top = fog?.topColor.slice(0, 3) || sky,
      horizon = fog?.horizonColor.slice(0, 3) || sky,
      bottom = fog?.bottomColor.slice(0, 3) || sky;
    if (fog) {
      gl.useProgram(this.skyProgram);
      gl.bindVertexArray(this.skyVAO);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.depthMask(false);
      const forward = normalize(target.map((x, i) => x - eye[i])),
        right = normalize(cross(forward, [0, 1, 0])),
        up = cross(right, forward),
        u = this.skyUniforms,
        tan = Math.tan((fov * Math.PI) / 360);
      gl.uniform3fv(u.forward, forward);
      gl.uniform3fv(u.right, right);
      gl.uniform3fv(u.up, up);
      gl.uniform2f(u.view, (tan * w) / h, tan);
      gl.uniform3fv(u.topColor, top);
      gl.uniform3fv(u.horizonColor, horizon);
      gl.uniform3fv(u.bottomColor, bottom);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
    }
    gl.useProgram(this.program);
    this.vp = mul(
      perspective((fov * Math.PI) / 180, w / h),
      lookAt(eye, target),
    );
    gl.uniformMatrix4fv(this.u.vp, false, this.vp);
    gl.uniform3fv(this.u.eye, eye);
    gl.uniform3fv(this.u.skyTop, top);
    gl.uniform3fv(this.u.skyHorizon, horizon);
    gl.uniform3fv(this.u.skyBottom, bottom);
    gl.uniform3fv(
      this.u.sunDirection,
      this.lighting?.sun.directionGLTF || normalize([-0.45, 0.85, -0.3]),
    );
    gl.uniform3fv(
      this.u.sunColor,
      this.lighting?.sun.colorIntensity.slice(0, 3) || [1, 1, 1],
    );
    gl.uniform1f(this.u.fogStart, fog?.fogStart ?? fogFar * 0.45);
    gl.uniform1f(
      this.u.fogRange,
      Math.max(0.0001, fog?.fogRange ?? fogFar * 0.55),
    );
    gl.uniform1f(this.u.fogOpacity, fog?.maxFogOpacity ?? 1);
    gl.uniform1i(this.u.tex, 0);
    gl.uniform1i(this.u.instanced, 0);
    this.eye = eye;
    this.sky = sky;
    this.fogFar = fogFar;
    this.drawCalls = 0;
    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }
  draw(gpu, world, material, unlit = 0) {
    if (this.shadowPass) {
      this.shadowPass.draw(gpu, world, material);
      return;
    }
    if (!unlit && this.nativeSurfaces?.supports(material.shader)) {
      this.nativeSurfaces.draw(gpu, world, material);
      return;
    }
    if (
      this.nativePBS &&
      material.shader === "Custom/StandardFogPBS" &&
      !material.roomPaint &&
      !unlit
    ) {
      this.nativePBS.draw(gpu, world, material);
      return;
    }
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1i(this.u.instanced, 0);
    gl.bindVertexArray(gpu.vao);
    gl.uniformMatrix4fv(this.u.world, false, world);
    gl.uniform4fv(
      this.u.tint,
      material.nativeEvidence
        ? linearColor(material.color || [1, 1, 1, 1])
        : material.color || [1, 1, 1, 1],
    );
    gl.uniform1i(this.u.textured, material.texture ? 1 : 0);
    gl.uniform1i(this.u.painted,material.roomPaint?1:0);
    gl.uniform3fv(this.u.paint,material.roomPaint||[1,1,1]);
    gl.uniform1f(this.u.unlit, unlit);
    if (material.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, material.texture);
    }
    gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_INT, 0);
    this.drawCalls++;
  }
  asset(asset, root = identity(), filter = null) {
    for (const d of asset.draws) {
      if (filter && !filter(d.node)) continue;
      this.draw(d.gpu, mul(root, d.world), d.material);
    }
  }
  instances(asset, roots) {
    if (!roots.length) return;
    if (this.shadowPass) {
      for (const d of asset.draws)
        if (d.nativeRendererEnabled !== false)
          this.shadowPass.draw(d.gpu, d.world, d.material, roots);
      return;
    }
    const gl = this.gl,
      matrices = new Float32Array(roots.length * 16);
    roots.forEach((m, i) => matrices.set(m, i * 16));
    gl.useProgram(this.program);
    gl.uniform1i(this.u.instanced, 1);
    gl.uniform1f(this.u.unlit, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.DYNAMIC_DRAW);
    for (const d of asset.draws) {
      if (d.nativeRendererEnabled === false) continue;
      gl.bindVertexArray(d.gpu.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
      for (let i = 0; i < 4; i++) {
        gl.enableVertexAttribArray(4 + i);
        gl.vertexAttribPointer(4 + i, 4, gl.FLOAT, false, 64, i * 16);
        gl.vertexAttribDivisor(4 + i, 1);
      }
      gl.uniformMatrix4fv(this.u.world, false, d.world);
      gl.uniform4fv(
        this.u.tint,
        d.material.nativeEvidence
          ? linearColor(d.material.color || [1, 1, 1, 1])
          : d.material.color || [1, 1, 1, 1],
      );
      gl.uniform1i(this.u.textured, d.material.texture ? 1 : 0);
      gl.uniform1i(this.u.painted,d.material.roomPaint?1:0);
      gl.uniform3fv(this.u.paint,d.material.roomPaint||[1,1,1]);
      if (d.material.texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, d.material.texture);
      }
      gl.drawElementsInstanced(
        gl.TRIANGLES,
        d.gpu.count,
        gl.UNSIGNED_INT,
        0,
        roots.length,
      );
      this.drawCalls++;
      for (let i = 0; i < 4; i++) {
        gl.disableVertexAttribArray(4 + i);
        gl.vertexAttribDivisor(4 + i, 0);
      }
    }
    gl.uniform1i(this.u.instanced, 0);
  }
  box(pos, size, color, yaw = 0, pitch = 0, roll = 0) {
    this.draw(this.cube, model(pos, yaw, pitch, roll, size), { color });
  }
  line(a, b, width, color) {
    const d = b.map((x, i) => x - a[i]),
      len = Math.hypot(...d),
      mid = a.map((x, i) => (x + b[i]) / 2);
    this.box(
      mid,
      [width, width, len],
      color,
      Math.atan2(d[0], d[2]),
      -Math.asin(d[1] / len),
    );
  }
  shadow(pos, size = 2, alpha = 0.28) {
    if (this.shadows || this.shadowPass) return;
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    this.draw(
      this.disk,
      model(pos, 0, 0, 0, [size, 1, size * 1.55]),
      { color: [0.08, 0.09, 0.13, alpha] },
      1,
    );
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  project(p) {
    const m = this.vp,
      x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
      y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
    return [
      ((x / w) * 0.5 + 0.5) * this.canvas.clientWidth,
      ((-y / w) * 0.5 + 0.5) * this.canvas.clientHeight,
      w,
    ];
  }
  makeCube() {
    const p = [],
      n = [],
      uv = [],
      ix = [];
    const faces = [
      [
        [1, 0, 0],
        [
          [1, -1, -1],
          [1, 1, -1],
          [1, 1, 1],
          [1, -1, 1],
        ],
      ],
      [
        [-1, 0, 0],
        [
          [-1, -1, 1],
          [-1, 1, 1],
          [-1, 1, -1],
          [-1, -1, -1],
        ],
      ],
      [
        [0, 1, 0],
        [
          [-1, 1, -1],
          [-1, 1, 1],
          [1, 1, 1],
          [1, 1, -1],
        ],
      ],
      [
        [0, -1, 0],
        [
          [-1, -1, 1],
          [-1, -1, -1],
          [1, -1, -1],
          [1, -1, 1],
        ],
      ],
      [
        [0, 0, 1],
        [
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
          [-1, -1, 1],
        ],
      ],
      [
        [0, 0, -1],
        [
          [-1, -1, -1],
          [-1, 1, -1],
          [1, 1, -1],
          [1, -1, -1],
        ],
      ],
    ];
    for (const [normal, vs] of faces) {
      let i = p.length / 3;
      for (const v of vs) {
        p.push(...v.map((x) => x * 0.5));
        n.push(...normal);
        uv.push(0, 0);
      }
      ix.push(i, i + 1, i + 2, i, i + 2, i + 3);
    }
    return this.mesh(
      new Float32Array(p),
      new Float32Array(n),
      new Float32Array(uv),
      new Uint32Array(ix),
    );
  }
  makeDisk() {
    const p = [0, 0, 0],
      n = [0, 1, 0],
      idx = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      p.push(Math.cos(a), 0, Math.sin(a));
      n.push(0, 1, 0);
      if (i) idx.push(0, i, i + 1);
    }
    return this.mesh(
      new Float32Array(p),
      new Float32Array(n),
      null,
      new Uint32Array(idx),
    );
  }
}
