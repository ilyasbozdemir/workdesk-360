export function formatCurrency(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0,00 ₺';
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return '0,00 ₺';
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}
