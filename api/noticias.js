// api/noticias.js
// Función serverless de Vercel para el panel de administración: gestiona
// las noticias que se muestran en la sección "Actualidad" de la página
// principal (index.html). Se dejó en un archivo aparte (no combinado con
// api/admin.js) para mantener el código ordenado por tema — con esta
// función el proyecto queda en 9 funciones, todavía bajo el límite de 12
// del plan gratuito de Vercel (ver nota sobre esto en el README).
//
// Todas las peticiones son POST, con un campo "accion":
//   accion: "listar_todas" → { adminSecret }
//     Devuelve TODAS las noticias (publicadas y borradores), para el panel.
//   accion: "crear"        → { adminSecret, titulo, categoria, resumen, fecha, imagenUrl, publicado }
//   accion: "actualizar"   → { adminSecret, id, titulo, categoria, resumen, fecha, imagenUrl, publicado }
//   accion: "eliminar"     → { adminSecret, id }
//
// La página pública (index.html) NO pasa por esta función: lee las
// noticias directo desde Supabase con la clave pública (anon key), pero
// gracias a la política de seguridad (RLS) creada en
// sql/07_tabla_noticias.sql, solo puede ver las que tienen publicado = true.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body = req.body || {};
  const { adminSecret, accion } = body;

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  const headers = {
    "Content-Type": "application/json",
    "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  };

  try {
    // ===== Listar todas (incluye borradores, solo para el panel) =====
    if (accion === "listar_todas") {
      const listRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/noticias?select=*&order=fecha.desc,creado_en.desc`,
        { headers }
      );
      const data = await listRes.json();
      if (!listRes.ok) return res.status(listRes.status).json({ error: "No se pudo obtener la lista de noticias" });
      return res.status(200).json({ ok: true, noticias: data });
    }

    // ===== Crear noticia =====
    if (accion === "crear") {
      const { titulo, categoria, resumen, fecha, imagenUrl, publicado } = body;
      if (!titulo || !titulo.trim() || !resumen || !resumen.trim() || !fecha) {
        return res.status(400).json({ error: "Faltan datos (título, resumen o fecha)" });
      }

      const createRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/noticias`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          categoria: (categoria || "Actualidad").trim(),
          resumen: resumen.trim(),
          fecha,
          imagen_url: imagenUrl && imagenUrl.trim() ? imagenUrl.trim() : null,
          publicado: publicado !== false
        })
      });
      const data = await createRes.json();
      if (!createRes.ok) return res.status(createRes.status).json({ error: "No se pudo crear la noticia" });
      return res.status(200).json({ ok: true, noticia: data[0] });
    }

    // ===== Actualizar noticia =====
    if (accion === "actualizar") {
      const { id, titulo, categoria, resumen, fecha, imagenUrl, publicado } = body;
      if (!id) return res.status(400).json({ error: "Falta el id de la noticia" });
      if (!titulo || !titulo.trim() || !resumen || !resumen.trim() || !fecha) {
        return res.status(400).json({ error: "Faltan datos (título, resumen o fecha)" });
      }

      const updateRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/noticias?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          categoria: (categoria || "Actualidad").trim(),
          resumen: resumen.trim(),
          fecha,
          imagen_url: imagenUrl && imagenUrl.trim() ? imagenUrl.trim() : null,
          publicado: publicado !== false,
          actualizado_en: new Date().toISOString()
        })
      });
      const data = await updateRes.json();
      if (!updateRes.ok) return res.status(updateRes.status).json({ error: "No se pudo actualizar la noticia" });
      if (!data.length) return res.status(404).json({ error: "No existe una noticia con ese id" });
      return res.status(200).json({ ok: true, noticia: data[0] });
    }

    // ===== Eliminar noticia =====
    if (accion === "eliminar") {
      const { id } = body;
      if (!id) return res.status(400).json({ error: "Falta el id de la noticia" });

      const delRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/noticias?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers
      });
      if (!delRes.ok) return res.status(delRes.status).json({ error: "No se pudo eliminar la noticia" });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Acción no reconocida: " + accion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
