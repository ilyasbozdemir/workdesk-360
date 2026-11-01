import type { ProcessMapping, SnapshotEnvelope } from "../types.js";
import { getPath, setPath } from "../utils/path.js";

/**
 * Refresh sırasında alan politikalarını uygular.
 * source: yeni kaynak değerini al.
 * preserve: eski snapshot değerini koru (varsa).
 * manual: yalnızca açık override varsa override değerini koru.
 */
export class SnapshotMerger {
  merge(
    freshData: Record<string, unknown>,
    mapping: ProcessMapping,
    previous: SnapshotEnvelope | null
  ): {
    data: Record<string, unknown>;
    overrides: SnapshotEnvelope["overrides"];
  } {
    if (!previous) {
      return { data: freshData, overrides: {} };
    }

    let data = structuredClone(freshData);
    const overrides = { ...previous.overrides };

    for (const [path, definition] of Object.entries(mapping)) {
      const policy = definition.refreshPolicy ?? "source";

      if (policy === "preserve") {
        const oldValue = getPath(previous.data, path);
        if (oldValue !== undefined) {
          data = setPath(data, path, oldValue);
        }
      }

      if (policy === "manual") {
        const override = overrides[path];
        if (override) {
          data = setPath(data, path, override.value);
        }
      }
    }

    return { data, overrides };
  }
}
