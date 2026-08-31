import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderBundlePriceDisplay } from "./order-bundle-price-display";

const labels = {
  formatTheoreticalTotal: (price: string) =>
    `Costo teórico (sin redondeo): ${price}`,
  formatPerSurprisePrice: (chargeable: string, theoretical: string) =>
    `Por sorpresa: ${chargeable} · teórico ${theoretical}`,
};

describe("OrderBundlePriceDisplay", () => {
  it("muestra solo el precio cobrable cuando no hay redondeo", () => {
    render(
      <OrderBundlePriceDisplay
        chargeableTotal={90}
        rawTotal={90}
        quantity={20}
        labels={labels}
      />,
    );

    expect(screen.getByText("S/ 90.00")).toBeInTheDocument();
    expect(
      screen.queryByText(/Costo teórico \(sin redondeo\)/),
    ).not.toBeInTheDocument();
  });

  it("muestra desglose teórico y por sorpresa cuando difieren", () => {
    render(
      <OrderBundlePriceDisplay
        chargeableTotal={105}
        rawTotal={101.5}
        quantity={10}
        labels={labels}
      />,
    );

    expect(screen.getByText("S/ 105.00")).toBeInTheDocument();
    expect(
      screen.getByText("Costo teórico (sin redondeo): S/ 101.50"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Por sorpresa: S/ 10.50 · teórico S/ 10.15"),
    ).toBeInTheDocument();
  });
});
