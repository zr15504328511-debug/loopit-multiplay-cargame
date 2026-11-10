import assert from "node:assert/strict";
import { CarSimulation } from "../src/physics.js";
import { CONFIG } from "../src/config.js";
import {
  ROOM_ITEMS, ROOM_ITEM_IDS, ROOM_UPGRADES, normalizeRoomItem,
  roomSimulationOptions, roomItemState,
} from "../src/room-items.js";

const dt = CONFIG.physics.fixedStep;
const flat = () => ({
  startZ: 0, endZ: 2000, snow: false, space: false,
  obstacles: [], environment: [], pickups: [], boosters: [],
  reset() {},
  at() { return { x: 0, y: 0, baseY: 0, half: 1000 }; },
  ground() { return { height: 0, road: true, type: "road" }; },
});
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
function launched(kind) {
  const sim = new CarSimulation(flat(), ROOM_UPGRADES, () => {}, roomSimulationOptions(kind));
  sim.launch(.6);
  for (let i = 0; i < 1000 && sim.springActive; i++) sim.step(dt);
  assert.equal(sim.springActive, false, "Fixture must leave the slingshot normally");
  assert.equal(sim.status, "running");
  return sim;
}

check("Exactly two choices; invalid old choices fall back safely; config is independent", () => {
  assert.deepEqual(ROOM_ITEM_IDS, ["pepper", "glider"]);
  assert.equal(normalizeRoomItem("apple"), "pepper");
  assert.equal(normalizeRoomItem("__proto__"), "pepper");
  const first = roomSimulationOptions("glider");
  first.initialItem = "pepper";
  assert.equal(roomSimulationOptions("glider").initialItem, "glider");
  assert.notEqual(ROOM_ITEMS, CONFIG.items);
  assert.equal(CONFIG.items.pepper.boost, 17);
  assert.equal(CONFIG.items.glider.duration, 6);
});
check("No activation in lobby or while the spring still pulls", () => {
  const sim = new CarSimulation(flat(), ROOM_UPGRADES, () => {}, roomSimulationOptions("pepper"));
  assert.equal(sim.item, "pepper");
  assert.equal(roomItemState(sim).charges, 1);
  assert.equal(sim.useItem(), false);
  sim.launch(.6);
  assert.equal(sim.useItem(), false);
  assert.equal(sim.item, "pepper");
  assert.equal(roomItemState(sim).canUse, false);
  assert.equal(sim.itemUses, 0);
});
check("Chili adds one bounded burst, never an extra jump or second charge", () => {
  const sim = launched("pepper");
  const before = { speed: sim.speed, vy: sim.vy };
  assert.equal(roomItemState(sim).canUse, true);
  assert.equal(sim.useItem(), true);
  assert.equal(sim.speed, Math.min(CONFIG.physics.maxSpeed, before.speed + 25));
  assert.equal(sim.vy, before.vy);
  assert.equal(sim.effectTime, 1.2);
  assert.equal(sim.itemUses, 1);
  assert.equal(sim.item, null);
  assert.equal(roomItemState(sim).charges, 0);
  assert.equal(sim.useItem(), false);
  // Even an accidentally reintroduced pickup must not bypass the run quota.
  sim.item = "glider";
  assert.equal(sim.useItem(), false);
  assert.equal(roomItemState(sim).canUse, false);
  sim.reset();
  assert.equal(sim.item, "pepper");
  assert.equal(sim.itemUses, 0);
});
check("Glider lasts five seconds, without added horizontal speed", () => {
  const sim = launched("glider");
  const before = { speed: sim.speed, vy: sim.vy, y: sim.y };
  assert.equal(sim.useItem(), true);
  assert.equal(sim.effectTime, 5);
  assert.equal(sim.speed, before.speed);
  assert.equal(sim.vy, Math.max(before.vy, 1));
  assert(Math.abs(sim.y - before.y - .1) < 1e-10);
  assert.equal(sim.onGround, false);
  assert.equal(roomItemState(sim).active, true);
  assert.equal(roomItemState(sim).remaining, 5);
});
check("Room pickup suppression blocks both coins and replacement items", () => {
  const sim = launched("pepper");
  sim.useItem();
  sim.track.pickups.push(
    { kind: "coin", x: sim.x, y: sim.y, z: sim.z, taken: false },
    { kind: "item", item: "apple", x: sim.x, y: sim.y, z: sim.z, taken: false },
  );
  sim.step(dt);
  assert.equal(sim.runCoins, 0);
  assert.equal(sim.item, null);
  assert(sim.track.pickups.every((p) => !p.taken));
});
check("Legacy simulations keep their original item behavior", () => {
  const sim = new CarSimulation(flat(), ROOM_UPGRADES);
  assert.equal(sim.item, null);
  sim.launch(.6);
  sim.item = "pepper";
  const beforeSpeed = sim.speed;
  assert.equal(sim.useItem(), true);
  assert.equal(sim.speed, beforeSpeed + 17);
  assert.equal(sim.effectTime, 3.2);
  sim.item = "glider";
  assert.equal(sim.useItem(), true);
  assert.equal(sim.effectTime, 6);
  assert.equal(sim.vy, 3);
});

console.log(JSON.stringify({ checks: checks.length, passed: checks }, null, 2));
