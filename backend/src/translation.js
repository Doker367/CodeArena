const { LANGUAGES, TRANSLATION_RESEARCH } = require("./languages");

const LOCAL_SERVICE = (process.env.TRANSLATE_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
const MADLAD_TARGETS = new Set(["tzo", "tzh", "ctu", "toj", "mam", "cak", "jac", "knj", "yua"]);

async function tryLocalService(text, target) {
  if (!MADLAD_TARGETS.has(target)) return null;
  try {
    const response = await fetch(`${LOCAL_SERVICE}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.available) {
      return {
        available: false,
        provider: data.provider || "madlad-400-3b-local",
        reason: data.reason || "El traductor local no pudo procesar esta frase.",
        target,
      };
    }
    if (!data.text) return null;
    return {
      available: true,
      text: data.text,
      provider: data.provider || "madlad-400-3b-local",
      target,
      warning:
        data.warning ||
        "Traducción automática de MADLAD-400. Puede requerir revisión de una persona hablante.",
      elapsedMs: data.elapsed_ms,
    };
  } catch {
    return null;
  }
}

/**
 * Traducción automática opt-in.
 *
 * 1) Servicio local MADLAD-400 (recomendado): cubre tsotsil, tseltal, ch'ol,
 *    tojolabal, mam, kaqchikel, jacalteco, kanjobal y maya yucateco.
 * 2) Hugging Face (modelo experimental tsotsil→español), si hay token.
 * 3) Derivación a intérprete humano.
 */
async function translateText({ text, source = "es", target }) {
  const clean = String(text ?? "").trim();
  const language = LANGUAGES.find((l) => l.code === target);

  if (!clean) {
    return { available: false, error: "Escribe un texto para traducir." };
  }
  if (clean.length > 1200) {
    return { available: false, error: "El texto supera los 1,200 caracteres." };
  }
  if (target === source) {
    return { available: true, text: clean, provider: "same", target };
  }

  const local = await tryLocalService(clean, target);
  if (local?.available) return local;

  const hfEnabled = process.env.TRANSLATE_PROVIDER === "hf" && Boolean(process.env.HF_TOKEN);
  const model = process.env.HF_TRANSLATION_MODEL || "Joseph18/tsotsil-es-translator";

  if (hfEnabled && target === "es" && source === "tzo") {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: clean, options: { wait_for_model: true } }),
      });
      if (!response.ok) throw new Error(`HF ${response.status}`);
      const data = await response.json();
      const translated = Array.isArray(data)
        ? data[0]?.translation_text ?? data[0]?.generated_text ?? ""
        : data?.translation_text ?? data?.generated_text ?? "";
      if (translated) {
        return {
          available: true,
          text: translated,
          provider: "hf-tsotsil-experimental",
          target,
          warning: "Traducción automática experimental. Requiere revisión de una persona hablante.",
        };
      }
      throw new Error("Respuesta vacía de Hugging Face");
    } catch (error) {
      return {
        available: false,
        provider: "hf-tsotsil-experimental",
        reason:
          "El modelo experimental de tsotsil no respondió o el token no tiene acceso. Puedes solicitar un intérprete comunitario.",
        error: error.message,
        language,
        research: TRANSLATION_RESEARCH,
      };
    }
  }

  if (local && !local.available) {
    return { ...local, language, research: TRANSLATION_RESEARCH };
  }

  return {
    available: false,
    provider: "none",
    reason:
      "No hay un traductor automático activo en este momento. Google y Microsoft solo cubren maya yucateco; NLLB-200 no incluye lenguas de Chiapas. Puedes iniciar el servicio local MADLAD-400 o solicitar una persona intérprete de la red comunitaria.",
    language,
    research: TRANSLATION_RESEARCH,
  };
}

module.exports = { translateText, MADLAD_TARGETS };
