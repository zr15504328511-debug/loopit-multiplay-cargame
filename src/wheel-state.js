import {DYNAMICS as D} from './native-dynamics-config.js';
import {frictionCurve,integrateWheelSpeed,steeringDegrees} from './vehicle-dynamics.js';
import {clamp} from './math.js';
import {contactOffset} from './ground-contact.js';

export function createWheelState() {
  return D.wheelPositions.map(w=>({name:w.name,anchor:w.translation,front:/front/.test(w.name),
    omega:0,spin:0,steer:0,offset:0,compression:.025,contact:false,forwardSlip:0,sidewaysSlip:0}));
}
export function updateWheels(sim,dt) {
  const W=D.wheel;
  sim.wheelSteerAngle=-sim.steer*steeringDegrees(Math.hypot(sim.vx,sim.vy,sim.vz))*Math.PI/180;
  for(const w of sim.wheels) {
    w.steer=w.front?sim.wheelSteerAngle:0;
    const [dx,dy,dz]=contactOffset(sim,w.anchor);
    const x=sim.x+dx,z=sim.z+dz,wheelY=sim.y+dy;
    const g=sim.track.ground(x,z,wheelY+W.radius);
    const enabled=sim.stats.hasWheels && !(sim.stats.wheelMode==='front'&&sim.stats.sourceTier===1&&!w.front);
    w.contact=enabled&&!!g&&sim.onGround&&wheelY-W.radius-g.height<=W.suspensionDistance;
    // The released support solver retains its existing ride height. Individual
    // wheel travel is relative to that rest pose; full spring forces are staged.
    const upY=Math.max(.1,Math.cos(sim.pitch)*Math.cos(sim.roll));
    w.compression=w.contact?clamp(.025+(W.radius-(wheelY-g.height))/upY,0,W.suspensionDistance):0;
    w.offset=w.compression-.025;
    const angle=sim.yaw+w.steer,forward=sim.vx*Math.sin(angle)+sim.vz*Math.cos(angle);
    w.sidewaysSlip=Math.atan((sim.vx*Math.cos(angle)-sim.vz*Math.sin(angle))/(Math.abs(forward)+1));
    for(let i=0;i<3;i++) {
      const rolling=w.omega*W.radius;
      w.forwardSlip=(rolling-forward)/Math.max(4,Math.abs(forward),Math.abs(rolling));
      let force=w.contact?Math.sign(w.forwardSlip)*frictionCurve(w.forwardSlip,W.forwardFriction)*sim.stats.mass*9.81/4:0;
      const bound=Math.abs(rolling-forward)*W.mass/(2*(dt/3));
      force=clamp(force,-bound,bound);
      w.omega=integrateWheelSpeed(w.omega,-force*W.radius,0,dt/3);
      w.spin+=w.omega*dt/3;
    }
  }
}
