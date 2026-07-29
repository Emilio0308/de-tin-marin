import { describe, expect, it } from "vitest";
import {
  isWithinPiuraBounds,
  PIURA_DELIVERY_BOUNDS,
  resolveCheckoutDeliveryFee,
} from "./checkout-coverage";

const zones = [
  { district: "Piura", fee: 8, isActive: true },
  { district: "Castilla", fee: 8, isActive: true },
];

const settings = {
  pickupEnabled: false,
  deliveryEnabled: true,
  fallbackFee: 20,
};

const piuraCenter = { lat: -5.1783, lng: -80.6328 };
const outsidePiura = { lat: -12.05, lng: -77.05 };

describe("isWithinPiuraBounds", () => {
  it("acepta coordenadas dentro del bbox Piura", () => {
    expect(isWithinPiuraBounds(piuraCenter.lat, piuraCenter.lng)).toBe(true);
  });

  it("rechaza coordenadas fuera del bbox Piura", () => {
    expect(isWithinPiuraBounds(outsidePiura.lat, outsidePiura.lng)).toBe(false);
  });

  it("usa límites documentados", () => {
    expect(
      isWithinPiuraBounds(
        PIURA_DELIVERY_BOUNDS.minLat,
        PIURA_DELIVERY_BOUNDS.minLng,
      ),
    ).toBe(true);
  });
});

describe("resolveCheckoutDeliveryFee", () => {
  it("devuelve fee de zona para distrito Piura", () => {
    const result = resolveCheckoutDeliveryFee(
      "delivery",
      "Piura",
      piuraCenter,
      zones,
      settings,
    );
    expect(result).toEqual({ covered: true, fee: 8 });
  });

  it("bloquea distrito desconocido con pin fuera de Piura", () => {
    const result = resolveCheckoutDeliveryFee(
      "delivery",
      "Lima",
      outsidePiura,
      zones,
      settings,
    );
    expect(result).toEqual({ covered: false, fee: 0 });
  });

  it("usa fallback si pin está dentro de Piura sin zona", () => {
    const result = resolveCheckoutDeliveryFee(
      "delivery",
      "Distrito Nuevo",
      piuraCenter,
      zones,
      settings,
    );
    expect(result).toEqual({ covered: true, fee: 20 });
  });

  it("pickup siempre cubierto con fee 0", () => {
    const result = resolveCheckoutDeliveryFee(
      "pickup",
      undefined,
      outsidePiura,
      zones,
      settings,
    );
    expect(result).toEqual({ covered: true, fee: 0 });
  });
});
