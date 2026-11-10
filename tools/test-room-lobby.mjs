import assert from 'node:assert/strict';
import {DemoRoom} from '../src/demo-room.js';
import {RoomLobbyWorld} from '../src/room-lobby-world.js';
import {railPlayers} from '../src/room-ui.js';
const maps=['savannah','ski-resort','west-coast','formula','rainbow-road'].map(id=>({id,title:id,length:500}));
const room=new DemoRoom(maps);room.setCount(1);room.enterMap(maps[0].id,{startZ:0,endZ:500},{runs:[]});
const lobby=new RoomLobbyWorld(room);
assert.equal(lobby.portals.length,5);assert.equal(new Set(lobby.portals.map(p=>`${p.x}:${p.z}`)).size,5);
function driveTo(gate,seconds=10) {
  lobby.resetLocal();let entered=null;
  for(let i=0;i<seconds*60;i++) {
    const c=lobby.local,desired=Math.atan2(gate.x-c.x,gate.z-c.z),error=Math.atan2(Math.sin(desired-c.yaw),Math.cos(desired-c.yaw));
    entered=lobby.update(1/60,{throttle:1,steer:Math.max(-1,Math.min(1,-error*3))});if(entered)break;
  }
  return entered;
}
assert.equal(driveTo(lobby.portals[0]),maps[0].id);
for(const p of lobby.portals.slice(1)) {
  assert.equal(driveTo(p),null,'Locked physical gate cannot load a map');
  assert.ok(Math.hypot(lobby.local.x-p.x,lobby.local.z-p.z)>4,'Locked gate stops the car');
}
for(let i=1;i<5;i++) {
  room.completed=maps.slice(0,i).map(p=>p.id);
  assert.equal(driveTo(lobby.portals[i]),maps[i].id,'Every unlocked physical gate is driveable');
}
lobby.resetLocal();for(let i=0;i<900;i++)lobby.update(1/60,{throttle:-1});assert.ok(Math.hypot(lobby.local.x,lobby.local.z)<=38.001);
const zoom=lobby.zoom;lobby.orbit(60,100);assert.notEqual(lobby.orbitOffset,0);assert.ok(lobby.zoom>zoom);
lobby.scenery=[{type:'acacia',x:0,z:12}];lobby.resetLocal();
for(let i=0;i<600;i++)lobby.update(1/60,{throttle:1});
assert.ok(lobby.local.z<=10.701,'The new lobby trees have trunk collisions');lobby.scenery=[];
room.setCount(20);room.replays=[{duration:10,frames:[[0,0,1,0,0,0,0,0,''],[10,0,1,100,0,0,0,100,'']]}];
lobby.resetMap();assert.equal(room.players.filter(p=>p.participating).length,0);
for(let i=0;i<2700;i++){room.update(1/60);lobby.update(1/60,{},false);}
assert.ok(room.players.slice(1).some(p=>p.participating));assert.equal(lobby.ai.size,19);
const players=room.players.map((p,i)=>({...p,participating:i!==19,status:i===18?'ready':'flying',distance:i*20,best:i*30}));
const rail=railPlayers({players,localId:'you'});
assert.equal(rail.portraits.length,3);assert.ok(rail.portraits.some(p=>p.id==='you'));
assert.equal(rail.portraits.length+rail.ticks.length,18);
assert.ok([...rail.portraits,...rail.ticks].every(p=>p.participating&&(p.id==='you'||p.status==='flying')));
console.log(JSON.stringify({passed:true,cases:['Five distinct source-map portals','Locked gates physically stop the car','Driving selects every sequentially unlocked gate','Open hub driving bounds and camera orbit','AI drive through active map portal','At most three portraits; unlaunched and finished AI omitted']}));
