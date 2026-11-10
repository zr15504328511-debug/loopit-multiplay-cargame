import {newProfile} from './save.js';
import {advanceCampaign,campaignLevels} from './campaign.js';

export const ROOM_UPGRADE_TYPES=['car','sling','income'];
export const ROOM_ECONOMY_VERSION=1;
const integer=(value,max=Number.MAX_SAFE_INTEGER)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.floor(Number(value)))):0;
const counts=value=>Object.fromEntries(ROOM_UPGRADE_TYPES.map(type=>[type,integer(value?.[type],10000)]));

// The room owns storage and map selection; shared campaign functions own all
// purchase prices, income multipliers, physical counts and level transitions.
export function roomEconomy(saved,maps,mapId,completed=[]) {
  const selected=Math.max(0,maps.findIndex(m=>m.id===mapId));
  const fresh=newProfile('campaign');
  const garage={rules:ROOM_ECONOMY_VERSION,coins:fresh.coins,totals:{...fresh.totals},builds:{},universeIndex:0,frontier:Math.max(selected,completed.length-1,0)};
  if(saved?.rules===ROOM_ECONOMY_VERSION) {
    garage.coins=integer(saved.coins);garage.universeIndex=integer(saved.universeIndex,100000);
    garage.frontier=Math.max(garage.frontier,integer(saved.frontier,maps.length-1));
    for(const map of maps)if(saved.builds?.[map.id])garage.builds[map.id]=counts(saved.builds[map.id]);
    garage.totals=counts(saved.totals);
  } else if(saved) {
    // One-time compatibility with the former jump-level demo. Preserve paid
    // balance and physical car/sling stages; income keeps its purchase count.
    garage.coins=integer(saved.coins);
    if(saved.levels)garage.builds[mapId]={car:[10,15,20,25][integer(saved.levels.car,3)],sling:[8,10,12,15,18,20][integer(saved.levels.sling,5)],income:integer(saved.levels.income,10)};
  }
  garage.builds[mapId]??={...fresh.upgrades};
  for(const type of ROOM_UPGRADE_TYPES)garage.totals[type]=Math.max(garage.totals[type],Object.values(garage.builds).reduce((sum,build)=>sum+build[type],0));
  return garage;
}

export function roomProfile(garage,maps,mapId) {
  garage.builds[mapId]??={car:0,sling:0,income:0};
  return {mode:'campaign',coins:garage.coins,upgrades:garage.builds[mapId],totals:garage.totals,
    campaign:{levelIndex:Math.max(0,maps.findIndex(m=>m.id===mapId)),universeIndex:garage.universeIndex}};
}

// Driving into the next unlocked portal replaces the campaign's Next action.
// Revisiting a completed map restores its current-round build without resetting
// shared coins/totals. First-map entry after all five clears starts a new round.
export function enterRoomProgression(garage,maps,mapId,completed) {
  const index=maps.findIndex(m=>m.id===mapId),last=maps.length-1;
  const newRound=index===0&&garage.frontier===last&&completed.length===maps.length;
  const next=index===garage.frontier+1&&completed.includes(maps[garage.frontier].id);
  if(!newRound&&!next)return {newRound:false,advanced:false};
  const profile=newProfile('campaign');
  Object.assign(profile,roomProfile(garage,maps,maps[garage.frontier].id));
  profile.campaign={...profile.campaign,levelIndex:newRound?campaignLevels(profile).length-1:garage.frontier,history:[],pendingResult:{success:true}};
  advanceCampaign(profile);
  garage.coins=profile.coins;garage.totals=profile.totals;garage.universeIndex=profile.campaign.universeIndex;
  garage.frontier=index;
  if(newRound){garage.builds={};completed.length=0;}
  garage.builds[mapId]=profile.upgrades;
  return {newRound,advanced:true};
}
export const ROOM_CAR_IDS=['sports','rally','muscle','formula','supercar','drift','future'];
export const ROOM_PLAYER_COLORS=['#ffc52f','#25d5d0','#f05256','#9c74ff','#369afa','#ff82bb','#8bd646','#ff8735','#48bba7','#db66e2','#eee8cd','#4172cf','#b4e329','#e888a4','#7a81f0','#29c3ee','#deac49','#52ad70','#dc7463','#ae81be'];
export function roomVehicleIdentity(index) {return {carId:ROOM_CAR_IDS[index%ROOM_CAR_IDS.length],color:ROOM_PLAYER_COLORS[index%ROOM_PLAYER_COLORS.length],number:index+1};}
