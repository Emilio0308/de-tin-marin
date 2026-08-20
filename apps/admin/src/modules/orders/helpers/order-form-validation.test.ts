import { describe, expect, it } from "vitest";
import { emptyOrderFormValues } from "../components/order-form/order-form.types";
import {
  mapOrderFormFieldErrorKeys,
  sanitizeOrderFormValues,
  validateCreateOrderField,
  validateCreateOrderForm,
} from "./order-form-validation";

describe("validateCreateOrderForm", () => {
  it("returns field error keys without calling the server", () => {
    const result = validateCreateOrderForm(emptyOrderFormValues);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.fieldErrorKeys["contact.name"]).toBe("requiredName");
    expect(result.fieldErrorKeys["contact.email"]).toBeTruthy();
    expect(result.fieldErrorKeys.lines).toBe("requiredLines");
    expect(result.formErrorKey).toBe("reviewForm");
  });

  it("maps error keys through the i18n translator", () => {
    const result = validateCreateOrderForm(emptyOrderFormValues);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    const fieldErrors = mapOrderFormFieldErrorKeys(
      result.fieldErrorKeys,
      (key) => `t:${key}`,
    );
    expect(fieldErrors["contact.name"]).toBe("t:requiredName");
    expect(fieldErrors.lines).toBe("t:requiredLines");
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
        ...emptyOrderFormValues.fulfillment,
        method: "pickup",
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

  it("sanitizes names, phones and emails before local validation", () => {
    const sanitized = sanitizeOrderFormValues({
      ...emptyOrderFormValues,
      contact: {
        name: "Ana123!",
        lastName: "Pérez2",
        phone: "999-111 222x",
        email: "ana @example.com",
      },
      fulfillment: {
        ...emptyOrderFormValues.fulfillment,
        deliveryAddress: {
          ...emptyOrderFormValues.fulfillment.deliveryAddress,
          recipientName: "Ana3",
          phone: "999 111 222",
        },
      },
    });

    expect(sanitized.contact.name).toBe("Ana");
    expect(sanitized.contact.lastName).toBe("Pérez");
    expect(sanitized.contact.phone).toBe("999111222");
    expect(sanitized.contact.email).toBe("ana@example.com");
    expect(sanitized.fulfillment.deliveryAddress.recipientName).toBe("Ana");
    expect(sanitized.fulfillment.deliveryAddress.phone).toBe("999111222");
  });

  it("explains invalid customer and delivery fields with keys", () => {
    const values = {
      ...emptyOrderFormValues,
      contact: {
        name: "A",
        lastName: "Pérez",
        phone: "123456789",
        email: "ana@example.com",
      },
      fulfillment: {
        ...emptyOrderFormValues.fulfillment,
        deliveryAddress: {
          ...emptyOrderFormValues.fulfillment.deliveryAddress,
          recipientName: "A",
          line1: "Av",
          district: "Piura",
          city: "Piura",
          province: "Piura",
          phone: "123456789",
        },
      },
    };

    expect(validateCreateOrderField(values, "contact.name")).toBe(
      "tooShortName",
    );
    expect(validateCreateOrderField(values, "contact.phone")).toBe(
      "invalidPhone",
    );
    expect(
      validateCreateOrderField(values, "fulfillment.deliveryAddress.line1"),
    ).toBe("tooShortAddress");
  });
});
