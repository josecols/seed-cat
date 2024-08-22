#!/bin/bash

source ./vars.sh

# Train the SentencePiece model.
$SPM_TRAIN --input="$TRAIN_PATH/$SOURCE_LANG,$TRAIN_PATH/$TARGET_LANG" \
    --character_coverage=1.0 \
    --model_prefix="$MODEL_PREFIX" \
    --model_type=bpe \
    --num_threads="$(nproc)" \
    --max_sentence_length=256 \
    --vocab_size=8000 \
    --shuffle_input_sentence=true \
    --bos_id=0 --pad_id=1 --eos_id=2 --unk_id=3

# Format the vocabulary file for fairseq.
# https://github.com/facebookresearch/fairseq/issues/459
cut -f1 "$MODEL_PREFIX.vocab" | tail -n +5 | sed "s/$/ 100/g" > "$MODEL_PREFIX.dict"

# Encode the datasets with SentencePiece.
encode "train"
encode "valid"
encode "test"

# Binarize the datasets for fairseq.
fairseq-preprocess \
    --bpe sentencepiece \
    --dataset-impl "$DATASET_IMPL" \
    --destdir "$BIN_PATH" \
    --joined-dictionary \
    --source-lang "$SOURCE_LANG" \
    --srcdict "$MODEL_PREFIX.dict" \
    --target-lang "$TARGET_LANG" \
    --testpref "$ROOT/test.spm" \
    --trainpref "$ROOT/train.spm" \
    --validpref "$ROOT/valid.spm" \
    --workers "$(nproc)"
