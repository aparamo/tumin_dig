import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers/render";
import { TransactionDetailDialog } from "@/components/wallet/TransactionDetailDialog";
import type { HistoryTransaction } from "@/lib/transaction-presentation";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const baseTx = {
  id: "tx-1",
  amount: 42,
  concept: "Pago café",
  createdAt: new Date("2026-03-15T18:30:00.000Z"),
  isIngreso: false,
  type: "TRANSFERENCIA" as const,
  from: { id: "u1", displayName: "Ana Remitente", publicProfile: false },
  to: { id: "u2", displayName: "Luis Receptor", publicProfile: true },
  product: null,
};

describe("TransactionDetailDialog", () => {
  it("shows parties, amount and envío label", () => {
    const tx: HistoryTransaction = { ...baseTx, kind: "envio", product: null };
    renderWithProviders(
      <TransactionDetailDialog transaction={tx} open onOpenChange={() => {}} />
    );

    expect(screen.getByText("Pago café")).toBeInTheDocument();
    expect(screen.getByText("Envío")).toBeInTheDocument();
    expect(screen.getByText("Ana Remitente")).toBeInTheDocument();
    expect(screen.getByText("Luis Receptor")).toBeInTheDocument();
    expect(screen.getByText(/-42/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Luis Receptor" })).toHaveAttribute(
      "href",
      "/u/u2"
    );
  });

  it("shows bazar snapshot details", () => {
    const tx: HistoryTransaction = {
      ...baseTx,
      kind: "bazar",
      concept: "Compra: Miel",
      isIngreso: true,
      amount: 12,
      product: {
        id: "p1",
        name: "Miel orgánica",
        priceMxn: 90,
        priceTumin: 12,
        imageUrl: null,
      },
    };
    renderWithProviders(
      <TransactionDetailDialog transaction={tx} open onOpenChange={() => {}} />
    );

    expect(screen.getAllByText("Producto o servicio").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Miel orgánica")).toBeInTheDocument();
    expect(screen.getByText(/\$90 MXN/)).toBeInTheDocument();
    expect(screen.getByText(/\+12\s*Ŧ/)).toBeInTheDocument();
  });
});
