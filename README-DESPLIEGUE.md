# KORE · Guía de despliegue a korefit.cl

App + web en uno (PWA instalable) con buscador inteligente de ejercicios y atlas muscular interactivo.

## Archivos del proyecto

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (landing + buscador + atlas + detalle). Todo en un archivo. |
| `manifest.webmanifest` | Configuración PWA (nombre, iconos, instalación). |
| `sw.js` | Service worker: caché offline de la app, datos e imágenes. |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.svg` | Iconos de la app. |
| `og-image.png` | Imagen para compartir en redes/WhatsApp. |
| `vercel.json` | Cabeceras y reglas para desplegar en Vercel. |
| `CNAME` | Dominio para GitHub Pages (`korefit.cl`). |
| `robots.txt` | Indexación. |

> Para que funcione todo (incluida la instalación como app y el modo offline) sube **todos** los archivos a la **raíz** del hosting.

---

## Opción A — Vercel (recomendada)

1. **Sube el proyecto a GitHub.** Crea un repo nuevo y sube todos los archivos a la raíz. (O usa la CLI de Vercel, o arrastra la carpeta en el dashboard.)
2. En **vercel.com → Add New → Project**, importa el repo y pulsa **Deploy**. Es un sitio estático, no necesita build.
3. **Project → Settings → Domains** → agrega `korefit.cl` y `www.korefit.cl`.
4. Vercel te mostrará los **registros DNS exactos**. En el panel DNS de tu dominio (NIC.cl o donde tengas los nameservers de korefit.cl), agrega:
   - **Apex `korefit.cl` → registro `A`** apuntando al IP que indique Vercel (normalmente `76.76.21.21`).
   - **`www` → registro `CNAME`** apuntando a `cname.vercel-dns.com`.
5. Espera la propagación (de minutos hasta 24 h). Vercel emite el **certificado SSL automáticamente**. Listo: `https://korefit.cl`.
6. (Opcional) En Domains, deja una sola versión canónica con redirección `www → korefit.cl`.

---

## Opción B — GitHub Pages (gratis, ya incluí el archivo `CNAME`)

1. Crea un repo **público**, sube todos los archivos a la raíz (rama `main`).
2. **Settings → Pages → Source:** "Deploy from a branch" → `main` / `/ (root)`.
3. **Custom domain:** escribe `korefit.cl` (el archivo `CNAME` ya viene incluido).
4. En tu DNS agrega los **4 registros `A`** del apex apuntando a las IP de GitHub:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   - Y `www` → registro `CNAME` a `TU-USUARIO.github.io`.
   - (Opcional IPv6: registros `AAAA` a `2606:50c0:8000::153` … `8003::153`.)
5. Marca **"Enforce HTTPS"** cuando GitHub termine de validar el dominio.

---

## Opción C — Netlify (lo más rápido)

netlify.com → arrastra la carpeta del proyecto → **Domain settings → Add custom domain** `korefit.cl` → sigue los registros DNS que te indique. SSL automático.

---

## Probar en tu computador

- **No** pruebes el modo offline ni la instalación abriendo `index.html` con doble clic: el service worker necesita `http(s)`, no `file://`.
- En una terminal, dentro de la carpeta:
  ```bash
  python3 -m http.server 8080
  ```
  Abre `http://localhost:8080`.
- El buscador y los datos **sí** cargan con doble clic si tienes internet; solo el modo offline/PWA requiere servidor.

## Instalar como app (PWA)

- **Chrome/Edge (escritorio):** ícono "Instalar" en la barra de direcciones, o el botón **"Instalar app"** del menú.
- **iPhone (Safari):** Compartir → **"Agregar a pantalla de inicio"**.
- **Android (Chrome):** menú ⋮ → **"Instalar app"**.

---

## Más adelante: conectar a Supabase (arquitectura híbrida)

Todo el contenido entra por **una sola función**: `DATA.load()` dentro de `index.html`.

- Hoy hace `fetch` a la base abierta vía CDN y la cachea para offline.
- Para usar tu propia base, reemplaza el cuerpo de `DATA.load()` por una consulta a **Supabase** (o a tu API) que devuelva el mismo formato por ejercicio:
  ```js
  { name, primaryMuscles:[], secondaryMuscles:[], equipment, category, level, mechanic, force, instructions:[], images:[], id }
  ```
- El resto de la app (traducción al español, buscador, atlas, ficha) **no cambia**.
- Las cuentas de usuario, rutinas y registros de entrenamiento (del Plan de Producción) irían como tablas de Supabase en una segunda fase.

## Búsqueda inteligente — cómo funciona

- Sin acentos y tolerante a errores de tipeo (fuzzy): "sentadia", "bicepts" igual encuentran.
- Bilingüe: busca por el nombre en español o por el original en inglés.
- Con sinónimos de gimnasio: "pecho/pectoral", "gemelos", "femoral/isquios", "core", "dorsal/espalda"…
- Filtros combinables por músculo, equipo, nivel y disciplina.
- Atlas: clic en cualquier músculo (vista frontal o posterior) → filtra los ejercicios al instante.

## Créditos de datos

Catálogo de 873 ejercicios: **free-exercise-db** (yuhonas) — dominio público. Imágenes servidas vía **jsDelivr CDN**. Nombres adaptados al español con alias técnico en inglés; instrucciones traducidas/curadas.
