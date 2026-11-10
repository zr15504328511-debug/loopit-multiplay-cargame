import { steeringDegrees } from "./vehicle-dynamics.js";
import { createWheelState, updateWheels } from "./wheel-state.js";
import { CONFIG } from "./config.js";
import { clamp, smooth } from "./math.js";
import { vehicleStats, pullDistance, coastStep, coastFinishBrake } from "./progression.js";
import { advanceContact, groundPitch } from "./ground-contact.js";
export class CarSimulation {
  constructor(track, upgrades, emit = () => {}, options = {}) {
    this.track = track;
    this.upgrades = upgrades;
    this.emit = emit;
    this.options = options;
    this.reset();
  }
  reset() {
    this.track.reset();
    this.stats = vehicleStats(this.upgrades);
    this.wheels = createWheelState();
    this.steeringHeading = 0;
    this.angularVelocity = [0,0,0];
    const r = this.track.at(this.track.startZ);
    this.x = r.x;
    this.y =
      (this.track.ground(r.x, this.track.startZ)?.height ?? r.y) +
      this.stats.rideHeight;
    this.z = this.track.startZ;
    this.vx = this.vy = this.vz = 0;
    this.speed = 0;
    this.launchSpeed = 0;
    this.springActive = false;
    this.springYaw = 0;
    this.springEndTime = null;
    this.stickyStopping = false;
    this.lowSpeedStopTime = 0;
    this.lowSpeedBraking = false;
    this.yaw = this.roll = 0;
    this.pitch = groundPitch(this.track, this.x, this.z, 0);
    this.steer = 0;
    this.health = 100;
    this.runCoins = 0;
    this.elapsed = 0;
    this.airtime = 0;
    this.maxSpeed = 0;
    this.distance = 0;
    this.item = this.options.initialItem || null;
    this.itemUses = 0;
    this.effect = null;
    this.effectTime = 0;
    this.onGround = true;
    this.status = "ready";
    this.crashCooldown = 0;
    this.stopTime = 0;
    this.surface = "road";
    this.landings = 0;
    this.collisions = 0;
    this.boosts = 0;
  }
  launch(power, aim = 0) {
    if (this.status !== "ready") return;
    this.stats = vehicleStats(this.upgrades);
    this.wheels = createWheelState();
    this.steeringHeading = 0;
    this.angularVelocity = [0,0,0];
    const stretch = pullDistance(power),
      anchor = this.track.at(this.track.startZ);
    this.x = anchor.x - Math.sin(aim) * stretch;
    this.z = this.track.startZ - Math.cos(aim) * stretch;
    this.y =
      (this.track.ground(this.x, this.z)?.height ?? anchor.y) +
      this.stats.rideHeight;
    this.speed = this.launchSpeed = this.vx = this.vy = this.vz = 0;
    this.springYaw = this.yaw = this.steeringHeading = aim;
    this.pitch = groundPitch(this.track, this.x, this.z, aim);
    this.springActive = true;
    this.onGround = true;
    this.status = "running";
    this.emit("launch", power);
  }
  setSpeed(value) {
    const old = Math.hypot(this.vx, this.vz);
    this.speed = clamp(value, 0, CONFIG.physics.maxSpeed);
    this.vx = old > 0 ? (this.vx * this.speed) / old : 0;
    this.vz = old > 0 ? (this.vz * this.speed) / old : this.speed;
  }
  useItem() {
    if (this.status !== "running" || !this.item) return false;
    const kind = this.item;
    const rules = this.options.itemRules || CONFIG.items;
    const item = rules[kind];
    if (!item || this.itemUses >= (this.options.maxItemUses ?? Infinity) ||
      (this.options.itemAfterRelease && this.springActive)) return false;
    this.item = null;
    this.itemUses++;
    this.effect = kind;
    this.effectTime = item.duration;
    this.lowSpeedStopTime = 0;
    this.lowSpeedBraking = false;
    if (kind === "pepper") {
      this.setSpeed(this.speed + item.boost);
      this.vy += this.onGround ? (item.groundLift ?? 1) : 0;
    }
    if (kind === "glider") {
      this.vy = Math.max(this.vy, item.lift ?? 3);
      this.y += item.heightOffset ?? 0.1;
      this.onGround = false;
    }
    if (kind === "apple") {
      this.health = Math.min(100, this.health + 18);
      this.setSpeed(this.speed + item.boost);
    }
    this.emit("item", kind);
    return true;
  }
  step(dt, input = {}) {
    if (this.status !== "running") return;
    const p = CONFIG.physics;
    this.elapsed += dt;
    this.effectTime -= dt;
    if (this.effectTime <= 0) this.effect = null;
    this.crashCooldown = Math.max(0, this.crashCooldown - dt);
    const target = clamp(input.steer || 0, -1, 1);
    this.steer = smooth(this.steer, target, p.steeringAssist, dt);
    const ground = this.track.ground(this.x, this.z),
      r = this.track.at(this.z),
      offroad = ground && !ground.road;
    const stats = this.stats;
    // Native Slingshot.OnEarlyFixedUpdate: only pulls until crossing its release plane.
    if (this.springActive && this.z > this.track.startZ) {
      this.springActive = false;
      this.springEndTime = this.elapsed;
    }
    const springAcceleration = this.springActive
      ? (Math.max(0, this.track.startZ - this.z) * stats.springForce) /
        stats.mass
      : 0;
    this.stickyStopping =
      !this.springActive &&
      this.onGround &&
      this.elapsed > CONFIG.coasting.stickyStopDelay &&
      this.speed < CONFIG.coasting.stickyStopSpeed;
    // Ground force and rigid-body damping are distinct original terms; no engine.
    // The road height/contact solver and steering remain browser approximations.
    const minimumDeceleration = coastFinishBrake(this,dt);
    this.lowSpeedBraking = minimumDeceleration > 0;
    this.speed = coastStep(this.speed, stats, {
      dt,
      grounded: this.onGround,
      springAcceleration: springAcceleration * Math.cos(this.pitch),
      sticky: this.stickyStopping,
      offroad,
      minimumDeceleration,
    });
    if (
      this.stickyStopping &&
      this.speed <=
        Math.max(
          CONFIG.coasting.stopCompleteSpeed,
          CONFIG.coasting.numericalSleepSpeed,
        )
    )
      this.speed = 0;
    this.launchSpeed = Math.max(this.launchSpeed, this.speed);
    const grip = this.track.snow ? 3.6 : p.lateralGrip;
    // Source wheel angle is degrees and falls 20 -> 2 with 3D speed.
    // Bicycle yaw is an explicit approximation until Replica's rigid-body
    // contact solver passes all routes; it replaces fixed lateral steering.
    const wheelAngle = -this.steer * steeringDegrees(Math.hypot(this.vx,this.vy,this.vz)) * Math.PI / 180;
    const yawRate = this.stats.hasWheels ? Math.tan(wheelAngle) * this.speed / 2.86 : 0;
    if (this.stats.hasWheels && !this.springActive) this.steeringHeading += yawRate * dt;
    const desiredLateral = this.stats.hasWheels
        ? Math.sin(this.steeringHeading) * this.speed
        : -this.steer * Math.sin(stats.steeringAngle) * this.speed,
      maxLateral = stats.maxLateralAcceleration * (this.onGround ? 1 : .7);
    this.angularVelocity = [0,yawRate,0];
    if (this.springActive) this.vx = Math.sin(this.springYaw) * this.speed;
    else
      this.vx +=
        clamp(
          (desiredLateral - this.vx) * (this.onGround ? grip : 2.8),
          -maxLateral,
          maxLateral,
        ) * dt;
    this.vx = clamp(this.vx, -this.speed * 0.8, this.speed * 0.8);
    this.vz = Math.sqrt(
      Math.max(0, this.speed * this.speed - this.vx * this.vx),
    );
    // Native spring force follows car.forward in 3D. Gravity remains active
    // on the ground too; only compressive contact cancels inward velocity.
    this.vy = (this.vy + (-springAcceleration * Math.sin(this.pitch) -
      p.gravity * (this.effect === "glider" ? (this.options.itemRules || CONFIG.items).glider.gravity : 1)) * dt) *
      Math.max(0, 1-stats.airDamping*dt);
    if (this.onGround) {
      this.pitch = smooth(this.pitch, groundPitch(this.track,this.x,this.z,this.yaw,this.y+.3), 10, dt);
      this.roll = smooth(this.roll, this.steer * 0.09, 10, dt);
    } else {
      const pitchInput = clamp(input.pitch || 0, -1, 1);
      this.pitch = smooth(
        this.pitch,
        clamp(-this.vy * 0.022 + pitchInput * 0.45, -0.6, 0.65),
        3,
        dt,
      );
      this.roll = smooth(this.roll, this.steer * 0.2, 5, dt);
    }
    this.vz = clamp(this.vz, 0, p.maxSpeed);
    // Resolve the footprint in the pose that will actually be rendered.
    this.yaw = smooth(
      this.yaw,
      this.stats.hasWheels ? this.steeringHeading : Math.atan2(this.vx, Math.max(5, this.vz)),
      5,
      dt,
    );
    const {ground: next, landed, impact, wallImpact} = advanceContact(this,this.track,stats.rideHeight,dt);
    if(wallImpact>1 && this.crashCooldown===0) {
      this.collisions++;
      if(this.effect!=="apple")this.health-=Math.min(16,wallImpact*.8);
      this.crashCooldown=.4;
      this.emit("crash",{x:this.x,y:this.y,z:this.z});
    }
    if (this.onGround) {
        if (landed && impact > 3) {
          this.landings++;
          this.emit("land", impact);
          if (impact > 28 && this.effect !== "apple")
            this.health -= Math.min(15, Math.max(0, impact - 28) * 0.5);
        }
        this.surface = next.type;
    }
    if (!this.onGround) {
      this.surface = "air";
      this.airtime += dt;
    }
    updateWheels(this, dt);
    for (const o of this.track.obstacles) {
      if (
        o.hit ||
        Math.abs(this.z - o.z) > 2.1 ||
        Math.abs(this.x - o.x) > o.width * 0.5 + 1 ||
        Math.abs(this.y - o.y) > 2
      )
        continue;
      o.hit = true;
      this.collisions++;
      if (this.effect !== "apple") {
        this.health -= Math.max(9, 23 - this.upgrades.car * 0.6);
        this.setSpeed(this.speed * 0.68);
        this.vx = clamp(
          this.vx + (this.x >= o.x ? 1 : -1) * 2,
          -this.speed * 0.7,
          this.speed * 0.7,
        );
        this.vz = Math.sqrt(
          Math.max(0, this.speed * this.speed - this.vx * this.vx),
        );
        this.crashCooldown = 0.4;
      }
      this.emit("crash", { x: o.x, y: o.y, z: o.z });
    }
    for (const o of this.track.environment) {
      if (
        o.meshCollision || o.hit ||
        this.y - stats.rideHeight > o.y + (o.height ?? 3) + 0.05 ||
        Math.abs(this.z - o.z) > o.radius + 1.4 ||
        Math.abs(this.x - o.x) > o.radius + 0.9 ||
        Math.abs(this.y - o.y) > 2.5
      )
        continue;
      o.hit = true;
      this.collisions++;
      if (this.effect !== "apple") {
        this.health -= 16;
        this.setSpeed(this.speed * 0.6);
        this.vx = (this.x >= o.x ? 1 : -1) * Math.min(2, this.speed * 0.7);
        this.vz = Math.sqrt(
          Math.max(0, this.speed * this.speed - this.vx * this.vx),
        );
      }
      this.emit("crash", o);
    }
    for (const pickup of this.options.pickups === false ? [] : this.track.pickups) {
      if (
        pickup.taken ||
        Math.abs(this.z - pickup.z) > 2.2 ||
        Math.abs(this.x - pickup.x) > 2 ||
        Math.abs(this.y - pickup.y) > 3
      )
        continue;
      pickup.taken = true;
      if (pickup.kind === "coin") {
        this.runCoins += 5;
        this.emit("coin");
      } else {
        if (!this.item) this.item = pickup.item;
        else this.runCoins += 10;
        this.emit("pickup", pickup.item);
      }
    }
    for (const b of this.track.boosters)
      if (
        !b.used &&
        Math.abs(this.z - b.z) < 3 &&
        Math.abs(this.x - b.x) < 3 &&
        this.onGround
      ) {
        b.used = true;
        this.setSpeed(this.speed + 8);
        this.boosts++;
        this.emit("boost");
      }
    this.distance = Math.max(this.distance, this.z - this.track.startZ);
    this.maxSpeed = Math.max(this.maxSpeed, Math.hypot(this.vx, this.vz));
    this.health = clamp(this.health, 0, 100);
    if (
      this.z >= this.track.endZ &&
      Math.abs(this.x - this.track.at(this.z).x) <
        this.track.at(this.z).half + 1 &&
      this.y >= this.track.at(this.z).y - 2 &&
      this.y < this.track.at(this.z).y + 25
    ) {
      this.status = "success";
      this.emit("finish", true);
      return;
    }
    if (this.speed === 0 && this.onGround) this.stopTime += dt;
    else this.stopTime = 0;
    const dropped = this.y < r.baseY - 20;
    const passed = this.z > this.track.endZ + 38;
    if (
      this.health <= 0 ||
      dropped ||
      this.stopTime > CONFIG.coasting.stopDelay ||
      passed ||
      this.elapsed > p.maxRunSeconds
    ) {
      this.status = "failed";
      this.reason =
        this.health <= 0
          ? "Car wrecked"
          : dropped
            ? this.track.space
              ? "Left the track"
              : "Fell off the course"
            : passed
              ? "Missed the finish"
              : "Coast complete";
      this.emit("finish", false);
    }
  }
  snapshot() {
    return {
      status: this.status,
      position: [this.x, this.y, this.z],
      velocity: [this.vx, this.vy, this.vz],
      angularVelocity: [...this.angularVelocity],
      wheelSteerAngle: this.wheelSteerAngle || 0,
      wheels: this.wheels.map(({name,contact,compression,omega,steer,forwardSlip,sidewaysSlip}) => ({name,contact,compression,omega,steer,forwardSlip,sidewaysSlip})),
      speed: this.speed,
      launchSpeed: this.launchSpeed,
      springActive: this.springActive,
      springEndTime: this.springEndTime,
      sourceTier: this.stats.sourceTier,
      springForce: this.stats.springForce,
      groundDamping: this.stats.groundDamping,
      stickyStopping: this.stickyStopping,
      lowSpeedBraking: this.lowSpeedBraking,
      health: this.health,
      distance: this.distance,
      elapsed: this.elapsed,
      coins: this.runCoins,
      item: this.item,
      effect: this.effect,
      onGround: this.onGround,
      airtime: this.airtime,
      groundClearance: this.y - this.stats.rideHeight -
        (this.track.ground(this.x,this.z)?.height ?? this.track.at(this.z).y),
      collisions: this.collisions,
      landings: this.landings,
      boosts: this.boosts,
    };
  }
}
