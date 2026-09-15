import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../helpers/render";
import RecuperarPage from "@/app/recuperar/page";

const mutateAsync = vi.fn<
  (input: { identifier: string }) => Promise<{ message: string }>
>(async () => ({
  message: "Si el teléfono o correo está registrado, te enviamos un código.",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/trpc/react", () => ({
  trpc: {
    passwordReset: {
      request: {
        useMutation: (opts?: { onSuccess?: (data: { message: string }) => void }) => ({
          mutateAsync: async (input: { identifier: string }) => {
            const data = await mutateAsync(input);
            opts?.onSuccess?.(data);
            return data;
          },
          isPending: false,
        }),
      },
      confirm: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

describe("RecuperarPage", () => {
  beforeEach(() => {
    mutateAsync.mockClear();
  });

  it("moves to confirm step and keeps submit disabled when NIPs mismatch", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecuperarPage />);

    const identifier = screen.getByPlaceholderText(/9611234567|correo/i);
    await user.type(identifier, "reset@test.local");
    await user.click(screen.getByRole("button", { name: /Enviar código/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ identifier: "reset@test.local" });
    });

    expect(
      await screen.findByText(/Ingresa el código y tu nuevo NIP/i)
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("000000"), "654321");
    await user.type(screen.getByLabelText(/^Nuevo NIP$/i), "1234");
    await user.type(screen.getByLabelText(/Confirmar Nuevo NIP/i), "9999");

    expect(screen.getByRole("button", { name: /Cambiar NIP/i })).toBeDisabled();
  });
});
