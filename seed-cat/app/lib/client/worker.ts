// This file is based on https://github.com/xenova/transformers.js/blob/656015fc6b492f1753629ef66307181a2339ff7b/examples/react-translator/src/worker.js
// Licensed under the Apache License, Version 2.0.
import { env, pipeline } from '@xenova/transformers';
import type { TranslationPipeline } from '@xenova/transformers/types/pipelines';
import { GenerationConfigType } from '@xenova/transformers/types/utils/generation';

env.allowLocalModels = false;

class TranslationSingleton {
  static model = 'Xenova/nllb-200-distilled-600M';
  static instance: Promise<TranslationPipeline> | null = null;

  private constructor() {}

  static async getInstance(progress_callback?: Function) {
    if (this.instance === null) {
      this.instance = pipeline<'translation'>('translation', this.model, {
        progress_callback,
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const translator = await TranslationSingleton.getInstance((x: any) => {
    self.postMessage(x);
  });

  const output = await translator(event.data.text, {
    src_lang: event.data.src_lang,
    tgt_lang: event.data.tgt_lang,
    callback_function: (x: any) => {
      self.postMessage({
        status: 'update',
        output: translator.tokenizer.decode(x[0].output_token_ids, {
          skip_special_tokens: true,
        }),
      });
    },
  } as GenerationConfigType);

  self.postMessage({
    status: 'complete',
    output: output,
  });
});
