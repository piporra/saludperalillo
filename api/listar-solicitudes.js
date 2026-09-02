// api/listar-solicitudes.js
// Función serverless de Vercel. Devuelve la lista de solicitudes de permiso
// según quién consulta:
//   - modo=propias    → sus propias solicitudes (cualquier funcionario)
//   - modo=jefe        → las que le corresponde revisar a él como jefe directo
//   - modo=director     → las que ya aprobó un jefe y esperan al director
// Verifica la identidad real del que consulta a través de su sesión.

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
  const modo = req.query.modo || "propias";

  let filtro = "";
  if (modo === "propias") {
    filtro = `rut_solicitante=eq.${encodeURIComponent(meta.rut || "")}`;
  } else if (modo === "jefe") {
    filtro = `rut_jefe=eq.${encodeURIComponent(meta.rut || "")}&estado=eq.pendiente_jefe`;
  } else if (modo === "director") {
    if (meta.rol !== "director") {
      return res.status(403).json({ error: "No tienes permiso para ver esta lista" });
    }
    filtro = `estado=eq.pendiente_director`;
  } else if (modo === "personal") {
    if (meta.rol !== "jefe_personal") {
      return res.status(403).json({ error: "No tienes permiso para ver esta lista" });
    }
    filtro = `estado=eq.pendiente_personal`;
  } else {
    return res.status(400).json({ error: "Modo inválido" });
  }

  try {
    const listRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/solicitudes_permiso?${filtro}&order=created_at.desc`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    const data = await listRes.json();
    if (!listRes.ok) {
      return res.status(listRes.status).json({ error: "No se pudo obtener la lista" });
    }
    return res.status(200).json({ ok: true, solicitudes: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar solicitudes" });
  }
}
