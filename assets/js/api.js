/**
 * Cliente API Oficial de TecnoCore
 * Arquitectura 100% Supabase Edge Functions + Supabase Storage + GitHub Pages
 * Comunicación HTTPS sin conexión directa a puerto 5432.
 */

const TC_API = (() => {
  const TOKEN_KEY = "tc_jwt_token";

  function getConfig() {
    return window.TC_CONFIG || {
      SUPABASE_URL: "https://kzqnrfyuzcnqqjnsqtes.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_Bu0THNHhyqM834euvk8W4w_iMTz4FGP",
      FUNCTIONS_URL: "https://kzqnrfyuzcnqqjnsqtes.supabase.co/functions/v1"
    };
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async function request(endpoint, options = {}) {
    const cfg = getConfig();
    const userToken = getToken();

    const headers = {
      "Content-Type": "application/json",
      "apikey": cfg.SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`,
      ...(userToken ? { "x-user-token": userToken } : {}),
      ...(options.headers || {})
    };

    const baseUrl = cfg.FUNCTIONS_URL.replace(/\/+$/, "");
    const url = `${baseUrl}/api/${endpoint}`;

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (e) {
      // Fallback directo si se invoca función individual sin el router /api
      const fallbackUrl = `${baseUrl}/${endpoint}`;
      res = await fetch(fallbackUrl, { ...options, headers });
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(data?.error || data?.mensaje || "Error en la petición a Supabase");
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  return {
    auth: {
      async login(identificador, password) {
        const res = await request("auth-login", {
          method: "POST",
          body: JSON.stringify({ identificador, password })
        });
        if (res.token) {
          setToken(res.token);
        }
        return res;
      },
      async registro(nombre_completo, usuario, email, password) {
        return await request("auth-registro", {
          method: "POST",
          body: JSON.stringify({ nombre_completo, usuario, email, password })
        });
      },
      async logout() {
        setToken(null);
        try {
          await request("auth-logout", { method: "POST" });
        } catch {
          // ignore
        }
        return { ok: true };
      },
      async me() {
        const token = getToken();
        if (!token) return { authenticated: false, usuario: null };
        try {
          return await request("auth-me", { method: "GET" });
        } catch {
          setToken(null);
          return { authenticated: false, usuario: null };
        }
      }
    },

    storage: {
      async upload(bucket, file, customPath = "") {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64Content = reader.result.split(",")[1];
              const ext = file.name.split(".").pop();
              const filename = customPath || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

              const res = await request("storage-upload", {
                method: "POST",
                body: JSON.stringify({
                  bucket,
                  path: filename,
                  fileBase64: base64Content,
                  contentType: file.type || "application/octet-stream"
                })
              });
              resolve(res);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }
    },

    cursos: {
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`cursos${query ? '?' + query : ''}`, { method: "GET" });
      },
      async detalle(slug) {
        return await request(`cursos?slug=${encodeURIComponent(slug)}`, { method: "GET" });
      },
      async guardar(cursoData) {
        const isEdit = !!cursoData.id;
        return await request("cursos", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(cursoData)
        });
      },
      async eliminar(id) {
        return await request(`cursos?id=${id}`, { method: "DELETE" });
      }
    },

    lecciones: {
      async arbol(cursoSlugOrId) {
        const param = typeof cursoSlugOrId === "number" ? `curso_id=${cursoSlugOrId}` : `curso_slug=${encodeURIComponent(cursoSlugOrId)}`;
        return await request(`lecciones?${param}`, { method: "GET" });
      },
      async guardar(leccionData) {
        const isEdit = !!leccionData.id;
        return await request("lecciones", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify(leccionData)
        });
      },
      async eliminar(id) {
        return await request(`lecciones?id=${id}`, { method: "DELETE" });
      }
    },

    progreso: {
      async marcar(data) {
        return await request("progreso", {
          method: "POST",
          body: JSON.stringify(data)
        });
      }
    },

    entregas: {
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`entregas${query ? '?' + query : ''}`, { method: "GET" });
      },
      async enviar(data) {
        return await request("entregas", {
          method: "POST",
          body: JSON.stringify(data)
        });
      },
      async calificar(data) {
        return await request("entregas", {
          method: "PUT",
          body: JSON.stringify(data)
        });
      }
    },

    examenes: {
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`examenes${query ? '?' + query : ''}`, { method: "GET" });
      },
      async enviar(data) {
        return await request("examenes", {
          method: "POST",
          body: JSON.stringify(data)
        });
      },
      async calificar(data) {
        return await request("examenes", {
          method: "PUT",
          body: JSON.stringify(data)
        });
      }
    },

    matriculas: {
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`matriculas${query ? '?' + query : ''}`, { method: "GET" });
      },
      async solicitar(cursoId) {
        return await request("matriculas", {
          method: "POST",
          body: JSON.stringify({ curso_id: cursoId })
        });
      },
      async actualizar(data) {
        return await request("matriculas", {
          method: "PUT",
          body: JSON.stringify(data)
        });
      }
    },

    diplomas: {
      async verificar(codigo) {
        return await request(`diplomas?codigo=${encodeURIComponent(codigo)}`, { method: "GET" });
      },
      async misDiplomas() {
        return await request("diplomas", { method: "GET" });
      },
      async generar(matriculaId) {
        return await request("diplomas", {
          method: "POST",
          body: JSON.stringify({ matricula_id: matriculaId })
        });
      },
      async marcarEmailEnviado(matriculaId) {
        return await request("diplomas", {
          method: "PUT",
          body: JSON.stringify({ matricula_id: matriculaId })
        });
      }
    },

    leads: {
      async enviar(leadData) {
        return await request("leads", {
          method: "POST",
          body: JSON.stringify(leadData)
        });
      },
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`leads${query ? '?' + query : ''}`, { method: "GET" });
      },
      async actualizar(data) {
        return await request("leads", {
          method: "PUT",
          body: JSON.stringify(data)
        });
      }
    },

    usuarios: {
      async listar(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await request(`admin-usuarios${query ? '?' + query : ''}`, { method: "GET" });
      },
      async actualizar(id, estado, rol) {
        return await request("admin-usuarios", {
          method: "PUT",
          body: JSON.stringify({ id, estado, rol })
        });
      }
    }
  };
})();

window.TC_API = TC_API;
