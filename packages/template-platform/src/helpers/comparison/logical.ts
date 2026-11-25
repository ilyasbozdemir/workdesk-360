export function and(...args: unknown[]): boolean {
  return args.slice(0, -1).every(Boolean);
}
export function or(...args: unknown[]): boolean {
  return args.slice(0, -1).some(Boolean);
}
export function not(val: unknown): boolean {
  return !val;
}
