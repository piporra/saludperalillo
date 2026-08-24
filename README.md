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

## ✅ Configurar "Recepción conforme" (Google Sheets)

El sitio incluye una sección para que los funcionarios confirmen que
leyeron y recibieron un documento (circular, protocolo, etc.). Las
confirmaciones se guardan automáticamente en una planilla de Google Sheets.

### Paso 1 — Crea la planilla y el script

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una planilla nueva.
   Ponle un nombre, por ejemplo "Recepción Conforme CESFAM".
2. En la primera fila, agrega estos encabezados (opcional pero recomendado):
   `Fecha | Nombre | RUT | Cargo | Documento`
3. En el menú ve a **Extensiones → Apps Script**.
4. Borra el código de ejemplo y pega esto:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.nombre,
    data.rut,
    data.cargo,
    data.documento
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

5. Guarda el proyecto (ícono de disquete, ponle un nombre).

### Paso 2 — Publica el script como Web App

1. Haz clic en **Deploy → New deployment**.
2. En "Select type", elige **Web app**.
3. En "Execute as": **Me**.
4. En "Who has access": **Anyone**.
5. Haz clic en **Deploy**. Google te pedirá autorizar permisos — acepta
   (es tu propia planilla, es seguro).
6. Copia la URL que te entrega, termina en `/exec`.

### Paso 3 — Conecta el sitio

1. En GitHub, abre `index.html` y haz clic en el ícono del lápiz (editar).
2. Busca esta línea (usa Ctrl+F del navegador):
   ```javascript
   const RECEPCION_SHEET_URL = "PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT";
   ```
3. Reemplaza el texto entre comillas por la URL que copiaste en el paso
   anterior.
4. Confirma con "Commit changes".

Listo — cada vez que un funcionario complete el formulario, aparecerá una
fila nueva en tu planilla de Google Sheets con fecha, nombre, RUT, cargo
y el documento confirmado.

### Para actualizar el documento a confirmar

1. Sube el nuevo PDF a la carpeta `assets/` (puedes llamarlo
   `documento-recepcion.pdf`, reemplazando el anterior, o darle un nombre
   distinto).
2. Si le pusiste un nombre distinto, edita en `index.html` el enlace:
   `href="assets/documento-recepcion.pdf"` con el nombre correcto.
3. Edita también el texto `<p id="rc-doc-title">` con el nombre/número del
   nuevo documento (por ejemplo: "Circular N° 14 — Protocolo de vacunación 2026").
4. Cada confirmación quedará asociada a ese nombre de documento en la planilla,
   así que si subes documentos distintos en el tiempo, podrás diferenciarlos
   en Google Sheets.

## 🧾 Certificado de Recepción Conforme (compras y licitaciones)

Además del formulario de "recepción conforme" de circulares, el sitio incluye
un **segundo formulario** (sección "Certificado de compras" en el menú) para
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
