import type { LogicalConstraint } from '../types';

/**
 * Otomatik parser tarafından çözülemeyen veya özel davranış gerektiren
 * kısıtlar için açık override defteri.
 */
export const CONSTRAINT_OVERRIDE_REGISTRY: Record<string, LogicalConstraint[]> = {
  // Gerekirse özel kısıtlar buraya eklenebilir
};
