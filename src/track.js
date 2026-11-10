import { clamp, lerp, identity, model } from "./math.js";
import { CONFIG, LEVEL_STYLE } from "./config.js";
import { SurfaceIndex } from "./surfaces.js";
export class Track {
  constructor(level) {
    this.level = level;
    this.style = LEVEL_STYLE[level.id];
    this.samples = level.samples;
    this.startZ = level.start[2];
    this.endZ = level.finish[2];
    this.space = level.id === "rainbow-road";
    this.snow = level.id === "ski-resort";
    this.ramps = level.sourceRoute ? [] : [145, 335, 580];
    this.obstacles = [];
    this.pickups = [];
    this.boosters = [];
    this.surfaces = new SurfaceIndex(level.surfaceTriangles || []);
    this.native = level.nativeTerrain || null;
    this.environment = (level.instances || [])
      .filter(
        (i) =>
          !this.space &&
          (i.generateColliders !== false || i.collisionState),
      )
      .map((i) => ({
        x: i.position[0],
        y: i.position[1],
        z: i.position[2],
        radius:
          (/Rock/.test(i.prefab) && i.prototypeBounds
            ? Math.max(
                i.prototypeBounds.max[0] - i.prototypeBounds.min[0],
                i.prototypeBounds.max[2] - i.prototypeBounds.min[2],
              ) * 0.5
            : /Rock/.test(i.prefab)
              ? 0.7
              : 0.35) * (i.scale?.[0] || 1),
        height: i.prototypeBounds
          ? (i.prototypeBounds.max[1] - i.prototypeBounds.min[1]) *
            (i.scale?.[1] || 1)
          : 3,
        sourcePrefab: i.prefab,
        applePassThrough: i.goldenApplePassThrough !== false,
        collisionState: i.collisionState,
        meshCollision: !!i.collisionState,
        get hit() { return this.collisionState?.hit ?? this._hit ?? false; },
        set hit(value) { if(this.collisionState)this.collisionState.hit=value;else this._hit=value; },
      }));
    for (let z = 90, n = 0; !this.native && z < this.endZ - 45; z += 57, n++) {
      const r = this.at(z),
        side = [0.55, -0.55, 0, -0.6, 0.6][n % 5];
      this.obstacles.push({
        x: r.x + r.half * side,
        y: r.y + 0.7,
        z,
        kind: level.id === "west-coast" && n % 3 === 1 ? "rotator" : "barrier",
        hit: false,
        width: 2.6,
      });
    }
    for (let z = 35, n = 0; z < this.endZ - 12; z += 9, n++) {
      const r = this.at(z),
        side = Math.sin(n * 0.33) * r.half * 0.43;
      this.pickups.push({
        kind: "coin",
        x: r.x + side,
        y: r.y + 1.1,
        z,
        taken: false,
      });
    }
    for (
      let z = CONFIG.gameplay.firstItemDistance, n = 0;
      z < this.endZ - 35;
      z += 130, n++
    ) {
      const r = this.at(z);
      this.pickups.push({
        kind: "item",
        item: ["pepper", "glider", "apple"][n % 3],
        x: r.x + (n % 2 ? 2 : -2),
        y: r.y + 1.5,
        z,
        taken: false,
      });
    }
    for (
      let z = 205;
      CONFIG.gameplay.roadBoosters && z < this.endZ - 50;
      z += 210
    ) {
      const r = this.at(z);
      this.boosters.push({ x: r.x, y: r.y, z, used: false });
    }
    if (this.native)
      for (const p of this.pickups) {
        const surface = this.ground(p.x, p.z);
        if (surface) p.y = surface.height + (p.kind === "coin" ? 1.1 : 1.5);
        else p.taken = true;
        p.absent = !surface;
      }
  }
  at(z) {
    const s = this.samples;
    let a = s[0],
      b = s[1];
    if (z >= s.at(-1).z) {
      a = s.at(-2);
      b = s.at(-1);
    } else if (z > s[0].z) {
      let lo = 0,
        hi = s.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (s[mid].z > z) hi = mid;
        else lo = mid;
      }
      a = s[lo];
      b = s[hi];
    }
    const t = clamp((z - a.z) / (b.z - a.z), 0, 1);
    let y = lerp(a.y, b.y, t);
    if (z < this.startZ) y = s[0].y;
    let ramp = 0;
    for (const rz of this.ramps) {
      if (z > rz - 16 && z <= rz)
        ramp = Math.max(ramp, ((z - rz + 16) / 16) * 2.6);
      else if (z > rz && z < rz + 3)
        ramp = Math.max(ramp, (1 - (z - rz) / 3) * 2.6);
    }
    return {
      x: lerp(a.x, b.x, t),
      y: y + ramp,
      baseY: y,
      half: lerp(a.width, b.width, t) * 0.5 * this.style.width,
    };
  }
  ground(x, z, maxHeight = Infinity) {
    if (this.native) {
      const native = this.native.sample(x, z, maxHeight);
      const bridge = this.surfaces.sample(x, z, native?.height ?? -Infinity, maxHeight);
      const surface = bridge ? {...bridge, water:false} : native;
      if (!surface) return null;
      return {
        ...surface,
        type: this.snow ? "snow" : surface.road ? "road" : "grass",
      };
    }
    const r = this.at(z),
      offset = Math.abs(x - r.x);
    if (z < this.startZ - 15 || z > this.endZ + 45) return null;
    if (offset <= r.half)
      return {
        height: this.surfaces.height(x, z, r.y),
        type: this.snow ? "snow" : "road",
        road: true,
      };
    if (this.space || offset > r.half + 24) return null;
    return {
      height: this.surfaces.height(
        x,
        z,
        r.baseY - 0.15 - Math.max(0, offset - r.half) * 0.08,
      ),
      type: this.snow ? "snow" : "grass",
      road: false,
    };
  }
  reset() {
    if(this.native) {
      this.native.ignorePassThrough=false;
      for(const owner of this.native.collisionOwners)owner.hit=false;
    }
    for (const o of [...this.obstacles, ...this.environment]) o.hit = false;
    for (const p of this.pickups) p.taken = !!p.absent;
    for (const b of this.boosters) b.used = false;
  }
  build(renderer) {
    if (this.native) {
      this.native.build(renderer);
      return;
    }
    const positions = [],
      colors = [],
      indices = [];
    const groundP = [],
      groundC = [],
      groundI = [];
    const quad = (p, c, ix, vs, col) => {
      const base = p.length / 3;
      for (const v of vs) {
        p.push(...v);
        c.push(...col);
      }
      ix.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const bands = this.space ? 7 : 1,
      rainbow = [
        [0.98, 0.39, 0.43, 1],
        [1, 0.63, 0.31, 1],
        [0.98, 0.85, 0.35, 1],
        [0.43, 0.78, 0.58, 1],
        [0.33, 0.68, 0.87, 1],
        [0.43, 0.48, 0.84, 1],
        [0.73, 0.42, 0.77, 1],
      ];
    for (let z = this.startZ - 14; z < this.endZ + 35; z += 2) {
      const a = this.at(z),
        b = this.at(z + 2);
      for (let band = 0; band < bands; band++) {
        const l = (band / bands) * 2 - 1,
          h = ((band + 1) / bands) * 2 - 1;
        quad(
          positions,
          colors,
          indices,
          [
            [a.x + a.half * l, a.y, z],
            [b.x + b.half * l, b.y, z + 2],
            [b.x + b.half * h, b.y, z + 2],
            [a.x + a.half * h, a.y, z],
          ],
          this.space ? rainbow[band] : this.style.road,
        );
      }
      for (const side of [-1, 1]) {
        const color =
          this.level.id === "formula"
            ? Math.floor(z / 5) % 2
              ? [0.97, 0.94, 0.87, 1]
              : [0.87, 0.25, 0.23, 1]
            : this.style.edge;
        quad(
          positions,
          colors,
          indices,
          [
            [a.x + side * (a.half - 0.26), a.y + 0.025, z],
            [b.x + side * (b.half - 0.26), b.y + 0.025, z + 2],
            [b.x + side * (b.half + 0.28), b.y + 0.025, z + 2],
            [a.x + side * (a.half + 0.28), a.y + 0.025, z],
          ],
          color,
        );
      }
      if (!this.space) {
        for (const side of [-1, 1])
          for (let ring = 0; ring < 3; ring++) {
            const w0 = ring ? (ring === 1 ? 30 : 70) : 0,
              w1 = ring === 0 ? 30 : ring === 1 ? 70 : 150;
            const ya = a.baseY - 0.2 - w0 * 0.085,
              yb = b.baseY - 0.2 - w0 * 0.085;
            const c = this.style.ground.map((v, i) =>
              i === 3 ? v : v * (1 + Math.sin(z * 0.1 + ring) * 0.035),
            );
            quad(
              groundP,
              groundC,
              groundI,
              [
                [a.x + side * (a.half + w0), ya, z],
                [b.x + side * (b.half + w0), yb, z + 2],
                [b.x + side * (b.half + w1), b.baseY - 0.2 - w1 * 0.085, z + 2],
                [a.x + side * (a.half + w1), a.baseY - 0.2 - w1 * 0.085, z],
              ],
              c,
            );
          }
      }
      if (!this.snow && !this.space && Math.floor(z / 5) % 2 === 0)
        quad(
          positions,
          colors,
          indices,
          [
            [a.x - 0.07, a.y + 0.03, z],
            [b.x - 0.07, b.y + 0.03, z + 2],
            [b.x + 0.07, b.y + 0.03, z + 2],
            [a.x + 0.07, a.y + 0.03, z],
          ],
          this.style.edge,
        );
    }
    this.roadMesh = renderer.mesh(
      new Float32Array(positions),
      null,
      null,
      new Uint32Array(indices),
      new Float32Array(colors),
    );
    if (groundP.length)
      this.groundMesh = renderer.mesh(
        new Float32Array(groundP),
        null,
        null,
        new Uint32Array(groundI),
        new Float32Array(groundC),
      );
  }
  draw(renderer, carZ, time, assets) {
    if (this.native) this.native.draw(renderer, carZ);
    if (this.groundMesh)
      renderer.draw(this.groundMesh, identity(), { color: [1, 1, 1, 1] });
    if (this.roadMesh)
      renderer.draw(this.roadMesh, identity(), { color: [1, 1, 1, 1] });
    for (const o of this.obstacles) {
      if (o.hit || o.z < carZ - 25 || o.z > carZ + 260) continue;
      const angle = o.kind === "rotator" ? time * 1.7 : 0;
      renderer.box(
        [o.x, o.y, o.z],
        [o.width, 1.35, 0.75],
        [0.92, 0.32, 0.18, 1],
        angle,
      );
      for (const x of [-0.8, 0, 0.8])
        renderer.box(
          [o.x + x, o.y + 0.05, o.z - 0.39],
          [0.25, 0.95, 0.03],
          [1, 0.92, 0.7, 1],
          angle,
          0,
          -0.4,
        );
    }
    for (const p of this.pickups) {
      if (p.taken || p.z < carZ - 15 || p.z > carZ + 230) continue;
      const pos = [p.x, p.y + Math.sin(time * 2.8 + p.z) * 0.18, p.z],
        a = p.kind === "coin" ? assets.coin : assets.item;
      const scale = p.kind === "coin" ? 3 : 0.85;
      if (a)
        renderer.asset(a, model(pos, time * 1.8, 0, 0, [scale, scale, scale]));
      else
        renderer.box(
          pos,
          [0.65, 0.65, 0.65],
          p.kind === "coin" ? [1, 0.77, 0.22, 1] : [0.2, 0.75, 0.95, 1],
          time,
        );
    }
    for (const b of this.boosters) {
      if (b.z < carZ - 25 || b.z > carZ + 230) continue;
      const c = b.used ? [0.35, 0.65, 0.6, 1] : [0.31, 0.95, 0.78, 1];
      for (let i = -1; i <= 1; i++) {
        const r = this.at(b.z + i * 2);
        renderer.box([b.x, r.y + 0.04, b.z + i * 2], [4, 0.035, 0.55], c);
      }
    }
    const r = this.at(this.endZ);
    if (!this.native && this.endZ - carZ < 300) {
      for (const side of [-1, 1])
        renderer.box(
          [r.x + side * (r.half + 0.7), r.y + 4, this.endZ],
          [0.6, 8, 0.6],
          [0.95, 0.87, 0.65, 1],
        );
      renderer.box(
        [r.x, r.y + 7.5, this.endZ],
        [r.half * 2 + 2, 0.85, 0.6],
        [0.98, 0.94, 0.8, 1],
      );
      for (let i = 0; i < 16; i++)
        for (let row = 0; row < 2; row++)
          if ((i + row) % 2 === 0)
            renderer.box(
              [
                r.x - r.half + (i * r.half) / 8,
                r.y + 7.25 + row * 0.4,
                this.endZ - 0.32,
              ],
              [r.half / 8, 0.4, 0.04],
              [0.14, 0.23, 0.23, 1],
            );
    }
  }
  dispose(renderer) {
    this.native?.dispose(renderer);
    if (this.roadMesh) renderer.disposeMesh(this.roadMesh);
    if (this.groundMesh) renderer.disposeMesh(this.groundMesh);
  }
}
