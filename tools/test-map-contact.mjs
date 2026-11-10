import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NativeTerrain} from '../src/native-terrain.js';
import {SurfaceIndex} from '../src/surfaces.js';
import {MeshContact} from '../src/mesh-contact.js';
import {advanceContact,contactFootprint} from '../src/ground-contact.js';
const cases=[];
const test=(name,fn)=>{fn();cases.push(name)};
const grid={origin:[0,0],step:[1,1],nx:2,nz:2,heights:new Float32Array([0,0,0,12]),detail:new Float32Array(16)};
test('Non-planar grid height and normal match the rendered triangles, including the diagonal',()=>{
  const t=new NativeTerrain({grids:[grid]});
  const render=new SurfaceIndex([[0,0,0,0,0,1,1,0,0],[1,0,0,0,0,1,1,12,1]]);
  for(let x=.025;x<1;x+=.05)for(let z=.025;z<1;z+=.05) {
    const actual=t.sample(x,z),expected=render.sample(x,z);
    assert(Math.abs(actual.height-expected.height)<1e-10);
    if(Math.abs(x+z-1)>1e-8)assert(actual.normal.every((v,i)=>Math.abs(v-expected.normal[i])<1e-10));
  }
});
test('Hidden track rasters cannot bridge a real gap or fill empty space',()=>{
  const t=new NativeTerrain({grids:[{...grid,hidden:true}]});
  assert.equal(t.sample(.5,.5),null);
});
test('A lower road stays accessible below an overlapping upper deck',()=>{
  const t=new NativeTerrain({grids:[{...grid,heights:new Float32Array(4).fill(-5)},
    {...grid,heights:new Float32Array(4).fill(10)}]});
  assert.equal(t.sample(.5,.5).height,10);
  assert.equal(t.sample(.5,.5,0).height,-5);
  const s=new SurfaceIndex([[0,-5,0,0,-5,1,1,-5,0],[0,10,0,0,10,1,1,10,0]]);
  assert.equal(s.sample(.2,.2,-Infinity,0).height,-5);
});
test('A tilted landing clears both axles and the belly, while a cliff still produces free fall',()=>{
  const track={ground:()=>({height:0,normal:[0,1,0]})};
  const b={x:0,y:2,z:0,vx:0,vy:-20,vz:0,pitch:.4,roll:.2,yaw:.2,onGround:false};
  advanceContact(b,track,.375,.15);
  assert(b.onGround);
  assert(contactFootprint(b).every(p=>b.y+p[1]>=-1e-9));
  const cliff={ground:(x,z)=>({height:z<1?0:-30,normal:[0,1,0]})};
  Object.assign(b,{x:0,y:.375,z:0,vx:0,vy:0,vz:50,pitch:0,roll:0,yaw:0,onGround:true});
  advanceContact(b,cliff,.375,.1);assert(!b.onGround);assert.equal(b.y,.375);
});
const wall={name:'solid rail',material:'wood',positions:new Float32Array([0,-3,-10,0,3,-10,0,3,10,0,-3,10]),indices:new Uint32Array([0,1,2,0,2,3])};
test('A swept chassis cannot pass through a narrow rail; tangential travel survives',()=>{
  const contact=new MeshContact([wall]);
  const b={x:-2,y:.4,z:0,vx:40,vy:0,vz:5,speed:40,onGround:false};
  advanceContact(b,{native:{meshContact:contact},ground:()=>null},.375,.1);
  assert(b.x<-.89);assert(b.vx<1e-8);assert(Math.abs(b.vz-5)<1e-8);
});
test('Decorative glow and cutout planes never become solid walls',()=>{
  assert.equal(new MeshContact([{...wall,material:'rainbow road glow'}]).count,0);
  assert.equal(new MeshContact([{...wall,material:'road edges cutout'}]).count,0);
});
test('A steep terrain bank blocks entry from the lower water/ground layer',()=>{
  const bank={origin:[0,-10],step:[1,20],nx:2,nz:2,
    heights:new Float32Array([0,5,0,5]),detail:new Float32Array(16)};
  const contact=new MeshContact([],[bank]);assert(contact.count>0);
  const b={x:-1.1,y:.4,z:0,vx:15,vy:0,vz:0,speed:15,onGround:false};
  advanceContact(b,{native:{meshContact:contact},ground:()=>null},.375,.15);
  assert(b.x<0);assert(b.vx<1e-8);
});
test('Ceilings stop an upward chassis without snapping it onto the upper deck',()=>{
  const roof={name:'bridge underside',positions:new Float32Array([-10,2,-10,10,2,-10,10,2,10,-10,2,10]),indices:new Uint32Array([0,1,2,0,2,3])};
  const b={x:0,y:0,z:0,vx:0,vy:20,vz:0,speed:0,onGround:false};
  advanceContact(b,{native:{meshContact:new MeshContact([roof])},ground:()=>null},.375,.1);
  assert(b.y<1);assert(b.vy<=0);
});
test('Climbing a scenery collider cannot create kinetic energy',()=>{
  const track={ground:(x,z)=>({height:z*.5,normal:[0,1/Math.sqrt(1.25),-.5/Math.sqrt(1.25)],source:'native-scene-collider'})};
  const b={x:0,y:1.2,z:0,vx:0,vy:0,vz:30,speed:30,onGround:true};
  advanceContact(b,track,.375,.1);
  assert(b.onGround);assert(b.vx*b.vx+b.vy*b.vy+b.vz*b.vz<=900+1e-8);
});
fs.writeFileSync('output/map-contact-tests.json',JSON.stringify({passed:true,cases},null,2));
console.log(JSON.stringify({passed:true,cases},null,2));
