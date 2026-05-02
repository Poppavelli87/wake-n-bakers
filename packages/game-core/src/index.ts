export { clamp } from "./util/clamp";
export {
  applyDrain as applyComposureDrain,
  applyRecovery as applyComposureRecovery,
  isMeltdown,
  tier as composureTier,
  COMPOSURE_DRAIN,
  COMPOSURE_MAX,
  COMPOSURE_MIN,
  COMPOSURE_RECOVER_COOK,
  COMPOSURE_RECOVER_COVER,
  type ComposureState
} from "./scoring/composure";
export {
  applyHeatGain,
  applyHeatDecay,
  endChase,
  HEAT_DECAY_PER_SEC,
  HEAT_GAIN,
  HEAT_MAX,
  HEAT_MIN,
  type HeatState
} from "./scoring/heat";
