"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Pagar() {
  const { setCurrentScreen } = useStore();
  const utils = trpc.useUtils();
  
  const [recipientInput, setRecipientInput] = useState("");
  const [recipient, setRecipient] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");

  const { data: foundUser, isLoading: isSearching } = trpc.user.searchByDato.useQuery(
    { dato: recipientInput },
    { enabled: recipientInput.length >= 8 }
  );

  useEffect(() => {
    if (foundUser) {
      setRecipient(foundUser);
    } else {
      setRecipient(null);
    }
  }, [foundUser]);

  const sendTumin = trpc.wallet.sendTumin.useMutation({
    onSuccess: () => {
      alert("¡Pago enviado con éxito!");
      utils.wallet.getBalance.invalidate();
      utils.wallet.getHistory.invalidate();
      setCurrentScreen("inicio");
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !concept) return;
    
    sendTumin.mutate({
      toId: recipient.id,
      amount: parseFloat(amount),
      concept,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Enviar Túmin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs">Teléfono o Correo del receptor</Label>
              <Input 
                placeholder="Ej. 9611234567" 
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                className="bg-background"
              />
              {isSearching ? (
                 <p className="text-xs text-muted-foreground font-bold uppercase">Buscando socio...</p>
              ) : recipient ? (
                <p className="text-xs font-black text-primary flex items-center gap-1 uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Socio: {recipient.name}
                </p>
              ) : recipientInput.length >= 8 ? (
                 <p className="text-xs text-destructive font-black uppercase">Socio no encontrado</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs">Cantidad (Ŧ)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 15" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background text-2xl font-black"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs">Concepto</Label>
              <Input 
                placeholder="¿Por qué pagas?" 
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="bg-background"
                required
              />
            </div>

            <Button 
              type="submit" 
              variant="default"
              className="w-full h-14 text-lg"
              disabled={!recipient || sendTumin.isPending}
            >
              {sendTumin.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              Transferir
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground text-center px-4 font-bold uppercase tracking-wider">
        Recuerda que para enviar Túmin, el destinatario debe tener al menos un producto publicado en el Bazar.
      </p>
    </div>
  );
}
