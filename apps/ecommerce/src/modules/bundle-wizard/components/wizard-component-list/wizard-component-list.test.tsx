import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WizardComponentList } from "./wizard-component-list";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) => {
      const templates: Record<string, string> = {
        title: "Tus dulces",
        remove: "Quitar",
        minReached: "Necesitas al menos {min} dulces en tu sorpresa.",
        count: "{current} de {max} dulces",
        progressLabel: "{current} de {max} dulces seleccionados",
        quantityBreakdown:
          "{perPerson} × {surprises} = {total} unidades - S/ {price}",
      };
      let result = templates[key] ?? key;
      if (values) {
        for (const [name, value] of Object.entries(values)) {
          result = result.replace(`{${name}}`, String(value));
        }
      }
      return result;
    },
}));

describe("WizardComponentList", () => {
  it("muestra imagen y desglose de cantidad con precio de línea", () => {
    render(
      <WizardComponentList
        components={[{ productId: "p1", quantityPerUnit: 1 }]}
        personCount={30}
        labelsByProductId={{ p1: "Gomitas" }}
        imagesByProductId={{ p1: "https://example.com/gomitas.png" }}
        unitPricesByProductId={{ p1: 1.5 }}
        canRemove
        onRemove={() => undefined}
      />,
    );

    expect(screen.getByText("Gomitas")).toBeInTheDocument();
    expect(
      screen.getByText("1 × 30 = 30 unidades - S/ 45.00"),
    ).toBeInTheDocument();
    expect(
      document.querySelector('img[src="https://example.com/gomitas.png"]'),
    ).toBeTruthy();
  });
});
