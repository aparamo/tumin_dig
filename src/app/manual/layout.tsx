import React from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { auth } from "@/auth";

const chapters = [
  { id: "1-filosofia", title: "1. Filosofía y Principios" },
  { id: "2-reglas", title: "2. Reglas de Oro" },
  { id: "3-primeros-pasos", title: "3. Primeros Pasos" },
  { id: "4-motor-abundancia", title: "4. Motor de Abundancia" },
  { id: "5-mercado-interno", title: "5. Comprando y Vendiendo" },
  { id: "6-gobernanza", title: "6. Gobernanza y Coordinación" },
  { id: "7-seguridad", title: "7. Seguridad y Privacidad" },
  { id: "8-mis-archivos", title: "8. Mis Archivos" },
];

export default async function ManualLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const backHref = session?.user ? "/" : "/login";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r sticky top-0 h-screen">
        <div className="p-6 border-b">
          <Link href="/manual">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Guía Túmin</h2>
          </Link>
          <p className="text-[10px] text-foreground/50 font-bold uppercase tracking-widest mt-1">Manual del Socio</p>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-4 space-y-2">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/manual/${chapter.id}`}
                className="block p-3 rounded-lg text-sm font-bold uppercase tracking-tight hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
              >
                {chapter.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t">
          <Link href={backHref}>
            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-widest h-10">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
          <Link href="/manual">
            <h2 className="text-xl font-black text-primary uppercase tracking-tighter">Guía Túmin</h2>
          </Link>
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tighter">Capítulos</h2>
              </div>
              <ScrollArea className="h-[calc(100vh-100px)]">
                <nav className="p-4 space-y-2">
                  {chapters.map((chapter) => (
                    <SheetClose key={chapter.id} nativeButton={false} render={
                      <Link
                        href={`/manual/${chapter.id}`}
                        className="block p-3 rounded-lg text-sm font-bold uppercase tracking-tight hover:bg-primary/10 hover:text-primary transition-colors border border-transparent"
                      />
                    }>
                      {chapter.title}
                    </SheetClose>
                  ))}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-6 md:p-12 lg:p-20 max-w-4xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
