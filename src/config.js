import { NATIVE } from "./native-physics.js";
// Gameplay tuning and simulation configuration.
export const CONFIG = {
  physics: {
    fixedStep: 0.005,
    maxFrame: 0.1,
    gravity: 9.81,
    lateralGrip: 7,
    maxLateralAcceleration: 18,
    uprightStrength: 25,
    uprightDamping: 7,
    steeringAssist: 8,
    maxSpeed: NATIVE.maxSpeed,
    maxRunSeconds: 120,
  },
  coasting: {
    // Original AB experiment branch unknown; both native tables are preserved.
    frontWheelsFirst: false,
    chassisFriction: 0.2,
    // Contact geometry, input mapping and numerical sleep below are browser tuning.
    chassisRideHeight: 0.12,
    wheelRideHeight: 0.375,
    steeringAngle: 0.5,
    // No extra coefficient has been confirmed for terrain detail channels.
    offroadDamping: 0,
    extraStopDrag: NATIVE.extraStopDrag,
    stickyStopSpeed: NATIVE.stopSpeedThreshold,
    stopCompleteSpeed: NATIVE.stopCompleteSpeed,
    numericalSleepSpeed: 0.02,
    stickyStopDelay: 1,
    // Smoothly finish low-speed ground coasting.
    // HUD uses km/h. End the slow ground roll smoothly below a displayed 30.
    lowSpeedBrakeStart: 30 / 3.6,
    lowSpeedBrakeRamp: 0.4,
    lowSpeedDeceleration: 2.2,
    stopDelay: 0.35,
  },
  gameplay: {
    // No invented, always-on road boosts in the normal slingshot progression loop.
    roadBoosters: false,
    firstItemDistance: 160,
  },
  economy: {
    startingCoins: 360,
    carBase: 30,
    slingBase: 30,
    incomeBase: 30,
    priceGrowth: 1.25,
    incomePriceGrowth: 1.5,
    // Practice profile compatibility only. Campaign uses original per-level/total counts.
    // See save.js and campaign.js for pricing and resets.
    levelPriceScaling: false,
    purchasesPerMajorUpgrade: 5,
  },
  items: {
    pepper: { title: "Chili Pepper", icon: "♨", duration: 3.2, boost: 17 },
    glider: { title: "Glider", icon: "⌁", duration: 6, gravity: 0.28 },
    // Serialized GoldenApple duration / initialForwardBoost; boost clawback remains approximate.
    apple: { title: "Golden Apple", icon: "✦", duration: 8, boost: 10 },
  },
  visuals: {
    garageFov: 52,
    flightFov: 72,
    originalSavannahCameraFov: 90,
    renderDistance: 500,
  },
};
export const LEVEL_STYLE = {
  savannah: {
    title: "Savannah",
    en: "SAVANNAH",
    tag: "01",
    description: "Launch through the grasslands and bridges.",
    sky: [0.73, 0.85, 0.83],
    road: [1, 1, 0.712, 1],
    ground: [0.584, 0.878, 0.443, 1],
    edge: [1, 0.957, 0.816, 1],
    width: 1.25,
  },
  "ski-resort": {
    title: "Ski Resort",
    en: "SKI RESORT",
    tag: "02",
    description: "Find your line through snow slopes and pine forests.",
    sky: [0.7, 0.82, 0.94],
    road: [0.89, 0.94, 0.96, 1],
    ground: [0.81, 0.88, 0.95, 1],
    edge: [0.46, 0.72, 0.84, 1],
    width: 1.15,
  },
  "west-coast": {
    title: "West Coast",
    en: "WEST COAST",
    tag: "03",
    description: "Coast along the palm-lined shore.",
    sky: [0.68, 0.84, 0.87],
    road: [0.3, 0.37, 0.4, 1],
    ground: [0.7137, 0.8392, 0.1059, 1],
    edge: [0.98, 0.89, 0.67, 1],
    width: 1.4,
  },
  formula: {
    title: "Formula",
    en: "FORMULA",
    tag: "04",
    description: "Follow the bends between the red and white curbs.",
    sky: [0.71, 0.84, 0.88],
    road: [0.27, 0.32, 0.36, 1],
    ground: [0.4, 0.65, 0.44, 1],
    edge: [0.95, 0.91, 0.79, 1],
    width: 1.35,
  },
  "rainbow-road": {
    title: "Rainbow Road",
    en: "RAINBOW ROAD",
    tag: "05",
    description: "Stay on the rainbow track above the void.",
    sky: [0.12, 0.14, 0.29],
    road: [0.61, 0.45, 0.85, 1],
    ground: [0.17, 0.19, 0.35, 1],
    edge: [0.85, 0.78, 0.99, 1],
    width: 1.55,
  },
};
