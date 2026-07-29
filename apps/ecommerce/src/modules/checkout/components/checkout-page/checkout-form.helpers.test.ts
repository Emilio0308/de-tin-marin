import { describe, expect, it } from "vitest";
import {
  getCheckoutFieldErrorKey,
  getCheckoutFieldErrorKeys,
  mapCheckoutFieldErrors,
} from "./checkout-form.helpers";

const validForm = {
  name: "María",
  lastName: "García",
  phone: "999888777",
  email: "maria@test.com",
  line1: "Av. Grau 123",
  district: "Piura",
  city: "Piura",
  province: "Piura",
  reference: "",
};

describe("checkout form validation", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(getCheckoutFieldErrorKeys(validForm)).toEqual({});
  });

  it("marca campos requeridos vacíos", () => {
    const errors = getCheckoutFieldErrorKeys({
      ...validForm,
      name: "",
      district: "",
    });
    expect(errors.name).toBe("required");
    expect(errors.district).toBe("required");
  });

  it("obtiene error de un solo campo", () => {
    expect(
      getCheckoutFieldErrorKey(
        { ...validForm, email: "correo-invalido" },
        "email",
      ),
    ).toBe("invalidEmail");
  });

  it("marca correo inválido", () => {
    const errors = getCheckoutFieldErrorKeys({
      ...validForm,
      email: "correo-invalido",
    });
    expect(errors.email).toBe("invalidEmail");
  });

  it("traduce claves de error a mensajes", () => {
    const messages = mapCheckoutFieldErrors(
      { name: "required", email: "invalidEmail" },
      {
        required: "Este campo es obligatorio",
        invalidEmail: "Ingresa un correo electrónico válido",
      },
    );
    expect(messages.name).toBe("Este campo es obligatorio");
    expect(messages.email).toBe("Ingresa un correo electrónico válido");
  });
});
