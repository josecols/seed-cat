#!/bin/bash

source ./vars.sh

SUBSET=${1:-test}

# https://github.com/facebookresearch/fairseq/issues/3000
# https://github.com/facebookresearch/fairseq/issues/3103
# https://github.com/facebookresearch/fairseq/issues/808
echo "Generating translations for the '$SUBSET' dataset."
fairseq-generate \
    "$BIN_PATH" \
    --batch-size 1 \
    --beam 5 \
    --bpe sentencepiece \
    --dataset-impl "$DATASET_IMPL" \
    --gen-subset "$SUBSET" \
    --path "$ROOT/checkpoints/checkpoint_best.pt" \
    --required-batch-size-multiple 1 \
    --results-path "$RESULTS_PATH" \
    --sentencepiece-model "$MODEL_PREFIX.model" \
    --source-lang "$SOURCE_LANG" \
    --target-lang "$TARGET_LANG"

grep "^D-" "$RESULTS_PATH/generate-$SUBSET.txt" | LC_ALL=C sort -V | cut -f3 > "$RESULTS_PATH/$TARGET_LANG.hyp"

_PATH=$TEST_PATH

if [ "$SUBSET" == "valid" ]; then
    _PATH=$VALID_PATH
fi

# https://github.com/facebookresearch/flores/blob/main/flores200/README.md#evaluation
sacrebleu -m chrf --chrf-word-order 2 "$_PATH/$TARGET_LANG" < "$RESULTS_PATH/$TARGET_LANG.hyp"
