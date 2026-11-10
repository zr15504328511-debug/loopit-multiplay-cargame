import { Renderer } from "./renderer.js";
import { loadGLB } from "./glb.js";
import { Track } from "./track.js";
import { NativeTerrain } from "./native-terrain.js";
import { colliderMatrix } from "./scene-collisions.js";
import { CarSimulation } from "./physics.js";
import { GameAudio } from "./audio.js";
import { DemoRoom } from "./demo-room.js";
import { createRoomUI } from "./room-ui.js";
import { RoomWorld } from "./room-world.js";
import { RoomLobbyWorld } from "./room-lobby-world.js";
import { loadRoomArt } from "./room-native-art.js";
import { RoomVehicles } from "./room-vehicles.js";
import { ROOM_ITEMS, roomSimulationOptions, roomItemState } from "./room-items.js";
import { CONFIG, LEVEL_STYLE } from "./config.js";
import {
  loadSave,
  newProfile,
  storeSave,
  upgradeCost,
  incomeMultiplier,
  upgradeAvailable,
  purchaseUpgrade,
  switchProfile,
  distanceReward,
} from "./save.js";
import {
  isCampaign,
  campaignEntry,
  campaignLevels,
  physicalUpgrades,
  totalUpgrades,
  advanceCampaign,
} from "./campaign.js";
import { clamp, lerp, smooth, mul, trs, model, identity } from "./math.js";
import { blocksCamera, clearGroundSightline } from "./occlusion.js";
import { resultMarkup } from "./native-ui.js";
import { groundPitch } from "./ground-contact.js";
import {
  vehicleStats,
  maxUpgradeFor,
  pullDistance,
  previewLaunch,
} from "./progression.js";
const $ = (id) => document.getElementById(id),
  canvas = $("game");
// The product entry is the local room. The previous study mode remains isolated
// at ?mode=solo for physics regression checks; its save is never rewritten here.
const roomMode = new URLSearchParams(location.search).get('mode') !== 'solo';
document.body.classList.toggle('room-demo',roomMode);
let room, roomUI, roomWorld, roomLobby, roomVehicles, roomDrive={steer:0,throttle:0}, pendingRoomReturn=false, roomUIClock=0;
let renderer,
  manifest,
  track,
  scene,
  carAsset,
  wheelAsset,
  wheelAssets = new Map(),
  carInfo,
  sim,
  audio,
  level,
  decor = [],
  state = "loading",
  paused = false,
  power = 0,
  aim = 0,
  drag = null,
  keys = new Set(),
  touch = 0,
  chargeKey = false,
  chargeTime = 0,
  feedbackTime = 0,
  shake = 0,
  accumulator = 0,
  lastTime = 0,
  clock = 0,
  frameCount = 0,
  fps = 60,
  fpsClock = 0,
  loaded = 0;
let save = roomMode ? {...newProfile('practice'),car:'sports'} : loadSave();
const cache = new Map(),
  common = {},
  particles = [];
let cameraEye = [0, 30, -15],
  cameraTarget = [0, 20, 10];
let saveOk = true;
let launchSpeedForHUD = 1,
  previousHUDSpeed = 0,
  previousHUDTime = 0,
  hudClock = 0;
function persist() {
  if(roomMode) { if(room) {room.muted=save.muted;room.persist();saveOk=room.storageOK;} return; }
  saveOk = storeSave(save);
  if (!saveOk) toast("Browser storage unavailable. Progress cannot be saved.");
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").classList.remove("show"), 2500);
}
function feedback(text) {
  $("run-feedback").textContent = text;
  feedbackTime = 2;
}
const asset = (path) => {
  if (!cache.has(path)) cache.set(path, loadGLB("/" + path, renderer));
  return cache.get(path);
};
function setState(next) {
  state = next;
  if(roomMode){document.body.classList.toggle('in-room-lobby',next==='lobby');roomLobby?.setVisible(next==='lobby');}
  document.body.classList.toggle(
    "flight",
    next === "running" || next === "result",
  );
  document.body.classList.toggle("aim", next === "aiming");
  $("aim-ui").hidden = next !== "aiming";
  $("telemetry").hidden = next !== "running";
  $("flight-controls").hidden = next !== "running";
  $("garage").hidden = roomMode || next !== "ready";
  $("level-badge").hidden = roomMode || next !== "ready";
  $("phase-label").textContent =
    {
      ready: "Ready",
      aiming: "Aim",
      running: "Coasting",
      result: "Run",
      lobby: "Lobby",
    }[next] || "Loading";
}
function closeModal() {
  if (state === "result" && isCampaign(save) && save.campaign.pendingResult) {
    showResult(save.campaign.pendingResult);
    return;
  }
  $("modal").hidden = true;
  paused = false;
  audio?.pause(false);
  lastTime = performance.now();
}
function openModal(content) {
  $("modal-card").innerHTML = content;
  $("modal").hidden = false;
  paused = true;
  audio?.pause(true);
  $("modal-card")
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = closeModal));
  $("modal-card")
    .querySelectorAll("[data-mode]")
    .forEach(
      (b) => (b.onclick = () => changeMode(b.dataset.mode).catch(fatal)),
    );
}
function modeMarkup() {
  return `<div class="modal-actions mode-actions"><button class="${isCampaign(save) ? "primary" : "secondary"}" data-mode="campaign">CAMPAIGN</button><button class="${isCampaign(save) ? "secondary" : "primary"}" data-mode="practice">PRACTICE</button></div>`;
}
async function changeMode(mode) {
  if (mode === save.mode) {
    closeModal();
    return;
  }
  const next = switchProfile(save, mode);
  if (!next) {
    toast("Browser storage unavailable. Mode was not changed.");
    return;
  }
  save = next;
  if (audio.muted !== save.muted) audio.toggle();
  $("sound-button").textContent = save.muted ? "♩" : "♪";
  await changeCar(save.car);
  await loadLevel(save.level);
}
function upgradeUI() {
  if(roomMode) return;
  const stats = vehicleStats(physicalUpgrades(save));
  $("coins").textContent = save.coins.toLocaleString();
  $("mode-label").textContent = isCampaign(save)
    ? `Universe ${save.campaign.universeIndex + 1} · Level ${save.campaign.levelIndex + 1}`
    : "Solo · Practice";
  const ci = manifest?.cars.find((c) => c.id === save.car);
  if (ci)
    $("car-title").innerHTML =
      `${ci.title} <small>${stats.stageName} · ${stats.carLevel} upgrades</small>`;
  $("car-title").dataset.stage = String(stats.stage);
  for (const k of ["car", "sling", "income"]) {
    const max = !upgradeAvailable(save, k);
    $(`${k}-price`).textContent = max ? "MAX" : `● ${upgradeCost(save, k)}`;
    document.querySelector(`[data-upgrade="${k}"]`).disabled = max;
  }
  const u = physicalUpgrades(save);
  const nextCar = vehicleStats({
      ...u,
      car: Math.min(maxUpgradeFor("car"), u.car + 1),
    }),
    nextSling = vehicleStats({
      ...u,
      sling: Math.min(maxUpgradeFor("sling"), u.sling + 1),
    }),
    launchKmh = (s) => Math.round(s.launchSpeed * 3.6);
  $("car-upgrade-desc").textContent =
    `${u.car} upgrades this level · ${u.car >= maxUpgradeFor("car") ? "Final stage" : nextCar.stageName !== stats.stageName ? "Next: " + nextCar.stageName : "Improve coasting"}`;
  $("sling-upgrade-desc").textContent =
    `Full pull: ${launchKmh(stats)}${u.sling < maxUpgradeFor("sling") ? " → " + launchKmh(nextSling) : ""} km/h`;
  document.querySelector('[data-upgrade="car"]').title =
    "Add wheels, bodywork and parts to coast farther.";
  document.querySelector('[data-upgrade="sling"]').title =
    "Increase slingshot force. Launch speed also depends on pull distance and drag.";
  $("income-upgrade-desc").textContent =
    `${totalUpgrades(save, "income")} total upgrades · ×${incomeMultiplier(save).toFixed(1)} income`;
}
let carLoadVersion = 0;
async function changeCar(id) {
  if (isCampaign(save) && id !== campaignEntry(save).car) {
    toast("Your campaign car is assigned by the level.");
    return;
  }
  const ticket = ++carLoadVersion,
    info = manifest.cars.find((c) => c.id === id) || manifest.cars[0],
    native = renderer.nativeModels?.cars[info.id],
    wheels = [
      ...new Set(
        native?.stages.map((s) => s.wheelFile).filter(Boolean) || [
          info.wheelFile,
        ],
      ),
    ],
    models = await Promise.all([asset(info.file), ...wheels.map(asset)]);
  if (ticket !== carLoadVersion) return;
  carInfo = info;
  carInfo.nativeStages = native?.stages;
  carAsset = models[0];
  wheelAsset = models[1];
  wheelAssets = new Map(wheels.map((file, i) => [file, models[i + 1]]));
  save.car = carInfo.id;
  persist();
  upgradeUI();
}
async function loadLevel(id) {
  if (state === "loading" && track) return;
  if(roomMode&&!room.isUnlocked(id)) {roomUI.showNotice('Finish the previous map to unlock this one.');return;}
  if (isCampaign(save) && id !== campaignEntry(save).level) {
    toast("Complete the current campaign level to continue.");
    return;
  }
  setState("loading");
  $("loading").hidden = false;
  $("load-text").textContent = "Loading…";
  closeModal();
  audio?.stopFlight();
  if (track) track.dispose(renderer);
  level = manifest.levels.find((l) => l.id === id) || manifest.levels[0];
  renderer.lighting = renderer.nativeLighting?.levels[level.id];
  await renderer.nativePBS.reflection(renderer.lighting?.reflection);
  scene = await asset(level.file);
  if (level.surfaceFile && !level.surfaceTriangles)
    level.surfaceTriangles = (
      await (await fetch("/" + level.surfaceFile)).json()
    ).triangles;
  if (level.nativeEnvironment) {
    level.nativeTerrain = await NativeTerrain.load(level.nativeEnvironment);
    level.instances = level.nativeTerrain.instances;
  }
  renderer.environment = level.nativeTerrain?.data;
  track = new Track(level);
  if(roomMode) { track.pickups=[]; track.boosters=[]; }
  renderer.finishDistance = track.endZ;
  track.build(renderer);
  save.level = level.id;
  decor = [];
  const treeName =
    level.id === "ski-resort"
      ? "Pine_Tree_s_08"
      : level.id === "west-coast"
        ? "Palm_Tree_Coconut_l_01"
        : "Acacia_Tree_l_03";
  const chosen = [
    treeName,
    "Rock_Square_m_05",
    "coin",
    "item box",
    "glider cube",
  ];
  await Promise.all(
    chosen.map(async (n) => {
      if (manifest.prefabs[n]) common[n] = await asset(manifest.prefabs[n]);
    }),
  );
  common.coin = common.coin || common["coin"];
  common.item = common["item box"];
  if (level.instances?.length) {
    const types = [...new Set(level.instances.map((i) => i.prefab))];
    await Promise.all(
      types.map(async (n) => {
        if (manifest.prefabs[n]) common[n] = await asset(manifest.prefabs[n]);
      }),
    );
    decor = level.instances
      .filter((i) => common[i.prefab])
      .map((i) => ({
        ...i,
        asset: common[i.prefab],
        matrix: i.matrix
          ? new Float32Array(i.matrix)
          : trs(i.position, i.rotation, i.scale),
      }));
  } else if (!track.space && !level.nativeTerrain) {
    for (let z = 10, n = 0; z < track.endZ + 30; z += 11, n++) {
      const r = track.at(z);
      for (const side of [-1, 1]) {
        const x =
            r.x +
            side * (r.half + 7 + (Math.sin(n * 45.7 + side) * 0.5 + 0.5) * 25),
          y = track.ground(x, z)?.height ?? r.baseY - 2;
        const sc = track.snow ? 2.3 : 1;
        decor.push({
          asset: common[n % 6 === 0 ? "Rock_Square_m_05" : treeName],
          position: [x, y, z],
          matrix: model([x, y, z], n * 1.73, 0, 0, [sc, sc, sc]),
        });
      }
    }
  }
  sim = new CarSimulation(track, physicalUpgrades(save), onEvent, roomMode ? roomSimulationOptions(room.selectedItem) : {});
  if(roomMode) {
    const response=await fetch(`/assets/room/replays/${level.id}.json`);
    if(!response.ok)throw new Error('AI room paths could not be loaded.');
    room.enterMap(level.id,track,await response.json());
    roomLobby.resetMap();
  }
  const st = LEVEL_STYLE[level.id];
  $("level-label").textContent = `${st.tag} / ${st.en}`;
  $("level-title").textContent = st.title;
  $("level-description").textContent = st.description;
  $("interface").hidden = false;
  $("loading").hidden = true;
  persist();
  reset();
  loaded++;
}
function reset() {
  renderer.shadows.invalidateStatic();
  closeModal();
  sim.upgrades = physicalUpgrades(save);
  if(roomMode)sim.options=roomSimulationOptions(room.selectedItem);
  if(roomMode){save.upgrades={...room.upgrades};sim.upgrades={...room.upgrades};}
  sim.reset();
  particles.length = 0;
  power = 0;
  aim = 0;
  drag = null;
  chargeKey = false;
  chargeTime = 0;
  previousHUDSpeed = previousHUDTime = hudClock = 0;
  launchSpeedForHUD = 1;
  previewFrame = false;
  feedbackTime = 0;
  keys.clear();
  touch = 0;
  accumulator = 0;
  audio?.stopFlight();
  const r = track.at(track.startZ);
  cameraEye = [r.x, r.y + 8, track.startZ - 14];
  cameraTarget = [r.x, r.y + 0.4, track.startZ - 1];
  setState(roomMode ? 'lobby' : "ready");
  if(roomMode) {
    roomLobby.resetLocal();roomDrive={steer:0,throttle:0};
    roomUI.showLobby(roomSnapshot());roomUI.setFlightVisible(false);
    roomWorld.root.hidden=true;
  }
  upgradeUI();
  $("progress-fill").style.width = "0%";
  $("distance-label").textContent =
    `0 / ${Math.round(track.endZ - track.startZ)} m`;
  if (isCampaign(save) && save.campaign.pendingResult)
    showResult(save.campaign.pendingResult);
}
function roomSnapshot() {
  const portal=roomLobby?.nearPortal;
  return {...room.snapshot(),phase:state,nearSling:roomLobby?.nearSling||false,nearPortal:portal?{id:portal.id,locked:!room.isUnlocked(portal.id)}:null,moving:Math.abs(roomLobby?.local.speed||0)>.5,driving:state==='lobby'};
}
async function startRoomFlight(id=roomLobby?.nearPortal?.id) {
  if(!roomMode || state!=='lobby' || room.busy || !roomLobby.nearSling || id!==roomLobby.nearPortal?.id || !room.isUnlocked(id))return;
  audio.unlock();room.busy=true;roomLobby.entered=true;roomDrive={steer:0,throttle:0};
  try {
    if(id!==level.id)await loadLevel(id);else reset();
    roomLobby.entered=true;room.busy=false;
    setState('ready');roomUI.hideLobby();roomUI.setFlightVisible(true);roomUI.update(roomSnapshot());
    feedback('Pull back & release');
  } catch(error) {room.busy=false;roomLobby.entered=false;roomUI.showNotice('Could not load map');console.error(error);}
}
function returnToLobby() {
  if(!roomMode || state==='loading')return;
  const unlocked=pendingRoomReturn&&room.lastRun?.unlocked,reward=pendingRoomReturn&&room.lastRun?.reward;
  if(state==='running')room.finishLocal(sim,false,true);
  pendingRoomReturn=false;reset();
  if(unlocked)roomUI.showNotice(`${unlocked} unlocked!`);
  else if(reward)roomUI.showNotice(`+${reward} coins`);
}
function buyRoomUpgrade(type) {
  if(!roomMode||state!=='lobby'||room.busy)return;
  if(!room.buyUpgrade(type))return;
  save.upgrades={...room.upgrades};keys.clear();roomDrive={steer:0,throttle:0};roomLobby.local.speed=0;
  audio.unlock();audio.play('upgrade',.55);roomUI.update(roomSnapshot());
}
function beginAim() {
  if (state !== "ready" && state !== "aiming") return;
  audio.unlock();
  setState("aiming");
  power = 1 / 3;
  aim = 0;
  audio.play("stretch", 0.2);
}
function launch() {
  if (state !== "aiming") return;
  if (isCampaign(save)) {
    save.campaign.levelAttempts++;
    persist();
  }
  const p = power;
  launchSpeedForHUD =
    (vehicleStats(physicalUpgrades(save)).launchSpeed * pullDistance(p)) / 3;
  previousHUDSpeed = 0;
  previousHUDTime = 0;
  previewFrame = false;
  setState("running");
  if(roomMode)room.beginLocal();
  sim.launch(p, -aim);
  drag = null;
  chargeKey = false;
  shake = 0.18;
  feedback(p > 0.92 ? "Full Power!" : p < 0.4 ? "Gentle Launch" : "Go!");
}
function spawn(pos, color, count = 14, force = 6) {
  for (let i = 0; i < count; i++) {
    if (particles.length > 180) particles.shift();
    particles.push({
      p: [...pos],
      v: [
        (Math.random() - 0.5) * force,
        Math.random() * force,
        (Math.random() - 0.5) * force,
      ],
      life: 0.5 + Math.random() * 0.5,
      max: 1,
      color,
      size: 0.08 + Math.random() * 0.15,
    });
  }
}
function onEvent(event, arg) {
  if (event === "launch") {
    audio.play("twang", 0.8);
    audio.play("release", 0.4);
    spawn([sim.x, sim.y, sim.z], [0.98, 0.85, 0.52, 1], 22, 5);
  }
  if (event === "land") {
    audio.play("tire landing", clamp(arg / 30, 0.1, 0.65));
    shake = Math.min(0.25, arg * 0.009);
    spawn(
      [sim.x, sim.y - 0.3, sim.z],
      track.snow ? [0.94, 0.97, 1, 1] : [0.84, 0.74, 0.48, 1],
      12,
      3,
    );
  }
  if (event === "crash") {
    renderer.shadows.invalidateStatic();
    audio.play("crash", 0.65);
    shake = 0.5;
    feedback(sim.effect === "apple" ? "Golden Shield" : "Watch Out!");
    spawn([arg.x, arg.y, arg.z], [1, 0.61, 0.29, 1], 20, 9);
  }
  if (event === "coin")
    audio.play("coin collect", 0.28, 1 + Math.random() * 0.15);
  if (event === "pickup") {
    audio.play("item box roll", 0.3);
    feedback(`${CONFIG.items[arg].title} · Press Space`);
  }
  if (event === "item") {
    audio.play(
      arg === "pepper"
        ? "rocket"
        : arg === "apple"
          ? "golden apple"
          : "power up",
      0.55,
    );
    feedback((roomMode ? ROOM_ITEMS : CONFIG.items)[arg].title + "！");
    spawn([sim.x, sim.y, sim.z], [1, 0.8, 0.24, 1]);
  }
  if (event === "boost") {
    audio.play("power up shorter", 0.5);
    feedback("Speed Boost");
    shake = 0.16;
  }
  if (event === "finish") finish(arg);
}
function finish(success) {
  if(roomMode) {
    if(state!=='running')return;
    room.finishLocal(sim,success);audio.stopFlight();
    audio.play(success?'firework':'fire pop',.4);
    setState('returning');pendingRoomReturn=true;
    return;
  }
  if (state === "result") return;
  setState("result");
  audio.stopFlight();
  audio.play(success ? "firework" : "fire pop", 0.6);
  const reward = distanceReward(
    save,
    sim.distance,
    success,
    track,
    sim.runCoins,
  );
  save.coins += reward;
  save.runs++;
  const record = save.records[level.id] || {
    distance: 0,
    wins: 0,
    bestTime: 0,
  };
  const newRecord = sim.distance > (isCampaign(save) ? save.campaign.bestDistance : record.distance);
  if (isCampaign(save)) save.campaign.bestDistance = Math.max(save.campaign.bestDistance, sim.distance);
  record.distance = Math.max(record.distance, sim.distance);
  if (success) {
    record.wins++;
    record.bestTime = record.bestTime
      ? Math.min(record.bestTime, sim.elapsed)
      : sim.elapsed;
    const idx = manifest.cars.findIndex((c) => c.id === save.car),
      next = manifest.cars[Math.min(idx + 1, manifest.cars.length - 1)];
    if (!isCampaign(save) && !save.unlocked.includes(next.id))
      save.unlocked.push(next.id);
    spawn([sim.x, sim.y + 3, sim.z], [1, 0.76, 0.18, 1], 65, 15);
  }
  save.records[level.id] = record;
  const normalStop =
      !success && /Coast complete/.test(sim.reason || "Coast complete"),
    resultDescription = success
      ? `${LEVEL_STYLE[level.id].title} complete. On to the next level!`
      : normalStop
        ? "Reward collected. Upgrade your car to go farther!"
        : `${sim.reason || "Run ended"}. Reward collected. Upgrade and try again.`;
  const result = {
    success,
    distance: sim.distance,
    elapsed: sim.elapsed,
    reward,
    multiplier: incomeMultiplier(save),
    newRecord,
    reason: resultDescription,
  };
  if (success && isCampaign(save)) {
    const last = save.campaign.levelIndex === campaignLevels(save).length - 1;
    result.reason = last
      ? "Universe complete! Next starts a new universe and resets coins and upgrades."
      : "Level complete! Next brings a new car. Coins and total income upgrades carry over.";
    save.campaign.pendingResult = result;
  }
  persist();
  upgradeUI();
  setTimeout(() => {
    if (state === "result") showResult(result);
  }, 650);
}
function showResult(result) {
  setState("result");
  openModal(resultMarkup({ ...result, campaign: isCampaign(save) }));
  if ($("result-retry")) $("result-retry").onclick = reset;
  $("result-next").onclick = async () => {
    if (!result.success) {
      reset();
      beginAim();
      return;
    }
    try {
      if (isCampaign(save)) {
        if (!advanceCampaign(save)) return;
        persist();
        await changeCar(save.car);
        await loadLevel(save.level);
      } else
        await loadLevel(
          manifest.levels[
            (manifest.levels.indexOf(level) + 1) % manifest.levels.length
          ].id,
        );
    } catch (e) {
      fatal(e);
    }
  };
}
function levelModal() {
  if (state === "loading") return;
  if (isCampaign(save)) {
    const c = save.campaign,
      entries = campaignLevels(save);
    openModal(
      `<div class="modal-header"><div><span class="eyebrow">SOLO MODE · CAMPAIGN PROGRESS</span><h2>Universe ${c.universeIndex + 1}</h2></div><button class="close-button" data-close aria-label="Close">×</button></div>${modeMarkup()}<div class="level-list">${entries.map((e, i) => `<button class="level-card ${i === c.levelIndex ? "selected" : ""}" ${i === c.levelIndex ? "data-close" : "disabled"}><span class="number">0${i + 1}</span><span><strong>${e.scene}</strong><small>${manifest.cars.find((x) => x.id === e.car).title}</small></span><b>${i < c.levelIndex ? "COMPLETE" : i === c.levelIndex ? "CURRENT" : "LOCKED"}</b></button>`).join("")}</div><p class="note">Reach the finish, then choose Next to continue. Each new level starts a new car build. Your coins and total income upgrades carry over within a universe.</p><p class="note">Practice is separate and keeps your previous solo save.</p>`,
    );
    return;
  }
  openModal(
    `<div class="modal-header"><div><span class="eyebrow">SOLO MODE · LEVEL SELECT</span><h2>Select Level</h2></div><button class="close-button" data-close aria-label="Close">×</button></div><div class="level-list">${manifest.levels.map((l, i) => `<button class="level-card ${l.id === level.id ? "selected" : ""}" data-level="${l.id}"><span class="number">0${i + 1}</span><span><strong>${LEVEL_STYLE[l.id].title}</strong><small>${Math.round(l.finish[2] - l.start[2])} m</small></span><b>${save.records[l.id]?.wins ? "✓ " + save.records[l.id].wins + " wins" : "PLAY"}</b></button>`).join("")}</div><p class="note">Practice: all five levels are available. Upgrades are shared across levels.</p>`,
  );
  document
    .querySelectorAll("[data-level]")
    .forEach(
      (b) => (b.onclick = () => loadLevel(b.dataset.level).catch(fatal)),
    );
  $("modal-card").insertAdjacentHTML("afterbegin", modeMarkup());
  $("modal-card")
    .querySelectorAll("[data-mode]")
    .forEach(
      (b) => (b.onclick = () => changeMode(b.dataset.mode).catch(fatal)),
    );
}
function garageModal() {
  if (isCampaign(save)) {
    const entry = campaignEntry(save),
      stats = vehicleStats(physicalUpgrades(save));
    openModal(
      `<div class="modal-header"><div><span class="eyebrow">SOLO MODE · CAMPAIGN CAR</span><h2>${carInfo.title}</h2></div><button class="close-button" data-close aria-label="Close">×</button></div><p class="note">${entry.scene} assigns this car. Current build: ${stats.stageName}.</p><p class="note">Car upgrades this level: ${save.upgrades.car}. Total car upgrades this universe: ${save.totals.car}.</p><p class="note">Complete the level to continue to the next assigned car. Practice offers the seven-car selector with separate progress.</p>${modeMarkup()}`,
    );
    return;
  }
  const stats = vehicleStats(physicalUpgrades(save));
  const milestones = [];
  for (let n = 0; n <= maxUpgradeFor("car"); n += 5) {
    const s = vehicleStats({ ...save.upgrades, car: n });
    milestones.push(`${n}: ${s.stageName}`);
  }
  openModal(
    `<div class="modal-header"><div><span class="eyebrow">SOLO MODE · CAR SELECT</span><h2>Select Car</h2></div><button class="close-button" data-close aria-label="Close">×</button></div><div class="car-list">${manifest.cars.map((c, i) => `<button class="car-card ${c.id === save.car ? "selected" : ""}" data-car="${c.id}"><span><strong>${c.title}</strong><small>6 upgrade stages</small></span><b>${save.unlocked.includes(c.id) ? (c.id === save.car ? "SELECTED" : "SELECT") : "● " + (350 + i * 180)}</b></button>`).join("")}</div><div class="stage-progress"><i style="width:${Math.min(100, (save.upgrades.car / maxUpgradeFor("car")) * 100)}%"></i></div><p class="note">Current: ${stats.stageName}. ${milestones.join("; ")}. Complete a level to unlock the next car.</p><div class="modal-actions"><button class="secondary" id="stage-button" ${stats.carLevel < 5 ? "disabled" : ""}>${stats.carLevel < 5 ? "Bare Frame" : previewFrame ? "Restore Stage" : "Preview Frame"}</button><button class="primary" data-close>BACK</button></div>`,
  );
  document.querySelectorAll("[data-car]").forEach(
    (b) =>
      (b.onclick = async () => {
        const i = manifest.cars.findIndex((c) => c.id === b.dataset.car),
          price = 350 + i * 180;
        if (!save.unlocked.includes(b.dataset.car)) {
          if (save.coins < price) {
            toast("Not enough coins. Every run earns a distance reward.");
            return;
          }
          save.coins -= price;
          save.unlocked.push(b.dataset.car);
        }
        await changeCar(b.dataset.car);
        audio.play("select");
        garageModal();
      }),
  );
  $("stage-button").onclick = () => {
    previewFrame = !previewFrame;
    toast(
      previewFrame
        ? "Frame preview. Your upgrade stage returns when you launch."
        : `Restored ${stats.stageName}`,
    );
    closeModal();
  };
}
let previewFrame = false;
function help() {
  if (state === "loading") return;
  if(roomMode) {
    if(state==='lobby')return;
    openModal(`<div class="modal-header"><h2>Paused</h2><button class="close-button" data-close aria-label="Close">×</button></div><div class="modal-actions"><button class="secondary" id="help-lobby">LOBBY</button><button class="primary" data-close>RESUME</button></div>`);
    $('help-lobby').onclick=returnToLobby;return;
  }
  openModal(
    `<div class="modal-header"><div><span class="eyebrow">SOLO MODE · CONTROLS</span><h2>Paused</h2></div><button class="close-button" data-close aria-label="Close">×</button></div><div class="help-grid"><div><b>Pull & Release</b>Drag down and release to launch.<br>Keyboard: hold Space, then release.</div><div><b>Swipe to control</b>Coast on momentum. Steer with A / D, arrow keys or a swipe.<br>W / S adjusts pitch in the air.</div><div><b>Upgrade</b>Add wheels and parts to go farther. Upgrade the slingshot for a stronger launch.<br>Press Space to use an item.</div><div><b>Progress</b>Coins, upgrades and records save automatically.<br>Pause: Esc / P. Retry: R.</div></div><div class="modal-actions"><button class="secondary" id="help-retry">UPGRADE</button><button class="primary" data-close>RESUME</button></div><p class="note">This controls menu belongs to the solo mode.</p>`,
  );
  $("help-retry").onclick = reset;
}
function bind() {
  $("world-button").onclick = $("map-button").onclick = levelModal;
  $("car-button").onclick = garageModal;
  $("pause-button").onclick = help;
  $("sound-button").onclick = () => {
    audio.unlock();
    save.muted = audio.toggle();
    $("sound-button").textContent = save.muted ? "♩" : "♪";
    persist();
    toast(save.muted ? "Sound: OFF" : "Sound: ON");
  };
  $("launch-button").onclick = () => {
    beginAim();
    feedback("Pull back and release, or hold Space to launch.");
  };
  document.querySelectorAll("[data-upgrade]").forEach(
    (b) =>
      (b.onclick = () => {
        if (roomMode || state !== "ready" || paused) return;
        audio.unlock();
        const k = b.dataset.upgrade;
        if (
          !["car", "sling", "income"].includes(k) ||
          !upgradeAvailable(save, k)
        )
          return;
        const price = upgradeCost(save, k);
        if (save.coins < price) {
          toast("Not enough coins. Try another run!");
          return;
        }
        if (!purchaseUpgrade(save, k)) return;
        previewFrame = false;
        persist();
        reset();
        audio.play("upgrade", 0.65);
        spawn([sim.x, sim.y + 1, sim.z], [1, 0.85, 0.3, 1], 24, 5);
        toast(
          `Upgrade ${save.upgrades[k]} · ${k === "car" ? vehicleStats(physicalUpgrades(save)).stageName : k === "sling" ? "Stronger Slingshot" : "More Income"}`,
        );
      }),
  );
  $("item-button").onclick = () => sim?.useItem();
  for (const [id, dir] of [
    ["left-control", -1],
    ["right-control", 1],
  ]) {
    const b = $(id);
    b.onpointerdown = (e) => {
      e.preventDefault();
      touch = dir;
      b.setPointerCapture(e.pointerId);
    };
    b.onpointerup = b.onpointercancel = () => (touch = 0);
  }
  canvas.addEventListener("pointerdown", (e) => {
    if(state==='lobby') {canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,id:e.pointerId,lobby:true};return;}
    if (paused || state === "loading" || state === "result" || state==='returning') return;
    audio.unlock();
    canvas.setPointerCapture(e.pointerId);
    if (state === "ready") beginAim();
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    if (state === "aiming") power = 1 / 3;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId || paused) return;
    if(state==='lobby'&&drag.lobby){roomLobby.orbit(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;return;}
    const bounds = canvas.getBoundingClientRect();
    if (state === "aiming") {
      power = clamp(
        (e.clientY - drag.y) / Math.max(1, bounds.height * 0.28),
        1 / 3,
        1,
      );
      aim = clamp(
        (e.clientX - drag.x) / Math.max(1, bounds.width),
        -0.32,
        0.32,
      );
    } else if (state === "running")
      touch = clamp(
        (e.clientX - drag.x) / Math.max(1, bounds.width * 0.15),
        -1,
        1,
      );
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (state === "aiming" && !paused) launch();
    drag = null;
    touch = 0;
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
    touch = 0;
    if (state === "aiming") setState("ready");
  });
  canvas.addEventListener('wheel',e=>{if(state==='lobby'){e.preventDefault();roomLobby.orbit(0,e.deltaY*.3);}},{passive:false});
  window.addEventListener("keydown", (e) => {
    if(e.target?.closest?.('input,textarea,select,[contenteditable]'))return;
    if (
      ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
        e.code,
      )
    )
      e.preventDefault();
    if (e.repeat || state === "loading" || state==='returning') return;
    keys.add(e.code);
    if(roomMode&&state==='lobby') {
      return;
    }
    if (e.code === "Escape" || e.code === "KeyP") {
      if ($("modal").hidden) help();
      else closeModal();
      return;
    }
    if (paused) return;
    if (e.code === "KeyR" && sim) { if(roomMode)returnToLobby();else reset(); }
    if (e.code === "Space") {
      audio.unlock();
      if (state === "ready" || state === "aiming") {
        if (state === "ready") beginAim();
        chargeKey = true;
        chargeTime = 0;
      } else if (state === "running") sim.useItem();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
    if (e.code === "Space" && chargeKey) {
      chargeKey = false;
      if (!paused) launch();
    }
  });
  window.addEventListener("blur", () => {
    keys.clear();
    touch = 0;
    chargeKey = false;
    drag = null;
    if (state === "running" && !paused) help();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "running" && !paused) help();
    lastTime = performance.now();
  });
}
function sceneDraw(dynamicOnly=false) {
  const hidden = level.hiddenMaterials || [];
  for (const d of scene.draws) {
    const collider=track.native?.sceneOwner(d.node.path,d.world);
    if(collider?.hit)continue;
    if(dynamicOnly && !collider?.source?.rotation)continue;
    if(renderer.shadowPass && !dynamicOnly && collider?.source?.rotation)continue;
    if (
      hidden.includes(d.material.name) ||
      d.nativeRendererEnabled === false ||
      d.nativeActive === false ||
      /drone|Basket|FOG|\/base$/i.test(d.node.path)
    )
      continue;
    if (
      !renderer.shadowPass &&
      (state === "running" || state === "result") &&
      blocksCamera(d, cameraEye, [sim.x, sim.y + 0.65, sim.z])
    )
      continue;
    renderer.draw(d.gpu, collider?.source?.rotation ? colliderMatrix(collider,sim.elapsed) : d.world, d.material);
  }
}
function drawCar(time) {
  if (!carAsset) return;
  const moving = state === "running" || state === "result",
    drawback = state === "aiming" ? pullDistance(power) : 0,
    stats = vehicleStats(physicalUpgrades(save)),
    visualStats =
      previewFrame && !moving
        ? vehicleStats({ ...save.upgrades, car: 0 })
        : stats;
  const yaw = moving ? sim.yaw : -aim;
  const carX = sim.x - Math.sin(yaw) * drawback,
    carZ = sim.z - Math.cos(yaw) * drawback,
    ground = track.ground(carX, carZ),
    carY = moving
      ? sim.y
      : (ground?.height ?? track.at(carZ).y) + visualStats.rideHeight;
  const root = model(
    [carX, carY + (state === "ready" ? Math.sin(time * 1.4) * 0.012 : 0), carZ],
    yaw,
    moving ? sim.pitch : groundPitch(track,carX,carZ,yaw),
    sim.roll,
  );
  const stage = visualStats.stage,
    ids = new Set(
      carInfo.nativeStages?.[visualStats.sourceTier]?.showNodes ||
        carInfo.stages[Math.min(stage, carInfo.stages.length - 1)].showNodes,
    );
  renderer.asset(roomMode?roomVehicles.body(room.local,visualStats.sourceTier):carAsset, root, (n) => ids.has(n.index));
  for (const wheel of carInfo.wheelPositions) {
    const front = /front/i.test(wheel.name);
    if (
      !visualStats.hasWheels ||
      visualStats.wheelMode === "none" ||
      (visualStats.wheelMode === "front" &&
        visualStats.sourceTier === 1 &&
        !front)
    )
      continue;
    const physical = sim.wheels.find(w => w.name === wheel.name);
    const position = [...wheel.translation];
    position[1] += moving ? physical.offset : 0;
    // Steering precedes the mirrored wheel mesh transform. Left/right axle
    // meshes need opposite local spin signs, but share the physical wheel speed.
    const steering = moving ? physical.steer : 0;
    const spin = moving ? physical.spin * (wheel.translation[0] > 0 ? -1 : 1) : 0;
    let transform = mul(root, model(position, steering));
    transform = mul(transform, trs([0, 0, 0], wheel.rotation));
    transform = mul(transform, model([0, 0, 0], 0, spin));
    const wheelTier =
      visualStats.wheelMode === "front" &&
      visualStats.sourceTier === 3 &&
      !front
        ? 2
        : visualStats.sourceTier;
    const file = carInfo.nativeStages?.[wheelTier]?.wheelFile;
    renderer.asset(wheelAssets.get(file) || wheelAsset, transform);
  }
  if (ground)
    renderer.shadow(
      [carX, ground.height + 0.055, carZ],
      1.5 + Math.min(3, (carY - ground.height) * 0.12),
      clamp(0.32 - (carY - ground.height) * 0.009, 0.05, 0.32),
    );
  if (sim.effect === "glider") {
    renderer.box(
      [sim.x, sim.y + 2.4, sim.z],
      [7, 0.12, 2.1],
      [0.97, 0.59, 0.19, 1],
      sim.yaw,
      sim.pitch,
      sim.roll,
    );
    renderer.line(
      [sim.x, sim.y + 0.8, sim.z],
      [sim.x, sim.y + 2.4, sim.z],
      0.06,
      [0.32, 0.32, 0.28, 1],
    );
  }
  if (state === "ready" || state === "aiming" || sim.springActive) {
    const s = track.at(track.startZ),
      hook = [
        carX - Math.sin(yaw) * 1.9,
        carY + 0.25,
        carZ - Math.cos(yaw) * 1.9,
      ];
    for (const side of [-1, 1]) {
      const pole = [s.x + side * 1.5, s.y + 1.15, track.startZ - 0.4];
      renderer.line(pole, hook, 0.065, [0.16, 0.13, 0.18, 1]);
      if (level.id === "ski-resort") {
        renderer.box(
          [pole[0], s.y + 0.5, pole[2]],
          [0.25, 1.4, 0.25],
          [0.48, 0.28, 0.15, 1],
        );
      }
    }
    if (state === "aiming") {
      for (const position of previewLaunch(stats, power, -aim, track)) {
        renderer.box(position, [0.11, 0.11, 0.11], [1, 0.93, 0.55, 1]);
      }
    }
  }
}
function updateHUD() {
  if (!sim) return;
  const speed = sim.speed ?? Math.hypot(sim.vx, sim.vz),
    initialSpeed = Math.max(
      1,
      sim.springActive
        ? launchSpeedForHUD
        : sim.launchSpeed || launchSpeedForHUD,
    ),
    energy = clamp((speed / initialSpeed) ** 2, 0, 1);
  if(!roomMode)$("coins").textContent = save.coins.toLocaleString();
  $("speed").textContent = Math.round(speed * 3.6);
  $("energy-fill").style.transform = `scaleX(${energy})`;
  $("energy-fill").style.background = energy < 0.12 ? "#ffc67d" : "#d5f1b4";
  $("energy-value").textContent = `${Math.round(energy * 100)}%`;
  if (sim.elapsed - previousHUDTime >= 0.15 || state !== "running") {
    const gained = speed > previousHUDSpeed + 0.1;
    $("coast-status").textContent = sim.springActive
      ? "Launching"
      : speed < 2.5 && state === "running"
        ? "Slowing down"
        : gained
          ? "Speed increasing"
          : "Coasting";
    $("telemetry").classList.toggle(
      "slowing",
      !sim.springActive && speed < 5 && state === "running",
    );
    previousHUDSpeed = speed;
    previousHUDTime = sim.elapsed;
  }
  if (state === "running")
    $("phase-label").textContent = sim.springActive ? "Launching" : "Coasting";
  $("health-fill").style.width = sim.health + "%";
  $("health-fill").style.background = sim.health < 35 ? "#ff7a57" : "#fff9d8";
  $("surface").textContent = {
    road: "Road",
    grass: "Grass",
    snow: "Snow",
    air: "Airborne",
  }[sim.surface];
  const r = track.at(sim.z);
  $("altitude").textContent =
    Math.max(0, sim.y - (track.ground(sim.x,sim.z)?.height ?? r.y) - (sim.stats?.rideHeight ?? 0)).toFixed(1) + " m";
  $("run-coins").textContent = "● +" + sim.runCoins;
  $("progress-fill").style.width =
    clamp((sim.distance / (track.endZ - track.startZ)) * 100, 0, 100) + "%";
  $("distance-label").textContent =
    `${Math.round(sim.distance)} / ${Math.round(track.endZ - track.startZ)} m`;
  $("power-fill").style.width = power * 100 + "%";
  $("power-label").textContent =
    `${Math.round(power * 100)}% · Pull ${pullDistance(power).toFixed(1)} m`;
  const item = (roomMode ? ROOM_ITEMS : CONFIG.items)[sim.item || sim.effect];
  $("item-button").disabled = roomMode ? !roomItemState(sim).canUse : !sim.item;
  $("item-icon").textContent = item?.icon || "◇";
  $("item-name").textContent =
    sim.effect && !sim.item
      ? `${item.title} ${Math.max(0, sim.effectTime).toFixed(1)}s`
      : item?.title || (roomMode ? 'Item used' : "No Item");
  if(roomMode)$('item-key').textContent=sim.item?'SPACE · 1 USE':sim.effect?'ACTIVE':'0 LEFT';
}
function render(dt) {
  if (!track || !sim || state === "loading") return;
  if(roomMode && state==='lobby') {
    roomWorld.root.hidden=true;
    roomLobby.draw(renderer,roomVehicles,dt);
    return;
  }
  const moving = state === "running" || state === "result",
    r = track.at(sim.z);
  let eye, target;
  if (moving) {
    eye = [
      sim.x + sim.vx * 0.1,
      Math.max(sim.y + 6.8, track.at(sim.z - 14).y + 4),
      sim.z - 16,
    ];
    target = [sim.x + sim.vx * 0.2, sim.y + 1, sim.z + 15];
  } else {
    const anchor = track.at(track.startZ);
    eye = [anchor.x, anchor.y + 8, track.startZ - 14];
    target = [anchor.x, anchor.y + 0.4, track.startZ - 1];
  }
  for (let i = 0; i < 3; i++) {
    cameraEye[i] = smooth(cameraEye[i], eye[i], moving ? 7 : 3, dt);
    cameraTarget[i] = smooth(cameraTarget[i], target[i], moving ? 9 : 3, dt);
  }
  if (moving)
    clearGroundSightline(cameraEye, [sim.x, sim.y + 0.15, sim.z], track);
  const jitter = moving ? shake : 0;
  const shaken = cameraEye.map((x) => x + (Math.random() - 0.5) * jitter);
  renderer.time = clock;
  renderer.shadows.prepare(
    level.id,
    shaken,
    cameraTarget,
    () => {
      for (const c of track.native?.chunks || [])
        if (!c.water) renderer.draw(c.gpu, identity(), c.material);
      sceneDraw();
      const groups = new Map();
      for (const d of decor) {
        if(d.collisionState?.hit)continue;
        if (!groups.has(d.asset)) groups.set(d.asset, []);
        groups.get(d.asset).push(d.matrix);
      }
      for (const [asset, roots] of groups) renderer.instances(asset, roots);
    },
    () => { drawCar(clock); sceneDraw(true);
      if(roomMode) { roomWorld.drawCars(renderer,room,roomVehicles,sim.z);roomWorld.drawFlags(renderer,room,sim.z); }
    },
  );
  renderer.begin(shaken, cameraTarget, {
    sky: track.style.sky,
    fogFar: track.space ? 650 : 520,
    fov: moving
      ? CONFIG.visuals.flightFov + Math.min(8, sim.vz * 0.1)
      : CONFIG.visuals.garageFov,
  });
  track.draw(renderer, sim.z, clock, common);
  sceneDraw();
  const groups = new Map();
  for (const d of decor) {
    if (!d.asset || d.collisionState?.hit) continue;
    const z = d.position?.[2] ?? d.matrix[14];
    if (z < sim.z - 65 || z > sim.z + 350) continue;
    if (!groups.has(d.asset)) groups.set(d.asset, []);
    groups.get(d.asset).push(d.matrix);
  }
  for (const [asset, roots] of groups) renderer.instances(asset, roots);
  drawCar(clock);
  if(roomMode) {
    roomWorld.drawCars(renderer,room,roomVehicles,sim.z);
    roomWorld.drawFlags(renderer,room,sim.z);
  }
  if (track.space) {
    for (let i = 0; i < 80; i++) {
      const x = Math.sin(i * 12.1) * 180,
        z = sim.z + 25 + ((i * 37) % 450),
        y = r.y + 30 + Math.sin(i * 7.1) * 70;
      renderer.box([x, y, z], [0.3, 0.3, 0.3], [0.84, 0.88, 1, 1]);
    }
  }
  for (const p of particles)
    renderer.box(p.p, [p.size, p.size, p.size], p.color, clock);
  track.native?.drawWater(renderer, sim.z);
  renderer.linearFrame.present();
  if(roomMode)roomWorld.updateLabels(renderer,room,sim.z,state==='running'||state==='ready'||state==='aiming');
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(
    CONFIG.physics.maxFrame,
    (now - lastTime) / 1000 || 0.016,
  );
  lastTime = now;
  if (!paused) {
    clock += dt;
    if(roomMode && state!=='loading') {
      room.update(dt);
      const typing=roomUI.isSettingsOpen||document.activeElement?.matches('input,textarea,select');
      const input=typing ? {} : {
        throttle:roomDrive.throttle || (keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),
        steer:roomDrive.steer || (keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)};
      const portal=roomLobby.update(dt,input,state==='lobby'&&!room.busy&&!roomUI.isSettingsOpen);
      if(portal)startRoomFlight(portal);
    }
    if (chargeKey && state === "aiming") {
      chargeTime += dt;
      power = clamp(1 / 3 + chargeTime / 1.8, 1 / 3, 1);
      aim =
        clamp(
          (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
            (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
          -1,
          1,
        ) * 0.25;
    }
    if (state === "running") {
      accumulator += dt;
      const input = {
        steer:
          touch ||
          (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
            (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
        pitch:
          (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
          (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0),
      };
      while (accumulator >= CONFIG.physics.fixedStep && state==='running') {
        sim.step(CONFIG.physics.fixedStep, input);
        if(roomMode && state==='running')room.observeLocal(sim);
        accumulator -= CONFIG.physics.fixedStep;
      }
      if (state === "running") audio.flight(sim.vz, !sim.onGround);
      if (sim.onGround && Math.random() < dt * 13)
        spawn(
          [sim.x, sim.y - 0.3, sim.z - 1.8],
          track.snow ? [0.95, 0.97, 1, 1] : [0.78, 0.69, 0.44, 1],
          1,
          1,
        );
      if (sim.effect === "pepper" && Math.random() < dt * 30)
        spawn([sim.x, sim.y + 0.3, sim.z - 2], [1, 0.54, 0.16, 1], 2, 3);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life < 0) {
        particles.splice(i, 1);
        continue;
      }
      for (let k = 0; k < 3; k++) p.p[k] += p.v[k] * dt;
      p.v[1] -= 7 * dt;
      p.size *= Math.exp(-dt * 0.6);
    }
    feedbackTime -= dt;
    shake = Math.max(0, shake - dt * 1.5);
    if(pendingRoomReturn)returnToLobby();
  }
  if(roomMode && roomUI) {
    roomUIClock+=dt;
    if(roomUIClock>=.12) {roomUI.update(roomSnapshot());roomUIClock=0;}
  }
  $("run-feedback").style.opacity = feedbackTime > 0 ? 1 : 0;
  render(paused ? 0 : dt);
  frameCount++;
  fpsClock += dt;
  hudClock += dt;
  if (state === "aiming" || (state === "running" && hudClock >= 0.08)) {
    updateHUD();
    hudClock = 0;
  }
  if (fpsClock >= 0.5) {
    fps = frameCount / fpsClock;
    fpsClock = 0;
    frameCount = 0;
    updateHUD();
  }
}
function fatal(e) {
  console.error(e);
  $("loading").hidden = false;
  $("load-text").textContent = "Loading failed: " + e.message;
  const small = $("loading").querySelector("small");
  small.textContent = "Open the game using Start-Game.cmd or npm start.";
}
async function boot() {
  try {
    renderer = new Renderer(canvas);
    manifest = await (await fetch("/assets/manifest.json")).json();
    if(roomMode) {
      let storage;try{storage=localStorage;}catch{}
      room=new DemoRoom(manifest.levels.map(l=>({id:l.id,title:LEVEL_STYLE[l.id].title,length:l.finish[2]-l.start[2]})),storage);
      roomLobby=new RoomLobbyWorld(room);
      save.level=room.mapId;save.muted=room.muted;save.upgrades={...room.upgrades};
      roomUI=createRoomUI({stage:$('stage'),
        onCountChange:count=>{room.setCount(count);roomUI.update(roomSnapshot());},
        onNameChange:name=>{room.setName(name);roomUI.update(roomSnapshot());},
        onItemChange:id=>{room.setItem(id);roomUI.update(roomSnapshot());},onReturn:returnToLobby,
        onUpgrade:buyRoomUpgrade,
        onDrive:input=>{roomDrive=input;audio?.unlock();}});
      roomWorld=new RoomWorld($('stage'));
    }
    renderer.nativeModels = await (
      await fetch("/assets/native-models.json")
    ).json();
    await renderer.initOriginalMaterials();
    renderer.nativeLighting = await (
      await fetch("/assets/native-lighting.json")
    ).json();
    audio = new GameAudio(manifest);
    audio.muted = save.muted;
    $("sound-button").textContent = save.muted ? "♩" : "♪";
    await changeCar(save.car);
    if(roomMode)roomVehicles=await new RoomVehicles().load(renderer,asset,manifest);
    if(roomMode)await roomLobby.build(renderer,asset,manifest,await loadRoomArt(renderer,asset,manifest),$('stage'));
    bind();
    await loadLevel(save.level);
    lastTime = performance.now();
    requestAnimationFrame(frame);
    window.game = {
      get state() {
        return state;
      },
      get sim() {
        return sim;
      },
      get room() {return room;},
      get lobby() {return roomLobby;},
      roomSnapshot:()=>roomMode?roomSnapshot():null,
      startRoomFlight,
      returnToLobby,
      get track() {
        return track;
      },
      get save() {
        return save;
      },
      get manifest() {
        return manifest;
      },
      get metrics() {
        return {
          fps,
          drawCalls: renderer.drawCalls,
          cachedAssets: cache.size,
          particles: particles.length,
          audioSources: audio.active.size,
          audioBuffers: audio.buffers.size,
          saveOk,
          loaded,
        };
      },
      get audio() {
        return audio;
      },
      loadLevel,
      changeCar,
      reset,
      beginAim,
      launch,
      closeModal,
      config: CONFIG,
      snapshot: () => ({
        state,
        paused,
        ...sim.snapshot(),
        ...window.game.metrics,
      }),
      async verifyAssets() {
        const results = [];
        for (const l of manifest.levels) {
          await asset(l.file);
          results.push(l.id);
        }
        for (const c of manifest.cars) {
          await asset(c.file);
          await asset(c.wheelFile);
          results.push(c.id);
        }
        return results;
      },
    };
  } catch (e) {
    fatal(e);
  }
}
boot();
