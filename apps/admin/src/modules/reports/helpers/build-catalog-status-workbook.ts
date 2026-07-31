import ExcelJS from "exceljs";
import { roundMoney } from "@de-tin-marin/shared/prices";
import type {
  CatalogStatusBundleCompositionRow,
  CatalogStatusBundleRow,
  CatalogStatusOrderCartBlock,
  CatalogStatusOrderListRow,
  CatalogStatusPackCompositionRow,
  CatalogStatusPackRow,
  CatalogStatusReportData,
} from "../types/catalog-status-report.dto";

const PRODUCT_HEADERS = [
  "SKU",
  "Nombre",
  "Descripción",
  "Slug",
  "Marca",
  "Categoría",
  "Tipo",
  "Items por paquete",
  "Etiqueta presentación",
  "Precio presentación",
  "Precio unitario",
  "Precio final",
  "Precio unitario final",
  "Campaña",
  "Campaña %",
  "Costo",
  "Margen",
  "Margen %",
  "Stock sealed",
  "Stock loose",
  "Stock total base",
  "Stock display",
  "Presentaciones vendibles",
  "Min compra",
  "Max compra",
  "Activo",
  "URL imagen",
] as const;

const BUNDLE_ITEM_HEADERS = [
  "Producto SKU",
  "Producto nombre",
  "Units per person",
  "Precio unitario",
  "Producto activo",
  "Stock producto",
] as const;

const PACK_ITEM_HEADERS = [
  "Producto SKU",
  "Producto nombre",
  "Package quantity",
  "Precio presentación",
  "Presentaciones producto",
  "Producto activo",
] as const;

const CONTAINER_HEADERS = [
  "SKU",
  "Nombre",
  "Descripción",
  "Precio",
  "Stock",
  "Activo",
  "URL imagen",
] as const;

const ORDER_LIST_HEADERS = [
  "Nº orden",
  "Estado",
  "Pago",
  "Cliente",
  "Email",
  "Teléfono",
  "Fulfillment",
  "Subtotal",
  "Descuento",
  "Envío",
  "Total",
  "# líneas",
  "Moneda",
  "Creada",
  "Ver productos",
] as const;

const ORDER_CART_LINE_HEADERS = [
  "Nivel",
  "Tipo",
  "SKU",
  "Nombre",
  "Cantidad",
  "Precio unitario",
  "Total línea",
  "Detalle",
] as const;

type CellValue = string | number | null;

function boolLabel(value: boolean): string {
  return value ? "Sí" : "No";
}

function nullableCell(value: number | null): number | string {
  return value === null ? "—" : value;
}

function marginPctCell(marginPct: number | null): number | string {
  if (marginPct === null) return "—";
  return roundMoney(marginPct * 100);
}

function setColumnWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
  rows: CellValue[][],
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow([...headers]);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  headers.forEach((_, index) => {
    sheet.getColumn(index + 1).width = 18;
  });
}

function addLabelValueRows(
  sheet: ExcelJS.Worksheet,
  pairs: [string, CellValue][],
): void {
  for (const [label, value] of pairs) {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
  }
}

function addSectionTitle(sheet: ExcelJS.Worksheet, title: string): void {
  const row = sheet.addRow([title]);
  row.font = { bold: true, size: 13 };
}

function addSubsectionTitle(sheet: ExcelJS.Worksheet, title: string): void {
  const row = sheet.addRow([title]);
  row.font = { bold: true };
}

function addBundlesSheet(
  workbook: ExcelJS.Workbook,
  bundles: CatalogStatusBundleRow[],
  composition: CatalogStatusBundleCompositionRow[],
): void {
  const sheet = workbook.addWorksheet("Sorpresas");
  setColumnWidths(sheet, [28, 22, 28, 18, 18, 18]);

  if (bundles.length === 0) {
    sheet.addRow(["Sin sorpresas"]);
    return;
  }

  bundles.forEach((bundle, index) => {
    if (index > 0) {
      sheet.addRow([]);
    }

    addSectionTitle(sheet, `Sorpresa: ${bundle.name}`);
    addLabelValueRows(sheet, [
      ["Nombre", bundle.name],
      ["Descripción", bundle.description],
      ["Activo", boolLabel(bundle.isActive)],
      ["Cantidad personas", bundle.quantity],
      ["Envase SKU", bundle.containerSku],
      ["Envase nombre", bundle.containerName],
      ["Precio envase", bundle.containerNetPrice],
      ["Stock envase", bundle.containerStock],
      ["# componentes", bundle.itemCount],
      ["Subtotal items (por sorpresa)", bundle.itemsSubtotal],
      ["Subtotal envase (total)", bundle.containerSubtotal],
      ["Total estimado", bundle.total],
      ["URL imagen", bundle.imageUrl],
    ]);

    sheet.addRow([]);
    addSubsectionTitle(sheet, "Componentes");
    const headerRow = sheet.addRow([...BUNDLE_ITEM_HEADERS]);
    headerRow.font = { bold: true };

    const items = composition.filter((item) => item.bundleName === bundle.name);
    if (items.length === 0) {
      sheet.addRow(["—", "Sin componentes", null, null, null, null]);
      return;
    }

    for (const item of items) {
      sheet.addRow([
        item.productSku,
        item.productName,
        item.unitsPerPerson,
        item.unitNetPrice,
        boolLabel(item.productIsActive),
        item.productStockDisplay,
      ]);
    }
  });
}

function addPacksSheet(
  workbook: ExcelJS.Workbook,
  packs: CatalogStatusPackRow[],
  composition: CatalogStatusPackCompositionRow[],
): void {
  const sheet = workbook.addWorksheet("Packs");
  setColumnWidths(sheet, [28, 22, 28, 18, 22, 18]);

  if (packs.length === 0) {
    sheet.addRow(["Sin packs"]);
    return;
  }

  packs.forEach((pack, index) => {
    if (index > 0) {
      sheet.addRow([]);
    }

    addSectionTitle(sheet, `Pack: ${pack.sku} — ${pack.name}`);
    addLabelValueRows(sheet, [
      ["SKU", pack.sku],
      ["Nombre", pack.name],
      ["Descripción", pack.description],
      ["Slug", pack.slug],
      ["Precio reference", pack.referencePrice],
      ["Precio normal", pack.normalPrice],
      ["Precio final", pack.finalPrice],
      ["Campaña", pack.campaignName],
      ["Campaña %", pack.campaignPercentage],
      ["# items", pack.itemCount],
      ["Disponibilidad", pack.availableQuantity],
      ["Min compra", pack.purchaseMinQuantity],
      ["Max compra", pack.purchaseMaxQuantity],
      ["Activo", boolLabel(pack.isActive)],
      ["URL imagen", pack.imageUrl],
    ]);

    sheet.addRow([]);
    addSubsectionTitle(sheet, "Componentes");
    const headerRow = sheet.addRow([...PACK_ITEM_HEADERS]);
    headerRow.font = { bold: true };

    const items = composition.filter(
      (item) => item.packSku === pack.sku && item.packName === pack.name,
    );
    if (items.length === 0) {
      sheet.addRow(["—", "Sin componentes", null, null, null, null]);
      return;
    }

    for (const item of items) {
      sheet.addRow([
        item.productSku,
        item.productName,
        item.packageQuantity,
        item.packageNetPrice,
        item.productPresentations,
        boolLabel(item.productIsActive),
      ]);
    }
  });
}

function addOrdersSheets(
  workbook: ExcelJS.Workbook,
  orders: CatalogStatusOrderListRow[],
  orderCarts: CatalogStatusOrderCartBlock[],
): void {
  const listSheet = workbook.addWorksheet("Ordenes");
  const cartSheet = workbook.addWorksheet("Ordenes_carrito");
  setColumnWidths(
    listSheet,
    [18, 16, 12, 22, 24, 14, 12, 12, 12, 12, 12, 10, 10, 22, 16],
  );
  setColumnWidths(cartSheet, [14, 12, 18, 28, 12, 14, 12, 40]);

  const cartStartRows = new Map<string, number>();

  if (orderCarts.length === 0) {
    cartSheet.addRow(["Sin órdenes"]);
  } else {
    orderCarts.forEach((block, index) => {
      if (index > 0) {
        cartSheet.addRow([]);
      }

      const titleRow = cartSheet.addRow([`Orden: ${block.orderNumber}`]);
      titleRow.font = { bold: true, size: 13 };
      cartStartRows.set(block.cartAnchor, titleRow.number);

      try {
        workbook.definedNames.add(
          block.cartAnchor,
          `'Ordenes_carrito'!$A$${titleRow.number}`,
        );
      } catch {
        // Nombre duplicado o inválido: el hipervínculo usará la fila directa.
      }

      addLabelValueRows(cartSheet, [
        ["Nº orden", block.orderNumber],
        ["Estado", block.status],
        ["Pago", block.paymentStatus],
        ["Cliente", block.customerName],
        ["Total", block.total],
      ]);

      cartSheet.addRow([]);
      addSubsectionTitle(cartSheet, "Carrito");
      const headerRow = cartSheet.addRow([...ORDER_CART_LINE_HEADERS]);
      headerRow.font = { bold: true };

      if (block.lines.length === 0) {
        cartSheet.addRow(["—", "", "—", "Sin líneas", null, null, null, null]);
        return;
      }

      for (const line of block.lines) {
        cartSheet.addRow([
          line.level,
          line.lineType || null,
          line.sku,
          line.name,
          line.quantity,
          line.unitPrice,
          line.lineTotal,
          line.detail,
        ]);
      }
    });
  }

  listSheet.addRow([...ORDER_LIST_HEADERS]);
  listSheet.getRow(1).font = { bold: true };

  if (orders.length === 0) {
    listSheet.addRow(["Sin órdenes"]);
    return;
  }

  for (const order of orders) {
    const row = listSheet.addRow([
      order.orderNumber,
      order.status,
      order.paymentStatus,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.fulfillmentMethod,
      order.subtotal,
      order.discountTotal,
      order.shippingTotal,
      order.total,
      order.lineCount,
      order.currencyCode,
      order.createdAt,
      "Ver productos",
    ]);

    const linkCell = row.getCell(15);
    const startRow = cartStartRows.get(order.cartAnchor);
    linkCell.value = {
      text: "Ver productos",
      hyperlink: startRow
        ? `#'Ordenes_carrito'!A${startRow}`
        : `#${order.cartAnchor}`,
    };
    linkCell.font = { color: { argb: "FF0563C1" }, underline: true };
  }
}

export async function buildCatalogStatusWorkbook(
  data: CatalogStatusReportData,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "De Tin Marín Admin";
  workbook.created = new Date(data.meta.generatedAt);

  const metaSheet = workbook.addWorksheet("Meta");
  metaSheet.addRow(["generatedAt", data.meta.generatedAt]);
  metaSheet.addRow(["timezone", data.meta.timezone]);
  metaSheet.addRow(["sections", data.meta.sections.join(",")]);
  metaSheet.getColumn(1).width = 16;
  metaSheet.getColumn(2).width = 48;

  if (data.meta.sections.includes("products")) {
    addSheet(
      workbook,
      "Productos",
      PRODUCT_HEADERS,
      data.products.map((row) => [
        row.sku,
        row.name,
        row.description,
        row.slug,
        row.brand,
        row.categoryName,
        row.productType,
        row.itemsPerPackage,
        row.packageLabel,
        row.netPrice,
        row.unitNetPrice,
        row.finalPrice,
        row.finalUnitPrice,
        row.campaignName,
        row.campaignPercentage,
        nullableCell(row.costNetPrice),
        nullableCell(row.margin),
        marginPctCell(row.marginPct),
        row.stockSealedPackages,
        row.stockLooseBaseUnits,
        row.stockTotalBaseUnits,
        row.stockDisplay,
        row.stockInPresentations,
        row.purchaseMinQuantity,
        row.purchaseMaxQuantity,
        boolLabel(row.isActive),
        row.imageUrl,
      ]),
    );
  }

  if (data.meta.sections.includes("bundles")) {
    addBundlesSheet(workbook, data.bundles, data.bundleComposition);
  }

  if (data.meta.sections.includes("packs")) {
    addPacksSheet(workbook, data.packs, data.packComposition);
  }

  if (data.meta.sections.includes("containers")) {
    addSheet(
      workbook,
      "Envases",
      CONTAINER_HEADERS,
      data.containers.map((row) => [
        row.sku,
        row.name,
        row.description,
        row.netPrice,
        row.stockQuantity,
        boolLabel(row.isActive),
        row.imageUrl,
      ]),
    );
  }

  if (data.meta.sections.includes("orders")) {
    addOrdersSheets(workbook, data.orders, data.orderCarts);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export function catalogStatusFilename(generatedAt: string): string {
  const day = generatedAt.slice(0, 10).replaceAll("-", "");
  return `catalog-status-${day || "export"}.xlsx`;
}
