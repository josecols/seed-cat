export const CACHE_REVALIDATION = 43200 as const;
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 100; // 100 days
export const DATABASE_NAME = 'seed' as const;
export const DATABASE_SCHEMA_VERSION = 1 as const;
export const GITHUB_BASE_PATH = '/openlanguagedata/seed/seed' as const;
export const GITHUB_CONTENT_URL =
  'https://raw.githubusercontent.com/openlanguagedata/seed/main/seed' as const;
export const SENTENCE_RANGE = '1-6193' as const;
export const SOURCE_LANGUAGE = 'eng_Latn' as const;
export const PROV_NAMESPACE = 'seed' as const;

export enum CookieKey {
  AcknowledgedGuidelines = `seed-cat.guidelines`,
  PanelLayout = `seed-cat.layout`,
  SentenceRange = `seed-cat.range`,
  Sidebar = `seed-cat.sidebar`,
  UserIdentifier = `seed-cat.uid`,
}
