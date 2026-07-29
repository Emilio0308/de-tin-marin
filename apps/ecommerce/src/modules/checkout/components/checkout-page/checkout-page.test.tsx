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
  title: "Checkout",
  backToCart: "Volver al carrito",
  contactTitle: "Datos de contacto",
  addressTitle: "Dirección de entrega",
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
  validation: {
    required: "Este campo es obligatorio",
    invalidEmail: "Ingresa un correo electrónico válido",
  },
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
      fieldErrors={{}}
      showValidationSummary={false}
      districts={[{ id: "1", district: "Piura", fee: 8 }]}
      mapPin={{ lat: -5.1783, lng: -80.6328 }}
      subtotal={89.9}
      shippingTotal={8}
      total={97.9}
      covered
      isDeliveryPending={false}
      isSubmitting={false}
      errorMessage={null}
      stockBlocked={false}
      isStockPending={false}
      stockWarning={false}
      stockMessages={[]}
      labels={defaultLabels}
      onChange={vi.fn()}
      onFieldBlur={vi.fn()}
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
      screen.getByRole("heading", { name: "Checkout" }),
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
});
