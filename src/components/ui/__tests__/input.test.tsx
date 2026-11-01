import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders an input with an accessible label", () => {
    render(<Input aria-label="Food name" placeholder="Chicken breast" />);

    expect(screen.getByLabelText("Food name")).toBeInTheDocument();
  });
});
