# ORIGEN CHIAPAS · Marketplace Digital Comunitario

Réplica funcional y de alta fidelidad del proyecto **Marketplace Digital Origen Chiapas** diseñado en Google Stitch (proyecto `13000943031789728834`).

Stack: **Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + Node.js (route handlers) + SQLite (`node:sqlite`)**.

---

## Pantallas incluidas

| Pantalla | Ruta | Estado |
|---|---|---|
| Mapa Interactivo de Chiapas | `/mapa` | Pins interactivos, filtros, capas, popup, listado |
| Cafetales Don Margarito | `/negocio/cafetales-don-margarito` | Historia, catálogo, proceso, reseñas, entrega/pago |
| Marketplace de Productos | `/marketplace` | Buscador, filtros facetados, pieza maestra, catálogo |
| Mensajería Directa | `/mensajes` | Hilos, chat persistente, referencia de compra, respuestas rápidas |
| Carrito y Pedido Directo | `/carrito` | Carrito, entrega, pago, desglose, pedido real |
| Panel del Emprendedor | `/panel` | Métricas, pedidos, catálogo editable, preguntas, ubicación |
| Acceso y Registro Multiusuario | `/acceso` | Registro/login real por rol (comprador, productor, eco) |

Extras para completar la navegación del diseño: `/` (redirige al mercado), `/productores`, `/como-funciona`.

---

## Cómo ejecutar

```bash
npm install
npm run dev        # http://localhost:3000
```

> Si el puerto `3000` ya está ocupado (como en este equipo), usa:
> `npm run dev -- -p 3100` o `npx next start -p 3100`.
> La demo ya está corriendo en **http://localhost:3100**.

La base de datos SQLite se crea y se siembra automáticamente en `data/origen.db` al primer request.

```bash
npm run build && npm start   # producción en :3000
```

Para reiniciar los datos de demostración:

```bash
npm run db:reset
```

### Cuentas demo

| Rol | Correo | Contraseña |
|---|---|---|
| Productor (Don Margarito) | `margarito@origenchiapas.mx` | `demo1234` |
| Comprador | `alejandra@ejemplo.com` | `demo1234` |
| Administración Origen | `admin@origenchiapas.mx` | `demo1234` |

> El panel también abre en modo demo (Don Margarito) sin iniciar sesión.
> El carrito inicia con dos piezas de muestra para recorrer todo el flujo de compra; puedes quitarlas.

---

## Arquitectura

```
app/
  (site)/                 # Header + Footer comunitarios
    marketplace/          # Catálogo y pieza maestra
    mapa/                 # Directorio geográfico
    negocio/[slug]/       # Ficha de productor
    mensajes/             # Mensajería directa
    carrito/              # Checkout comunitario
    panel/                # Panel del emprendedor
    productores/          # Directorio verificado
    como-funciona/        # Protocolo e impacto
  acceso/                 # Auth minimal (sin header comunitario)
  api/
    auth/{login,register,logout,me}
    cart/                 # GET · POST · PATCH · DELETE
    orders/               # POST crea pedido real, GET historial
    messages/             # Hilos + envío
    seller/{,orders,questions}
components/               # UI cliente (mapa, carrito, panel, chat, auth…)
lib/
  db.ts                   # Esquema, migración inicial y seed
  queries.ts              # Consultas tipadas
  session.ts              # Sesiones httpOnly + carrito por cookie
  seed-data.ts            # Dataset comunitario (productores, productos, reseñas)
  format.ts               # Moneda y fechas es-MX
public/img/               # Fotografía y mapas descargados del proyecto Stitch
```

### Backend (Node.js)

- **SQLite** embebido mediante `node:sqlite` (sin dependencias nativas).
- **Sesiones** con token aleatorio en cookie `httpOnly` (`oc_session`) y tabla `sessions`.
- **Contraseñas** con `scrypt` + salt (`crypto`).
- **Carrito** persistente por cookie `oc_cart`; totales calculados en servidor.
- **Pedidos** transaccionales: descuenta stock, crea `order_items`, abre conversación con cada productor y vacía el carrito.
- **Mensajería** persistente por hilo y productor.
- **Panel** edita precio/stock/estado y publica productos; respuestas a preguntas.

### Endpoints principales

```
GET    /api/cart
POST   /api/cart            { productId, qty, note }
PATCH  /api/cart            { lineId, qty?, note? }
DELETE /api/cart            { lineId } | { all: true }
POST   /api/orders          { name, phone, email, address, delivery, payment }
GET    /api/orders
GET    /api/messages        ?thread=ID
POST   /api/messages        { threadId? | producerId, body, productId? }
GET    /api/seller
POST   /api/seller          { name, price, stock, unit, description, category }
PATCH  /api/seller          { id, status?, price?, stock? }
PATCH  /api/seller/orders   { id, status }
PATCH  /api/seller/questions{ id, answer }
POST   /api/auth/register   { name, email, phone, password, role }
POST   /api/auth/login      { email, password }
POST   /api/auth/logout
GET    /api/auth/me
```

---

## Fidelidad de diseño

Los tokens de color, tipografía (Plus Jakarta Sans), radios, espaciados y copys provienen directamente del proyecto Stitch:

- Primario `#042217`, contenedor `#1B382B`, secundario `#2C694E`, terciario `#651300`, crema `#FBF9F5`, terracota `#E76F51`.
- Escala tipográfica `display-lg` 48/56, `headline-lg` 32/40, `body-md` 15/22, `label-sm` 11/16.
- Tarjetas 16px, inputs/botones 8px, pills full-radius.
- Sombras ambientales verdes y bordes cálidos.
- Fotografía original del proyecto descargada en `public/img` (índice en `public/img-manifest.json`).
- El mapa usa el mismo SVG cartográfico del diseño, con pines, leyenda y capas funcionales.

## Notas

- Las cifras de analítica del panel (visitas/consultas) son de demostración; pedidos y ventas se calculan con datos reales.
- El envío se acuerda por WhatsApp/mensajería; el checkout registra método, costo y datos para que el productor confirme.
- Todos los textos están en español de Chiapas y respetan el tono del diseño original.
