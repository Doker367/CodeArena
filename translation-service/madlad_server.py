#!/usr/bin/env python3
"""
Servicio local de traducción con MADLAD-400 (3B, CTranslate2 int8).

MADLAD-400 cubre tsotsil, tseltal, ch'ol, tojolabal, mam, kaqchikel y jacalteco.
No requiere GPU: funciona en CPU (Apple Silicon / x86) con el modelo cuantizado.

Uso:
  translation-service/.venv/bin/python translation-service/madlad_server.py
  PORT=5001 MODEL_DIR=translation-service/models/madlad400-3b-ct2-int8 ...
"""
from __future__ import annotations

import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import ctranslate2
from tokenizers import Tokenizer

from tseltal_memory import TseltalMemory

MODEL_DIR = os.environ.get(
    "MODEL_DIR",
    os.path.join(os.path.dirname(__file__), "models", "madlad400-3b-ct2-int8"),
)
TOKENIZER_PATH = os.path.join(MODEL_DIR, "tokenizer.json")
PORT = int(os.environ.get("PORT", "5001"))
SUPPORTED = {"tzo", "tzh", "ctu", "toj", "mam", "cak", "jac", "knj", "yua"}

print(f"[madlad] cargando modelo desde {MODEL_DIR}", flush=True)
tokenizer = Tokenizer.from_file(TOKENIZER_PATH)
translator = ctranslate2.Translator(
    MODEL_DIR,
    device="cpu",
    compute_type=os.environ.get("COMPUTE_TYPE", "int8"),
    inter_threads=1,
    intra_threads=int(os.environ.get("THREADS", "4")),
)
tseltal_memory = TseltalMemory()
print(f"[madlad] modelo listo · memoria tseltal: {tseltal_memory.size} frases", flush=True)


def normalize_text(value: str) -> str:
    import re
    import unicodedata

    value = unicodedata.normalize("NFD", value.lower())
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    value = re.sub(r"[^a-z0-9ñü ]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def is_unstable(source: str, output: str) -> bool:
    src = normalize_text(source)
    out = normalize_text(output)
    if not out or out == src:
        return True
    source_words = set(src.split())
    output_words = out.split()
    if output_words:
        echoed = sum(1 for word in output_words if word in source_words or (len(word) > 3 and word[:4] in src))
        if echoed / len(output_words) > 0.72:
            return True
    words = output.split()
    for size in (4, 6):
        grams = [tuple(words[i : i + size]) for i in range(0, max(0, len(words) - size + 1))]
        if grams:
            from collections import Counter
            if Counter(grams).most_common(1)[0][1] >= 3:
                return True
    return False


def translate(text: str, target: str) -> dict:
    started = time.time()
    if target not in SUPPORTED:
        raise ValueError(f"Lengua no soportada por MADLAD: {target}")
    clean = " ".join(str(text).split())
    if not clean:
        raise ValueError("Texto vacío")
    if len(clean) > 1200:
        raise ValueError("El texto supera los 1,200 caracteres")

    if target == "tzh":
        remembered = tseltal_memory.translate(clean)
        if remembered:
            remembered["elapsed_ms"] = round((time.time() - started) * 1000)
            return remembered

    encoding = tokenizer.encode(f"<2{target}> {clean}")
    tokens = encoding.tokens
    if tokens and tokens[-1] == "</s>":
        tokens = tokens[:-1]

    results = translator.translate_batch(
        [tokens],
        beam_size=int(os.environ.get("BEAM_SIZE", "2")),
        max_decoding_length=256,
        repetition_penalty=1.05,
    )
    output_tokens = results[0].hypotheses[0]
    ids = [tokenizer.token_to_id(token) for token in output_tokens]
    ids = [i for i in ids if i is not None]
    translated = tokenizer.decode(ids, skip_special_tokens=True).strip()

    # MADLAD-400 tiene cobertura limitada de estas lenguas. Detectamos salidas
    # inestables (texto sin traducir, bucles o mayormente español) para no
    # presentar una mala traducción como válida.
    if not translated or is_unstable(clean, translated):
        return {
            "available": False,
            "provider": "madlad-400-3b-local",
            "target": target,
            "reason": (
                "El modelo no produjo una traducción estable para esta frase. "
                "En tseltal puedes probar una frase frecuente; para textos nuevos, "
                "solicita una persona intérprete de la red comunitaria."
            ),
        }

    return {
        "available": True,
        "text": translated,
        "provider": "madlad-400-3b-local",
        "target": target,
        "elapsed_ms": round((time.time() - started) * 1000),
        "warning": "Traducción automática de MADLAD-400. Puede requerir revisión de una persona hablante.",
    }


class Handler(BaseHTTPRequestHandler):
    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            return self._json(200, {"ok": True, "provider": "madlad-400-3b-local", "languages": sorted(SUPPORTED), "tseltal_phrases": tseltal_memory.size})
        self._json(404, {"error": "Ruta no encontrada"})

    def do_POST(self) -> None:
        if self.path != "/translate":
            return self._json(404, {"error": "Ruta no encontrada"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            result = translate(payload.get("text", ""), payload.get("target", ""))
            self._json(200, result)
        except ValueError as error:
            self._json(400, {"available": False, "error": str(error)})
        except Exception as error:  # noqa: BLE001
            print("[madlad] error", error, flush=True)
            self._json(500, {"available": False, "error": "Error interno del traductor"})

    def log_message(self, fmt: str, *args) -> None:
        print(f"[madlad] {self.address_string()} {fmt % args}", flush=True)


if __name__ == "__main__":
    print(f"[madlad] escuchando en http://127.0.0.1:{PORT}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
