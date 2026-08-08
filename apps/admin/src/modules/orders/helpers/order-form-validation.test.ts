import { describe, expect, it } from "vitest";
import { emptyOrderFormValues } from "../components/order-form/order-form.types";
import { validateCreateOrderForm } from "./order-form-validation";

describe("validateCreateOrderForm", () => {
  it("returns field errors without calling the server", () => {
    const result = validateCreateOrderForm(emptyOrderFormValues);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fieldErrors["contact.name"]).toBe("Ingresa el nombre");
    expect(result.fieldErrors["contact.email"]).toBeTruthy();
    expect(result.fieldErrors.lines).toBe(
      "Agrega al menos una línea al carrito",
    );
  });

  it("passes when contact, delivery and lines are valid", () => {
    const result = validateCreateOrderForm({
      ...emptyOrderFormValues,
      contact: {
        name: "Ana",
        lastName: "Pérez",
        phone: "999111222",
        email: "ana@example.com",
      },
      fulfillment: {
        method: "pickup",
        deliveryAddress: emptyOrderFormValues.fulfillment.deliveryAddress,
        notes: "",
      },
      lines: [
        {
          type: "product",
          productId: "11111111-1111-1111-1111-111111111111",
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(result.ok).toBe(true);
  });
});
