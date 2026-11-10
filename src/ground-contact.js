import { DYNAMICS } from './native-dynamics-config.js';

// Unilateral height-field contact: the road can push the body up, never pull
// it down. This is a vertical support approximation, not a rigid-body solver.
export function surfaceGradient(track, x, z, surface = track.ground(x, z)) {
  if (!surface) return [0, 0];
  const n = surface.normal;
  if (n && n[1] > 0.05) return [-n[0] / n[1], -n[2] / n[1]];
  const d = 0.15;
  const height = (x, z) => track.ground(x, z)?.height ?? surface.height;
  return [(height(x+d,z)-height(x-d,z))/(2*d),
    (height(x,z+d)-height(x,z-d))/(2*d)];
}

export function groundPitch(track, x, z, yaw, maxHeight=Infinity) {
  const [sx, sz] = surfaceGradient(track, x, z, track.ground(x,z,maxHeight));
  return -Math.atan(sx * Math.sin(yaw) + sz * Math.cos(yaw));
}

// Same Y * X * Z rotation as the visible chassis. Contact must account for
// the nose, rear axle and roll, not just the origin at the middle of the car.
export function contactOffset(body, local) {
  const cy=Math.cos(body.yaw||0), sy=Math.sin(body.yaw||0),
    cp=Math.cos(body.pitch||0), sp=Math.sin(body.pitch||0),
    cr=Math.cos(body.roll||0), sr=Math.sin(body.roll||0);
  const x=cr*local[0]-sr*local[1], y=sr*local[0]+cr*local[1],
    py=cp*y-sp*local[2], pz=sp*y+cp*local[2];
  return [cy*x+sy*pz, py, -sy*x+cy*pz];
}

export function contactFootprint(body, rideHeight=body.stats?.rideHeight??.375) {
  const points=[contactOffset(body,[0,-rideHeight,0])];
  for(const w of DYNAMICS.wheelPositions) {
    // The chassis constraint uses the suspension rest plane. Individual
    // wheel radii are resolved by updateWheels along the same rotated pose.
    points.push(contactOffset(body,[w.translation[0],-rideHeight,w.translation[2]]));
  }
  // A narrow bridge plank can pass between both wheel tracks. Sample the
  // belly between axles as well, instead of waiting for its centre to tunnel.
  for(const z of [-1.4,-.7,.73,1.46]) points.push(contactOffset(body,[0,-rideHeight,z]));
  return points;
}

export function supportSurface(body, track, rideHeight=body.stats?.rideHeight??.375,
  maxFoot=Infinity) {
  let best=null;
  for(const [dx,dy,dz] of contactFootprint(body,rideHeight)) {
    const x=body.x+dx, z=body.z+dz;
    const ceiling=maxFoot+rideHeight+dy;
    const g=track.ground(x,z,ceiling);
    if(!g || g.height>ceiling+1e-8) continue;
    // Shift a real contact under the footprint to the chassis-origin height.
    // Never extrapolate a bridge triangle past its edges or across a valley.
    const height=g.height-dy-rideHeight;
    if(!best || height>best.height) best={...g,height,contactX:x,contactZ:z};
  }
  return best;
}

// Forces have already updated velocity. Integrate freely, then resolve only
// an actual crossing into the surface. Keep tangential vertical momentum on
// slopes so a crest or a disappearing road produces a ballistic trajectory.
export function advanceContact(body, track, rideHeight, dt) {
  if(track.native) {
    track.native.ignorePassThrough=body.effect==='apple';
    track.native.updateColliders?.(body);
  }
  const wasGround = body.onGround;
  // Sweep the footprint through the step so a fast car cannot skip a narrow
  // plank or a crest whose two endpoints both lie above the surface.
  const steps=Math.max(1,Math.ceil(Math.hypot(body.vx,body.vy,body.vz)*dt/.2));
  const step=dt/steps;
  let impact=0,wallImpact=0,ground=null;
  for(let i=0;i<steps;i++) {
    const oldFoot=body.y-rideHeight, grounded=body.onGround;
    const reach=Math.hypot(body.vx,body.vz)*step*3+.05;
    const oldGround=supportSurface(body,track,rideHeight,oldFoot+reach);
    const previous={x:body.x,y:body.y,z:body.z};
    body.x+=body.vx*step;
    body.y+=body.vy*step;
    body.z+=body.vz*step;
    ground=supportSurface(body,track,rideHeight,oldFoot+reach);
    body.onGround=false;
    if(!ground) {
      wallImpact=Math.max(wallImpact,track.native?.meshContact.resolve(body,previous)||0);
      wallImpact=Math.max(wallImpact,track.native?.dynamicContact?.resolve(body,previous)||0);
      continue;
    }
    const foot = body.y - rideHeight;
    const oldClearance = oldFoot - (oldGround?.height ?? ground.height);
    // A surface first appearing above the car is an underside/wall, not a
    // landing. It must not teleport a car from a valley onto a bridge deck.
    const continuous = oldGround && Math.abs(ground.height-oldGround.height) <=
      Math.hypot(body.vx,body.vz)*step*3 + 0.05;
    const fromAbove = oldFoot >= ground.height - 1e-6 ||
      (continuous && (grounded || oldClearance >= -DYNAMICS.wheel.suspensionDistance));
    const [sx, sz] = surfaceGradient(track, body.x, body.z, ground);
    const tangentY = sx*body.vx + sz*body.vz;
    // Suspension may settle a small gap caused by the visual pitch changing.
    // Outward velocity still detaches immediately; a cliff cannot pull it down.
    const settling=grounded && body.vy<=tangentY && foot<=ground.height+.035;
    if ((foot <= ground.height + 1e-8 || settling) && fromAbove) {
      impact = Math.max(impact,Math.max(0,tangentY-body.vy)/Math.hypot(sx,1,sz));
      body.y = ground.height + rideHeight;
      // Horizontal coasting remains the existing scalar approximation.
      // This support constraint cancels only inward vertical motion; the
      // full momentum-coupled chassis/suspension solver is still separate.
      if(ground.source==='native-scene-collider') {
        // A rock, roof or tree cap is an obstacle, not a slope-powered ramp.
        // Project the complete velocity instead of adding vertical energy
        // while preserving all horizontal speed.
        const n=ground.normal,inward=body.vx*n[0]+body.vy*n[1]+body.vz*n[2];
        if(inward<0) {
          body.vx-=inward*n[0];body.vy-=inward*n[1];body.vz=Math.max(0,body.vz-inward*n[2]);
          body.speed=Math.hypot(body.vx,body.vz);
          body.steeringHeading=Math.atan2(body.vx,Math.max(1e-8,body.vz));
        }
      } else body.vy = Math.max(body.vy,tangentY);
      body.onGround = true;
    }
    wallImpact=Math.max(wallImpact,track.native?.meshContact.resolve(body,previous)||0);
    wallImpact=Math.max(wallImpact,track.native?.dynamicContact?.resolve(body,previous)||0);
  }
  return { ground, landed: !wasGround && body.onGround, impact, wallImpact };
}
