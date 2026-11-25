export function length(arr: unknown[]): number {
  return Array.isArray(arr) ? arr.length : 0;
}
