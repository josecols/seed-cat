import React, { createContext, useCallback, useMemo, useRef } from 'react';

import {
  Activity,
  Agent,
  SeedDB,
  getLatestTranslation,
  getObject,
  getTranslatorAgentId,
  saveObject,
} from '@/app/lib/client/db';

export type ActivityContextValue = {
  activities: {
    [key in Activity]: React.MutableRefObject<
      Array<SeedDB['activities']['key']>
    >;
  };
  startActivity: (
    type: Activity,
    values?: Partial<SeedDB['activities']['value']>
  ) => Promise<SeedDB['activities']['key'] | undefined>;
  endActivity: (
    type: Activity
  ) => Promise<SeedDB['activities']['key'] | undefined>;
};

export const ActivityContext = createContext<ActivityContextValue>({
  activities: createActivities(),
  startActivity: async () => undefined,
  endActivity: async () => undefined,
});

type ActivityProviderProps = {
  children: React.ReactNode;
  index: number;
  languagePair: string;
};

export function ActivityProvider({
  children,
  languagePair,
  index,
}: ActivityProviderProps) {
  const [sourceLanguage, targetLanguage] = languagePair.split('-');
  const activitiesRef = useRef(createActivities());

  const getActivityValues = useCallback(
    async (type: Activity): Promise<Partial<SeedDB['activities']['value']>> => {
      switch (type) {
        case Activity.OpenSourceUrl:
        case Activity.TokenizeSentence:
          return {
            used: [{ entity: 'sentences', key: [sourceLanguage, index] }],
          };
        case Activity.DisplayPosTags:
          return {
            used: [{ entity: 'pos_tags', key: [sourceLanguage, index] }],
          };
        case Activity.GeneratePosTags:
        case Activity.QueryWordnet:
          return {
            used: [{ entity: 'tokens', key: [sourceLanguage, index] }],
          };
        case Activity.MachineTranslate:
          return {
            used: [
              { entity: 'target_languages', key: targetLanguage },
              { entity: 'sentences', key: [sourceLanguage, index] },
            ],
          };
        case Activity.CompareMachineTranslation: {
          const key: [string, number] = [targetLanguage, index];
          const used: SeedDB['activities']['value']['used'] = [
            { entity: 'sentences', key },
          ];

          const translation = await getLatestTranslation(targetLanguage, index);
          if (translation) {
            used.push({
              entity: 'translations',
              key: [...key, translation.generatedAtTime],
            });
          }

          const machineTranslation = await getObject(
            'machine_translations',
            key
          );
          if (machineTranslation) {
            used.push({ entity: 'machine_translations', key });
          }

          return { used };
        }
        case Activity.EditTranslation: {
          const used: SeedDB['activities']['value']['used'] = [
            { entity: 'target_languages', key: targetLanguage },
          ];
          const currentTranslation = await getLatestTranslation(
            targetLanguage,
            index
          );
          if (currentTranslation && !currentTranslation.invalidatedAtTime) {
            used.push({
              entity: 'translations',
              key: [targetLanguage, index, currentTranslation.generatedAtTime],
            });
          }

          const informants = [
            activitiesRef.current[Activity.CompareMachineTranslation].current,
            activitiesRef.current[Activity.DisplayPosTags].current,
            activitiesRef.current[Activity.MachineTranslate].current,
            activitiesRef.current[Activity.OpenSourceUrl].current,
            activitiesRef.current[Activity.QueryWordnet].current,
            activitiesRef.current[Activity.ViewSentence].current,
          ].filter((activity) => activity.length > 0);

          return {
            used,
            wasInformedBy: informants.flat(),
          };
        }
        default:
          return {};
      }
    },
    [index, sourceLanguage, targetLanguage]
  );

  const validateActivityGatekeeper = useCallback(
    async (type: Activity): Promise<boolean> => {
      switch (type) {
        case Activity.ViewSentence:
          return !(await getObject('sentences', [sourceLanguage, index]));
        case Activity.DisplayPosTags:
          return Boolean(await getObject('pos_tags', [sourceLanguage, index]));
        case Activity.GeneratePosTags:
          return !(await getObject('pos_tags', [sourceLanguage, index]));
        case Activity.TokenizeSentence:
          return !(await getObject('tokens', [sourceLanguage, index]));
        case Activity.QueryWordnet:
          return Boolean(await getObject('tokens', [sourceLanguage, index]));
        case Activity.MachineTranslate:
          return !(await getObject('machine_translations', [
            targetLanguage,
            index,
          ]));
        default:
          return true;
      }
    },
    [index, sourceLanguage, targetLanguage]
  );

  const startActivity = useCallback(
    async (type: Activity, values?: Partial<SeedDB['activities']['value']>) => {
      const gatekeeperPassed = await validateActivityGatekeeper(type);
      if (!gatekeeperPassed) {
        console.warn(`Gatekeeper prevented logging activity: ${type}`);
        return;
      }

      const predefinedValues = await getActivityValues(type);

      let agent: string = ActivityAgent[type];
      if (agent === Agent.Translator) {
        agent = getTranslatorAgentId();
      }

      const activity = await saveObject('activities', {
        attributes: {
          targetLanguage,
          index,
        },
        startedAtTime: Date.now(),
        ...predefinedValues,
        wasAssociatedWith: agent,
        ...values,
        type,
      });
      activitiesRef.current[type].current.push(activity);

      return activity;
    },
    [getActivityValues, index, targetLanguage, validateActivityGatekeeper]
  );

  async function endActivity(type: Activity) {
    const activityKey = activitiesRef.current[type].current.at(-1);
    if (!activityKey) {
      return;
    }

    const activity = await getObject('activities', activityKey);

    if (activity && !activity.endedAtTime) {
      return await saveObject('activities', {
        ...activity,
        endedAtTime: Date.now(),
      });
    }
  }

  const contextValue: ActivityContextValue = useMemo(() => {
    return {
      activities: activitiesRef.current,
      startActivity,
      endActivity,
    };
  }, [startActivity]);

  return (
    <ActivityContext.Provider value={contextValue}>
      {children}
    </ActivityContext.Provider>
  );
}

function createActivities(): ActivityContextValue['activities'] {
  return Object.values(Activity).reduce(
    (acc, activity) => {
      acc[activity] = { current: [] };
      return acc;
    },
    {} as ActivityContextValue['activities']
  );
}

const ActivityAgent: Record<Activity, Agent> = {
  [Activity.CompareMachineTranslation]: Agent.Translator,
  [Activity.CreateTargetLanguage]: Agent.Translator,
  [Activity.DisplayPosTags]: Agent.Translator,
  [Activity.EditTranslation]: Agent.Translator,
  [Activity.GeneratePosTags]: Agent.BrillPosTagger,
  [Activity.MachineTranslate]: Agent.NLLBTranslatorWorker,
  [Activity.OpenSourceUrl]: Agent.Translator,
  [Activity.QueryWordnet]: Agent.Translator,
  [Activity.TokenizeSentence]: Agent.TreebankTokenizer,
  [Activity.ViewSentence]: Agent.Translator,
};
