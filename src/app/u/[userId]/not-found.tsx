import Link from "next/link";

export default function PublicProfileNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-black uppercase tracking-tight">Perfil no disponible</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Este perfil no existe o la persona mantiene su perfil privado (por defecto los perfiles no
        son públicos hasta que cada socix lo activa en Privacidad).
      </p>
      <Link href="/" className="text-sm font-black uppercase text-primary underline underline-offset-4">
        Ir al inicio
      </Link>
    </div>
  );
}
