// api/revisar-solicitud.js
// Función serverless de Vercel. Maneja dos cosas distintas sobre una
// solicitud de permiso:
//
// 1. APROBAR/RECHAZAR — lo hacen el jefe directo y, después, el director.
//    En cuanto el director aprueba, la solicitud queda con estado
//    "aprobado" (ya es definitivo).
// 2. ARCHIVAR — lo hace la Jefa de Personal. Ella NO aprueba ni rechaza:
//    solo recibe la solicitud YA aprobada, la registra con su firma y la
//    archiva. Esto no cambia el estado de aprobación, solo marca que ya
//    quedó archivada.
//
// CASO ESPECIAL: si quien SOLICITA el permiso es el propio Director, nadie
// más puede darle la aprobación de "director" (sería aprobarse a sí
// mismo). En ese caso, la aprobación de su jefe directo (normalmente la
// Jefa de Departamento) ya deja la solicitud "aprobado" directamente.

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

async function solicitanteEsDirector(rutSolicitante) {
  const listRes = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!listRes.ok) return false;
  const data = await listRes.json();
  const users = data.users || [];
  const user = users.find(
    (u) => u.user_metadata && normalizarRut(u.user_metadata.rut) === normalizarRut(rutSolicitante)
  );
  return !!(user && user.user_metadata && user.user_metadata.es_director);
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

  if (!solicitudId || !["aprobado", "rechazado", "archivado"].includes(decision)) {
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

    if (decision === "archivado") {
      // ===== Jefa de Personal: solo registra y archiva, no aprueba/rechaza =====
      if (!meta.es_jefe_personal) {
        return res.status(403).json({ error: "No tienes permiso para archivar esta solicitud" });
      }
      if (solicitud.estado !== "aprobado") {
        return res.status(400).json({ error: "Solo se pueden archivar solicitudes ya aprobadas" });
      }
      if (solicitud.archivado_personal) {
        return res.status(400).json({ error: "Esta solicitud ya estaba archivada" });
      }
      cambios = {
        archivado_personal: true,
        fecha_archivo_personal: new Date().toISOString(),
        comentario_personal: comentario || null
      };
    } else if (solicitud.estado === "pendiente_jefe") {
      // Debe ser el jefe directo correspondiente
      if (normalizarRut(meta.rut) !== normalizarRut(solicitud.rut_jefe)) {
        return res.status(403).json({ error: "No tienes permiso para revisar esta solicitud" });
      }

      let siguienteEstado = "pendiente_director";
      if (decision === "aprobado") {
        const esDirector = await solicitanteEsDirector(solicitud.rut_solicitante);
        if (esDirector) {
          // Caso especial: el solicitante es el propio Director → esta
          // aprobación ya es la definitiva, no pasa por "director".
          siguienteEstado = "aprobado";
        }
      } else {
        siguienteEstado = "rechazado";
      }

      cambios = {
        estado_jefe: decision,
        comentario_jefe: comentario || null,
        fecha_revision_jefe: new Date().toISOString(),
        estado: siguienteEstado
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
        // Al aprobar el director, la solicitud queda definitivamente
        // aprobada — la Jefa de Personal después solo la archiva.
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
