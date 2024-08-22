#!/bin/bash

source ./vars.sh

fairseq-interactive \
    "$BIN_PATH" \
    --batch-size 1 \
    --beam 5 \
    --path "$ROOT/checkpoints/checkpoint_best.pt" \
    --remove-bpe sentencepiece \
    --source-lang "$SOURCE_LANG" \
    --target-lang "$TARGET_LANG"
