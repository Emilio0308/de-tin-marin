import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelpFab } from "./help-fab";

describe("HelpFab", () => {
  it("renderiza un botón accesible de ayuda", () => {
    render(<HelpFab />);

    expect(
      screen.getByRole("button", { name: /necesitas ayuda/i }),
    ).toBeInTheDocument();
  });
});
