"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";

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
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Enviar Túmin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Teléfono o Correo del receptor</Label>
              <Input 
                placeholder="Ej. 9611234567" 
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
              />
              {isSearching ? (
                 <p className="text-xs text-slate-400">Buscando socio...</p>
              ) : recipient ? (
                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Socio: {recipient.name}
                </p>
              ) : recipientInput.length >= 8 ? (
                 <p className="text-xs text-red-400">Socio no encontrado</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Cantidad (Ŧ)</Label>
              <Input 
                type="number" 
                placeholder="Ej. 15" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input 
                placeholder="¿Por qué pagas?" 
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold"
              disabled={!recipient || sendTumin.isPending}
            >
              {sendTumin.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Transferir
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="text-xs text-slate-400 text-center px-4">
        Recuerda que para enviar Túmin, el destinatario debe tener al menos un producto publicado en el Bazar.
      </p>
    </div>
  );
}
