// api/historial-permisos.js
// Función serverless de Vercel. Devuelve TODAS las solicitudes de permiso
// (de cualquier funcionario, cualquier estado), para armar el historial
// completo y el conteo de días administrativos usados por cada uno.
// Solo accesible para cuentas con la función Jefe de Personal o Director
// (verificado a través de la sesión real de quien consulta).

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
  if (!meta.es_jefe_personal && !meta.es_director) {
    return res.status(403).json({ error: "No tienes permiso para ver el historial completo" });
  }

  try {
    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/solicitudes_permiso?select=*&order=fecha_permiso.desc`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const data = await listRes.json();
    if (!listRes.ok) {
      return res.status(listRes.status).json({ error: "No se pudo obtener el historial" });
    }
    return res.status(200).json({ ok: true, solicitudes: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al obtener el historial" });
  }
}
