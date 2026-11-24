export function uppercase(str: string | undefined): string {
  return (str || '').toLocaleUpperCase('tr-TR');
}
export function lowercase(str: string | undefined): string {
  return (str || '').toLocaleLowerCase('tr-TR');
}
