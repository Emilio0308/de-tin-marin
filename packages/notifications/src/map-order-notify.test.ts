import { describe, expect, it } from "vitest";

import {
  mapCartLinesToNotifyLines,
  mapFulfillmentToNotify,
} from "./map-order-notify";
import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";

describe("mapCartLinesToNotifyLines", () => {
  it("mapea product, pack y bundle con componentes", () => {
    const lines: OrderShoppingCartLine[] = [
      {
        type: "product",
        productId: "p1",
        sku: "SKU-1",
        name: "Gomitas",
        packageQuantity: 2,
        unitQuantity: 0,
        packagePrice: 10,
        unitPrice: 1,
        lineTotal: 20,
      },
      {
        type: "pack",
        packId: "pk1",
        sku: "PACK-1",
        name: "Pack fiesta",
        quantity: 2,
        unitPrice: 30,
        lineTotal: 60,
        components: [
          {
            productId: "p2",
            productName: "Chicles",
            sku: "CH-1",
            packageQuantity: 1,
            unitQuantity: 0,
            totalPackages: 2,
            totalUnits: 0,
          },
        ],
      },
      {
        type: "bundle",
        bundleId: "b1",
        name: "Sorpresa cumpleaños",
        quantity: 15,
        lineTotal: 150,
        normalizedPerSurprisePrice: 11,
        normalizedLineTotal: 165,
        container: {
          containerId: "c1",
          sku: "ENV-1",
          name: "Caja rosa",
          unitPrice: 2,
        },
        components: [
          {
            productId: "p3",
            productName: "Ositos",
            sku: "OS-1",
            quantityPerUnit: 3,
            totalQuantity: 45,
            unitPrice: 1,
          },
        ],
      },
    ];

    const mapped = mapCartLinesToNotifyLines(lines);
    expect(mapped[0]).toMatchObject({
      kind: "product",
      label: "Gomitas",
      quantityLabel: "2 present.",
    });
    expect(mapped[1]).toMatchObject({
      kind: "pack",
      label: "Pack fiesta",
      quantityLabel: "Combo × 2",
    });
    expect(mapped[1]?.components).toEqual([
      {
        label: "Chicles",
        quantityLabel: "1 present. → 2 present. total",
      },
    ]);
    expect(mapped[2]).toMatchObject({
      kind: "bundle",
      label: "Sorpresa cumpleaños",
      quantityLabel: "Sorpresa × 15",
      lineTotal: 165,
      footnote: "Incluye envase: Caja rosa",
    });
    expect(mapped[2]?.components).toEqual([
      {
        label: "Ositos",
        quantityLabel: "3 und./sorpresa · 45 und. total",
      },
    ]);
  });
});

describe("mapFulfillmentToNotify", () => {
  it("arma resumen de delivery", () => {
    expect(
      mapFulfillmentToNotify({
        method: "delivery",
        deliveryAddress: {
          recipientName: "Ana Pérez",
          line1: "Av. Grau 1",
          district: "Castilla",
          city: "Piura",
          province: "Piura",
          reference: "Portón azul",
        },
      }),
    ).toEqual({
      method: "delivery",
      summary:
        "Ana Pérez, Av. Grau 1, Castilla, Piura, Piura (Ref: Portón azul)",
    });
  });

  it("pickup fijo", () => {
    expect(mapFulfillmentToNotify({ method: "pickup" })).toEqual({
      method: "pickup",
      summary: "Recojo en tienda",
    });
  });

  it("pickup_point con nombre", () => {
    expect(
      mapFulfillmentToNotify({
        method: "pickup_point",
        pickupPoint: {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Real Plaza",
          lat: -5.19,
          lng: -80.63,
          fee: 6,
        },
      }),
    ).toEqual({
      method: "pickup_point",
      summary: "Punto de recojo: Real Plaza",
    });
  });

  it("courier con destino y recipient", () => {
    expect(
      mapFulfillmentToNotify({
        method: "courier",
        courier: {
          destination: {
            departmentId: "11111111-1111-4111-8111-111111111111",
            departmentName: "Piura",
            provinceSlug: "sullana",
            provinceName: "Sullana",
          },
          recipient: {
            dni: "12345678",
            fullName: "María García",
            agencyAddress: "Olva Courier - Av. Ugarte 123",
          },
        },
      }),
    ).toEqual({
      method: "courier",
      summary:
        "Piura, Sullana · María García · DNI 12345678 · Olva Courier - Av. Ugarte 123",
    });
  });
});
