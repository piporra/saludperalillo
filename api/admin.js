// api/admin.js
// Función serverless de Vercel. Combina en un solo endpoint las 6
// operaciones del panel de administrador (antes eran 6 archivos separados:
// crear-funcionario.js, actualizar-rol.js, cambiar-clave.js, resetear-mfa.js,
// listar-funcionarios.js, listar-jefes.js) — se unieron para no superar el
// límite de 12 funciones serverless del plan gratuito de Vercel.
//
// Todas las peticiones son POST, con un campo "accion" que indica qué hacer:
//   accion: "crear_funcionario"   → { adminSecret, nombre, rut, password, esJefeDirecto, esDirector, esJefePersonal, esJefeDepartamento, jefeRut, subrogante }
//   accion: "actualizar_rol"      → { adminSecret, rut, nombre, esJefeDirecto, esDirector, esJefePersonal, esJefeDepartamento, jefeRut, subrogante }
//   accion: "cambiar_clave"       → { adminSecret, rut, newPassword }
//   accion: "resetear_mfa"        → { adminSecret, rut }
//   accion: "listar_funcionarios" → { adminSecret }
//   accion: "listar_jefes"        → { adminSecret }

const USERNAME_DOMAIN = "cesfamperalillo.internal";

function normalizarRut(rut) {
  return rut.toString().trim().toUpperCase().replace(/[^0-9K]/g, "");
}

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

async function listarUsuariosSupabase() {
  const listRes = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    {
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const data = await listRes.json();
  if (!listRes.ok) return null;
  return data.users || [];
}

async function buscarUsuarioPorRut(rut) {
  const email = normalizarRut(rut).toLowerCase() + "@" + USERNAME_DOMAIN;
  const users = await listarUsuariosSupabase();
  if (!users) return null;
  return users.find((u) => u.email && u.email.toLowerCase() === email) || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body = req.body || {};
  const { adminSecret, accion } = body;

  if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Clave de administrador incorrecta" });
  }

  try {
    // ===== Crear funcionario =====
    if (accion === "crear_funcionario") {
      const { nombre, rut, password, esJefeDirecto, esDirector, esJefePersonal, esJefeDepartamento, jefeRut, subrogante } = body;

      if (!nombre || !rut || !password) {
        return res.status(400).json({ error: "Faltan datos (nombre, rut o password)" });
      }
      if (!validarRut(rut)) {
        return res.status(400).json({ error: "El RUT ingresado no es válido" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
      }

      const rutLimpio = normalizarRut(rut);
      const jefeRutLimpio = jefeRut ? normalizarRut(jefeRut) : "";
      const subrogRutLimpio = subrogante ? normalizarRut(subrogante) : "";
      const email = rutLimpio.toLowerCase() + "@" + USERNAME_DOMAIN;

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
            es_jefe_directo: !!esJefeDirecto,
            es_director: !!esDirector,
            es_jefe_personal: !!esJefePersonal,
            es_jefe_departamento: !!esJefeDepartamento,
            jefe_directo_rut: jefeRutLimpio,
            subrogante_rut: subrogRutLimpio
          }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        let msg = (data && data.msg) || (data && data.error_description) || "No se pudo crear la cuenta";
        if (/already|registered|exists/i.test(msg)) msg = "Ya existe una cuenta creada con ese RUT";
        return res.status(response.status).json({ error: msg });
      }
      return res.status(200).json({ ok: true, id: data.id });
    }

    // ===== Actualizar rol/nombre/jefe/subrogante =====
    if (accion === "actualizar_rol") {
      const { rut, nombre, esJefeDirecto, esDirector, esJefePersonal, esJefeDepartamento, jefeRut, subrogante } = body;
      if (!rut) return res.status(400).json({ error: "Falta el RUT" });

      const user = await buscarUsuarioPorRut(rut);
      if (!user) return res.status(404).json({ error: "No existe un funcionario con ese RUT" });

      const jefeRutLimpio = jefeRut ? normalizarRut(jefeRut) : "";
      const subrogRutLimpio = subrogante ? normalizarRut(subrogante) : "";
      const metadataActual = user.user_metadata || {};
      const nuevaMetadata = {
        ...metadataActual,
        nombre: nombre && nombre.trim() ? nombre.trim() : metadataActual.nombre,
        es_jefe_directo: !!esJefeDirecto,
        es_director: !!esDirector,
        es_jefe_personal: !!esJefePersonal,
        es_jefe_departamento: !!esJefeDepartamento,
        jefe_directo_rut: jefeRutLimpio,
        subrogante_rut: subrogRutLimpio
      };

      const updateRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ user_metadata: nuevaMetadata })
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) return res.status(updateRes.status).json({ error: updateData.msg || "No se pudo actualizar" });
      return res.status(200).json({ ok: true });
    }

    // ===== Cambiar contraseña =====
    if (accion === "cambiar_clave") {
      const { rut, newPassword } = body;
      if (!rut || !newPassword) return res.status(400).json({ error: "Faltan datos (rut o newPassword)" });
      if (newPassword.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });

      const user = await buscarUsuarioPorRut(rut);
      if (!user) return res.status(404).json({ error: "No existe un funcionario con ese RUT" });

      const updateRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        const msg = (updateData && updateData.msg) || "No se pudo cambiar la contraseña";
        return res.status(updateRes.status).json({ error: msg });
      }
      return res.status(200).json({ ok: true });
    }

    // ===== Restablecer verificación en dos pasos (MFA) =====
    if (accion === "resetear_mfa") {
      const { rut } = body;
      if (!rut) return res.status(400).json({ error: "Falta el RUT" });

      const user = await buscarUsuarioPorRut(rut);
      if (!user) return res.status(404).json({ error: "No existe un funcionario con ese RUT" });

      const factores = user.factors || [];
      if (factores.length === 0) {
        return res.status(200).json({ ok: true, mensaje: "Este funcionario no tenía ninguna verificación activada." });
      }
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
    }

    // ===== Listar todos los funcionarios =====
    if (accion === "listar_funcionarios") {
      const users = await listarUsuariosSupabase();
      if (!users) return res.status(500).json({ error: "No se pudo obtener la lista de funcionarios" });

      const funcionarios = users
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
    }

    // ===== Listar solo los jefes directos =====
    if (accion === "listar_jefes") {
      const users = await listarUsuariosSupabase();
      if (!users) return res.status(500).json({ error: "No se pudo obtener la lista de funcionarios" });

      const jefes = users
        .filter((u) => u.user_metadata && u.user_metadata.es_jefe_directo)
        .map((u) => ({
          nombre: u.user_metadata.nombre || "(sin nombre)",
          rut: u.user_metadata.rut || ""
        }))
        .filter((j) => j.rut)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      return res.status(200).json({ ok: true, jefes });
    }

    // ===== Reparar cuenta con token demasiado grande =====
    // Quita cualquier dato pesado (como una firma vieja) que haya quedado
    // guardado dentro de la metadata del usuario, la cual Supabase incluye
    // en su token de sesión y puede causar errores "494 Request Header Too
    // Large" que bloquean TODAS sus peticiones. Como esta reparación usa la
    // clave maestra (no el token de la persona afectada), funciona incluso
    // si su cuenta ya está bloqueada.
    if (accion === "reparar_token_grande") {
      const { rut } = body;
      if (!rut) return res.status(400).json({ error: "Falta el RUT" });

      const user = await buscarUsuarioPorRut(rut);
      if (!user) return res.status(404).json({ error: "No existe un funcionario con ese RUT" });

      const metadataActual = user.user_metadata || {};
      if (!metadataActual.firma_base64) {
        return res.status(200).json({ ok: true, mensaje: "Esta cuenta no tenía ningún dato pesado guardado. No hacía falta repararla." });
      }

      const { firma_base64, ...metadataLimpia } = metadataActual;
      const updateRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ user_metadata: metadataLimpia })
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) return res.status(updateRes.status).json({ error: updateData.msg || "No se pudo reparar la cuenta" });

      return res.status(200).json({ ok: true, mensaje: "Cuenta reparada. Debe cerrar sesión y volver a entrar para que se aplique." });
    }

    return res.status(400).json({ error: "Acción no reconocida: " + accion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
