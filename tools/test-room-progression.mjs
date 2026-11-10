import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DemoRoom,ROOM_SAVE_KEY,ROOM_ECONOMY_BACKUP_KEY} from '../src/demo-room.js';
import {vehicleStats} from '../src/progression.js';
import {incomeMultiplier} from '../src/save.js';
import {roomVehicleIdentity} from '../src/room-progression.js';
import {RoomVehicles} from '../src/room-vehicles.js';
const maps=['savannah','ski-resort','west-coast','formula','rainbow-road'].map(id=>({id,title:id,length:500}));
const track={startZ:10,endZ:510};
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const fresh=()=>{const r=new DemoRoom(maps);r.enterMap(maps[0].id,track,{runs:[]});return r;};
const cases=[];
const check=(name,fn)=>{fn();cases.push(name);};
check('Fresh room has zero coins, bare frame, zero counts and three 30-coin prices',()=>{
  const r=fresh();assert.equal(r.garage.coins,0);assert.deepEqual(r.upgrades,{car:0,sling:0,income:0});
  assert.equal(vehicleStats(r.upgrades).hasWheels,false);assert.equal(vehicleStats(r.upgrades).springForce,12500);
  assert.deepEqual(r.snapshot().upgrades.map(u=>u.price),[30,30,30]);
  assert.deepEqual(r.snapshot().upgrades.map(u=>u.level),[1,1,1]);
  for(const type of ['car','sling','income','unknown'])assert.equal(r.buyUpgrade(type),false);
});
check('Purchases follow the campaign price sequence and increment exactly one level without demo caps',()=>{
  for(const type of ['car','sling','income']){
    const r=fresh();r.garage.coins=1e9; // Explicit funds fixture for price/count boundaries.
    const prices=type==='income'?[30,45,67,101,151,227]:[30,37,46,58,73,91];
    const limit=type==='income'?20:30;
    for(let n=0;n<limit;n++){
      const entry=r.snapshot().upgrades.find(u=>u.type===type),balance=r.garage.coins;
      if(n<prices.length)assert.equal(entry.price,prices[n]);
      assert.equal(entry.max,false);assert(r.buyUpgrade(type));
      assert.equal(r.garage.coins,balance-entry.price);assert.equal(r.progression.upgrades[type],n+1);assert.equal(r.garage.totals[type],n+1);
    }
    if(type==='income')assert.equal(incomeMultiplier(r.progression),16);
    else assert.equal(vehicleStats(r.upgrades)[type==='car'?'carLevel':'slingLevel'],type==='car'?25:20);
    r.beginLocal();const balance=r.garage.coins;assert.equal(r.buyUpgrade(type),false);assert.equal(r.garage.coins,balance);
  }
  const r=fresh();r.garage.coins=1000;
  r.buyUpgrade('car');r.buyUpgrade('sling');r.buyUpgrade('income');
  assert.deepEqual(r.upgrades,{car:1,sling:1,income:1});assert.equal(r.garage.coins,910);
  assert.equal(vehicleStats(r.upgrades).groundDamping,.185);assert.equal(vehicleStats(r.upgrades).springForce,13250);
  assert.equal(incomeMultiplier(r.progression),Math.fround(1+Math.fround(.1)));
});
check('Distance reward has no demo base/bonus; completion uses absolute end Z; payment is unique',()=>{
  const r=fresh();r.beginLocal();r.finishLocal({x:0,y:1,z:160,distance:150,elapsed:8,status:'failed'},false);
  assert.equal(r.lastRun.reward,150);assert.equal(r.garage.coins,150);
  r.finishLocal({x:0,y:1,z:160,distance:150,elapsed:8,status:'failed'},false);assert.equal(r.garage.coins,150);
  assert(r.buyUpgrade('income'));r.beginLocal();r.finishLocal({x:0,y:1,z:160,distance:150,elapsed:8,status:'failed'},false);
  assert.equal(r.lastRun.reward,165);assert.equal(r.garage.coins,285);
  r.beginLocal();r.finishLocal({x:0,y:1,z:160,distance:150,elapsed:8,status:'failed'},false,true);assert.equal(r.lastRun.reward,0);assert.equal(r.garage.coins,285);
  const win=fresh();win.beginLocal();win.finishLocal({x:0,y:1,z:510,distance:500,elapsed:8,status:'success'},true);assert.equal(win.lastRun.reward,510);
});
check('New-map entry resets current counts, retains coins/totals and carries incomplete sling groups; replay maps keep their builds',()=>{
  const r=new DemoRoom(maps,storage);r.enterMap(maps[0].id,track,{runs:[]});r.garage.coins=1e6;
  for(const [type,n]of [['car',2],['sling',7],['income',6]])for(let i=0;i<n;i++)assert(r.buyUpgrade(type));
  r.beginLocal();r.finishLocal({x:0,y:1,z:510,distance:500,elapsed:8,status:'success'},true);
  assert.equal(r.lastRun.reward,1122);const balance=r.garage.coins;
  r.enterMap(maps[1].id,track,{runs:[]});assert.equal(r.garage.coins,balance);
  assert.deepEqual(r.progression.upgrades,{car:0,sling:0,income:0});assert.deepEqual(r.garage.totals,{car:2,sling:7,income:6});
  assert.deepEqual(r.upgrades,{car:0,sling:2,income:0});
  assert.deepEqual(r.snapshot().upgrades.map(u=>u.price),[97,97,341]);assert.equal(incomeMultiplier(r.progression),Math.fround(4*Math.fround(1.1)));
  assert.deepEqual(r.snapshot().upgrades.map(u=>u.level),[3,8,7]);assert.equal(r.snapshot().upgrades[0].step,0);
  assert(r.buyUpgrade('car'));assert.equal(r.garage.coins,balance-97);
  r.enterMap(maps[0].id,track,{runs:[]});assert.equal(r.progression.upgrades.car,2);
  r.enterMap(maps[1].id,track,{runs:[]});assert.equal(r.progression.upgrades.car,1);assert.equal(r.garage.coins,balance-97);
  assert.deepEqual(new DemoRoom(maps,storage).garage,r.garage);
  // Domain transition fixture: completion events, not a physical route claim.
  for(let i=1;i<5;i++){
    r.enterMap(maps[i].id,track,{runs:[]});r.beginLocal();r.finishLocal({x:0,y:1,z:510,distance:500,elapsed:8,status:'success'},true);
  }
  assert(r.nextRoundReady);assert(r.garage.coins>0);assert.equal(r.garage.universeIndex,0);
  r.enterMap(maps[0].id,track,{runs:[]});assert.equal(r.garage.universeIndex,1);assert.equal(r.garage.coins,0);
  assert.deepEqual(r.garage.totals,{car:0,sling:0,income:0});assert.deepEqual(r.upgrades,{car:0,sling:0,income:0});
  assert.deepEqual(r.completed,[]);assert.equal(r.isUnlocked(maps[1].id),false);assert.equal(r.local.best,500);
  assert.deepEqual(new DemoRoom(maps,storage).garage,r.garage);
  r.enterMap(maps[0].id,track,{runs:[]});assert.equal(r.garage.universeIndex,1,'A round reset cannot be replayed');
});
check('Old demo migration preserves balance/stages/records, keeps an exact backup and does not repeat',()=>{
  const raw=JSON.stringify({version:2,name:'Pilot',count:20,mapId:maps[0].id,completed:[maps[0].id],garage:{coins:310,levels:{car:1,sling:2,income:3}},records:{[maps[0].id]:{you:{best:120,position:[0,1,130]}}}});
  memory.clear();memory.set(ROOM_SAVE_KEY,raw);const r=new DemoRoom(maps,storage);
  assert.equal(r.garage.coins,310);assert.deepEqual(r.upgrades,{car:15,sling:12,income:3});assert.equal(r.local.best,120);assert(r.isUnlocked(maps[1].id));
  r.setName('Pilot');assert.equal(memory.get(ROOM_ECONOMY_BACKUP_KEY),raw);
  assert.deepEqual(new DemoRoom(maps,storage).garage,r.garage);assert.equal(memory.get(ROOM_ECONOMY_BACKUP_KEY),raw);
  const noGarage=new DemoRoom(maps,{getItem:()=>JSON.stringify({name:'Old room'}),setItem(){}});assert.equal(noGarage.garage.coins,0);assert.deepEqual(noGarage.upgrades,{car:0,sling:0,income:0});
  const completed={...JSON.parse(raw),completed:maps.map(m=>m.id)};memory.set(ROOM_SAVE_KEY,JSON.stringify(completed));
  const resumed=new DemoRoom(maps,storage);resumed.enterMap(maps[0].id,track,{runs:[]},{resume:true});
  assert.equal(resumed.garage.coins,310,'Loading a completed save does not silently start a new round');
  assert(resumed.nextRoundReady);resumed.enterMap(maps[0].id,track,{runs:[]});assert.equal(resumed.garage.coins,0);assert.equal(resumed.garage.universeIndex,1);
});
check('Rankings and twenty player identities survive the progression change',()=>{
  const r=fresh();r.setCount(20);r.record(r.local,150,[0,1,160]);r.record(r.players[1],200,[0,1,210]);r.record(r.players[2],300,[0,1,310]);r.setName('<Pilot>');
  assert.deepEqual(r.leaderboard().map(p=>p.best),[300,200,150]);assert.equal(r.leaderboard().at(-1).name,'<Pilot>');
  assert.equal(r.leaderboard(maps[1].id).length,0);assert.equal(r.leaderboard('unknown').length,0);
  assert.equal(new Set(r.players.map(p=>`${p.carId}:${p.color}`)).size,20);assert.equal(new Set(r.players.map(p=>p.carId)).size,7);
});
check('Bare-frame lobby rendering has no wheels and paint leaves shared materials intact',()=>{
  const fleet=new RoomVehicles(),material={name:'AFRC_Mat_Col1',color:[1,1,1,1]},source={draws:[{node:{index:1},material}]};
  fleet.models.set('sports',{asset:source,stages:Array.from({length:6},()=>({showNodes:[1],wheelFile:'wheel'})),wheels:new Map([['wheel',{}]]),info:{wheelPositions:[{translation:[1,0,0],rotation:[0,0,0,1]}]}});
  const player={...roomVehicleIdentity(0),isLocal:true},skin=fleet.body(player,0);
  assert.ok(skin.draws[0].material.roomPaint);assert.equal(material.roomPaint,undefined);
  let wheels=0;const renderer={asset(){},instances(){wheels++;}},entries=[{player,pose:{x:0,y:0,z:0}}];
  fleet.draw(renderer,entries,{upgrades:{car:0,sling:0,income:0}});assert.equal(wheels,0);
  fleet.draw(renderer,entries,{upgrades:{car:5,sling:0,income:0}});assert.equal(wheels,1);
});
const report={passed:true,cases};fs.writeFileSync('output/room-progression-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
