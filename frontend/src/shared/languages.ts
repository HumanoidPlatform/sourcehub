// Languages, by the code a request stores and the English name.
//
// Moved here from the RFP builder, which offered them for a request's
// languages, so a delivery partner declares the languages it works in from the
// same list and a client filtering the vendors directory by language finds the
// partners that match a request. Codes are mixed two- and three-letter on
// purpose: they are what requests already hold.
//
// The API validates a partner's languages against the same codes
// (modules/identity/expertise_vocabulary.py); a test compares the two.

export const LANGUAGES = [
  ["eng", "English"], ["hin", "Hindi"], ["fr", "French"], ["spa", "Spanish"],
  ["ara", "Arabic"], ["ben", "Bengali"], ["cmn", "Mandarin Chinese"], ["por", "Portuguese"],
  ["rus", "Russian"], ["de", "German"], ["jpn", "Japanese"], ["kor", "Korean"],
  ["ind", "Indonesian"], ["msa", "Malay"], ["ita", "Italian"], ["tur", "Turkish"],
  ["vie", "Vietnamese"], ["tha", "Thai"], ["tam", "Tamil"], ["tel", "Telugu"],
  ["mar", "Marathi"], ["urd", "Urdu"], ["guj", "Gujarati"], ["kan", "Kannada"],
  ["pan", "Punjabi"], ["nld", "Dutch"], ["swe", "Swedish"], ["nor", "Norwegian"],
  ["dan", "Danish"], ["fin", "Finnish"], ["pol", "Polish"], ["ukr", "Ukrainian"],
  ["ell", "Greek"], ["heb", "Hebrew"],
] as const;

export function languageLabel(code: string): string {
  const found = LANGUAGES.find(([value]) => value === code);
  return found ? found[1] : code;
}
