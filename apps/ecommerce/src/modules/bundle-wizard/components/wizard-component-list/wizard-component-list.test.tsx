import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WizardComponentList } from "./wizard-component-list";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

describe("WizardComponentList", () => {
  it("muestra imagen y desglose de cantidad por dulce", () => {
    render(
      <WizardComponentList
        components={[{ productId: "p1", quantityPerUnit: 2 }]}
        personCount={10}
        labelsByProductId={{ p1: "Gomitas" }}
        imagesByProductId={{ p1: "https://example.com/gomitas.png" }}
        labels={{
          title: "Tus dulces",
          remove: "Quitar",
          minReached: "Mínimo alcanzado",
          count: "1 de 20 dulces",
          progressLabel: "1 de 20 dulces seleccionados",
          formatQuantityBreakdown: ({ perPerson, surprises, total }) =>
            `${perPerson} × ${surprises} = ${total}`,
        }}
        canRemove
        onRemove={() => undefined}
      />,
    );

    expect(screen.getByText("Gomitas")).toBeInTheDocument();
    expect(screen.getByText("2 × 10 = 20")).toBeInTheDocument();
    expect(
      document.querySelector('img[src="https://example.com/gomitas.png"]'),
    ).toBeTruthy();
    expect(screen.queryByText(/S\//)).not.toBeInTheDocument();
  });
});
