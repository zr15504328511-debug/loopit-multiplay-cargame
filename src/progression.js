import { CONFIG } from "./config.js";
import { NATIVE } from "./native-physics.js";
import { clamp, smooth } from "./math.js";
import { advanceContact, groundPitch } from "./ground-contact.js";

export function maxUpgradeFor(type) {
  return type === "car"
    ? CONFIG.coasting.frontWheelsFirst
      ? 35
      : 25
    : type === "sling"
      ? 20
      : 15;
}
export function pullDistance(power) {
  return clamp(power * NATIVE.maxPull, NATIVE.minPull, NATIVE.maxPull);
}
export function vehicleStats(upgrades = {}) {
  const carLevel = clamp(
    Math.floor(Number(upgrades.car) || 0),
    0,
    maxUpgradeFor("car"),
  );
  const slingLevel = clamp(
    Math.floor(Number(upgrades.sling) || 0),
    0,
    maxUpgradeFor("sling"),
  );
  const split = CONFIG.coasting.frontWheelsFirst;
  const row = NATIVE.rows[carLevel][split ? "carTrue" : "carFalse"];
  const stage =
    NATIVE.carStages[split ? "frontWheelsFirstTrue" : "frontWheelsFirstFalse"][
      row.stageIndex
    ];
  const sourceTier = stage.sourceTier,
    hasWheels = sourceTier > 0;
  const wheelMode = hasWheels ? stage.wheels : "none";
  const springForce = NATIVE.rows[slingLevel].slingshotForce;
  const partialChassis = wheelMode === "front" && sourceTier === 1;
  return {
    carLevel,
    slingLevel,
    tier: row.stageIndex,
    sourceTier,
    stage: sourceTier < 2 ? 0 : sourceTier < 4 ? 1 : 2,
    stageName:
      [
        "Frame",
        "Wheels",
        "Body",
        "Upgraded Wheels",
        "Pro Kit",
        "Final Upgrade",
      ][sourceTier] + (stage.wheels === "front" ? " · Front Wheels" : ""),
    hasWheels,
    wheelMode,
    goldWheels: sourceTier >= 3,
    springForce,
    mass: NATIVE.mass,
    launchSpeed: NATIVE.maxPull * Math.sqrt(springForce / NATIVE.mass),
    groundDamping: row.groundSpeedDamping,
    airDamping: NATIVE.bodyDamping,
    // Chassis contact uses an approximate planar Coulomb friction model.
    rollingResistance:
      (!hasWheels ? 1 : partialChassis ? 0.5 : 0) *
      CONFIG.coasting.chassisFriction *
      CONFIG.physics.gravity,
    airResistance: 0,
    rideHeight: hasWheels
      ? CONFIG.coasting.wheelRideHeight
      : CONFIG.coasting.chassisRideHeight,
    steeringAngle: CONFIG.coasting.steeringAngle,
    maxLateralAcceleration: CONFIG.physics.maxLateralAcceleration,
    dampingEvidence: "configured-vehicle-parameters",
  };
}
export function decaySpeed(speed, damping, resistance, dt) {
  return Math.max(0, speed * Math.max(0, 1 - damping * dt) - resistance * dt);
}
// A smooth minimum deceleration for the final ground roll, requested to
// remove long waiting at walking speed. Never brakes a launch, flight or item.
export function coastFinishBrake(body, dt) {
  const c = CONFIG.coasting;
  const active = body.onGround && !body.springActive && !body.effect &&
    body.elapsed > c.stickyStopDelay && body.speed > 0 && body.speed <= c.lowSpeedBrakeStart;
  body.lowSpeedStopTime = active ? (body.lowSpeedStopTime || 0) + dt : 0;
  const t = clamp(body.lowSpeedStopTime / c.lowSpeedBrakeRamp,0,1);
  return c.lowSpeedDeceleration * t*t*(3-2*t);
}
// Integration order: forces, then body drag, then position.
export function coastStep(
  speed,
  stats,
  {
    dt,
    grounded = true,
    springAcceleration = 0,
    sticky = false,
    offroad = false,
    minimumDeceleration = 0,
  },
) {
  const previous = speed;
  speed = Math.max(
    0,
    speed +
      (springAcceleration -
        (grounded
          ? stats.groundDamping * speed + stats.rollingResistance
          : 0)) *
        dt,
  );
  const coast = decaySpeed(
    speed,
    stats.airDamping +
      (sticky ? NATIVE.extraStopDrag : 0) +
      (offroad ? CONFIG.coasting.offroadDamping : 0),
    0,
    dt,
  );
  return grounded && springAcceleration === 0
    ? Math.min(coast,Math.max(0,previous-minimumDeceleration*dt))
    : coast;
}
const previews = new WeakMap();
// Short unsteered guide using the same gravity/contact integration as launch.
// Obstacles, pickups and subsequent player input are deliberately not predicted.
export function previewLaunch(stats, power, yaw, track) {
  const key = [stats.carLevel,stats.slingLevel,power,yaw].join(':');
  const cached = previews.get(track);
  if (cached?.key === key) return cached.points;
  const distance = pullDistance(power),
    anchor = track.at(track.startZ),
    dt = CONFIG.physics.fixedStep;
  const body = {x:anchor.x-Math.sin(yaw)*distance,
    z:track.startZ-Math.cos(yaw)*distance,yaw,roll:0,vx:0,vy:0,vz:0,speed:0,onGround:true,elapsed:0};
  body.y = (track.ground(body.x,body.z)?.height ?? anchor.y)+stats.rideHeight;
  body.pitch = groundPitch(track,body.x,body.z,yaw);
  const points = [];
  for (let i = 0; i < 360; i++) {
    body.elapsed += dt;
    body.springActive = body.z <= track.startZ;
    const acceleration = Math.max(0,track.startZ-body.z)*stats.springForce/stats.mass;
    body.speed = coastStep(body.speed, stats, {
      dt,
      grounded:body.onGround,
      springAcceleration: acceleration*Math.cos(body.pitch),
      minimumDeceleration:coastFinishBrake(body,dt),
    });
    body.vx = Math.sin(yaw)*body.speed;
    body.vz = Math.cos(yaw)*body.speed;
    body.vy = (body.vy+(-acceleration*Math.sin(body.pitch)-CONFIG.physics.gravity)*dt)*
      Math.max(0,1-stats.airDamping*dt);
    body.pitch = smooth(body.pitch,body.onGround ? groundPitch(track,body.x,body.z,yaw) :
      clamp(-body.vy*.022,-.6,.65),body.onGround?10:3,dt);
    advanceContact(body,track,stats.rideHeight,dt);
    if (i % 24 === 23)
      points.push([body.x,body.y+.18,body.z]);
  }
  previews.set(track,{key,points});
  return points;
}
