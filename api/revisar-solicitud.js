// api/revisar-solicitud.js
// Función serverless de Vercel. Aprueba o rechaza una solicitud de permiso,
// ya sea en el paso del jefe directo o en el del director, verificando que
// quien la revisa sea realmente la persona correspondiente (o el director).

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

function normalizarRut(rut) {
  return (rut || "").toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

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
  const { solicitudId, decision, comentario } = req.body || {};

  if (!solicitudId || !["aprobado", "rechazado"].includes(decision)) {
    return res.status(400).json({ error: "Faltan datos o decisión inválida" });
  }

  try {
    // 1. Buscar la solicitud
    const getRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/solicitudes_permiso?id=eq.${solicitudId}`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const registros = await getRes.json();
    const solicitud = registros && registros[0];
    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    let cambios = {};

    if (solicitud.estado === "pendiente_jefe") {
      // Debe ser el jefe directo correspondiente
      if (normalizarRut(meta.rut) !== normalizarRut(solicitud.rut_jefe)) {
        return res.status(403).json({ error: "No tienes permiso para revisar esta solicitud" });
      }
      cambios = {
        estado_jefe: decision,
        comentario_jefe: comentario || null,
        fecha_revision_jefe: new Date().toISOString(),
        estado: decision === "aprobado" ? "pendiente_director" : "rechazado"
      };
    } else if (solicitud.estado === "pendiente_director") {
      // Debe tener la función de Director
      if (!meta.es_director) {
        return res.status(403).json({ error: "No tienes permiso para revisar esta solicitud" });
      }
      cambios = {
        estado_director: decision,
        comentario_director: comentario || null,
        fecha_revision_director: new Date().toISOString(),
        estado: decision === "aprobado" ? "pendiente_personal" : "rechazado"
      };
    } else if (solicitud.estado === "pendiente_personal") {
      // Debe tener la función de Jefe de Personal
      if (!meta.es_jefe_personal) {
        return res.status(403).json({ error: "No tienes permiso para revisar esta solicitud" });
      }
      cambios = {
        estado_personal: decision,
        comentario_personal: comentario || null,
        fecha_revision_personal: new Date().toISOString(),
        estado: decision === "aprobado" ? "aprobado" : "rechazado"
      };
    } else {
      return res.status(400).json({ error: "Esta solicitud ya no está pendiente de revisión" });
    }

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/solicitudes_permiso?id=eq.${solicitudId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify(cambios)
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      return res.status(updateRes.status).json({ error: errData.message || "No se pudo actualizar la solicitud" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al revisar la solicitud" });
  }
}
