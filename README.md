# ORIGEN CHIAPAS · Marketplace Digital Comunitario

Réplica funcional y de alta fidelidad del proyecto **Marketplace Digital Origen Chiapas** diseñado en Google Stitch (proyecto `13000943031789728834`).

Monorepo con separación real de responsabilidades:

| Carpeta | Rol | Stack |
|---|---|---|
| `frontend/` | Interfaz, SSR y experiencia de usuario | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| `backend/` | API REST, sesiones, carrito, pedidos y persistencia | Node.js, Express 5, SQLite (`node:sqlite`) |

```
Navegador ──> Next.js :3100 ──/api/*──> Express :4000 ──> SQLite
```

El frontend proxya `/api/*` hacia el backend, por lo que las cookies `httpOnly` y las llamadas del navegador funcionan sin CORS ni configuración extra.

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
| Lenguas Originarias | `/lenguas` | 12 lenguas, estado real de traducción, intérpretes y diccionarios |

Extras para completar la navegación: `/` (redirige al mercado), `/productores`, `/como-funciona`, `/lenguas`.

---

## Cómo ejecutar

```bash
npm install
npm run dev
```

- Frontend: **http://localhost:3100**
- API: **http://localhost:4000/api/health**

`npm run dev` levanta ambos servicios en paralelo con `concurrently`.

Producción:

```bash
npm run build
npm start
```

La base SQLite se crea y se siembra automáticamente en `backend/data/origen.db` al arrancar la API.

```bash
npm run db:reset   # vuelve al dataset de demostración
```

### Cuentas demo

| Rol | Correo | Contraseña |
|---|---|---|
| Productor (Don Margarito) | `margarito@origenchiapas.mx` | `demo1234` |
| Comprador | `alejandra@ejemplo.com` | `demo1234` |
| Administración Origen | `admin@origenchiapas.mx` | `demo1234` |

> El panel abre en modo demo (Don Margarito) sin iniciar sesión.
> El carrito inicia con dos piezas de muestra para recorrer el flujo de compra; puedes quitarlas.

### Variables de entorno (opcionales)

| Variable | Dónde | Default |
|---|---|---|
| `API_INTERNAL_URL` | frontend | `http://127.0.0.1:4000` |
| `PORT` | backend | `4000` |
| `FRONTEND_ORIGIN` | backend | `http://localhost:3100` |
| `DATA_DIR` | backend | `backend/data` |
| `COOKIE_SECURE` | backend | `false` |

---

## Estructura

```
frontend/
  app/
    (site)/                 # Header + Footer comunitarios
      marketplace/          # Catálogo y pieza maestra
      mapa/                 # Directorio geográfico
      negocio/[slug]/       # Ficha de productor (SSR vía API)
      mensajes/             # Mensajería directa
      carrito/              # Checkout comunitario
      panel/                # Panel del emprendedor
      productores/          # Directorio verificado
      como-funciona/        # Protocolo e impacto
    acceso/                 # Auth minimal (sin header comunitario)
  components/               # UI cliente (mapa, carrito, panel, chat, auth…)
  lib/
    server-api.ts           # fetch SSR con reenvío de cookies
    format.ts               # Moneda y fechas es-MX
    types.ts                # Tipos compartidos en el cliente
  public/img/               # Fotografía y mapas del proyecto Stitch

backend/
  src/
    server.js               # Express, CORS, montaje de rutas
    db.js                   # Esquema, seed y hashing
    queries.js              # Consultas SQLite
    session.js              # Cookies httpOnly de sesión y carrito
    seed-data.js            # Dataset comunitario
    routes/
      auth.js               # Registro, login, logout, me
      catalog.js            # Catálogo, productores, ficha
      cart.js               # Carrito CRUD
      orders.js             # Pedido transaccional
      messages.js           # Hilos, autorización, no leídos y respuestas
      languages.js          # Lenguas, traducción e intérpretes
      seller.js             # Panel: productos, pedidos, preguntas
    languages.js            # Catálogo de las 12 lenguas + investigación
    translation.js          # Proveedor automático opt-in + fallback humano
```

### Backend (Node.js)

- **SQLite** embebido con `node:sqlite` (sin binarios nativos).
- **Sesiones** con token aleatorio en cookie `httpOnly` (`oc_session`) y tabla `sessions`.
- **Invitados** con cookie `oc_guest`: pueden leer el hilo demo y al escribir abren su propia conversación.
- **Contraseñas** con `scrypt` + salt (`crypto`).
- **Carrito** persistente por cookie `oc_cart`; totales calculados en el servidor.
- **Pedidos** transaccionales: descuenta stock, crea `order_items`, abre/crea el hilo con cada productor mediante un mensaje de sistema y vacía el carrito.
- **Mensajería** con autorización por participante, paginación (`before`/`limit`), sondeo con `peek`, no leídos separados para comprador y productor, acuses de lectura, respuestas del productor y límite de 12 mensajes/minuto.
- **Panel** edita precio/stock/estado y publica productos; respuestas a preguntas.

### Lenguas originarias

`/lenguas` reúne las **12 lenguas reconocidas por la Constitución de Chiapas** (tseltal, tsotsil, ch'ol, zoque, tojolabal, mam, kakchikel, lacandón, mochó, jacalteco, chuj y kanjobal) con hablantes aproximados, territorios, estado de vitalidad y recursos.

Investigación aplicada al producto:

- Google Cloud Translation y Microsoft Translator **solo ofrecen maya yucateco**, no las lenguas de Chiapas.
- **NLLB-200** (Meta) no incluye tsotsil, tseltal, ch'ol, tojolabal ni zoque en sus 200 lenguas.
- Existe un modelo **experimental tsotsil→español** en Hugging Face con acceso restringido; se puede habilitar con `TRANSLATE_PROVIDER=hf` y `HF_TOKEN`.
- Por eso el flujo principal es **intérprete comunitario humano** (`interpreter_requests`), con folio, canal de contacto y enlaces a DITSEL, Glosbe, INALI, CELALI y Maya Bridge.
- La mensajería incluye un botón **Traducir** por mensaje; si no hay proveedor automático, explica la limitación y deriva a la solicitud de intérprete.

> La demo guarda las solicitudes de intérprete localmente; no las envía a una red real.

### Endpoints

```
GET    /api/health
GET    /api/catalog
GET    /api/products?category=&q=&sort=&page=
GET    /api/producers
GET    /api/producers/:slug
GET    /api/featured
GET    /api/cart
POST   /api/cart            { productId, qty, note }
PATCH  /api/cart            { lineId, qty?, note? }
DELETE /api/cart            { lineId } | { all: true }
POST   /api/orders          { name, phone, email, address, delivery, payment }
GET    /api/orders
GET    /api/messages        ?thread=ID&before=ID&limit=50&peek=1
POST   /api/messages        { threadId? | producerId, body, productId? }
PATCH  /api/messages/read   { threadId }
GET    /api/messages/unread
GET    /api/languages
POST   /api/languages/translate   { text, source, target, messageId? }
POST   /api/languages/interpreter { name, phone, language, message, channel? }
GET    /api/languages/translations/:messageId?lang=CODE
GET    /api/seller
POST   /api/seller          { name, price, stock, unit, description, category }
PATCH  /api/seller          { id, status?, price?, stock? }
PATCH  /api/seller/orders   { id, status }
PATCH  /api/seller/questions{ id, answer }
POST   /api/auth/register   { name, email, phone, password, role }
POST   /api/auth/login      { identifier, password }   # correo o WhatsApp
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
- Fotografía original del proyecto en `frontend/public/img`.
- El mapa usa el mismo SVG cartográfico del diseño, con pines, leyenda y capas funcionales.

## Notas

- Las cifras de analítica del panel (visitas/consultas) son de demostración; pedidos y ventas se calculan con datos reales.
- El envío se acuerda por WhatsApp/mensajería; el checkout registra método, costo y datos para que el productor confirme.
- Todos los textos están en español de Chiapas y respetan el tono del diseño original.
