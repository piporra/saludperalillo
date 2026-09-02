// auth-guard.js
// Incluir este script (después de supabase-config.js) en cualquier página
// que deba ser accesible solo para funcionarios con sesión iniciada.
// Si no hay sesión válida, redirige automáticamente a login.html.

(async function () {
  if (SUPABASE_URL.includes("PEGA_AQUI")) {
    document.body.innerHTML =
      '<div style="max-width:520px;margin:80px auto;padding:24px;font-family:sans-serif;text-align:center;">' +
      '<h2>Acceso de funcionarios no configurado</h2>' +
      '<p>Falta conectar Supabase en <code>assets/supabase-config.js</code>. Revisa el README.</p>' +
      "</div>";
    throw new Error("Supabase no configurado");
  }

  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const currentPage = encodeURIComponent(window.location.pathname.split("/").pop());
    window.location.href = "login.html?redirect=" + currentPage;
    return;
  }

  // La sesión existe, pero además exigimos que haya completado la
  // verificación en dos pasos (Google Authenticator) en esta sesión —
  // excepto si el interruptor de pruebas (MFA_REQUERIDO) está apagado.
  if (MFA_REQUERIDO) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentPage = encodeURIComponent(window.location.pathname.split("/").pop());

    if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      // Tiene el factor activado, pero no lo verificó en esta sesión (ej: entró
      // directo por link sin pasar por login.html) → lo manda a completar el paso.
      window.location.href = "login.html?redirect=" + currentPage;
      return;
    }

    if (aal.nextLevel === "aal1" && aal.currentLevel === "aal1") {
      // Tiene sesión pero nunca activó Google Authenticator (obligatorio) → a activarlo.
      window.location.href = "mfa-setup.html?redirect=" + currentPage;
      return;
    }
  }

  // Sesión válida: muestra el nombre del funcionario si hay un elemento para ello
  window.addEventListener("DOMContentLoaded", () => {
    const nameEl = document.getElementById("auth-user-name");
    if (nameEl) {
      const nombre = session.user.user_metadata && session.user.user_metadata.nombre
        ? session.user.user_metadata.nombre
        : session.user.email;
      nameEl.textContent = nombre;
    }
  });
})();

async function cerrarSesion() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  window.location.href = "login.html";
}
