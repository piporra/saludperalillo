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

## 🔐 Acceso de funcionarios (usuario y clave)

El "Certificado de compras" y "Solicitud de servicio" ahora requieren
iniciar sesión. Las cuentas (nombre de usuario + contraseña) se guardan en
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
3. Completa nombre, nombre de usuario y contraseña provisoria para cada
   funcionario, y haz clic en "Crear cuenta". Repite para cada uno (puedes
   dejar esta pestaña abierta e ir creando una tras otra).
4. Comparte con cada funcionario su usuario y contraseña por un medio
   seguro (no por este mismo sitio).

### Cómo inician sesión los funcionarios

Van a `login.html` (o hacen clic en "🔐 Abrir formulario de certificado" /
"🔐 Acceder al formulario" desde la página principal, que los redirige
automáticamente ahí si no tienen sesión), ingresan su usuario y
contraseña, y quedan con acceso hasta que cierren sesión.

> **Nota de seguridad:** este sistema usa Supabase Auth, el mismo motor
> de autenticación que usan miles de aplicaciones en producción — las
> contraseñas se guardan encriptadas (nunca en texto plano) y la clave
> `service_role` que puede crear usuarios solo vive en el servidor de
> Vercel, nunca en el navegador ni en GitHub.

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
