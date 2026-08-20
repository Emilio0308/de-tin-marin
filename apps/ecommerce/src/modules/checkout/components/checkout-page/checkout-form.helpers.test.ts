import { describe, expect, it } from "vitest";
import {
  getCheckoutFieldErrorKey,
  getCheckoutFieldErrorKeys,
  getPickupPointErrorKey,
  mapCheckoutFieldErrors,
  sanitizeCheckoutField,
  sanitizePersonName,
  sanitizePhone,
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

const labels = {
  required: "Este campo es obligatorio",
  invalidEmail: "Ingresa un correo electrónico válido",
  invalidName: "Solo letras",
  invalidPhone: "Celular inválido",
  tooShort: "Muy corto",
};

describe("checkout form sanitization", () => {
  it("elimina números y símbolos del nombre", () => {
    expect(sanitizePersonName("María123!")).toBe("María");
    expect(sanitizePersonName("Ana-María O'Neil")).toBe("Ana-María O'Neil");
  });

  it("deja solo dígitos en el teléfono y limita a 9", () => {
    expect(sanitizePhone("abc9-99 888-777x")).toBe("999888777");
    expect(sanitizePhone("999888777123")).toBe("999888777");
  });

  it("aplica sanitizado por campo", () => {
    expect(sanitizeCheckoutField("name", "Juan9")).toBe("Juan");
    expect(sanitizeCheckoutField("phone", "9a9b9")).toBe("999");
    expect(sanitizeCheckoutField("email", "a @b.com")).toBe("a@b.com");
  });
});

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

  it("rechaza nombres con caracteres inválidos", () => {
    expect(
      getCheckoutFieldErrorKey({ ...validForm, name: "Juan2" }, "name"),
    ).toBe("invalidName");
  });

  it("rechaza teléfonos incompletos o que no empiezan en 9", () => {
    expect(
      getCheckoutFieldErrorKey({ ...validForm, phone: "123456789" }, "phone"),
    ).toBe("invalidPhone");
    expect(
      getCheckoutFieldErrorKey({ ...validForm, phone: "99988" }, "phone"),
    ).toBe("invalidPhone");
  });

  it("marca dirección demasiado corta", () => {
    expect(
      getCheckoutFieldErrorKey({ ...validForm, line1: "Av" }, "line1"),
    ).toBe("tooShort");
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
      {
        name: "required",
        email: "invalidEmail",
        phone: "invalidPhone",
        lastName: "invalidName",
        line1: "tooShort",
      },
      labels,
    );
    expect(messages.name).toBe("Este campo es obligatorio");
    expect(messages.email).toBe("Ingresa un correo electrónico válido");
    expect(messages.phone).toBe("Celular inválido");
    expect(messages.lastName).toBe("Solo letras");
    expect(messages.line1).toBe("Muy corto");
  });

  it("no exige dirección en pickup_point", () => {
    expect(
      getCheckoutFieldErrorKeys(
        {
          ...validForm,
          line1: "",
          district: "",
        },
        "pickup_point",
      ),
    ).toEqual({});
  });

  it("marca punto de recojo requerido", () => {
    expect(getPickupPointErrorKey("")).toBe("required");
    expect(getPickupPointErrorKey("abc")).toBeUndefined();
  });
});
