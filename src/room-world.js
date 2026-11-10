const rgba = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).concat(1);

export class RoomWorld {
  constructor(stage) {
    this.root=document.createElement('div');this.root.className='room-world-labels';
    this.root.setAttribute('aria-hidden','true');stage.append(this.root);
    this.labels=new Map();this.flags=new Map();
  }
  label(player,kind) {
    const id=kind+player.id;
    if(!this.labels.has(id)) {
      const node=document.createElement('div');node.className='room-world-label '+kind;
      const img=document.createElement('img');img.src=player.avatar;img.alt='';
      const text=document.createElement('span');node.append(img,text);
      node.style.setProperty('--racer-color',player.color);node.hidden=true;
      this.root.append(node);this.labels.set(id,node);
    }
    return this.labels.get(id);
  }
  visibleCars(room,z,renderer) {
    return room.players.filter(p=>{
      if(!p.isAI||!p.pose||p.status!=='flying'||p.pose.z<z-45||p.pose.z>z+200)return false;
      if(!renderer || renderer.shadowPass)return true;
      const point=[p.pose.x,p.pose.y+.6,p.pose.z],eye=renderer.eye;
      if(renderer.project(point)[2]<8 || Math.hypot(...point.map((v,i)=>v-eye[i]))<8)return false;
      // Demo ghosts must not cover the local car or fill the follow camera.
      // Only presentation is culled; the path and record keep advancing.
      const local=room.local.pose;
      if(local) {
        const d=[local.x-eye[0],local.y+.7-eye[1],local.z-eye[2]],v=point.map((x,i)=>x-eye[i]);
        const t=v.reduce((n,x,i)=>n+x*d[i],0)/Math.max(.01,d.reduce((n,x)=>n+x*x,0));
        if(t>0&&t<.92&&Math.hypot(...v.map((x,i)=>x-d[i]*t))<2.8)return false;
      }
      return true;
    });
  }
  drawCars(renderer,room,vehicles,z) {
    const players=this.visibleCars(room,z,renderer);if(!players.length)return;
    vehicles.draw(renderer,players.map(player=>({player,pose:player.pose,spin:room.time*12})),room);
  }
  flagPosition(room,player) {
    const source=player.flag;if(!source)return null;
    let entry=this.flags.get(player.id);
    if(!entry||entry.map!==room.mapId||entry.distance!==player.flagDistance) {
      const ground=room.track.ground(source[0],source[2],source[1]+2);
      entry={map:room.mapId,distance:player.flagDistance,position:[source[0],ground?.height??source[1]-.375,source[2]]};
      this.flags.set(player.id,entry);
    }
    return entry.position;
  }
  drawFlags(renderer,room,z) {
    for(const p of room.players) {
      if(!p.participating||p.best<8||!p.flag||p.flag[2]<z-40||p.flag[2]>z+230)continue;
      const v=this.flagPosition(room,p),color=rgba(p.color);
      if(!renderer.shadowPass && renderer.project([v[0],v[1]+2,v[2]])[2]<7)continue;
      renderer.box([v[0],v[1]+.1,v[2]],[.65,.2,.65],[.24,.35,.3,1]);
      renderer.box([v[0],v[1]+1.7,v[2]],[.07,3.4,.07],[.95,.94,.8,1]);
      renderer.box([v[0]+.56,v[1]+2.8,v[2]],[1.1,.82,.055],color);
    }
  }
  updateLabels(renderer,room,z,visible) {
    for(const node of this.labels.values())node.hidden=true;
    this.root.hidden=!visible;if(!visible)return;
    const candidates=[];
    const queue=(player,kind,position,text)=>{
      const [x,y,w]=renderer.project(position);
      if(w<6||x<10||x>350||y<60||y>470)return;
      candidates.push({player,kind,x,y,w,text,priority:kind==='record'&&player.isLocal?-1000:w});
    };
    for(const p of room.players) {
      if(!p.participating||p.best<8||!p.flag||p.flag[2]<z-35||p.flag[2]>z+180)continue;
      const v=this.flagPosition(room,p);
      queue(p,'record',[v[0]+.56,v[1]+3.3,v[2]],`${Math.floor(p.flagDistance)} m`);
    }
    const occupied=[];
    for(const {player,kind,x,y,text} of candidates.sort((a,b)=>a.priority-b.priority)) {
      if(occupied.length>=2)break;
      if(occupied.some(p=>Math.abs(p.x-x)<34&&Math.abs(p.y-y)<32))continue;
      occupied.push({x,y});
      const node=this.label(player,kind);node.hidden=false;
      node.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
      node.lastElementChild.textContent=text;
    }
  }
}
