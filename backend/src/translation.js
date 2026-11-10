const { LANGUAGES, TRANSLATION_RESEARCH } = require("./languages");

/**
 * Traducción automática opt-in.
 *
 * En 2026 no existe un proveedor público confiable para las lenguas de
 * Chiapas. Habilitamos únicamente el modelo experimental de tsotsil→español
 * cuando el operador configura HF_TOKEN y TRANSLATE_PROVIDER=hf.
 * Cualquier otro par devuelve disponible:false para derivar a intérprete.
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

  return {
    available: false,
    provider: "none",
    reason:
      "No existe traducción automática confiable para esta lengua. Google y Microsoft solo cubren maya yucateco, y NLLB-200 no incluye lenguas de Chiapas. Te conectamos con una persona intérprete de la red comunitaria.",
    language,
    research: TRANSLATION_RESEARCH,
  };
}

module.exports = { translateText };
