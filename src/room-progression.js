// Local demo progression. Original campaign economics and physics are unchanged.
export const ROOM_UPGRADE_TYPES=['car','sling','income'];
export const ROOM_UPGRADE_LIMITS={car:3,sling:5,income:10};
export const ROOM_STARTING_COINS=500;
const clampInt=(value,max,fallback=0)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.floor(Number(value)))):fallback;
export function roomEconomy(saved) {
  return {coins:clampInt(saved?.coins,100000000,ROOM_STARTING_COINS),levels:Object.fromEntries(ROOM_UPGRADE_TYPES.map(k=>[k,clampInt(saved?.levels?.[k],ROOM_UPGRADE_LIMITS[k])]))};
}
export function roomBuild(levels={}) {
  return {car:[10,15,20,25][clampInt(levels.car,3)],sling:[8,10,12,15,18,20][clampInt(levels.sling,5)],income:clampInt(levels.income,10)};
}
export const roomIncome=levels=>1+.2*clampInt(levels?.income,10);
export function roomUpgradePrice(levels,type) {
  if(!ROOM_UPGRADE_TYPES.includes(type)||levels[type]>=ROOM_UPGRADE_LIMITS[type])return null;
  return Math.round(({car:80,sling:60,income:50})[type]*1.6**levels[type]);
}
export function roomFlightReward(distance,success,levels) {
  if(!Number.isFinite(distance)||distance<1)return 0;
  return Math.floor((10+Math.min(distance,2000)*.3+(success?75:0))*roomIncome(levels));
}
export const ROOM_CAR_IDS=['sports','rally','muscle','formula','supercar','drift','future'];
export const ROOM_PLAYER_COLORS=['#ffc52f','#25d5d0','#f05256','#9c74ff','#369afa','#ff82bb','#8bd646','#ff8735','#48bba7','#db66e2','#eee8cd','#4172cf','#b4e329','#e888a4','#7a81f0','#29c3ee','#deac49','#52ad70','#dc7463','#ae81be'];
export function roomVehicleIdentity(index) {return {carId:ROOM_CAR_IDS[index%ROOM_CAR_IDS.length],color:ROOM_PLAYER_COLORS[index%ROOM_PLAYER_COLORS.length],number:index+1};}
