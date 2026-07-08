import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrderLocationMap } from "./order-location-map";

vi.mock("react-leaflet", () => ({
  MapContainer: ({
    children,
    center,
  }: {
    children: React.ReactNode;
    center: [number, number];
  }) => (
    <div data-testid="map-container" data-lat={center[0]} data-lng={center[1]}>
      {children}
    </div>
  ),
  TileLayer: () => null,
  Marker: ({ position }: { position: [number, number] }) => (
    <div
      data-testid="map-marker"
      data-lat={position[0]}
      data-lng={position[1]}
    />
  ),
}));

const labels = {
  title: "Ubicación de entrega",
  hint: "Ubicación seleccionada por el cliente",
  unavailable: "No hay ubicación registrada para esta orden.",
};

describe("OrderLocationMap", () => {
  it("renders marker at coordinates for delivery orders", () => {
    render(
      <OrderLocationMap
        mapPin={{ lat: -5.2, lng: -80.6 }}
        fulfillmentMethod="delivery"
        labels={labels}
      />,
    );

    expect(screen.getByTestId("map-container")).toHaveAttribute(
      "data-lat",
      "-5.2",
    );
    expect(screen.getByTestId("map-marker")).toHaveAttribute(
      "data-lng",
      "-80.6",
    );
    expect(screen.getByText(labels.hint)).toBeInTheDocument();
  });

  it("does not render map for pickup", () => {
    render(
      <OrderLocationMap
        mapPin={{ lat: -5.2, lng: -80.6 }}
        fulfillmentMethod="pickup"
        labels={labels}
      />,
    );

    expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
    expect(screen.getByText(labels.unavailable)).toBeInTheDocument();
  });

  it("shows unavailable message when map pin is missing", () => {
    render(
      <OrderLocationMap
        mapPin={null}
        fulfillmentMethod="delivery"
        labels={labels}
      />,
    );

    expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
    expect(screen.getByText(labels.unavailable)).toBeInTheDocument();
  });
});
