/**
 * Gestor de Layout y Sesión Global - TecnoCore LMS & Web
 * - Zona Pública: Topbar comercial + Footer completo
 * - Zona Plataforma: Menú lateral izquierdo formato bocadillo con tema por rol:
 *   - Admin: Morado (tc-theme-admin)
 *   - Profesor: Naranja / Amarillo (tc-theme-profesor)
 *   - Alumno: Azul (tc-theme-alumno)
 */

document.addEventListener("DOMContentLoaded", async () => {
  const currentPage = document.body.dataset.page || "inicio";

  // Páginas sin layout (pantalla completa)
  const noLayoutPages = ["login", "registro", "cargando"];
  if (noLayoutPages.includes(currentPage)) {
    document.dispatchEvent(new CustomEvent("tc:ready", { detail: { user: null } }));
    return;
  }

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

  // Iconos SVG limpios para el menú de plataforma
  const icons = {
    users: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    courses: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
    lessons: `<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    inbox: `<svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
    diploma: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    leads: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    campus: `<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    admin: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    globe: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
  };

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

  const isLoggedIn = !!sessionUser;
  const isAdmin = isLoggedIn && sessionUser.rol === "admin";
  const isProfesor = isLoggedIn && sessionUser.rol === "profesor";
  const isAlumno = isLoggedIn && sessionUser.rol === "alumno";
  const platformPages = ["campus", "aula", "admin", "profesor", "perfil"];
  const isOnPlatform = platformPages.includes(currentPage);

  // Función global Toast
  window.tcToast = (msg, type = "info") => {
    let container = document.getElementById("tc-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "tc-toast-container";
      container.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px";
      document.body.appendChild(container);
    }
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

  // =========================================================================
  // MODO PLATAFORMA PRIVADA (ADMIN / PROFESOR / ALUMNO LOGEADO)
  // =========================================================================
  if (isLoggedIn && isOnPlatform) {
    document.body.classList.add("tc-platform-mode");

    // Aplicar tema visual por rol
    if (isAdmin) {
      document.body.classList.add("tc-theme-admin");
    } else if (isProfesor) {
      document.body.classList.add("tc-theme-profesor");
    } else {
      document.body.classList.add("tc-theme-alumno");
    }

    const iniciales = (sessionUser.nombre_completo || "TC")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join("");

    const rolLabel = isAdmin ? "Administrador" : isProfesor ? "Profesor" : "Alumno";
    const homeHref = isAdmin ? "admin.html" : isProfesor ? "profesor.html" : "campus.html";

    let navItemsHTML = "";

    if (currentPage === "admin" && isAdmin) {
      // Menú lateral exclusivo del Administrador (estética morada)
      navItemsHTML = `
        <div class="tc-sidebar-sec">Administración</div>
        <button class="tc-slink active" data-admin-tab="usuarios" onclick="window.tcAdminNav('usuarios')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.users}</span>
            <span>Usuarios y Claves</span>
          </span>
          <span id="badge-count-usuarios" class="counter-badge" style="display:none">0</span>
        </button>
        <button class="tc-slink" data-admin-tab="cursos" onclick="window.tcAdminNav('cursos')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.courses}</span>
            <span>Todos los Cursos</span>
          </span>
        </button>
        <button class="tc-slink" data-admin-tab="lecciones" onclick="window.tcAdminNav('lecciones')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.lessons}</span>
            <span>Temario Moodle</span>
          </span>
        </button>
        <button class="tc-slink" data-admin-tab="correcciones" onclick="window.tcAdminNav('correcciones')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.inbox}</span>
            <span>Correcciones</span>
          </span>
          <span id="badge-count-correcciones" class="counter-badge" style="display:none">0</span>
        </button>
        <button class="tc-slink" data-admin-tab="matriculas" onclick="window.tcAdminNav('matriculas')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.diploma}</span>
            <span>Matrículas y Diplomas</span>
          </span>
        </button>
        <button class="tc-slink" data-admin-tab="leads" onclick="window.tcAdminNav('leads')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.leads}</span>
            <span>CRM Leads Web</span>
          </span>
          <span id="badge-count-leads" class="counter-badge" style="display:none">0</span>
        </button>

        <div class="tc-sidebar-sec">Mi Cuenta</div>
        <a href="perfil.html" class="tc-slink">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.profile}</span>
            <span>Mi Perfil</span>
          </span>
        </a>
      `;
    } else if (currentPage === "profesor" && isProfesor) {
      // Menú lateral exclusivo del Profesor (estética naranja/amarilla)
      navItemsHTML = `
        <div class="tc-sidebar-sec">Panel Docente</div>
        <button class="tc-slink active" data-prof-tab="cursos" onclick="window.tcProfNav('cursos')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.courses}</span>
            <span>Mis Cursos</span>
          </span>
        </button>
        <button class="tc-slink" data-prof-tab="lecciones" onclick="window.tcProfNav('lecciones')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.lessons}</span>
            <span>Temario Moodle</span>
          </span>
        </button>
        <button class="tc-slink" data-prof-tab="correcciones" onclick="window.tcProfNav('correcciones')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.inbox}</span>
            <span>Correcciones</span>
          </span>
          <span id="badge-count-correcciones" class="counter-badge" style="display:none">0</span>
        </button>
        <button class="tc-slink" data-prof-tab="matriculas" onclick="window.tcProfNav('matriculas')">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.diploma}</span>
            <span>Mis Alumnos y Diplomas</span>
          </span>
        </button>

        <div class="tc-sidebar-sec">Mi Cuenta</div>
        <a href="perfil.html" class="tc-slink">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.profile}</span>
            <span>Mi Perfil</span>
          </span>
        </a>
      `;
    } else {
      // Menú lateral para Alumno (azul) o Perfil según rol
      navItemsHTML = `
        <div class="tc-sidebar-sec">${isAlumno ? 'Mi Aprendizaje' : 'Navegación'}</div>
        ${isAlumno ? `
          <a href="campus.html" class="tc-slink ${currentPage === 'campus' || currentPage === 'aula' ? 'active' : ''}">
            <span class="tc-slink-left">
              <span class="tc-slink-icon">${icons.campus}</span>
              <span>Mi Campus LMS</span>
            </span>
          </a>
        ` : ''}
        ${isAdmin ? `
          <a href="admin.html" class="tc-slink">
            <span class="tc-slink-left">
              <span class="tc-slink-icon">${icons.admin}</span>
              <span>Panel Administrador</span>
            </span>
          </a>
        ` : ''}
        ${isProfesor ? `
          <a href="profesor.html" class="tc-slink">
            <span class="tc-slink-left">
              <span class="tc-slink-icon">${icons.admin}</span>
              <span>Panel Profesor</span>
            </span>
          </a>
        ` : ''}
        <a href="perfil.html" class="tc-slink ${currentPage === 'perfil' ? 'active' : ''}">
          <span class="tc-slink-left">
            <span class="tc-slink-icon">${icons.profile}</span>
            <span>Mi Perfil y Clave</span>
          </span>
        </a>
      `;
    }

    const mainEl = document.querySelector("main");
    const shell = document.createElement("div");
    shell.className = "tc-shell";

    shell.innerHTML = `
      <div class="drawer-backdrop" id="tc-sidebar-backdrop"></div>
      <aside class="tc-sidebar" id="tc-platform-sidebar" aria-label="Menú de plataforma">
        <div class="tc-sidebar-head">
          <a href="${homeHref}" class="brand">
            ${svgLogo}
            <div class="brand-txt">
              <b>TecnoCore</b>
              <span>${isAdmin ? 'Admin Suite' : isProfesor ? 'Área Docente' : 'Campus Virtual'}</span>
            </div>
          </a>
          <button class="drawer-close tc-sidebar-close" id="tc-sidebar-close" aria-label="Cerrar menú">✕</button>
        </div>

        <div class="tc-sidebar-user">
          <div class="tc-sidebar-avatar">${iniciales}</div>
          <div style="min-width:0">
            <div style="font-weight:800;font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sessionUser.nombre_completo}</div>
            <div style="font-size:11px;color:var(--accent-text);font-family:var(--mono)">${rolLabel}</div>
          </div>
        </div>

        <nav class="tc-sidebar-nav">
          ${navItemsHTML}
        </nav>

        <div class="tc-sidebar-foot">
          <a href="index.html" class="tc-slink" style="font-size:12.5px;color:var(--muted)">
            <span class="tc-slink-left">
              <span class="tc-slink-icon" style="width:26px;height:26px">${icons.globe}</span>
              <span>Web Pública</span>
            </span>
          </a>
          <button class="tc-slink" onclick="cerrarSesion()" style="color:#fca5a5">
            <span class="tc-slink-left">
              <span class="tc-slink-icon" style="background:rgba(239,68,68,0.12);color:#fca5a5;width:26px;height:26px">${icons.logout}</span>
              <span>Cerrar Sesión</span>
            </span>
          </button>
        </div>
      </aside>

      <div class="tc-platform-main">
        <header class="tc-platform-topbar">
          <div style="display:flex;align-items:center;gap:10px">
            <button class="burger-btn" id="tc-sidebar-open" aria-label="Abrir menú">
              <div class="burger-lines"><span></span><span></span><span></span></div>
            </button>
            <div class="brand">
              ${svgLogo}
              <div class="brand-txt"><b>TecnoCore</b><span>${rolLabel}</span></div>
            </div>
          </div>
          <button onclick="cerrarSesion()" class="btn-ghost" style="padding:6px 12px;border-radius:99px;font-size:12px;font-weight:700;border:1px solid rgba(239,68,68,0.4);color:#fca5a5;background:rgba(239,68,68,0.1);cursor:pointer">Salir</button>
        </header>
        <div class="tc-platform-content" id="tc-platform-content"></div>
      </div>
    `;

    document.body.insertBefore(shell, document.body.firstChild);
    const contentHost = document.getElementById("tc-platform-content");
    if (mainEl) {
      mainEl.classList.remove("wrap");
      mainEl.style.paddingTop = "0";
      mainEl.style.paddingBottom = "0";
      contentHost.appendChild(mainEl);
    }

    const sidebar = document.getElementById("tc-platform-sidebar");
    const backdrop = document.getElementById("tc-sidebar-backdrop");
    window.openPlatformSidebar = () => { sidebar.classList.add("open"); backdrop.classList.add("open"); };
    window.closePlatformSidebar = () => { sidebar.classList.remove("open"); backdrop.classList.remove("open"); };
    document.getElementById("tc-sidebar-open").onclick = window.openPlatformSidebar;
    document.getElementById("tc-sidebar-close").onclick = window.closePlatformSidebar;
    backdrop.onclick = window.closePlatformSidebar;

    window.tcAdminNav = (tabName) => {
      document.querySelectorAll(".tc-sidebar-nav .tc-slink[data-admin-tab]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.adminTab === tabName);
      });
      if (typeof window.switchAdminTab === "function") {
        window.switchAdminTab(tabName);
      }
      window.closePlatformSidebar();
    };

    window.tcProfNav = (tabName) => {
      document.querySelectorAll(".tc-sidebar-nav .tc-slink[data-prof-tab]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.profTab === tabName);
      });
      if (typeof window.switchProfTab === "function") {
        window.switchProfTab(tabName);
      }
      window.closePlatformSidebar();
    };

    document.dispatchEvent(new CustomEvent("tc:ready", { detail: { user: sessionUser } }));
    return;
  }

  // =========================================================================
  // MODO ZONA PÚBLICA
  // =========================================================================
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

  if (isLoggedIn) {
    const panelHref = isAdmin ? "admin.html" : isProfesor ? "profesor.html" : "campus.html";
    const panelText = isAdmin ? "🛡️ Panel Admin" : isProfesor ? "👨‍🏫 Panel Profesor" : "🎓 Mi Campus";

    authButtonHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        <a href="${panelHref}" class="btn-login-top" style="padding:6px 14px">${panelText}</a>
        <a href="perfil.html" title="Mi Perfil" style="display:flex;align-items:center;color:var(--muted);font-size:13px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,0.05)">👤</a>
      </div>
    `;

    drawerUserHTML = `
      <div style="background:rgba(12,26,48,0.9);padding:12px;border-radius:12px;margin-bottom:8px;border:1px solid var(--border)">
        <div style="font-weight:800;font-size:14px;color:#fff">${sessionUser.nombre_completo}</div>
        <div style="font-size:12px;color:var(--sky);font-family:var(--mono)">@${sessionUser.usuario} · ${sessionUser.rol.toUpperCase()}</div>
      </div>
      <a href="${panelHref}" class="btn btn-primary">${panelText}</a>
      <a href="perfil.html" class="btn btn-ghost" style="margin-top:6px">👤 Mi Perfil</a>
      <button class="btn btn-danger" style="margin-top:6px" onclick="cerrarSesion()">Cerrar Sesión</button>
    `;
  }

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
      </nav>

      <div class="drawer-foot" id="drawer-user-box">
        ${drawerUserHTML}
      </div>
    </aside>

    <div id="tc-toast-container" style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px"></div>
  `;

  document.body.insertAdjacentHTML("afterbegin", navShell);

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

  const drawer = document.getElementById("left-drawer");
  const backdrop = document.getElementById("drawer-backdrop");
  window.openDrawer = () => { drawer.classList.add("open"); backdrop.classList.add("open"); };
  window.closeDrawer = () => { drawer.classList.remove("open"); backdrop.classList.remove("open"); };
  document.getElementById("open-drawer").onclick = openDrawer;
  document.getElementById("close-drawer").onclick = closeDrawer;
  backdrop.onclick = closeDrawer;

  document.dispatchEvent(new CustomEvent("tc:ready", { detail: { user: sessionUser } }));

  // =========================================================================
  // GESTOR DE MODALES: scroll del body bloqueado mientras haya modal abierto
  // =========================================================================
  const checkModalsOpen = () => {
    const anyOpen = document.querySelector(".modal-bg.open") !== null;
    document.body.classList.toggle("modal-open", anyOpen);
  };
  const modalObserver = new MutationObserver(checkModalsOpen);
  modalObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // Click en el fondo del modal lo cierra
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-bg") && e.target.classList.contains("open")) {
      e.target.classList.remove("open");
    }
  });
});
