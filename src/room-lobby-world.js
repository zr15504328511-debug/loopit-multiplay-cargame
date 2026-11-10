import {clamp,smooth,model,mul,trs} from './math.js';
import {terrainBiome} from './color-space.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ANGLES=[0,-.48,.48,-.96,.96];
const NAMES=['Savannah','Ski Resort','West Coast','Formula','Rainbow'];
const RADIUS=38;
export function makePortals(maps) {
  return maps.map((m,i)=>({...m,title:NAMES[i]||m.title,yaw:ANGLES[i]||0,x:Math.sin(ANGLES[i]||0)*36,z:Math.cos(ANGLES[i]||0)*36}));
}
const relative=(p,gate)=>{const dx=p.x-gate.x,dz=p.z-gate.z,c=Math.cos(gate.yaw),s=Math.sin(gate.yaw);return {x:dx*c-dz*s,z:dx*s+dz*c};};
const world=(gate,x,z,y=0)=>[gate.x+x*Math.cos(gate.yaw)+z*Math.sin(gate.yaw),y,gate.z-x*Math.sin(gate.yaw)+z*Math.cos(gate.yaw)];
const bay=i=>({x:(i%2?-1:1)*(17+Math.floor(i/10)*7),z:-22+Math.floor((i%10)/2)*7});

// The open hub selects a source map through physical entry volumes. Flight
// remains on the original map, with its existing rigid-body simulation.
export class RoomLobbyWorld {
  constructor(room) {
    this.room=room;this.portals=makePortals(room.maps);this.ai=new Map();this.time=0;this.gateCooldown=0;
    this.previews=[];this.scenery=[];this.labels=[];this.nameNodes=new Map();this.cameraYaw=0;this.orbitOffset=0;this.zoom=24;this.resetLocal();
  }
  resetLocal() {
    this.local={id:'you',x:0,y:.375,z:-8,yaw:0,speed:0,steer:0,spin:0};
    this.nearSling=false;this.nearPortal=null;this.entered=false;this.orbitOffset=0;this.cameraYaw=0;
    this.eye=[0,23,-37];this.target=[0,-2,14];
  }
  resetMap() {this.ai.clear();this.time=0;this.resetLocal();}
  orbit(dx,dy=0) {this.orbitOffset=wrap(this.orbitOffset-dx*.008);this.zoom=clamp(this.zoom+dy*.05,20,43);}
  async build(renderer,loadAsset,manifest,art,stage) {
    this.art=art;
    this.previews=await Promise.all(this.portals.map(async portal=>{
      const base=`/assets/room/previews/${portal.id}`;
      const [meta,p,c,nc,uv,sp,i]=await Promise.all([fetch(base+'.json').then(r=>r.json()),...['positions','colors','nativeColors','uv','spreads','indices'].map(k=>fetch(`${base}-${k}.bin`).then(r=>r.arrayBuffer()))]);
      const scenery=await Promise.all(meta.instances.map(async inst=>({asset:await loadAsset(inst.file),matrix:mul(model([portal.x,0,portal.z],portal.yaw),trs(inst.position,inst.rotation,inst.scale))})));
      const groups=new Map();for(const prop of scenery){if(!groups.has(prop.asset))groups.set(prop.asset,[]);groups.get(prop.asset).push(prop.matrix);}
      const positions=new Float32Array(p),colors=new Float32Array(c),nativeColors=new Float32Array(nc),tex=new Float32Array(uv),spread=new Float32Array(sp),indices=new Uint32Array(i);
      const chunks=await Promise.all(meta.groups.map(async g=>{
        const start=g.vertexOffset,end=start+g.vertexCount,exact=g.material,useNative=exact&&renderer.nativeSurfaces.supports(exact.shader);
        const material=useNative?{shader:exact.shader,color:exact.colors?._Color||[1,1,1,1],nativeEvidence:exact.file+':'+exact.pathId,nativeProperties:exact}:{color:[1,1,1,1]};
        if(useNative&&g.grid){const grid={...g.grid,detail:new Float32Array(await fetch('/'+g.grid.detail).then(r=>r.arrayBuffer()))};material.textures={_SDFTex:renderer.nativeSurfaces.detailTexture(grid)};material.uniforms={_SDFCenterXZ:[-(grid.origin[0]+(grid.nx-1)*grid.step[0]/2),grid.origin[1]+(grid.nz-1)*grid.step[1]/2],_SDFSizeXZ:[grid.nx*grid.step[0],grid.nz*grid.step[1]]};}
        return {gpu:renderer.mesh(positions.slice(start*3,end*3),null,tex.slice(start*4,end*4),indices.slice(g.indexOffset,g.indexOffset+g.indexCount).map(n=>n-start),(useNative?nativeColors:colors).slice(start*4,end*4),{uvSize:4,uv1:spread.slice(start*2,end*2)}),material};
      }));
      return {portal,start:meta.start,chunks,scenery:[...groups].map(([asset,roots])=>({asset,roots})),environment:meta.environment};
    }));
    this.buildGround(renderer);
    this.signRoot=document.createElement('div');this.signRoot.className='room-portal-labels';stage.append(this.signRoot);
    this.namesRoot=document.createElement('div');this.namesRoot.className='room-car-names';stage.append(this.namesRoot);
    this.labels=this.portals.map(p=>{
      const label=document.createElement('div');label.className='room-portal-label';label.dataset.portal=p.id;
      const lock=document.createElement('img');lock.src='/assets/native-ui/LockIcon-191.png';lock.alt='Locked';
      const title=document.createElement('span');title.textContent=p.title;label.append(lock,title);this.signRoot.append(label);return {portal:p,label,lock};
    });
    for(let i=0;i<10;i++) {
      this.scenery.push({type:i%4===0?'rock':'acacia',x:(i%2?-1:1)*(32+i%3),y:0,z:-15+Math.floor(i/2)*7,yaw:i*1.7,scale:i%4===0?1.3:.8});
    }
    for(const [i,gate] of this.portals.entries())for(const side of [-1,1]) {
      const p=world(gate,side*6.8,-6);
      this.scenery.push({type:i===1?'pine':i===2?'palm':'acacia',x:p[0],y:0,z:p[2],yaw:i+side,scale:i===1?1.5:.65});
    }
  }
  buildGround(renderer) {
    const source=this.previews[0],biome=terrainBiome(source.environment.lighting.globals,0),positions=[],normals=[],colors=[],sides=[],spread=[],indices=[],detail=[];
    for(let z=-40;z<=40;z++)for(let x=-40;x<=40;x++) {
      positions.push(x,-.08,z);normals.push(0,1,0);colors.push(...biome.top);sides.push(...biome.side);spread.push(biome.spread,0);
      let distance=Math.hypot(x,z+5)-7;
      for(const gate of this.portals){const t=clamp((x*gate.x+z*gate.z)/(36*36),0,1);distance=Math.min(distance,Math.hypot(x-t*gate.x,z-t*gate.z)-2.6);}
      detail.push(0,0,0,clamp((1.4-distance)/2,0,1));
      if(x<40&&z<40&&Math.hypot(x+.5,z+.5)<39.8){const i=(z+40)*81+x+40;indices.push(i,i+81,i+1,i+1,i+81,i+82);}
    }
    const material={...source.chunks[0].material,textures:{_SDFTex:renderer.nativeSurfaces.detailTexture({nx:81,nz:81,detail:new Float32Array(detail)})},uniforms:{_SDFCenterXZ:[0,0],_SDFSizeXZ:[81,81]}};
    this.ground={gpu:renderer.mesh(positions,normals,sides,indices,colors,{uvSize:4,uv1:new Float32Array(spread)}),material,environment:source.environment};
  }
  setVisible(visible) {if(this.signRoot)this.signRoot.hidden=!visible;if(this.namesRoot)this.namesRoot.hidden=!visible;}
  updateNames(renderer,fleet) {
    const liveIds=new Set(this.room.players.map(p=>p.id));
    for(const [id,node] of this.nameNodes){node.hidden=true;if(!liveIds.has(id)){node.remove();this.nameNodes.delete(id);}}
    const occupied=[];
    const candidates=fleet.map(p=>({pose:p,player:this.room.players.find(x=>x.id===p.id),q:renderer.project([p.x,p.y+2,p.z])})).filter(p=>p.player&&p.q[2]>5&&p.q[0]>6&&p.q[0]<394&&p.q[1]>65&&p.q[1]<453).sort((a,b)=>Number(b.player.isLocal)-Number(a.player.isLocal)||a.q[2]-b.q[2]);
    for(const {player,q} of candidates) {
      const width=clamp(Array.from(player.name).length*6.6+16,35,110),x=clamp(q[0],width/2+6,394-width/2);let y=Math.min(428,q[1]-8);
      for(let i=0;i<7&&occupied.some(p=>Math.abs(p.x-x)<(p.width+width)/2+3&&Math.abs(p.y-y)<17);i++)y-=18;
      if(y<65)continue;occupied.push({x,y,width});
      let node=this.nameNodes.get(player.id);
      if(!node){node=document.createElement('div');node.className='room-car-name';node.dataset.player=player.id;this.namesRoot.append(node);this.nameNodes.set(player.id,node);}
      node.hidden=false;node.classList.toggle('is-local',player.isLocal);node.textContent=player.name;node.title=player.name;node.style.setProperty('--player-color',player.color);
      node.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;
    }
  }
  update(dt,input={},driving=true) {
    this.time+=dt;this.gateCooldown=Math.max(0,this.gateCooldown-dt);
    const car=this.local;let entered=null;
    if(driving) {
      const throttle=clamp(input.throttle||0,-1,1),steer=clamp(input.steer||0,-1,1);
      car.steer=smooth(car.steer,steer,12,dt);car.speed=clamp(car.speed+throttle*16*dt,-7,13);
      if(!throttle)car.speed*=Math.exp(-3.4*dt);
      car.yaw=wrap(car.yaw-car.steer*car.speed*.14*dt);
      car.x+=Math.sin(car.yaw)*car.speed*dt;car.z+=Math.cos(car.yaw)*car.speed*dt;car.spin+=car.speed*dt/.425;
      this.nearPortal=null;
      for(const gate of this.portals) {
        let q=relative(car,gate);const unlocked=this.room.isUnlocked(gate.id);
        if(Math.abs(q.x)<5&&q.z>-9&&q.z<3)this.nearPortal=gate;
        if(!unlocked&&Math.abs(q.x)<5.1&&q.z>-4.5) {
          const pos=world(gate,q.x,-4.5);car.x=pos[0];car.z=pos[2];car.speed=Math.min(0,car.speed)*.2;q=relative(car,gate);
        }
        for(const side of [-1,1]) {
          const post=world(gate,side*3.3,0),dx=car.x-post[0],dz=car.z-post[2],d=Math.hypot(dx,dz),r=1.5;
          if(d<r){car.x=post[0]+(d?dx/d:side)*r;car.z=post[2]+(d?dz/d:0)*r;car.speed*=.25;}
        }
        if(unlocked&&!this.entered&&Math.abs(q.x)<1.85&&q.z>-2.4&&q.z<3&&Math.cos(car.yaw-gate.yaw)>.45)entered=gate.id;
      }
      const radius=Math.hypot(car.x,car.z);
      if(radius>RADIUS){car.x*=RADIUS/radius;car.z*=RADIUS/radius;car.speed*=.2;}
      for(const prop of this.scenery) {
        const dx=car.x-prop.x,dz=car.z-prop.z,d=Math.hypot(dx,dz),r=prop.type==='rock'?1.8:1.3;
        if(d<r){car.x=prop.x+(d?dx/d:1)*r;car.z=prop.z+(d?dz/d:0)*r;car.speed*=.3;}
      }
      this.nearSling=!!this.nearPortal&&this.room.isUnlocked(this.nearPortal.id);
    }
    const ids=new Set(this.room.players.map(p=>p.id));
    for(const id of this.ai.keys())if(!ids.has(id))this.ai.delete(id);
    const gate=this.portals.find(p=>p.id===this.room.mapId)||this.portals[0];
    for(let i=1;i<this.room.players.length;i++) {
      const player=this.room.players[i];let body=this.ai.get(player.id);
      if(!body){body={...bay(i-1),id:player.id,y:.375,yaw:0,speed:0,spin:0,phase:'parked',wait:2+(i-1)*3,leg:0};this.ai.set(player.id,body);}
      if(body.phase==='launched') {
        body.launchTime+=dt;if(player.run)continue;
        Object.assign(body,bay(i-1),{y:.375,yaw:0,phase:'parked',wait:4+i*.7,leg:0,speed:0});
      }
      if(body.phase==='parked'){body.wait-=dt;if(body.wait>0||player.run)continue;body.phase='driving';}
      if(body.phase==='driving') {
        const merge=world(gate,(i%2?1:-1)*2,-16),end=world(gate,0,-1);
        const target=body.leg===0?merge:end,dx=target[0]-body.x,dz=target[2]-body.z,d=Math.hypot(dx,dz);
        const blocked=[...this.ai.values(),...(driving?[car]:[])].some(o=>o!==body&&o.phase!=='launched'&&Math.hypot(o.x-body.x,o.z-body.z)<3.5&&(o.x-body.x)*dx+(o.z-body.z)*dz>0);
        body.speed=smooth(body.speed,blocked?0:6,5,dt);
        if(d<Math.max(.3,body.speed*dt)) {
          body.x=target[0];body.z=target[2];body.leg++;
          if(body.leg===2){if(this.gateCooldown>0){body.leg=1;continue;}this.room.queueBot(player,0);body.phase='launched';body.launchTime=0;body.gate=gate;this.gateCooldown=1;}
        } else {body.yaw+=wrap(Math.atan2(dx,dz)-body.yaw)*Math.min(1,dt*7);body.x+=dx/d*body.speed*dt;body.z+=dz/d*body.speed*dt;body.spin+=body.speed*dt/.425;}
      }
    }
    return driving?entered:null;
  }
  fleet() {
    return [this.local,...[...this.ai.values()].filter(p=>p.phase!=='launched'||p.launchTime<1.3).map(p=>{
      if(p.phase!=='launched')return p;const pos=world(p.gate,0,p.launchTime*22,.375+7*p.launchTime-2*p.launchTime*p.launchTime);
      return {...p,x:pos[0],y:pos[1],z:pos[2],yaw:p.gate.yaw};
    })];
  }
  draw(renderer,vehicles,dt) {
    const car=this.local,desiredYaw=car.yaw+this.orbitOffset;
    this.cameraYaw+=wrap(desiredYaw-this.cameraYaw)*Math.min(1,dt*2.6);
    const sn=Math.sin(this.cameraYaw),cs=Math.cos(this.cameraYaw);
    const distance=Math.min(...this.portals.map(p=>Math.hypot(p.x-car.x,p.z-car.z))),rise=clamp((24-distance)/16,0,1)*8;
    const desiredEye=[car.x-sn*this.zoom,this.zoom*.8+4+rise,car.z-cs*this.zoom],desiredTarget=[car.x+sn*18,0,car.z+cs*18];
    for(let i=0;i<3;i++){this.eye[i]=smooth(this.eye[i],desiredEye[i],5,dt);this.target[i]=smooth(this.target[i],desiredTarget[i],5,dt);}
    const lighting=renderer.lighting,environment=renderer.environment;
    if(!this.lighting){const source=renderer.nativeLighting?.levels.savannah||lighting;this.lighting={...source,skybox:{...source.skybox,fogStart:105,fogRange:230}};}
    renderer.lighting=this.lighting;renderer.environment=null;renderer.time=this.time;
    renderer.begin(this.eye,this.target,{sky:[.68,.85,.88],fogFar:250,fov:65});
    const sand=[.70,.58,.34,1];
    renderer.draw(renderer.disk,model([0,-58,65],0,0,0,[245,1,245]),{color:[.28,.43,.12,1]});
    renderer.environment=this.ground?.environment;
    if(this.ground)renderer.draw(this.ground.gpu,model([0,0,0]),this.ground.material);
    for(const {portal,start,chunks,scenery,environment} of this.previews) {
      const a=renderer.project(world(portal,0,0)),b=renderer.project(world(portal,0,60,-20));
      if(a[2]<0&&b[2]<0||a[0]<-100&&b[0]<-100||a[0]>500&&b[0]>500)continue;
      // Render in the original map coordinates through a transformed view.
      // Native terrain detail masks and world-space textures retain their UVs.
      const view=renderer.vp,eye=renderer.eye,root=mul(model([portal.x,0,portal.z],portal.yaw),model(start.map(x=>-x)));
      renderer.vp=mul(view,root);
      const q=relative({x:eye[0],z:eye[2]},portal);renderer.eye=[q.x+start[0],eye[1]+start[1],q.z+start[2]];
      const syncView=()=>{const gl=renderer.gl;gl.useProgram(renderer.program);gl.uniformMatrix4fv(renderer.u.vp,false,renderer.vp);gl.uniform3fv(renderer.u.eye,renderer.eye);};syncView();
      renderer.environment=environment;
      for(const chunk of chunks)renderer.draw(chunk.gpu,model(start),chunk.material);
      renderer.vp=view;renderer.eye=eye;syncView();
      for(const prop of scenery)renderer.instances(prop.asset,prop.roots);
    }
    renderer.environment=null;
    for(const gate of this.portals) {
      const unlocked=this.room.isUnlocked(gate.id);
      // A thin flat approach connects the open plaza to each real slingshot.
      renderer.box(world(gate,0,0,-.03),[6.8,.08,4],sand,gate.yaw);
      for(const side of [-1,1])renderer.line(world(gate,side*4.2,-15,.08),world(gate,side*4.2,-4,.08),.13,[.9,.87,.69,1]);
      if(this.art)this.art.drawSling(renderer,{x:gate.x,y:0,z:gate.z,yaw:gate.yaw,locked:!unlocked,time:this.time});
      if(!unlocked) {
        renderer.line(world(gate,-4.4,-3,1.25),world(gate,4.4,-3,1.25),.35,[.88,.85,.68,1]);
        for(let i=-3;i<=3;i++)renderer.box(world(gate,i,-3,1.25),[.5,.4,.4],[.85,.18,.08,1],gate.yaw);
      }
    }
    for(let i=0;i<84;i++) {
      const a=i*Math.PI*2/84;if(this.portals.some(g=>Math.abs(wrap(a-g.yaw))<.16))continue;
      renderer.box([Math.sin(a)*39,.13,Math.cos(a)*39],[2.9,.4,.4],[.79,.75,.51,1],a);
    }
    this.art?.drawScenery(renderer,this.scenery);
    const fleet=this.fleet().filter(p=>{const q=renderer.project([p.x,p.y,p.z]);return q[2]>5&&q[0]>-30&&q[0]<430&&q[1]>-30&&q[1]<620;});
    for(const p of fleet)if(p.y<1)renderer.draw(renderer.disk,model([p.x,.06,p.z],p.yaw,0,0,[1.35,1,2.4]),{color:[.23,.27,.11,1]},1);
    vehicles.draw(renderer,fleet.map(p=>({player:this.room.players.find(x=>x.id===p.id),pose:p,spin:p.spin})),this.room);
    this.updateNames(renderer,fleet);
    for(const {portal,label,lock} of this.labels) {
      const pos=renderer.project(world(portal,0,6,6)),distance=Math.hypot(car.x-portal.x,car.z-portal.z);
      label.hidden=pos[2]<=0||pos[0]<-20||pos[0]>420||pos[1]<20||pos[1]>475||distance>65;
      label.style.transform=`translate(${pos[0]}px,${pos[1]}px) translate(-50%,-100%)`;
      lock.hidden=this.room.isUnlocked(portal.id);label.classList.toggle('locked',!lock.hidden);
    }
    renderer.linearFrame.present();renderer.lighting=lighting;renderer.environment=environment;
  }
}
