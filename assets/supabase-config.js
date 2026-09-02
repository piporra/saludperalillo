// Configuración de Supabase para el CESFAM Peralillo
// La SUPABASE_ANON_KEY es pública y segura de exponer aquí: está diseñada
// para usarse en el navegador. NUNCA pongas aquí la "service_role key" /
// "Secret key" (esa es secreta y solo debe vivir en las variables de
// entorno de Vercel).

const SUPABASE_URL = "https://qnhmwpjvuwwpffazsegy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ebzScXLAf6r-VZrCQhdunQ_QDKCOq8v";

// Dominio "falso" usado internamente para transformar el RUT del funcionario
// en un correo (Supabase Auth requiere formato de correo). El funcionario
// nunca ve ni usa este dominio, solo escribe su RUT.
const USERNAME_DOMAIN = "cesfamperalillo.internal";

// ===== Interruptor de verificación en dos pasos (Google Authenticator) =====
// true  → obligatorio para todos (modo normal de producción)
// false → desactivado, para hacer pruebas rápidas sin pedir el código
// Cuando termines de probar, vuelve a poner esto en "true" y sube este
// archivo de nuevo a GitHub.
const MFA_REQUERIDO = false;

function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error("La librería de Supabase no cargó. Revisa tu conexión a internet.");
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Deja el RUT solo con dígitos y dígito verificador (sin puntos, espacios ni guion),
// en mayúscula si el DV es K. Así "12.345.678-9" y "12345678-9" son el mismo usuario.
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

// Formatea visualmente el RUT mientras el usuario escribe (12.345.678-9)
function formatearRut(rut) {
  const limpio = normalizarRut(rut);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return cuerpoConPuntos + "-" + dv;
}

function rutToEmail(rut) {
  return normalizarRut(rut).toLowerCase() + "@" + USERNAME_DOMAIN;
}
