import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DiaryView } from "@/components/diary/DiaryView";
import { formatLongDate } from "@/lib/dates";

const mocks = vi.hoisted(() => ({
  setCartDate: vi.fn(),
  entries: [] as unknown[],
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    children,
    ...rest
  }: {
    href: string;
    onClick?: () => void;
    children: ReactNode;
  }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-i18n", () => ({
  useI18n: () => ({ locale: "en", t: (key: string) => key }),
}));

vi.mock("@/components/providers/DemoDataProvider", () => ({
  useDemoData: () => ({
    copyPreviousDay: vi.fn(),
    dataMode: "demo",
    deleteEntry: vi.fn(),
    deleteSession: vi.fn(),
    duplicateEntry: vi.fn(),
    duplicateSession: vi.fn(),
    entries: mocks.entries,
    setCartDate: mocks.setCartDate,
    updateEntry: vi.fn(),
  }),
}));

function calendarCells() {
  return screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-pressed"));
}

describe("DiaryView cart date carry-through", () => {
  beforeEach(() => {
    mocks.setCartDate.mockClear();
    mocks.entries = [];
  });

  it("carries the selected non-today diary date into the meal cart", () => {
    render(<DiaryView />);

    const target = calendarCells().find(
      (cell) => cell.getAttribute("aria-pressed") === "false",
    );
    expect(target).toBeDefined();
    const targetLabel = target!.getAttribute("aria-label")!;

    fireEvent.click(target!);

    const addFoodLinks = screen.getAllByRole("link", { name: "diary.addFood" });
    fireEvent.click(addFoodLinks[0]);

    expect(mocks.setCartDate).toHaveBeenCalledTimes(1);
    const carriedDate = mocks.setCartDate.mock.calls[0][0] as string;
    expect(formatLongDate(carriedDate, "en")).toBe(targetLabel);
  });
});
