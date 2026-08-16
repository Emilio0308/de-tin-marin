import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    const whatsappHref = "https://wa.me/51980966238";
    render(<HelpFab whatsappHref={whatsappHref} />);

    const link = screen.getByRole("link", { name: /necesitas ayuda/i });
    expect(link).toHaveAttribute(
      "href",
      `${whatsappHref}?text=${encodeURIComponent("Hola, deseo información sobre las sorpresas y dulces")}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
