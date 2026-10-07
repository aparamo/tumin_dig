"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  CheckCircle2,
  X,
  ShoppingBag,
  AlertTriangle,
  UserCircle2,
  Bookmark,
} from "lucide-react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFeedback } from "@/components/FeedbackProvider";

export interface RecipientCardProps {
  name: string;
  publicName: string | null;
  avatarUrl: string | null;
  status: "ACTIVO" | "CONGELADO";
  hasActiveProduct: boolean;
  isSelf: boolean;
}

export function RecipientCard({
  name,
  publicName,
  avatarUrl,
  status,
  hasActiveProduct,
  isSelf,
}: RecipientCardProps) {
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
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            sizes="40px"
            className="object-cover"
          />
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
  const { setCurrentScreen, setDirectoryTab } = useStore();
  const pendingPurchase = useStore((s) => s.pendingPurchase);
  const utils = trpc.useUtils();
  const { notifyError } = useFeedback();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const appliedFromPurchaseRef = useRef(false);

  const { data: savedContactsData } = trpc.directory.listSavedContacts.useQuery({
    cursor: 0,
    pageSize: 25,
  });
  const selectableContacts = (savedContactsData?.items ?? []).filter(
    (c) => c.available && (c.phone || c.email)
  );

  const [purchaseBanner, setPurchaseBanner] = useState<{
    productId: string;
    productName: string;
    sellerId: string;
    sellerName: string;
    priceTumin: number;
    priceMxn: number;
    imageUrl?: string | null;
  } | null>(null);

  const [recipientInput, setRecipientInput] = useState("");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const isPurchaseFlow = Boolean(purchaseBanner);

  useEffect(() => {
    if (!pendingPurchase || appliedFromPurchaseRef.current) return;
    startTransition(() => {
      setRecipientInput(pendingPurchase.sellerPhone ?? pendingPurchase.sellerEmail ?? "");
      setAmount(String(pendingPurchase.priceTumin));
      setConcept(`Compra: ${pendingPurchase.productName}`);
      setPurchaseBanner({
        productId: pendingPurchase.productId,
        productName: pendingPurchase.productName,
        sellerId: pendingPurchase.sellerId,
        sellerName: pendingPurchase.sellerName,
        priceTumin: pendingPurchase.priceTumin,
        priceMxn: pendingPurchase.priceMxn,
        imageUrl: pendingPurchase.imageUrl,
      });
      appliedFromPurchaseRef.current = true;
    });
  }, [pendingPurchase]);

  const { data: foundByDato, isLoading: isSearchingDato } = trpc.user.searchByDato.useQuery(
    { dato: recipientInput },
    { enabled: !isPurchaseFlow && recipientInput.length >= 8 }
  );

  const { data: foundById, isLoading: isSearchingId } = trpc.user.getTransferRecipient.useQuery(
    { userId: purchaseBanner?.sellerId ?? "" },
    { enabled: Boolean(purchaseBanner?.sellerId) }
  );

  const foundUser = isPurchaseFlow ? foundById : foundByDato;
  const isSearching = isPurchaseFlow ? isSearchingId : isSearchingDato;

  const sendTumin = trpc.wallet.sendTumin.useMutation({
    onSuccess: () => {
      utils.wallet.getBalance.invalidate();
      utils.wallet.getHistory.invalidate();
      utils.wallet.listHistory.invalidate();
      utils.wallet.getMyPurchases.invalidate();
      utils.messaging.listConversations.invalidate();
      utils.messaging.unreadCount.invalidate();
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
      ...(purchaseBanner ? { productId: purchaseBanner.productId } : {}),
    });
  };

  const clearPurchase = () => {
    setPurchaseBanner(null);
    useStore.getState().setPendingPurchase(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4">
      {purchaseBanner && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 shadow-neo-sm"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-border bg-muted">
            {purchaseBanner.imageUrl ? (
              <Image
                src={purchaseBanner.imageUrl}
                alt={purchaseBanner.productName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-2 border-border font-black uppercase text-[10px] shadow-neo-sm">
                Compra
              </Badge>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Desde el Bazar
              </p>
            </div>
            <p className="text-sm font-black uppercase leading-snug text-foreground">
              {purchaseBanner.productName}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              Vendedor: {purchaseBanner.sellerName}
            </p>
            <p className="text-sm font-black tracking-tight">
              <span className="text-primary">${purchaseBanner.priceMxn} MXN</span>
              <span className="mx-1.5 text-muted-foreground">+</span>
              <span className="text-secondary">{purchaseBanner.priceTumin} Ŧ</span>
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              Estás pagando la parte en Túmin digitales de este producto.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 rounded-full"
            onClick={clearPurchase}
            aria-label="Convertir a transferencia libre"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!purchaseBanner && (
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="border-2 font-black uppercase text-[10px]">
            Transferencia libre
          </Badge>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Envío de Túmin sin producto vinculado
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isPurchaseFlow ? "Pagar producto" : "Enviar Túmin"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase">Teléfono o Correo del receptor</Label>
              {(savedContactsData?.items.length ?? 0) > 0 && !isPurchaseFlow && (
                <div className="space-y-2 rounded-xl border-2 border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Bookmark className="h-3.5 w-3.5" /> Contactos guardados
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="font-black uppercase text-[9px]"
                      onClick={() => {
                        setDirectoryTab("contactos");
                        setCurrentScreen("directorio");
                      }}
                    >
                      Ver todos
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectableContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="max-w-40 truncate rounded-lg border-2 border-border bg-background px-2.5 py-1.5 text-[10px] font-black uppercase shadow-neo-sm hover:bg-muted"
                        onClick={() => {
                          const dato = c.phone ?? c.email;
                          if (!dato) return;
                          setRecipientInput(dato);
                          setSendError(null);
                        }}
                      >
                        {c.displayName}
                      </button>
                    ))}
                    {(savedContactsData?.items ?? [])
                      .filter((c) => c.available && !c.phone && !c.email)
                      .slice(0, 3)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="max-w-40 truncate rounded-lg border-2 border-dashed border-border px-2.5 py-1.5 text-[10px] font-black uppercase text-muted-foreground opacity-70"
                          onClick={() =>
                            notifyError("Este contacto no comparte teléfono ni correo públicos.")
                          }
                        >
                          {c.displayName}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <Input
                placeholder="Ej. 9611234567"
                value={
                  isPurchaseFlow
                    ? purchaseBanner?.sellerName || "Vendedor del producto"
                    : recipientInput
                }
                onChange={(e) => {
                  setRecipientInput(e.target.value);
                  setSendError(null);
                }}
                className="bg-background"
                disabled={isPurchaseFlow}
                readOnly={isPurchaseFlow}
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
              ) : isPurchaseFlow ? (
                <p className="flex items-center gap-1 text-xs font-black uppercase text-destructive">
                  <UserCircle2 className="h-3 w-3" /> No se pudo cargar el vendedor
                </p>
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
                disabled={isPurchaseFlow}
                readOnly={isPurchaseFlow}
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
                disabled={isPurchaseFlow}
                readOnly={isPurchaseFlow}
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
              {isPurchaseFlow ? "Confirmar compra" : "Transferir"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="px-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Recuerda que para enviar Túmin, el destinatario debe tener al menos un producto activo en el
        Bazar.
      </p>
    </div>
  );
}
