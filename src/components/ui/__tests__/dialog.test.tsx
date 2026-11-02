import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogActionBar, DialogTitle } from "@/components/ui/dialog";

function renderDialog(open: boolean, onOpenChange = vi.fn()) {
  return render(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle>Confirm save</DialogTitle>
    </Dialog>,
  );
}

function TypeDialog() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
      <DialogTitle>Weight</DialogTitle>
      <input
        id="weight-value"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </Dialog>
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

  it("constrains the panel to the viewport height and lets content scroll", () => {
    renderDialog(true);

    const panel = screen.getByRole("dialog");
    expect(panel.className).toContain("max-h-[calc(100dvh-2rem)]");
    expect(panel.className).toContain("overflow-y-auto");
    expect(panel.className).toContain("overscroll-contain");
  });

  it("pins the action bar to the bottom with a safe-area inset", () => {
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogTitle>Food detail</DialogTitle>
        <DialogActionBar>
          <button type="button">Add to cart</button>
        </DialogActionBar>
      </Dialog>,
    );

    const bar = screen.getByRole("button", { name: "Add to cart" }).parentElement;
    expect(bar?.className).toContain("sticky");
    expect(bar?.className).toContain("bottom-0");
    expect(bar?.className).toContain("env(safe-area-inset-bottom)");
  });

  it("keeps focus inside the input while typing triggers parent rerenders", () => {
    render(<TypeDialog />);

    const input = document.getElementById("weight-value");
    if (!input) {
      throw new Error("Weight input was not rendered.");
    }
    input.focus();

    fireEvent.change(input, { target: { value: "6" } });
    fireEvent.change(input, { target: { value: "68" } });
    fireEvent.change(input, { target: { value: "68.5" } });

    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue("68.5");
  });
});
