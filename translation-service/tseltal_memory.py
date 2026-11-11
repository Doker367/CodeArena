"""Memoria de frases tseltal–español (corpus público de danvazquez20/tseltal).

Se usa antes del modelo generativo: si la frase ya existe en el corpus, devuelve
una traducción humana real en lugar de una inferencia. Para frases desconocidas
el servicio cae a MADLAD-400 con advertencia.
"""
from __future__ import annotations

import csv
import os
import re
import unicodedata

DEFAULT_PATH = os.path.join(os.path.dirname(__file__), "data", "tseltal.csv")

# Frases de uso comercial documentadas en el corpus o en léxicos tseltales.
PHRASEBOOK = {
    "cuanto cuesta": "¿Bin utʼil stojol?",
    "cuanto cuesta el cafe": "¿Bin utʼil stojol te kape?",
    "buenos dias": "¡Ba me ayat yameʼ! (a una mujer) / ¡Laʼ me chʼa mam! (a un hombre)",
    "gracias": "Wokol awal",
    "cafe": "kape",
    "mercado": "chʼiwich",
    "dinero": "takʼin",
    "comprar": "man",
    "vender": "chon",
    "pagar": "toj",
    "quiero comprar": "Ya jkʼan jman",
}


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9ñü ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


class TseltalMemory:
    def __init__(self, path: str = DEFAULT_PATH) -> None:
        self.exact: dict[str, str] = {}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as handle:
                for row in csv.DictReader(handle):
                    if row.get("target_lang") != "es" or row.get("source_lang") != "tzh":
                        continue
                    source = (row.get("source_sentence") or "").strip()
                    target = (row.get("target_sentence") or "").strip()
                    key = normalize(target)
                    if key and source and key not in self.exact:
                        self.exact[key] = source
        for key, value in PHRASEBOOK.items():
            self.exact.setdefault(normalize(key), value)

    @property
    def size(self) -> int:
        return len(self.exact)

    def translate(self, text: str) -> dict | None:
        key = normalize(text)
        if not key:
            return None
        if key in self.exact:
            return {
                "available": True,
                "text": self.exact[key],
                "provider": "tseltal-memory",
                "target": "tzh",
                "warning": "Frase recuperada del corpus tseltal-español; revisa la variante regional.",
            }
        # Coincidencia por frase clave (p. ej. «¿cuánto cuesta el café?»).
        if "cuanto cuesta" in key:
            return {
                "available": True,
                "text": "¿Bin utʼil stojol?",
                "provider": "tseltal-memory",
                "target": "tzh",
                "warning": "Frase frecuente del corpus tseltal. Revisa la variante regional.",
            }
        return None
