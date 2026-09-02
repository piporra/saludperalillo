// api/crear-funcionario.js
// Función serverless de Vercel. Crea una cuenta de funcionario en Supabase,
// usando su RUT (normalizado) como identificador único.
// Requiere que estas variables de entorno estén configuradas en Vercel
// (Project → Settings → Environment Variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (la clave SECRETA, nunca la "anon key")
//   ADMIN_SECRET                (clave maestra que tú eliges, para proteger este endpoint)

const USERNAME_DOMAIN = "cesfamperalillo.internal";

// Deja el RUT solo con dígitos y dígito verificador (sin puntos, espacios ni guion).
function normalizarRut(rut) {
  return rut.toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

// Valida el dígito verificador del RUT chileno (algoritmo módulo 11).
function validarRut(rut) {
  const limpio = normalizarRut(rut);
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsperado;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { adminSecret, nombre, rut, password, hojaUrl, rol, jefeRut } = req.body || {};

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  if (!nombre || !rut || !password) {
    return res.status(400).json({ error: "Faltan datos (nombre, rut o password)" });
  }

  if (!validarRut(rut)) {
    return res.status(400).json({ error: "El RUT ingresado no es válido" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const rolFinal = ["funcionario", "jefe", "director", "jefe_personal"].includes(rol) ? rol : "funcionario";
  const rutLimpio = normalizarRut(rut);
  const jefeRutLimpio = jefeRut ? normalizarRut(jefeRut) : "";
  const email = rutLimpio.toLowerCase() + "@" + USERNAME_DOMAIN;

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
        user_metadata: {
          nombre,
          rut: rutLimpio,
          hoja_dias_url: hojaUrl || "",
          rol: rolFinal,
          jefe_directo_rut: jefeRutLimpio
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      let msg = (data && data.msg) || (data && data.error_description) || "No se pudo crear la cuenta";
      if (/already|registered|exists/i.test(msg)) {
        msg = "Ya existe una cuenta creada con ese RUT";
      }
      return res.status(response.status).json({ error: msg });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno al crear la cuenta" });
  }
}

