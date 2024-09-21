// Types are based on https://www.w3.org/submissions/prov-json/schema
import { StoreNames } from 'idb';

import {
  Agent,
  getActivitiesBySentence,
  getEntitiesByActivity,
  saveObject,
  SeedDB,
} from '@/app/lib/client/db';
import { GITHUB_CONTENT_URL, PROV_NAMESPACE } from '@/app/lib/defaults';

type LiteralArray = (string | number | boolean)[];
type AttributeValues = string | number | boolean | LiteralArray;
type ValueOf<T> = T[keyof T];

export interface ProvJson {
  prefix?: {
    [k: string]: string;
  };
  entity: {
    [k: string]: Entity;
  };
  activity: {
    [k: string]: Activity;
  };
  agent: {
    [k: string]: Entity;
  };
  wasGeneratedBy?: {
    [k: string]: GenerationUsage;
  };
  used?: {
    [k: string]: GenerationUsage;
  };
  wasInformedBy?: {
    [k: string]: Communication;
  };
  wasInvalidatedBy?: {
    [k: string]: Invalidation;
  };
  wasDerivedFrom?: {
    [k: string]: Derivation;
  };
  wasAssociatedWith?: {
    [k: string]: Association;
  };
}

interface Entity {
  [k: string]: AttributeValues;
}

interface Activity {
  [k: string]: AttributeValues;
}

interface GenerationUsage {
  'prov:entity': string;
  'prov:activity'?: string;
  'prov:time'?: string;

  [k: string]: AttributeValues | undefined;
}

interface Communication {
  'prov:informant': string;
  'prov:informed': string;

  [k: string]: AttributeValues;
}

interface Invalidation {
  'prov:entity': string;
  'prov:time'?: string;
  'prov:activity'?: string;

  [k: string]: AttributeValues | undefined;
}

interface Derivation {
  'prov:generatedEntity': string;
  'prov:usedEntity': string;
  'prov:activity'?: string;
  'prov:generation'?: string;
  'prov:usage'?: string;

  [k: string]: AttributeValues | undefined;
}

interface Association {
  'prov:activity': string;
  'prov:agent'?: string;
  'prov:plan'?: string;

  [k: string]: AttributeValues | undefined;
}

type RelationName = keyof typeof RELATION_ABBREVIATIONS;

const SELECTED_STORES = [
  'machine_translations',
  'pos_tags',
  'sentences',
  'target_languages',
  'tokens',
  'translations',
  'wordnet_queries',
] as const;

const RELATION_ABBREVIATIONS = {
  used: 'u',
  wasAssociatedWith: 'aw',
  wasDerivedFrom: 'df',
  wasGeneratedBy: 'gb',
  wasInformedBy: 'ib',
  wasInvalidatedBy: 'iv',
  wasQuotedFrom: 'df',
  wasRevisionOf: 'df',
} as const;

let relationIds: ReturnType<typeof initRelationIds>;
let provJson: ReturnType<typeof initProvJson>;

export async function serialize(
  sourceLanguage: string,
  targetLanguage: string,
  index: number,
  includeAttributes = false
) {
  provJson = initProvJson(sourceLanguage);
  relationIds = initRelationIds();

  let languageActivities = await getActivitiesBySentence(targetLanguage, 0);
  languageActivities = languageActivities.sort((activity) => activity.key[1]);

  const sentenceActivities = await getActivitiesBySentence(
    targetLanguage,
    index
  );
  const activities = [languageActivities[0], ...sentenceActivities];

  for (const activity of activities) {
    serializeIdbObject('activities', activity, includeAttributes);

    for (const storeName of SELECTED_STORES) {
      const generatedEntities = await getEntitiesByActivity(
        storeName,
        activity.key
      );

      for (const record of generatedEntities) {
        serializeIdbObject(storeName, record, includeAttributes);
      }
    }
  }

  const sorted = Object.fromEntries(Object.entries(provJson).sort());
  for (const key of ['entity', 'activity', 'agent'] as const) {
    sorted[key] = Object.fromEntries(Object.entries(sorted[key]).sort());
  }

  return {
    prefix: sorted.prefix,
    agent: sorted.agent,
    activity: sorted.activity,
    entity: sorted.entity,
    ...sorted,
  };
}

export async function deserialize(prov: ProvJson | null) {
  if (!prov) {
    return;
  }

  const relations = mapRelations(prov);
  await deserializeActivities(prov, relations);
  return await deserializeEntities(prov, relations);
}

function initRelationIds() {
  const ids = {} as Record<ValueOf<typeof RELATION_ABBREVIATIONS>, number>;
  for (const key of Object.values(RELATION_ABBREVIATIONS)) {
    ids[key] = 1;
  }
  return ids;
}

function initProvJson(sourceLanguage: string) {
  return {
    prefix: {
      prov: 'https://www.w3.org/ns/prov#',
      oldi: 'https://github.com/openlanguagedata/seed/blob/main/',
      wn: 'https://wordnet.princeton.edu/',
      [PROV_NAMESPACE]: 'https://seed-cat.vercel.app/',
    },
    entity: {
      [`oldi:seed/${sourceLanguage}`]: {
        'prov:location': `${GITHUB_CONTENT_URL}/${sourceLanguage}`,
        'prov:type': 'oldi:dataset',
      },
    },
    activity: {},
    agent: {},
  } as ProvJson;
}

function citeWordNet() {
  provJson.entity['wn:wordnet'] = {
    'prov:location': 'wn3.1.dict.tar.gz',
    'prov:type': 'wn:database',
    'wn:license': 'wn:license-and-commercial-use',
    'wn:version': 3.1,
  };
}

function encodeEntityId<Name extends StoreNames<SeedDB>>(
  storeName: Name,
  key: SeedDB[Name]['key']
) {
  return `${PROV_NAMESPACE}:${storeName}/${encodeKey(key)}`;
}

function encodeKey(key: SeedDB[StoreNames<SeedDB>]['key']) {
  return Array.isArray(key) ? key.map(String).join('/') : key;
}

function decodeKey(key: string | string[]) {
  const parts = Array.isArray(key) ? key : key.split('/');
  const decoded = parts.map((part) =>
    isNaN(Number(part)) ? part : Number(part)
  );
  return (
    decoded.length === 1 ? decoded[0] : decoded
  ) as SeedDB[StoreNames<SeedDB>]['key'];
}

function decodeEntityId(entityId: string): null | {
  storeName: StoreNames<SeedDB>;
  key: SeedDB[StoreNames<SeedDB>]['key'];
} {
  if (!entityId.startsWith(`${PROV_NAMESPACE}:`)) {
    return null;
  }

  let [storeName, ...keyParts] = entityId.split('/');
  storeName = storeName.replace(`${PROV_NAMESPACE}:`, '');
  const key = decodeKey(keyParts);

  return { storeName: storeName as StoreNames<SeedDB>, key };
}

function encodeTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function decodeTimestamp(timestamp: string) {
  return new Date(timestamp).getTime();
}

function encodeValue(value: unknown) {
  const isLiteral =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

  return isLiteral ? value : JSON.stringify(value);
}

function decodeValue(value: string) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

function serializeIdbObject<Name extends StoreNames<SeedDB>>(
  storeName: Name,
  record: Omit<SeedDB[StoreNames<SeedDB>], 'indexes'>,
  includeAttributes = false
) {
  const entityId = encodeEntityId(storeName, record.key);

  switch (storeName) {
    case 'activities': {
      const value = record.value as SeedDB['activities']['value'];
      const entity = { id: entityId, value };
      provJson.activity[entityId] = serializeEntity(
        value.type,
        value,
        includeAttributes
      );
      serializeUsage(entity);
      serializeAssociation(entity);
      serializeCommunication(entity);
      serializeAgent(value.wasAssociatedWith);
      break;
    }
    case 'tokens':
    case 'pos_tags':
    case 'machine_translations':
    case 'target_languages': {
      const value = record.value as SeedDB[
        | 'tokens'
        | 'pos_tags'
        | 'machine_translations'
        | 'target_languages']['value'];
      provJson.entity[entityId] = serializeEntity(
        storeName,
        value,
        includeAttributes
      );
      serializeGeneration({
        id: entityId,
        value,
      });
      break;
    }
    case 'sentences': {
      const value = record.value as SeedDB['sentences']['value'];
      provJson.entity[entityId] = serializeEntity(
        storeName,
        value,
        includeAttributes
      );
      const entity = { id: entityId, value };
      serializeGeneration(entity);
      serializeQuotation(entity);
      break;
    }
    case 'translations': {
      const value = record.value as SeedDB['translations']['value'];
      provJson.entity[entityId] = serializeEntity(
        storeName,
        value,
        includeAttributes
      );
      const entity = { id: entityId, value };
      serializeGeneration(entity);
      serializeInvalidation(entity);
      serializeQuotation(entity);
      serializeRevision(entity);
      break;
    }
    case 'wordnet_queries': {
      const value = record.value as SeedDB['wordnet_queries']['value'];
      provJson.entity[entityId] = serializeEntity(
        storeName,
        value,
        includeAttributes
      );
      const entity = { id: entityId, value };
      citeWordNet();
      serializeGeneration(entity);
      serializeQuotation(entity);
      break;
    }
    default:
      console.error(`Serialization for ${storeName} not supported`);
  }
}

function serializeAgent(agentName: string) {
  const agentId = `${PROV_NAMESPACE}:${agentName}`;
  const agentType = agentName.includes('/')
    ? agentName.split('/')[0]
    : agentName;
  const provType =
    agentType === Agent.Translator ? 'prov:Person' : 'prov:SoftwareAgent';
  const seedType =
    agentType === Agent.Translator ? `${PROV_NAMESPACE}:${agentType}` : agentId;

  provJson.agent[agentId] = {
    'prov:type': [provType, seedType],
  };
}

function deserializeAgent(agentId: string) {
  if (!agentId.startsWith(`${PROV_NAMESPACE}:`)) {
    return;
  }

  return agentId.replace(`${PROV_NAMESPACE}:`, '');
}

function serializeEntity<Name extends StoreNames<SeedDB>>(
  type: string,
  entity: SeedDB[Name]['value'],
  includeAttributes: boolean
) {
  const props: Entity = {
    'prov:type': `${PROV_NAMESPACE}:${type}`,
  };

  if ('startedAtTime' in entity && entity.startedAtTime) {
    props['prov:startTime'] = encodeTimestamp(entity.startedAtTime);
  }

  if ('endedAtTime' in entity && entity.endedAtTime) {
    props['prov:endTime'] = encodeTimestamp(entity.endedAtTime);
  }

  if (includeAttributes && entity.attributes) {
    Object.assign(props, serializeAttributes(entity));
  }

  return props;
}

type EntityRelations = {
  generatedAtTime?: number;
  invalidatedAtTime?: number;
  wasGeneratedBy?: SeedDB['activities']['key'];
  wasInvalidatedBy?: SeedDB['activities']['key'];
  wasQuotedFrom?: string;
  wasRevisionOf?: SeedDB['translations']['value']['wasRevisionOf'];
};

async function deserializeEntities(prov: ProvJson, relationMap: RelationMap) {
  let sourceLanguage = '';
  let targetLanguage = '';
  let index = 0;

  const entities: [StoreNames<SeedDB>, SeedDB[StoreNames<SeedDB>]['value']][] =
    [];

  for (const [entityId, entity] of Object.entries(prov.entity)) {
    const decodedId = decodeEntityId(entityId);
    if (!decodedId || !(entityId in relationMap)) {
      continue;
    }

    const relations: EntityRelations = {};
    const { storeName } = decodedId;

    if (storeName === 'translations') {
      relations['invalidatedAtTime'] = 0;
      index = entity['seed:index'] as number;
      targetLanguage = entity['seed:targetLanguage'] as string;
    }

    if (storeName === 'sentences') {
      sourceLanguage = entity['seed:sourceLanguage'] as string;
    }

    for (const [relationName, entry] of Object.entries(relationMap[entityId])) {
      let timestamp = undefined;
      if (relationMap[entityId]['relationTime']?.[relationName]) {
        timestamp = decodeTimestamp(
          relationMap[entityId]['relationTime'][relationName]
        );
      }

      deserializeEntityRelations(
        relations,
        relationName as RelationName,
        entry as string,
        timestamp
      );
    }

    const attributes = deserializeAttributes(entity) as SeedDB[Exclude<
      StoreNames<SeedDB>,
      'activities'
    >]['value']['attributes'];

    entities.push([
      storeName,
      {
        ...relations,
        attributes,
      } as SeedDB[Exclude<StoreNames<SeedDB>, 'activities'>]['value'],
    ]);
  }

  await Promise.all(
    entities.map(([storeName, entity]) => saveObject(storeName, entity))
  );

  return {
    sourceLanguage,
    targetLanguage,
    index,
  };
}

function deserializeEntityRelations(
  relations: EntityRelations,
  name: RelationName,
  entry: string,
  timestamp?: number
) {
  switch (name) {
    case 'wasGeneratedBy':
    case 'wasInvalidatedBy': {
      const activityId = decodeEntityId(entry);
      if (activityId) {
        relations[name] = activityId.key as SeedDB['activities']['key'];
        relations[
          name === 'wasGeneratedBy' ? 'generatedAtTime' : 'invalidatedAtTime'
        ] = timestamp;
      }
      break;
    }
    case 'wasQuotedFrom': {
      relations[name] = entry;
      break;
    }
    case 'wasRevisionOf': {
      const decodedId = decodeEntityId(entry);
      if (Array.isArray(decodedId?.key) && decodedId.key.length === 3) {
        relations[name] = decodedId.key;
      }
      break;
    }
  }
}

type ActivityRelations = {
  used?: SeedDB['activities']['value']['used'];
  wasAssociatedWith: SeedDB['activities']['value']['wasAssociatedWith'];
  wasInformedBy?: SeedDB['activities']['value']['wasInformedBy'];
};

async function deserializeActivities(prov: ProvJson, relationMap: RelationMap) {
  const activities: Record<string, SeedDB['activities']['value']> = {};

  for (const [activityId, activity] of Object.entries(prov.activity)) {
    const decodedActivityId = decodeEntityId(activityId);

    if (!(activityId in relationMap) || !decodedActivityId) {
      continue;
    }

    const relations: ActivityRelations = { wasAssociatedWith: '' };
    for (const [relationName, entry] of Object.entries(
      relationMap[activityId]
    )) {
      deserializeActivityRelations(
        relations,
        relationName as RelationName,
        entry
      );
    }

    const attributes = deserializeAttributes(
      activity
    ) as SeedDB['activities']['value']['attributes'];

    activities[activityId] = {
      ...relations,
      attributes,
      type: decodedActivityId.key[0] as SeedDB['activities']['value']['type'],
      startedAtTime: decodeTimestamp(activity['prov:startTime'] as string),
      endedAtTime: activity['prov:endTime']
        ? decodeTimestamp(activity['prov:endTime'] as string)
        : undefined,
    };
  }

  await Promise.all(
    Object.values(activities).map((activity) =>
      saveObject('activities', activity)
    )
  );

  return activities;
}

function deserializeActivityRelations(
  relations: ActivityRelations,
  name: RelationName,
  entry: ValueOf<RelationMap[string]>
) {
  switch (name) {
    case 'wasAssociatedWith':
      relations[name] = deserializeAgent(entry as string) ?? '';
      break;
    case 'used':
      relations[name] = (entry as string[]).flatMap((id) => {
        const decodedId = decodeEntityId(id);
        if (!decodedId) {
          return [];
        }
        return [
          {
            key: decodedId.key,
            entity: decodedId.storeName as Exclude<
              StoreNames<SeedDB>,
              'activities'
            >,
          },
        ];
      });
      break;
    case 'wasInformedBy':
      relations[name] = (entry as string[]).flatMap((id) => {
        const decodedId = decodeEntityId(id);
        return decodedId ? [decodedId.key as SeedDB['activities']['key']] : [];
      });
      break;
  }
}

function serializeAttributes(entity: SeedDB[StoreNames<SeedDB>]['value']) {
  const attributes: Entity = {};

  for (const [key, value] of Object.entries(entity.attributes)) {
    if (value == null) {
      continue;
    }

    const isTimestamp = key.includes('Time') && Number.isInteger(value);
    if (isTimestamp && value === 0) {
      continue;
    }

    attributes[`${PROV_NAMESPACE}:${key}`] = isTimestamp
      ? encodeTimestamp(value as number)
      : encodeValue(value);
  }

  return attributes;
}

function deserializeAttributes(entity: Entity) {
  return Object.keys(entity).reduce(
    (o, key) => {
      if (key.startsWith(PROV_NAMESPACE)) {
        const value = key.includes('Time')
          ? decodeTimestamp(entity[key] as string)
          : decodeValue(entity[key] as string);

        o[key.replace(`${PROV_NAMESPACE}:`, '')] = value as AttributeValues;
      }
      return o;
    },
    {} as Record<string, AttributeValues>
  );
}

function getRelationId(relationName: RelationName) {
  const abbr = RELATION_ABBREVIATIONS[relationName];
  return `_:${abbr}${relationIds[abbr]++}`;
}

function serializeGeneration(entity: {
  id: string;
  value: SeedDB[Exclude<StoreNames<SeedDB>, 'activities'>]['value'];
}) {
  provJson['wasGeneratedBy'] = provJson['wasGeneratedBy'] ?? {};
  const relationId = getRelationId('wasGeneratedBy');

  provJson['wasGeneratedBy'][relationId] = {
    'prov:activity': encodeEntityId('activities', entity.value.wasGeneratedBy),
    'prov:entity': entity.id,
    'prov:time': encodeTimestamp(entity.value.generatedAtTime),
  };
}

function serializeUsage(entity: {
  id: string;
  value: SeedDB['activities']['value'];
}) {
  const used = entity.value['used'] ?? [];
  if (!used.length) {
    return;
  }

  provJson['used'] = provJson['used'] ?? {};

  for (const item of used) {
    const relationId = getRelationId('used');
    provJson['used'][relationId] = {
      'prov:activity': entity.id,
      'prov:entity': encodeEntityId(item.entity, item.key),
    };
  }
}

function serializeAssociation(entity: {
  id: string;
  value: SeedDB['activities']['value'];
}) {
  provJson['wasAssociatedWith'] = provJson['wasAssociatedWith'] ?? {};
  const relationId = getRelationId('wasAssociatedWith');

  provJson['wasAssociatedWith'][relationId] = {
    'prov:activity': entity.id,
    'prov:agent': `${PROV_NAMESPACE}:${entity.value.wasAssociatedWith}`,
  };
}

function serializeCommunication(entity: {
  id: string;
  value: SeedDB['activities']['value'];
}) {
  const informants = entity.value.wasInformedBy ?? [];
  if (!informants.length) {
    return;
  }

  provJson['wasInformedBy'] = provJson['wasInformedBy'] ?? {};

  for (const informant of informants) {
    const relationId = getRelationId('wasInformedBy');
    provJson['wasInformedBy'][relationId] = {
      'prov:informant': encodeEntityId('activities', informant),
      'prov:informed': entity.id,
    };
  }
}

function serializeQuotation(entity: {
  id: string;
  value: SeedDB['sentences' | 'wordnet_queries' | 'translations']['value'];
}) {
  if (!entity.value.wasQuotedFrom) {
    return;
  }

  provJson['wasDerivedFrom'] = provJson['wasDerivedFrom'] ?? {};
  const relationId = getRelationId('wasDerivedFrom');

  provJson['wasDerivedFrom'][relationId] = {
    'prov:activity': encodeEntityId('activities', entity.value.wasGeneratedBy),
    'prov:generatedEntity': entity.id,
    'prov:type': 'Quotation',
    'prov:usedEntity': entity.value.wasQuotedFrom,
  };
}

function serializeRevision(entity: {
  id: string;
  value: SeedDB['translations']['value'];
}) {
  if (!entity.value.wasRevisionOf) {
    return;
  }

  provJson['wasDerivedFrom'] = provJson['wasDerivedFrom'] ?? {};
  const relationId = getRelationId('wasDerivedFrom');
  provJson['wasDerivedFrom'][relationId] = {
    'prov:activity': encodeEntityId('activities', entity.value.wasGeneratedBy),
    'prov:generatedEntity': entity.id,
    'prov:type': 'Revision',
    'prov:usedEntity': encodeEntityId(
      'translations',
      entity.value.wasRevisionOf
    ),
  };
}

function serializeInvalidation(entity: {
  id: string;
  value: SeedDB['translations']['value'];
}) {
  if (!entity.value.wasInvalidatedBy) {
    return;
  }

  provJson['wasInvalidatedBy'] = provJson['wasInvalidatedBy'] ?? {};
  const relationId = getRelationId('wasInvalidatedBy');
  provJson['wasInvalidatedBy'][relationId] = {
    'prov:activity': encodeEntityId(
      'activities',
      entity.value.wasInvalidatedBy
    ),
    'prov:entity': entity.id,
  };

  if (entity.value.invalidatedAtTime) {
    provJson['wasInvalidatedBy'][relationId]['prov:time'] = encodeTimestamp(
      entity.value.invalidatedAtTime
    );
  }
}

function getRelationFields(relationType: RelationName) {
  switch (relationType) {
    case 'used':
      return { source: 'prov:activity', target: 'prov:entity', multiple: true };
    case 'wasInformedBy':
      return {
        source: 'prov:informed',
        target: 'prov:informant',
        multiple: true,
      };
    case 'wasAssociatedWith':
      return { source: 'prov:activity', target: 'prov:agent', multiple: false };
    case 'wasGeneratedBy':
    case 'wasInvalidatedBy':
      return {
        source: 'prov:entity',
        target: 'prov:activity',
        multiple: false,
      };
    case 'wasDerivedFrom':
      return {
        source: 'prov:generatedEntity',
        target: 'prov:usedEntity',
        multiple: false,
      };
  }
}

type RelationMap = Record<
  string,
  {
    used?: string[];
    wasAssociatedWith?: string;
    wasDerivedFrom?: string;
    wasGeneratedBy?: string;
    wasInformedBy?: string[];
    wasInvalidatedBy?: string;
    wasQuotedFrom?: string;
    wasRevisionOf?: string;
    relationTime?: Record<string, string>;
  }
>;

function mapRelations(prov: ProvJson) {
  const relations: RelationMap = {};

  for (const key of Object.keys(RELATION_ABBREVIATIONS)) {
    const provType = ['wasQuotedFrom', 'wasRevisionOf'].includes(key)
      ? 'wasDerivedFrom'
      : (key as Exclude<RelationName, 'wasQuotedFrom' | 'wasRevisionOf'>);

    const group = prov[provType];
    const fields = getRelationFields(provType);

    if (!group || !fields) {
      continue;
    }

    for (const entry of Object.values(group)) {
      const source = entry[fields.source] as string | undefined;
      const target = entry[fields.target] as string | undefined;

      if (!source || !target) {
        continue;
      }

      let relationKey = key as RelationName;
      if (provType === 'wasDerivedFrom') {
        relationKey =
          entry['prov:type'] === 'Quotation'
            ? 'wasQuotedFrom'
            : 'wasRevisionOf';
      }

      relations[source] = relations[source] ?? {};

      if (fields.multiple) {
        if (!relations[source][relationKey]) {
          (relations[source][relationKey] as string[]) = [];
        }
        (relations[source][relationKey] as string[]).push(target);
      } else {
        (relations[source][relationKey] as string) = target;
      }

      relations[source]['relationTime'] =
        relations[source]['relationTime'] ?? {};

      if (entry['prov:time']) {
        relations[source]['relationTime'][relationKey] = entry['prov:time'];
      }
    }
  }

  return relations;
}
