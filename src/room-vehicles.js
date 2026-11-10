import {model,mul,trs} from './math.js';
import {linearColor} from './color-space.js';
import {vehicleStats} from './progression.js';
import {ROOM_CAR_IDS} from './room-progression.js';
const paintColor=hex=>linearColor([1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255));
const paintable=name=>/gold|AFRC|ARC_Col|ARC_Vinyl|ColorVar|ARSC_Color|mustang/i.test(name||'');

// Cosmetic views share original geometry/textures; cached source materials stay intact.
export class RoomVehicles {
  constructor(){this.models=new Map();this.views=new Map();}
  async load(renderer,loadAsset,manifest) {
    await Promise.all(ROOM_CAR_IDS.map(async id=>{
      const info=manifest.cars.find(c=>c.id===id),stages=renderer.nativeModels.cars[id].stages;
      const wheelFiles=[...new Set(stages.map(s=>s.wheelFile).filter(Boolean))];
      const [asset,...wheels]=await Promise.all([loadAsset(info.file),...wheelFiles.map(loadAsset)]);
      this.models.set(id,{asset,info,stages,wheels:new Map(wheelFiles.map((f,i)=>[f,wheels[i]]))});
    }));return this;
  }
  body(player,tier) {
    const key=`${player.carId}:${player.color}:${tier}`;
    if(!this.views.has(key)) {
      const entry=this.models.get(player.carId)||this.models.get('sports'),ids=new Set(entry.stages[tier].showNodes),paint=paintColor(player.color);
      const asset={draws:entry.asset.draws.filter(d=>ids.has(d.node.index)).map(d=>({...d,nativeRendererEnabled:true,material:paintable(d.material.name)?{...d.material,roomPaint:paint}:d.material}))};
      this.views.set(key,asset);
    }
    return this.views.get(key);
  }
  draw(renderer,entries,room) {
    const ownTier=vehicleStats(room.upgrades).sourceTier;
    for(const {player,pose,spin=0} of entries) {
      const entry=this.models.get(player.carId)||this.models.get('sports'),tier=player.isLocal?ownTier:5;
      const root=model([pose.x,pose.y,pose.z],pose.yaw||0,pose.pitch||0,pose.roll||0);
      renderer.asset(this.body(player,tier),root);
      const wheel=entry.wheels.get(entry.stages[tier].wheelFile);
      if(!wheel)continue;
      const roots=entry.info.wheelPositions.map(w=>mul(mul(root,trs(w.translation,w.rotation)),model([0,0,0],0,spin*(w.translation[0]>0?-1:1))));
      renderer.instances(wheel,roots);
    }
  }
}
