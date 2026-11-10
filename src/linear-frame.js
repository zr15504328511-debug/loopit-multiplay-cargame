// Unity's linear framebuffer is represented explicitly; the browser canvas receives sRGB once.
const VS = `#version 300 es
out vec2 uv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
const FS = `#version 300 es
precision highp float;in vec2 uv;uniform sampler2D frame;out vec4 color;
void main(){vec3 x=max(texture(frame,uv).rgb,vec3(0));vec3 lo=x*12.92;vec3 hi=1.055*pow(x,vec3(1./2.4))-.055;color=vec4(mix(hi,lo,lessThanEqual(x,vec3(.0031308))),1.);}`;
export class LinearFrame {
  constructor(gl) {
    this.gl = gl;
    this.width = 400;
    this.height = 580;
    const format = gl.getExtension("EXT_color_buffer_float")
      ? gl.RGBA16F
      : gl.RGBA8;
    const supported = gl.getInternalformatParameter(
      gl.RENDERBUFFER,
      format,
      gl.SAMPLES,
    );
    const depthSamples = gl.getInternalformatParameter(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT24,
      gl.SAMPLES,
    );
    this.samples = Math.max(
      0,
      ...supported.filter((v) => v <= 4 && depthSamples.includes(v)),
    );
    this.scene = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene);
    for (const [attachment, storage] of [
      [gl.COLOR_ATTACHMENT0, format],
      [gl.DEPTH_ATTACHMENT, gl.DEPTH_COMPONENT24],
    ]) {
      const buffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, buffer);
      gl.renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        this.samples,
        storage,
        400,
        580,
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachment,
        gl.RENDERBUFFER,
        buffer,
      );
    }
    this.check();
    this.resolved = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.resolved);
    this.color = this.texture(
      format,
      gl.RGBA,
      format === gl.RGBA16F ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.color,
      0,
    );
    this.depth = this.texture(
      gl.DEPTH_COMPONENT24,
      gl.DEPTH_COMPONENT,
      gl.UNSIGNED_INT,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      this.depth,
      0,
    );
    this.check();
    this.program = gl.createProgram();
    for (const [kind, code] of [
      [gl.VERTEX_SHADER, VS],
      [gl.FRAGMENT_SHADER, FS],
    ]) {
      const s = gl.createShader(kind);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      gl.attachShader(this.program, s);
      gl.deleteShader(s);
    }
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(this.program));
    this.sampler = gl.getUniformLocation(this.program, "frame");
    this.vao = gl.createVertexArray();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  texture(internal, format, type) {
    const gl = this.gl,
      t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 400, 580, 0, format, type, null);
    for (const name of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, name, gl.NEAREST);
    for (const name of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, name, gl.CLAMP_TO_EDGE);
    return t;
  }
  check() {
    if (
      this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !==
      this.gl.FRAMEBUFFER_COMPLETE
    )
      throw Error("Linear framebuffer incomplete");
  }
  begin() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.scene);
  }
  resolveDepth() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.scene);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resolved);
    gl.blitFramebuffer(
      0,
      0,
      400,
      580,
      0,
      0,
      400,
      580,
      gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene);
  }
  present() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.scene);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resolved);
    gl.blitFramebuffer(
      0,
      0,
      400,
      580,
      0,
      0,
      400,
      580,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(false);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.color);
    gl.uniform1i(this.sampler, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }
}
