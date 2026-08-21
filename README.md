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
├── index.html          # Página principal (todo el HTML/CSS/JS en un solo archivo)
├── assets/              # Imágenes del sitio
│   ├── logo-cesfam.jpeg      # Logo circular institucional
│   ├── slide-1.jpg … slide-8.jpg   # Fotografías del slider de actividades
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
