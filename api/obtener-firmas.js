// api/obtener-firmas.js
// Función serverless de Vercel. Dado el ID de una solicitud de permiso,
// devuelve las firmas (imágenes en base64) del funcionario que la pidió,
// y de quienes ya la aprobaron/registraron: jefe directo, director, y
// Jefa de Personal — solo las que ya correspondan según en qué etapa va.
// Solo el propio solicitante puede pedir las firmas de su solicitud.
//
// Las firmas viven en la tabla "firmas_funcionarios" (no en la metadata
// de cada usuario), para no inflar el token de sesión de nadie.

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

    // Averigua quién es el director y la Jefa de Personal (asume que hay
    // una sola cuenta con cada función, como en el resto del sitio).
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

    const rutDirector = solicitud.estado_director === "aprobado"
      ? (users.find((m) => m.es_director) || {}).rut
      : null;
    const rutJefePersonal = solicitud.archivado_personal
      ? (users.find((m) => m.es_jefe_personal) || {}).rut
      : null;

    const rutsNecesarios = [solicitud.rut_solicitante];
    if (solicitud.estado_jefe === "aprobado") rutsNecesarios.push(solicitud.rut_jefe);
    if (rutDirector) rutsNecesarios.push(rutDirector);
    if (rutJefePersonal) rutsNecesarios.push(rutJefePersonal);

    const rutsLimpios = rutsNecesarios.filter(Boolean).map(normalizarRut);
    const filtroIn = rutsLimpios.map((r) => `"${r}"`).join(",");

    const firmasRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/firmas_funcionarios?rut=in.(${filtroIn})&select=rut,firma_base64`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const firmasData = await firmasRes.json();
    const firmasPorRut = {};
    (firmasData || []).forEach((f) => { firmasPorRut[normalizarRut(f.rut)] = f.firma_base64; });

    const firmas = {
      funcionario: firmasPorRut[normalizarRut(solicitud.rut_solicitante)] || null,
      jefeDirecto: solicitud.estado_jefe === "aprobado" ? (firmasPorRut[normalizarRut(solicitud.rut_jefe)] || null) : null,
      director: rutDirector ? (firmasPorRut[normalizarRut(rutDirector)] || null) : null,
      jefePersonal: rutJefePersonal ? (firmasPorRut[normalizarRut(rutJefePersonal)] || null) : null
    };

    return res.status(200).json({ ok: true, firmas, solicitud });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener las firmas" });
  }
}
