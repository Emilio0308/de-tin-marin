import { describe, expect, it } from "vitest";
import {
  draftHasPersistableImage,
  fromDatetimeLocalValue,
  moveImageOrder,
  toDatetimeLocalValue,
} from "./web-customization-page.helpers";
import type { HeroImageDraft } from "./web-customization-page.types";

describe("datetime helpers", () => {
  it("round-trips ISO ↔ datetime-local", () => {
    const iso = "2026-07-31T15:30:00.000Z";
    const local = toDatetimeLocalValue(iso);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const back = fromDatetimeLocalValue(local);
    expect(new Date(back).getTime()).toBe(new Date(local).getTime());
  });
});

describe("draftHasPersistableImage", () => {
  const base: HeroImageDraft = {
    id: null,
    imageUrl: "",
    altText: "",
    sortOrder: 0,
    startsAtLocal: "2026-01-01T00:00",
    endsAtLocal: "2027-01-01T00:00",
    pendingFile: null,
    previewUrl: null,
  };

  it("es true con archivo pendiente o URL CDN", () => {
    expect(
      draftHasPersistableImage({
        ...base,
        pendingFile: new File([""], "a.png", { type: "image/png" }),
      }),
    ).toBe(true);
    expect(
      draftHasPersistableImage({
        ...base,
        imageUrl: "https://cdn.example.com/hero/a.png",
      }),
    ).toBe(true);
  });

  it("es false sin archivo ni URL válida", () => {
    expect(draftHasPersistableImage(base)).toBe(false);
    expect(
      draftHasPersistableImage({
        ...base,
        imageUrl: "blob:http://localhost/1",
        previewUrl: "blob:http://localhost/1",
      }),
    ).toBe(false);
  });
});

describe("moveImageOrder", () => {
  const images = [
    {
      id: "a",
      imageUrl: "https://cdn.example.com/a.png",
      altText: null,
      sortOrder: 0,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
    },
    {
      id: "b",
      imageUrl: "https://cdn.example.com/b.png",
      altText: null,
      sortOrder: 1,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-01-01T00:00:00.000Z",
    },
  ];

  it("mueve hacia abajo", () => {
    expect(moveImageOrder(images, "a", "down")).toEqual(["b", "a"]);
  });

  it("no mueve fuera de rango", () => {
    expect(moveImageOrder(images, "a", "up")).toBeNull();
    expect(moveImageOrder(images, "b", "down")).toBeNull();
  });
});
