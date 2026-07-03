import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("renderiza el título principal y la llamada a la acción", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", { name: /endulza cada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver regalos/i }),
    ).toBeInTheDocument();
  });
});
