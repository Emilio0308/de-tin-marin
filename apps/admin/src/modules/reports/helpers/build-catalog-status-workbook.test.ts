import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildCatalogStatusWorkbook,
  catalogStatusFilename,
} from "./build-catalog-status-workbook";
import type { CatalogStatusReportData } from "../types/catalog-status-report.dto";

function sampleData(
  overrides: Partial<CatalogStatusReportData> = {},
): CatalogStatusReportData {
  return {
    meta: {
      generatedAt: "2026-07-30T12:00:00.000Z",
      sections: ["products", "packs"],
      timezone: "UTC",
    },
    products: [
      {
        sku: "SKU-1",
        name: "Gomitas",
        description: null,
        slug: "gomitas",
        brand: "Marca",
        categoryName: "Dulces",
        productType: "unit",
        itemsPerPackage: 1,
        packageLabel: null,
        netPrice: 2,
        unitNetPrice: 2,
        finalPrice: 2,
        finalUnitPrice: 2,
        campaignName: null,
        campaignPercentage: null,
        costNetPrice: null,
        margin: null,
        marginPct: null,
        stockSealedPackages: 0,
        stockLooseBaseUnits: 0,
        stockTotalBaseUnits: 0,
        stockDisplay: "0 u.",
        stockInPresentations: 0,
        purchaseMinQuantity: 10,
        purchaseMaxQuantity: 100,
        isActive: false,
        imageUrl: null,
      },
    ],
    bundles: [],
    bundleComposition: [],
    packs: [
      {
        sku: "PACK-1",
        name: "Combo",
        description: null,
        slug: "combo",
        referencePrice: 10,
        normalPrice: 12,
        finalPrice: 12,
        campaignName: null,
        campaignPercentage: null,
        itemCount: 1,
        availableQuantity: 0,
        purchaseMinQuantity: 1,
        purchaseMaxQuantity: 100,
        isActive: true,
        imageUrl: null,
      },
    ],
    packComposition: [
      {
        packSku: "PACK-1",
        packName: "Combo",
        productSku: "SKU-1",
        productName: "Gomitas",
        packageQuantity: 2,
        unitQuantity: 0,
        packageNetPrice: 5,
        unitNetPrice: 0.5,
        productPresentations: 4,
        productIsActive: true,
      },
    ],
    containers: [],
    orders: [],
    orderCarts: [],
    ...overrides,
  };
}

function sheetValues(sheet: ExcelJS.Worksheet): (string | number | null)[] {
  const values: (string | number | null)[] = [];
  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value;
      if (typeof value === "string" || typeof value === "number") {
        values.push(value);
      } else if (value === null || value === undefined) {
        values.push(null);
      } else if (
        typeof value === "object" &&
        value !== null &&
        "text" in value &&
        typeof (value as { text: unknown }).text === "string"
      ) {
        values.push((value as { text: string }).text);
      } else if (
        typeof value === "object" &&
        value !== null &&
        "result" in value &&
        (typeof (value as { result: unknown }).result === "string" ||
          typeof (value as { result: unknown }).result === "number")
      ) {
        values.push((value as { result: string | number }).result);
      }
    });
  });
  return values;
}

describe("catalogStatusFilename", () => {
  it("usa YYYYMMDD del ISO", () => {
    expect(catalogStatusFilename("2026-07-30T12:00:00.000Z")).toBe(
      "catalog-status-20260730.xlsx",
    );
  });
});

describe("buildCatalogStatusWorkbook", () => {
  it("incluye Meta y solo hojas de secciones pedidas (sin *_composicion)", async () => {
    const buffer = await buildCatalogStatusWorkbook(sampleData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const names = workbook.worksheets.map((sheet) => sheet.name);
    expect(names).toEqual(["Meta", "Productos", "Packs"]);
    expect(names).not.toContain("Packs_composicion");
    expect(names).not.toContain("Sorpresas");
    expect(names).not.toContain("Envases");
  });

  it("escribe headers y filas con inactivo y stock 0", async () => {
    const buffer = await buildCatalogStatusWorkbook(sampleData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const products = workbook.getWorksheet("Productos");
    expect(products).toBeTruthy();
    expect(products!.getRow(1).getCell(1).value).toBe("SKU");
    expect(products!.getRow(1).getCell(16).value).toBe("Costo");
    expect(products!.getRow(1).getCell(17).value).toBe("Margen");
    expect(products!.getRow(1).getCell(18).value).toBe("Margen %");
    expect(products!.getRow(2).getCell(1).value).toBe("SKU-1");
    expect(products!.getRow(2).getCell(16).value).toBe("—");
    expect(products!.getRow(2).getCell(17).value).toBe("—");
    expect(products!.getRow(2).getCell(18).value).toBe("—");
    expect(products!.getRow(2).getCell(26).value).toBe("No");
    expect(products!.getRow(2).getCell(21).value).toBe(0);
  });

  it("incluye costo y margen cuando costNetPrice > 0", async () => {
    const buffer = await buildCatalogStatusWorkbook(
      sampleData({
        products: [
          {
            sku: "SKU-2",
            name: "Chocolate",
            description: null,
            slug: "chocolate",
            brand: null,
            categoryName: "Dulces",
            productType: "unit",
            itemsPerPackage: 1,
            packageLabel: null,
            netPrice: 15,
            unitNetPrice: 15,
            finalPrice: 15,
            finalUnitPrice: 15,
            campaignName: null,
            campaignPercentage: null,
            costNetPrice: 10,
            margin: 5,
            marginPct: 0.5,
            stockSealedPackages: 0,
            stockLooseBaseUnits: 3,
            stockTotalBaseUnits: 3,
            stockDisplay: "3 u.",
            stockInPresentations: 3,
            purchaseMinQuantity: 10,
            purchaseMaxQuantity: 100,
            isActive: true,
            imageUrl: null,
          },
        ],
      }),
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const products = workbook.getWorksheet("Productos");
    expect(products!.getRow(2).getCell(16).value).toBe(10);
    expect(products!.getRow(2).getCell(17).value).toBe(5);
    expect(products!.getRow(2).getCell(18).value).toBe(50);
  });

  it("agrupa pack: datos generales y componentes debajo", async () => {
    const buffer = await buildCatalogStatusWorkbook(sampleData());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const packs = workbook.getWorksheet("Packs");
    expect(packs).toBeTruthy();
    const values = sheetValues(packs!);
    expect(values).toContain("Pack: PACK-1 — Combo");
    expect(values).toContain("Precio final");
    expect(values).toContain("Componentes");
    expect(values).toContain("Producto SKU");
    expect(values).toContain("SKU-1");
    expect(values).toContain("Gomitas");
  });

  it("agrupa sorpresa: datos generales y componentes debajo", async () => {
    const buffer = await buildCatalogStatusWorkbook(
      sampleData({
        meta: {
          generatedAt: "2026-07-30T12:00:00.000Z",
          sections: ["bundles"],
          timezone: "UTC",
        },
        products: [],
        packs: [],
        packComposition: [],
        bundles: [
          {
            name: "Sorpresa A",
            description: null,
            isActive: true,
            quantity: 2,
            containerSku: "ENV-1",
            containerName: "Caja",
            containerNetPrice: 1,
            containerStock: 5,
            itemCount: 1,
            itemsSubtotal: 2,
            containerSubtotal: 2,
            total: 4,
            imageUrl: null,
          },
        ],
        bundleComposition: [
          {
            bundleName: "Sorpresa A",
            productSku: "SKU-1",
            productName: "Gomitas",
            unitsPerPerson: 1,
            unitNetPrice: 2,
            productIsActive: true,
            productStockDisplay: "10 u.",
          },
        ],
      }),
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const names = workbook.worksheets.map((sheet) => sheet.name);
    expect(names).toEqual(["Meta", "Sorpresas"]);
    expect(names).not.toContain("Sorpresas_composicion");

    const sorpresas = workbook.getWorksheet("Sorpresas");
    expect(sorpresas).toBeTruthy();
    const values = sheetValues(sorpresas!);
    expect(values).toContain("Sorpresa: Sorpresa A");
    expect(values).toContain("Total estimado");
    expect(values).toContain("Componentes");
    expect(values).toContain("SKU-1");
    expect(values).toContain("10 u.");
  });

  it("añade Ordenes y Ordenes_carrito con link Ver productos", async () => {
    const buffer = await buildCatalogStatusWorkbook(
      sampleData({
        meta: {
          generatedAt: "2026-07-30T12:00:00.000Z",
          sections: ["orders"],
          timezone: "UTC",
        },
        products: [],
        packs: [],
        packComposition: [],
        orders: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            orderNumber: "TM-20260730-0001",
            status: "paid",
            paymentStatus: "confirmed",
            customerName: "Ana Pérez",
            customerEmail: "ana@example.com",
            customerPhone: "999",
            fulfillmentMethod: "pickup",
            subtotal: 20,
            discountTotal: 0,
            surchargeTotal: 0,
            shippingTotal: 0,
            total: 20,
            lineCount: 1,
            currencyCode: "PEN",
            createdAt: "2026-07-30T12:00:00.000Z",
            cartAnchor: "Orden_TM_20260730_0001",
          },
        ],
        orderCarts: [
          {
            orderNumber: "TM-20260730-0001",
            cartAnchor: "Orden_TM_20260730_0001",
            status: "paid",
            paymentStatus: "confirmed",
            customerName: "Ana Pérez",
            total: 20,
            lines: [
              {
                level: "line",
                lineType: "product",
                sku: "SKU-1",
                name: "Gomitas",
                quantity: 2,
                unitPrice: 10,
                lineTotal: 20,
                detail: null,
              },
            ],
          },
        ],
      }),
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const names = workbook.worksheets.map((sheet) => sheet.name);
    expect(names).toEqual(["Meta", "Ordenes", "Ordenes_carrito"]);

    const ordenes = workbook.getWorksheet("Ordenes");
    expect(ordenes).toBeTruthy();
    expect(ordenes!.getRow(1).getCell(16).value).toBe("Ver productos");
    const linkCell = ordenes!.getRow(2).getCell(16).value as {
      text?: string;
      hyperlink?: string;
    };
    expect(linkCell.text).toBe("Ver productos");
    expect(linkCell.hyperlink).toMatch(/Ordenes_carrito/);

    const cart = workbook.getWorksheet("Ordenes_carrito");
    expect(cart).toBeTruthy();
    const values = sheetValues(cart!);
    expect(values).toContain("Orden: TM-20260730-0001");
    expect(values).toContain("Gomitas");
    expect(values).toContain("product");
  });
});
