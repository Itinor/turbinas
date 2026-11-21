# Cosas de la uni

Red social independiente hecha por y para estudiantes. Esta es la versión web completa (HTML, CSS y JavaScript sin frameworks), lista para probarse en el navegador y, después, convertirse en app de celular.

> Proyecto independiente, creado por y para estudiantes. No afiliado ni administrado por la universidad.

## Cómo abrirla

Los juegos y la herramienta de métodos numéricos se cargan como archivos aparte, así que conviene abrir la carpeta con un servidor local (no con doble clic):

```bash
cd cosasdelauni
python -m http.server 8000
# abre http://localhost:8000 en el navegador o en tu celular (misma red Wi-Fi: http://IP-de-tu-compu:8000)
```

En la pantalla de bienvenida puedes crear una cuenta o entrar con una de ejemplo: **Diego (admin)** ve el panel de administración; **Valeria** y **Jorge** son estudiantes normales.

## Subirla a GitHub Pages (para compartir un link)

1. Crea un repositorio **público** en GitHub (GitHub Pages en repos privados requiere un plan de pago).
2. Sube todo el contenido de esta carpeta (que `index.html` quede en la raíz del repositorio).
3. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)` → **Save**.
4. En uno o dos minutos aparece el link: `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

Ojo: mientras no haya servidor, **cada persona tiene su propia copia de los datos** en su navegador. Tus amigos no verán las publicaciones de los demás; cada quien prueba por su lado.

Para que entren sin registrarse, en `js/datos.js` cambia `CONFIG.entrarDirecto` a `'u_diego'` (cuenta admin) y vuelve a subir ese archivo.

## Qué incluye

| Sección | Qué hace |
|---|---|
| Crear cuenta | Correo o número, horario opcional, carrera, generación, semestre opcional, @usuario y quién ve tu nombre real |
| Inicio | Recordatorio más cercano, publicar, me interesa, comentarios, reportar / bloquear / silenciar |
| Explorar | Mapa del campus con buscador de salones, ficha y opiniones de profesores, eventos |
| Propuestas | Predicciones con ramitas (pozo compartido), votaciones y actividades con cupo |
| Rankings | Mejores y peores profesores por área; rankings de la comunidad con consentimiento de los mencionados |
| Juegos | Racha semanal, trivia, palabra del día, reto de lógica, La Baraja, Runner, Space War, ruleta y tragamonedas |
| Retos | Ejercicios de Cálculo generados por plantillas (11), niveles oficiales y de la comunidad, crear niveles |
| Chat | Grupos de materia y mensajes directos, respetando la privacidad de cada quien |
| Agenda | Exámenes, entregas y proyectos con cuenta regresiva; avisos a 7, 3 y 1 día; compartir en un grupo |
| Compraventa | Venta, intercambio o regalo; visible para todos, solo amigos o personas elegidas |
| Perfil | Marco por reputación, insignias, canción del perfil, playlists; editar con cambios marcados en amarillo |
| Ajustes | Carrera, semestre, horario, privacidad, música automática, modo oscuro, bloqueados |
| Herramientas | Graficadora (raíces, cruces y área) y métodos numéricos |
| Administración | Moderación, verificaciones, seguimiento de predicciones, alertas, economía de ramitas y registro |

## Reglas que funcionan por detrás

Están todas en `js/datos.js` (`REGLAS`) y el estudiante no las ve como letreros:

- 3 propuestas al día; máximo 50 ramitas por predicción y 100 al día.
- El pozo de cada predicción se reparte entre quienes aciertan, menos un 8 % que va al Fondo del castor: **la plataforma nunca paga más de lo que entró.**
- Las predicciones sobre exámenes, calificaciones, profes o la vida de alguien se publican como votación, sin ramitas (evita información privilegiada).
- Los rankings de la comunidad empiezan con los amigos del autor (o su salón si no tiene) y suben a salón, generación y todos al llegar a 15, 50 y 150 votos.
- Si un ranking menciona a alguien, esa persona tiene que aceptar. Si usa palabras ofensivas, va a revisión.
- Profesores: solo aparecen con 15 opiniones o más, y solo opinan estudiantes verificados.
- Tope diario de ramitas en retos y 60 segundos por pregunta.
- Ruleta y tragamonedas: 1 ramita = 100 créditos, con un cajero dentro del juego para cambiar y cobrar. Máximo 100 ramitas al casino por día. Como devuelven en promedio menos de lo que se juega, retiran ramitas de la economía. Las ramitas no se compran ni se cambian por dinero: si algún día se venden, el casino tendría que desconectarse de ellas.
- Alertas automáticas: apuestas fuertes del mismo grupo en menos de 30 minutos, aciertos fuera de lo normal y varias cuentas en el mismo dispositivo.
- El registro de ramitas solo se agrega; nunca se edita ni se borra.

## Estructura

```
index.html              entrada de la app
manifest.json, icono.svg para instalarla como app (PWA)
css/estilos.css         colores, componentes y diseño para celular y escritorio
js/util.js              utilidades, íconos y lector de fórmulas seguro (no usa eval)
js/datos.js             reglas y datos de ejemplo
js/db.js                capa de datos: TODAS las reglas y operaciones (cambiar aquí para usar un servidor)
js/app.js               navegación por rutas (#/inicio, #/chat/…)
js/retos-generador.js   plantillas de ejercicios de Cálculo
js/juegos-datos.js      bancos de trivia, palabras y lógica
js/vistas/*.js          una pantalla por archivo
juegos/                 Runner, Space War y Royal con sus sonidos (convertidos a MP3)
herramientas/metodos.html  métodos numéricos con el lector seguro
```

## Lo que falta para producción

1. **Servidor y cuentas reales.** Hoy todo se guarda en el navegador (`localStorage`), así que cada dispositivo tiene sus propios datos. Hay que reescribir `js/db.js` para usar Supabase (base de datos, inicio de sesión por correo o SMS, chat en tiempo real). Las pantallas no cambian.
2. **Reglas en el servidor.** Las ramitas, apuestas, límites y el registro deben validarse en el servidor; lo que corre en el navegador se puede manipular.
3. **Verificación real.** El código del correo hoy se muestra en pantalla (es de prueba). En producción se envía por correo, y la lectura del horario necesita OCR o revisión manual.
4. **Juegos con ramitas.** La ruleta y la tragamonedas ya usan ramitas; Runner y Space War todavía no dan premios. A Space War le faltan algunos sprites (nave_idle, boss_asteroid, etc.).
5. **App de celular.** Con Capacitor se empaqueta esta misma carpeta como app de Android e iOS.

## Modo prueba (para compartir con amigos)
- En la bienvenida cada quien entra solo con un **@usuario** (sin correo) y queda verificado.
- El admin entra con **"Soy admin"** y la clave de `CONFIG.claveAdmin` en `js/datos.js`.
- Las propuestas arrancan en cero (`CONFIG.propuestasDemo: false`).
- Mientras `CONFIG.dineroReal` sea `false`, el admin puede borrar predicciones con ramitas (se devuelve lo apostado).
- Importante: sin base de datos, cada navegador guarda su propia copia. Para que se vean entre sí (chat, feed, propuestas) falta conectar Supabase.
