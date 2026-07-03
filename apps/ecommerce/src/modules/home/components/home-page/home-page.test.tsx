import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./home-page";

describe("HomePage", () => {
  it("compone las secciones principales de la landing", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /endulza cada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /catálogo completo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /combos cumpleañeros/i }),
    ).toBeInTheDocument();
  });
});
