import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuestOrderLookupPage } from "./guest-order-lookup-page";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

describe("GuestOrderLookupPage", () => {
  it("renderiza formulario de búsqueda", () => {
    render(
      <GuestOrderLookupPage
        form={{ orderNumber: "", email: "" }}
        order={null}
        isSubmitting={false}
        errorMessage={null}
        labels={{
          title: "Mis pedidos",
          subtitle: "Consulta tu pedido",
          orderNumber: "Número de pedido",
          email: "Correo electrónico",
          submit: "Buscar pedido",
          submitting: "Buscando…",
          detail: {
            subtotal: "Subtotal",
            shipping: "Envío",
            total: "Total",
            linesTitle: "Tu pedido",
            status: "Estado",
            paymentStatus: "Pago",
            deliveryTitle: "Entrega",
            pickupTitle: "Recojo",
            bundleBadge: "Sorpresa",
            bundleComponents: "dulces",
            formatBundlePersons: (count) => `Para ${count} personas`,
            formatStatus: (status) => status,
            formatPaymentStatus: (paymentStatus) => paymentStatus,
          },
          payment: {
            title: "Instrucciones de pago",
            yapeLabel: "Yape",
            transferLabel: "Transferencia bancaria",
            yape: "Yape",
            transfer: "Transferencia",
            note: "Nota",
          },
        }}
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Mis pedidos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Buscar pedido" }),
    ).toBeInTheDocument();
  });
});
