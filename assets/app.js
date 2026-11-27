const SUPABASE_URL = "https://kzqnrfyuzcnqqjnsqtes.supabase.co";
const SUPABASE_KEY = "sb_publishable_Bu0THNHhyqM834euvk8W4w_iMTz4FGP";
window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.TC = {
  user: null,
  perfil: null
};

document.addEventListener("DOMContentLoaded", async () => {
  const isCampus = document.body.dataset.page === "campus";

  // SVG vectorial oficial TecnoCore
  const svgLogo = `
    <svg viewBox="0 0 1580 1580" aria-hidden="true">
      <circle cx="790" cy="790" r="735" fill="#fff"/>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g stroke="#D8AE45" stroke-width="56">
          <circle cx="788" cy="222" r="52"/><circle cx="560" cy="325" r="52"/><circle cx="1017" cy="325" r="52"/>
          <path d="M788 280V640M610 372L692 450V570M968 372L886 450V570"/>
        </g>
        <path d="M265 578H200V1160Q200 1240 282 1240C500 1240 650 1250 700 1310Q790 1400 880 1310C930 1250 1080 1240 1298 1240Q1378 1240 1378 1160V578H1313" stroke="#115E8C" stroke-width="60"/>
        <path d="M295 480C520 485 700 540 790 665C880 540 1060 485 1285 480V1118C1060 1125 900 1170 840 1262L790 1305L740 1262C680 1170 520 1125 295 1118Z" fill="#fff" stroke="#2BB3D3" stroke-width="60"/>
        <path d="M790 665V1290" stroke="#2BB3D3" stroke-width="60"/>
        <path d="M920 745L1005 845L920 935M1060 940H1180" stroke="#115E8C" stroke-width="50"/>
        <circle cx="790" cy="790" r="735" stroke="#115E8C" stroke-width="64"/>
      </g>
    </svg>`;

  // Inyectar Topbar + Menú Bocadillo Izquierdo + Modal Login
  const shellHTML = `
    <header class="topbar">
      <div class="wrap topbar-inner">
        <div class="left-cluster">
          <button class="burger-btn" id="open-drawer" aria-label="Abrir menú principal">
            <div class="burger-lines"><span></span><span></span><span></span></div>
          </button>
          <a href="index.html" class="brand">
            ${svgLogo}
            <div class="brand-txt">
              <b>TecnoCore Academia</b>
              <span>@tecnocore_academia</span>
            </div>
          </a>
        </div>
        <button class="btn-login-top" id="btn-auth-header">🔐 Iniciar sesión</button>
      </div>
    </header>

    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="drawer" id="left-drawer" aria-label="Menú lateral">
      <div class="drawer-head">
        <div class="brand">
          ${svgLogo}
          <div class="brand-txt"><b>TecnoCore</b><span>Portal &amp; Campus</span></div>
        </div>
        <button class="drawer-close" id="close-drawer" aria-label="Cerrar menú">✕</button>
      </div>

      <nav class="drawer-nav">
        <div class="drawer-sec">Academia &amp; Portal</div>
        <a href="index.html#inicio" class="drawer-link" onclick="closeDrawer()">🏠 Inicio</a>
        <a href="index.html#sobre-mi" class="drawer-link" onclick="closeDrawer()">👨‍🏫 Sobre mí (Mi historia)</a>
        <a href="index.html#libro" class="drawer-link" onclick="closeDrawer()">📕 Manual Digital 2026 <small style="color:#fca5a5">(Cerrado)</small></a>
        <a href="index.html#cursos" class="drawer-link" onclick="closeDrawer()">🐧 Cursos y Clases Enero 2027</a>
        <a href="index.html#reserva" class="drawer-link" onclick="closeDrawer()">🚀 Reservar Plaza</a>

        <div class="drawer-sec">Plataforma Interna</div>
        <a href="campus.html" class="drawer-link ${isCampus ? 'active' : ''}">🎓 Entrar al Campus Virtual</a>
        <a href="https://instagram.com/tecnocore_academia" target="_blank" class="drawer-link">📱 Instagram @tecnocore_academia</a>
        <a href="https://www.tiktok.com/@tecnocore_academia" target="_blank" class="drawer-link">🎵 TikTok @tecnocore_academia</a>
      </nav>

      <div class="drawer-foot" id="drawer-user-box">
        <button class="btn btn-primary" onclick="closeDrawer(); openAuthModal();">🔐 Acceso Alumnos / Profesores</button>
      </div>
    </aside>

    <!-- MODAL DE INICIO DE SESIÓN / REGISTRO -->
    <div class="modal-bg" id="auth-modal">
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:21px;font-weight:900" id="auth-title">Acceso al Campus 🎓</h3>
          <button class="drawer-close" onclick="closeAuthModal()">✕</button>
        </div>
        <p style="color:var(--muted);font-size:13.5px;margin-bottom:16px" id="auth-sub">
          Entra con tu cuenta de <strong>Alumno</strong>, <strong>Profesor</strong> o <strong>Administrador</strong>.
        </p>

        <form id="auth-form">
          <div class="field" id="field-reg-nombre" style="display:none">
            <label for="auth-nombre">Nombre y apellidos</label>
            <input type="text" id="auth-nombre" class="tc-input" placeholder="Ej. Carlos Prieto">
          </div>
          <div class="field">
            <label for="auth-email">Correo electrónico</label>
            <input type="email" id="auth-email" class="tc-input" placeholder="tu@correo.com" required>
          </div>
          <div class="field">
            <label for="auth-pass">Contraseña</label>
            <input type="password" id="auth-pass" class="tc-input" placeholder="Mínimo 6 caracteres" required>
          </div>

          <button type="submit" class="btn btn-primary" id="auth-submit" style="width:100%">Entrar en mi perfil →</button>
          <div id="auth-msg" class="status-msg"></div>
        </form>

        <div style="margin-top:14px;text-align:center">
          <button type="button" id="toggle-auth-mode" style="background:none;border:none;color:var(--sky);font:700 13.5px var(--sans);cursor:pointer">
            ¿Aún no tienes cuenta de alumno? Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", shellHTML);

  // Lógica Drawer Bocadillo
  const drawer = document.getElementById("left-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  window.openDrawer = () => { drawer.classList.add("open"); backdrop.classList.add("open"); };
  window.closeDrawer = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); };
  document.getElementById("open-drawer").onclick = openDrawer;
  document.getElementById("close-drawer").onclick = closeDrawer;
  backdrop.onclick = closeDrawer;

  // Lógica Modal Auth
  let isRegister = false;
  const authModal = document.getElementById("auth-modal");
  const authMsg = document.getElementById("auth-msg");

  window.openAuthModal = () => {
    if (window.TC.user) {
      location.href = "campus.html";
      return;
    }
    authMsg.className = "status-msg";
    authModal.classList.add("open");
  };
  window.closeAuthModal = () => authModal.classList.remove("open");

  document.getElementById("btn-auth-header").onclick = openAuthModal;
  document.getElementById("toggle-auth-mode").onclick = (e) => {
    isRegister = !isRegister;
    document.getElementById("field-reg-nombre").style.display = isRegister ? "block" : "none";
    document.getElementById("auth-title").textContent = isRegister ? "Crear cuenta de Alumno 📝" : "Acceso al Campus 🎓";
    document.getElementById("auth-submit").textContent = isRegister ? "Registrarme y entrar →" : "Entrar en mi perfil →";
    e.target.textContent = isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿Aún no tienes cuenta de alumno? Regístrate aquí";
    authMsg.className = "status-msg";
  };

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-pass").value;
    const nombre = document.getElementById("auth-nombre").value.trim();
    const btn = document.getElementById("auth-submit");

    btn.disabled = true;
    authMsg.className = "status-msg";

    if (isRegister) {
      const { error } = await window.db.auth.signUp({
        email,
        password,
        options: { data: { nombre: nombre || email.split("@")[0] } }
      });
      btn.disabled = false;
      if (error) {
        authMsg.className = "status-msg err";
        authMsg.textContent = "❌ " + error.message;
      } else {
        authMsg.className = "status-msg ok";
        authMsg.textContent = "✅ Cuenta creada. Redirigiendo al Campus...";
        setTimeout(() => location.href = "campus.html", 800);
      }
    } else {
      const { error } = await window.db.auth.signInWithPassword({ email, password });
      btn.disabled = false;
      if (error) {
        authMsg.className = "status-msg err";
        authMsg.textContent = "❌ Correo o contraseña incorrectos.";
      } else {
        location.href = "campus.html";
      }
    }
  });

  // Comprobar sesión activa al cargar cualquier página
  const { data: { session } } = await window.db.auth.getSession();
  if (session?.user) {
    window.TC.user = session.user;
    const { data: perfil } = await window.db.from("perfiles").select("*").eq("id", session.user.id).single();
    window.TC.perfil = perfil;

    const rolTag = perfil?.rol === "admin" ? "ADMIN" : perfil?.rol === "profesor" ? "PROFE" : "ALUMNO";
    const btnHeader = document.getElementById("btn-auth-header");
    btnHeader.innerHTML = `🎓 ${perfil?.nombre?.split(" ")[0] || "Mi Perfil"} <small style="background:#03101d;color:#38BDF8;padding:2px 6px;border-radius:6px;font-size:10px">${rolTag}</small>`;

    document.getElementById("drawer-user-box").innerHTML = `
      <a href="campus.html" class="btn btn-gold">🎓 Ir a mi panel (${rolTag})</a>
      <button class="btn btn-danger" onclick="cerrarSesion()">Cerrar sesión</button>
    `;
  }

  window.cerrarSesion = async () => {
    await window.db.auth.signOut();
    location.href = "index.html";
  };

  document.dispatchEvent(new CustomEvent("tc:ready"));
});
