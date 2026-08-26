import { describe, expect, it, vi } from "vitest";
import {
  isPeruPhotonFeature,
  isWithinPiuraSearchBounds,
  searchMapLocations,
} from "./map-search";

describe("isWithinPiuraSearchBounds", () => {
  it("acepta el centro de Piura", () => {
    expect(isWithinPiuraSearchBounds(-5.1783, -80.6328)).toBe(true);
  });

  it("rechaza Lima", () => {
    expect(isWithinPiuraSearchBounds(-12.0464, -77.0428)).toBe(false);
  });
});

describe("isPeruPhotonFeature", () => {
  it("acepta countrycode pe", () => {
    expect(isPeruPhotonFeature({ countrycode: "PE" })).toBe(true);
  });

  it("rechaza otros países", () => {
    expect(isPeruPhotonFeature({ countrycode: "us" })).toBe(false);
  });
});

describe("searchMapLocations", () => {
  it("no consulta con menos de 3 caracteres", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchMapLocations("ab")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("mapea resultados de Photon en Piura", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            features: [
              {
                geometry: { coordinates: [-80.63, -5.19] },
                properties: {
                  name: "Real Plaza Piura",
                  city: "Piura",
                  country: "Peru",
                  countrycode: "pe",
                },
              },
              {
                geometry: { coordinates: [-77.04, -12.05] },
                properties: {
                  name: "Real Plaza Salaverry",
                  city: "Lima",
                  country: "Peru",
                  countrycode: "pe",
                },
              },
            ],
          }),
      }),
    );

    const results = await searchMapLocations("Real Plaza");
    expect(results).toEqual([
      {
        lat: -5.19,
        lng: -80.63,
        label: "Real Plaza Piura, Piura, Peru",
      },
    ]);

    vi.unstubAllGlobals();
  });
});
