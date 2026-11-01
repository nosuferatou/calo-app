import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Save meal</Button>);

    expect(
      screen.getByRole("button", { name: "Save meal" }),
    ).toBeInTheDocument();
  });

  it("applies the default variant styles", () => {
    render(<Button>Save meal</Button>);

    expect(screen.getByRole("button", { name: "Save meal" })).toHaveClass(
      "bg-brand-600",
    );
  });

  it("applies an outline variant when requested", () => {
    render(<Button variant="outline">Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass(
      "border-slate-300",
    );
  });
});
