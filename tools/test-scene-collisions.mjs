import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Track} from '../src/track.js';
import {MeshContact} from '../src/mesh-contact.js';
import {advanceContact} from '../src/ground-contact.js';
import {primitiveMesh,colliderMatrix,transformCollisionMesh} from '../src/scene-collisions.js';
import {loadTestLevel} from './load-native-test-level.mjs';

const levels=JSON.parse(fs.readFileSync('public/assets/manifest.json')),rows=[];
function impactMesh(mesh,effect=null) {
  const contact=new MeshContact([{...mesh,scenery:true}]);
  const faces=[...new Set([...contact.cells.values()].flat())].filter(t=>t.n[2]<-.5&&Math.abs(t.n[1])<.4);
  assert(faces.length,mesh.name+' has a testable front face');
  const t=faces[Math.floor(faces.length/2)],q=[0,1,2].map(i=>(t.a[i]+t.b[i]+t.c[i])/3),n=t.n;
  const b={x:q[0]+n[0]*3,y:q[1]+n[1]*3-.35,z:q[2]+n[2]*3,
    vx:-n[0]*40,vy:-n[1]*40,vz:-n[2]*40,pitch:0,roll:0,yaw:0,onGround:false,speed:40,effect};
  const result=advanceContact(b,{ground:()=>null,native:{meshContact:contact}},.375,.15);
  return {b,result,travel:(b.x-q[0])*n[0]+(b.y+.35-q[1])*n[1]+(b.z-q[2])*n[2]};
}
for(const l of levels.levels) {
  await loadTestLevel(l);const native=l.nativeTerrain,track=new Track(l);
  const solid=native.instances.filter(i=>i.collisionState);
  assert(native.instances.filter(i=>i.generateColliders!==false).every(i=>i.collisionState));
  assert(solid.every(i=>i.collisionState),'Every source-enabled scatter instance is connected');
  assert(native.instances.filter(i=>!i.collisionState).every(i=>i.generateColliders===false));
  const patterns=l.id==='savannah'?[/Electricity_Pole/,/Rock_Square_l_10/]:
    l.id==='ski-resort'?[/log cabin small$/, /ice_009$/, /piste pole/, /Pine_Tree_s_08/]:
    l.id==='formula'?[/viaduct\/Cube$/, /business_center_003$/, /lamppost_001/]:
    l.id==='rainbow-road'?[/gold ring 2$/]:[/background hills\/Sphere$/];
  let tested=0;
  for(const pattern of patterns) {
    const mesh=native.collisionMeshes.find(m=>pattern.test(m.name));assert(mesh,pattern.toString());
    const first=impactMesh(mesh),second=impactMesh(mesh);
    assert(first.result.wallImpact>1 && second.result.wallImpact>1,mesh.name+' must block repeated impacts');
    assert(!mesh.owner.hit,'Ordinary impact must not disable a visible object');
    if(mesh.owner.applePassThrough) {
      impactMesh(mesh,'apple');assert(mesh.owner.hit,'Allowed apple pass-through must remove the visual object too');
      track.reset();assert(!mesh.owner.hit,'Retry restores scenery and collision together');
    } else {
      assert(impactMesh(mesh,'apple').result.wallImpact>1,'Apple must not remove solid non-pass-through scenery');
    }
    tested++;
  }
  for(const d of native.dynamicColliders) {
    const a=colliderMatrix(d.owner,0),b=colliderMatrix(d.owner,1);
    assert(a.some((v,i)=>Math.abs(v-b[i])>.01),'Native rotation advances');
    const ma=transformCollisionMesh(d.shape,a,d.owner),mb=transformCollisionMesh(d.shape,b,d.owner);
    assert(ma.positions.some((v,i)=>Math.abs(v-mb.positions[i])>.01),'Collider follows rotating render transform');
  }
  rows.push({id:l.id,solidScatter:solid.length,staticMeshParts:native.collisionMeshes.length,dynamicShapes:native.dynamicColliders.length,representativeImpacts:tested});
}
// High sections of a thin pole must collide too, not just a 2.5 m band at its base.
const pole=primitiveMesh({shape:'Box',center:[0,8,0],size:[.2,16,.2]});
assert(impactMesh({...pole,name:'tall pole',owner:{hit:false}}).result.wallImpact>1);
fs.writeFileSync('output/scene-collision-tests.json',JSON.stringify({passed:true,rows},null,2));
console.log(JSON.stringify({passed:true,rows},null,2));
