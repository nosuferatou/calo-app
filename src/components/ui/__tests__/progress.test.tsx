import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "@/components/ui/progress";

describe("Progress", () => {
  it("exposes the current value through the progressbar role", () => {
    render(<Progress value={50} />);

    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("clamps values above the maximum", () => {
    render(<Progress value={150} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders the fill at the correct percentage", () => {
    render(<Progress value={25} />);

    const fill = screen.getByTestId("progress-fill");

    expect(fill).toHaveStyle({ width: "25%" });
  });

  it("uses the neutral tone by default", () => {
    render(<Progress value={10} />);

    expect(screen.getByTestId("progress-fill")).toHaveClass("bg-brand-600");
  });

  it("uses the success tone when requested", () => {
    render(<Progress value={10} tone="success" />);

    expect(screen.getByTestId("progress-fill")).toHaveClass("bg-emerald-500");
  });
});
