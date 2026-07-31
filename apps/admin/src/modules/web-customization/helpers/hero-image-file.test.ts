import { describe, expect, it, vi } from "vitest";
import {
  isAllowedHeroImageFile,
  validateHeroImageFile,
} from "./hero-image-file";
import {
  isSquareHeroAspect,
  meetsHeroImageMinSide,
} from "@de-tin-marin/validations/hero";

function makeFile(type: string, size: number, name = "hero.png"): File {
  const buffer = new ArrayBuffer(Math.min(size, 8));
  return new File([buffer], name, { type });
}

describe("isSquareHeroAspect", () => {
  it("acepta cuadrados exactos y casi cuadrados", () => {
    expect(isSquareHeroAspect(800, 800)).toBe(true);
    expect(isSquareHeroAspect(1200, 1200)).toBe(true);
    expect(isSquareHeroAspect(1000, 1010)).toBe(true);
  });

  it("rechaza panorámicas o retrato claro", () => {
    expect(isSquareHeroAspect(1600, 900)).toBe(false);
    expect(isSquareHeroAspect(900, 1600)).toBe(false);
  });
});

describe("meetsHeroImageMinSide", () => {
  it("exige lado mínimo", () => {
    expect(meetsHeroImageMinSide(600, 600)).toBe(true);
    expect(meetsHeroImageMinSide(599, 599)).toBe(false);
  });
});

describe("isAllowedHeroImageFile", () => {
  it("acepta jpeg/png/webp dentro del límite", () => {
    expect(isAllowedHeroImageFile(makeFile("image/png", 1024))).toBe(true);
    expect(isAllowedHeroImageFile(makeFile("image/jpeg", 1024))).toBe(true);
    expect(isAllowedHeroImageFile(makeFile("image/webp", 1024))).toBe(true);
  });

  it("rechaza mime o tamaño inválido", () => {
    expect(isAllowedHeroImageFile(makeFile("image/gif", 1024))).toBe(false);
    expect(isAllowedHeroImageFile(makeFile("image/png", 0))).toBe(false);
  });
});

describe("validateHeroImageFile", () => {
  it("rechaza tipo inválido sin cargar bitmap", async () => {
    const result = await validateHeroImageFile(makeFile("image/gif", 100));
    expect(result).toEqual({ ok: false, error: "INVALID_TYPE" });
  });

  it("acepta imagen cuadrada de cualquier tamaño suficiente", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.resolve({ width: 900, height: 900, close })),
    );

    const result = await validateHeroImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: true });
    expect(close).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("rechaza aspecto no cuadrado", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() =>
        Promise.resolve({
          width: 1600,
          height: 900,
          close: vi.fn(),
        }),
      ),
    );

    const result = await validateHeroImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: false, error: "INVALID_DIMENSIONS" });

    vi.unstubAllGlobals();
  });

  it("rechaza imágenes demasiado pequeñas aunque sean cuadradas", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() =>
        Promise.resolve({
          width: 400,
          height: 400,
          close: vi.fn(),
        }),
      ),
    );

    const result = await validateHeroImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: false, error: "TOO_SMALL" });

    vi.unstubAllGlobals();
  });
});
