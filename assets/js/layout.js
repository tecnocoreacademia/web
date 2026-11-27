/**
 * Gestor de Layout y Sesión Global - TecnoCore LMS & Web
 */

document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = document.body.dataset.page || "inicio";

  // SVG Logotipo oficial TecnoCore
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

  // Consultar estado de sesión actual con API
  let sessionUser = null;
  try {
    if (window.TC_API) {
      const meData = await window.TC_API.auth.me();
      if (meData && meData.authenticated) {
        sessionUser = meData.usuario;
      }
    }
  } catch (e) {
    console.warn("Sesión no autenticada o modo offline:", e.message);
  }

  window.currentUser = sessionUser;

  // Botón dinámico de usuario en topbar
  let authButtonHTML = `
    <div style="display:flex;gap:8px;align-items:center">
      <a href="login.html" class="btn-ghost" style="padding:7px 14px;border-radius:99px;font-size:13px;font-weight:700">Iniciar sesión</a>
      <a href="registro.html" class="btn-login-top">Registrarme →</a>
    </div>
  `;

  let drawerUserHTML = `
    <a href="login.html" class="btn btn-primary">🔐 Iniciar Sesión</a>
    <a href="registro.html" class="btn btn-ghost" style="margin-top:6px">📝 Crear Cuenta de Alumno</a>
  `;

  if (sessionUser) {
    const isDocente = sessionUser.rol === "admin" || sessionUser.rol === "profesor";
    const rolBadge = isDocente ? `<span style="background:#0284C7;color:#fff;font-size:10px;padding:2px 6px;border-radius:6px;font-family:var(--mono)">${sessionUser.rol.toUpperCase()}</span>` : "";

    authButtonHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        ${isDocente ? `<a href="admin.html" class="btn-ghost" style="padding:6px 12px;border-radius:10px;font-size:12.5px;font-weight:700">⚙️ Admin</a>` : ''}
        <a href="campus.html" class="btn-login-top" style="padding:6px 14px">
          🎓 Campus ${rolBadge}
        </a>
        <a href="perfil.html" title="Mi Perfil" style="display:flex;align-items:center;color:var(--muted);font-size:13px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,0.05)">
          👤
        </a>
      </div>
    `;

    drawerUserHTML = `
      <div style="background:rgba(12,26,48,0.9);padding:12px;border-radius:12px;margin-bottom:8px;border:1px solid var(--border)">
        <div style="font-weight:800;font-size:14px;color:#fff">${sessionUser.nombre_completo}</div>
        <div style="font-size:12px;color:var(--sky);font-family:var(--mono)">@${sessionUser.usuario} · ${sessionUser.rol.toUpperCase()}</div>
      </div>
      <a href="campus.html" class="btn btn-primary">🎓 Ir a Mi Campus</a>
      ${isDocente ? `<a href="admin.html" class="btn btn-gold" style="margin-top:6px">⚙️ Panel Docente / Admin</a>` : ''}
      <a href="perfil.html" class="btn btn-ghost" style="margin-top:6px">👤 Mi Perfil y Contraseña</a>
      <button class="btn btn-danger" style="margin-top:6px" onclick="cerrarSesion()">Cerrar Sesión</button>
    `;
  }

  // Estructura completa de navegación
  const navShell = `
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
              <span>LMS &amp; Portal Oficial</span>
            </div>
          </a>
        </div>

        <nav class="tc-nav-desktop" style="display:none">
          <a href="index.html" class="${currentPage === 'inicio' ? 'active' : ''}">Inicio</a>
          <a href="cursos.html" class="${currentPage === 'cursos' ? 'active' : ''}">Cursos</a>
          <a href="clases-particulares.html" class="${currentPage === 'clases' ? 'active' : ''}">Clases Particulares</a>
          <a href="recursos.html" class="${currentPage === 'recursos' ? 'active' : ''}">Recursos Gratis</a>
          <a href="verificar-diploma.html" class="${currentPage === 'verificar' ? 'active' : ''}">Verificar Diploma</a>
        </nav>

        <div id="topbar-auth-cluster">
          ${authButtonHTML}
        </div>
      </div>
    </header>

    <!-- DRAWER LATERAL MÓVIL Y ESCRITORIO -->
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <aside class="drawer" id="left-drawer" aria-label="Menú principal">
      <div class="drawer-head">
        <div class="brand">
          ${svgLogo}
          <div class="brand-txt"><b>TecnoCore</b><span>Portal &amp; Campus</span></div>
        </div>
        <button class="drawer-close" id="close-drawer" aria-label="Cerrar">✕</button>
      </div>

      <nav class="drawer-nav">
        <div class="drawer-sec">Academia &amp; Cursos</div>
        <a href="index.html" class="drawer-link ${currentPage === 'inicio' ? 'active' : ''}">🏠 Inicio</a>
        <a href="cursos.html" class="drawer-link ${currentPage === 'cursos' ? 'active' : ''}">💻 Catálogo de Cursos</a>
        <a href="clases-particulares.html" class="drawer-link ${currentPage === 'clases' ? 'active' : ''}">🧑‍🏫 Clases Particulares SMR/ASIR</a>
        <a href="recursos.html" class="drawer-link ${currentPage === 'recursos' ? 'active' : ''}">📚 Recursos y Chuletas Gratis</a>
        <a href="verificar-diploma.html" class="drawer-link ${currentPage === 'verificar' ? 'active' : ''}">🛡️ Verificar Certificados</a>

        <div class="drawer-sec">Campus Virtual</div>
        <a href="campus.html" class="drawer-link ${currentPage === 'campus' ? 'active' : ''}">🎓 Mi Campus LMS</a>
        ${sessionUser && (sessionUser.rol === 'admin' || sessionUser.rol === 'profesor') ? `
          <a href="admin.html" class="drawer-link ${currentPage === 'admin' ? 'active' : ''}">⚙️ Panel Docente y Administración</a>
        ` : ''}
        ${sessionUser ? `
          <a href="perfil.html" class="drawer-link ${currentPage === 'perfil' ? 'active' : ''}">👤 Mi Perfil</a>
        ` : ''}
      </nav>

      <div class="drawer-foot" id="drawer-user-box">
        ${drawerUserHTML}
      </div>
    </aside>

    <!-- TOAST NOTIFICACIONES -->
    <div id="tc-toast-container" style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px"></div>
  `;

  document.body.insertAdjacentHTML("afterbegin", navShell);

  // Inyectar Footer común al final
  const footerHTML = `
    <footer class="section" style="border-top:1px solid var(--border);margin-top:60px;padding:40px 0 30px;background:rgba(4,9,20,0.85)">
      <div class="wrap" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:30px">
        <div>
          <div class="brand" style="margin-bottom:12px">
            ${svgLogo}
            <div class="brand-txt"><b>TecnoCore Academia</b><span>Informática clara y sin palabras raras</span></div>
          </div>
          <p style="font-size:13.5px;color:var(--muted);line-height:1.6">
            Especialistas en refuerzo para Grado Medio SMR, Grado Superior ASIR, administración Linux/Bash y desarrollo de software práctico.
          </p>
        </div>
        <div>
          <h4 style="font-size:15px;color:#fff;margin-bottom:12px;font-weight:800">Formación y Servicios</h4>
          <ul style="list-style:none;font-size:13.5px;line-height:2;color:var(--muted)">
            <li><a href="cursos.html" style="color:var(--sky)">→ Catálogo de Cursos Online</a></li>
            <li><a href="clases-particulares.html" style="color:var(--sky)">→ Tutorías y Clases Particulares</a></li>
            <li><a href="recursos.html" style="color:var(--sky)">→ Guías y Chuletas Descargables</a></li>
            <li><a href="verificar-diploma.html" style="color:var(--sky)">→ Validador Oficial de Diplomas</a></li>
          </ul>
        </div>
        <div>
          <h4 style="font-size:15px;color:#fff;margin-bottom:12px;font-weight:800">Campus y Accesos</h4>
          <ul style="list-style:none;font-size:13.5px;line-height:2;color:var(--muted)">
            <li><a href="campus.html" style="color:var(--sky)">→ Acceso Campus Virtual LMS</a></li>
            <li><a href="login.html" style="color:var(--sky)">→ Iniciar Sesión</a></li>
            <li><a href="registro.html" style="color:var(--sky)">→ Registro de Alumnos</a></li>
          </ul>
        </div>
      </div>
      <div class="wrap" style="margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;font-size:12.5px;color:var(--muted)">
        <div>© ${new Date().getFullYear()} TecnoCore Academia · Todos los derechos reservados.</div>
        <div style="font-family:var(--mono)">Arquitectura PostgreSQL 100% Nativa</div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML("beforeend", footerHTML);

  // Manejador Drawer
  const drawer = document.getElementById("left-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  window.openDrawer = () => { drawer.classList.add("open"); backdrop.classList.add("open"); };
  window.closeDrawer = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); };
  document.getElementById("open-drawer").onclick = openDrawer;
  document.getElementById("close-drawer").onclick = closeDrawer;
  backdrop.onclick = closeDrawer;

  // Función global Toast
  window.tcToast = (msg, type = "info") => {
    const container = document.getElementById("tc-toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `tc-toast tc-toast-${type}`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // Función cerrar sesión
  window.cerrarSesion = async () => {
    try {
      await window.TC_API.auth.logout();
      window.tcToast("Sesión cerrada correctamente", "info");
      setTimeout(() => location.href = "login.html", 400);
    } catch {
      location.href = "login.html";
    }
  };

  // Disparar evento para que la página sepa que el layout y usuario están listos
  document.dispatchEvent(new CustomEvent("tc:ready", { detail: { user: sessionUser } }));
});
