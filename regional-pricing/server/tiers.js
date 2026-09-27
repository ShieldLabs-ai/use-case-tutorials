// Illustrative regional discount tiers for this demo, not a pricing recommendation.
const TIERS = [
  { percentOff: 0, countries: { US: 'United States', CA: 'Canada', GB: 'United Kingdom', DE: 'Germany', FR: 'France', NL: 'Netherlands', AU: 'Australia', JP: 'Japan' } },
  { percentOff: 20, countries: { ES: 'Spain', IT: 'Italy', PT: 'Portugal', PL: 'Poland' } },
  { percentOff: 40, countries: { BR: 'Brazil', MX: 'Mexico', ZA: 'South Africa', AR: 'Argentina' } },
  { percentOff: 60, countries: { IN: 'India', ID: 'Indonesia', PH: 'Philippines', VN: 'Vietnam', NG: 'Nigeria', EG: 'Egypt', KE: 'Kenya', PK: 'Pakistan' } },
];

// One entry per country: { code, name, percentOff }, sorted by name.
export const COUNTRIES = TIERS.flatMap(({ percentOff, countries }) =>
  Object.entries(countries).map(([code, name]) => ({ code, name, percentOff })),
).sort((a, b) => a.name.localeCompare(b.name));

export function findCountry(code) {
  return COUNTRIES.find((country) => country.code === String(code ?? '').toUpperCase());
}
