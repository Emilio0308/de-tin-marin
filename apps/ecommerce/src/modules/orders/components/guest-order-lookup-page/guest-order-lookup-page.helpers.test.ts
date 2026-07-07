import { describe, expect, it } from "vitest";
import {
  buildGuestOrderLookupInitialForm,
  canSubmitGuestOrderLookup,
  shouldAutoLookupGuestOrder,
} from "./guest-order-lookup-page.helpers";

describe("guest-order-lookup-page.helpers", () => {
  it("detecta cuando debe auto-buscar con params en URL", () => {
    expect(
      shouldAutoLookupGuestOrder({
        orderNumber: " TM-20260707-0005 ",
        email: " aba@gmail.com ",
      }),
    ).toBe(true);
  });

  it("no auto-busca si faltan params", () => {
    expect(
      shouldAutoLookupGuestOrder({
        orderNumber: "TM-1",
        email: null,
      }),
    ).toBe(false);
  });

  it("normaliza el formulario inicial", () => {
    expect(
      buildGuestOrderLookupInitialForm({
        orderNumber: " TM-1 ",
        email: " a@b.com ",
      }),
    ).toEqual({ orderNumber: "TM-1", email: "a@b.com" });
    expect(
      canSubmitGuestOrderLookup({ orderNumber: "TM-1", email: "a@b.com" }),
    ).toBe(true);
  });
});
