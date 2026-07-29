import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BUNDLE_CUSTOMIZATION_MIN,
  type BundleWizardTemplate,
} from "@de-tin-marin/validations/customize-bundle";
import { BundleWizardPage } from "./bundle-wizard-page";
import type { BundleWizardPageLabels } from "./bundle-wizard-page.types";

vi.mock(
  "@/modules/home/components/storefront-layout/storefront-layout",
  () => ({
    StorefrontLayout: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  }),
);

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      const templates: Record<string, string> = {
        title: "Tus dulces",
        remove: "Quitar",
        minReached: "Necesitas al menos {min} dulces en tu sorpresa.",
        count: "{current} de {max} dulces",
        progressLabel: "{current} de {max} dulces seleccionados",
        quantityBreakdown:
          "{perPerson} × {surprises} = {total} unidades - S/ {price}",
      };
      let result = templates[key] ?? key;
      if (values) {
        for (const [name, value] of Object.entries(values)) {
          result = result.replace(`{${name}}`, String(value));
        }
      }
      return result;
    },
}));

const baseTemplate: BundleWizardTemplate = {
  bundleId: "33333333-3333-3333-3333-333333333333",
  name: "Combo Cumpleaños Arcoíris",
  imageUrl: "https://example.com/combo.png",
  personCount: 10,
  container: {
    containerId: "22222222-2222-2222-2222-222222222222",
    sku: "CAJA-M",
    name: "Caja mediana",
    unitPrice: 15,
  },
  items: [
    {
      productId: "44444444-4444-4444-4444-444444444444",
      productName: "Gomitas",
      imageUrl: "https://example.com/gomitas.png",
      unitsPerPerson: 1,
    },
  ],
  initialComponents: [
    { productId: "44444444-4444-4444-4444-444444444444", quantityPerUnit: 1 },
    { productId: "55555555-5555-5555-5555-555555555555", quantityPerUnit: 1 },
    { productId: "66666666-6666-6666-6666-666666666666", quantityPerUnit: 1 },
    { productId: "77777777-7777-7777-7777-777777777777", quantityPerUnit: 1 },
    { productId: "88888888-8888-8888-8888-888888888888", quantityPerUnit: 1 },
    { productId: "99999999-9999-9999-9999-999999999999", quantityPerUnit: 1 },
    { productId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", quantityPerUnit: 1 },
    { productId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", quantityPerUnit: 1 },
  ],
};

const defaultLabels: BundleWizardPageLabels = {
  back: "Volver al combo",
  title: "Personaliza tu sorpresa",
  personCount: "Para 10 personas",
  addToCart: "Agregar al carrito",
  addToCartLoading: "Agregando…",
  validationMin: `Agrega al menos ${BUNDLE_CUSTOMIZATION_MIN} dulces para continuar.`,
  validationMax: "Puedes incluir como máximo 20 dulces.",
  validationDuplicate: "No puedes repetir el mismo dulce.",
  picker: {
    title: "Agregar dulce",
    searchPlaceholder: "Buscar por nombre o SKU…",
    searchAriaLabel: "Buscar dulces para agregar",
    add: "Agregar",
    empty: "No encontramos dulces con esa búsqueda.",
    maxReached: "Ya alcanzaste el máximo de 20 dulces.",
    alreadyAdded: "Agregado",
    loading: "Cargando…",
    loadingMore: "Cargando más dulces…",
    error: "Error",
    retry: "Reintentar",
    expand: "Mostrar buscador",
    collapse: "Ocultar buscador",
  },
  price: {
    total: "Total de tu sorpresa",
    loading: "Calculando precio…",
    invalid: "Ajusta tu selección para ver el total.",
    previewError: "No pudimos calcular el precio. Intenta de nuevo.",
    retry: "Reintentar",
  },
  stock: {
    title: "Stock limitado",
    checking: "Verificando stock…",
    productShortage: "Dulce",
    containerShortage: "Envase",
  },
};

const defaultProps = {
  template: baseTemplate,
  components: baseTemplate.initialComponents,
  searchValue: "",
  products: [],
  selectedProductIds: new Set(
    baseTemplate.initialComponents.map((c) => c.productId),
  ),
  labelsByProductId: {
    "44444444-4444-4444-4444-444444444444": "Gomitas",
    "55555555-5555-5555-5555-555555555555": "Chocolate",
    "66666666-6666-6666-6666-666666666666": "Paleta",
    "77777777-7777-7777-7777-777777777777": "Chicle",
    "88888888-8888-8888-8888-888888888888": "Caramelo",
    "99999999-9999-9999-9999-999999999999": "Mentita",
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "Trufas",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "Galletas",
  },
  imagesByProductId: {
    "44444444-4444-4444-4444-444444444444": "https://example.com/gomitas.png",
    "55555555-5555-5555-5555-555555555555": "https://example.com/chocolate.png",
    "66666666-6666-6666-6666-666666666666": "https://example.com/paleta.png",
    "77777777-7777-7777-7777-777777777777": "https://example.com/chicle.png",
    "88888888-8888-8888-8888-888888888888": "https://example.com/caramelo.png",
    "99999999-9999-9999-9999-999999999999": "https://example.com/mentita.png",
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": "https://example.com/trufas.png",
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "https://example.com/galletas.png",
  },
  unitPricesByProductId: {
    "44444444-4444-4444-4444-444444444444": 1.5,
    "55555555-5555-5555-5555-555555555555": 2,
    "66666666-6666-6666-6666-666666666666": 1,
    "77777777-7777-7777-7777-777777777777": 0.5,
    "88888888-8888-8888-8888-888888888888": 1.2,
    "99999999-9999-9999-9999-999999999999": 0.8,
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": 3,
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": 1.1,
  },
  lineTotal: 89.9,
  stockCheck: null,
  isValid: true,
  canRemove: true,
  canAdd: true,
  isPreviewLoading: false,
  isPreviewError: false,
  isProductsLoading: false,
  isProductsFetchingNextPage: false,
  hasMoreProducts: false,
  isProductsError: false,
  isAddingToCart: false,
  labels: defaultLabels,
  onRemove: vi.fn(),
  onAdd: vi.fn(),
  onSearchChange: vi.fn(),
  onSearchSubmit: vi.fn(),
  onProductsRetry: vi.fn(),
  onLoadMoreProducts: vi.fn(),
  onPreviewRetry: vi.fn(),
  onAddToCart: vi.fn(),
};

describe("BundleWizardPage", () => {
  it("renderiza título, chips, contador y enlace de regreso", () => {
    render(<BundleWizardPage {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Personaliza tu sorpresa" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Combo Cumpleaños Arcoíris")).toBeInTheDocument();
    expect(screen.getAllByText("Caja mediana").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Para 10 personas").length).toBeGreaterThan(0);
    expect(screen.getByText("8 de 20 dulces")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /volver al combo/i }),
    ).toHaveAttribute(
      "href",
      "/sorpresas/33333333-3333-3333-3333-333333333333",
    );
  });

  it("muestra precio y habilita agregar al carrito cuando la composición es válida", () => {
    render(<BundleWizardPage {...defaultProps} />);

    expect(screen.getAllByText("S/89.90").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /agregar al carrito/i }),
    ).toBeEnabled();
  });

  it("deshabilita CTA y muestra validación cuando faltan dulces", () => {
    render(
      <BundleWizardPage
        {...defaultProps}
        components={defaultProps.components.slice(0, 4)}
        isValid={false}
        canRemove={false}
        lineTotal={null}
      />,
    );

    expect(
      screen.getAllByText(
        `Agrega al menos ${BUNDLE_CUSTOMIZATION_MIN} dulces para continuar.`,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /agregar al carrito/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        `Necesitas al menos ${BUNDLE_CUSTOMIZATION_MIN} dulces en tu sorpresa.`,
      ),
    ).toBeInTheDocument();
  });

  it("invoca onAddToCart al hacer clic en el CTA", () => {
    const onAddToCart = vi.fn();

    render(<BundleWizardPage {...defaultProps} onAddToCart={onAddToCart} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar al carrito/i }),
    );

    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
