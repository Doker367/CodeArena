#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

MODEL_DIR="models/madlad400-3b-ct2-int8"
REPO="https://huggingface.co/SoybeanMilk/madlad400-3b-mt-ct2-int8_float16/resolve/main"

if ! command -v uv >/dev/null 2>&1; then
  echo "Se requiere uv (https://docs.astral.sh/uv/). Instálalo y vuelve a intentar."
  exit 1
fi

echo "==> Creando entorno Python 3.12"
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt

mkdir -p "$MODEL_DIR"
for file in model.bin tokenizer.json shared_vocabulary.json config.json; do
  if [ ! -f "$MODEL_DIR/$file" ]; then
    echo "==> Descargando $file (puede tardar; el modelo pesa ~3 GB)"
    curl -L --fail --continue-at - "$REPO/$file" -o "$MODEL_DIR/$file"
  fi
done

# Corpus tseltal-español para la memoria de frases
mkdir -p data
if [ ! -f data/tseltal.csv ]; then
  echo "==> Descargando corpus tseltal (~1.3 MB)"
  curl -L --fail "https://huggingface.co/datasets/danvazquez20/tseltal-madlad/resolve/main/train.csv" -o data/tseltal.csv
fi

echo "==> Listo. Inicia el traductor con:"
echo "    npm run translate"
