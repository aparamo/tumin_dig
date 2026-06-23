"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle2, X, ShoppingBag, AlertTriangle, UserCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface RecipientCardProps {
  name: string;
  publicName: string | null;
  avatarUrl: string | null;
  status: "ACTIVO" | "CONGELADO";
  hasActiveProduct: boolean;
  isSelf: boolean;
}

function RecipientCard({ name, publicName, avatarUrl, status, hasActiveProduct, isSelf }: RecipientCardProps) {
  const displayName = publicName ?? name;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const canReceive = !isSelf && status === "ACTIVO" && hasActiveProduct;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 p-3",
        canReceive ? "border-green-500/40 bg-green-500/5" : "border-yellow-500/40 bg-yellow-500/5"
      )}
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-black text-muted-foreground">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{displayName}</p>
        {canReceive ? (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-600">
            <CheckCircle2 className="h-3 w-3" /> Puede recibir Túmin
          </p>
        ) : isSelf ? (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-600">
            <AlertTriangle className="h-3 w-3" /> No puedes enviarte a ti mismo
          </p>
        ) : status === "CONGELADO" ? (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-600">
            <AlertTriangle className="h-3 w-3" /> Cuenta congelada
          </p>
        ) : (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-yellow-600">
            <AlertTriangle className="h-3 w-3" /> Sin producto activo en el Bazar
          </p>
        )}
      </div>
    </div>
  );
}

export function Pagar() {
  const { setCurrentScreen } = useStore();
  const pendingPurchase = useStore((s) => s.pendingPurchase);
  const utils = trpc.useUtils();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const appliedFromPurchaseRef = useRef(false);

  const [purchaseBanner, setPurchaseBanner] = useState<{
    productName: string;
    sellerName: string;
  } | null>(null);

  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!pendingPurchase || appliedFromPurchaseRef.current) return;
    startTransition(() => {
      setRecipientInput(pendingPurchase.sellerPhone ?? pendingPurchase.sellerEmail ?? "");
      setAmount(String(pendingPurchase.priceTumin));
      setConcept(`Compra: ${pendingPurchase.productName}`);
      setPurchaseBanner({
        productName: pendingPurchase.productName,
        sellerName: pendingPurchase.sellerName,
      });
      appliedFromPurchaseRef.current = true;
    });
  }, [pendingPurchase]);

  const { data: foundUser, isLoading: isSearching } = trpc.user.searchByDato.useQuery(
    { dato: recipientInput },
    { enabled: recipientInput.length >= 8 }
  );

  const sendTumin = trpc.wallet.sendTumin.useMutation({
    onSuccess: () => {
      utils.wallet.getBalance.invalidate();
      utils.wallet.getHistory.invalidate();
      setCurrentScreen("inicio");
    },
    onError: (error) => {
      setSendError(error.message);
    },
    onSettled: () => {
      setIsSending(false);
    },
  });

  const canTransfer =
    foundUser &&
    foundUser.hasActiveProduct &&
    !foundUser.isSelf &&
    foundUser.status === "ACTIVO";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !foundUser || !amount || !concept || !canTransfer) return;

    setSendError(null);
    setIsSending(true);
    sendTumin.mutate({
      toId: foundUser.id,
      amount: parseFloat(amount),
      concept,
      idempotencyKey,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      {purchaseBanner && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 shadow-neo-sm"
        >
          <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desde el Bazar</p>
            <p className="text-sm font-black uppercase leading-snug text-foreground">
              Comprando: <span className="text-primary">{purchaseBanner.productName}</span> de{" "}
              {purchaseBanner.sellerName}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              Datos del formulario autocompletados; revisa y confirma antes de transferir.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full"
            onClick={() => setPurchaseBanner(null)}
            aria-label="Cerrar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enviar Túmin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase">Teléfono o Correo del receptor</Label>
              <Input
                placeholder="Ej. 9611234567"
                value={recipientInput}
                onChange={(e) => {
                  setRecipientInput(e.target.value);
                  setSendError(null);
                }}
                className="bg-background"
              />
              {isSearching ? (
                <p className="text-xs font-bold uppercase text-muted-foreground">Buscando socio...</p>
              ) : foundUser ? (
                <RecipientCard
                  name={foundUser.name}
                  publicName={foundUser.publicName}
                  avatarUrl={foundUser.avatarUrl}
                  status={foundUser.status}
                  hasActiveProduct={foundUser.hasActiveProduct}
                  isSelf={foundUser.isSelf}
                />
              ) : recipientInput.length >= 8 ? (
                <p className="flex items-center gap-1 text-xs font-black uppercase text-destructive">
                  <UserCircle2 className="h-3 w-3" /> Socio no encontrado
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase">Cantidad (Ŧ)</Label>
              <Input
                type="number"
                placeholder="Ej. 15"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSendError(null);
                }}
                className="bg-background text-2xl font-black"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase">Concepto</Label>
              <Input
                placeholder="¿Por qué pagas?"
                value={concept}
                onChange={(e) => {
                  setConcept(e.target.value);
                  setSendError(null);
                }}
                className="bg-background"
                required
              />
            </div>

            {sendError && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs font-bold">{sendError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="default"
              className="h-14 w-full text-lg"
              disabled={isSending || sendTumin.isPending || !canTransfer}
            >
              {isSending || sendTumin.isPending ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Transferir
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="px-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Recuerda que para enviar Túmin, el destinatario debe tener al menos un producto activo en el Bazar.
      </p>
    </div>
  );
}
