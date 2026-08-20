/** Centro de Piura para priorizar resultados de búsqueda. */
const PIURA_LAT = -5.1783;
const PIURA_LNG = -80.6328;

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
    street?: string;
  };
};

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

export async function searchMapLocations(
  query: string,
  signal?: AbortSignal,
): Promise<MapSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    limit: "6",
    lat: String(PIURA_LAT),
    lon: String(PIURA_LNG),
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    { signal },
  );

  if (!response.ok) return [];

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const features = payload.features ?? [];

  return features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    return {
      lat,
      lng,
      label: formatPhotonLabel(feature.properties),
    };
  });
}
