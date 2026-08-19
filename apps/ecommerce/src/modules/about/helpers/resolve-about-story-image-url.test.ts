import { describe, expect, it } from "vitest";
import { ABOUT_STORY_IMAGE_URL } from "@/modules/about/data/about.data";
import { resolveAboutStoryImageUrl } from "./resolve-about-story-image-url";

describe("resolveAboutStoryImageUrl", () => {
  it("usa la URL custom cuando es http(s) válida", () => {
    expect(resolveAboutStoryImageUrl("https://cdn.example.com/about.jpg")).toBe(
      "https://cdn.example.com/about.jpg",
    );
  });

  it("cae al placeholder si es null, vacío o inválida", () => {
    expect(resolveAboutStoryImageUrl(null)).toBe(ABOUT_STORY_IMAGE_URL);
    expect(resolveAboutStoryImageUrl(undefined)).toBe(ABOUT_STORY_IMAGE_URL);
    expect(resolveAboutStoryImageUrl("")).toBe(ABOUT_STORY_IMAGE_URL);
    expect(resolveAboutStoryImageUrl("   ")).toBe(ABOUT_STORY_IMAGE_URL);
    expect(resolveAboutStoryImageUrl("not-a-url")).toBe(ABOUT_STORY_IMAGE_URL);
    expect(resolveAboutStoryImageUrl("javascript:alert(1)")).toBe(
      ABOUT_STORY_IMAGE_URL,
    );
  });
});
