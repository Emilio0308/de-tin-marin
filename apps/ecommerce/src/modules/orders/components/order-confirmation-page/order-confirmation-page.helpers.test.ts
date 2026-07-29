import { describe, expect, it } from "vitest";
import {
  hasConfirmationLookupParams,
  resolveConfirmationLookupParams,
} from "./order-confirmation-page.helpers";

describe("order-confirmation-page.helpers", () => {
  it("normaliza y valida los parámetros de lookup", () => {
    const resolved = resolveConfirmationLookupParams(
      " TM-20260707-0003 ",
      " emilio@test.com ",
    );

    expect(resolved).toEqual({
      orderNumber: "TM-20260707-0003",
      email: "emilio@test.com",
    });
    expect(
      hasConfirmationLookupParams(resolved.orderNumber, resolved.email),
    ).toBe(true);
  });

  it("rechaza parámetros vacíos", () => {
    const resolved = resolveConfirmationLookupParams("TM-1", "   ");

    expect(
      hasConfirmationLookupParams(resolved.orderNumber, resolved.email),
    ).toBe(false);
  });
});
