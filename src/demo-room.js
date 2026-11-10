import { ROOM_ITEM_CHOICES, normalizeRoomItem } from './room-items.js';
import {roomEconomy,roomBuild,roomUpgradePrice,roomFlightReward,roomIncome,roomVehicleIdentity,ROOM_UPGRADE_TYPES,ROOM_UPGRADE_LIMITS,ROOM_PLAYER_COLORS} from './room-progression.js';

export const ROOM_CAPACITY = 20;
export const ROOM_SAVE_KEY = 'car-evolve-local-room-v1';
const names = ['Mochi','Nova','Sunny','Pixel','Coco','Bolt','Luna','Echo','Milo','Pip','Comet','Kiwi','Rio','Bean','Dash','Maple','Ziggy','Otto','Skye'];
const colors = ROOM_PLAYER_COLORS;
const bounded = (value, min, max, fallback = min) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
const cleanName = name => Array.from(String(name || 'You').replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0,16).join('') || 'You';

export function avatarFor(index = 0) {
  const color = colors[index % colors.length], tilt = index % 3 - 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><path d="M8 64c1-19 47-22 49 0" fill="#284d48"/><g transform="rotate(${tilt*5} 32 31)"><path d="M13 31C11 4 53 4 51 31l-3 12H16z" fill="#fff9df"/><path d="M28 9h8v14h-8" fill="${color}"/><rect x="13" y="23" width="38" height="22" rx="10" fill="#254b48"/><path d="M19 28h23" stroke="#ffffff" opacity=".2" stroke-width="3" stroke-linecap="round"/><circle cx="25" cy="34" r="3" fill="#fff"/><circle cx="40" cy="34" r="3" fill="#fff"/><path d="M29 42q4 3 8-1" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round"/></g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Local demo room only. No server, matchmaking, or real remote participants.
// AI cars replay CarSimulation paths using the maximum build and room items.
export class DemoRoom {
  constructor(maps, storage = null) {
    this.maps = maps;
    this.storage = storage;
    let saved = {};
    try { saved = JSON.parse(storage?.getItem(ROOM_SAVE_KEY) || '{}') || {}; } catch {}
    this.name = cleanName(saved.name);
    this.count = Math.floor(bounded(saved.count,1,ROOM_CAPACITY,8));
    this.completed=[];
    for(const map of maps) {
      if(!Array.isArray(saved.completed)||!saved.completed.includes(map.id))break;
      this.completed.push(map.id);
    }
    this.mapId = this.isUnlocked(saved.mapId) ? saved.mapId : maps[0].id;
    this.selectedItem = normalizeRoomItem(saved.selectedItem);
    this.muted = !!saved.muted;
    this.garage=roomEconomy(saved.garage);
    this.records = {};
    for (const map of maps) {
      this.records[map.id] = {};
      for (let i=0;i<ROOM_CAPACITY;i++) {
        const id = i ? `ai-${i}` : 'you', source = saved.records?.[map.id]?.[id];
        if (!source || !Number.isFinite(source.best) || source.best <= 0) continue;
        const best = bounded(source.best,0,map.length);
        const position = Array.isArray(source.position) && source.position.length === 3 && source.position.every(Number.isFinite) ? source.position.map(v=>bounded(v,-10000,10000)) : null;
        this.records[map.id][id] = {best,position};
      }
    }
    this.players = [];
    this.replays = [];
    this.lastRun = null;
    this.busy = false;
    this.time = 0;
    this.dirty = false;
    this.saveClock = 0;
    this.round = 0;
    this.createPlayers();
  }
  isUnlocked(id) { const index=this.maps.findIndex(m=>m.id===id);return index>=0&&index<=this.completed.length; }
  get map() { return {...this.maps.find(m=>m.id===this.mapId),unlocked:true,completed:this.completed.includes(this.mapId)}; }
  get local() { return this.players[0]; }
  get upgrades() {return roomBuild(this.garage.levels);}
  buyUpgrade(type) {
    if(this.busy||this.local.status==='flying')return false;
    const price=roomUpgradePrice(this.garage.levels,type);
    if(price===null||this.garage.coins<price)return false;
    this.garage.coins-=price;this.garage.levels[type]++;this.persist();return true;
  }
  leaderboard(mapId=this.mapId) {
    if(!this.maps.some(m=>m.id===mapId))return [];
    return this.players.map(p=>({...p,best:this.records[mapId]?.[p.id]?.best||0})).filter(p=>p.best>0)
      .sort((a,b)=>b.best-a.best||a.number-b.number).map((p,i)=>({id:p.id,name:p.name,color:p.color,avatar:p.avatar,carId:p.carId,number:p.number,isLocal:p.isLocal,isAI:p.isAI,best:p.best,rank:i+1}));
  }
  createPlayers() {
    const previous = new Map(this.players.map(p=>[p.id,p]));
    this.players = Array.from({length:this.count},(_,i)=>{
      const id=i?`ai-${i}`:'you', record=this.records[this.mapId]?.[id];
      return previous.get(id) || {id,name:i?names[i-1]:this.name,...roomVehicleIdentity(i),avatar:avatarFor(i),
        isLocal:!i,isAI:!!i,best:record?.best || 0,flag:record?.position ? [...record.position] : null,flagDistance:record?.best||0,
        distance:0,status:'ready',pose:null,run:null,round:0,participating:false};
    });
  }
  enterMap(id, track, replays) {
    if (!this.isUnlocked(id)) throw new Error('Finish the previous map to unlock this one.');
    this.mapId=id; this.track=track; this.replays=replays?.runs || [];
    this.players=[]; this.createPlayers(); this.lastRun=null; this.round=0; this.busy=false;
    this.persist();
  }
  setCount(count) {
    this.count=Math.floor(bounded(count,1,ROOM_CAPACITY,8));
    this.createPlayers(); this.persist();
  }
  setName(name) { this.name=cleanName(name); this.local.name=this.name; this.persist(); }
  setItem(kind) { this.selectedItem=normalizeRoomItem(kind); this.persist(); }
  persist() {
    try {
      if(!this.storage)throw new Error('Storage unavailable');
      this.storage.setItem(ROOM_SAVE_KEY,JSON.stringify({version:2,name:this.name,count:this.count,mapId:this.mapId,
        selectedItem:this.selectedItem,muted:this.muted,records:this.records,completed:this.completed,garage:this.garage}));
      this.storageOK=true;
    } catch { this.storageOK=false; }
    this.dirty=false; this.saveClock=0;
  }
  record(player, distance, position) {
    if (!Number.isFinite(distance) || !position?.every(Number.isFinite)) return false;
    const best=Math.min(this.map.length,Math.max(0,distance));
    if (best <= player.best) return false;
    player.best=best; player.pendingFlag=[...position]; player.recordAt=this.time;
    this.records[this.mapId][player.id]={best,position:[...position]}; this.dirty=true;
    return true;
  }
  beginLocal() {
    this.local.status='flying'; this.local.distance=0; this.local.runStartBest=this.local.best;
    this.local.participating=true;
    this.lastRun=null; this.round++;
  }
  observeLocal(sim) {
    if(this.local.status!=='flying') return;
    this.local.distance=Math.min(this.map.length,sim.distance);
    this.local.pose={x:sim.x,y:sim.y,z:sim.z,yaw:sim.yaw,pitch:sim.pitch,roll:sim.roll};
    // Record the actual peak pose, not a later crash/fall position.
    if(sim.z-this.track.startZ >= this.local.best-.002)
      this.record(this.local,this.local.distance,[sim.x,sim.y,Math.min(sim.z,this.track.endZ)]);
  }
  finishLocal(sim, success=false, abandoned=false) {
    if(this.local.status!=='flying')return this.lastRun;
    this.observeLocal(sim);
    const cleared=success&&!abandoned&&sim.status==='success'&&sim.distance>=this.map.length-.1;
    this.lastRun={distance:this.local.distance,best:this.local.best,newRecord:this.local.best>(this.local.runStartBest||0)+.01,
      success:cleared,abandoned,elapsed:sim.elapsed};
    this.lastRun.reward=abandoned?0:roomFlightReward(this.local.distance,cleared,this.garage.levels);
    this.garage.coins=Math.min(100000000,this.garage.coins+this.lastRun.reward);
    if(this.local.pendingFlag) {this.local.flag=[...this.local.pendingFlag];this.local.flagDistance=this.local.best;this.local.pendingFlag=null;}
    if(cleared&&!this.completed.includes(this.mapId)) {
      const index=this.maps.findIndex(m=>m.id===this.mapId);
      if(index===this.completed.length) {
        this.completed.push(this.mapId);
        this.lastRun.unlocked=this.maps[index+1]?.title || null;
      }
    }
    this.local.status='ready'; this.local.pose=null; this.persist();
    return this.lastRun;
  }
  queueBot(player, delay) {
    if(!this.replays.length)return;
    const index=Number(player.id.split('-')[1]);
    const replay=this.replays[(index-1+player.round*3)%this.replays.length];
    player.round++; player.run={replay,time:-delay,cursor:0}; player.distance=0; player.status='ready'; player.pose=null;
  }
  update(dt) {
    this.time+=dt; this.saveClock+=dt;
    for(const player of this.players.slice(1)) {
      const run=player.run; if(!run)continue;
      run.time+=dt;
      if(run.time<0)continue;
      const frames=run.replay.frames;
      if(run.time>run.replay.duration) {
        if(player.status==='flying') {
          const last=frames.at(-1);
          player.distance=Math.min(this.map.length,last[7]);
          if(last[3]-this.track.startZ>=player.best-.01)
            this.record(player,player.distance,[last[1],last[2],Math.min(last[3],this.track.endZ)]);
          if(player.pendingFlag) {player.flag=[...player.pendingFlag];player.flagDistance=player.best;player.pendingFlag=null;}
          player.status='lobby'; player.pose=null; this.dirty=true;
        }
        if(run.time>run.replay.duration+2)player.run=null;
        continue;
      }
      player.status='flying';
      player.participating=true;
      while(run.cursor<frames.length-2 && frames[run.cursor+1][0]<run.time)run.cursor++;
      const a=frames[run.cursor],b=frames[Math.min(frames.length-1,run.cursor+1)];
      const t=bounded((run.time-a[0])/Math.max(.0001,b[0]-a[0]),0,1);
      const value=n=>a[n]+(b[n]-a[n])*t;
      const angle=n=>a[n]+Math.atan2(Math.sin(b[n]-a[n]),Math.cos(b[n]-a[n]))*t;
      player.pose={x:value(1),y:value(2),z:value(3),yaw:angle(4),pitch:angle(5),roll:angle(6)};
      player.distance=Math.min(this.map.length,value(7));
      player.effect=a[8] || null;
      if(player.pose.z-this.track.startZ>=player.best-.01)
        this.record(player,player.distance,[player.pose.x,player.pose.y,Math.min(player.pose.z,this.track.endZ)]);
    }
    if(this.dirty && this.saveClock>2)this.persist();
  }
  snapshot() {
    return {map:this.map,maps:this.maps.map(m=>({...m,unlocked:this.isUnlocked(m.id),completed:this.completed.includes(m.id)})),players:this.players,capacity:ROOM_CAPACITY,localId:'you',
      roomName:'The Launch Club',lastRun:this.lastRun,busy:this.busy,selectedItem:this.selectedItem,
      coins:this.garage.coins,upgrades:ROOM_UPGRADE_TYPES.map(type=>({type,level:this.garage.levels[type]+1,max:this.garage.levels[type]>=ROOM_UPGRADE_LIMITS[type],price:roomUpgradePrice(this.garage.levels,type),income:type==='income'?roomIncome(this.garage.levels):null})),
      leaderboards:Object.fromEntries(this.maps.map(m=>[m.id,this.leaderboard(m.id)])),
      items:ROOM_ITEM_CHOICES,storageOK:this.storageOK!==false};
  }
}
