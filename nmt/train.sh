#!/bin/bash

source ./vars.sh

ulimit -n 500000

# Based on bilingual experiments from https://aclanthology.org/2023.acl-long.154/.

CUDA_VISIBLE_DEVICES=0 fairseq-train \
    "$BIN_PATH" \
    --adam-betas '(0.9, 0.98)' \
    --adam-eps 1e-06 \
    --arch transformer \
    --attention-dropout 0.2 \
    --best-checkpoint-metric bleu \
    --bpe sentencepiece \
    --clip-norm 0.0 \
    --criterion label_smoothed_cross_entropy \
    --decoder-ffn-embed-dim 4096 \
    --decoder-normalize-before \
    --dropout 0.3 \
    --encoder-ffn-embed-dim 4096 \
    --encoder-normalize-before \
    --eval-bleu \
    --eval-bleu-args '{"beam": 5, "max_len_a": 1.2, "max_len_b": 10}' \
    --eval-bleu-detok space \
    --eval-bleu-print-samples \
    --eval-bleu-remove-bpe sentencepiece \
    --keep-last-epochs 1 \
    --label-smoothing 0.1 \
    --log-format json \
    --log-interval 100 \
    --lr 0.001 \
    --lr-scheduler inverse_sqrt \
    --max-epoch 2000 \
    --max-tokens 8000 \
    --maximize-best-checkpoint-metric \
    --optimizer adam \
    --relu-dropout 0.2 \
    --save-interval 10 \
    --seed 2 \
    --sentencepiece-model "$MODEL_PREFIX.model" \
    --share-all-embeddings \
    --update-freq 16 \
    --validate-interval 5 \
    --wandb-project "$WANDB_PROJECT" \
    --warmup-init-lr 1e-07 \
    --warmup-updates 400 \
    --weight-decay 0.0001
