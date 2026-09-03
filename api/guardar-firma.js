// api/guardar-firma.js
// Función serverless de Vercel. Permite que CUALQUIER cuenta guarde o
// consulte su propia firma (una imagen en base64), verificando su
// identidad a través de su sesión. La firma se guarda en la tabla
// "firmas_funcionarios" (NO en la metadata del usuario), para no inflar
// el token de sesión — ver sql/06_tabla_firmas.sql para más detalle.
//
// GET  → devuelve la firma actual del usuario que consulta.
// POST → guarda/reemplaza la firma del usuario que consulta.

async function obtenerUsuarioDesdeToken(token) {
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  return res.json();
}

// Si esta cuenta todavía tiene una firma vieja guardada dentro de su
// metadata (de antes de esta corrección), la quita — eso es lo que
// infla el token de sesión y causa errores "494 Request Header Too Large".
async function limpiarFirmaDeMetadataSiExiste(usuario) {
  const meta = usuario.user_metadata || {};
  if (!meta.firma_base64) return;
  const { firma_base64, ...metadataSinFirma } = meta;
  await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${usuario.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ user_metadata: metadataSinFirma })
  }).catch(() => {});
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Sesión no válida" });
  }

  const usuario = await obtenerUsuarioDesdeToken(token);
  if (!usuario || !usuario.id) {
    return res.status(401).json({ error: "Sesión no válida" });
  }

  const meta = usuario.user_metadata || {};
  const rut = meta.rut;
  if (!rut) {
    return res.status(400).json({ error: "Tu cuenta no tiene RUT configurado" });
  }

  // Aprovecha cualquier llamada para limpiar metadata vieja, si corresponde.
  limpiarFirmaDeMetadataSiExiste(usuario);

  if (req.method === "GET") {
    try {
      const getRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/firmas_funcionarios?rut=eq.${encodeURIComponent(rut)}&select=firma_base64`,
        {
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const data = await getRes.json();
      const firma = (data && data[0] && data[0].firma_base64) || null;
      return res.status(200).json({ ok: true, firma });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno al obtener la firma" });
    }
  }

  if (req.method === "POST") {
    const { firmaBase64 } = req.body || {};
    if (!firmaBase64 || !firmaBase64.startsWith("data:image/")) {
      return res.status(400).json({ error: "La firma no es una imagen válida" });
    }
    if (firmaBase64.length > 400000) {
      return res.status(400).json({ error: "La imagen de la firma es demasiado grande. Usa una más simple o comprimida." });
    }

    try {
      const upsertRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/firmas_funcionarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify({ rut, firma_base64: firmaBase64, updated_at: new Date().toISOString() })
        }
      );

      if (!upsertRes.ok) {
        const errData = await upsertRes.json().catch(() => ({}));
        return res.status(upsertRes.status).json({ error: errData.message || "No se pudo guardar la firma" });
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error interno al guardar la firma" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
