import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { shouldShowItemsPerPackage } from "./product-search-picker.helpers";
import { ProductSearchPicker } from "./product-search-picker";
import type { ProductSearchPickerItem } from "./product-search-picker.types";

const labels = {
  searchPlaceholder: "Buscar…",
  searchAriaLabel: "Buscar producto",
  empty: "No hay productos que coincidan.",
  loading: "Buscando productos…",
  loadMore: "Cargar más",
  noMore: "No hay más resultados",
  formatUnitPrice: (price: string) => `${price} c/u`,
  formatItemsPerPackage: (count: number) => `${count} und. / presentación`,
};

const unitItem: ProductSearchPickerItem = {
  id: "p1",
  name: "Gomitas",
  sku: "SKU-1",
  netPrice: 5,
  unitNetPrice: 1.5,
  finalPrice: 5,
  finalUnitPrice: 1.5,
  imageUrl: null,
  productType: "unit",
  itemsPerPackage: 1,
  stockTotalBaseUnits: 10,
  purchaseMinQuantity: 1,
  purchaseMaxQuantity: 10,
};

const packageItem: ProductSearchPickerItem = {
  ...unitItem,
  id: "p2",
  name: "Chocolate caja",
  sku: "SKU-2",
  productType: "package",
  itemsPerPackage: 12,
  unitNetPrice: 0.8,
};

describe("shouldShowItemsPerPackage", () => {
  it("hides for simple unit products", () => {
    expect(shouldShowItemsPerPackage(unitItem)).toBe(false);
  });

  it("shows for package presentations", () => {
    expect(shouldShowItemsPerPackage(packageItem)).toBe(true);
  });
});

describe("ProductSearchPicker", () => {
  it("lists image, name and unit price without sku", () => {
    render(
      <ProductSearchPicker
        items={[unitItem]}
        excludeIds={[]}
        searchValue=""
        isLoading={false}
        isError={false}
        canLoadMore={false}
        labels={labels}
        onSearchChange={() => {}}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );

    expect(screen.getByText("S/ 5.00")).toBeInTheDocument();
    expect(screen.getByText("S/ 1.50 c/u")).toBeInTheDocument();
    expect(screen.queryByText("SKU-1")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No hay productos que coincidan."),
    ).not.toBeInTheDocument();
  });

  it("shows items per package when presentation applies", () => {
    render(
      <ProductSearchPicker
        items={[packageItem]}
        excludeIds={[]}
        searchValue=""
        isLoading={false}
        isError={false}
        canLoadMore={false}
        labels={labels}
        onSearchChange={() => {}}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );

    expect(screen.getByText("12 und. / presentación")).toBeInTheDocument();
  });

  it("calls onSelect when a product is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ProductSearchPicker
        items={[unitItem]}
        excludeIds={[]}
        searchValue=""
        isLoading={false}
        isError={false}
        canLoadMore={false}
        labels={labels}
        onSearchChange={() => {}}
        onSelect={onSelect}
        onLoadMore={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("option"));
    expect(onSelect).toHaveBeenCalledWith(unitItem);
  });
});
