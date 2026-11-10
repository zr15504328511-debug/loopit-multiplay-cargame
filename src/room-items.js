// The local room demo has one chosen item per launch. These rules are separate
// from CONFIG.items so campaign/practice behavior stays intact.
export const ROOM_ITEM_IDS = Object.freeze(["pepper", "glider"]);

export const ROOM_ITEMS = Object.freeze({
  pepper: Object.freeze({
    title: "Chili Boost",
    icon: "♨",
    duration: 1.2,
    boost: 25,
    groundLift: 0,
    description: "One burst of forward speed.",
    detail: "+25 m/s · one use per launch",
  }),
  glider: Object.freeze({
    title: "Glider",
    icon: "⌁",
    duration: 5,
    gravity: 0.28,
    lift: 1,
    heightOffset: 0.1,
    description: "Stay airborne a little longer.",
    detail: "5 seconds of reduced gravity · one use per launch",
  }),
});

export const ROOM_ITEM_CHOICES = Object.freeze(
  ROOM_ITEM_IDS.map((id) => Object.freeze({ id, ...ROOM_ITEMS[id] })),
);

// The AI replay build also matches the fully upgraded local player's ceiling.
export const ROOM_UPGRADES = Object.freeze({ car: 25, sling: 20, income: 0 });

export function normalizeRoomItem(kind) {
  return ROOM_ITEM_IDS.includes(kind) ? kind : ROOM_ITEM_IDS[0];
}

// CarSimulation consumes these options. No shared CONFIG or save is mutated.
// A newly created/reset simulation receives its one charge; re-entering the
// lobby without starting another launch must not add charges to an active run.
export function roomSimulationOptions(kind = "pepper") {
  return {
    itemRules: ROOM_ITEMS,
    initialItem: normalizeRoomItem(kind),
    pickups: false,
    maxItemUses: 1,
    itemAfterRelease: true,
  };
}

export function roomItemState(sim) {
  const kind = ROOM_ITEM_IDS.includes(sim?.item)
    ? sim.item
    : ROOM_ITEM_IDS.includes(sim?.effect)
      ? sim.effect
      : null;
  const item = kind ? ROOM_ITEMS[kind] : null;
  const available = !!sim?.item && ROOM_ITEM_IDS.includes(sim.item) &&
    (sim.itemUses || 0) < 1;
  return {
    kind,
    title: item?.title || "Item used",
    icon: item?.icon || "◇",
    charges: available ? 1 : 0,
    canUse: available && sim.status === "running" && !sim.springActive,
    active: !!item && sim.effect === kind && sim.effectTime > 0,
    remaining: sim?.effect ? Math.max(0, sim.effectTime || 0) : 0,
  };
}
