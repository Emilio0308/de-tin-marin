import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { YAPE_QR_SRC, YapeQrImage } from "./yape-qr-image";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      yapeQrAlt: "Código QR de Yape para escanear y pagar",
      yapeQrHint: "Toca para ampliar y escanear",
      yapeQrEnlarge: "Ampliar código QR de Yape",
      yapeQrDialogTitle: "Código QR de Yape",
      yapeQrClose: "Cerrar",
    };
    return labels[key] ?? key;
  },
}));

function loadQrImage() {
  const image = document.querySelector("img");
  expect(image).not.toBeNull();
  Object.defineProperty(image, "naturalWidth", { value: 400 });
  Object.defineProperty(image, "naturalHeight", { value: 400 });
  fireEvent.load(image as HTMLImageElement);
  return image as HTMLImageElement;
}

describe("YapeQrImage", () => {
  it("muestra el QR y la pista cuando la imagen carga", () => {
    render(<YapeQrImage />);
    loadQrImage();

    expect(
      screen.getByRole("button", { name: "Ampliar código QR de Yape" }),
    ).toBeVisible();
    expect(
      screen.getByText("Toca para ampliar y escanear"),
    ).toBeInTheDocument();
  });

  it("abre un modal grande al pulsar el QR y lo cierra con Escape", () => {
    render(<YapeQrImage />);
    loadQrImage();

    fireEvent.click(
      screen.getByRole("button", { name: "Ampliar código QR de Yape" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Código QR de Yape" }),
    ).toBeVisible();
    expect(document.querySelectorAll(`img[src="${YAPE_QR_SRC}"]`).length).toBe(
      2,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.queryByRole("dialog", { name: "Código QR de Yape" }),
    ).not.toBeInTheDocument();
  });

  it("no muestra nada si la imagen falla al cargar", () => {
    const { container } = render(<YapeQrImage />);
    const image = container.querySelector("img");
    expect(image).not.toBeNull();

    fireEvent.error(image as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.queryByText("Toca para ampliar y escanear"),
    ).not.toBeInTheDocument();
  });

  it("no muestra nada si el archivo no es una imagen válida", () => {
    const { container } = render(<YapeQrImage />);
    const image = container.querySelector("img");
    expect(image).not.toBeNull();

    Object.defineProperty(image, "naturalWidth", { value: 0 });
    Object.defineProperty(image, "naturalHeight", { value: 0 });
    fireEvent.load(image as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Ampliar código QR de Yape" }),
    ).not.toBeInTheDocument();
  });
});
