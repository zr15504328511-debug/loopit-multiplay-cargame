import { NATIVE_CAMPAIGN } from "./native-campaign.js";
export const isCampaign = (save) => save.mode === "campaign";
export function campaignLevels(save) {
  return NATIVE_CAMPAIGN.universes[
    (save.campaign?.universeIndex || 0) % NATIVE_CAMPAIGN.universes.length
  ];
}
export function campaignEntry(save) {
  const levels = campaignLevels(save);
  return levels[Math.min(levels.length - 1, save.campaign?.levelIndex || 0)];
}
export function physicalUpgrades(save) {
  if (!isCampaign(save)) return save.upgrades;
  // Slingshot.GetPowerUpgradeCount 0x15d5f4c: current + (total-current)%5.
  return {
    ...save.upgrades,
    sling:
      save.upgrades.sling + ((save.totals.sling - save.upgrades.sling) % 5),
  };
}
export function totalUpgrades(save, type) {
  return isCampaign(save) ? save.totals[type] : save.upgrades[type];
}
export function advanceCampaign(save) {
  if (!isCampaign(save) || !save.campaign.pendingResult) return false;
  const c = save.campaign,
    levels = campaignLevels(save);
  c.history.push({
    universe: c.universeIndex,
    level: c.levelIndex,
    car: save.car,
    ...c.pendingResult,
  });
  c.pendingResult = null;
  c.levelIndex++;
  if (c.levelIndex >= levels.length) {
    c.universeIndex++;
    c.levelIndex = 0;
    save.coins = 0;
    save.totals = { car: 0, sling: 0, income: 0 };
  }
  save.upgrades = { car: 0, sling: 0, income: 0 };
  c.levelAttempts = 0;
  c.bestDistance = 0;
  const entry = campaignEntry(save);
  save.level = entry.level;
  save.car = entry.car;
  if (!save.unlocked.includes(entry.car)) save.unlocked.push(entry.car);
  return true;
}
