import { describe, expect, it } from "vitest";
import { PRIVACY_SECTIONS } from "@/modules/privacy/data/privacy.data";
import { getPrivacyTocItems, privacySectionHref } from "./privacy-page.helpers";

describe("privacy-page.helpers", () => {
  it("arma el TOC con anclas por sección", () => {
    const toc = getPrivacyTocItems(PRIVACY_SECTIONS);

    expect(toc).toHaveLength(PRIVACY_SECTIONS.length);
    expect(toc[0]).toEqual({
      id: "collect",
      title: "1. ¿Qué información recopilamos?",
      href: "#collect",
    });
    expect(privacySectionHref("contact")).toBe("#contact");
  });
});
