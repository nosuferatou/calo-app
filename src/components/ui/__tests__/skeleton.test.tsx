import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders a placeholder element", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    const element = container.firstChild;

    expect(element).toHaveClass("h-4", "w-24");
    expect(element).toHaveAttribute("aria-hidden", "true");
  });

  it("renders without a custom class using default sizing", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild).toHaveClass("rounded-md");
  });
});
