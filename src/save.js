import { CONFIG } from "./config.js";
import { maxUpgradeFor } from "./progression.js";
import { isCampaign, campaignEntry, totalUpgrades } from "./campaign.js";
export const SAVE_KEY = "car-evolve-webgl-study-v1";
export const LEGACY_BACKUP_KEY = SAVE_KEY + "-legacy-backup";
const types = ["car", "sling", "income"];
const levels = [
  "savannah",
  "ski-resort",
  "west-coast",
  "formula",
  "rainbow-road",
];
const cars = [
  "muscle",
  "sports",
  "rally",
  "drift",
  "formula",
  "supercar",
  "future",
];
const num = (x, max = Number.MAX_SAFE_INTEGER) =>
  Number.isFinite(Number(x)) ? Math.max(0, Math.min(max, Number(x))) : 0;
export function newProfile(mode = "campaign") {
  return {
    version: 2,
    mode,
    coins: mode === "campaign" ? 0 : CONFIG.economy.startingCoins,
    upgrades: { car: 0, sling: 0, income: 0 },
    totals: { car: 0, sling: 0, income: 0 },
    car: mode === "campaign" ? "sports" : "muscle",
    level: "savannah",
    unlocked: [mode === "campaign" ? "sports" : "muscle"],
    records: {},
    runs: 0,
    muted: false,
    campaign: {
      universeIndex: 0,
      levelIndex: 0,
      levelAttempts: 0,
      bestDistance: 0,
      history: [],
      pendingResult: null,
    },
  };
}
function normalize(v, mode) {
  const out = newProfile(mode);
  if (!v || typeof v !== "object") return out;
  out.coins = Math.floor(num(v.coins));
  for (const t of types) {
    out.upgrades[t] = Math.floor(
      num(v.upgrades?.[t], mode === "campaign" ? 10000 : maxUpgradeFor(t)),
    );
    out.totals[t] = Math.max(
      out.upgrades[t],
      Math.floor(num(v.totals?.[t], 10000)),
    );
  }
  out.car = cars.includes(v.car) ? v.car : out.car;
  out.level = levels.includes(v.level) ? v.level : out.level;
  out.unlocked = Array.isArray(v.unlocked)
    ? [...new Set(v.unlocked.filter((x) => cars.includes(x)))]
    : out.unlocked;
  if (!out.unlocked.includes(mode === "campaign" ? "sports" : "muscle"))
    out.unlocked.unshift(mode === "campaign" ? "sports" : "muscle");
  for (const key of levels) {
    const r = v.records?.[key];
    if (r && typeof r === "object" && !Array.isArray(r))
      out.records[key] = {
        distance: num(r.distance, 1000),
        wins: Math.floor(num(r.wins)),
        bestTime: num(r.bestTime, 120),
      };
  }
  out.runs = Math.floor(num(v.runs));
  out.muted = !!v.muted;
  const c = v.campaign || {};
  out.campaign = {
    universeIndex: Math.floor(num(c.universeIndex, 100000)),
    levelIndex: Math.floor(num(c.levelIndex, 4)),
    levelAttempts: Math.floor(num(c.levelAttempts)),
    bestDistance: num(c.bestDistance, 1000),
    history: Array.isArray(c.history)
      ? c.history.filter((x) => x && typeof x === "object")
      : [],
    pendingResult: c.pendingResult?.success === true ? c.pendingResult : null,
  };
  if (mode === "campaign") {
    const entry = campaignEntry(out);
    out.car = entry.car;
    out.level = entry.level;
    if (!out.unlocked.includes(out.car)) out.unlocked.push(out.car);
  }
  return out;
}
function readEnvelope() {
  const raw = localStorage.getItem(SAVE_KEY),
    v = JSON.parse(raw || "null");
  if (v?.version === 2 && v.profiles)
    return {
      version: 2,
      mode: v.mode === "practice" ? "practice" : "campaign",
      profiles: v.profiles,
    };
  if (v?.version === 1)
    return {
      version: 2,
      mode: "practice",
      profiles: { practice: normalize(v, "practice"), campaign: newProfile() },
      legacyRaw: raw,
    };
  return {
    version: 2,
    mode: "campaign",
    profiles: { campaign: newProfile(), practice: newProfile("practice") },
  };
}
export function loadSave() {
  try {
    const e = readEnvelope();
    return normalize(e.profiles[e.mode], e.mode);
  } catch {
    return newProfile();
  }
}
export function storeSave(save) {
  try {
    let e;
    try {
      e = readEnvelope();
    } catch {
      e = { version: 2, mode: save.mode, profiles: {} };
    }
    if (e.legacyRaw && !localStorage.getItem(LEGACY_BACKUP_KEY))
      localStorage.setItem(LEGACY_BACKUP_KEY, e.legacyRaw);
    Object.assign(
      save,
      normalize(save, save.mode === "practice" ? "practice" : "campaign"),
    );
    e.mode = save.mode;
    e.profiles[save.mode] = save;
    delete e.legacyRaw;
    localStorage.setItem(SAVE_KEY, JSON.stringify(e));
    return true;
  } catch {
    return false;
  }
}
export function switchProfile(save, mode) {
  if (!["campaign", "practice"].includes(mode) || !storeSave(save)) return null;
  try {
    const e = readEnvelope();
    e.mode = mode;
    localStorage.setItem(SAVE_KEY, JSON.stringify(e));
    return loadSave();
  } catch {
    return null;
  }
}
export function economyLevel(save) {
  if (isCampaign(save)) return save.campaign.levelIndex;
  return CONFIG.economy.levelPriceScaling
    ? Math.max(0, levels.indexOf(save.level))
    : 0;
}
export function upgradeCost(save, type) {
  const e = CONFIG.economy,
    L = economyLevel(save),
    n = type === "income" ? totalUpgrades(save, "income") : save.upgrades[type];
  if (!isCampaign(save))
    return Math.trunc(
      type === "income"
        ? e.incomeBase * e.incomePriceGrowth ** n
        : e[type + "Base"] * 3.25 ** L * (e.priceGrowth + 0.05 * L) ** n,
    );
  const f = Math.fround;
  const value =
    type === "income"
      ? f(30 * f(1.5 ** n))
      : f(f(30 * f(3.25 ** L)) * f(f(1.25 + f(0.05 * L)) ** n));
  return Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER
    ? Math.trunc(value)
    : Infinity;
}
export function incomeMultiplier(save) {
  const n = totalUpgrades(save, "income"),
    L = economyLevel(save);
  return isCampaign(save)
    ? Math.fround(
        Math.fround(2 ** (L + Math.floor(n / 5))) *
          Math.fround(1 + Math.fround(0.1 * (n % 5))),
      )
    : 2 ** (L + Math.floor(n / 5)) * (1 + 0.1 * (n % 5));
}
export function upgradeAvailable(save, type) {
  return isCampaign(save)
    ? Number.isFinite(upgradeCost(save, type))
    : save.upgrades[type] < maxUpgradeFor(type);
}
export function purchaseUpgrade(save, type) {
  if (!types.includes(type) || !upgradeAvailable(save, type)) return false;
  const price = upgradeCost(save, type);
  if (save.coins < price) return false;
  save.coins -= price;
  save.upgrades[type]++;
  save.totals[type]++;
  return true;
}
export function distanceReward(save, distance, success, track, runCoins = 0) {
  const basis = isCampaign(save)
    ? success
      ? track.endZ
      : distance
    : Math.min(distance, track.endZ - track.startZ);
  const scaled = basis * incomeMultiplier(save);
  return Math.trunc(isCampaign(save) ? Math.fround(scaled) : scaled) + runCoins;
}
