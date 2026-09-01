// api/resetear-mfa.js
// Función serverless de Vercel. Elimina el/los factores de verificación en
// dos pasos (Google Authenticator) de un funcionario, buscándolo por su RUT.
// Después de esto, la próxima vez que inicie sesión se le pedirá activar
// Google Authenticator de nuevo desde cero. Requiere las mismas variables
// de entorno que las demás funciones (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET).

const USERNAME_DOMAIN = "cesfamperalillo.internal";

function normalizarRut(rut) {
  return rut.toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret, rut } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  if (!rut) {
    return res.status(400).json({ error: "Falta el RUT" });
  }

  const email = normalizarRut(rut).toLowerCase() + "@" + USERNAME_DOMAIN;

  try {
    // 1. Buscar el usuario por su correo (derivado del RUT)
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

    if (!listRes.ok) {
      return res.status(listRes.status).json({ error: "No se pudo buscar el usuario" });
    }

    const users = listData.users || [];
    const user = users.find((u) => u.email && u.email.toLowerCase() === email);

    if (!user) {
      return res.status(404).json({ error: "No existe un funcionario con ese RUT" });
    }

    const factores = user.factors || [];

    if (factores.length === 0) {
      return res.status(200).json({ ok: true, mensaje: "Este funcionario no tenía ninguna verificación activada." });
    }

    // 2. Eliminar cada factor (normalmente solo tiene uno)
    for (const factor of factores) {
      const delRes = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}/factors/${factor.id}`,
        {
          method: "DELETE",
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      if (!delRes.ok) {
        const errData = await delRes.json().catch(() => ({}));
        return res.status(delRes.status).json({ error: errData.msg || "No se pudo eliminar un factor de verificación" });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al restablecer la verificación" });
  }
}
