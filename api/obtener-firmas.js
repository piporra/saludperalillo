// api/obtener-firmas.js
// Función serverless de Vercel. Dado el ID de una solicitud de permiso,
// devuelve las firmas (imágenes en base64) del funcionario que la pidió,
// y de quienes ya la aprobaron/registraron: jefe directo, director, y
// Jefa de Personal — solo las que ya correspondan según en qué etapa va.
// Solo el propio solicitante puede pedir las firmas de su solicitud.

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
  if (req.method !== "GET") {
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
  const solicitudId = req.query.solicitudId;
  if (!solicitudId) {
    return res.status(400).json({ error: "Falta el identificador de la solicitud" });
  }

  try {
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
      return res.status(403).json({ error: "No puedes ver las firmas de una solicitud que no es tuya" });
    }

    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const listData = await listRes.json();
    const users = (listData.users || []).map((u) => u.user_metadata || {});

    function firmaDe(rut) {
      const u = users.find((m) => normalizarRut(m.rut) === normalizarRut(rut));
      return (u && u.firma_base64) || null;
    }
    function firmaDePrimerCon(campoRol) {
      const u = users.find((m) => m[campoRol]);
      return (u && u.firma_base64) || null;
    }

    const firmas = {
      funcionario: firmaDe(solicitud.rut_solicitante),
      jefeDirecto: solicitud.estado_jefe === "aprobado" ? firmaDe(solicitud.rut_jefe) : null,
      director: solicitud.estado_director === "aprobado" ? firmaDePrimerCon("es_director") : null,
      jefePersonal: solicitud.archivado_personal ? firmaDePrimerCon("es_jefe_personal") : null
    };

    return res.status(200).json({ ok: true, firmas, solicitud });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener las firmas" });
  }
}
