const POS_TAG_COLORS = {
  // Cardinal numbers
  CD: 'yellow',

  TO: 'violet',

  // Prepositions
  IN: 'indigo',

  // Coordinating conjunctions
  CC: 'indigo',

  // Modals
  MD: 'indigo',

  // Adjectives
  JJ: 'green',
  JJR: 'lime',
  JJS: 'lime',

  // Nouns
  NN: 'blue',
  NNS: 'blue',
  NNP: 'sky',
  NNPS: 'sky',

  // Possessive ending
  POS: 'cyan',

  // Pronouns
  PRP: 'fuchsia',
  PRP$: 'fuchsia',

  // Adverbs
  RB: 'amber',
  RBR: 'amber',
  RBS: 'amber',

  // Verbs
  VB: 'red',
  VBD: 'red',
  VBG: 'red',
  VBN: 'red',
  VBP: 'red',
  VBZ: 'red',

  // WH-determiners and pronouns
  WDT: 'teal',
  WP: 'teal',
  WP$: 'teal',
  WRB: 'teal',

  // Existential there
  EX: 'teal',

  // Other (particles, symbols, etc.)
  RP: 'pink',
  SYM: 'pink',
  UH: 'pink',
  FW: 'pink',
  LS: 'pink',

  // Default
  default: 'zinc',
} as const;

export function getPOSTagColor(
  tag: string
): (typeof POS_TAG_COLORS)[keyof typeof POS_TAG_COLORS] {
  return (
    POS_TAG_COLORS[tag as keyof typeof POS_TAG_COLORS] ?? POS_TAG_COLORS.default
  );
}

const WORDNET_POS_COLORS = {
  n: 'blue',
  v: 'red',
  a: 'green',
  r: 'amber',
  s: 'lime',
  default: 'zinc',
} as const;

export function getWordNetPOSColor(pos: string) {
  return (
    WORDNET_POS_COLORS[pos as keyof typeof WORDNET_POS_COLORS] ??
    WORDNET_POS_COLORS.default
  );
}

export function getWordNetPOSLabel(pos: string) {
  switch (pos) {
    case 'a':
      return 'Adjective';
    case 'r':
      return 'Adverb';
    case 's':
      return 'Adjective satellite';
    case 'n':
      return 'Noun';
    case 'v':
      return 'Verb';
    default:
      return 'Other';
  }
}
