// Format decimal strings without floating-point conversion or rounding.
export function formatMachinePrice(
  price?: string | null,
  currency?: string | null,
) {
  if (!price || !currency || !/^\d+(\.\d{1,2})?$/.test(price))
    return 'Price not provided';
  const [whole, fraction = ''] = price.split('.');
  return `${currency} ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction.padEnd(2, '0')}`;
}
