export function lookup(obj: Record<string, unknown>, key: string): unknown {
  return obj ? obj[key] : undefined;
}
export function add(a: number, b: number): number {
  return Number(a) + Number(b);
}
