// api/crear-solicitud-permiso.js
// Función serverless de Vercel. Crea una nueva solicitud de permiso
// administrativo. Verifica la identidad real del funcionario a través de
// su sesión (no confía en datos enviados desde el navegador para saber
// quién solicita), y determina automáticamente a qué jefe directo enviarla
// según lo configurado en su cuenta.

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
  const rutSolicitante = meta.rut;
  const nombreSolicitante = meta.nombre;
  const rutJefe = meta.jefe_directo_rut;

  if (!rutSolicitante || !nombreSolicitante) {
    return res.status(400).json({ error: "Tu cuenta no tiene RUT o nombre configurado. Contacta a administración." });
  }
  if (!rutJefe) {
    return res.status(400).json({ error: "Tu cuenta no tiene un jefe directo asignado. Contacta a administración." });
  }

  const { fechaPermiso, tipo, turno, motivo } = req.body || {};
  if (!fechaPermiso || !tipo) {
    return res.status(400).json({ error: "Faltan datos de la solicitud" });
  }

  try {
    const insertRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/solicitudes_permiso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        rut_solicitante: rutSolicitante,
        nombre_solicitante: nombreSolicitante,
        fecha_permiso: fechaPermiso,
        tipo,
        turno: turno || null,
        motivo: motivo || null,
        rut_jefe: rutJefe,
        estado_jefe: "pendiente",
        estado_director: "pendiente",
        estado: "pendiente_jefe"
      })
    });

    if (!insertRes.ok) {
      const errData = await insertRes.json().catch(() => ({}));
      return res.status(insertRes.status).json({ error: errData.message || "No se pudo crear la solicitud" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear la solicitud" });
  }
}
