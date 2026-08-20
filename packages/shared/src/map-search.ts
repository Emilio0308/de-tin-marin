/** Centro urbano de Piura para sesgar resultados. */
export const PIURA_SEARCH_CENTER = {
  lat: -5.1783,
  lng: -80.6328,
} as const;

/**
 * Bbox metropolitano (Piura, Castilla, 26 de Octubre).
 * Más amplio que la cobertura de delivery para que la geocodificación
 * encuentre malls y avenidas, pero no Lima ni el resto del Perú.
 */
export const PIURA_SEARCH_BOUNDS = {
  minLat: -5.32,
  maxLat: -5.02,
  minLng: -80.9,
  maxLng: -80.45,
} as const;

export type MapSearchResult = {
  lat: number;
  lng: number;
  label: string;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    street?: string;
  };
};

export function isWithinPiuraSearchBounds(lat: number, lng: number): boolean {
  return (
    lat >= PIURA_SEARCH_BOUNDS.minLat &&
    lat <= PIURA_SEARCH_BOUNDS.maxLat &&
    lng >= PIURA_SEARCH_BOUNDS.minLng &&
    lng <= PIURA_SEARCH_BOUNDS.maxLng
  );
}

export function isPeruPhotonFeature(
  properties: PhotonFeature["properties"],
): boolean {
  const code = properties.countrycode?.trim().toLowerCase();
  if (code) return code === "pe";
  const country = properties.country?.trim().toLowerCase();
  if (!country) return true;
  return country === "peru" || country === "perú";
}

function formatPhotonLabel(properties: PhotonFeature["properties"]): string {
  const parts = [
    properties.name,
    properties.street,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean);

  return [...new Set(parts)].join(", ") || "Ubicación";
}

function photonBbox(): string {
  const { minLng, minLat, maxLng, maxLat } = PIURA_SEARCH_BOUNDS;
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export async function searchMapLocations(
  query: string,
  signal?: AbortSignal,
): Promise<MapSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    lat: String(PIURA_SEARCH_CENTER.lat),
    lon: String(PIURA_SEARCH_CENTER.lng),
    bbox: photonBbox(),
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    { signal },
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const features = payload.features ?? [];

  return features.flatMap((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    if (!isPeruPhotonFeature(feature.properties)) return [];
    if (!isWithinPiuraSearchBounds(lat, lng)) return [];
    return [
      {
        lat,
        lng,
        label: formatPhotonLabel(feature.properties),
      },
    ];
  });
}
