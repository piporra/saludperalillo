// api/listar-jefes.js
// Función serverless de Vercel. Devuelve la lista de funcionarios que
// tienen marcado el atributo "es_jefe_directo", para poblar los combo box
// de "Jefe directo" y "Subrogante" al crear o editar una cuenta.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

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
      return res.status(listRes.status).json({ error: "No se pudo obtener la lista de funcionarios" });
    }

    const jefes = (listData.users || [])
      .filter((u) => u.user_metadata && u.user_metadata.es_jefe_directo)
      .map((u) => ({
        nombre: u.user_metadata.nombre || "(sin nombre)",
        rut: u.user_metadata.rut || ""
      }))
      .filter((j) => j.rut)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return res.status(200).json({ ok: true, jefes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar jefes directos" });
  }
}
