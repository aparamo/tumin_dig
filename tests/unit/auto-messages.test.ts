import { describe, expect, it } from "vitest";
import {
  buildPurchaseAutoMessage,
  buildTransferAutoMessage,
  AUTOMATED_MESSAGE_NOTE,
} from "@/lib/auto-messages";

describe("auto-messages helpers", () => {
  it("builds purchase message with names, product and amounts", () => {
    const body = buildPurchaseAutoMessage({
      sellerDisplayName: "Ana",
      buyerDisplayName: "Luis",
      productName: "Pan de masa madre",
      amountTumin: 15,
      priceMxn: 40,
    });
    expect(body).toBe(
      "Hola Ana, Luis acaba de comprar Pan de masa madre por 15 Túmin digitales. El monto restante es de $40"
    );
    expect(AUTOMATED_MESSAGE_NOTE).toContain("Mi perfil");
  });

  it("builds transfer message with concept", () => {
    const body = buildTransferAutoMessage({
      senderDisplayName: "Luis",
      amountTumin: 10,
      concept: "Gracias",
    });
    expect(body).toContain("Luis te ha enviado 10 Túmin digitales");
    expect(body).toContain("Concepto: Gracias");
  });
});
