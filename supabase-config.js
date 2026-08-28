// Configuración de Supabase para el CESFAM Peralillo
// 1. Sigue las instrucciones del README ("Configurar acceso de funcionarios").
// 2. Reemplaza los dos valores de abajo con los de tu propio proyecto de Supabase
//    (Settings → API en el panel de Supabase).
//
// La SUPABASE_ANON_KEY es pública y segura de exponer aquí: está diseñada
// para usarse en el navegador. NUNCA pongas aquí la "service_role key"
// (esa es secreta y solo debe vivir en las variables de entorno de Vercel).

const SUPABASE_URL = "PEGA_AQUI_TU_SUPABASE_URL";
const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_SUPABASE_ANON_KEY";

// Dominio "falso" usado internamente para transformar el nombre de usuario
// en un correo (Supabase Auth requiere formato de correo). El funcionario
// nunca ve ni usa este dominio, solo escribe su nombre de usuario.
const USERNAME_DOMAIN = "cesfamperalillo.internal";

function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error("La librería de Supabase no cargó. Revisa tu conexión a internet.");
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function usernameToEmail(username) {
  return username.trim().toLowerCase().replace(/\s+/g, ".") + "@" + USERNAME_DOMAIN;
}
