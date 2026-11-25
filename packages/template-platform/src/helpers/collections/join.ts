export function join(arr: unknown[], sep: string): string {
  if (!Array.isArray(arr)) return '';
  return arr.join(typeof sep === 'string' ? sep : ', ');
}
