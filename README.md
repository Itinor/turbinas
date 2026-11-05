# Evolución de materiales en motores de turbina

Página web del trabajo de metalurgia.

## Cómo cambiar el texto
El texto que trae la página es solo una guía. Para escribirlo con tus palabras:

1. Abre `index.html` con un editor (VS Code o Bloc de notas).
2. Busca (Ctrl+F) `EMPIEZA TU TEXTO`. Hay uno por cada sección y subsección.
3. Entre `EMPIEZA TU TEXTO` y `TERMINA TU TEXTO` están los párrafos de guía (`<p class="base">…</p>`).
4. Bórralos y escribe los tuyos así: `<p>Tu párrafo aquí.</p>` (un `<p>…</p>` por párrafo, sin `class="base"`).
5. No toques lo que está fuera de esos dos marcadores (videos, imágenes, calculadoras).

Para ver cuánto te falta, abre la página agregando `?revisar=1` al final del link
(por ejemplo `index.html?revisar=1`). Los párrafos de guía se ven en amarillo y el índice te dice cuántos faltan.
Sin `?revisar=1` la página se ve normal.

Para poner tu nombre, busca "Tu nombre".

## Cómo publicarla en GitHub Pages
1. Crea un repositorio nuevo en GitHub (por ejemplo `turbinas`).
2. Sube TODO el contenido de esta carpeta (index.html, img, videos, modelos, lib).
3. En el repositorio: Settings → Pages → Source: "Deploy from a branch", rama `main`, carpeta `/ (root)`.
4. En uno o dos minutos la página queda en `https://TU-USUARIO.github.io/turbinas/`.

## Carpetas
- `img/` imágenes y portadas de los videos
- `videos/` las 5 animaciones (MP4)
- `modelos/` los modelos 3D del motor y del álabe
- `lib/` three.js (lo usan los modelos 3D; no lo borres)
