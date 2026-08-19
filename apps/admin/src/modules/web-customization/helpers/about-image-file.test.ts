import { describe, expect, it, vi } from "vitest";
import {
  isAllowedAboutImageFile,
  validateAboutImageFile,
} from "./about-image-file";
import {
  isAboutLandscapeAspect,
  meetsAboutImageMinWidth,
} from "@de-tin-marin/validations/about-page";

function makeFile(type: string, size: number, name = "about.png"): File {
  const buffer = new ArrayBuffer(Math.min(size, 8));
  return new File([buffer], name, { type });
}

describe("isAboutLandscapeAspect", () => {
  it("acepta ~16:9", () => {
    expect(isAboutLandscapeAspect(1600, 900)).toBe(true);
    expect(isAboutLandscapeAspect(1280, 720)).toBe(true);
  });

  it("rechaza cuadrado o retrato", () => {
    expect(isAboutLandscapeAspect(900, 900)).toBe(false);
    expect(isAboutLandscapeAspect(900, 1600)).toBe(false);
  });
});

describe("meetsAboutImageMinWidth", () => {
  it("exige ancho mínimo 800", () => {
    expect(meetsAboutImageMinWidth(800)).toBe(true);
    expect(meetsAboutImageMinWidth(799)).toBe(false);
  });
});

describe("isAllowedAboutImageFile", () => {
  it("acepta jpeg/png/webp", () => {
    expect(isAllowedAboutImageFile(makeFile("image/png", 1024))).toBe(true);
  });

  it("rechaza mime o tamaño inválido", () => {
    expect(isAllowedAboutImageFile(makeFile("image/gif", 1024))).toBe(false);
    expect(isAllowedAboutImageFile(makeFile("image/png", 0))).toBe(false);
  });
});

describe("validateAboutImageFile", () => {
  it("rechaza tipo inválido", async () => {
    const result = await validateAboutImageFile(makeFile("image/gif", 100));
    expect(result).toEqual({ ok: false, error: "INVALID_TYPE" });
  });

  it("acepta landscape 16:9 suficientemente ancha", async () => {
    const close = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => Promise.resolve({ width: 1600, height: 900, close })),
    );

    const result = await validateAboutImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: true });
    expect(close).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("rechaza aspecto no landscape", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() =>
        Promise.resolve({
          width: 900,
          height: 900,
          close: vi.fn(),
        }),
      ),
    );

    const result = await validateAboutImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: false, error: "INVALID_DIMENSIONS" });

    vi.unstubAllGlobals();
  });

  it("rechaza imágenes demasiado estrechas", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() =>
        Promise.resolve({
          width: 700,
          height: 394,
          close: vi.fn(),
        }),
      ),
    );

    const result = await validateAboutImageFile(makeFile("image/png", 100));
    expect(result).toEqual({ ok: false, error: "TOO_SMALL" });

    vi.unstubAllGlobals();
  });
});
