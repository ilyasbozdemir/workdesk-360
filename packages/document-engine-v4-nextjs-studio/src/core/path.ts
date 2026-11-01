export function getAt(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => cur && typeof cur === "object" ? (cur as Record<string, unknown>)[key] : undefined, root);
}
export function setAt(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split("."); let cur = root;
  for (const key of parts.slice(0, -1)) {
    if (!cur[key] || typeof cur[key] !== "object" || Array.isArray(cur[key])) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}
export function hasOwnPath(root: unknown, path: string): boolean {
  const parts = path.split("."); let cur: unknown = root;
  for (const key of parts) {
    if (!cur || typeof cur !== "object" || !Object.prototype.hasOwnProperty.call(cur, key)) return false;
    cur = (cur as Record<string, unknown>)[key];
  }
  return true;
}
