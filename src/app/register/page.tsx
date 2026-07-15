"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import {
  ENROLLMENT_REGIONS,
  ENROLLMENT_REGION_HINTS,
  ENROLLMENT_OTHER,
  MEXICO_STATES,
  MEXICO_COUNTRY,
  type EnrollmentMethod,
} from "@/lib/location";

const ENROLLMENT_SELECT_REGIONS = ENROLLMENT_REGIONS.filter((r) => r !== ENROLLMENT_OTHER);

type ResidenceMode = "mexico" | "international";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const { notifySuccess } = useFeedback();
  const registerMutation = trpc.user.register.useMutation();

  const referrerId = searchParams.get("ref") ?? "";
  const inviteToken = searchParams.get("token") ?? "";
  const isReferralValid = referrerId.length > 0 || inviteToken.length > 0;

  const [residenceMode, setResidenceMode] = useState<ResidenceMode>("mexico");
  const [enrollmentMethod, setEnrollmentMethod] = useState<EnrollmentMethod>("REGION");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    region: "",
    enrollmentMethodOther: "",
    residenceState: "",
    residenceCity: "",
    residencePostalCode: "",
    residenceCountry: "",
    nip: "",
    referrerId,
    inviteToken,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          {status === "loading" ? "Cargando…" : "Redirigiendo…"}
        </p>
      </div>
    );
  }

  const handleEnrollmentRegionChange = (val: string) => {
    if (val === ENROLLMENT_OTHER) {
      setEnrollmentMethod("OTHER");
      setFormData((f) => ({ ...f, region: ENROLLMENT_OTHER }));
    } else {
      setEnrollmentMethod("REGION");
      setFormData((f) => ({ ...f, region: val, enrollmentMethodOther: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isReferralValid) {
      setError("🚫 Esta es una red cerrada. Necesitas una invitación válida.");
      return;
    }

    const residenceCountry =
      residenceMode === "mexico" ? MEXICO_COUNTRY : formData.residenceCountry.trim();

    try {
      await registerMutation.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        region: enrollmentMethod === "OTHER" ? ENROLLMENT_OTHER : formData.region,
        enrollmentMethod,
        enrollmentMethodOther:
          enrollmentMethod === "OTHER" ? formData.enrollmentMethodOther : undefined,
        residenceCountry,
        residenceState: residenceMode === "mexico" ? formData.residenceState : undefined,
        residenceCity: formData.residenceCity.trim() || undefined,
        residencePostalCode: formData.residencePostalCode.trim() || undefined,
        nip: formData.nip,
        referrerId: formData.referrerId || undefined,
        inviteToken: formData.inviteToken || undefined,
      });
      notifySuccess("¡Cuenta creada con éxito!");
      router.push("/login");
    } catch (err) {
      setError(parseErrorMessage(err));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-primary uppercase tracking-tighter">
            Crear Cuenta
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
            Puedes vivir en cualquier estado o país. Solo necesitamos saber dónde te inscribiste y dónde vives hoy.
          </p>
          {isReferralValid ? (
            <div className="mt-4 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground p-3 rounded-lg border-2 border-border font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              Invitación detectada
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 bg-destructive/10 text-destructive p-3 rounded-lg border-2 border-destructive/20 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              Red cerrada: Necesitas invitación
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-black uppercase text-xs">
                Nombre Completo
              </Label>
              <Input
                id="name"
                placeholder="Tu nombre"
                className="bg-background"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-black uppercase text-xs">
                Teléfono (WhatsApp)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10 dígitos o con lada"
                className="bg-background"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-black uppercase text-xs">
                Correo Electrónico (Opcional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-background"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-3 rounded-xl border-2 border-border bg-muted/20 p-4">
              <p className="text-base font-black uppercase tracking-wide text-primary">
                Inscripción comunitaria
              </p>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Indica en qué región comunitaria te inscribiste o cómo fue tu proceso. Esto ayuda a tu coordinación a verificarte y mantener la red de confianza. <strong className="text-foreground">No tiene que coincidir con el estado donde vives.</strong>
              </p>
              <div className="space-y-2">
                <Label className="font-black uppercase text-xs">Región donde te inscribiste</Label>
                <Select
                  value={enrollmentMethod === "OTHER" ? ENROLLMENT_OTHER : formData.region}
                  onValueChange={(val) => val && handleEnrollmentRegionChange(val)}
                >
                  <SelectTrigger className="bg-background border-2 border-border h-10 font-medium">
                    <SelectValue placeholder="Selecciona tu región de inscripción" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-2 border-border max-h-72">
                    {ENROLLMENT_SELECT_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{r}</span>
                          {ENROLLMENT_REGION_HINTS[r] ? (
                            <span className="text-[10px] font-normal normal-case text-muted-foreground">
                              {ENROLLMENT_REGION_HINTS[r]}
                            </span>
                          ) : null}
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value={ENROLLMENT_OTHER}>
                      <span className="flex flex-col items-start gap-0.5">
                        <span>Otra región o proceso distinto</span>
                        <span className="text-[10px] font-normal normal-case text-muted-foreground">
                          Si te inscribiste fuera de estas regiones, cuéntanos cómo
                        </span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {enrollmentMethod === "OTHER" && (
                <div className="space-y-2">
                  <Label htmlFor="enrollmentOther" className="font-black uppercase text-xs">
                    ¿Cómo fue tu inscripción?
                  </Label>
                  <Textarea
                    id="enrollmentOther"
                    placeholder="Ej. me inscribí en Puebla con referido de Veracruz; taller en Jalisco; comunidad en el extranjero; feria comunitaria…"
                    className="min-h-[88px] bg-background border-2"
                    value={formData.enrollmentMethodOther}
                    onChange={(e) =>
                      setFormData({ ...formData, enrollmentMethodOther: e.target.value })
                    }
                    required
                    maxLength={240}
                  />
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    Sé breve pero claro: quién te invitó, en qué actividad o comunidad te sumaste. Esto facilita que un coordinador te valide.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border-2 border-border bg-muted/20 p-4">
              <p className="text-base font-black uppercase tracking-wide text-primary">
                Dónde vives actualmente
              </p>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Puedes seleccionar <strong className="text-foreground">cualquier estado de México</strong> o indicar si vives en otro país. Esto solo sirve para el bazar y tu perfil, no limita tu participación.
              </p>
              <div className="space-y-2">
                <Label className="font-black uppercase text-xs">Ubicación</Label>
                <Select
                  value={residenceMode}
                  onValueChange={(val) => {
                    if (val === "mexico" || val === "international") setResidenceMode(val);
                  }}
                >
                  <SelectTrigger className="bg-background border-2 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mexico">Vivo en México</SelectItem>
                    <SelectItem value="international">Vivo fuera de México</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {residenceMode === "mexico" ? (
                <>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Estado</Label>
                    <Select
                      value={formData.residenceState}
                      onValueChange={(val) =>
                        val && setFormData({ ...formData, residenceState: val })
                      }
                    >
                      <SelectTrigger className="bg-background border-2 h-10">
                        <SelectValue placeholder="Selecciona tu estado" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {MEXICO_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Ciudad (opcional)</Label>
                    <Input
                      className="bg-background"
                      value={formData.residenceCity}
                      onChange={(e) => setFormData({ ...formData, residenceCity: e.target.value })}
                      placeholder="Tu ciudad o localidad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">C.P. (opcional)</Label>
                    <Input
                      className="bg-background"
                      value={formData.residencePostalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, residencePostalCode: e.target.value })
                      }
                      placeholder="Código postal"
                      maxLength={24}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">País o región</Label>
                    <Input
                      className="bg-background"
                      value={formData.residenceCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, residenceCountry: e.target.value })
                      }
                      placeholder="Ej. Colombia, España…"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Ciudad (opcional)</Label>
                    <Input
                      className="bg-background"
                      value={formData.residenceCity}
                      onChange={(e) => setFormData({ ...formData, residenceCity: e.target.value })}
                      placeholder="Tu ciudad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-xs">Código postal (opcional)</Label>
                    <Input
                      className="bg-background"
                      value={formData.residencePostalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, residencePostalCode: e.target.value })
                      }
                      placeholder="Código postal"
                      maxLength={24}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip" className="font-black uppercase text-xs">
                Crea un NIP (4–6 caracteres)
              </Label>
              <Input
                id="nip"
                type="password"
                maxLength={6}
                placeholder="****"
                className="text-center tracking-widest bg-background"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-bold text-center uppercase">{error}</p>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full h-14 text-lg mt-4"
              disabled={registerMutation.isPending || !isReferralValid}
            >
              {registerMutation.isPending ? "Registrando..." : "Registrarme"}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-foreground/60 font-bold hover:text-foreground text-xs uppercase tracking-widest underline underline-offset-4"
            >
              Cancelar y volver
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">Cargando...</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
