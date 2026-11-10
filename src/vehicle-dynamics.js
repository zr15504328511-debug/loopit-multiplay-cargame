import { DYNAMICS as D } from "./native-dynamics-config.js";
import { clamp } from "./math.js";

// Car.UpdateWheelSteering 0x13675a8: interpolation uses 3D body speed.
export function steeringDegrees(speed) {
  return D.maxSteerAngle + (D.minSteerAngle - D.maxSteerAngle) * clamp(speed / D.speedForMinSteer, 0, 1);
}
// BenchSim.EvalVehicleFriction 0x142eb0c; stiffness is applied afterwards.
export function frictionCurve(slip, curve) {
  const [peakSlip, peak, tailSlip, tail] = Array.isArray(curve) ? curve :
    [curve.extremumSlip, curve.extremumValue, curve.asymptoteSlip, curve.asymptoteValue];
  const s = Math.abs(slip);
  if (s < peakSlip) {
    const t = s / peakSlip;
    return peak * (t + t*t - t*t*t);
  }
  if (s >= tailSlip) return tail;
  const t = (s - peakSlip) / Math.max(1e-6, tailSlip - peakSlip);
  return peak + (tail - peak) * t*t*(3 - 2*t);
}
// BenchSim.IntegrateWheelSpeed 0x1430d80: wheel inertia and implicit damping.
export function integrateWheelSpeed(omega, torque, brake, dt, wheel = D.wheel) {
  const h = dt / (0.5 * wheel.mass * wheel.radius ** 2);
  const next = (omega + h * (torque - Math.sign(omega) * brake)) / (1 + h * wheel.wheelDampingRate);
  return brake > 0 && omega * next <= 0 ? 0 : next;
}
