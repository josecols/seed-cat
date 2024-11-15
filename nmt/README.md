# Training a Machine Translation Model

This directory contains scripts for preparing data, training, and evaluating a bilingual neural machine translation model.

## Getting Started

Training the model requires an NVIDIA GPU, CUDA, and [NCCL](https://github.com/NVIDIA/nccl). For cloud-based training, it is recommended to use a virtual machine with pre-installed packages for convenience, such as the [Google Cloud Deep Learning VM](https://cloud.google.com/deep-learning-vm/docs/) or [Amazon Deep Learning Containers](https://docs.aws.amazon.com/deep-learning-containers/latest/devguide/deep-learning-containers-images.html).

### Prerequisites

1. Install [`fairseq`](https://github.com/facebookresearch/fairseq):
    ```sh
    git clone https://github.com/pytorch/fairseq
    cd fairseq
    git checkout 920a548ca770fb1a951f7f4289b4d3a0c1bc226f
    pip install --editable ./
    ```

2. Install [`SentencePiece`](https://github.com/google/sentencepiece):
    ```sh
    git clone https://github.com/google/sentencepiece.git 
    cd sentencepiece
    git checkout d8f741853847553169444afc12c00f4bbff3e9ce
    mkdir build
    cd build
    cmake ..
    make -j $(nproc)
    sudo make install
    sudo ldconfig -v
    ```

3. Install [`sacrebleu`](https://github.com/mjpost/sacrebleu) for evaluation:
    ```sh
    pip install sacrebleu
    ```

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/josecols/seed-cat.git
    cd seed-cat/nmt
    ```

2. Set up the `train`, `valid`, and `test` data directories.

    For instance, if you're training an English-Spanish model, you can use the Seed and [`FLORES+`](https://huggingface.co/datasets/openlanguagedata/flores_plus) datasets. Download the [`eng_Latn`](https://huggingface.co/datasets/openlanguagedata/oldi_seed/viewer/default/train?q=eng) corpus from Seed and the [latest release](https://huggingface.co/datasets/openlanguagedata/flores_plus) of the FLORES+ dataset. For FLORES+, use the `dev` split for validation and the `devtest` split for testing.

    Example directory structure:

    ```sh
    nmt/
    ├── train/
    │   ├── eng
    │   ├── spa
    ├── valid/
    │   ├── eng
    │   ├── spa
    ├── test/
    │   ├── eng
    │   ├── spa
    ```

## Usage

Before preparing the data, configure the language pair and specify the path to the `sentencepiece` installation in the `vars.sh` script. You can also set a `wandb` project name to track training jobs and metrics.

### Data Preparation

The `prepare.sh` script trains a SentencePiece model using a combined vocabulary from the training data of both languages. This model is used to tokenize the text into sub-word units. Additionally, the script creates a `fairseq` dictionary and binarizes the data.

```sh
bash prepare.sh
```

### Training

You can configure the model architecture and training parameters in the `train.sh` script. This script trains a transformer model using `fairseq-train` and selects the best model checkpoint based on the validation BLEU score.

```sh
bash train.sh
```

### Evaluation

The `eval.sh` script generates translation hypotheses for the `test` set and evaluates them using `sacrebleu`. The default metric reported is `chrF`.

```sh
bash eval.sh
```
