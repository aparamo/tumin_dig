import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {
  vi.stubGlobal("crypto", {
    ...crypto,
    randomUUID: () =>
      "00000000-0000-4000-8000-000000000000",
  });
}

vi.mock("motion/react", () => {
  const React = require("react") as typeof import("react");
  const passthrough = ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", props, children);
  return {
    motion: {
      div: passthrough,
      span: passthrough,
      section: passthrough,
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});
