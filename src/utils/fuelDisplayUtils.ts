import type { CSSProperties } from 'react';
import { LOW_FUEL_REMAINDER_LITERS } from '../constants/fuelThresholds';

const COLOR_OK = '#3f8600';
const COLOR_LOW = '#cf1322';
const LOW_FUEL_GLOW =
  '0 0 6px rgba(207, 19, 34, 0.9), 0 0 14px rgba(255, 77, 79, 0.55), 0 0 22px rgba(255, 77, 79, 0.35)';

export function getFuelRemainderValueStyle(balance: number): CSSProperties {
  if (balance <= 0) {
    return { color: COLOR_LOW };
  }
  if (balance < LOW_FUEL_REMAINDER_LITERS) {
    return { color: COLOR_LOW, textShadow: LOW_FUEL_GLOW };
  }
  return { color: COLOR_OK };
}
