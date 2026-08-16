import { describe, expect, it } from "vitest";
import { TERMS_SECTIONS } from "@/modules/terms/data/terms.data";
import { getTermsTocItems } from "./terms-page.helpers";

describe("getTermsTocItems", () => {
  it("arma el índice con un item por sección", () => {
    const toc = getTermsTocItems(TERMS_SECTIONS);

    expect(toc).toHaveLength(TERMS_SECTIONS.length);
    expect(toc[0]).toEqual({
      id: TERMS_SECTIONS[0]?.id,
      title: TERMS_SECTIONS[0]?.title,
      href: `#${TERMS_SECTIONS[0]?.id}`,
    });
  });
});
