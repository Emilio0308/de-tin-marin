import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderForm } from "./order-form";
import { emptyOrderFormValues, type OrderFormLabels } from "./order-form.types";

vi.mock(
  "@/modules/catalog/components/product-search-picker/product-search-picker.container",
  () => ({
    ProductSearchPickerContainer: ({
      onSelect,
    }: {
      onSelect: (item: {
        id: string;
        name: string;
        sku: string;
        netPrice: number;
        unitNetPrice: number;
        finalPrice: number;
        finalUnitPrice: number;
        imageUrl: string | null;
        productType: "unit" | "package";
        itemsPerPackage: number;
        stockTotalBaseUnits: number;
        purchaseMinQuantity: number;
        purchaseMaxQuantity: number;
      }) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onSelect({
            id: "p1",
            name: "Galleta",
            sku: "SKU-1",
            netPrice: 5,
            unitNetPrice: 5,
            finalPrice: 5,
            finalUnitPrice: 5,
            imageUrl: null,
            productType: "unit",
            itemsPerPackage: 1,
            stockTotalBaseUnits: 100,
            purchaseMinQuantity: 10,
            purchaseMaxQuantity: 100,
          })
        }
      >
        pick-product
      </button>
    ),
  }),
);

const labels: OrderFormLabels = {
  contactSection: "Cliente",
  deliverySection: "Entrega",
  cartSection: "Carrito",
  totalsSection: "Totales",
  name: "Nombre",
  lastName: "Apellido",
  phone: "Teléfono",
  email: "Correo",
  delivery: "Delivery",
  pickup: "Recojo",
  pickupPoint: "Punto de recojo",
  courier: "Envío por agencia",
  selectPickupPoint: "Seleccionar punto…",
  courierDepartment: "Departamento",
  selectCourierDepartment: "Seleccionar departamento…",
  courierProvince: "Provincia",
  selectCourierProvince: "Seleccionar provincia…",
  courierDni: "DNI",
  courierFullName: "Nombre completo",
  courierAgencyAddress: "Dirección agencia",
  recipientName: "Destinatario",
  address: "Dirección",
  district: "Distrito",
  city: "Ciudad",
  province: "Provincia",
  reference: "Referencia",
  deliveryPhone: "Teléfono entrega",
  selectDistrict: "Seleccionar distrito…",
  product: "Producto",
  selectProduct: "Seleccionar producto…",
  quantity: "Cantidad",
  addProduct: "Agregar producto",
  surprise: "Sorpresa",
  selectSurprise: "Seleccionar sorpresa…",
  surpriseQuantity: "Cant. sorpresas",
  addSurprise: "Agregar sorpresa",
  removeLine: "Quitar",
  emptyLines: "Agrega al menos una línea.",
  shipping: "Envío",
  shippingHint: "Calculado según distrito.",
  discount: "Descuento",
  surcharge: "Recargo",
  finalPrice: "Precio final",
  finalPriceHint: "Incluye todo",
  tabFinalPrice: "Precio final",
  tabAdjustments: "Descuento / recargo",
  subtotal: "Subtotal",
  total: "Total",
  createOrder: "Crear orden",
  creating: "Creando…",
  productLine: "Producto",
  surpriseLine: "Sorpresa",
  formatComponents: (count) => `(${count} dulces)`,
  viewComponents: (count) => `Ver componentes (${count})`,
  formatPackComponentQty: (packages, units) =>
    units > 0 ? `${packages} paq. + ${units} u.` : `${packages} paq.`,
  formatProductDualQty: (packages, units) =>
    units > 0 ? `${packages} paq. + ${units} u.` : `${packages} paq.`,
  formatQuantityLabel: (quantity) => `Cantidad: ${quantity}`,
  packagesLabel: "Paquetes",
  unitsLabel: "Unidades",
  quantityBounds: (min, max) => `Mín. ${min} · Máx. ${max}`,
  configureSurprise: "Configurar sorpresa",
  addingSurprise: "Agregando…",
  tabProducts: "Productos",
  tabCombos: "Combos",
  tabSurprises: "Sorpresas",
  selectProductFirst: "Selecciona un producto para agregarlo.",
  productOutOfStock: (min, available) =>
    `Sin stock suficiente (mín. ${min}, disponible ${available}).`,
  customizeTitle: "Personalizar sorpresa",
  customizeSubtitle: (min, max) =>
    `Parte de la plantilla. Puedes quitar o agregar dulces (${min}–${max}).`,
  candyCount: "Dulces",
  customizationProgress: "Progreso",
  minCandiesReached: (min) => `Mínimo de ${min} dulces.`,
  maxCandiesReached: (max) => `Máximo de ${max} dulces alcanzado.`,
  removeCandy: "Quitar",
  addCandy: "Agregar dulce",
  selectCandy: "Seleccionar dulce…",
  confirmSurprise: "Agregar al carrito",
  cancelCustomize: "Cancelar",
  validationMinCandies: (min) =>
    `La sorpresa debe tener al menos ${min} dulces.`,
  validationMaxCandies: (max) =>
    `La sorpresa no puede tener más de ${max} dulces.`,
  editSurprise: "Editar dulces",
  candiesSubtotal: "Subtotal dulces",
  containerSubtotal: "Subtotal envases",
  containerCostHint: (unitPrice, quantity) => `${unitPrice} × ${quantity}`,
  unitPriceSuffix: "c/u",
  customizeTotal: "Total a cobrar",
  formatBundleTheoreticalTotal: (price) =>
    `Costo teórico (sin redondeo): ${price}`,
  formatBundlePerSurprisePrice: (chargeable, theoretical) =>
    `Por sorpresa: ${chargeable} · teórico ${theoretical}`,
  addCandyAction: "Agregar",
  candyAlreadyAdded: "Agregado",
  searchCandies: "Buscar dulces",
  searchCandiesPlaceholder: "Buscar…",
  expandPicker: "Ver catálogo",
  collapsePicker: "Ocultar",
  templatePersonCount: (count) => `Plantilla para ${count} personas`,
  priceCalculating: "Calculando precio…",
  surpriseQuantityHint: "Número de sorpresas a pedir.",
  combo: "Combo",
  selectCombo: "Seleccionar combo…",
  selectComboFirst: "Selecciona un combo para agregarlo.",
  addCombo: "Agregar combo",
  comboLine: "Combo",
  packOutOfStock: (available) =>
    `Sin stock para armar el combo (disponible ${available}).`,
  packStockShortages: (names) => `Productos sin stock: ${names}.`,
};

const baseProduct = {
  id: "p1",
  name: "Gomitas",
  sku: "GOM-1",
  finalPrice: 5,
  finalUnitPrice: 5,
  imageUrl: null,
  productType: "unit" as const,
  itemsPerPackage: 1,
  stockTotalBaseUnits: 100,
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

function renderForm(overrides?: Partial<Parameters<typeof OrderForm>[0]>) {
  return render(
    <OrderForm
      values={emptyOrderFormValues}
      products={[baseProduct]}
      bundles={[]}
      packs={[]}
      packCompositionsById={new Map()}
      deliveryDistricts={[]}
      pickupPoints={[]}
      courierDepartments={[]}
      bundleDraft={null}
      bundleDraftLoading={false}
      bundlePriceSummary={null}
      bundleUnitPricesByProductId={{}}
      isBundlePricePending={false}
      totals={null}
      submitting={false}
      error={null}
      fieldErrors={{}}
      labels={labels}
      onChange={vi.fn()}
      onFieldBlur={vi.fn()}
      onEnsureProductOption={vi.fn()}
      onAddProductLine={vi.fn()}
      onUpdateProductLineQuantity={vi.fn()}
      onAddPackLine={vi.fn()}
      onStartBundleDraft={vi.fn()}
      onAddBundleAsTemplate={vi.fn()}
      onAddBundleCandy={vi.fn()}
      onBundleDraftComponentsChange={vi.fn()}
      onBundleDraftQuantityChange={vi.fn()}
      onConfirmBundleDraft={vi.fn()}
      onCancelBundleDraft={vi.fn()}
      onEditBundleLine={vi.fn()}
      onRemoveLine={vi.fn()}
      getLineTotal={vi.fn(() => 50)}
      onSubmit={vi.fn()}
      {...overrides}
    />,
  );
}

describe("OrderForm", () => {
  it("renders sections and disables submit without lines", () => {
    renderForm();

    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Entrega")).toBeInTheDocument();
    expect(screen.getByText("Carrito")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear orden" })).toBeDisabled();
  });

  it("shows product quantity bounds by stock when a product is selected", () => {
    renderForm();

    fireEvent.click(screen.getByText("pick-product"));

    expect(screen.getByText("Mín. 1 · Máx. 100")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar producto" }),
    ).toBeEnabled();
  });

  it("disables add product and explains missing selection", () => {
    renderForm();

    expect(
      screen.getByRole("button", { name: "Agregar producto" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Selecciona un producto para agregarlo."),
    ).toBeInTheDocument();
  });

  it("shows surprise actions in the surprises tab", () => {
    renderForm({
      bundles: [
        {
          id: "b1",
          name: "Sorpresa fiesta",
          containerId: "c1",
          containerName: "Caja",
          containerNetPrice: 2,
          templateQuantity: 10,
        },
      ],
    });

    fireEvent.click(screen.getByRole("tab", { name: /Sorpresas/i }));
    expect(
      screen.getByRole("button", { name: "Agregar sorpresa" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Configurar sorpresa" }),
    ).toBeDisabled();
  });

  it("calls onSubmit when form has lines", () => {
    const onSubmit = vi.fn();
    renderForm({
      values: {
        ...emptyOrderFormValues,
        lines: [
          {
            type: "product",
            productId: "p1",
            packageQuantity: 10,
            unitQuantity: 0,
          },
        ],
      },
      totals: {
        subtotal: 50,
        discountTotal: 0,
        surchargeTotal: 0,
        shippingTotal: 0,
        total: 50,
      },
      onSubmit,
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear orden" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
