// Native triangle height queries in a world XZ grid. No physics/rendering framework.
export class SurfaceIndex {
  constructor(triangles = []) {
    this.grid = new Map();
    this.triangles = triangles;
    this.cellSize = 8;
    for (let i = 0; i < triangles.length; i++) {
      const t = triangles[i],
        loX = Math.floor(Math.min(t[0], t[3], t[6]) / 8),
        hiX = Math.floor(Math.max(t[0], t[3], t[6]) / 8),
        loZ = Math.floor(Math.min(t[2], t[5], t[8]) / 8),
        hiZ = Math.floor(Math.max(t[2], t[5], t[8]) / 8);
      for (let x = loX; x <= hiX; x++)
        for (let z = loZ; z <= hiZ; z++) {
          const key = x + "," + z;
          if (!this.grid.has(key)) this.grid.set(key, []);
          this.grid.get(key).push(i);
        }
    }
  }
  height(x, z, base) {
    return this.sample(x, z, base)?.height ?? base;
  }
  sample(x, z, base = -Infinity, maxHeight = Infinity) {
    let y = base;
    let result = null;
    const ids = this.grid.get(Math.floor(x / 8) + "," + Math.floor(z / 8));
    if (!ids) return null;
    for (const id of ids) {
      const t = this.triangles[id],
        den = (t[5] - t[8]) * (t[0] - t[6]) + (t[6] - t[3]) * (t[2] - t[8]);
      if (Math.abs(den) < 1e-7) continue;
      const a = ((t[5] - t[8]) * (x - t[6]) + (t[6] - t[3]) * (z - t[8])) / den,
        b = ((t[8] - t[2]) * (x - t[6]) + (t[0] - t[6]) * (z - t[8])) / den,
        c = 1 - a - b;
      if (a >= -0.0001 && b >= -0.0001 && c >= -0.0001) {
        const h = a * t[1] + b * t[4] + c * t[7];
        if (h > y && h <= maxHeight) {
          y = h;
          const u=[t[3]-t[0],t[4]-t[1],t[5]-t[2]],v=[t[6]-t[0],t[7]-t[1],t[8]-t[2]];
          let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
          const length=Math.hypot(...n)*(n[1]<0?-1:1);
          result={height:h,normal:n.map(x=>x/length),road:true,source:"original-static-mesh"};
        }
      }
    }
    return result;
  }
}
