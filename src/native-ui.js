import { loadSave, incomeMultiplier } from "./save.js";
import { isCampaign, totalUpgrades } from "./campaign.js";

// Presentation only: existing main.js owns purchases, launching and save writes.
const byId = (id) => document.getElementById(id);
const text = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function resultMarkup({
  success,
  distance,
  reward,
  multiplier = 1,
  newRecord = false,
  reason = "",
  campaign = false,
}) {
  return `<div class="native-result ${success ? "success" : ""}">
    ${newRecord ? '<div class="native-record">NEW RECORD!</div>' : ""}
    <h2 class="native-distance">${Math.round(distance)}m</h2>
    <div class="native-result-banner">LEVEL COMPLETE</div><div class="native-reward-label">Reward:</div>
    <p class="result-sub">${text(reason)}</p>
    <div class="native-reward">+${Math.trunc(reward).toLocaleString()}<img src="/assets/native-ui/sprites_0-3.png" alt="Coins" /></div>
    <div class="native-income-card"><span>x${text(Number(multiplier.toFixed(1)))}</span></div>
    ${success && campaign ? `<p class="campaign-next-note">${text(reason)}</p>` : ""}
    <div class="native-result-actions">${success && campaign ? "" : '<button class="native-upgrade-action" id="result-retry">Upgrade</button>'}<button id="result-next">${success ? "Next" : "Retry"}</button></div>
  </div>`;
}
let queued = false;
function refreshUpgrades() {
  queued = false;
  const save = loadSave();
  for (const type of ["sling", "car", "income"]) {
    const button = document.querySelector(`[data-upgrade="${type}"]`);
    if (!button) continue;
    const n = totalUpgrades(save, type) || 0;
    const badge = button.querySelector("[data-native-level]");
    // Native UpdateUpgradeCountText 0x1634670: total purchase count + 1.
    const label = String(n + 1);
    if (badge.textContent !== label) badge.textContent = label;
    // Native UpdateSubUpgradeImages 0x16340f0: i <= (currentCount+5)%5.
    button
      .querySelectorAll(".upgrade-pips i")
      .forEach((pip, i) =>
        pip.classList.toggle(
          "filled",
          i <= (isCampaign(save) && type === "car" ? save.upgrades.car : n) % 5,
        ),
      );
    const price = byId(`${type}-price`);
    if (price.textContent.startsWith("● "))
      price.textContent = price.textContent.slice(2);
    const amount = Number(price.textContent.replace(/[^0-9.]/g, ""));
    button.classList.toggle(
      "unaffordable",
      Number.isFinite(amount) && amount > save.coins,
    );
  }
  const multiplier = byId("native-income-multiplier");
  const label = "x" + Number(incomeMultiplier(save).toFixed(1));
  if (multiplier && multiplier.textContent !== label)
    multiplier.textContent = label;
}
function queueRefresh() {
  if (!queued) {
    queued = true;
    queueMicrotask(refreshUpgrades);
  }
}
if (byId("garage")) {
  // Observe only existing live labels, never our own badge mutations.
  for (const id of [
    "car-upgrade-desc",
    "sling-upgrade-desc",
    "income-upgrade-desc",
    "car-price",
    "sling-price",
    "income-price",
    "coins",
  ])
    new MutationObserver(queueRefresh).observe(byId(id), {
      childList: true,
      characterData: true,
      subtree: true,
    });
  const speed = byId("speed");
  new MutationObserver(() => {
    const angle = Math.min(
      270,
      Math.max(0, (Number(speed.textContent) / 180) * 270),
    );
    byId("telemetry").style.setProperty("--speed-angle", angle + "deg");
  }).observe(speed, { childList: true, characterData: true });
  refreshUpgrades();
}
