"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { trpc } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, User, Key, Save, 
  ShieldCheck, Star, Zap, FolderOpen, LogOut, Copy, ExternalLink, MapPin, Network, BookUser, Bookmark
} from "lucide-react";
import { signOut } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { UploadButton, createUploadBeginHandlers, UPLOAD_LIMIT_BYTES, UPLOAD_LIMITS } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeedback } from "@/components/FeedbackProvider";
import { parseErrorMessage } from "@/lib/parse-error";
import {
  ENROLLMENT_OTHER,
  MEXICO_STATES,
  MEXICO_COUNTRY,
  formatEnrollmentDisplay,
  formatPublicLocation,
  isKnownEnrollmentRegion,
  isMexicoCountry,
} from "@/lib/location";

function PrivacyRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="text-xs font-black uppercase">
          {label}
        </Label>
        {description ? (
          <p className="text-[10px] font-medium leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="shrink-0" />
    </div>
  );
}

const TIER_BADGES = {
  NORMAL: { label: "Socix", color: "bg-slate-500", icon: User },
  PAGO: { label: "Socix de Pago", color: "bg-blue-600", icon: Zap },
  PATROCINADOR: { label: "Patrocinadorx", color: "bg-purple-600", icon: Star },
  FINANCIADOR: { label: "Financiadorx", color: "bg-amber-600", icon: ShieldCheck },
};

export function Perfil() {
  const { setCurrentScreen, setDirectoryTab } = useStore();
  const { data: savedContactsPreview } = trpc.directory.listSavedContacts.useQuery({
    cursor: 0,
    pageSize: 10,
  });
  const utils = trpc.useUtils();
  const { notifySuccess, notifyError } = useFeedback();
  const avatarUploadHandlers = useMemo(
    () =>
      createUploadBeginHandlers(
        { notifyError, notifySuccess },
        {
          imageMaxBytes: UPLOAD_LIMIT_BYTES.avatarImage,
          label: "foto de perfil",
        },
      ),
    [notifyError, notifySuccess],
  );
  const { data: user, isLoading } = trpc.user.fullMe.useQuery();
  
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      notifySuccess("Perfil actualizado correctamente");
      utils.user.fullMe.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e))
  });

  const updateNip = trpc.user.updateNip.useMutation({
    onSuccess: () => {
      notifySuccess("NIP actualizado");
      setNipData({ current: "", new: "", confirm: "" });
    },
    onError: (e) => notifyError(parseErrorMessage(e))
  });

  const updateLocation = trpc.user.updateLocation.useMutation({
    onSuccess: () => {
      notifySuccess("Ubicación actualizada correctamente");
      void utils.user.fullMe.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const updatePrivacySettings = trpc.user.updatePrivacySettings.useMutation({
    onSuccess: () => {
      notifySuccess("Privacidad y perfil público actualizados");
      void utils.user.fullMe.invalidate();
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [nipData, setNipData] = useState({ current: "", new: "", confirm: "" });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showPhone: true,
    showEmail: false,
    showRegion: true,
    publicName: "",
    bio: "",
  });
  const [locationData, setLocationData] = useState({
    residenceMode: "mexico" as "mexico" | "international",
    residenceState: "",
    residenceCity: "",
    residencePostalCode: "",
    residenceCountry: "",
  });
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  // Sync editData with user data when it first loads or changes
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setEditData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setPrivacy({
      publicProfile: user.publicProfile,
      showPhone: user.showPhone,
      showEmail: user.showEmail,
      showRegion: user.showRegion,
      publicName: user.publicName ?? "",
      bio: user.bio ?? "",
    });
    const intl = user.residenceCountry && !isMexicoCountry(user.residenceCountry);
    setLocationData({
      residenceMode: intl ? "international" : "mexico",
      residenceState: user.residenceState ?? "",
      residenceCity: user.residenceCity ?? "",
      residencePostalCode: user.residencePostalCode ?? "",
      residenceCountry: intl ? (user.residenceCountry ?? "") : "",
    });
  }

  const needsEnrollmentFix =
    user &&
    !isKnownEnrollmentRegion(user.region) &&
    user.region !== ENROLLMENT_OTHER;

  const needsResidence =
    user && !user.residenceCountry && !user.residenceState;

  const getOrCreateInviteToken = trpc.user.getOrCreateInviteToken.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/register?token=${data.token}`;
      navigator.clipboard.writeText(link);
      const expiry = new Date(data.expiresAt).toLocaleDateString();
      notifySuccess(`¡Link de invitación copiado! Vence el ${expiry}`);
    },
    onError: (e) => notifyError(parseErrorMessage(e)),
  });

  if (isLoading || !user) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  const tier = (user.accountTier as keyof typeof TIER_BADGES) || "NORMAL";
  const TierIcon = TIER_BADGES[tier].icon;

  return (
    <div className="flex flex-col gap-8 p-4 pb-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Left Col: Avatar & ID */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <Card className="neo-card border-2 overflow-hidden">
            <div className="aspect-square bg-muted relative group">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <User className="w-24 h-24 text-primary/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <UploadButton
                  endpoint="avatar"
                  onBeforeUploadBegin={avatarUploadHandlers.onBeforeUploadBegin}
                  onClientUploadComplete={() => {
                    notifySuccess("Foto de perfil actualizada");
                    utils.user.fullMe.invalidate();
                  }}
                  onUploadError={avatarUploadHandlers.onUploadError}
                  content={{
                    button: "Cambiar Foto",
                    allowedContent: `Máx. ${UPLOAD_LIMITS.avatarImage} (se optimiza si pesa de más)`,
                  }}
                  appearance={{
                    button: "neo-btn bg-primary text-primary-foreground uppercase text-[10px] h-8 px-4",
                    allowedContent: "hidden"
                  }}
                />
              </div>
            </div>
            <CardContent className="pt-4 text-center">
              <h2 className="text-xl font-black uppercase truncate">{user.name}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{user.id}</p>
              <Badge className={cn("font-black uppercase py-1 px-4 mb-2", TIER_BADGES[tier].color)}>
                <TierIcon className="w-3 h-3 mr-2" /> {TIER_BADGES[tier].label}
              </Badge>
              {user.isVerified ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 font-black uppercase text-[10px] mb-4">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Identidad verificada
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-black uppercase text-[10px] mb-4">
                  Identidad pendiente de validar
                </Badge>
              )}
              <div className="flex justify-center bg-white p-4 rounded-2xl border-2 border-border mb-4 shadow-neo-sm">
                <QRCodeSVG value={user.id} size={150} />
              </div>
              <Button 
                variant="outline" 
                className="w-full h-10 border-2 font-black uppercase text-xs mb-2"
                onClick={() => setCurrentScreen("medios")}
              >
                <FolderOpen className="w-4 h-4 mr-2" /> Mis Archivos
              </Button>
            </CardContent>
          </Card>

          {/* Invitation Card */}
          <Card className="neo-card bg-secondary/10 border-secondary border-dashed border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2 text-secondary text-lg font-black uppercase">
                🤝 Invitar
              </CardTitle>
              <CardDescription className="text-muted-foreground font-bold uppercase text-[9px] tracking-widest">
                Link seguro que se renueva cada semana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => getOrCreateInviteToken.mutate()}
                disabled={getOrCreateInviteToken.isPending}
                variant="secondary"
                className="w-full h-10 font-black uppercase text-xs border-2 shadow-neo-sm"
              >
                {getOrCreateInviteToken.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copiar Link
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 border-2 font-black uppercase text-xs"
                onClick={() => setCurrentScreen("mi-red")}
              >
                <Network className="w-4 h-4 mr-2" /> Ver mi Red
              </Button>
            </CardContent>
          </Card>

          <Card className="neo-card border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Directorio y contactos</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                Explora socios públicos y tus contactos guardados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!privacy.publicProfile && (
                <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground">
                  Activa tu perfil público abajo para aparecer en el Directorio.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-10 flex-1 border-2 font-black uppercase text-xs shadow-neo-sm"
                  onClick={() => {
                    setDirectoryTab("miembros");
                    setCurrentScreen("directorio");
                  }}
                >
                  <BookUser className="mr-2 h-4 w-4" /> Directorio
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 flex-1 border-2 font-black uppercase text-xs shadow-neo-sm"
                  onClick={() => {
                    setDirectoryTab("contactos");
                    setCurrentScreen("directorio");
                  }}
                >
                  <Bookmark className="mr-2 h-4 w-4" /> Ver contactos
                </Button>
              </div>
              {(savedContactsPreview?.items.length ?? 0) > 0 && (
                <ul className="space-y-1.5 border-t-2 border-border pt-3">
                  {savedContactsPreview!.items.slice(0, 5).map((c) => (
                    <li key={c.id} className="truncate text-xs font-bold">
                      {c.displayName}
                      {!c.available && (
                        <span className="ml-2 text-[9px] font-black uppercase text-muted-foreground">
                          no disponible
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Button 
            variant="destructive" 
            className="w-full h-12 shadow-neo-sm font-black uppercase"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-2" /> Cerrar Sesión
          </Button>
        </div>

        {/* Right Col: Forms */}
        <div className="flex-1 w-full space-y-8">
          {/* Basic Info */}
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Información de Perfil</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Actualiza tus datos de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Nombre Completo</Label>
                  <Input 
                    value={editData.name} 
                    onChange={e => setEditData({...editData, name: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Teléfono</Label>
                  <Input 
                    value={editData.phone} 
                    onChange={e => setEditData({...editData, phone: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Correo Electrónico</Label>
                  <Input 
                    type="email"
                    value={editData.email} 
                    onChange={e => setEditData({...editData, email: e.target.value})}
                    className="bg-background border-2 h-12"
                  />
                </div>
              </div>
              <Button 
                className="w-full md:w-auto px-8 h-12 font-black uppercase"
                disabled={updateProfile.isPending}
                onClick={() => updateProfile.mutate(editData)}
              >
                {updateProfile.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          {/* Inscripción y ubicación */}
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" /> Inscripción y ubicación
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">
                Tu región de inscripción es para coordinación; tu ubicación ayuda al bazar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(needsEnrollmentFix || needsResidence) && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                  {needsEnrollmentFix && (
                    <p>Completa o corrige tu región de inscripción para continuar usando todas las funciones.</p>
                  )}
                  {needsResidence && (
                    <p className={needsEnrollmentFix ? "mt-2" : ""}>
                      Agrega tu ubicación actual para mejorar el bazar y tu perfil público (opcional pero recomendado).
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border-2 border-border bg-muted/20 p-4 space-y-2">
                <Label className="text-[10px] font-black uppercase">Región de inscripción</Label>
                <p className="text-sm font-bold">
                  {formatEnrollmentDisplay(
                    user.region,
                    user.enrollmentMethod,
                    user.enrollmentMethodOther
                  )}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  Define qué coordinación puede apoyarte. Para cambiarla contacta a tu coordinador.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase ml-1">Dónde vives actualmente</Label>
                <Select
                  value={locationData.residenceMode}
                  onValueChange={(val) => {
                    if (val === "mexico" || val === "international") {
                      setLocationData((l) => ({ ...l, residenceMode: val }));
                    }
                  }}
                >
                  <SelectTrigger className="h-12 border-2 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mexico">Vivo en México</SelectItem>
                    <SelectItem value="international">Vivo fuera de México</SelectItem>
                  </SelectContent>
                </Select>

                {locationData.residenceMode === "mexico" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1">Estado</Label>
                      <Select
                        value={locationData.residenceState}
                        onValueChange={(val) =>
                          val && setLocationData((l) => ({ ...l, residenceState: val }))
                        }
                      >
                        <SelectTrigger className="h-12 border-2 bg-background">
                          <SelectValue placeholder="Selecciona estado" />
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
                      <Label className="text-[10px] font-black uppercase ml-1">Ciudad (opcional)</Label>
                      <Input
                        className="bg-background border-2 h-12"
                        value={locationData.residenceCity}
                        onChange={(e) =>
                          setLocationData((l) => ({ ...l, residenceCity: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase ml-1">C.P. (opcional)</Label>
                      <Input
                        className="bg-background border-2 h-12"
                        value={locationData.residencePostalCode}
                        onChange={(e) =>
                          setLocationData((l) => ({ ...l, residencePostalCode: e.target.value }))
                        }
                        maxLength={24}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase ml-1">País o región</Label>
                      <Input
                        className="bg-background border-2 h-12"
                        value={locationData.residenceCountry}
                        onChange={(e) =>
                          setLocationData((l) => ({ ...l, residenceCountry: e.target.value }))
                        }
                        placeholder="Ej. Colombia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1">Ciudad (opcional)</Label>
                      <Input
                        className="bg-background border-2 h-12"
                        value={locationData.residenceCity}
                        onChange={(e) =>
                          setLocationData((l) => ({ ...l, residenceCity: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1">C.P. (opcional)</Label>
                      <Input
                        className="bg-background border-2 h-12"
                        value={locationData.residencePostalCode}
                        onChange={(e) =>
                          setLocationData((l) => ({ ...l, residencePostalCode: e.target.value }))
                        }
                        maxLength={24}
                      />
                    </div>
                  </div>
                )}

                {formatPublicLocation({
                  residenceCountry:
                    locationData.residenceMode === "mexico"
                      ? MEXICO_COUNTRY
                      : locationData.residenceCountry || null,
                  residenceState:
                    locationData.residenceMode === "mexico" ? locationData.residenceState : null,
                  residenceCity: locationData.residenceCity || null,
                  residencePostalCode: locationData.residencePostalCode || null,
                }) && (
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Vista previa:{" "}
                    {formatPublicLocation({
                      residenceCountry:
                        locationData.residenceMode === "mexico"
                          ? MEXICO_COUNTRY
                          : locationData.residenceCountry || null,
                      residenceState:
                        locationData.residenceMode === "mexico" ? locationData.residenceState : null,
                      residenceCity: locationData.residenceCity || null,
                      residencePostalCode: locationData.residencePostalCode || null,
                    })}
                  </p>
                )}
              </div>

              <Button
                className="w-full md:w-auto px-8 h-12 font-black uppercase"
                disabled={updateLocation.isPending}
                onClick={() =>
                  updateLocation.mutate({
                    residenceCountry:
                      locationData.residenceMode === "mexico"
                        ? MEXICO_COUNTRY
                        : locationData.residenceCountry.trim() || null,
                    residenceState:
                      locationData.residenceMode === "mexico"
                        ? locationData.residenceState || null
                        : null,
                    residenceCity: locationData.residenceCity.trim() || null,
                    residencePostalCode: locationData.residencePostalCode.trim() || null,
                  })
                }
              >
                {updateLocation.isPending ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <MapPin className="w-5 h-5 mr-2" />
                )}
                Guardar ubicación
              </Button>
            </CardContent>
          </Card>

          {/* Privacidad y perfil público */}
          <Card id="privacidad" className="neo-card scroll-mt-24 border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Privacidad y perfil público</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">
                Controla qué datos se muestran en el bazar y en tu página pública
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild className="h-10 border-2 font-black uppercase text-xs">
                  <a href={`/u/${user.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Ver mi perfil público
                  </a>
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Nombre público (opcional)</Label>
                <Input
                  placeholder="Si lo dejas vacío, usamos tu nombre completo"
                  value={privacy.publicName}
                  onChange={(e) => setPrivacy((p) => ({ ...p, publicName: e.target.value }))}
                  className="bg-background border-2 h-12"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-1">Bio pública (máx. 300)</Label>
                <Textarea
                  placeholder="Cuéntale a la comunidad quién eres…"
                  value={privacy.bio}
                  onChange={(e) => setPrivacy((p) => ({ ...p, bio: e.target.value.slice(0, 300) }))}
                  className="min-h-22 border-2 bg-background"
                  maxLength={300}
                />
              </div>

              <div className="space-y-4 rounded-xl border-2 border-border bg-muted/20 p-4">
                <PrivacyRow
                  id="publicProfile"
                  label="Perfil público visible"
                  description="Permite que exista la página /u con tu información permitida."
                  checked={privacy.publicProfile}
                  onCheckedChange={(v) => setPrivacy((p) => ({ ...p, publicProfile: v }))}
                />
                <PrivacyRow
                  id="showPhone"
                  label="Mostrar teléfono en el bazar"
                  description="Habilita el botón de WhatsApp cuando publicas o vendes."
                  checked={privacy.showPhone}
                  onCheckedChange={(v) => setPrivacy((p) => ({ ...p, showPhone: v }))}
                />
                <PrivacyRow
                  id="showEmail"
                  label="Mostrar correo en perfil público"
                  checked={privacy.showEmail}
                  onCheckedChange={(v) => setPrivacy((p) => ({ ...p, showEmail: v }))}
                />
                <PrivacyRow
                  id="showRegion"
                  label="Mostrar ubicación en perfil público"
                  description="Muestra ciudad/estado o país en tu página pública y bazar."
                  checked={privacy.showRegion}
                  onCheckedChange={(v) => setPrivacy((p) => ({ ...p, showRegion: v }))}
                />
              </div>

              <Button
                className="w-full md:w-auto px-8 h-12 font-black uppercase"
                disabled={updatePrivacySettings.isPending}
                onClick={() =>
                  updatePrivacySettings.mutate({
                    publicProfile: privacy.publicProfile,
                    showPhone: privacy.showPhone,
                    showEmail: privacy.showEmail,
                    showRegion: privacy.showRegion,
                    publicName: privacy.publicName.trim() === "" ? null : privacy.publicName.trim(),
                    bio: privacy.bio.trim() === "" ? null : privacy.bio.trim(),
                  })
                }
              >
                {updatePrivacySettings.isPending ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                Guardar privacidad
              </Button>
            </CardContent>
          </Card>

          {/* Security / NIP */}
          <Card className="neo-card border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Seguridad</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Actualiza tu NIP (4 a 6 caracteres alfanuméricos)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Nuevo NIP</Label>
                  <Input 
                    type="password"
                    placeholder="****"
                    maxLength={6}
                    autoComplete="new-password"
                    value={nipData.new} 
                    onChange={e => setNipData({...nipData, new: e.target.value.slice(0, 6)})}
                    className="bg-background border-2 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">Confirmar Nuevo NIP</Label>
                  <Input 
                    type="password"
                    placeholder="****"
                    maxLength={6}
                    autoComplete="new-password"
                    value={nipData.confirm} 
                    onChange={e => setNipData({...nipData, confirm: e.target.value.slice(0, 6)})}
                    className="bg-background border-2 h-12"
                  />
                </div>
              </div>
              <Button 
                variant="secondary"
                className="w-full md:w-auto px-8 h-12 font-black uppercase border-2 shadow-neo-sm"
                disabled={!nipData.new || nipData.new !== nipData.confirm || nipData.new.length < 4 || nipData.new.length > 6 || updateNip.isPending}
                onClick={() => {
                  if (nipData.new.length < 4 || nipData.new.length > 6) {
                    notifyError("El NIP debe tener entre 4 y 6 caracteres");
                    return;
                  }
                  if (nipData.new !== nipData.confirm) {
                    notifyError("Los NIP no coinciden");
                    return;
                  }
                  if (!/^[a-zA-Z0-9]+$/.test(nipData.new)) {
                    notifyError("El NIP solo puede contener letras y números");
                    return;
                  }
                  updateNip.mutate({ nip: nipData.new });
                }}
              >
                {updateNip.isPending ? <Loader2 className="animate-spin mr-2" /> : <Key className="w-5 h-5 mr-2" />}
                Actualizar NIP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
