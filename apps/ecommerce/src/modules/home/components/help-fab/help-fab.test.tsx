import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ABOUT_WHATSAPP_HREF } from "@/modules/about/data/about.data";
import { HelpFab } from "./help-fab";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      label: "¿Necesitas ayuda?",
      whatsappMessage: "Hola, deseo información sobre las sorpresas y dulces",
    };
    return labels[key] ?? key;
  },
}));

describe("HelpFab", () => {
  it("renderiza un enlace de ayuda a WhatsApp", () => {
    render(<HelpFab />);

    const link = screen.getByRole("link", { name: /necesitas ayuda/i });
    expect(link).toHaveAttribute(
      "href",
      `${ABOUT_WHATSAPP_HREF}?text=${encodeURIComponent("Hola, deseo información sobre las sorpresas y dulces")}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
