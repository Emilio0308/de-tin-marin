import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutPage } from "./checkout-page";
import type {
  CheckoutPageLabels,
  CheckoutPageProps,
} from "./checkout-page.types";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

vi.mock("../delivery-map/delivery-map.dynamic", () => ({
  DeliveryMap: () => <div data-testid="delivery-map" />,
}));

const defaultLabels: CheckoutPageLabels = {
  title: "Datos de entrega",
  subtitle: "Cuéntanos a dónde enviamos tu pedido en Piura.",
  backToCart: "Volver al carrito",
  summaryTitle: "Tu pedido",
  secureNote: "Revisamos stock y cobertura antes de confirmar.",
  contactTitle: "Datos de contacto",
  fulfillmentTitle: "Método de entrega",
  fulfillmentDelivery: "Delivery",
  fulfillmentPickupPoint: "Punto de recojo",
  fulfillmentCourier: "Envío por agencia",
  courierTitle: "Envío por agencia",
  courierDepartment: "Departamento",
  courierDepartmentPlaceholder: "Selecciona departamento",
  courierProvince: "Provincia",
  courierProvincePlaceholder: "Selecciona provincia",
  courierDni: "DNI de quien retira",
  courierFullName: "Nombre completo de quien retira",
  courierAgencyAddress: "Dirección de la agencia",
  courierFeeNote: "El flete se paga en la agencia según peso y destino.",
  addressTitle: "Dirección de entrega",
  pickupPointTitle: "Punto de recojo",
  pickupPointPlaceholder: "Selecciona un punto de recojo",
  pickupMapHint: "Ubicación del punto seleccionado.",
  mapSectionTitle: "Ubicación",
  name: "Nombre",
  lastName: "Apellido",
  phone: "Teléfono",
  email: "Correo electrónico",
  line1: "Dirección",
  district: "Distrito",
  districtPlaceholder: "Selecciona tu distrito",
  city: "Ciudad",
  province: "Provincia",
  reference: "Referencia (opcional)",
  referenceHint: "Ej. casa color verde, portón negro",
  requiredHint: "Campo obligatorio",
  mapTitle: "Ubicación en el mapa",
  mapHint: "Arrastra el pin o haz clic para indicar tu ubicación en Piura.",
  mapSearchLabel: "Buscar ubicación",
  mapSearchPlaceholder: "Busca una avenida, mall o referencia en Piura…",
  mapSearchNoResults: "No encontramos lugares en Piura.",
  phoneHint: "9 dígitos, sin espacios ni letras",
  subtotal: "Subtotal",
  shipping: "Envío",
  shippingPending: "Calculando…",
  total: "Total",
  submit: "Confirmar pedido",
  submitting: "Creando pedido…",
  outOfCoverage: "Sin cobertura en esta zona.",
  stockTitle: "Stock limitado",
  stockChecking: "Verificando stock…",
  emptyCart: "Tu carrito está vacío.",
  validationSummary: "Revisa los campos marcados en rojo antes de continuar.",
  stepsLabel: "Progreso del pedido",
  stepCart: "Carrito",
  stepCheckout: "Entrega",
  stepDone: "Listo",
  validation: {
    required: "Este campo es obligatorio",
    invalidEmail: "Ingresa un correo electrónico válido",
    invalidName: "Solo letras (puedes usar tildes, espacios o guion)",
    invalidPhone: "Ingresa un celular de 9 dígitos que empiece con 9",
    invalidDni: "Ingresa un DNI válido de 8 dígitos",
    tooShort: "Escribe un poco más de detalle",
  },
};

const defaultCourierForm: CheckoutPageProps["courierForm"] = {
  courierDepartmentId: "",
  courierProvinceSlug: "",
  courierDni: "",
  courierFullName: "",
  courierAgencyAddress: "",
};

const defaultForm: CheckoutPageProps["form"] = {
  name: "",
  lastName: "",
  phone: "",
  email: "",
  line1: "",
  district: "",
  city: "Piura",
  province: "Piura",
  reference: "",
};

function renderCheckout(overrides: Partial<CheckoutPageProps> = {}) {
  const onSubmit = vi.fn();
  render(
    <CheckoutPage
      form={defaultForm}
      courierForm={defaultCourierForm}
      fieldErrors={{}}
      courierFieldErrors={{}}
      showValidationSummary={false}
      fulfillmentMethod="delivery"
      showFulfillmentSelector={false}
      showPickupPointOption={false}
      showCourierOption={false}
      pickupPointId=""
      pickupPointError={null}
      pickupPoints={[]}
      courierDepartments={[]}
      districts={[{ id: "1", district: "Piura", fee: 8 }]}
      mapPin={{ lat: -5.1783, lng: -80.6328 }}
      subtotal={89.9}
      shippingTotal={8}
      total={97.9}
      covered
      isDeliveryPending={false}
      isSubmitting={false}
      errorMessage={null}
      isStockPending={false}
      stockWarning={false}
      stockMessages={[]}
      labels={defaultLabels}
      onChange={vi.fn()}
      onCourierChange={vi.fn()}
      onFieldBlur={vi.fn()}
      onCourierFieldBlur={vi.fn()}
      onFulfillmentMethodChange={vi.fn()}
      onPickupPointChange={vi.fn()}
      onPickupPointBlur={vi.fn()}
      onMapPinChange={vi.fn()}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe("CheckoutPage", () => {
  it("renderiza secciones del formulario con etiquetas visibles", () => {
    renderCheckout();

    expect(
      screen.getByRole("heading", { name: "Datos de entrega" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Datos de contacto")).toBeInTheDocument();
    expect(screen.getByText("Dirección de entrega")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /^Nombre/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("delivery-map")).toBeInTheDocument();
  });

  it("expone autocompletado semántico en campos clave", () => {
    renderCheckout();

    expect(screen.getByRole("textbox", { name: /^Nombre/ })).toHaveAttribute(
      "autocomplete",
      "given-name",
    );
    expect(screen.getByRole("textbox", { name: /^Apellido/ })).toHaveAttribute(
      "autocomplete",
      "family-name",
    );
    expect(screen.getByRole("textbox", { name: /^Teléfono/ })).toHaveAttribute(
      "autocomplete",
      "tel",
    );
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toHaveAttribute("autocomplete", "email");
    expect(screen.getByRole("textbox", { name: /^Dirección/ })).toHaveAttribute(
      "autocomplete",
      "street-address",
    );
  });

  it("muestra errores de campo y resumen de validación", () => {
    renderCheckout({
      fieldErrors: {
        name: "Este campo es obligatorio",
        email: "Ingresa un correo electrónico válido",
      },
      showValidationSummary: true,
    });

    expect(
      screen.getByText(
        "Revisa los campos marcados en rojo antes de continuar.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Este campo es obligatorio").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Ingresa un correo electrónico válido"),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Nombre/ })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("invoca onSubmit al confirmar pedido", () => {
    const { onSubmit } = renderCheckout({ covered: true });

    const submitButtons = screen.getAllByRole("button", {
      name: "Confirmar pedido",
    });
    fireEvent.click(submitButtons[0]!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("mantiene el botón confirmar habilitado aunque no haya cobertura", () => {
    renderCheckout({ covered: false, isDeliveryPending: false });

    const submitButtons = screen.getAllByRole("button", {
      name: "Confirmar pedido",
    });
    for (const button of submitButtons) {
      expect(button).toBeEnabled();
    }
  });

  it("deshabilita confirmar solo mientras envía", () => {
    renderCheckout({ isSubmitting: true });

    const submitButtons = screen.getAllByRole("button", {
      name: "Creando pedido…",
    });
    for (const button of submitButtons) {
      expect(button).toBeDisabled();
    }
  });

  it("muestra selector de método cuando hay puntos de recojo", () => {
    renderCheckout({
      showFulfillmentSelector: true,
      showPickupPointOption: true,
      pickupPoints: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Real Plaza",
          lat: -5.19,
          lng: -80.63,
          fee: 6,
        },
      ],
    });

    expect(screen.getByText("Método de entrega")).toBeInTheDocument();
    expect(screen.getByText("Punto de recojo")).toBeInTheDocument();
  });

  it("muestra selector de punto en rama pickup_point", () => {
    renderCheckout({
      fulfillmentMethod: "pickup_point",
      showPickupPointOption: true,
      pickupPoints: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Real Plaza",
          lat: -5.19,
          lng: -80.63,
          fee: 6,
        },
      ],
    });

    expect(
      screen.getByRole("combobox", { name: /Punto de recojo/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Dirección de entrega")).not.toBeInTheDocument();
  });
});
