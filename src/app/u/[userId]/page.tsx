import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc, sql } from "drizzle-orm";

import { db } from "@/db";
import { users, products, ratings } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ShoppingBag, User, ShieldCheck, Star, Zap, Calendar } from "lucide-react";
import type { Metadata } from "next";

const TIER_LABELS: Record<string, { label: string; className: string }> = {
  NORMAL: { label: "Socix", className: "bg-slate-500" },
  PAGO: { label: "Socix de pago", className: "bg-blue-600" },
  PATROCINADOR: { label: "Patrocinadorx", className: "bg-purple-600" },
  FINANCIADOR: { label: "Financiadorx", className: "bg-amber-600" },
};

type PageProps = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !u.publicProfile) {
    return { title: "Perfil | Túmin" };
  }
  const display = (u.publicName?.trim() ? u.publicName.trim() : null) ?? u.name;
  return { title: `${display} | Túmin` };
}

export default async function PublicUserPage({ params }: PageProps) {
  const { userId } = await params;

  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !u.publicProfile) {
    notFound();
  }

  const displayName = (u.publicName?.trim() ? u.publicName.trim() : null) ?? u.name;
  const bio = u.bio?.trim() ? u.bio.trim() : null;
  const region = u.showRegion ? u.region : null;
  const phone = u.showPhone ? u.phone : null;
  const email = u.showEmail ? u.email : null;

  const activeProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.sellerId, userId),
        eq(products.status, "ACTIVO"),
        eq(products.showInProfile, true)
      )
    )
    .orderBy(desc(products.createdAt));

  const [ratingRow] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${ratings.stars})::float, 0)`.mapWith(Number),
    })
    .from(ratings)
    .where(eq(ratings.sellerId, userId));

  const avgRating = ratingRow?.avg ?? 0;
  const productCount = activeProducts.length;

  const tier = TIER_LABELS[u.accountTier] ?? TIER_LABELS.NORMAL;

  const memberSince = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(u.createdAt);

  const waHref =
    phone != null
      ? (() => {
          const digits = phone.replace(/\D/g, "");
          const withCountry = digits.startsWith("52") ? digits : `52${digits}`;
          return `https://wa.me/${withCountry}?text=${encodeURIComponent(`Hola ${displayName}, te contacto desde Túmin digital.`)}`;
        })()
      : null;

  return (
    <div className="min-h-[100dvh] bg-background p-4 pb-16 md:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground underline-offset-4 hover:underline">
            Ir a la app
          </Link>
        </div>

        <Card className="neo-card overflow-hidden border-2">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
            <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted md:mx-0">
              {u.avatarUrl ? (
                <Image src={u.avatarUrl} alt={displayName} fill sizes="220px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-20 w-20 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-3xl font-black uppercase tracking-tighter">{displayName}</h1>
                {u.isVerified && (
                  <Badge variant="secondary" className="border-2 font-black uppercase">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verificadx
                  </Badge>
                )}
                <Badge className={`border-2 font-black uppercase text-primary-foreground ${tier.className}`}>
                  {u.accountTier === "NORMAL" && <User className="mr-1 h-3 w-3" />}
                  {u.accountTier === "PAGO" && <Zap className="mr-1 h-3 w-3" />}
                  {u.accountTier === "PATROCINADOR" && <Star className="mr-1 h-3 w-3" />}
                  {u.accountTier === "FINANCIADOR" && <ShieldCheck className="mr-1 h-3 w-3" />}
                  {tier.label}
                </Badge>
              </div>
              {region && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{region}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:justify-start">
                <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-1">
                  <Calendar className="h-3 w-3" />
                  Miembro desde {memberSince}
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-1">
                  {productCount} producto{productCount === 1 ? "" : "s"} 
                </span>
                {avgRating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded border border-accent/30 bg-accent/10 px-2 py-1 text-accent">
                    <Star className="h-3 w-3 fill-current" />
                    {avgRating.toFixed(1)} calificación
                  </span>
                )}
              </div>
              {bio && <p className="text-sm font-medium leading-relaxed text-foreground/90">{bio}</p>}
              {email && (
                <p className="break-all text-xs font-bold text-muted-foreground">
                  <a href={`mailto:${email}`} className="underline underline-offset-2">
                    {email}
                  </a>
                </p>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-3 md:justify-start">
                {waHref && (
                  <Button asChild variant="default" className="h-12 border-2 shadow-neo-sm">
                    <a href={waHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-4 text-xl font-black uppercase tracking-tight">Productos en el bazar</h2>
          {activeProducts.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Sin productos activos por ahora.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeProducts.map((p) => {
                const cover = p.imgUrls?.[0] ?? p.imageUrl;
                return (
                  <Card key={p.id} className="overflow-hidden border-2">
                    <div className="relative aspect-video bg-muted">
                      {cover ? (
                        <Image src={cover} alt={p.name} fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/40">
                          <ShoppingBag className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-2 p-4">
                      <h3 className="line-clamp-2 font-black uppercase leading-tight">{p.name}</h3>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.description || "—"}</p>
                      <div className="flex flex-wrap gap-2 text-lg font-black">
                        <span className="text-primary">$ {p.priceMxn} MXN</span>
                        <span className="text-secondary">+ {p.priceTumin} Ŧ</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
