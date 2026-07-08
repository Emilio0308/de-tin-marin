import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicBundleDetail } from "@de-tin-marin/validations/public-catalog";
import { BundleDetailPage } from "./bundle-detail-page";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

const baseBundle: PublicBundleDetail = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Combo Cumpleaños Arcoíris",
  imageUrl: "https://example.com/combo.png",
  quantity: 10,
  containerName: "Caja mediana",
  total: 89.9,
  itemCount: 3,
  itemsPreview: [],
  description: "La combinación perfecta para celebrar.",
  items: [
    {
      productId: "44444444-4444-4444-4444-444444444444",
      productName: "Gomitas",
      unitsPerPerson: 2,
    },
  ],
};

const defaultLabels = {
  back: "Volver a sorpresas",
  container: "Envase",
  quantity: "Cantidad",
  personCount: "Para 10 personas",
  items: "Incluye",
  personalize: "Personalizar",
  description: "Descripción",
};

describe("BundleDetailPage", () => {
  it("renderiza nombre, precio, chips y enlace de regreso", () => {
    render(
      <BundleDetailPage
        bundle={baseBundle}
        labels={defaultLabels}
        personalizeHref="/sorpresas/33333333-3333-3333-3333-333333333333/personalizar"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Combo Cumpleaños Arcoíris" }),
    ).toBeInTheDocument();
    expect(screen.getByText("$89.90")).toBeInTheDocument();
    expect(screen.getAllByText("Caja mediana").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Para 10 personas").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /volver a sorpresas/i }),
    ).toHaveAttribute("href", "/?tab=sorpresas");
  });

  it("enlaza al wizard de personalización", () => {
    render(
      <BundleDetailPage
        bundle={baseBundle}
        labels={defaultLabels}
        personalizeHref="/sorpresas/33333333-3333-3333-3333-333333333333/personalizar"
      />,
    );

    expect(
      screen.getAllByRole("link", { name: "Personalizar" })[0],
    ).toHaveAttribute(
      "href",
      "/sorpresas/33333333-3333-3333-3333-333333333333/personalizar",
    );
  });
});
