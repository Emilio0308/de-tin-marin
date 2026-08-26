import { describe, expect, it } from "vitest";

import { resolveSmtpConfig } from "./smtp-config";

describe("resolveSmtpConfig", () => {
  it("retorna null si falta cualquier campo", () => {
    expect(
      resolveSmtpConfig({
        host: "smtp.gmail.com",
        port: 587,
        user: "u",
        pass: undefined,
        from: "De Tin <u@g.com>",
      }),
    ).toBeNull();
  });

  it("retorna config cuando está completo", () => {
    expect(
      resolveSmtpConfig({
        host: "smtp.gmail.com",
        port: 587,
        user: "u@g.com",
        pass: "app-pass",
        from: "De Tin Marín <u@g.com>",
      }),
    ).toEqual({
      host: "smtp.gmail.com",
      port: 587,
      user: "u@g.com",
      pass: "app-pass",
      from: "De Tin Marín <u@g.com>",
    });
  });

  it("incluye replyTo cuando viene", () => {
    expect(
      resolveSmtpConfig({
        host: "smtp.gmail.com",
        port: 587,
        user: "u@g.com",
        pass: "app-pass",
        from: "De Tin Marín <u@g.com>",
        replyTo: "tienda@g.com",
      }),
    ).toEqual({
      host: "smtp.gmail.com",
      port: 587,
      user: "u@g.com",
      pass: "app-pass",
      from: "De Tin Marín <u@g.com>",
      replyTo: "tienda@g.com",
    });
  });
});
