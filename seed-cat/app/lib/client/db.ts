import { DBSchema, StoreNames, openDB } from 'idb';
import Cookies from 'js-cookie';

import {
  CookieKey,
  DATABASE_NAME,
  DATABASE_SCHEMA_VERSION,
} from '@/app/lib/defaults';

export enum Agent {
  BrillPosTagger = 'BrillPosTagger',
  NLLBTranslatorHG = 'facebook/nllb-200-distilled-600M',
  NLLBTranslatorWorker = 'Xenova/nllb-200-distilled-600M',
  Translator = 'Translator',
  TreebankTokenizer = 'TreebankTokenizer',
}

export enum Activity {
  CompareMachineTranslation = 'CompareMachineTranslation',
  CreateTargetLanguage = 'CreateTargetLanguage',
  DisplayPosTags = 'DisplayPosTags',
  EditTranslation = 'EditTranslation',
  GeneratePosTags = 'GeneratePosTags',
  MachineTranslate = 'MachineTranslate',
  OpenSourceUrl = 'OpenSourceUrl',
  QueryWordnet = 'QueryWordNet',
  TokenizeSentence = 'TokenizeSentence',
  ViewSentence = 'ViewSentence',
}

export interface SeedDB extends DBSchema {
  // prov:Entity with inlined relationships and attributes.
  target_languages: {
    key: string;
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        name: string;
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
    };
  };
  pos_tags: {
    key: [string, number];
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        content: [string, string][];
        index: number;
        language: string;
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
    };
  };
  tokens: {
    key: [string, number];
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        content: string[];
        index: number;
        language: string;
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
    };
  };
  translations: {
    key: [string, number, number];
    indexes: {
      byKey: string;
      byActivity: SeedDB['activities']['key'];
      byCompleted: [number, string, number];
    };
    value: {
      attributes: {
        completedAtTime?: number;
        content: string;
        index: number;
        targetLanguage: string;
      };
      generatedAtTime: number;
      invalidatedAtTime?: number;
      wasGeneratedBy: SeedDB['activities']['key'];
      wasInvalidatedBy?: SeedDB['activities']['key'];
      wasQuotedFrom?: string;
      wasRevisionOf?: SeedDB['translations']['key'];
    };
  };
  machine_translations: {
    key: [string, number];
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        content: string;
        index: number;
        targetLanguage: string;
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
    };
  };
  sentences: {
    key: [string, number];
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        content: string;
        index: number;
        sourceLanguage: string;
        source: string;
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
      wasQuotedFrom: string;
    };
  };
  wordnet_queries: {
    key: [string, number];
    indexes: { byActivity: SeedDB['activities']['key'] };
    value: {
      attributes: {
        examples: string[];
        gloss: string;
        lemma: string;
        pos: string;
        synonyms: string[];
      };
      generatedAtTime: number;
      wasGeneratedBy: SeedDB['activities']['key'];
      wasQuotedFrom: string;
    };
  };
  // prov:Activity with inlined relationships.
  activities: {
    key: [Activity, number];
    indexes: { byType: string; bySentence: [string, number] };
    value: {
      attributes: {
        targetLanguage: string;
        index: number;
      };
      endedAtTime?: number;
      startedAtTime: number;
      type: Activity;
      used?: {
        attributes?: Record<string, unknown>;
        entity: Exclude<StoreNames<SeedDB>, 'activities'>;
        key: SeedDB[Exclude<StoreNames<SeedDB>, 'activities'>]['key'];
      }[];
      wasAssociatedWith: string;
      wasInformedBy?: SeedDB['activities']['key'][];
    };
  };
}

export async function getDB() {
  return await openDB<SeedDB>(DATABASE_NAME, DATABASE_SCHEMA_VERSION, {
    upgrade(db) {
      const activities = db.createObjectStore('activities', {
        keyPath: ['type', 'startedAtTime'],
      });
      activities.createIndex('byType', 'type');
      activities.createIndex('bySentence', [
        'attributes.targetLanguage',
        'attributes.index',
      ]);

      const languagesStore = db.createObjectStore('target_languages', {
        keyPath: 'attributes.name',
      });
      languagesStore.createIndex('byActivity', 'wasGeneratedBy');

      const sentences = db.createObjectStore('sentences', {
        keyPath: ['attributes.sourceLanguage', 'attributes.index'],
      });
      sentences.createIndex('byActivity', 'wasGeneratedBy');

      const tokens = db.createObjectStore('tokens', {
        keyPath: ['attributes.language', 'attributes.index'],
      });
      tokens.createIndex('byActivity', 'wasGeneratedBy');

      const pos = db.createObjectStore('pos_tags', {
        keyPath: ['attributes.language', 'attributes.index'],
      });
      pos.createIndex('byActivity', 'wasGeneratedBy');

      const wordnet = db.createObjectStore('wordnet_queries', {
        keyPath: ['attributes.lemma', 'generatedAtTime'],
      });
      wordnet.createIndex('byActivity', 'wasGeneratedBy');

      const machineTranslations = db.createObjectStore('machine_translations', {
        keyPath: ['attributes.targetLanguage', 'attributes.index'],
      });
      machineTranslations.createIndex('byActivity', 'wasGeneratedBy');

      const translations = db.createObjectStore('translations', {
        keyPath: [
          'attributes.targetLanguage',
          'attributes.index',
          'generatedAtTime',
        ],
      });
      translations.createIndex('byKey', [
        'attributes.targetLanguage',
        'attributes.index',
        'generatedAtTime',
      ]);
      translations.createIndex('byActivity', 'wasGeneratedBy');
      translations.createIndex('byCompleted', [
        'invalidatedAtTime',
        'attributes.targetLanguage',
        'attributes.completedAtTime',
      ]);
    },
  });
}

export async function getAllKeys<Name extends StoreNames<SeedDB>>(
  storeName: Name
) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return await store.getAllKeys();
}

export async function getObject<Name extends StoreNames<SeedDB>>(
  storeName: Name,
  key: SeedDB[Name]['key']
) {
  const db = await getDB();
  return db.get(storeName, key);
}

export async function saveObject<Name extends StoreNames<SeedDB>>(
  storeName: Name,
  value: SeedDB[Name]['value']
) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const key = await store.put(value);
  await tx.done;

  return key;
}

export async function getActivitiesBySentence(
  targetLanguage: string,
  index: number
) {
  const db = await getDB();
  const range = IDBKeyRange.only([targetLanguage, index]);
  const values = await db.getAllFromIndex('activities', 'bySentence', range);
  const keys = await db.getAllKeysFromIndex('activities', 'bySentence', range);

  return values.map((value, i) => ({ key: keys[i], value }));
}

export async function getEntitiesByActivity<
  Name extends Exclude<StoreNames<SeedDB>, 'activities'>,
>(storeName: Name, activityKey: SeedDB['activities']['key']) {
  const db = await getDB();
  const range = IDBKeyRange.only(activityKey);
  const values = await db.getAllFromIndex(storeName, 'byActivity', range);
  const keys = await db.getAllKeysFromIndex(storeName, 'byActivity', range);

  return values.map((value, i) => ({ key: keys[i], value }));
}

export async function getLatestTranslation(language: string, index: number) {
  const db = await getDB();
  const tx = db.transaction('translations', 'readonly');
  const store = tx.objectStore('translations');
  const cursor = await store
    .index('byKey')
    .openCursor(
      IDBKeyRange.bound([language, index, 0], [language, index, Infinity]),
      'prev'
    );

  return cursor?.value;
}

export async function getCompletedTranslations(targetLanguage: string) {
  const db = await getDB();
  const range = IDBKeyRange.bound(
    [0, targetLanguage, 0],
    [0, targetLanguage, Infinity]
  );

  return await db.getAllFromIndex('translations', 'byCompleted', range);
}

export function getTranslatorAgentId() {
  const uid = Cookies.get(CookieKey.UserIdentifier);
  return uid ? `${Agent.Translator}/${uid}` : Agent.Translator;
}
