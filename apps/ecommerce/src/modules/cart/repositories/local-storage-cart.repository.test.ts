import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderShoppingCartProductLine } from "@de-tin-marin/shared/order-cart";
import { localStorageCartRepository } from "./local-storage-cart.repository";

const productLine = (
  productId: string,
  quantity = 1,
): OrderShoppingCartProductLine => ({
  type: "product",
  productId,
  sku: `SKU-${productId}`,
  name: `Product ${productId}`,
  quantity,
  unitPrice: 10,
  lineTotal: 10 * quantity,
});

describe("localStorageCartRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
    localStorageCartRepository.clear();
  });

  it("persiste y fusiona líneas de producto por productId", () => {
    localStorageCartRepository.addLine(productLine("p1"));
    localStorageCartRepository.addLine(productLine("p1"));

    const lines = localStorageCartRepository.getLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.line.type).toBe("product");
    if (lines[0]?.line.type === "product") {
      expect(lines[0].line.quantity).toBe(2);
      expect(lines[0].line.lineTotal).toBe(20);
    }
  });

  it("añade bundles como líneas separadas", () => {
    const bundleLine = {
      type: "bundle" as const,
      bundleId: "b1",
      name: "Sorpresa",
      quantity: 5,
      lineTotal: 50,
      container: {
        containerId: "c1",
        sku: "C-1",
        name: "Caja",
        unitPrice: 2,
      },
      components: [],
    };

    localStorageCartRepository.addLine(bundleLine);
    localStorageCartRepository.addLine(bundleLine);

    expect(localStorageCartRepository.getLines()).toHaveLength(2);
  });

  it("actualiza cantidad, elimina y limpia el carrito", () => {
    localStorageCartRepository.addLine(productLine("p1"));
    const cartLineId = localStorageCartRepository.getLines()[0]?.cartLineId;
    expect(cartLineId).toBeTruthy();

    localStorageCartRepository.updateProductQuantity(cartLineId!, 3, {
      minQuantity: 1,
      maxQuantity: 100,
      purchasable: true,
    });
    const updated = localStorageCartRepository.getLines()[0];
    expect(updated?.line.type).toBe("product");
    if (updated?.line.type === "product") {
      expect(updated.line.quantity).toBe(3);
    }

    localStorageCartRepository.removeLine(cartLineId!);
    expect(localStorageCartRepository.getLines()).toHaveLength(0);

    localStorageCartRepository.addLine(productLine("p2"));
    localStorageCartRepository.clear();
    expect(localStorageCartRepository.getLines()).toHaveLength(0);
  });

  it("notifica a los suscriptores", () => {
    const listener = vi.fn();
    const unsubscribe = localStorageCartRepository.subscribe(listener);

    localStorageCartRepository.addLine(productLine("p1"));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    localStorageCartRepository.addLine(productLine("p2"));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
