/* Datos de arranque (ejemplo). Todo esto vive después en la base de datos real.
   Los nombres de personas y profesores son inventados. */
'use strict';
/* Configuración rápida.
   entrarDirecto: pon aquí el id de una cuenta (por ejemplo 'u_diego', que es admin) para que la app
   entre directo sin pantalla de registro. Útil para que tus amigos prueben sin crear cuenta.
   Déjalo en null para mostrar la bienvenida (registro + botones de cuentas de ejemplo). */
const CONFIG = { entrarDirecto: 'u_diego' };
const CARRERAS = [
  { nombre: 'Ing. en Sistemas', facultad: 'Ingeniería' }, { nombre: 'Mecatrónica', facultad: 'Ingeniería' },
  { nombre: 'Ing. Industrial', facultad: 'Ingeniería' }, { nombre: 'Ing. Civil', facultad: 'Ingeniería' },
  { nombre: 'Ing. Química', facultad: 'Química' }, { nombre: 'Contaduría', facultad: 'Contaduría' }
];
const AREAS = ['Ciencias básicas', 'Ingeniería', 'Humanidades', 'Química'];
const INSIGNIAS = {
  verificado: { texto: 'Estudiante verificado', clase: 'i-azul' },
  colaborador: { texto: 'Colaborador', clase: 'i-morado' },
  organizador: { texto: 'Organizador', clase: 'i-amarillo' },
  fundador: { texto: 'Miembro fundador', clase: 'i-naranja' },
  tutor: { texto: 'Tutor', clase: 'i-verde' }
};
/* Reglas internas (no se muestran como letreros al estudiante) */
const REGLAS = {
  regaloBienvenida: 50, regaloDiario: 20, premioRacha7: 50,
  limitePropuestasDia: 3, limiteEncuestasDia: 3,
  maxPorPrediccion: 50, maxPrediccionDia: 100, comisionFondo: 0.08,
  topeRetosDia: 200, segundosPorPregunta: 60,
  umbralRanking: { amigos: 15, salon: 50, generacion: 150 },
  minOpinionesProfe: 15,
  creditosPorRamita: 100, maxCasinoDia: 100
};
/* Temas que no pueden ser predicciones con ramitas (alguien de dentro podría saber el resultado) */
const TEMAS_PRIVILEGIADOS = /(examen|parcial|calificaci|reprob|aprob|profe|maestr|tarea|falta|asistencia|baja\b|kardex|kárdex|promedio|embaraz|novi[oa]|cortar|terminar con|despid)/i;
/* Palabras que mandan un ranking a revisión antes de publicarse */
const PALABRAS_REVISION = /(feo|fea|gord|flac|put[oa]|naco|idiota|estúpid|estupid|pendej|zorr|perr[oa]|tont[oa]|asco|odio|mamad|verg|chin)/i;

const SALONES = [
  { clave: 'A-101', edificio: 'A', piso: 'Planta baja', como: 'Entrando por la puerta principal, a la izquierda.' },
  { clave: 'A-302', edificio: 'A', piso: 'Tercer piso', como: 'Sube por la escalera del fondo; es el segundo salón.' },
  { clave: 'B-110', edificio: 'B', piso: 'Planta baja', como: 'Junto a los centros de cómputo.' },
  { clave: 'C-204', edificio: 'C', piso: 'Segundo piso', como: 'Al fondo a la derecha. A 3 min de la biblioteca.' },
  { clave: 'LAB-1', edificio: 'Labs', piso: 'Planta baja', como: 'Laboratorio de física, entrada lateral.' },
  { clave: 'BIBLIO', edificio: 'Biblioteca', piso: 'Todo el edificio', como: 'Frente a la cafetería.' }
];
const EDIFICIOS_MAPA = [
  { n: 'A', x: 4, y: 6, w: 26, h: 22, c: '#EEE8F7' }, { n: 'B', x: 36, y: 6, w: 20, h: 32, c: '#EEE8F7' },
  { n: 'C', x: 62, y: 8, w: 32, h: 24, c: '#FFE7A8' }, { n: 'Biblioteca', x: 4, y: 36, w: 30, h: 24, c: '#DCE8FB' },
  { n: 'Cafetería', x: 40, y: 44, w: 22, h: 18, c: '#FFF6DA' }, { n: 'Labs', x: 70, y: 40, w: 24, h: 30, c: '#EEE8F7' },
  { n: 'Canchas', x: 4, y: 68, w: 56, h: 26, c: '#DCF5E3' }
];

function datosIniciales() {
  // generador con semilla para que los datos de ejemplo siempre salgan iguales
  let s = 42; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const ahora = Date.now(), haceMin = m => new Date(ahora - m * 60000).toISOString();
  const hoy = fechaLocal();
  const U = (id, usuario, nombre, carrera, gen, extra = {}) => ({
    id, usuario, nombre, nombreVis: 'amigos', carrera, gen, semestre: null, verificado: 'si', rol: 'estudiante',
    bio: '', cancion: null, playlists: [], insignias: ['verificado'], ocultas: [], amigos: [], bloqueados: [], silenciados: [],
    privacidad: { escribir: 'todos', perfil: 'todos', venta: 'todos' }, ajustes: { musicaAuto: false, oscuro: false },
    horario: [], racha: { dias: 0, ultimo: null, semana: [] }, diarios: { fecha: null }, limites: { fecha: null },
    reputacion: 0, dispositivo: 'disp-' + id, creado: haceMin(60 * 24 * 30), ...extra
  });
  const usuarios = {
    u_diego: U('u_diego', 'castor.sistemas', 'Diego Ramírez', 'Ing. en Sistemas', 2023, { rol: 'admin', insignias: ['verificado', 'colaborador', 'organizador', 'fundador'], bio: 'Sistemas · fan del bádminton y de las tortas de Doña Lupe', reputacion: 9, semestre: 5,
      cancion: { titulo: 'Última esperanza', artista: 'Diego R.', archivo: 'juegos/spacewar/ultima_esperanza.mp3' },
      playlists: [{ nombre: 'Para estudiar de noche', servicio: 'Spotify', url: 'https://open.spotify.com/' }, { nombre: 'Gym antes de clase', servicio: 'Apple Music', url: 'https://music.apple.com/' }],
      horario: [{ materia: 'Cálculo II', dias: 'Lun y Mié', hora: '09:00', salon: 'C-204' }, { materia: 'Física II', dias: 'Mar y Jue', hora: '11:00', salon: 'LAB-1' }, { materia: 'Programación', dias: 'Lun y Vie', hora: '13:00', salon: 'B-110' }] }),
    u_mariana: U('u_mariana', 'mariana.p', 'Mariana Pérez', 'Mecatrónica', 2023, { insignias: ['verificado', 'colaborador'], reputacion: 12 }),
    u_luis: U('u_luis', 'luis.t', 'Luis Torres', 'Mecatrónica', 2023, { dispositivo: 'disp-compartido' }),
    u_ana: U('u_ana', 'ana.p', 'Ana Paredes', 'Mecatrónica', 2023, { dispositivo: 'disp-compartido' }),
    u_jorge: U('u_jorge', 'jorge.m', 'Jorge Méndez', 'Mecatrónica', 2023, { dispositivo: 'disp-compartido', reputacion: 3 }),
    u_valeria: U('u_valeria', 'vale.a', 'Valeria Aguirre', 'Ing. Industrial', 2024, { reputacion: 6, privacidad: { escribir: 'todos', perfil: 'todos', venta: 'amigos' } }),
    u_sofia: U('u_sofia', 'sofia.l', 'Sofía Lara', 'Ing. Industrial', 2024, { reputacion: 4, playlists: [{ nombre: 'Para estudiar de noche', servicio: 'Spotify', url: 'https://open.spotify.com/' }] }),
    u_pedro: U('u_pedro', 'pedro.g', 'Pedro García', 'Ing. en Sistemas', 2023, { reputacion: 2 }),
    u_equipo: U('u_equipo', 'equipo', 'Equipo Cosas de la uni', 'Ing. en Sistemas', 2022, { rol: 'admin', insignias: ['fundador'] })
  };
  const amistad = (a, b) => { usuarios[a].amigos.push(b); usuarios[b].amigos.push(a); };
  amistad('u_diego', 'u_pedro'); amistad('u_diego', 'u_valeria'); amistad('u_diego', 'u_sofia'); amistad('u_diego', 'u_mariana');
  amistad('u_jorge', 'u_luis'); amistad('u_jorge', 'u_ana'); amistad('u_valeria', 'u_sofia');

  const profes = [
    ['Prof. Ramírez', 'Ciencias básicas', ['Cálculo I', 'Cálculo II'], 4.8, 86],
    ['Mtra. Ortega', 'Ciencias básicas', ['Física I'], 4.6, 64],
    ['Prof. Salas', 'Ciencias básicas', ['Álgebra lineal'], 4.4, 41],
    ['Prof. Núñez', 'Ciencias básicas', ['Química general'], 2.2, 37],
    ['Mtro. Ibarra', 'Ciencias básicas', ['Probabilidad'], 2.5, 22],
    ['Mtra. Lozano', 'Ingeniería', ['Programación'], 4.9, 92],
    ['Prof. Treviño', 'Ingeniería', ['Circuitos'], 4.3, 58],
    ['Prof. Cárdenas', 'Ingeniería', ['Termodinámica'], 2.4, 45],
    ['Mtra. Ríos', 'Humanidades', ['Ética'], 4.7, 51],
    ['Prof. Esquivel', 'Humanidades', ['Metodología'], 2.7, 18],
    ['Mtra. Solís', 'Química', ['Química orgánica'], 4.5, 26],
    ['Prof. Mora', 'Química', ['Fisicoquímica'], 3.1, 9]
  ];
  const motivosMalos = ['Llega tarde seguido', 'No explica cómo califica', 'Exámenes fuera del temario', 'Cambia fechas sin avisar', 'Muchas tareas sin retroalimentación'];
  const motivosBuenos = ['Explica muy claro', 'Califica justo', 'Siempre resuelve dudas', 'Clases dinámicas'];
  const lista = profes.map(([nombre, area, materias, media, n], i) => {
    const opiniones = [];
    for (let k = 0; k < n; k++) {
      const v = () => Math.max(1, Math.min(5, Math.round(media + (rnd() - 0.5) * 1.6)));
      opiniones.push({ u: 'anon_' + k, claridad: v(), justo: v(), puntual: v(), motivo: media < 3.5 ? motivosMalos[(i + k) % 3 === 0 ? i % motivosMalos.length : (i + 1) % motivosMalos.length] : motivosBuenos[(i + k) % motivosBuenos.length], fecha: haceMin(60 * 24 * (k % 120)) });
    }
    return { id: 'p_' + i, nombre, area, materias, opiniones };
  });

  const posts = [
    { id: 'post1', autor: 'u_valeria', texto: '¿Alguien sabe si ya publicaron los horarios de verano?', fecha: haceMin(12), likes: ['u_sofia', 'u_pedro'], comentarios: [{ autor: 'u_sofia', texto: 'Dicen que salen el lunes', fecha: haceMin(8) }] },
    { id: 'post2', autor: 'u_mariana', texto: 'Hice un nivel de derivadas bien difícil en Retos. A ver quién lo pasa con 5/5', fecha: haceMin(55), likes: ['u_diego', 'u_luis', 'u_jorge'], comentarios: [] },
    { id: 'post3', autor: 'u_sofia', texto: 'Vendo apuntes de Física I muy completos, en Compraventa', fecha: haceMin(180), likes: [], comentarios: [] },
    { id: 'post4', autor: 'u_equipo', texto: 'Bienvenidos a Cosas de la uni. Proyecto independiente, hecho por y para estudiantes. Si algo falla, repórtalo desde los tres puntitos.', fecha: haceMin(60 * 30), likes: ['u_diego', 'u_mariana', 'u_valeria', 'u_sofia'], comentarios: [] }
  ];
  const masTarde = d => sumarDias(hoy, d);
  const propuestas = [
    { id: 'pr_badminton', tipo: 'prediccion', titulo: '¿Quién gana el torneo de bádminton entre carreras?', autor: 'u_diego', fecha: haceMin(60 * 26), cierre: masTarde(2), opciones: ['Ing. en Sistemas', 'Mecatrónica'], apuestas: [], votos: {}, estado: 'abierta' },
    { id: 'pr_posada', tipo: 'votacion', titulo: '¿Qué día prefieren la posada de la facultad?', autor: 'u_equipo', fecha: haceMin(60 * 50), cierre: masTarde(5), opciones: ['Jueves 4', 'Viernes 5', 'Sábado 6'], apuestas: [], votos: { u_mariana: 1, u_luis: 1, u_ana: 0, u_valeria: 1, u_sofia: 2, u_pedro: 1 }, estado: 'abierta' },
    { id: 'pr_fut', tipo: 'actividad', titulo: 'Fut 7 mixto el viernes después de clases', autor: 'u_pedro', fecha: haceMin(60 * 5), cierre: masTarde(3), opciones: [], apuntados: ['u_pedro', 'u_luis', 'u_ana', 'u_jorge', 'u_mariana', 'u_sofia', 'u_valeria', 'u_diego', 'u_equipo', 'u_ana2'].slice(0, 9), cupo: 14, apuestas: [], votos: {}, estado: 'abierta' },
    // historial para el panel de seguimiento
    { id: 'pr_voley', tipo: 'prediccion', titulo: 'Final de voleibol', autor: 'u_equipo', fecha: haceMin(60 * 24 * 9), cierre: masTarde(-7), opciones: ['Industrial', 'Mecatrónica'], apuestas: [], votos: {}, estado: 'abierta' },
    { id: 'pr_robotica', tipo: 'prediccion', titulo: 'Concurso de robótica: ¿quién queda primero?', autor: 'u_equipo', fecha: haceMin(60 * 24 * 12), cierre: masTarde(-10), opciones: ['Equipo Mecatrónica', 'Equipo Sistemas'], apuestas: [], votos: {}, estado: 'abierta' },
    { id: 'pr_posada_asist', tipo: 'prediccion', titulo: '¿Más de 200 personas en la posada pasada?', autor: 'u_equipo', fecha: haceMin(60 * 24 * 20), cierre: masTarde(-15), opciones: ['Sí', 'No'], apuestas: [], votos: {}, estado: 'abierta' }
  ];
  const rankings = [
    { id: 'rk_comida', titulo: '¿Cuál es la mejor comida cerca del campus?', autor: 'u_jorge', oficial: false, opciones: ['Tortas Doña Lupe', 'Café del puente', 'Tacos El Castor'], votos: {}, nombrados: [], consentimiento: {}, estado: 'aprobado', fecha: haceMin(60 * 24 * 6) },
    { id: 'rk_fiestero', titulo: '¿Quién es más fiestero: Diego o Pedro?', autor: 'u_diego', oficial: false, opciones: ['Diego', 'Pedro'], votos: { u_pedro: 0, u_sofia: 1, u_valeria: 0 }, nombrados: ['u_diego', 'u_pedro'], consentimiento: { u_diego: true, u_pedro: true }, estado: 'aprobado', fecha: haceMin(60 * 20) },
    { id: 'rk_biblio', titulo: '¿Qué lugar es mejor para estudiar?', autor: 'u_equipo', oficial: true, opciones: ['Biblioteca', 'Cafetería', 'Jardines', 'Salón vacío'], votos: {}, nombrados: [], consentimiento: {}, estado: 'aprobado', fecha: haceMin(60 * 24 * 3) },
    { id: 'rk_feo', titulo: '¿Quién es el más feo del salón?', autor: 'u_luis', oficial: false, opciones: ['Por definir'], votos: {}, nombrados: [], consentimiento: {}, estado: 'revision', fecha: haceMin(5) }
  ];
  // muchos votos para el ranking de comida (público)
  for (let k = 0; k < 312; k++) rankings[0].votos['v' + k] = k % 100 < 41 ? 0 : k % 100 < 74 ? 1 : 2;
  for (let k = 0; k < 180; k++) rankings[2].votos['w' + k] = k % 4 === 3 ? 3 : k % 3;

  const eventos = [
    { id: 'ev1', titulo: 'Torneo de bádminton entre carreras', fecha: masTarde(6), hora: '16:00', lugar: 'Canchas', interesados: 64 },
    { id: 'ev2', titulo: 'Feria de proyectos de Mecatrónica', fecha: masTarde(8), hora: '10:00', lugar: 'Labs', interesados: 41 },
    { id: 'ev3', titulo: 'Posada de la facultad', fecha: masTarde(14), hora: '18:00', lugar: 'Explanada', interesados: 230 }
  ];
  const ventas = [
    { id: 'v1', autor: 'u_luis', titulo: 'Libro de Cálculo (usado, buen estado)', tipo: 'venta', precio: 350, vis: 'todos', elegidos: [], fecha: haceMin(60 * 3) },
    { id: 'v2', autor: 'u_ana', titulo: 'Bata de laboratorio talla M', tipo: 'intercambio', precio: 0, vis: 'amigos', elegidos: [], fecha: haceMin(60 * 8) },
    { id: 'v3', autor: 'u_mariana', titulo: 'Kit de Arduino Uno completo', tipo: 'venta', precio: 280, vis: 'todos', elegidos: [], fecha: haceMin(60 * 20) },
    { id: 'v4', autor: 'u_sofia', titulo: 'Apuntes de Física I', tipo: 'regalo', precio: 0, vis: 'elegidos', elegidos: ['u_diego', 'u_valeria'], fecha: haceMin(60 * 26) },
    { id: 'v5', autor: 'u_pedro', titulo: 'Calculadora graficadora', tipo: 'intercambio', precio: 0, vis: 'todos', elegidos: [], fecha: haceMin(60 * 40) }
  ];
  const chats = [
    { id: 'ch_calc', tipo: 'grupo', nombre: 'Cálculo II · Grupo 3', miembros: ['u_diego', 'u_valeria', 'u_jorge', 'u_pedro', 'u_sofia'], fijado: null,
      mensajes: [{ u: 'u_valeria', t: '¿Alguien tiene la guía resuelta?', f: haceMin(40) }, { u: 'u_jorge', t: 'Yo tengo hasta el ejercicio 12', f: haceMin(35) }, { u: 'u_diego', t: 'Yo hice del 13 al 20, ¿armamos sesión mañana?', f: haceMin(30) }, { u: 'u_valeria', t: 'Va, en la biblio a las 4', f: haceMin(28) }] },
    { id: 'ch_vale', tipo: 'dm', nombre: '', miembros: ['u_diego', 'u_valeria'], fijado: null, mensajes: [{ u: 'u_valeria', t: 'Va, nos vemos en la biblio', f: haceMin(50) }] },
    { id: 'ch_sofia', tipo: 'dm', nombre: '', miembros: ['u_diego', 'u_sofia'], fijado: null, mensajes: [{ u: 'u_sofia', t: 'Te mandé mi playlist para estudiar', f: haceMin(60 * 30) }] }
  ];
  const agenda = [
    { id: 'ag1', u: 'u_diego', titulo: 'Examen de Cálculo II', tipo: 'Examen', fecha: masTarde(3), hora: '09:00', lugar: 'C-204', hecho: false },
    { id: 'ag2', u: 'u_diego', titulo: 'Reporte de práctica de Física', tipo: 'Entrega', fecha: masTarde(5), hora: '23:59', lugar: '', hecho: false },
    { id: 'ag3', u: 'u_diego', titulo: 'Empezar el Proyecto Integrador', tipo: 'Proyecto', fecha: masTarde(18), hora: '', lugar: '', hecho: false }
  ];
  const niveles = [
    { id: 'of1', nombre: 'Nivel 1 · Primeras derivadas', autor: 'u_equipo', oficial: true, ids: ['deriv-poli', 'deriv-poli', 'deriv-seno', 'deriv-poli', 'deriv-seno'], likes: 512, likers: [], jugadas: 1840 },
    { id: 'of2', nombre: 'Nivel 2 · Límites sin miedo', autor: 'u_equipo', oficial: true, ids: ['lim-directo', 'lim-factor', 'lim-directo', 'lim-factor', 'lim-lhopital'], likes: 388, likers: [], jugadas: 1210 },
    { id: 'of3', nombre: 'Nivel 3 · La regla de la cadena', autor: 'u_equipo', oficial: true, ids: ['deriv-cadena', 'deriv-producto', 'deriv-cadena', 'deriv-exp', 'deriv-cadena'], likes: 301, likers: [], jugadas: 860 },
    { id: 'of4', nombre: 'Nivel 4 · Integrales', autor: 'u_equipo', oficial: true, ids: ['int-potencia', 'int-potencia', 'int-definida', 'int-partes', 'int-definida'], likes: 247, likers: [], jugadas: 640 },
    { id: 'c1', nombre: 'Derivadas del infierno', autor: 'u_mariana', oficial: false, ids: ['deriv-producto', 'deriv-exp', 'deriv-cadena', 'deriv-exp', 'deriv-producto'], likes: 342, likers: [], jugadas: 977 },
    { id: 'c2', nombre: 'Calentamiento para el parcial', autor: 'u_diego', oficial: false, ids: ['deriv-poli', 'lim-directo', 'int-potencia', 'lim-factor', 'deriv-seno'], likes: 198, likers: [], jugadas: 705 },
    { id: 'c3', nombre: 'Solo para valientes', autor: 'u_luis', oficial: false, ids: ['lim-lhopital', 'int-partes', 'deriv-exp', 'int-partes', 'lim-lhopital'], likes: 156, likers: [], jugadas: 289 }
  ];
  return { version: 3, sesion: null, usuarios, profes: lista, posts, propuestas, rankings, eventos, ventas, chats, agenda, niveles,
    notifs: [], reportes: [], libro: [], interesEventos: {}, alertasCerradas: {}, semilla: true };
}
window.REGLAS = REGLAS;
