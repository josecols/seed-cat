#!/bin/bash

DEBUG=0

# Languages
SOURCE_LANG=eng
TARGET_LANG=spa

# Paths
ROOT=$(dirname "$0")
TRAIN_PATH=$ROOT/train
VALID_PATH=$ROOT/valid
TEST_PATH=$ROOT/test
RESULTS_PATH=$ROOT/results
MODEL_PREFIX=$ROOT/spm
BIN_PATH=$ROOT/bin/

# WandB
WANDB_CONSOLE=off
WANDB_PROJECT=wmt24-oldi

# Fairseq Variables
LANGS="$SOURCE_LANG,$TARGET_LANG"
LANG_PAIRS="$SOURCE_LANG-$TARGET_LANG,$TARGET_LANG-$SOURCE_LANG"

DATASET_IMPL="mmap"
if [ "$DEBUG" -eq 1 ]; then
    DATASET_IMPL="raw"
fi

# SentencePiece Variables
SPM=$ROOT/../../sentencepiece/build/src
SPM_TRAIN="$SPM/spm_train"
SPM_ENCODE="$SPM/spm_encode"

set -e

encode() {
  local _DATA_TYPE=$1
  local _PATH=$ROOT

  case $_DATA_TYPE in
    train)
      _PATH=$TRAIN_PATH
      ;;
    valid)
      _PATH=$VALID_PATH
      ;;
    test)
      _PATH=$TEST_PATH
      ;;
    *)
      echo "Invalid data type: $_DATA_TYPE"
      exit 1
      ;;
  esac

  for LANG in $SOURCE_LANG $TARGET_LANG; do
    $SPM_ENCODE \
      --model="$MODEL_PREFIX.model" \
      --output_format=piece < "$_PATH/$LANG" > "$ROOT/$_DATA_TYPE.spm.$LANG"
  done
}