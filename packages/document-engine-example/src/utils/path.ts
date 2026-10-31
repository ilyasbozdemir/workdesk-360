/** Noktalı path üzerinden güvenli şekilde değer okur. */
export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

/** Var olan nesneyi mutate etmeden noktalı path değerini yazar. */
export function setPath<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown
): T {
  const result = structuredClone(source);
  const parts = path.split(".");
  let cursor: Record<string, unknown> = result;

  for (const part of parts.slice(0, -1)) {
    const current = cursor[part];
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }

  cursor[parts[parts.length - 1]] = value;
  return result;
}
