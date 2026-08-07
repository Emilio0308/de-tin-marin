import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GranularNumberInput } from "./granular-number-input";

describe("GranularNumberInput", () => {
  it("allows clearing zero and typing a new integer", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <GranularNumberInput
        aria-label="stock"
        mode="integer"
        value={0}
        min={0}
        emptyFallback={0}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByLabelText("stock");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "4" } });
    expect(input).toHaveValue("4");

    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith(4);

    rerender(
      <GranularNumberInput
        aria-label="stock"
        mode="integer"
        value={4}
        min={0}
        emptyFallback={0}
        onValueChange={onValueChange}
      />,
    );
    expect(input).toHaveValue("4");
  });

  it("propagates null when allowEmpty and cleared", () => {
    const onValueChange = vi.fn();
    render(
      <GranularNumberInput
        aria-label="cost"
        mode="decimal"
        value={1.5}
        allowEmpty
        min={0}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByLabelText("cost");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    expect(onValueChange).toHaveBeenCalledWith(null);
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("clamps to min on blur", () => {
    const onValueChange = vi.fn();
    render(
      <GranularNumberInput
        aria-label="items"
        mode="integer"
        value={10}
        min={2}
        emptyFallback={2}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByLabelText("items");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith(2);
  });
});
