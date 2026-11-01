import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/common/ToastProvider";
import { useToast, type ToastInput } from "@/hooks/use-toast";

function Trigger({ input }: { input: ToastInput }) {
  const { toast } = useToast();

  return (
    <button type="button" onClick={() => toast(input)}>
      Show toast
    </button>
  );
}

function renderToast(input: ToastInput) {
  return render(
    <ToastProvider>
      <Trigger input={input} />
    </ToastProvider>,
  );
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("toast viewport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dismisses informational toasts after the default duration", () => {
    renderToast({ title: "Saved", variant: "info" });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Saved");

    advance(4999);
    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Saved");

    advance(1);
    expect(
      screen.queryByRole("group", { name: "Notification" }),
    ).not.toBeInTheDocument();
  });

  it("keeps error toasts until they are dismissed", () => {
    renderToast({ title: "Something failed", variant: "error" });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    advance(60_000);

    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Something failed");

    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(
      screen.queryByRole("group", { name: "Notification" }),
    ).not.toBeInTheDocument();
  });

  it("pauses the timer while hovered and resumes with the remaining time", () => {
    renderToast({ title: "Saved", variant: "success" });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    advance(3000);

    fireEvent.mouseEnter(screen.getByRole("group", { name: "Notification" }));
    advance(60_000);
    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Saved");

    fireEvent.mouseLeave(screen.getByRole("group", { name: "Notification" }));
    advance(1999);
    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Saved");

    advance(1);
    expect(
      screen.queryByRole("group", { name: "Notification" }),
    ).not.toBeInTheDocument();
  });

  it("pauses the timer while focus is inside the toast", () => {
    renderToast({ title: "Saved", variant: "success" });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    advance(3000);

    const dismiss = screen.getByRole("button", {
      name: "Dismiss notification",
    });
    act(() => dismiss.focus());
    advance(60_000);

    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Saved");
  });

  it("announces errors assertively and other toasts politely", () => {
    const { container } = renderToast({
      title: "Could not save",
      description: "Try again.",
      variant: "error",
    });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));

    expect(
      container.querySelector('[aria-live="assertive"]'),
    ).toHaveTextContent("Could not save. Try again.");
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      "",
    );
  });

  it("supports toasts that never dismiss on their own", () => {
    renderToast({ title: "Sticky", variant: "info", durationMs: 0 });

    fireEvent.click(screen.getByRole("button", { name: "Show toast" }));
    advance(60_000);

    expect(
      screen.getByRole("group", { name: "Notification" }),
    ).toHaveTextContent("Sticky");
  });
});
