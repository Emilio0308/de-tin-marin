import { describe, expect, it } from "vitest";
import { exportCatalogStatusInputSchema } from "./export-catalog-status.schema";

describe("exportCatalogStatusInputSchema", () => {
  it("acepta al menos una sección", () => {
    const parsed = exportCatalogStatusInputSchema.safeParse({
      sections: ["products"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza sections vacío", () => {
    const parsed = exportCatalogStatusInputSchema.safeParse({
      sections: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rechaza sección desconocida", () => {
    const parsed = exportCatalogStatusInputSchema.safeParse({
      sections: ["sales"],
    });
    expect(parsed.success).toBe(false);
  });

  it("acepta sección orders", () => {
    const parsed = exportCatalogStatusInputSchema.safeParse({
      sections: ["orders"],
    });
    expect(parsed.success).toBe(true);
  });
});
