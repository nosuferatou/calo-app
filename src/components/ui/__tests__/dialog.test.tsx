import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogTitle } from "@/components/ui/dialog";

function renderDialog(open: boolean, onOpenChange = vi.fn()) {
  return render(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Confirm save</DialogTitle>
    </Dialog>,
  );
}

describe("Dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the panel when open", () => {
    renderDialog(true);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm save")).toBeInTheDocument();
  });

  it("does not render the panel when closed", () => {
    renderDialog(false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
