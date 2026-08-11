import React from "react";
import { Card } from "@/components/ui/card";
import { ShoppingBag, MessageSquare, Repeat, Eye, ToggleRight, Star, Pencil, ExternalLink, Send, CheckCircle2, AlertTriangle, Megaphone, ImageIcon, Calendar } from "lucide-react";

export default function MercadoInternoPage() {
  return (
    <article className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-primary uppercase tracking-tighter leading-tight">
          5. Mercado Interno
        </h1>
        <div className="h-2 w-24 bg-primary rounded-full" />
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          El Bazar: descubrir y comprar
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          El Bazar es el corazón de la app. Aquí puedes explorar los productos y servicios de toda la red, filtrar por categoría y <strong>ubicación</strong> (estado donde vive el vendedor), y ordenar por precio o novedad. Los artículos de vendedores en tu mismo estado aparecen primero.
        </p>
        <div className="flex gap-4 p-4 border rounded-xl bg-background/50 items-start">
          <Eye className="w-6 h-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black uppercase text-sm tracking-widest">Detalle de un producto</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Al tocar una tarjeta del Bazar se abre un <strong>diálogo de detalle</strong> con la galería de imágenes, descripción completa, información adicional, calificación del vendedor y un enlace a su perfil público. Desde ahí también puedes contactarlo por WhatsApp, <strong>guardar al vendedor como contacto</strong> o ver todos sus productos.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Pagar con Túmin (Enviar)
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Para transferir Túmin a otra persona usa la pantalla <strong>Enviar Túmin</strong> del menú. También puedes llegar desde el Bazar: al tocar <strong>Comprar</strong> en el detalle de un producto, el formulario se autocompleta con el precio, el concepto y el contacto del vendedor. Si tienes <strong>contactos guardados</strong> con teléfono o correo público, aparecen como atajos encima del campo destinatario.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Send className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Buscar al destinatario</h4>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Escribe el <strong>teléfono o correo</strong> del socio receptor (mínimo 8 caracteres). La app muestra una tarjeta con su foto o iniciales, nombre y si <strong>puede recibir Túmin</strong> antes de que confirmes la transferencia.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border-2 border-green-500/30 rounded-xl items-start bg-green-500/5">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest text-green-700">Puede recibir</h4>
              <p className="text-sm text-foreground/70 leading-relaxed">
                El destinatario tiene al menos un producto con estado <strong>Activo</strong> y su cuenta no está congelada. Puedes completar la transferencia con confianza.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border-2 border-yellow-500/30 rounded-xl items-start bg-yellow-500/5">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest text-yellow-700">No puede recibir</h4>
              <p className="text-sm text-foreground/70 leading-relaxed">
                La transferencia se bloquea si el destinatario no tiene productos activos, su cuenta está <strong>congelada</strong>, o intentas enviarte a ti mismo. El botón Transferir permanece deshabilitado y verás el motivo en la tarjeta.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-primary/5 border border-primary/10 p-5 rounded-xl">
          <p className="text-sm text-foreground/70 leading-relaxed">
            <strong>Regla importante:</strong> solo cuentan los productos con estado <strong>Activo</strong> en <strong>Mis Productos</strong>. Ocultar un artículo del Bazar con el interruptor de visibilidad <em>no</em> impide recibir pagos; pero si marcas todos tus productos como <strong>Inactivo</strong> o los eliminas, dejarás de poder recibir Túmin hasta que vuelvas a tener al menos uno activo.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Cómo vender: Mis Productos
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Para publicar un producto ve a la sección <strong>Mis Productos</strong> desde el menú lateral. Ahí gestionas todo tu inventario personal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-l-4 border-l-orange-500">
            <h4 className="font-black uppercase text-sm tracking-widest mb-1">Paso 1: Precio Justo</h4>
            <p className="text-sm text-foreground/70">Calcula tu precio total y aplica al menos el 10% en Túmin.</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-orange-500">
            <h4 className="font-black uppercase text-sm tracking-widest mb-1">Paso 2: Crear producto</h4>
            <p className="text-sm text-foreground/70">En <strong>Mis Productos</strong> pulsa el botón <strong>&quot;+ Agregar nuevo&quot;</strong> para abrir el formulario.</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-orange-500">
            <h4 className="font-black uppercase text-sm tracking-widest mb-1">Paso 3: Llenar los detalles</h4>
            <p className="text-sm text-foreground/70">Nombre, precios, categoría, <strong>descripción</strong> (obligatoria), información adicional opcional y fotos.</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-orange-500">
            <h4 className="font-black uppercase text-sm tracking-widest mb-1">Paso 4: Publicar</h4>
            <p className="text-sm text-foreground/70">Al confirmar, el producto aparece en el Bazar y activa tus bonos de bienvenida si es el primero.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Gestión de tu inventario
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Desde <strong>Mis Productos</strong> tienes control total sobre cada artículo que publicaste: editarlo, eliminarlo o cambiar su visibilidad.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Pencil className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest">Editar</h4>
              <p className="text-sm text-foreground/70">Cambia nombre, precios, descripción, imágenes o categoría en cualquier momento.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <ToggleRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest">Visibilidad en el Bazar y Perfil</h4>
              <p className="text-sm text-foreground/70">
                Cada producto tiene un interruptor <strong>&quot;Mostrar en perfil y bazar&quot;</strong>. Si lo desactivas, el artículo solo es visible para ti en la gestión — no aparece en el Bazar ni en tu perfil público. Útil para pausar temporalmente sin eliminar el producto.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest">Producto estrella</h4>
              <p className="text-sm text-foreground/70">
                Puedes marcar hasta <strong>5 productos estrella</strong>. Aparecen destacados en el <strong>Directorio</strong>, el Bazar y tu perfil público.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <ShoppingBag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black uppercase text-sm tracking-widest">Estado: Activo / Inactivo</h4>
              <p className="text-sm text-foreground/70">
                Marca un producto como <strong>Inactivo</strong> cuando ya no está disponible, sin perder su historial. Si es tu <strong>último producto activo</strong>, dejarás de poder recibir transferencias de Túmin hasta que reactives o publiques otro con estado Activo. Minar también requiere al menos un producto activo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Directorio de miembros
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          En el menú <strong>Directorio</strong> puedes explorar a las y los socios con <strong>perfil público activo</strong>. Hay vista por tarjetas o lista, filtros por región de inscripción, ubicación y categoría, y ordenamiento (por defecto más recientes). Al tocar un miembro se abre un detalle con opción de <strong>Contactar</strong> (WhatsApp si lo habilita) y <strong>Guardar contacto</strong>.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Tus contactos guardados están en la pestaña <strong>Mis contactos</strong>, también desde Perfil y al enviar Túmin (chips que rellenan teléfono o correo públicos). Desde el Bazar también puedes guardar al vendedor.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Comentarios y Preguntas
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Dentro del diálogo de detalle de cada producto, cualquier socix puede dejar preguntas o comentarios directamente en la plataforma.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Dejar un comentario</h4>
              <p className="text-sm text-foreground/70">Escribe tu pregunta o reseña directamente en el detalle del producto.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Pencil className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Editar o eliminar el tuyo</h4>
              <p className="text-sm text-foreground/70">Solo tú puedes editar o borrar los comentarios que hayas escrito.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Promocionar en la app: Gestión de Anuncios
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          Además del Bazar, puedes solicitar que tu producto, servicio o actividad aparezca en el <strong>banner de anuncios</strong> de la pantalla de inicio. Es una promoción comunitaria gratuita para socios activos.
        </p>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Solicitar un anuncio</h4>
              <p className="text-sm text-foreground/70">
                Ve a <strong>Gestión de Anuncios</strong> en el menú lateral. Puedes elegir uno de tus productos o dejar el campo vacío para promocionar una actividad general. Escribe un mensaje corto, sube una imagen (o reusa la primera foto del producto), elige el <strong>alcance</strong> (tu región de adscripción o toda la red) y, si quieres, indica hasta cuándo deseas que esté activo.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <ImageIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Imagen del anuncio</h4>
              <p className="text-sm text-foreground/70">
                La imagen puede ser nueva o tomada directamente de tu producto. Si cambias de opinión, puedes quitarla antes de enviar la solicitud.
              </p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Estados y aprobación</h4>
              <p className="text-sm text-foreground/70">
                Tu solicitud nace en estado <strong>Pendiente</strong>. Un coordinador de tu región la revisa y la puede aprobar (<strong>Activo</strong>) o rechazar (<strong>Inactivo</strong>). Cuando está activo, entra al sorteo del banner de Inicio: lo ven socios de tu región o de toda la red según el alcance que elegiste, durante el tiempo aprobado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Calificaciones y Perfil del Vendedor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Sistema de Estrellas</h4>
              <p className="text-sm text-foreground/70">Después de una compra, puedes dejar una calificación de 1 a 5 estrellas. Solo se permite una calificación por comprador hacia el mismo vendedor.</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 border rounded-xl items-start bg-background/50">
            <ExternalLink className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black uppercase text-sm tracking-widest">Ver el Perfil del Vendedor</h4>
              <p className="text-sm text-foreground/70">Si el vendedor tiene su perfil público activo, en el diálogo de detalle verás un enlace a su página <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">/u/su-id</code> con todos sus productos activos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Compras Mayores y Ahorro
        </h2>
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          El Túmin no es sólo para el diario; es una herramienta poderosa para adquirir bienes y servicios de alto valor.
        </p>
        <div className="bg-primary/20 text-primary-foreground p-8 rounded-2xl space-y-6">
          <div className="flex gap-4 items-center">
            <ShoppingBag className="w-8 h-8" />
            <h3 className="text-xl font-black uppercase tracking-tight">Estrategia del Pago Mixto</h3>
          </div>
          <div className="space-y-3 text-sm opacity-90 leading-relaxed">
            <p>1. Busca profesionales en la red (médicos, carpinteros, contadores).</p>
            <p>2. Paga una parte en pesos y otra en Túmin (mínimo 10%).</p>
            <p>3. <strong>Ahorra efectivo real</strong> para gastos que no aceptan Túmin fuera de la red.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 border-l-4 border-primary pl-4">
          Responsabilidad y Ética
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h4 className="font-black uppercase text-sm tracking-widest">Palabra Empeñada</h4>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">Un acuerdo por WhatsApp tiene el valor de un contrato. Cumple siempre con lo pactado.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" />
              <h4 className="font-black uppercase text-sm tracking-widest">Intercambio Híbrido</h4>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">La app facilita el pago digital, pero el encuentro físico fortalece el lazo comunitario.</p>
          </div>
        </div>
      </section>
    </article>
  );
}
