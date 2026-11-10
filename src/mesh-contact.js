import {contactOffset} from './ground-contact.js';
import {DYNAMICS} from './native-dynamics-config.js';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const add=(a,b,t)=>a.map((v,i)=>v+b[i]*t);
function closest(p,a,b,c) {
  const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);
  if(d1<=0&&d2<=0)return a;
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);
  if(d3>=0&&d4<=d3)return b;
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0)return add(a,ab,d1/(d1-d3));
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);
  if(d6>=0&&d5<=d6)return c;
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0)return add(a,ac,d2/(d2-d6));
  const va=d3*d6-d5*d4;
  if(va<=0&&d4-d3>=0&&d5-d6>=0)return add(b,sub(c,b),(d4-d3)/(d4-d3+d5-d6));
  const den=1/(va+vb+vc);
  return add(add(a,ab,vb*den),ac,vc*den);
}

// Finite triangle faces supplement the height query: rails, road barriers,
// tube sides and undersides cannot be represented by a highest-Y floor.
export class MeshContact {
  constructor(meshes=[],grids=[]) {
    this.cells=new Map();this.count=0;
    // Height-limited floor queries can see water below a steep bank. Index
    // the bank's actual visible faces as walls so the chassis cannot enter it.
    const bankPositions=[],bankIndices=[];
    for(const g of grids) {
      if(g.hidden||g.water)continue;
      const [sx,sz]=g.step,offset=g.visualHeightOffset||0;
      for(let iz=0;iz<g.nz-1;iz++)for(let ix=0;ix<g.nx-1;ix++) {
        const a=iz*g.nx+ix,h=[g.heights[a],g.heights[a+1],g.heights[a+g.nx],g.heights[a+g.nx+1]];
        if(!h.every(Number.isFinite))continue;
        const x=g.origin[0]+ix*sx,z=g.origin[1]+iz*sz;
        for(const [dx,dz,ids] of [[(h[1]-h[0])/sx,(h[2]-h[0])/sz,[0,2,1]],
          [(h[3]-h[2])/sx,(h[3]-h[1])/sz,[1,2,3]]]) {
          if(1/Math.hypot(dx,1,dz)>.35)continue;
          for(const id of ids) {
            bankIndices.push(bankPositions.length/3);
            bankPositions.push(x+(id%2)*sx,h[id]+offset,z+(id>=2?sz:0));
          }
        }
      }
    }
    if(bankIndices.length)meshes=[...meshes,{name:'native terrain banks',material:'terrain',
      positions:new Float32Array(bankPositions),indices:new Uint32Array(bankIndices)}];
    for(const m of meshes) {
      // Glow/cutout faces are decorative planes, not solid road end walls.
      // Preserve the existing lower-tube collision mask.
      if(/booster/i.test(m.name)||/glow|cutout/i.test(m.material||''))continue;
      const p=m.positions,ix=m.collisionIndices||m.indices;
      for(let k=0;k<ix.length;k+=3) {
        const [a,b,c]=[ix[k],ix[k+1],ix[k+2]].map(i=>Array.from(p.subarray(i*3,i*3+3)));
        const u=sub(b,a),v=sub(c,a),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
        const length=Math.hypot(...n);
        if(length<1e-8)continue;
        for(let i=0;i<3;i++)n[i]/=length;
        if(n[1]>.35 && !m.scenery)continue; // Road floors use the footprint; props also block the chassis.
        const min=[0,1,2].map(i=>Math.min(a[i],b[i],c[i])),max=[0,1,2].map(i=>Math.max(a[i],b[i],c[i]));
        const t={a,b,c,n,min,max,name:m.name,owner:m.owner};this.count++;
        for(let x=Math.floor(min[0]/8);x<=Math.floor(max[0]/8);x++)
          for(let z=Math.floor(min[2]/8);z<=Math.floor(max[2]/8);z++)
            for(let y=Math.floor(min[1]/4);y<=Math.floor(max[1]/4);y++) {
            const key=x+':'+y+':'+z;
            if(!this.cells.has(key))this.cells.set(key,[]);
            this.cells.get(key).push(t);
          }
      }
    }
  }
  resolve(body,previous) {
    let impact=0,hits=0;
    const horizontalSpeed=Math.hypot(body.vx,body.vz);
    const rideHeight=body.stats?.rideHeight??.375;
    const probes=[[-.55,.35,-1.1],[.55,.35,-1.1],[-.55,.35,1.1],[.55,.35,1.1],[0,.75,0]]
      .map(local=>({local,radius:.4}));
    // Static structures also block the wheels and lower frame. Scatter
    // rocks/vegetation retain the suspension-footprint + chassis response;
    // treating those wheel contacts as rigid spheres overconstrains the
    // released suspension approximation.
    if(!body.onGround && body.stats?.hasWheels!==false)for(const w of DYNAMICS.wheelPositions)
      probes.push({local:[w.translation[0],DYNAMICS.wheel.radius-rideHeight,w.translation[2]],radius:DYNAMICS.wheel.radius,structureOnly:true});
    if(!body.onGround)for(const z of [-.7,.73])probes.push({local:[0,.2-rideHeight,z],radius:.2,structureOnly:true});
    for(let pass=0;pass<2;pass++)for(const {local,radius,structureOnly} of probes) {
      const o=contactOffset(body,local),p=[body.x+o[0],body.y+o[1],body.z+o[2]];
      const prev=[previous.x+o[0],previous.y+o[1],previous.z+o[2]],seen=new Set();
      for(let x=Math.floor((p[0]-radius)/8);x<=Math.floor((p[0]+radius)/8);x++)
        for(let z=Math.floor((p[2]-radius)/8);z<=Math.floor((p[2]+radius)/8);z++)
          for(let y=Math.floor((p[1]-radius)/4);y<=Math.floor((p[1]+radius)/4);y++)
          for(const t of this.cells.get(x+':'+y+':'+z)||[]) {
            if(seen.has(t))continue;seen.add(t);
            if(structureOnly && (!t.owner || t.owner.instance))continue;
            if(t.owner?.hit)continue;
            if(p.some((v,i)=>v+radius<t.min[i]||v-radius>t.max[i]))continue;
            const q=closest(p,t.a,t.b,t.c),distance=Math.hypot(...sub(p,q));
            if(distance>=radius-1e-6)continue;
            if(body.effect==='apple' && t.owner?.applePassThrough) {
              t.owner.hit=true;
              if(typeof body.collisions==='number')body.collisions++;
              body.emit?.('crash',{x:q[0],y:q[1],z:q[2]});
              continue;
            }
            let n=t.n,side=dot(sub(prev,t.a),n);
            // A car standing above a deck must not collide with its underside
            // through the deck thickness. Ceilings are approached from below.
            if(n[1]<-.35&&side<0)continue;
            if(side<0)n=n.map(v=>-v);
            // A lateral rail must deflect the chassis, not kick it upwards.
            if(Math.abs(n[1])<.35) {
              const h=Math.hypot(n[0],n[2]);n=[n[0]/h,0,n[2]/h];
            }
            const inward=body.vx*n[0]+body.vy*n[1]+body.vz*n[2];
            if(inward>=0&&dot(sub(p,t.a),n)>=0&&!t.owner?.source?.rotation)continue;
            const push=radius-distance+1e-5;
            body.x+=n[0]*push;body.y+=n[1]*push;body.z+=n[2]*push;
            for(let i=0;i<3;i++)p[i]+=n[i]*push;
            if(inward<0) {
              this.lastHit={name:t.name,normal:n,point:q,center:p.slice(),inward};
              impact=Math.max(impact,-inward);
              body.vx-=inward*n[0];body.vy-=inward*n[1];body.vz-=inward*n[2];
            }
            hits++;
          }
    }
    if(hits) {
      // The released coasting model has separate vertical momentum. Do not
      // convert a ceiling impact into unbounded forward propulsion.
      body.vz=Math.max(0,body.vz);
      const speed=Math.hypot(body.vx,body.vz);
      body.speed=Math.min(horizontalSpeed,speed);
      if(speed>0){body.vx*=body.speed/speed;body.vz*=body.speed/speed;}
      body.steeringHeading=Math.atan2(body.vx,Math.max(1e-8,body.vz));
    }
    return impact;
  }
}
