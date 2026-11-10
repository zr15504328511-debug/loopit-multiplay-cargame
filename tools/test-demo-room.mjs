import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DemoRoom,ROOM_CAPACITY,ROOM_SAVE_KEY} from '../src/demo-room.js';
import {ROOM_ITEMS} from '../src/room-items.js';
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const maps=[{id:'a',title:'A',length:500},{id:'b',title:'B',length:300}];
const track={startZ:10,endZ:510};
const room=new DemoRoom(maps,storage);
assert.equal(room.count,8);room.setCount(200);assert.equal(room.players.length,ROOM_CAPACITY);
assert.equal(new Set(room.players.map(p=>p.id)).size,20);
room.setCount(-1);assert.equal(room.players.length,1);room.setCount(20);
room.setName('Pilot');room.setItem('glider');
room.enterMap('a',track,{runs:[{duration:1,frames:[[0,0,2,10,0,0,0,0,''],[1,2,2,110,0,0,0,100,'']]}]});
room.beginLocal();
const sim={x:2,y:3,z:110,distance:100,elapsed:3};room.observeLocal(sim);
sim.x=3;sim.z=110.0002;sim.distance=100.0002;room.observeLocal(sim);
assert.equal(room.local.best,sim.distance,'Sub-millimeter final advance retains exact record');
sim.x=15;sim.y=-40;sim.z=95;room.finishLocal(sim,false);
assert.deepEqual(room.local.flag,[3,3,110.0002],'Crash position cannot move the record flag backwards');
assert.equal(room.lastRun.newRecord,true);
room.beginLocal();room.finishLocal({x:0,y:2,z:30,distance:20,elapsed:2},false);
assert.equal(room.lastRun.newRecord,false);assert.equal(room.local.best,100.0002);
assert.equal(room.players[1].participating,false,'Parked players are not race participants');
room.queueBot(room.players[1],0);
for(let i=0;i<100;i++)room.update(.05);
assert.equal(room.players[1].best,100,'AI commits the final replay sample');
assert.equal(room.players[1].participating,true);
assert.equal(room.completed.length,0,'AI and failed flights do not unlock maps');
room.persist();
const reload=new DemoRoom(maps,storage);
assert.equal(reload.name,'Pilot');assert.equal(reload.selectedItem,'glider');assert.equal(reload.count,20);
assert.deepEqual(reload.local.flag,room.local.flag);
assert.throws(()=>room.enterMap('b',{startZ:0,endZ:300},{runs:[]}),/previous/);
room.beginLocal();room.finishLocal({x:0,y:2,z:510,distance:500,elapsed:20,status:'success'},true);
assert.deepEqual(room.completed,['a']);assert.equal(room.isUnlocked('b'),true);
room.enterMap('b',{startZ:0,endZ:300},{runs:[]});assert.equal(room.local.best,0);
room.beginLocal();room.finishLocal({x:7,y:3,z:50,distance:50,elapsed:2},false);
room.enterMap('a',track,{runs:[]});assert.equal(room.local.best,500);
assert.equal(room.records.b.you.best,50);
assert.deepEqual(new DemoRoom(maps,storage).completed,['a']);
const unavailable=new DemoRoom(maps,{getItem(){throw Error('blocked')},setItem(){throw Error('full')}});
unavailable.setName('Offline');assert.equal(unavailable.storageOK,false);assert.equal(unavailable.name,'Offline');
memory.set(ROOM_SAVE_KEY,'{broken');assert.equal(new DemoRoom(maps,storage).count,8);
const manifest=JSON.parse(fs.readFileSync('public/assets/manifest.json','utf8'));
for(const map of manifest.levels) {
  const replay=JSON.parse(fs.readFileSync(`public/assets/room/replays/${map.id}.json`,'utf8'));
  assert.equal(replay.runs.length,8);assert.equal(replay.upgrades.car,25);
  assert.deepEqual(replay.items,ROOM_ITEMS,'AI replay item rules match the player');
  for(const run of replay.runs) {
    assert.ok(['pepper','glider'].includes(run.item));
    assert.ok(run.duration>0&&run.duration<=120.01);
    let time=-1,peak=0;
    for(const frame of run.frames) {
      assert.equal(frame.length,9);assert.ok(frame.slice(0,8).every(Number.isFinite));
      assert.ok(frame[0]>=time);time=frame[0];peak=Math.max(peak,frame[7]);
    }
    assert.ok(Math.abs(peak-run.distance)<.002);
  }
}
const result={passed:true,cases:['Capacity is capped at 20 with stable unique players','Best distance and flag use the furthest pose, including a later crash','Shorter flights cannot lower a personal best','Only launched players participate; AI commits final samples','Maps unlock sequentially only after a real local success, never AI/failure','Map records and completion are isolated and survive reload','Corrupt/blocked storage does not break the demo','All 40 production-physics AI paths contain finite monotonic samples']};
fs.writeFileSync('output/demo-room-tests.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
