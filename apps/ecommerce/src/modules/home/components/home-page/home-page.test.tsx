import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../../messages/es.json";
import { HomePage } from "./home-page";

function renderHomePage() {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      <HomePage />
    </NextIntlClientProvider>,
  );
}

describe("HomePage", () => {
  it("muestra el hero de marketing sin catálogo mock", () => {
    renderHomePage();

    expect(
      screen.getByRole("heading", { name: /endulza cada/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver sorpresas/i }),
    ).toHaveAttribute("href", "/sorpresas");
    expect(screen.getByRole("link", { name: /ver dulces/i })).toHaveAttribute(
      "href",
      "/productos",
    );
    expect(
      screen.queryByRole("heading", { name: /catálogo completo/i }),
    ).not.toBeInTheDocument();
  });
});
