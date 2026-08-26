import { describe, expect, it, vi } from "vitest";
import { searchMapLocations } from "./pickup-point-map.helpers";

describe("searchMapLocations", () => {
  it("no consulta con menos de 3 caracteres", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchMapLocations("ab")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("mapea resultados de Photon", async () => {
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
                },
              },
            ],
          }),
      }),
    );

    const results = await searchMapLocations("Real Plaza Piura");
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
