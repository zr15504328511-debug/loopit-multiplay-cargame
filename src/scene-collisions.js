import {identity,mul,trs,point} from './math.js';

const caches=new WeakMap();
function cached(reader,url,kind) {
  if(!caches.has(reader))caches.set(reader,new Map());
  const c=caches.get(reader);
  if(!c.has(url))c.set(url,reader(url,kind));
  return c.get(url);
}
function typed(data,Type) {
  return ArrayBuffer.isView(data)?new Type(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)):new Type(data);
}
// Tessellation keeps original primitive centres, axes and dimensions. Mesh
// colliders use the original collision mesh, which may differ from rendering.
export function primitiveMesh(c) {
  const p=[],ix=[];
  if(c.shape==='Box') {
    for(let i=0;i<8;i++)p.push(...c.center.map((v,k)=>v+((i>>k)&1?.5:-.5)*c.size[k]));
    ix.push(0,4,6,0,6,2,1,3,7,1,7,5,0,1,5,0,5,4,2,6,7,2,7,3,0,2,3,0,3,1,4,5,7,4,7,6);
  } else {
    const segments=12,rings=8,axis=c.direction??1,r=c.radius,half=c.shape==='Capsule'?Math.max(0,c.height*.5-r):0;
    for(let y=0;y<=rings;y++)for(let x=0;x<segments;x++) {
      const angle=Math.PI*y/rings,phi=2*Math.PI*x/segments;
      const v=[r*Math.sin(angle)*Math.cos(phi),r*Math.cos(angle)+(y<rings/2?half:y>rings/2?-half:0),r*Math.sin(angle)*Math.sin(phi)];
      // Duplicate the equator at both cylinder ends for a proper capsule.
      if(y===rings/2)v[1]=half;
      if(axis===0)[v[0],v[1]]=[v[1],v[0]];
      if(axis===2)[v[2],v[1]]=[v[1],v[2]];
      p.push(...v.map((n,k)=>n+c.center[k]));
    }
    // Add a lower equator when the capsule has a cylindrical middle.
    if(half>0) {
      const ring=[];
      for(let x=0;x<segments;x++) {
        const v=[r*Math.cos(2*Math.PI*x/segments),-half,r*Math.sin(2*Math.PI*x/segments)];
        if(axis===0)[v[0],v[1]]=[v[1],v[0]];
        if(axis===2)[v[2],v[1]]=[v[1],v[2]];
        ring.push(...v.map((n,k)=>n+c.center[k]));
      }
      p.splice((rings/2+1)*segments*3,0,...ring);
    }
    const count=rings+(half>0?1:0);
    for(let y=0;y<count;y++)for(let x=0;x<segments;x++) {
      const a=y*segments+x,b=y*segments+(x+1)%segments,d=a+segments,e=b+segments;
      if(axis===1)ix.push(a,b,d,b,e,d);else ix.push(a,d,b,b,d,e);
    }
  }
  return {positions:new Float32Array(p),indices:new Uint32Array(ix)};
}
export function transformCollisionMesh(shape,matrix,owner) {
  const positions=new Float32Array(shape.positions.length);
  for(let k=0;k<positions.length;k+=3)positions.set(point(matrix,shape.positions.subarray(k,k+3)),k);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let k=0;k<positions.length;k++){const j=k%3;min[j]=Math.min(min[j],positions[k]);max[j]=Math.max(max[j],positions[k]);}
  return {name:owner.name,material:'solid-collider',positions,indices:shape.indices,bounds:{min,max},owner,scenery:true};
}
export function colliderMatrix(owner,time) {
  const rotation=owner.source?.rotation;
  if(!rotation)return owner.baseMatrix;
  const half=time*rotation.degreesPerSecond*Math.PI/360,length=Math.hypot(...rotation.axis)||1;
  const q=[...rotation.axis.map(v=>v/length*Math.sin(half)),Math.cos(half)];
  return mul(owner.baseMatrix,trs([0,0,0],q));
}
export async function loadSceneCollisions(id,instances,reader) {
  const data=await cached(reader,'assets/collisions/'+id+'.json','json'),loaded=new Map();
  await Promise.all(Object.entries(data.meshes).map(async([key,m])=>{
    const [p,i]=await Promise.all([cached(reader,m.positions,'binary'),cached(reader,m.indices,'binary')]);
    loaded.set(key,{positions:typed(p,Float32Array),indices:typed(i,Uint32Array)});
  }));
  const meshes=[],owners=[],dynamic=[],staticOwners=new Map();
  function append(c,root,owner) {
    const shape=c.shape==='Mesh'?loaded.get(c.mesh):primitiveMesh(c);
    if(c.rotation)dynamic.push({shape,owner});
    else meshes.push(transformCollisionMesh(shape,mul(root,c.matrix),owner));
  }
  for(const c of data.colliders) {
    const key=c.hierarchyPath+':'+c.matrix.join(',');
    let owner=staticOwners.get(key);
    if(!owner) {
      owner={name:c.hierarchyPath,hit:false,applePassThrough:!!c.applePassThrough,source:c,baseMatrix:c.matrix};
      owners.push(owner);staticOwners.set(key,owner);
    }
    append(c,identity(),owner);
  }
  for(const f of data.fallbacks) {
    const [p,i]=await Promise.all([cached(reader,f.positions,'binary'),cached(reader,f.indices,'binary')]);
    const owner={name:f.name,hit:false,applePassThrough:false,source:f};owners.push(owner);
    meshes.push(transformCollisionMesh({positions:typed(p,Float32Array),indices:typed(i,Uint32Array)},identity(),owner));
  }
  for(const instance of instances) {
    const records=data.prefabs[instance.prefab];
    if(!records?.length && instance.generateColliders===false)continue;
    if(!records?.length)throw Error('Missing scene collider for '+instance.prefab);
    const owner={name:instance.prefab,hit:false,applePassThrough:instance.goldenApplePassThrough!==false,instance};
    instance.collisionState=owner;owners.push(owner);
    const root=instance.matrix||trs(instance.position,instance.rotation,instance.scale);
    for(const c of records)append(c,root,owner);
  }
  return {meshes,owners,dynamic};
}
