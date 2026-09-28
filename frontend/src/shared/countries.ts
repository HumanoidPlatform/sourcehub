// Countries, by ISO 3166 code and English name.
//
// Moved here from the RFP builder, where it drove the country-and-language
// picker, so the onboarding form picks from the same list. Organisations store
// the NAME ("India", "United States"): that is what every existing account
// already holds, and what every screen prints.

export const COUNTRIES = [
  ["AF", "Afghanistan"], ["AL", "Albania"], ["DZ", "Algeria"], ["AD", "Andorra"],
  ["AO", "Angola"], ["AR", "Argentina"], ["AM", "Armenia"], ["AU", "Australia"],
  ["AT", "Austria"], ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"],
  ["BD", "Bangladesh"], ["BB", "Barbados"], ["BE", "Belgium"], ["BZ", "Belize"],
  ["BJ", "Benin"], ["BT", "Bhutan"], ["BO", "Bolivia"], ["BA", "Bosnia and Herzegovina"],
  ["BW", "Botswana"], ["BR", "Brazil"], ["BN", "Brunei"], ["BG", "Bulgaria"],
  ["BF", "Burkina Faso"], ["BI", "Burundi"], ["KH", "Cambodia"], ["CM", "Cameroon"],
  ["CA", "Canada"], ["CL", "Chile"], ["CN", "China"], ["CO", "Colombia"],
  ["CR", "Costa Rica"], ["CI", "Cote d'Ivoire"], ["HR", "Croatia"], ["CY", "Cyprus"],
  ["CZ", "Czechia"], ["DK", "Denmark"], ["DO", "Dominican Republic"], ["EC", "Ecuador"],
  ["EG", "Egypt"], ["SV", "El Salvador"], ["EE", "Estonia"], ["ET", "Ethiopia"],
  ["FI", "Finland"], ["FR", "France"], ["GE", "Georgia"], ["DE", "Germany"],
  ["GH", "Ghana"], ["GR", "Greece"], ["GT", "Guatemala"], ["HK", "Hong Kong"],
  ["HU", "Hungary"], ["IS", "Iceland"], ["IN", "India"], ["ID", "Indonesia"],
  ["IE", "Ireland"], ["IL", "Israel"], ["IT", "Italy"], ["JM", "Jamaica"],
  ["JP", "Japan"], ["JO", "Jordan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"],
  ["KW", "Kuwait"], ["KG", "Kyrgyzstan"], ["LA", "Laos"], ["LV", "Latvia"],
  ["LB", "Lebanon"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MY", "Malaysia"],
  ["MV", "Maldives"], ["MT", "Malta"], ["MU", "Mauritius"], ["MX", "Mexico"],
  ["MD", "Moldova"], ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"],
  ["NP", "Nepal"], ["NL", "Netherlands"], ["NZ", "New Zealand"], ["NG", "Nigeria"],
  ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"], ["PA", "Panama"],
  ["PE", "Peru"], ["PH", "Philippines"], ["PL", "Poland"], ["PT", "Portugal"],
  // RU was in COUNTRY_LANGUAGE_CODES but not here, so countryLabel fell through
  // to the raw code and the picker offered "RU - Russian" among a list of real
  // country names.
  ["QA", "Qatar"], ["RO", "Romania"], ["RU", "Russia"], ["RW", "Rwanda"], ["SA", "Saudi Arabia"],
  ["SN", "Senegal"], ["RS", "Serbia"], ["SG", "Singapore"], ["SK", "Slovakia"],
  ["SI", "Slovenia"], ["ZA", "South Africa"], ["KR", "South Korea"], ["ES", "Spain"],
  ["LK", "Sri Lanka"], ["SE", "Sweden"], ["CH", "Switzerland"], ["TW", "Taiwan"],
  ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TR", "Turkey"],
  ["TM", "Turkmenistan"], ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"], ["US", "United States"], ["UY", "Uruguay"], ["UZ", "Uzbekistan"],
  ["VE", "Venezuela"], ["VN", "Vietnam"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
] as const;

export function countryLabel(code: string): string {
  const found = COUNTRIES.find(([value]) => value === code);
  return found ? found[1] : code;
}

/** Names in list order, for a <select> of countries. */
export const COUNTRY_NAMES: readonly string[] = COUNTRIES.map(([, name]) => name);
