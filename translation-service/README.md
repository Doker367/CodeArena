# Traductor local MADLAD-400

Servicio HTTP opcional que traduce español → lenguas de Chiapas usando
**MADLAD-400 3B** convertido a CTranslate2 int8. Funciona en CPU.

Lenguas cubiertas: tsotsil (`tzo`), tseltal (`tzh`), ch'ol (`ctu`), tojolabal (`toj`),
mam (`mam`), kaqchikel (`cak`), jacalteco (`jac`), kanjobal (`knj`) y maya yucateco (`yua`).

## Instalación (una vez, ~3 GB)

```bash
npm run translate:setup
```

## Uso

En otra terminal:

```bash
npm run translate        # http://127.0.0.1:5001
npm run dev:all          # API + web + traductor
```

El backend lo detecta automáticamente en `TRANSLATE_SERVICE_URL`
(default `http://127.0.0.1:5001`) y lo usa antes que cualquier otro proveedor.
Si no está activo, la app deriva a intérprete humano.

## Notas

- Modelo abierto de Google: https://huggingface.co/google/madlad400-3b-mt
- Conversión CTranslate2: https://huggingface.co/SoybeanMilk/madlad400-3b-mt-ct2-int8_float16
- La salida es automática y **debe revisarse** por una persona hablante de la variante.
- El modelo y el `.venv` no se versionan.
