// api/cambiar-clave.js
// Función serverless de Vercel. Restablece la contraseña de un funcionario
// ya existente en Supabase, buscándolo por su RUT. Requiere las mismas
// variables de entorno que api/crear-funcionario.js
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SECRET).

const USERNAME_DOMAIN = "cesfamperalillo.internal";

function normalizarRut(rut) {
  return rut.toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret, rut, newPassword } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  if (!rut || !newPassword) {
    return res.status(400).json({ error: "Faltan datos (rut o newPassword)" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
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

    // 2. Actualizar su contraseña
    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ password: newPassword })
      }
    );
    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      const msg = (updateData && updateData.msg) || "No se pudo cambiar la contraseña";
      return res.status(updateRes.status).json({ error: msg });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al cambiar la contraseña" });
  }
}

