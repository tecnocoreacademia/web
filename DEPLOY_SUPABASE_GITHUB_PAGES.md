# 🚀 Despliegue Oficial: TecnoCore LMS (Supabase + GitHub Pages)

Toda la infraestructura ha sido migrada a un stack moderno y sin servidores:
- **Frontend Estático:** GitHub Pages (con soporte directo en raíz y `.nojekyll`).
- **Backend Serverless:** Supabase Edge Functions (Deno / TypeScript).
- **Almacenamiento de Archivos:** Supabase Storage (`apuntes`, `boletines`, `entregas`, `diplomas`, `recursos`).
- **Base de Datos:** PostgreSQL en Supabase (Esquema `public`, sin Supabase Auth).

---

## 1. Configuración de Supabase Storage

Abre el panel de control de Supabase (SQL Editor) y ejecuta el archivo:
[`supabase/storage_setup.sql`](file:///c:/Users/carlo/Desktop/TECNOCORE/supabase/storage_setup.sql)

Esto creará automáticamente los 5 buckets necesarios con sus políticas de acceso:
- `apuntes`: Documentos teóricos en PDF.
- `boletines`: Hojas de problemas y solucionarios en PDF.
- `entregas`: Paquetes de código (.sh, .zip, .pdf) subidos por los alumnos.
- `diplomas`: Certificados oficiales emitidos por los profesores.
- `recursos`: Descargas gratuitas y material complementario.

---

## 2. Despliegue de Supabase Edge Functions

### Configuración de Secretos en Supabase:
Desde tu terminal con Supabase CLI, o en el Dashboard (**Edge Functions > Secrets**):
```bash
supabase secrets set JWT_SECRET="tu_clave_secreta_jwt_2026"
supabase secrets set TELEGRAM_SECRET_TOKEN="tu_token_secreto_para_el_bot"
```

### Despliegue de funciones:
```bash
# Desplegar la API unificada que atiende a toda la plataforma
supabase functions deploy api --no-verify-jwt

# Desplegar endpoints específicos para n8n / Bot de Telegram
supabase functions deploy telegram-pendientes --no-verify-jwt
supabase functions deploy telegram-marcar-notificado --no-verify-jwt
```
> **Nota:** Se utiliza `--no-verify-jwt` porque el sistema cuenta con su propio motor criptográfico de autenticación en la tabla `public.usuarios` con JWT personalizado.

---

## 3. Despliegue del Frontend en GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub:
   ```bash
   git init
   git add .
   git commit -m "TecnoCore v2.1: Supabase Edge Functions + GitHub Pages"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
2. En GitHub, entra en tu repositorio y ve a **Settings > Pages**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `/ (root)`
   - Haz clic en **Save**.
3. ¡Listo! Tu web estará publicada en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.
   El archivo `.nojekyll` ya está incluido en la raíz para garantizar que GitHub Pages sirva todos los recursos estáticos sin procesado previo.

---

## 4. Endpoints Disponibles en Supabase Edge Functions

Base URL: `https://kzqnrfyuzcnqqjnsqtes.supabase.co/functions/v1/api`

- `POST /auth-login`: Login con usuario/email + password contra `public.usuarios`.
- `POST /auth-registro`: Registro con estado `pendiente` y aviso a Telegram.
- `GET /auth-me`: Verificación de sesión con token Bearer.
- `POST /auth-logout`: Cierre de sesión.
- `GET, POST, PUT, DELETE /cursos`: Catálogo y administración docente.
- `GET, POST, PUT, DELETE /lecciones`: Árbol Moodle, previews y solucionarios.
- `POST /progreso`: Seguimiento tema a tema y recálculo de avance.
- `GET, POST, PUT /entregas`: Buzón de soluciones con notas y recálculo.
- `GET, POST, PUT /examenes`: Pruebas de bloque y proyecto final.
- `GET, POST, PUT /matriculas`: Matrículas, calificaciones y avance.
- `GET, POST, PUT /diplomas`: Verificador público por código alfanumérico y emisión docente.
- `POST /storage-upload`: Subida de archivos a Supabase Storage con URL resultante.
- `GET, POST, PUT /leads`: CRM de captación de clases y guías.
- `GET, PUT /admin-usuarios`: Aprobación, bloqueo y gestión de roles.
- `GET /telegram-pendientes`: Consulta de nuevos registros con `notificado_telegram = FALSE`.
- `POST /telegram-marcar-notificado`: Actualización a `notificado_telegram = TRUE`.
