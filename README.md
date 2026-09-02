# CESFAM Peralillo — Sitio web institucional

Borrador de sitio web para el Centro de Salud Familiar (CESFAM) de Peralillo,
Región de O'Higgins, Chile. Diseño estructural inspirado en clinicaboza.cl,
con paleta clínica (blanco / celeste / azul) y foco en accesibilidad.

## 🌐 Ver el sitio en vivo

Si activas GitHub Pages en este repositorio (ver más abajo), el sitio quedará
disponible en:

```
https://<tu-usuario>.github.io/<nombre-del-repositorio>/
```

## 📁 Estructura del proyecto

```
cesfam-peralillo-web/
├── index.html                     # Página principal
├── certificado-compras.html       # Formulario del certificado (se abre en pestaña nueva)
├── assets/                         # Imágenes y plantillas
│   ├── logo-cesfam.jpeg                  # Logo circular institucional
│   ├── slide-1.jpg … slide-8.jpg          # Fotografías del slider de actividades
│   └── plantilla-recepcion-conforme.xlsx  # Plantilla original en blanco
└── README.md
```

## 🚀 Cómo publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `cesfam-peralillo-web`).
2. Sube todos los archivos de esta carpeta manteniendo la estructura
   (`index.html` y la carpeta `assets/` en la raíz del repositorio).
3. Entra a **Settings → Pages** en tu repositorio.
4. En "Source", selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
5. Guarda. GitHub te dará la URL pública en un par de minutos.

### Subir por línea de comandos

```bash
cd cesfam-peralillo-web
git init
git add .
git commit -m "Primera versión del sitio CESFAM Peralillo"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/cesfam-peralillo-web.git
git push -u origin main
```

### Subir por la web de GitHub (sin línea de comandos)

1. Crea el repositorio vacío en GitHub.
2. Botón **"Add file" → "Upload files"**.
3. Arrastra `index.html`, el `README.md` y la carpeta `assets` completa.
4. Confirma el commit.

## ✅ "Solicitud de servicio" (Google Form embebido)

El sitio incluye una sección para que los funcionarios soliciten
requerimientos (insumos, electricidad, gasfitería, informática, etc.).

**Cómo está resuelto:** en vez de un formulario personalizado conectado
por script (Apps Script), esta sección embebe directamente tu **Google
Form oficial** dentro del sitio. El funcionario completa el formulario
sin salir de la página, y Google guarda la respuesta automáticamente en
tu planilla existente ("Solicitud de servicio (respuestas)"), exactamente
como ya funciona hoy.

> **Por qué se optó por esta opción:** el enfoque de Apps Script requiere
> autorización de OAuth, y en cuentas institucionales de Google Workspace
> (como `@muniperalillo.cl`) esa autorización suele estar bloqueada por el
> administrador del dominio ("Error 400: access_not_configured"). Embeber
> el Google Form directamente evita ese problema por completo, ya que no
> depende de ningún script ni permiso especial.

### Si en el futuro cambias de formulario

1. Abre tu nuevo Google Form → botón **Enviar** → pestaña del ícono `<>`
   (insertar/embeber) → copia la URL que aparece en el campo `src="..."`.
2. En GitHub, abre `index.html` (ícono del lápiz) y busca (Ctrl+F):
   ```
   <iframe src="https://docs.google.com/forms/d/1SHAFwkq8BKaP87JI3NQsfM-KwHN5kYInncYeQQ7YKS0/viewform?embedded=true"
   ```
3. Reemplaza esa URL por la de tu nuevo formulario (mantén `?embedded=true`
   al final).
4. Busca también el enlace de respaldo un poco más abajo
   (`target="_blank"`) y actualízalo con la misma URL, pero sin
   `?embedded=true`.
5. Confirma con "Commit changes".

## 🧾 Certificado de Recepción Conforme (compras y licitaciones)

El sitio incluye además otro formulario, aparte ("Certificado de compras"
en el menú), para
que los funcionarios certifiquen la recepción de compras, licitaciones o
prestaciones de servicio — replicando el formato del certificado oficial de
la Municipalidad de Peralillo.

**Cómo funciona:**
1. En la página principal, la sección "Certificado de compras" muestra un
   botón "Abrir formulario de certificado" que abre `certificado-compras.html`
   en una **pestaña nueva**.
2. El funcionario completa los datos: servicio, orden de compra, proveedor,
   factura, tipo de recepción, evaluación técnica, tecnovigilancia, etc.
3. Al hacer clic en "Generar y descargar certificado en Excel", la página
   genera automáticamente (usando la librería SheetJS, 100% en el navegador,
   sin backend) un archivo `.xlsx` con el mismo formato del certificado
   original, ya completado con los datos ingresados.
4. El archivo se descarga directo al computador del funcionario, listo para
   imprimir, firmar de forma manuscrita y obtener el Vº Bº del Director del
   CESFAM.

**No requiere configuración adicional** — a diferencia del formulario de
circulares, este no depende de Google Sheets ni de ninguna URL externa, así
que funciona apenas subas los archivos a GitHub.

**Limitación conocida:** el Excel generado replica el texto, la estructura
y las celdas combinadas del certificado original, pero no incluye el logo
institucional ni los estilos visuales (bordes, colores) del documento
original, ya que la generación se hace desde cero en el navegador. Si
necesitas el archivo con el diseño visual exacto, puedes usar el botón
"Descargar plantilla en blanco" (que sí es el archivo original) y traspasar
los datos manualmente, o pedirme que integre un método más avanzado de
edición de plantilla.

## 🔐 Acceso de funcionarios (RUT y clave)

El "Certificado de compras" y "Solicitud de servicio" ahora requieren
iniciar sesión. Las cuentas (RUT + contraseña) se guardan en
una base de datos real y segura (**Supabase**), con las contraseñas
encriptadas — nunca en texto plano ni visibles en el código del sitio.

**Piezas nuevas:**
- `login.html` — pantalla de inicio de sesión para funcionarios.
- `admin-funcionarios.html` — panel para que tú (administrador) crees
  cuentas nuevas.
- `api/crear-funcionario.js` — función de servidor (Vercel) que crea las
  cuentas de forma segura, sin exponer ninguna clave secreta al navegador.
- `assets/supabase-config.js` — configuración pública de Supabase.
- `assets/auth-guard.js` — protege `certificado-compras.html` y
  `solicitud-servicio.html`, redirigiendo a `login.html` si no hay sesión.

### Paso 1 — Crea tu proyecto de Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) → "Start your project" →
   crea una cuenta (puedes usar tu correo de Google).
2. Crea un nuevo proyecto. Ponle un nombre, por ejemplo
   "cesfam-peralillo", elige una contraseña de base de datos (guárdala,
   no la necesitarás para esto pero es buena práctica) y la región más
   cercana (São Paulo, por ejemplo).
3. Espera 1-2 minutos mientras Supabase crea el proyecto.
4. Ve a **Settings → API**. Ahí verás dos datos que necesitas:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una clave larga, empieza distinto a la
     "service_role")
   - **service_role key** (otra clave larga — **esta es secreta**, nunca
     la pegues en archivos del sitio)

### Paso 2 — Conecta la clave pública al sitio

1. En GitHub, abre `assets/supabase-config.js` (ícono del lápiz).
2. Reemplaza:
   ```javascript
   const SUPABASE_URL = "PEGA_AQUI_TU_SUPABASE_URL";
   const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_SUPABASE_ANON_KEY";
   ```
   con tu **Project URL** y tu **anon public key** del paso anterior.
3. Confirma con "Commit changes".

### Paso 3 — Configura las variables secretas en Vercel

1. Entra a tu proyecto en [vercel.com](https://vercel.com) →
   **Settings → Environment Variables**.
2. Agrega estas tres variables:

   | Nombre | Valor |
   |---|---|
   | `SUPABASE_URL` | Tu Project URL de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Tu service_role key de Supabase (la secreta) |
   | `ADMIN_SECRET` | Una clave que tú inventes, solo para ti (ej: una frase larga) |

3. Guarda. Si Vercel te pide re-desplegar (redeploy) para que tomen efecto
   las variables nuevas, hazlo (botón "Redeploy" en la pestaña
   "Deployments").

### Paso 4 — Crea las cuentas de los funcionarios

1. Ve a `tusitio.vercel.app/admin-funcionarios.html`.
2. Ingresa la clave `ADMIN_SECRET` que definiste en el paso 3.
3. Completa nombre, RUT y contraseña provisoria para cada
   funcionario, y haz clic en "Crear cuenta". Repite para cada uno (puedes
   dejar esta pestaña abierta e ir creando una tras otra).
4. Comparte con cada funcionario su RUT (como usuario) y contraseña por un medio
   seguro (no por este mismo sitio).

### Cómo inician sesión los funcionarios

Van a `login.html` (o hacen clic en "🔐 Abrir formulario de certificado" /
"🔐 Acceder al formulario" desde la página principal, que los redirige
automáticamente ahí si no tienen sesión), ingresan su RUT y
contraseña, y quedan con acceso hasta que cierren sesión.

> **Nota de seguridad:** este sistema usa Supabase Auth, el mismo motor
> de autenticación que usan miles de aplicaciones en producción — las
> contraseñas se guardan encriptadas (nunca en texto plano) y la clave
> `service_role` que puede crear usuarios solo vive en el servidor de
> Vercel, nunca en el navegador ni en GitHub.

## 🗓️ Días administrativos (calculado automáticamente)

El portal de funcionarios (`dashboard.html`) muestra a cada funcionario
cuántos de sus 6 días administrativos anuales lleva usados este año —
**calculado automáticamente**, sumando solo sus solicitudes de permiso
ya **aprobadas** en el flujo de aprobación (día completo = 1, medio
día = 0,5). Ya no depende de ninguna hoja de Google Sheets ni de
actualizar nada a mano: apenas una solicitud queda aprobada por completo
(jefe directo → director → Jefe de Personal), el conteo se actualiza
solo, tanto en el portal del funcionario como en "Historial de permisos"
(para Director y Jefe de Personal).

> **Nota:** si en algún momento usaste el sistema anterior con hojas de
> Google Sheets individuales por funcionario (con el campo `hoja_dias_url`
> en su cuenta), ese campo ya no se usa ni se muestra en el sitio — no es
> necesario borrarlo, simplemente queda sin efecto.

## 🗓️ Calendario de reuniones

El portal incluye una tercera sección, "Calendario de reuniones"
(`reuniones.html`), que muestra en una tabla —con buscador por comité—
las fechas de reuniones de todos los equipos y comités del año, leídas
en vivo desde tu planilla de Google Sheets ("REUNIONES 2026" → pestaña
"calendario 2026").

### Cómo conectarlo

1. Abre tu planilla "REUNIONES 2026" en Google Sheets.
2. Ve a **Archivo → Compartir → Publicar en la Web**.
3. En el primer desplegable, elige la pestaña **"calendario 2026"**
   (no "Todo el documento").
4. En el segundo desplegable, elige **"Valores separados por comas (.csv)"**.
5. Publica y copia el link (termina en `output=csv`).
6. En GitHub, abre `reuniones.html` → busca (Ctrl+F):
   ```javascript
   const REUNIONES_CSV_URL = "PEGA_AQUI_TU_URL_CSV_PUBLICADA";
   ```
7. Reemplaza el texto entre comillas por ese link → "Commit changes".

Listo — cada vez que edites la planilla (agregar una fecha, cambiar un
comité), el calendario del sitio se actualiza solo, sin tocar código.

> **Nota:** por ahora se conecta solo la pestaña "calendario 2026" (el
> calendario general). La pestaña "integrantes 2026" y "calendario
> capacitaciones" no están conectadas — si más adelante quieres que cada
> funcionario vea solo las reuniones de sus propios comités (usando la
> hoja de integrantes), o agregar el calendario de capacitaciones, avísame.

## 📄 Protocolos (PDF alojados directo en GitHub, organizados por categoría)

El portal incluye una cuarta sección, "Protocolos" (`protocolos.html`),
que agrupa los protocolos igual que tus carpetas de Drive (Ámbito
Gestión Clínica, Ámbito Dignidad Paciente, etc.) — cada categoría es un
desplegable, con buscador. Los PDF se suben directo al repositorio de
GitHub (no dependen de Drive ni de Google Sheets).

### Estructura de carpetas

Ya te dejé creada la carpeta `assets/protocolos/` con una subcarpeta por
cada una de tus 12 categorías:

```
assets/protocolos/
├── ambito-acceso-oportunidad-y-continuidad/
├── ambito-competencias-recurso-humano/
├── ambito-dignidad-paciente/
├── ambito-gestion-clinica/
├── ambito-gestion-de-la-calidad/
├── ambito-registros/
├── ambito-seguridad-de-las-instalaciones/
├── ambito-seguridad-del-equipamiento/
├── apoyo/
├── indicadores-por-unidades/
├── plan-institucional-de-emergencia/
└── protocolo-trato-usuario-institucional/
```

### Cómo agregar tus protocolos reales

1. **Sube cada PDF** a su carpeta correspondiente en GitHub: entra a
   `assets/protocolos/<carpeta-de-la-categoría>/` → "Add file" →
   "Upload files" → arrastra los PDF de esa categoría → "Commit changes".
   Repite para cada categoría.

2. **Edita la lista** `assets/protocolos-lista.json` (ícono del lápiz) —
   ahí defines qué PDF aparece, con qué nombre, en qué categoría y en qué
   subcarpeta (si tiene). Por cada PDF que subiste, agrega un bloque como
   este (respetando las comas entre bloques):
   ```json
   { "categoria": "Ámbito Gestión Clínica", "subcarpeta": "Vacunación", "nombre": "Protocolo de Vacunación", "archivo": "assets/protocolos/ambito-gestion-clinica/vacunacion/protocolo-vacunacion.pdf" }
   ```
   Si el PDF está directo en la carpeta de la categoría, **sin**
   subcarpeta, deja `"subcarpeta": ""` (vacío):
   ```json
   { "categoria": "Apoyo", "subcarpeta": "", "nombre": "Protocolo General", "archivo": "assets/protocolos/apoyo/protocolo-general.pdf" }
   ```
   El campo `"archivo"` debe ser **exactamente** la ruta y el nombre del
   PDF que subiste (respeta mayúsculas/minúsculas, espacios y tildes).
   En el sitio, cada categoría se abre primero, y adentro cada subcarpeta
   es un segundo desplegable (categoría → subcarpeta → PDF), igual que en
   Drive.
3. Borra las líneas de ejemplo ("Nombre del protocolo") de las
   categorías donde no vayas a subir nada todavía, o complétalas.
4. Confirma con "Commit changes".

Listo — para agregar un protocolo nuevo en el futuro: subes el PDF a la
carpeta de su categoría, y agregas una línea a
`assets/protocolos-lista.json`. Si quieres una categoría nueva que no
está en la lista, crea la carpeta correspondiente y usa el nombre que
quieras en `"categoria"` — el sitio la agrupa automáticamente.

## 🔐📱 Verificación en dos pasos (Google Authenticator)

Es **obligatoria** para todos los funcionarios: la primera vez que alguien
inicia sesión con su RUT y contraseña, el sitio lo manda a activar Google
Authenticator (con un código QR) antes de dejarlo entrar. Después de eso,
cada inicio de sesión pide el código de 6 dígitos además de la contraseña.

### Paso 1 — Actívalo en el panel de Supabase (una sola vez)

1. Entra a tu proyecto en [supabase.com](https://supabase.com) →
   **Authentication → Providers** (o "Auth Settings", según la versión).
2. Busca la sección de **Multi-Factor Authentication (MFA)** y activa la
   opción de **TOTP** (verificación por app de autenticación).
3. Asegúrate de que "Enrollment" y "Verification" no estén deshabilitados.

Sin este paso, el código de las páginas (`login.html`, `mfa-setup.html`)
va a fallar al intentar generar el código QR.

### Cómo funciona para el funcionario

1. Inicia sesión con su RUT y contraseña, como siempre.
2. Si es la primera vez, lo manda a `mfa-setup.html`: escanea un código QR
   con la app **Google Authenticator** (o cualquier app compatible, como
   Microsoft Authenticator o Authy) e ingresa el código de 6 dígitos que
   le muestra para confirmar.
3. De ahí en adelante, cada vez que inicie sesión, después de la
   contraseña se le pedirá el código de 6 dígitos de la app.

### Si alguien pierde el celular o no puede acceder

Desde `admin-funcionarios.html` → tarjeta **"🔐 Restablecer verificación
en dos pasos"** → ingresas su RUT → se elimina su activación anterior. La
próxima vez que inicie sesión, se le pedirá activar Google Authenticator
de nuevo desde cero (con un código QR nuevo).

## 🎂 Cumpleaños de hoy + Calendario

Arriba en el portal aparecen dos tarjetas lado a lado: a la izquierda,
quién cumple años ese día (si corresponde); a la derecha, un calendario
del mes actual con el día de hoy resaltado (este no necesita
configuración, se dibuja solo).

### Cómo conectar los cumpleaños

1. Crea una planilla (Excel o Google Sheets) con dos columnas:
   ```
   Nombre | Fecha de cumpleaños
   ```
   La fecha puede ser `15/03`, `15/03/1990` o `15-03-1990` — cualquiera
   de esos formatos funciona igual (el sitio solo lee el día y el mes,
   ignora el año).
2. Si la hiciste en Excel, súbela a Google Drive y ábrela con Google
   Sheets (clic derecho → Abrir con → Google Sheets).
3. Publícala como CSV: **Archivo → Compartir → Publicar en la Web** →
   elige la hoja → formato **"Valores separados por comas (.csv)"** →
   Publicar → copia el link (termina en `output=csv`).
4. En GitHub, abre `dashboard.html` → busca (Ctrl+F):
   ```javascript
   const CUMPLEANOS_CSV_URL = "PEGA_AQUI_TU_URL_CSV_PUBLICADA";
   ```
5. Reemplaza el texto entre comillas por ese link → "Commit changes".

Listo — cada mañana, si alguien cumple años ese día, aparece
automáticamente arriba del portal para todos los funcionarios.

## ✅ Flujo de aprobación de permisos administrativos

Los funcionarios pueden solicitar un permiso administrativo desde el
portal (`solicitud-permiso.html`). La solicitud pasa automáticamente por
**tres etapas**: primero su **jefe directo** la aprueba o rechaza, luego
el **director** da su aprobación, y por último la **Jefa de Personal**
la recibe y registra como paso final (con las 3 firmas ya completas:
funcionario, jefe directo y director). Todo esto se revisa en
`aprobaciones.html`, y el resultado se ve en todo momento en el portal
del funcionario que la solicitó.

> **Importante:** este flujo maneja el *proceso de aprobación* (quién
> pidió, quién revisó, en qué estado va) — no actualiza automáticamente
> el número de "días disponibles" de la hoja individual de cada persona.
> Ese número lo sigues actualizando tú a mano, como hasta ahora, una vez
> que la solicitud quede aprobada.

### Paso 1 — Crea o actualiza la tabla en Supabase

- **Si es la primera vez** que configuras esto: ejecuta el contenido de
  `sql/01_solicitudes_permiso.sql` en Supabase → SQL Editor → Run (ya
  incluye la etapa de Jefa de Personal).
- **Si ya habías ejecutado el script 01 antes** (antes de agregar esta
  etapa): en vez de repetirlo, ejecuta `sql/02_agregar_jefe_personal.sql`
  — agrega solo las columnas que faltan, sin duplicar nada.

### Paso 2 — Sube los archivos nuevos y actualizados a GitHub

**Nuevos** (van en la raíz del repositorio):
- `solicitud-permiso.html`
- `aprobaciones.html`

**Nuevos** (van dentro de la carpeta `api/`):
- `crear-solicitud-permiso.js`
- `listar-solicitudes.js`
- `revisar-solicitud.js`
- `actualizar-rol.js`

**Reemplazar** (mismo nombre, misma ubicación):
- `dashboard.html`
- `admin-funcionarios.html`
- `api/crear-funcionario.js`

### Paso 3 — Define las funciones y el jefe directo de cada funcionario

Cada cuenta necesita saber **quién es su jefe directo** (para enrutar sus
solicitudes) y **qué funciones adicionales tiene**. A diferencia de un
"rol" único, esto son **3 casillas independientes** — una persona puede
tener una, varias, o ninguna:
- ☐ Jefe directo
- ☐ Director
- ☐ Jefe de Personal

- **Al crear una cuenta nueva:** ya aparecen las 3 casillas en el
  formulario de `admin-funcionarios.html` — marcas las que correspondan.
  El **Jefe directo** y el **Subrogante** (opcional) ya no se escriben a
  mano: son dos listas desplegables que se llenan automáticamente con los
  funcionarios que tengan marcada la casilla "Jefe directo". Si aún no
  has creado/marcado a ningún jefe directo, esas listas van a aparecer
  vacías — crea primero esas cuentas con esa casilla activada.
- **Para cuentas que ya existen:** usa la tarjeta
  **"🧭 Actualizar funciones y jefe directo"** en el mismo panel (mismas
  listas desplegables).

> Al Director y al Jefe de Personal no les hace falta asignarles un
> "jefe directo" (puedes dejar ese campo en blanco en sus cuentas) — las
> solicitudes les llegan automáticamente en su etapa correspondiente, sin
> necesidad de configurar nada más para ellos. Solo debe existir **una**
> cuenta marcada como Director y **una** marcada como Jefe de Personal.

### Cómo se ve para cada persona

- **Cualquier funcionario:** ve la tarjeta "Solicitar permiso
  administrativo" en su portal — ahí pide su permiso y ve el estado de
  todas sus solicitudes (esperando jefe directo / esperando director /
  registrando con Jefa de Personal / aprobado / rechazado).
- **Jefes directos, director y Jefa de Personal:** ven además una
  tarjeta **"Aprobaciones pendientes"** (los demás funcionarios no la
  ven), cada uno con su propia bandeja: al jefe directo le llegan las
  solicitudes nuevas, al director las que ya aprobó el jefe directo, y a
  la Jefa de Personal las que ya aprobaron ambos — con los comentarios
  de las etapas anteriores visibles para tener el contexto completo.

## 📊 Historial de permisos y conteo de días

Además de "Aprobaciones pendientes", hay una nueva sección
**"Historial de permisos"** (`historial-permisos.html`), visible solo
para cuentas marcadas como **Director** o **Jefe de Personal**. Muestra,
por cada funcionario que haya hecho al menos una solicitud:

- Una barra con **cuántos de sus 6 días administrativos lleva usados**
  este año (se calcula automáticamente sumando solo las solicitudes ya
  **aprobadas**: día completo = 1, medio día = 0,5 — las pendientes o
  rechazadas no se cuentan).
- Su **historial completo** al desplegar su tarjeta: cada solicitud con
  fecha, tipo, motivo y estado.
- Un buscador para encontrar rápido a un funcionario por nombre.

No requiere ninguna configuración adicional — se calcula en vivo desde
la misma tabla `solicitudes_permiso` de Supabase que ya creaste para el
flujo de aprobaciones.

**Archivos para subir a GitHub:**
- `historial-permisos.html` (nuevo, va en la raíz)
- `api/historial-permisos.js` (nuevo, va dentro de `api/`)
- `dashboard.html` (reemplazar — ahora incluye la tarjeta condicional)

## ⚠️ Pendiente antes de publicar oficialmente

Este es un **borrador de diseño**. Antes de lanzarlo como sitio oficial del
CESFAM, se recomienda verificar y reemplazar:

- [ ] Teléfonos y correo de contacto (actualmente placeholder).
- [ ] Coordenadas exactas de las postas rurales en los mapas embebidos.
- [ ] Backend real para el formulario de contacto (actualmente es solo visual).
- [ ] Enlaces de redes sociales (Facebook / Instagram) — actualmente apuntan a "#".
- [ ] Sección de noticias: reemplazar/complementar con comunicados oficiales
      actualizados del propio CESFAM y la Municipalidad de Peralillo.
- [ ] Horarios de atención definitivos.
- [ ] Revisar derechos de imagen del personal/usuarios que aparecen en las
      fotografías del slider antes de publicar el sitio de forma pública.

## 🎨 Notas de diseño

- **Tipografías:** Poppins (títulos) + Atkinson Hyperlegible (cuerpo de texto,
  diseñada para máxima legibilidad — pensada para adultos mayores).
- **Paleta:** azul marino `#0A3D73`, azul medio `#1B7FC2`, celeste claro
  `#E7F2FB`, cian de acento `#12A6D6`, blanco.
- **Accesibilidad:** control de tamaño de letra (A / A+ / A++) en la barra
  superior, enlace "saltar al contenido", navegación por teclado en el menú.
- No depende de ningún framework: es HTML + CSS + JavaScript plano, no
  requiere build ni instalación de dependencias.

## 📄 Licencia / uso

Sitio de uso interno para el CESFAM Peralillo. Ajusta esta sección según
corresponda antes de hacer el repositorio público.
