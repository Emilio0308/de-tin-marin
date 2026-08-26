import { describe, expect, it } from "vitest";
import {
  buildEmailHref,
  buildWhatsappHref,
  businessSettingsSchema,
  formatWhatsappDisplay,
  formatYapePhoneDisplay,
} from "./business-settings";

const valid = {
  whatsappE164: "51980966238",
  email: "detinmarindulcesyconfiteria@gmail.com",
  yapePhone: "999888777",
  yapeHolderName: "De Tin Marín",
  bankName: "BCP",
  bankAccountHolderName: "De Tin Marín SAC",
  bankAccountNumber: "191-12345678-0-12",
  bankInterbankAccountNumber: "00219100123456789012",
};

describe("businessSettingsSchema", () => {
  it("acepta configuración válida", () => {
    expect(businessSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza WhatsApp inválido", () => {
    expect(
      businessSettingsSchema.safeParse({
        ...valid,
        whatsappE164: "980966238",
      }).success,
    ).toBe(false);
  });

  it("rechaza Yape que no sea móvil peruano", () => {
    expect(
      businessSettingsSchema.safeParse({
        ...valid,
        yapePhone: "199888777",
      }).success,
    ).toBe(false);
  });

  it("rechaza CCI que no tenga 20 dígitos", () => {
    expect(
      businessSettingsSchema.safeParse({
        ...valid,
        bankInterbankAccountNumber: "0021910012345678901",
      }).success,
    ).toBe(false);
  });
});

describe("format helpers", () => {
  it("formatea WhatsApp y Yape para UI", () => {
    expect(formatWhatsappDisplay("51980966238")).toBe("+51 980 966 238");
    expect(formatYapePhoneDisplay("999888777")).toBe("999 888 777");
  });

  it("arma hrefs de contacto", () => {
    expect(buildWhatsappHref("51980966238")).toBe("https://wa.me/51980966238");
    expect(buildEmailHref("a@b.com")).toBe("mailto:a@b.com");
  });
});
