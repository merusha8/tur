/** Visa-free or simplified entry for citizens of Kazakhstan (approx. HT.kz-style rules) */
export const VISA_FREE_FOR_KZ = new Set([
  'KZ', 'RU', 'KG', 'UZ', 'TJ', 'BY', 'AM', 'GE', 'AZ', 'MD', 'UA',
  'TR', 'AE', 'QA', 'TH', 'MY', 'ID', 'VN', 'PH', 'JP', 'KR', 'SG',
  'HK', 'MO', 'RS', 'ME', 'AL', 'MK', 'BA', 'MN', 'LA', 'KH',
  'EG', 'MA', 'TN', 'ZA', 'BR', 'AR', 'CL', 'CO', 'PE', 'MX',
  'GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH',
  'GR', 'HR', 'CY', 'CZ', 'SK', 'HU', 'PL', 'RO', 'BG', 'LV', 'LT', 'EE', 'FI', 'SE', 'NO', 'DK', 'IS',
  'IL', 'JO', 'OM', 'SA', 'BH', 'KW',
  'MV', 'SC', 'MU', 'LK',
]);

export function buildCountryDescription(name: string, region: string, capital: string): string {
  return `${name} (${region}) is a popular travel destination with capital ${capital}. Book flights, hotels, resorts and tour packages through Meru Tour.`;
}

export function isVisaRequired(countryCode: string): boolean {
  return !VISA_FREE_FOR_KZ.has(countryCode);
}
