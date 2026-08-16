import { describe, expect, it } from "vitest";
import { TERMS_CONTENT } from "@/modules/terms/data/terms.data";
import { getTermsTocItems, termsSectionHref } from "./terms-page.helpers";

describe("terms-page.helpers", () => {
  it("arma el TOC con anclas por sección", () => {
    const toc = getTermsTocItems(TERMS_CONTENT.sections);

    expect(toc).toHaveLength(TERMS_CONTENT.sections.length);
    expect(toc[0]).toEqual({
      id: "about",
      title: "1. Sobre De Tin Marín",
      href: "#about",
    });
    expect(termsSectionHref("contact")).toBe("#contact");
  });
});
