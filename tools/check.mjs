import fs from "node:fs";
import assert from "node:assert/strict";
import { Track } from "../src/track.js";
import { CarSimulation } from "../src/physics.js";
import { CONFIG } from "../src/config.js";
import {
  vehicleStats,
  pullDistance,
  maxUpgradeFor,
} from "../src/progression.js";
import { drive, launchForRoute } from "./test-driver.mjs";
import { upgradeCost, incomeMultiplier } from "../src/save.js";
import { loadTestLevel } from "./load-native-test-level.mjs";
const root = new URL("../", import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, root), "utf8"));
const manifest = read("public/assets/manifest.json"),
  dt = CONFIG.physics.fixedStep;
for (const level of manifest.levels) await loadTestLevel(level);
const report = {
  timestamp: new Date().toISOString(),
  scope:
    "Production simulation modules, native data assertions, no DOM/WebGL claim",
  routes: [],
  flatProgression: [],
  assertions: [],
};
function check(name, fn) {
  fn();
  report.assertions.push(name);
}
const flat = () => ({
  startZ: 0,
  endZ: 2000,
  space: false,
  snow: false,
  obstacles: [],
  environment: [],
  pickups: [],
  boosters: [],
  reset() {},
  at() {
    return { x: 0, y: 0, baseY: 0, half: 1000 };
  },
  ground() {
    return { height: 0, road: true, type: "road" };
  },
});
function coast(car, sling = 0, power = 1, input = {}) {
  let finishes = 0;
  const sim = new CarSimulation(flat(), { car, sling }, (e) => {
    if (e === "finish") finishes++;
  });
  sim.launch(power);
  let last = Infinity;
  for (let n = 0; n < 25000 && sim.status === "running"; n++) {
    sim.step(dt, input);
    if (!sim.springActive) {
      assert(
        sim.speed <= last + 1e-9,
        "Speed increases without source of energy",
      );
      last = sim.speed;
    }
  }
  assert.equal(finishes, 1);
  assert.equal(sim.speed, 0);
  assert.equal(sim.status, "failed");
  return sim;
}
check(
  "Vehicle upgrade tables, body drag, mass, spring force and wheel stages",
  () => {
    const expected = [
      [0, 0.2, false, 0],
      [4, 0.14, false, 0],
      [5, 0.2, true, 0],
      [10, 0.1, true, 1],
      [15, 0.03, true, 1],
      [20, 0.005, true, 2],
      [25, 0, true, 2],
    ];
    for (const [car, damping, wheels, stage] of expected) {
      const s = vehicleStats({ car });
      assert(Math.abs(s.groundDamping - damping) < 1e-7);
      assert.equal(s.hasWheels, wheels);
      assert.equal(s.stage, stage);
      assert.equal(s.mass, 300);
      assert(Math.abs(s.airDamping - 0.05) < 1e-7);
    }
    assert.equal(vehicleStats({ sling: 0 }).springForce, 12500);
    assert.equal(vehicleStats({ sling: 5 }).springForce, 20000);
    assert.equal(vehicleStats({ sling: 20 }).springForce, 50000);
    assert.equal(pullDistance(0), 1);
    assert.equal(pullDistance(1), 3);
    assert.equal(maxUpgradeFor("car"), 25);
  },
);
check("Starting-level upgrade prices and income milestones", () => {
  const s = { level: "savannah", upgrades: { car: 0, sling: 0, income: 0 } };
  assert.equal(upgradeCost(s, "car"), 30);
  assert.equal(upgradeCost(s, "sling"), 30);
  s.upgrades.car = 1;
  assert.equal(upgradeCost(s, "car"), 37);
  for (const [n, m] of [
    [0, 1],
    [1, 1.1],
    [4, 1.4],
    [5, 2],
    [10, 4],
    [15, 8],
  ]) {
    s.upgrades.income = n;
    assert.equal(incomeMultiplier(s), m);
    assert.equal(upgradeCost(s, "income"), Math.trunc(30 * 1.5 ** n));
  }
});
check(
  "Flat coasting: low levels stop early; every purchase improves range; no powered driving",
  () => {
    for (let car = 0; car <= 25; car++) {
      const s = coast(car);
      report.flatProgression.push({
        car,
        sling: 0,
        distance: s.distance,
        peakSpeed: s.maxSpeed,
        seconds: s.elapsed,
      });
      if (car)
        assert(
          s.distance > report.flatProgression[car - 1].distance,
          "Car upgrade did not increase distance",
        );
    }
    assert(report.flatProgression[0].distance < 40);
    assert(
      report.flatProgression[5].distance >
        report.flatProgression[4].distance * 1.3,
      "Installing wheels must still give a substantial range gain with faster final stopping",
    );
  },
);
check(
  "Spring acts briefly then ends; stronger pull and sling increase range",
  () => {
    const a = coast(10, 0, 1),
      b = coast(10, 0, 1 / 3),
      c = coast(10, 20, 1);
    assert(a.springEndTime > 0 && a.springEndTime < 0.5);
    assert(c.springEndTime < a.springEndTime);
    assert(a.distance > b.distance * 2);
    assert(c.distance > a.distance * 1.8);
  },
);
check("Pitch/steering input cannot provide propulsion", () => {
  const plain = coast(10),
    pitch = coast(10, 0, 1, { pitch: 1 }),
    steer = coast(10, 0, 1, { steer: 1 });
  assert(Math.abs(plain.distance - pitch.distance) < 1e-9);
  assert(steer.distance < plain.distance);
  assert(Math.abs(steer.speed) < 1e-9);
});
for (const level of manifest.levels) {
  check(
    level.id +
      ": configured path; low-level result; upgraded full route via steering and pickups",
    () => {
      assert(level.sourceRoute);
      assert(level.samples.length > 100, "Track must contain a detailed driving path");
      const low = new CarSimulation(new Track(level), { car: 0, sling: 0 });
      assert.equal(low.track.ramps.length, 0);
      low.launch(1);
      for (let n = 0; n < 25000 && low.status === "running"; n++)
        drive(low, dt);
      assert.equal(low.status, "failed");
      assert(["Coast complete","Fell off the course","Left the track"].includes(low.reason));
      // Removing adhesion increases downhill launch range. Zero upgrades
      // must still fail within the first quarter, without an engine boost.
      assert(low.distance < (low.track.endZ-low.track.startZ)*.25);
      assert(low.airtime > 1, "Native launch slope must produce flight");
      const high = new CarSimulation(new Track(level), { car: 25, sling: 20 });
      const input = launchForRoute(high);
      for (let n = 0; n < 25000 && high.status === "running"; n++)
        drive(high, dt);
      assert.equal(
        high.status,
        "success",
        level.id + " upgraded run cannot finish",
      );
      report.routes.push({
        id: level.id,
        input,
        low: low.snapshot(),
        upgraded: high.snapshot(),
      });
    },
  );
}
check("Collisions remove energy and damage the car", () => {
  const testTrack = flat();
  testTrack.obstacles.push({ x: 0, y: 0.5, z: 100, width: 2.6, hit: false });
  const s = new CarSimulation(testTrack, {
    car: 10,
    sling: 5,
  });
  s.launch(1);
  for (let i = 0; i < 100; i++) s.step(dt);
  const o = s.track.obstacles[0];
  s.x = o.x;
  s.y = o.y;
  s.z = o.z;
  const before = s.speed;
  s.step(dt);
  assert.equal(s.collisions, 1);
  assert(s.health < 100);
  assert(s.speed < before);
});
check("All three consumables apply once and expire", () => {
  for (const kind of ["pepper", "glider", "apple"]) {
    const s = new CarSimulation(flat(), { car: 25, sling: 20 });
    s.launch(1);
    for (let i = 0; i < 100; i++) s.step(dt);
    s.item = kind;
    assert(s.useItem());
    assert(!s.useItem());
    assert.equal(s.effect, kind);
    for (let i = 0; i < 2000; i++) s.step(dt);
    assert.equal(s.effect, null);
  }
});
check("Fixed 200Hz simulation is invariant to render frame cadence", () => {
  const a = new CarSimulation(flat(), { car: 10, sling: 5 }),
    b = new CarSimulation(flat(), { car: 10, sling: 5 });
  a.launch(1);
  b.launch(1);
  for (let i = 0; i < 2400; i++)
    a.step(dt, { steer: Math.sin(i * 0.001) * 0.1 });
  let acc = 0,
    tick = 0;
  for (let frame = 0; frame < 720; frame++) {
    acc += 1 / 60;
    while (acc >= dt - 1e-10) {
      b.step(dt, { steer: Math.sin(tick * 0.001) * 0.1 });
      acc -= dt;
      tick++;
    }
  }
  assert.equal(tick, 2400);
  assert(Math.abs(a.z - b.z) < 1e-9);
});
report.passed = true;
fs.writeFileSync(
  new URL("output/physics-tests.json", root),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      passed: true,
      assertions: report.assertions,
      flatProgression: report.flatProgression.filter((r) => r.car % 5 === 0),
      routes: report.routes.map((r) => ({
        id: r.id,
        lowDistance: r.low.distance,
        upgraded: r.upgraded.status,
        seconds: r.upgraded.elapsed,
      })),
    },
    null,
    2,
  ),
);
