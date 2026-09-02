// api/actualizar-rol.js
// Función serverless de Vercel. Actualiza las funciones adicionales
// (Jefe directo / Director / Jefe de Personal — puede tener varias a la
// vez) y el RUT del jefe directo de una cuenta ya existente, buscándola
// por RUT. Requiere las mismas variables de entorno que las demás funciones.

const USERNAME_DOMAIN = "cesfamperalillo.internal";

function normalizarRut(rut) {
  return rut.toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret, rut, esJefeDirecto, esDirector, esJefePersonal, jefeRut, subrogante } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  if (!rut) {
    return res.status(400).json({ error: "Falta el RUT" });
  }

  const email = normalizarRut(rut).toLowerCase() + "@" + USERNAME_DOMAIN;
  const jefeRutLimpio = jefeRut ? normalizarRut(jefeRut) : "";
  const subrogRutLimpio = subrogante ? normalizarRut(subrogante) : "";

  try {
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

    const metadataActual = user.user_metadata || {};
    const nuevaMetadata = {
      ...metadataActual,
      es_jefe_directo: !!esJefeDirecto,
      es_director: !!esDirector,
      es_jefe_personal: !!esJefePersonal,
      jefe_directo_rut: jefeRutLimpio,
      subrogante_rut: subrogRutLimpio
    };

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ user_metadata: nuevaMetadata })
      }
    );
    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      return res.status(updateRes.status).json({ error: updateData.msg || "No se pudo actualizar" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al actualizar" });
  }
}

