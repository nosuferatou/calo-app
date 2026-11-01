import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";

function renderMenu(open: boolean, onOpenChange = vi.fn()) {
  return render(
    <DropdownMenu
      open={open}
      onOpenChange={onOpenChange}
      trigger={<button type="button">Open menu</button>}
    >
      <DropdownMenuItem onClick={() => undefined}>Delete</DropdownMenuItem>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger and content when open", () => {
    renderMenu(true);

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("does not render the menu content when closed", () => {
    renderMenu(false);

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const onOpenChange = vi.fn();
    renderMenu(true, onOpenChange);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when clicking outside", () => {
    const onOpenChange = vi.fn();
    renderMenu(true, onOpenChange);

    fireEvent.mouseDown(document.body);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
