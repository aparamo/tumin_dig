import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageIcon, Link2, HardDrive, Upload, FolderOpen, Eye, AlertCircle } from "lucide-react";

export default function MisArchivosPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          8. Mis Archivos
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Gestor de Medios
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          En la sección <strong>Mis Archivos</strong> puedes subir, organizar y reutilizar imágenes para tus productos, tu perfil y tus anuncios, todo desde un solo lugar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-3 p-5 border-2 border-primary/10 rounded-xl bg-primary/5">
            <Upload className="w-7 h-7 text-primary" />
            <h4 className="font-black uppercase text-sm tracking-widest">Subir imágenes</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Sube fotos de tus productos o avatar directamente desde tu dispositivo. El sistema verifica que no excedan tu cuota disponible antes de aceptarlas.</p>
          </div>
          <div className="flex flex-col gap-3 p-5 border-2 border-primary/10 rounded-xl bg-primary/5">
            <FolderOpen className="w-7 h-7 text-primary" />
            <h4 className="font-black uppercase text-sm tracking-widest">Galería personal</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Todas tus imágenes subidas quedan guardadas. Al crear o editar un producto puedes seleccionar imágenes existentes de tu galería con un solo clic.</p>
          </div>
          <div className="flex flex-col gap-3 p-5 border-2 border-primary/10 rounded-xl bg-primary/5">
            <Eye className="w-7 h-7 text-primary" />
            <h4 className="font-black uppercase text-sm tracking-widest">Previsualización</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">Antes de usar un enlace externo puedes previsualizar la imagen en un iframe para verificar que carga correctamente.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Barra de Almacenamiento
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          En la parte superior de Mis Archivos siempre verás cuánto espacio has utilizado. El sistema te avisa cuando te estás acercando al límite para que puedas liberar o reorganizar tus archivos.
        </p>
        <div className="bg-background border-2 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-primary" />
            <h4 className="font-black uppercase text-sm tracking-widest">Espacio disponible actual</h4>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div className="bg-primary h-3 rounded-full" style={{ width: "40%" }} />
          </div>
          <p className="text-xs text-foreground/60">
            Ejemplo: 12 MB usados de 30 MB disponibles. La barra cambia de color (amarillo, luego rojo) cuando te acercas al límite.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Imágenes desde servicios externos
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          Si prefieres no usar tu espacio de almacenamiento, puedes pegar enlaces de imágenes de servicios externos (Imgur, Pinterest, etc.) directamente en el campo de imágenes de un producto.
        </p>
        <div className="flex gap-4 p-5 border-2 border-primary/10 rounded-xl items-start bg-primary/5">
          <Link2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-black uppercase text-sm tracking-widest">Google Drive y otros drives</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              También puedes guardar y organizar <strong>enlaces compartidos de Google Drive</strong> (u otros servicios de almacenamiento en la nube). La app incluye una previsualización en iframe para verificar que el contenido carga correctamente antes de publicarlo.
            </p>
            <p className="text-xs text-foreground/50 italic">
              Asegúrate de que el archivo en Drive esté configurado como &quot;Cualquier persona con el enlace puede ver&quot; para que la previsualización funcione correctamente.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-4 border border-destructive/20 rounded-xl bg-destructive/5 items-start">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/70">
            <strong>Consejo de seguridad:</strong> La app solo permite previsualizar imágenes y no sigue automáticamente a ninguna URL desconocida. Si una imagen externa no carga, verifica que sea una URL pública directa a un archivo de imagen (JPG, PNG, WebP).
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Imagen de perfil
        </h2>
        <div className="flex gap-4 p-5 border rounded-xl items-start bg-background/50">
          <ImageIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black uppercase text-sm tracking-widest">Sube tu avatar</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Tu foto de perfil también se almacena en tu cuota de Mis Archivos. Puedes subirla o cambiarla desde la sección <strong>Perfil</strong>. Aparece en tu perfil público y en las reseñas y comentarios que dejas en el Bazar.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Niveles de cuenta (propuesta futura)
        </h2>
        <p className="text-base leading-relaxed text-foreground/80 font-medium">
          La plataforma contempla una estructura de cuatro niveles de cuenta con distintas cuotas de almacenamiento. Esta es una <strong>propuesta en estudio</strong> que se definirá consensuadamente con la comunidad antes de activarse, para asegurar que sea justa, accesible y no genere desbalances en la red.
        </p>

        <div className="bg-background border rounded-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-primary/10">
              <TableRow>
                <TableHead className="font-black uppercase text-xs tracking-widest py-4">Nivel</TableHead>
                <TableHead className="font-black uppercase text-xs tracking-widest py-4">Almacenamiento</TableHead>
                <TableHead className="font-black uppercase text-xs tracking-widest py-4">Videos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm font-bold">Normal (gratuita)</TableCell>
                <TableCell className="text-sm font-black text-primary">30 MB</TableCell>
                <TableCell className="text-sm text-foreground/50">No</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold">De pago</TableCell>
                <TableCell className="text-sm font-black text-primary">120 MB</TableCell>
                <TableCell className="text-sm text-foreground/70">Videos cortos</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-sm font-bold">Patrocinadorx</TableCell>
                <TableCell className="text-sm font-black text-primary">350 MB</TableCell>
                <TableCell className="text-sm text-foreground/70">Hasta 80 MB por video</TableCell>
              </TableRow>
              <TableRow className="bg-primary/5">
                <TableCell className="text-sm font-black uppercase tracking-tight">Financiadorx</TableCell>
                <TableCell className="text-sm font-black text-primary">500 MB</TableCell>
                <TableCell className="text-sm text-foreground/70">Hasta 150 MB por video</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="bg-muted/40 border border-border rounded-lg p-5 space-y-2">
          <p className="text-sm text-foreground/70 leading-relaxed">
            Los beneficios de los niveles superiores incluirían: mayor espacio de almacenamiento, posibilidad de publicar videos, y descuentos o paquetes de publicidad comunitaria.
          </p>
          <p className="text-xs text-foreground/50 italic">
            Esta propuesta se activará únicamente si la comunidad la aprueba de forma consensuada. Los detalles — precios, beneficios y condiciones — están abiertos a discusión colectiva.
          </p>
        </div>
      </section>
    </article>
  );
}
