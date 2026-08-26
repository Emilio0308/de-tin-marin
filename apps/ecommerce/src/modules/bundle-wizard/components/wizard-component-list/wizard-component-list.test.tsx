import { fireEvent, render, screen } from "@testing-library/react";
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
        decreaseUnits: "Disminuir unidades de {name} por sorpresa",
        increaseUnits: "Aumentar unidades de {name} por sorpresa",
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
        minProducts={1}
        maxProducts={20}
        labelsByProductId={{ p1: "Gomitas" }}
        imagesByProductId={{ p1: "https://example.com/gomitas.png" }}
        unitPricesByProductId={{ p1: 1.5 }}
        canRemove
        enableUnitsPerPerson={false}
        onRemove={() => undefined}
        onQuantityPerUnitChange={() => undefined}
      />,
    );

    expect(screen.getByText("Gomitas")).toBeInTheDocument();
    expect(
      screen.getByText("1 × 30 = 30 unidades - S/ 45.00"),
    ).toBeInTheDocument();
    expect(
      document.querySelector('img[src="https://example.com/gomitas.png"]'),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: /aumentar unidades de gomitas por sorpresa/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("permite editar unidades por sorpresa cuando el flag está activo", () => {
    const onQuantityPerUnitChange = vi.fn();

    render(
      <WizardComponentList
        components={[{ productId: "p1", quantityPerUnit: 2 }]}
        personCount={15}
        minProducts={1}
        maxProducts={20}
        labelsByProductId={{ p1: "Galletas" }}
        imagesByProductId={{ p1: "https://example.com/galletas.png" }}
        unitPricesByProductId={{ p1: 1 }}
        canRemove
        enableUnitsPerPerson
        onRemove={() => undefined}
        onQuantityPerUnitChange={onQuantityPerUnitChange}
      />,
    );

    expect(
      screen.getByText("2 × 15 = 30 unidades - S/ 30.00"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /aumentar unidades de galletas por sorpresa/i,
      }),
    );
    expect(onQuantityPerUnitChange).toHaveBeenCalledWith("p1", 3);

    fireEvent.click(
      screen.getByRole("button", {
        name: /disminuir unidades de galletas por sorpresa/i,
      }),
    );
    expect(onQuantityPerUnitChange).toHaveBeenCalledWith("p1", 1);
  });

  it("deshabilita disminuir unidades en el mínimo (1)", () => {
    render(
      <WizardComponentList
        components={[{ productId: "p1", quantityPerUnit: 1 }]}
        personCount={15}
        minProducts={1}
        maxProducts={20}
        labelsByProductId={{ p1: "Galletas" }}
        imagesByProductId={{}}
        unitPricesByProductId={{ p1: 1 }}
        canRemove
        enableUnitsPerPerson
        onRemove={() => undefined}
        onQuantityPerUnitChange={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: /disminuir unidades de galletas por sorpresa/i,
      }),
    ).toBeDisabled();
  });
});
