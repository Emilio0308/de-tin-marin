import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BundleForm } from "./bundle-form";

const products = [
  { id: "p1", name: "Galleta", netPrice: 1 },
  { id: "p2", name: "Chocolate", netPrice: 2 },
];

describe("BundleForm", () => {
  it("actualiza el total al agregar y quitar productos", () => {
    render(
      <BundleForm
        products={products}
        onSubmit={vi.fn()}
        submitting={false}
        error={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fee de servicio (S/)"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Cantidad de personas"), {
      target: { value: "20" },
    });

    const productSelect = screen.getByRole("combobox");
    fireEvent.change(productSelect, { target: { value: "p1" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    fireEvent.change(productSelect, { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));

    expect(
      screen.getByText(/Total del paquete: S\/ 90\.00/),
    ).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: "Quitar" });
    fireEvent.click(removeButtons[0]!);

    expect(
      screen.getByText(/Total del paquete: S\/ 70\.00/),
    ).toBeInTheDocument();
  });
});
