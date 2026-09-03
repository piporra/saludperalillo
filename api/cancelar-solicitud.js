// api/cancelar-solicitud.js
// Función serverless de Vercel. Permite que el propio funcionario cancele
// (devuelva) una solicitud de permiso administrativo — tanto si ya estaba
// aprobada (por ejemplo, porque finalmente no se va a tomar el día) como
// si aún estaba pendiente de revisión. Verifica que quien cancela sea
// realmente el dueño de la solicitud, a través de su sesión.

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
  const { solicitudId } = req.body || {};

  if (!solicitudId) {
    return res.status(400).json({ error: "Falta el identificador de la solicitud" });
  }

  try {
    // 1. Buscar la solicitud y confirmar que le pertenece a quien la cancela
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

    if (normalizarRut(meta.rut) !== normalizarRut(solicitud.rut_solicitante)) {
      return res.status(403).json({ error: "No puedes cancelar una solicitud que no es tuya" });
    }

    if (solicitud.estado === "cancelado" || solicitud.estado === "rechazado") {
      return res.status(400).json({ error: "Esta solicitud ya no se puede cancelar" });
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
        body: JSON.stringify({
          estado: "cancelado",
          estado_previo_cancelacion: solicitud.estado,
          fecha_cancelacion: new Date().toISOString()
        })
      }
    );

    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      return res.status(updateRes.status).json({ error: errData.message || "No se pudo cancelar la solicitud" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al cancelar la solicitud" });
  }
}
