import { describe, expect, it } from "vitest";
import { PRIVACY_CONTENT } from "@/modules/privacy/data/privacy.data";
import { getPrivacyTocItems, privacySectionHref } from "./privacy-page.helpers";

describe("privacy-page.helpers", () => {
  it("arma el TOC con anclas por sección", () => {
    const toc = getPrivacyTocItems(PRIVACY_CONTENT.sections);

    expect(toc).toHaveLength(PRIVACY_CONTENT.sections.length);
    expect(toc[0]).toEqual({
      id: "collect",
      title: "1. ¿Qué información recopilamos?",
      href: "#collect",
    });
    expect(privacySectionHref("contact")).toBe("#contact");
  });
});
