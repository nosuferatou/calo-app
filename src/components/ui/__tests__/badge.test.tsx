import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Under target</Badge>);

    expect(screen.getByText("Under target")).toBeInTheDocument();
  });

  it("defaults to the neutral variant", () => {
    render(<Badge>Neutral</Badge>);

    expect(screen.getByText("Neutral")).toHaveClass("bg-slate-100");
  });

  it("applies the success variant", () => {
    render(<Badge variant="success">On target</Badge>);

    expect(screen.getByText("On target")).toHaveClass("bg-emerald-50");
  });

  it("applies the warning variant", () => {
    render(<Badge variant="warning">Watch intake</Badge>);

    expect(screen.getByText("Watch intake")).toHaveClass("bg-amber-50");
  });

  it("applies the error variant", () => {
    render(<Badge variant="error">Over target</Badge>);

    expect(screen.getByText("Over target")).toHaveClass("bg-red-50");
  });

  it("applies the info variant", () => {
    render(<Badge variant="info">New food</Badge>);

    expect(screen.getByText("New food")).toHaveClass("bg-sky-50");
  });
});
