// QA input controller. It reads the scene and issues the same steering/item inputs as a player.
// Does not move the car, alter velocities or skip physics.
import { steeringDegrees } from "../src/vehicle-dynamics.js";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function shouldUseItem(sim) {
  if (!sim.item) return false;
  if (sim.effect === "apple" && sim.effectTime > 0) return false;
  // Clear the launch lip before boosting through the first rotating star.
  if(sim.track.level?.id==='rainbow-road' && sim.item==='pepper' && sim.z<180)return false;
  if (
    sim.item === "apple" &&
    sim.track.native &&
    sim.track.level?.id === "savannah"
  ) {
    const obstacles = sim.track.environment.filter(
      (o) =>
        !o.hit &&
        o.z > sim.z &&
        o.z < sim.z + Math.max(15, sim.speed) &&
        Math.abs(o.x - sim.track.at(o.z).x) < o.radius + 2,
    );
    return obstacles.length >= 3 || sim.speed < 8;
  }
  return true;
}
export function playerSteer(sim, collectItems = true) {
  const t = sim.track,
    look = t.at(sim.z + Math.max(1, sim.vz * 0.35));
  let target = look.x,bridgeTarget;
  const item =
    collectItems &&
    t.pickups.find(
      (p) =>
        p.kind === "item" &&
        !p.taken &&
        p.z > sim.z - 1 &&
        p.z < sim.z + Math.max(10, sim.vz * 1.2),
    );
  if (item) target = item.x;
  // The native wooden bridges have their own path, offset from mainPath.
  // Aim through the visible deck instead of collecting an item through a rail.
  const bridge=t.native?.meshes.find(m=>/wooden bridge/.test(m.name)&&
    sim.z>=m.bounds.min[2]-14&&sim.z<m.bounds.max[2]+1);
  if(bridge) {
    const z=clamp(sim.z+Math.max(3,sim.vz*.5),bridge.bounds.min[2]+.1,bridge.bounds.max[2]-.1);
    const xs=[];
    for(let cell=Math.floor(bridge.bounds.min[0]/8);cell<=Math.floor(bridge.bounds.max[0]/8);cell++)
      for(const triangle of t.native.surfaceCells.get(cell+':'+Math.floor(z/8))||[]) {
        if(triangle.name!==bridge.name)continue;
        const v=triangle.v;
        for(const [a,b] of [[0,3],[3,6],[6,0]]) {
          if(z<Math.min(v[a+2],v[b+2])||z>Math.max(v[a+2],v[b+2])||Math.abs(v[b+2]-v[a+2])<1e-8)continue;
          xs.push(v[a]+(v[b]-v[a])*(z-v[a+2])/(v[b+2]-v[a+2]));
        }
      }
    if(xs.length)bridgeTarget=target=(Math.min(...xs)+Math.max(...xs))*.5;
  }
  const danger = t.obstacles.find(
    (o) => !o.hit && o.z > sim.z - 3 && o.z < sim.z + Math.max(9, sim.vz * 0.9),
  );
  if (danger && Math.abs(target - danger.x) < 3.1) {
    const r = t.at(danger.z),
      left = danger.x - 3.3,
      right = danger.x + 3.3;
    target = Math.abs(left - look.x) < Math.abs(right - look.x) ? left : right;
    target = clamp(target, r.x - r.half + 1.2, r.x + r.half - 1.2);
  }
  // Source scatter is not moved aside for QA: choose a clear corridor with input.
  if (t.native && sim.effect !== "apple") {
    const horizon = Math.max(7, sim.speed * 0.8),
      hazards = t.environment.filter(
        (o) => {
          if(o.hit || o.z<=sim.z-2 || o.z>=sim.z+horizon)return false;
          const eta=Math.max(0,o.z-sim.z)/Math.max(2,sim.vz);
          const y=sim.onGround?t.at(o.z).y:sim.y+sim.vy*eta-4.9*eta*eta;
          // Vegetation below an elevated deck is not in the car's corridor.
          return y-1<o.y+o.height && y+2>o.y;
        },
      );
    if (hazards.length) {
      let best = target,
        score = Infinity;
      for (let offset = -6; offset <= 6; offset += 0.6) {
        const candidate = look.x + offset;
        let cost =
          (candidate - target) ** 2 * 0.35 + (candidate - sim.x) ** 2 * 0.04;
        const surface = t.ground(candidate, sim.z + Math.max(3, sim.vz * 0.35));
        if (!surface) cost += 300;
        else cost += Math.max(0, Math.abs(surface.height - look.y) - 2) * 6;
        for (const h of hazards) {
          const z = Math.max(0, h.z - sim.z),
            reach = clamp(z / Math.max(1, sim.speed * 0.35), 0, 1);
          const x =
            sim.x +
            (candidate - sim.x) * reach +
            (t.at(h.z).x - look.x) * reach;
          const overlap = h.radius + 1.3 - Math.abs(x - h.x);
          if (overlap > 0)
            cost += overlap * overlap * 100 * (1 - z / (horizon * 1.3));
        }
        if (cost < score) {
          score = cost;
          best = candidate;
        }
      }
      target = best;
    }
  }
  // Bicycle look-ahead control: commands the front wheel angle, with yaw
  // feedback. The old velocity command is invalid for force-based steering.
  if(bridgeTarget!==undefined)target=bridgeTarget;
  const horizon = Math.max(5, sim.speed * .65);
  const course = t.at(sim.z + horizon);
  const desiredYaw = Math.atan2(target + course.x - look.x - sim.x, horizon);
  const error = Math.atan2(Math.sin(desiredYaw - sim.yaw), Math.cos(desiredYaw - sim.yaw));
  const desiredRate = 2 * Math.max(1, sim.speed) * Math.sin(error) / horizon;
  const rate = sim.angularVelocity?.[1] || 0;
  const angle = Math.atan(2.86 * (desiredRate + .35 * (desiredRate-rate)) / Math.max(2,sim.speed));
  return clamp(-angle / (steeringDegrees(sim.speed) * Math.PI/180),-1,1);

}
export function drive(sim, dt, collectItems = true) {
  if (collectItems && shouldUseItem(sim)) sim.useItem();
  sim.step(dt, { steer: playerSteer(sim, collectItems) });
}

// Release charge is player input, not a physics override. At the strongest
// slingshot, these charges keep the glider/landing approach on the road.
export function launchInput(sim) {
  const id=sim.track.level?.id;
  const power=id==='rainbow-road' && sim.stats.carLevel>=15 && sim.stats.slingLevel>=20 ? .65 :
    sim.stats.carLevel>=25 && sim.stats.slingLevel>=20 && id==='savannah' ? .5 :
    sim.stats.carLevel>=25 && sim.stats.slingLevel>=20 && id==='ski-resort' ? .85 :
    sim.stats.carLevel>=25 && sim.stats.slingLevel>=20 && id==='west-coast' ? .95 :
    // Charge is part of the driving fixture; solid obstacles now require
    // a clear approach, including the phase of rotating gates.
    sim.stats.carLevel>=25 && sim.stats.slingLevel>=20 && id==='formula' ? .8 : 1;
  return {power,aim:0};
}
export function launchForRoute(sim) {
  const {power,aim}=launchInput(sim);sim.launch(power,aim);return {power,aim};
}
