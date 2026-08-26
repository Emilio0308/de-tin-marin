import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminTablePagination } from "./admin-table-pagination";

describe("AdminTablePagination", () => {
  it("renders summary and disables previous on first page", () => {
    render(
      <AdminTablePagination
        page={1}
        pageSize={20}
        total={45}
        previousLabel="Anterior"
        nextLabel="Siguiente"
        pageLabel="Página 1 de 3"
        summaryLabel="Mostrando 1–20 de 45"
        onPageChange={() => undefined}
      />,
    );

    expect(screen.getByText("Mostrando 1–20 de 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });

  it("returns null when total is 0", () => {
    const { container } = render(
      <AdminTablePagination
        page={1}
        pageSize={20}
        total={0}
        previousLabel="Anterior"
        nextLabel="Siguiente"
        pageLabel="Página 1"
        summaryLabel=""
        onPageChange={() => undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
