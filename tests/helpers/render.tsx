import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ThemeProvider } from "next-themes";
import { FeedbackProvider } from "@/components/FeedbackProvider";
import { useStore } from "@/lib/store";
import { vi, beforeEach } from "vitest";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ resolvedTheme: "light", theme: "light", setTheme: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const initialStore = useStore.getState();

beforeEach(() => {
  useStore.setState(initialStore, true);
});

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <FeedbackProvider>{children}</FeedbackProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: Providers, ...options });
}
