// api/crear-funcionario.js
// Función serverless de Vercel. Crea una cuenta de funcionario en Supabase.
// Requiere que estas variables de entorno estén configuradas en Vercel
// (Project → Settings → Environment Variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (la clave SECRETA, nunca la "anon key")
//   ADMIN_SECRET                (clave maestra que tú eliges, para proteger este endpoint)

const USERNAME_DOMAIN = "cesfamperalillo.internal";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret, nombre, username, password } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  if (!nombre || !username || !password) {
    return res.status(400).json({ error: "Faltan datos (nombre, username o password)" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const email = username.trim().toLowerCase().replace(/\s+/g, ".") + "@" + USERNAME_DOMAIN;

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { nombre, username }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = (data && data.msg) || (data && data.error_description) || "No se pudo crear la cuenta";
      return res.status(response.status).json({ error: msg });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear la cuenta" });
  }
}
