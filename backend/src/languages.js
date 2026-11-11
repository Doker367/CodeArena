/**
 * Lenguas originarias reconocidas por la Constitución de Chiapas (Art. 7)
 * y recursos reales de traducción/consulta disponibles a 2026.
 *
 * Cifras aproximadas: INEGI 2020 / CELALI. No sustituyen un censo lingüístico.
 */
const LANGUAGES = [
  {
    code: "tzh",
    name: "Tseltal",
    nativeName: "Bats'il k'op",
    family: "Maya (tseltalano)",
    speakers: 562000,
    speakersLabel: "~562,000 hablantes",
    status: "vital",
    region: "Altos, Selva y Norte",
    municipalities: "Ocosingo, Oxchuc, Altamirano, Tenejapa, Bachajón",
    color: "#2C694E",
    description:
      "Lengua maya de las tierras altas y la Selva. Es la lengua indígena más hablada de Chiapas y una de las tres más habladas de México.",
    resources: [
      { label: "DITSEL · Diccionario Tseltal en línea", url: "https://ditsel.aldelim.org", kind: "diccionario" },
      {
        label: "INALI · Diccionario multidialectal del tseltal (PDF)",
        url: "https://site.inali.gob.mx/publicaciones/diccionario_multidialectal_en_tseltal.pdf",
        kind: "diccionario",
      },
    ],
  },
  {
    code: "tzo",
    name: "Tsotsil",
    nativeName: "Bats'i k'op",
    family: "Maya (tseltalano)",
    speakers: 531000,
    speakersLabel: "~531,000 hablantes",
    status: "vital",
    region: "Altos y Norte",
    municipalities: "San Juan Chamula, Zinacantán, San Cristóbal, Pantelhó, Chenalhó",
    color: "#1B382B",
    description:
      "Lengua maya de los Altos de Chiapas, con una tradición oral y textil muy viva. Es la segunda lengua indígena con más hablantes en el estado.",
    resources: [
      { label: "Glosbe · Diccionario Tsotsil–Español", url: "https://es.glosbe.com/tzo/es", kind: "diccionario" },
      { label: "Pueblos Originarios · Diccionario tzotzil", url: "https://pueblosoriginarios.com/lenguas/tzotzil.php", kind: "diccionario" },
    ],
  },
  {
    code: "ctu",
    name: "Ch'ol",
    nativeName: "Lakty'an",
    family: "Maya (ch'olano)",
    speakers: 254000,
    speakersLabel: "~254,000 hablantes",
    status: "vital",
    region: "Norte y Selva",
    municipalities: "Tila, Tumbalá, Salto de Agua, Palenque, Sabanilla",
    color: "#3B6939",
    description:
      "Lengua maya ch'olana del norte de Chiapas. Su territorio coincide con parte de la zona arqueológica maya y la Selva Lacandona.",
    resources: [
      { label: "INALI · Atlas de las Lenguas Indígenas", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "SIL México · Recursos ch'ol", url: "https://mexico.sil.org", kind: "diccionario" },
    ],
  },
  {
    code: "zoc",
    name: "Zoque",
    nativeName: "Otetzane",
    family: "Mixe–zoque",
    speakers: 52000,
    speakersLabel: "~52,000 hablantes",
    status: "riesgo",
    region: "Norte y Centro",
    municipalities: "Rayón, Chapultenango, Francisco León, Copainalá, Ocotepec",
    color: "#8E5A00",
    description:
      "La única lengua de la familia mixe–zoque en Chiapas. Tiene una tradición de oralidad, música y medicina comunitaria.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "SIL México · Lenguas zoques", url: "https://mexico.sil.org", kind: "diccionario" },
    ],
  },
  {
    code: "toj",
    name: "Tojolabal",
    nativeName: "Tojol-ab'al",
    family: "Maya (tojolabalano)",
    speakers: 73000,
    speakersLabel: "~73,000 hablantes",
    status: "riesgo",
    region: "Selva y Frontera",
    municipalities: "Las Margaritas, Comitán, La Trinitaria, Altamirano",
    color: "#5D2879",
    description:
      "Lengua maya de la frontera sur, con una fuerte organización comunitaria y tradición agrícola.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "SIL México · Recursos tojolabal", url: "https://mexico.sil.org", kind: "diccionario" },
    ],
  },
  {
    code: "mam",
    name: "Mam",
    nativeName: "Ta Yol Mam",
    family: "Maya (mameano)",
    speakers: 12000,
    speakersLabel: "~12,000 hablantes",
    status: "riesgo",
    region: "Soconusco y Frontera",
    municipalities: "Motozintla, Unión Juárez, Tapachula, Cacahoatán",
    color: "#A33419",
    description:
      "Lengua maya de origen guatemalteco con presencia histórica en la frontera del Soconusco.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "Maya Bridge · Intérpretes de lenguas mayas", url: "https://www.mayabridge.org", kind: "interprete" },
    ],
  },
  {
    code: "cak",
    name: "Kakchikel",
    nativeName: "Kaqchikel",
    family: "Maya (quicheano)",
    speakers: 2500,
    speakersLabel: "~2,500 hablantes",
    status: "riesgo",
    region: "Frontera",
    municipalities: "Frontera Comalapa, La Trinitaria",
    color: "#1C5177",
    description:
      "Lengua maya quicheana hablada por comunidades fronterizas con Guatemala.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "Maya Bridge · Intérpretes de lenguas mayas", url: "https://www.mayabridge.org", kind: "interprete" },
    ],
  },
  {
    code: "lac",
    name: "Lacandón",
    nativeName: "Hach T'an",
    family: "Maya (yucatecano)",
    speakers: 1000,
    speakersLabel: "~1,000 hablantes",
    status: "critico",
    region: "Selva Lacandona",
    municipalities: "Ocosingo (Nahá, Lacanjá Chansayab), Palenque",
    color: "#78350F",
    description:
      "Lengua maya yucatecana de las comunidades lacandonas de la Selva. Es uno de los patrimonios lingüísticos más frágiles de Chiapas.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "CELALI · Centro Estatal de Lenguas y Literaturas Indígenas", url: "https://www.celali.gob.mx", kind: "institucional" },
    ],
  },
  {
    code: "mto",
    name: "Mochó",
    nativeName: "Qato'k",
    family: "Maya (mochoano)",
    speakers: 90,
    speakersLabel: "< 100 hablantes",
    status: "critico",
    region: "Frontera y Soconusco",
    municipalities: "Motozintla, Tuzantán",
    color: "#651300",
    description:
      "La lengua más amenazada de Chiapas. Su transmisión intergeneracional es crítica; quedan pocas personas hablantes.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "CELALI · Rescate de lenguas en riesgo", url: "https://www.celali.gob.mx", kind: "institucional" },
    ],
  },
  {
    code: "jac",
    name: "Jacalteco",
    nativeName: "Popti'",
    family: "Maya (kanjobalano)",
    speakers: 1500,
    speakersLabel: "~1,500 hablantes",
    status: "riesgo",
    region: "Frontera",
    municipalities: "Amatenango de la Frontera, Frontera Comalapa",
    color: "#4B6354",
    description:
      "También llamado Popti'. Lengua maya de comunidades fronterizas con Guatemala.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "Maya Bridge · Intérpretes", url: "https://www.mayabridge.org", kind: "interprete" },
    ],
  },
  {
    code: "cac",
    name: "Chuj",
    nativeName: "Koti'",
    family: "Maya (kanjobalano)",
    speakers: 2500,
    speakersLabel: "~2,500 hablantes",
    status: "riesgo",
    region: "Frontera",
    municipalities: "La Trinitaria, Frontera Comalapa",
    color: "#316E52",
    description:
      "Lengua maya chuj de la frontera sur de Chiapas, emparentada con el kanjobal y el jacalteco.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "Maya Bridge · Intérpretes", url: "https://www.mayabridge.org", kind: "interprete" },
    ],
  },
  {
    code: "kjb",
    name: "Kanjobal",
    nativeName: "Q'anjob'al",
    family: "Maya (kanjobalano)",
    speakers: 10000,
    speakersLabel: "~10,000 hablantes",
    status: "riesgo",
    region: "Frontera",
    municipalities: "Frontera Comalapa, Amatenango de la Frontera, La Trinitaria",
    color: "#727974",
    description:
      "Lengua maya q'anjob'al de comunidades fronterizas. Comparte familia con el chuj y el jacalteco.",
    resources: [
      { label: "INALI · Atlas lingüístico", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", kind: "institucional" },
      { label: "Maya Bridge · Intérpretes", url: "https://www.mayabridge.org", kind: "interprete" },
    ],
  },
];

/**
 * Estado real de la traducción automática para estas lenguas.
 * Fuentes consultadas en noviembre de 2026.
 */
const TRANSLATION_RESEARCH = {
  summary:
    "No existe una API pública estable de traducción automática para las lenguas de Chiapas: Google Cloud Translation y Microsoft Translator solo incorporan maya yucateco, y NLLB-200 no incluye estas lenguas. Sin embargo, el modelo abierto MADLAD-400 sí cubre tsotsil, tseltal, ch'ol, tojolabal, mam, kaqchikel, jacalteco, kanjobal y maya yucateco. ORIGEN CHIAPAS puede ejecutarlo localmente (3B, int8, CPU) y aun así derivar a intérpretes humanos para revisión.",
  automaticAvailable: true,
  providers: [
    {
      name: "Google Cloud Translation",
      supports: ["Yucatec Maya (yua)"],
      chiapas: false,
      note: "No ofrece tsotsil, tseltal, ch'ol, tojolabal ni zoque.",
      url: "https://cloud.google.com/translate/docs/languages",
    },
    {
      name: "Microsoft Translator",
      supports: ["Yucatec Maya (yua)"],
      chiapas: false,
      note: "Solo maya yucateco dentro de la familia maya.",
      url: "https://learn.microsoft.com/azure/ai-services/translator/language-support",
    },
    {
      name: "Meta NLLB-200",
      supports: ["200 lenguas, ninguna de Chiapas"],
      chiapas: false,
      note: "Sus códigos FLORES-200 no incluyen tzo_Latn, tzh_Latn, ctu_Latn ni toj_Latn.",
      url: "https://ai.meta.com/blog/nllb-200-high-quality-machine-translation/",
    },
    {
      name: "MADLAD-400 3B (local)",
      supports: [
        "Tsotsil (tzo)",
        "Tseltal (tzh)",
        "Ch'ol (ctu)",
        "Tojolabal (toj)",
        "Mam (mam)",
        "Kaqchikel (cak)",
        "Jacalteco (jac)",
        "Kanjobal (knj)",
        "Maya yucateco (yua)",
      ],
      chiapas: true,
      note: "Modelo abierto de Google que sí incluye lenguas de Chiapas; se ejecuta en CPU con CTranslate2 int8.",
      url: "https://huggingface.co/google/madlad400-3b-mt",
    },
    {
      name: "Hugging Face · tsotsil-es-translator",
      supports: ["Tsotsil → español (experimental, acceso restringido)"],
      chiapas: true,
      note: "Modelo Marian de un colaborador independiente; requiere autorización y revisión humana.",
      url: "https://huggingface.co/Joseph18/tsotsil-es-translator",
    },
  ],
  humanNetworks: [
    { name: "Maya Bridge", url: "https://www.mayabridge.org", note: "Intérpretes de tseltal y otras lenguas mayas." },
    { name: "CELALI", url: "https://www.celali.gob.mx", note: "Centro Estatal de Lenguas, Arte y Literatura Indígenas." },
    { name: "INALI", url: "https://atlas.inali.gob.mx/agrupaciones/mapa", note: "Atlas y directorio de lenguas nacionales." },
  ],
};

module.exports = { LANGUAGES, TRANSLATION_RESEARCH };
