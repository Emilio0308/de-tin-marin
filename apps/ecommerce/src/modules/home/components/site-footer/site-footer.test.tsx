import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("renderiza secciones de enlaces y el formulario de suscripción", () => {
    render(<SiteFooter />);

    expect(screen.getByText("Explora")).toBeInTheDocument();
    expect(screen.getByText("Ayuda")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /suscribirse/i }),
    ).toBeInTheDocument();
  });
});
