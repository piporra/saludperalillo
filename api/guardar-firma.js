// api/guardar-firma.js
// Función serverless de Vercel. Permite que CUALQUIER cuenta (funcionario,
// jefe directo, director, o Jefa de Personal) guarde su propia firma
// (una imagen en base64), verificando su identidad a través de su sesión.
// Solo puede modificar su propia firma, nunca la de otra persona.

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

  const { firmaBase64 } = req.body || {};
  if (!firmaBase64 || !firmaBase64.startsWith("data:image/")) {
    return res.status(400).json({ error: "La firma no es una imagen válida" });
  }

  // Límite de tamaño razonable (~300 KB en base64) para no inflar la cuenta.
  if (firmaBase64.length > 400000) {
    return res.status(400).json({ error: "La imagen de la firma es demasiado grande. Usa una más simple o comprimida." });
  }

  try {
    const metadataActual = usuario.user_metadata || {};
    const nuevaMetadata = { ...metadataActual, firma_base64: firmaBase64 };

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/admin/users/${usuario.id}`,
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
      return res.status(updateRes.status).json({ error: updateData.msg || "No se pudo guardar la firma" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al guardar la firma" });
  }
}
