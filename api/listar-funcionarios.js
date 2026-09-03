// api/listar-funcionarios.js
// Función serverless de Vercel. Devuelve la lista completa de funcionarios
// con sus datos (nombre, RUT, funciones, jefe directo, subrogante), para
// mostrarla en el panel de administrador con opción de editar.

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

    const funcionarios = (listData.users || [])
      .map((u) => {
        const m = u.user_metadata || {};
        return {
          rut: m.rut || "",
          nombre: m.nombre || "(sin nombre)",
          es_jefe_directo: !!m.es_jefe_directo,
          es_director: !!m.es_director,
          es_jefe_personal: !!m.es_jefe_personal,
          es_jefe_departamento: !!m.es_jefe_departamento,
          jefe_directo_rut: m.jefe_directo_rut || "",
          subrogante_rut: m.subrogante_rut || ""
        };
      })
      .filter((f) => f.rut)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return res.status(200).json({ ok: true, funcionarios });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al listar funcionarios" });
  }
}
