export type Coords = { lat: number; lng: number };

/**
 * Coordenadas reales (aproximadas al centro de cada municipio) de los
 * micronegocios del directorio. Se usan para calcular distancias desde la
 * ubicación del usuario y para ubicar su posición sobre el mapa.
 */
export const PRODUCER_COORDS: Record<string, Coords> = {
  "cafetales-don-margarito": { lat: 17.0067, lng: -92.466 },
  "cooperativa-cafetalera-maya": { lat: 16.737, lng: -92.6376 },
  "taller-ambar-simojovel": { lat: 17.1395, lng: -92.713 },
  "mujeres-tejedoras-zinacantan": { lat: 16.7597, lng: -92.7231 },
  "rancho-santa-clara": { lat: 16.9053, lng: -92.0914 },
  "cacaotales-soconusco": { lat: 14.9039, lng: -92.264 },
  "taller-las-flores": { lat: 16.7597, lng: -92.7231 },
  "cooperativa-triunfo-verde": { lat: 16.737, lng: -92.6376 },
  "taller-minero-fosiles": { lat: 17.1395, lng: -92.713 },
  "queseria-san-antolin": { lat: 16.9053, lng: -92.0914 },
  "taller-maestro-nandayapa": { lat: 16.7086, lng: -93.012 },
  "guardianes-bosque-chol": { lat: 17.5092, lng: -91.9844 },
  "taller-tejedoras-carmen": { lat: 16.737, lng: -92.6376 },
  "tejedoras-xpakinte": { lat: 16.7597, lng: -92.7231 },
  "ambar-real-simojovel": { lat: 17.1395, lng: -92.713 },
  "queseria-la-chiapaneca": { lat: 16.9053, lng: -92.0914 },
  "telar-maya-petrona": { lat: 16.7597, lng: -92.7231 },
  "alfareria-jaguar": { lat: 16.529, lng: -92.435 },
  "ambar-mina-relicario": { lat: 17.1395, lng: -92.713 },
};

/** Respaldo por municipio para micronegocios que se agreguen después. */
const PLACE_COORDS: Record<string, Coords> = {
  "san cristobal": { lat: 16.737, lng: -92.6376 },
  pantelho: { lat: 17.0067, lng: -92.466 },
  simojovel: { lat: 17.1395, lng: -92.713 },
  zinacantan: { lat: 16.7597, lng: -92.7231 },
  ocosingo: { lat: 16.9053, lng: -92.0914 },
  "chiapa de corzo": { lat: 16.7086, lng: -93.012 },
  palenque: { lat: 17.5092, lng: -91.9844 },
  "tuxtla chico": { lat: 14.9039, lng: -92.264 },
  tapachula: { lat: 14.9039, lng: -92.264 },
  "tuxtla gutierrez": { lat: 16.7528, lng: -93.1164 },
  "amatennango del valle": { lat: 16.529, lng: -92.435 },
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/** Devuelve las coordenadas de un productor (por slug o, en su defecto, municipio). */
export function producerCoords(slug: string, municipality: string): Coords {
  if (PRODUCER_COORDS[slug]) return PRODUCER_COORDS[slug];
  const first = normalize(municipality.split("/")[0]);
  return PLACE_COORDS[first] ?? PLACE_COORDS[normalize(municipality)] ?? { lat: 16.7528, lng: -93.1164 };
}

/** Distancia en kilómetros entre dos coordenadas (fórmula de Haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Proyección lineal calibrada con los pines del mapa ilustrado de Chiapas.
 * Convierte coordenadas reales en porcentajes (top/left) del mapa.
 */
export function projectToMap(coords: Coords): { top: number; left: number } {
  const left = 30.6064 * coords.lng + 2881.163;
  const top = -19.5851 * coords.lat + 369.9967;
  return {
    top: Math.min(97, Math.max(3, top)),
    left: Math.min(97, Math.max(3, left)),
  };
}

export function formatDistance(km: number): string {
  if (km < 1) return "a menos de 1 km";
  if (km < 10) return `a ${km.toFixed(1)} km`;
  return `a ${Math.round(km).toLocaleString("es-MX")} km`;
}
