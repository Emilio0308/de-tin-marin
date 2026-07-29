import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderForm } from "./order-form";
import { emptyOrderFormValues, type OrderFormLabels } from "./order-form.types";

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
  subtotal: "Subtotal",
  total: "Total",
  createOrder: "Crear orden",
  creating: "Creando…",
  productLine: "Producto",
  surpriseLine: "Sorpresa",
  formatComponents: (count) => `(${count} dulces)`,
  formatQuantityLabel: (quantity) => `Cantidad: ${quantity}`,
  quantityBounds: (min, max) => `Mín. ${min} · Máx. ${max}`,
  configureSurprise: "Configurar sorpresa",
  customizeTitle: "Personalizar sorpresa",
  customizeSubtitle: "Plantilla editable",
  candyCount: "Dulces",
  customizationProgress: "Progreso",
  minCandiesReached: "Mínimo alcanzado",
  maxCandiesReached: "Máximo alcanzado",
  removeCandy: "Quitar",
  addCandy: "Agregar dulce",
  selectCandy: "Seleccionar dulce…",
  confirmSurprise: "Agregar al carrito",
  cancelCustomize: "Cancelar",
  validationMinCandies: "Mínimo 8",
  validationMaxCandies: "Máximo 20",
  editSurprise: "Editar dulces",
  candiesSubtotal: "Subtotal dulces",
  containerSubtotal: "Subtotal envases",
  containerCostHint: (unitPrice, quantity) => `${unitPrice} × ${quantity}`,
  unitPriceSuffix: "c/u",
  customizeTotal: "Total estimado",
  addCandyAction: "Agregar",
  candyAlreadyAdded: "Agregado",
  searchCandies: "Buscar dulces",
  searchCandiesPlaceholder: "Buscar…",
  expandPicker: "Ver catálogo",
  collapsePicker: "Ocultar",
  templatePersonCount: (count) => `Plantilla para ${count} personas`,
  priceCalculating: "Calculando precio…",
  surpriseQuantityHint: "Número de sorpresas a pedir.",
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
      deliveryDistricts={[]}
      bundleDraft={null}
      bundleDraftLoading={false}
      bundlePriceSummary={null}
      bundleUnitPricesByProductId={{}}
      isBundlePricePending={false}
      totals={null}
      submitting={false}
      error={null}
      labels={labels}
      onChange={vi.fn()}
      onAddProductLine={vi.fn()}
      onUpdateProductLineQuantity={vi.fn()}
      onStartBundleDraft={vi.fn()}
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

  it("shows product minimum quantity hint when a product is selected", () => {
    renderForm();

    fireEvent.change(screen.getByRole("combobox", { name: /producto/i }), {
      target: { value: "p1" },
    });

    expect(screen.getByText("Mín. 10 · Máx. 100")).toBeInTheDocument();
  });

  it("calls onSubmit when form has lines", () => {
    const onSubmit = vi.fn();
    renderForm({
      values: {
        ...emptyOrderFormValues,
        lines: [{ type: "product", productId: "p1", quantity: 10 }],
      },
      totals: {
        subtotal: 50,
        discountTotal: 0,
        shippingTotal: 0,
        total: 50,
      },
      onSubmit,
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear orden" }));
    expect(onSubmit).toHaveBeenCalled();
  });
});
