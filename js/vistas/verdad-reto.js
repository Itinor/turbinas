'use strict';
const VR_MAX = 5, VR_GIRO_MS = 4200;
const VR_MAZOS = {
  uni: { nombre: 'La uni', tipo: 'verdad', l: ['¿Cuántas materias llevas reprobadas?', '¿Cuál es el profe que peor te cae?', '¿Cuál es tu profe favorito?', '¿Cuál es el profe que no soportas pero que enseña muy bien?', '¿Cuál es ese profe que te cae muy bien pero no enseña nada?', '¿Te darías de baja de la universidad?', '¿Cuál ha sido tu peor calificación y en qué materia?', '¿Alguna vez te has dormido en clase?', '¿Cuál es la excusa más inventada que has dado para no entregar una tarea?', '¿Has copiado en un examen?', '¿Qué materia te arrepientes de haber metido?', '¿Por qué elegiste tu carrera, de verdad?', 'Si pudieras cambiar de carrera hoy, ¿a cuál te irías?', '¿Quién de aquí crees que va a terminar primero la carrera?', '¿Has llegado tarde a un examen? ¿Qué pasó?', '¿Cuál es tu hueco favorito y qué haces en él?', '¿Qué comida de la cafetería no volverías a comprar?', '¿Con quién de aquí harías equipo para el proyecto final y con quién nunca?', '¿Cuál es tu mayor miedo de la carrera?', '¿Qué es lo más vergonzoso que te ha pasado en la uni?', '¿A quién de aquí le pedirías ayuda para un examen final?', '¿Cuántas horas estudiaste para tu último examen? Sin mentir.'] },
  personal: { nombre: 'Personales', tipo: 'verdad', l: ['¿Quién te gusta?', '¿Tienes novi@?', 'Si tuvieras que prestarme 500,000 pesos, ¿me los prestarías?', '¿Qué es lo último que buscaste en Google?', '¿Has stalkeado a alguien del salón?', '¿Cuál es tu mayor manía?', '¿Qué es lo más caro que has comprado por impulso?', '¿Qué canción escuchas cuando nadie te ve?', '¿Cuál fue tu peor cita?', '¿A quién de aquí le contarías un secreto?', '¿Qué app usas más y cuántas horas al día?', '¿Cuál es tu talento oculto?'] },
  retos: { nombre: 'Retos', tipo: 'reto', l: ['Explica un tema de tu última clase en 30 segundos como si fueras el profe.', 'Imita a un profe (sin decir quién es) hasta que adivinen.', 'Habla con acento durante las próximas 2 rondas.', 'Deja una notita en el perfil de alguien de la sala.', 'Haz 10 sentadillas.', 'Di un trabalenguas 3 veces rápido sin equivocarte.', 'Pon de música de fondo en tu perfil la canción que elija la sala, por un día.', 'Escribe un poema de 4 versos sobre tu materia más difícil.', 'Durante 3 rondas responde solo con preguntas.', 'Cuenta un chiste malo. Si nadie se ríe, cuenta otro.', 'Comparte tu horario con alguien de la sala por un día.', 'Di 3 cosas buenas de la persona que sigue en la rueda.', 'Inventa una materia nueva y explica de qué trata en 20 segundos.', 'Quédate como estatua hasta tu siguiente turno.', 'Cambia tu bio de Itinor por la que elija la sala, por una hora.', 'Resuelve un reto de la app sin calculadora frente a todos.', 'Enseña la última captura de pantalla que tomaste (si no hay nada privado).', 'Canta el coro de una canción que elija la sala.'] }
};
DB.misSalasVR = () => (DB.estado.salasVR || []).filter(s => s.estado !== 'terminada' && (s.host === DB.yo().id || (s.invitados || []).includes(DB.yo().id)));
const vrSala = id => (DB.estado.salasVR || []).find(s => s.id === id);
const vrJugadores = s => [s.host, ...(s.aceptados || [])].filter((x, i, a) => a.indexOf(x) === i && DB.usuario(x));
UI.vrVisto = {};

VISTAS.vr = {
  titulo: ([id]) => id ? 'Verdad o reto' : 'Verdad o reto', nav: 'juegos', get atras() { return ruta().params[0] ? '#/vr' : '#/juegos'; },
  render([id]) { return id ? vrVistaSala(id) : vrLista(); },
  montar([id]) { if (id) vrProgramar(id); }
};
function vrLista() {
  const yo = DB.yo().id, salas = DB.misSalasVR(), inv = salas.filter(s => s.host !== yo && !(s.aceptados || []).includes(yo) && !(s.rechazados || []).includes(yo)), mias = salas.filter(s => !inv.includes(s) && !(s.rechazados || []).includes(yo));
  return `<div class="pila"><section class="tarjeta vr-portada"><div class="vr-botella-mini" aria-hidden="true">${svgBotella(56)}</div><div><h2 style="margin:0">Verdad o reto</h2><p class="peq" style="margin:4px 0 0">Invita de 1 a ${VR_MAX - 1} personas. La botella gira y a quien apunte elige: verdad o reto.</p></div></section>
    <button class="btn ancho" data-a="vrCrear">${icono('mas', 18)}Crear sala</button>
    ${inv.length ? `<section class="tarjeta"><h2 style="margin-bottom:8px">Te invitaron</h2>${inv.map(s => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span><b class="peq">Sala de ${esc(nombreVisible(s.host))}</b><br><span class="mini gris">${vrJugadores(s).length} adentro · ${hace(s.f)}</span></span><span class="fila" style="gap:6px"><button class="btn2" style="min-height:36px" data-a="vrResponder" data-id="${s.id}" data-si="1">Entrar</button><button class="btn3" style="min-height:36px" data-a="vrResponder" data-id="${s.id}">No</button></span></div>`).join('')}</section>` : ''}
    ${mias.length ? `<section class="tarjeta"><h2 style="margin-bottom:8px">Tus salas</h2>${mias.map(s => `<a href="#/vr/${s.id}" class="entre" style="padding:10px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit"><span><b class="peq">${s.host === yo ? 'Tu sala' : 'Sala de ' + esc(nombreVisible(s.host))}</b><br><span class="mini gris">${vrJugadores(s).map(nombreVisible).map(esc).join(', ')}</span></span><span class="insignia ${s.estado === 'jugando' ? 'i-verde' : 'i-amarillo'}">${s.estado === 'jugando' ? 'Jugando' : 'Esperando'}</span></a>`).join('')}</section>` : ''}</div>`;
}
ACC.vrCrear = () => {
  const u = DB.yo(), gente = Object.values(DB.estado.usuarios).filter(p => p.id !== u.id && p.id !== 'u_equipo' && !p.suspendido).sort((a, b) => (u.amigos.includes(b.id) - u.amigos.includes(a.id)) || a.usuario.localeCompare(b.usuario));
  abrirHoja(`<form class="pila" data-form="vrCrear"><h2>¿A quién invitas?</h2><p class="mini gris" style="margin:0">De 1 a ${VR_MAX - 1} personas.</p>
    <input placeholder="Buscar…" data-entrada="vrFiltro" aria-label="Buscar personas"><div class="pila" id="vrGente" style="gap:2px;max-height:38vh;overflow:auto">${gente.map(p => `<label class="fila vr-persona" data-n="${esc(p.usuario)}" style="flex-wrap:nowrap;padding:6px 4px;border-bottom:1px solid var(--linea)"><input type="checkbox" name="u_${p.id}" data-cambio="vrLimite"> ${avatar(p.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span>@${esc(p.usuario)}${u.amigos.includes(p.id) ? ' <span class="mini gris">· amigo</span>' : ''}</span></label>`).join('')}</div>
    <div><span class="campo">Preguntas</span><div class="fila" style="gap:6px">${Object.entries(VR_MAZOS).map(([k, m]) => `<label class="pastilla" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" name="m_${k}" checked> ${m.nombre}</label>`).join('')}</div><p class="mini gris" style="margin:4px 0 0">En la sala cada quien puede agregar sus propias preguntas y retos.</p></div>
    <button class="btn ancho">Crear e invitar</button></form>`);
};
ENTRADAS.vrFiltro = el => { const q = el.value.trim().toLowerCase().replace(/^@/, ''); $$('.vr-persona').forEach(l => { l.style.display = !q || l.dataset.n.includes(q) ? '' : 'none'; }); };
CAMBIOS.vrLimite = el => { const n = $$('#vrGente input:checked').length; if (n > VR_MAX - 1) { el.checked = false; aviso(`Máximo ${VR_MAX} jugadores contándote.`); } };
FORMS.vrCrear = d => {
  const ids = Object.keys(d).filter(k => k.startsWith('u_')).map(k => k.slice(2)).slice(0, VR_MAX - 1), mazos = Object.keys(VR_MAZOS).filter(k => d['m_' + k]);
  if (!ids.length) return aviso('Invita al menos a una persona.'); if (!mazos.length) return aviso('Elige al menos un tipo de preguntas.');
  const s = { id: uid('vr'), host: DB.yo().id, invitados: ids, aceptados: [], rechazados: [], mazos, propias: [], usadas: [], estado: 'esperando', f: new Date().toISOString(), angulo: 0, anguloPrev: 0, ronda: null, historial: [] };
  (DB.estado.salasVR = DB.estado.salasVR || []).push(s);
  ids.forEach(i => notificar(i, `@${DB.yo().usuario} te invitó a jugar Verdad o reto`, '#/vr'));
  DB.guardar(); cerrarHoja(); ir('#/vr/' + s.id);
};
ACC.vrResponder = b => { const s = vrSala(b.dataset.id), yo = DB.yo().id; if (!s) return;
  if (b.dataset.si) { if (vrJugadores(s).length >= VR_MAX) return aviso('La sala ya está llena.'); s.aceptados = [...new Set([...(s.aceptados || []), yo])]; notificar(s.host, `@${DB.yo().usuario} entró a tu sala de Verdad o reto`, '#/vr/' + s.id); DB.guardar(); ir('#/vr/' + s.id); }
  else { s.rechazados = [...new Set([...(s.rechazados || []), yo])]; DB.guardar(); refrescar(); } };

function svgBotella(t = 120) {
  return `<svg width="${t}" height="${t}" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="vrVidrio" x1="0" x2="1"><stop offset="0" stop-color="#1E7B4A"/><stop offset=".45" stop-color="#3FBF7F"/><stop offset="1" stop-color="#145C36"/></linearGradient></defs>
    <path d="M44 6h12v6l-1 2v16c0 4 13 10 13 24v34c0 5-4 8-9 8H41c-5 0-9-3-9-8V54c0-14 13-20 13-24V14l-1-2z" fill="url(#vrVidrio)" stroke="#0E3F25" stroke-width="2"/>
    <rect x="43" y="3" width="14" height="6" rx="2" fill="#C99A3B" stroke="#7A5A16" stroke-width="1.5"/><rect x="37" y="56" width="26" height="20" rx="3" fill="#FFF6DA" opacity=".9"/><path d="M41 22c-2 6-4 9-5 14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/></svg>`;
}
function vrVistaSala(id) {
  const s = vrSala(id), yo = DB.yo().id; if (!s || !(s.host === yo || (s.invitados || []).includes(yo))) return '<p class="vacio">Esta sala no existe o no estás invitado.</p>';
  const J = vrJugadores(s), dentro = J.includes(yo), r = s.ronda, n = J.length;
  if (!dentro && s.estado !== 'terminada') return `<div class="tarjeta" style="text-align:center"><h2>Sala de ${esc(nombreVisible(s.host))}</h2><button class="btn" data-a="vrResponder" data-id="${s.id}" data-si="1">Entrar</button></div>`;
  const giro = r && UI.vrVisto[r.id] ? Date.now() - UI.vrVisto[r.id] : VR_GIRO_MS, girando = r && giro < VR_GIRO_MS, listo = r && !girando;
  const elegido = r && r.elegido, turno = s.estado === 'jugando' && (r ? (r.estado === 'hecho' && elegido === yo) : s.host === yo);
  const asientos = J.map((u, i) => { const a = (i / n) * 2 * Math.PI, x = 50 + 41 * Math.sin(a), y = 50 - 41 * Math.cos(a); return `<div class="vr-asiento${listo && elegido === u ? ' on' : ''}" style="left:${x}%;top:${y}%">${avatar(u).replace('<a ', '<span ').replace('</a>', '</span>')}<span>${esc(nombreVisible(u))}</span></div>`; }).join('');
  const dt = r ? Math.min(giro, VR_GIRO_MS) : 0;
  const botella = `<div class="vr-botella${girando ? ' girando' : ''}" style="--desde:${s.anguloPrev || 0}deg;--hasta:${s.angulo || 0}deg;${girando ? `animation-delay:-${dt}ms` : `transform:translate(-50%,-50%) rotate(${s.angulo || 0}deg)`}">${svgBotella(120)}</div>`;
  const pregunta = r?.pregunta ? `<div class="vr-carta ${r.tipo}"><span class="etiqueta">${r.tipo === 'verdad' ? 'Verdad' : 'Reto'} para ${esc(nombreVisible(elegido))}</span><p>${esc(r.pregunta)}</p>${r.respuesta ? `<p class="peq" style="margin:8px 0 0"><b>Respondió:</b> ${esc(r.respuesta)}</p>` : ''}${r.estado === 'hecho' ? `<span class="insignia ${r.paso ? 'i-amarillo' : 'i-verde'}">${r.paso ? 'Se lo pasó' : 'Cumplido'}</span>` : ''}</div>` : '';
  let accion = '';
  if (s.estado === 'esperando') accion = s.host === yo ? `<button class="btn ancho" data-a="vrEmpezar" data-id="${s.id}" ${n < 2 ? 'disabled' : ''}>${n < 2 ? 'Esperando a que entre alguien…' : 'Empezar'}</button>` : '<p class="peq gris" style="text-align:center">Esperando a que el anfitrión empiece…</p>';
  else if (girando) accion = '<p class="peq gris" style="text-align:center">Girando…</p>';
  else if (r && !r.tipo && elegido === yo) accion = `<div class="rejilla2"><button class="btn vr-verdad" data-a="vrElegir" data-id="${s.id}" data-t="verdad">Verdad</button><button class="btn vr-reto" data-a="vrElegir" data-id="${s.id}" data-t="reto">Reto</button></div>`;
  else if (r && !r.tipo) accion = `<p class="peq" style="text-align:center">Le tocó a <b>${esc(nombreVisible(elegido))}</b>. Está eligiendo…</p>`;
  else if (r && r.tipo && r.estado !== 'hecho' && elegido === yo) accion = `${r.tipo === 'verdad' ? `<form class="fila" style="flex-wrap:nowrap" data-form="vrResponder"><input type="hidden" name="id" value="${s.id}"><input name="t" maxlength="200" placeholder="Responde aquí (opcional)" aria-label="Respuesta"><button class="btn2">Listo</button></form>` : `<button class="btn ancho" data-a="vrHecho" data-id="${s.id}">¡Hecho!</button>`}<button class="btn3 ancho" data-a="vrHecho" data-id="${s.id}" data-paso="1">Me lo paso</button>`;
  else if (r && r.tipo && r.estado !== 'hecho') accion = `<p class="peq gris" style="text-align:center">Esperando a ${esc(nombreVisible(elegido))}…</p>`;
  if (turno && !girando) accion += `<button class="btn ancho" data-a="vrGirar" data-id="${s.id}">Girar la botella</button>`;
  else if (s.estado === 'jugando' && !girando && (!r || r.estado === 'hecho')) accion += `<p class="peq gris" style="text-align:center">Gira ${esc(nombreVisible(r ? elegido : s.host))}</p>`;
  return `<div class="pila">
    <div class="vr-mesa">${asientos}${botella}</div>
    ${listo || !r ? pregunta : ''}${accion}
    <details class="tarjeta"><summary class="peq" style="cursor:pointer"><b>Agregar una pregunta o reto</b> <span class="mini gris">· ${(s.propias || []).length} de la sala</span></summary>
      <form class="pila" style="gap:8px;margin-top:8px" data-form="vrPropia"><input type="hidden" name="id" value="${s.id}"><div class="pestanas"><label class="pastilla"><input type="radio" name="tipo" value="verdad" checked> Verdad</label><label class="pastilla"><input type="radio" name="tipo" value="reto"> Reto</label></div><input name="t" required maxlength="160" placeholder="¿Cuál fue tu peor examen?" aria-label="Pregunta o reto"><button class="btn2">Agregar</button></form></details>
    <section class="tarjeta"><h2 style="margin-bottom:6px">En la sala</h2>${[s.host, ...(s.invitados || [])].map(u => `<p class="fila peq" style="margin:4px 0;flex-wrap:nowrap">${avatar(u).replace('<a ', '<span ').replace('</a>', '</span>')}<span style="flex:1">${esc(nombreVisible(u))}${u === s.host ? ' <span class="mini gris">· anfitrión</span>' : ''}</span><span class="mini gris">${J.includes(u) ? 'adentro' : (s.rechazados || []).includes(u) ? 'no vino' : 'invitado'}</span></p>`).join('')}
      <div class="fila" style="margin-top:8px">${s.host === yo ? `<button class="btn-peligro" data-a="vrTerminar" data-id="${s.id}">Terminar sala</button>` : `<button class="btn3" data-a="vrSalir" data-id="${s.id}">Salir</button>`}</div></section>
    ${(s.historial || []).length ? `<details class="tarjeta"><summary class="peq" style="cursor:pointer"><b>Rondas anteriores</b> · ${s.historial.length}</summary>${s.historial.slice().reverse().slice(0, 30).map(h => `<p class="peq" style="margin:8px 0 0"><b>${esc(nombreVisible(h.u))}</b> · ${h.tipo === 'verdad' ? 'Verdad' : 'Reto'}${h.paso ? ' · se lo pasó' : ''}<br><span class="gris">${esc(h.p)}</span>${h.resp ? `<br>“${esc(h.resp)}”` : ''}</p>`).join('')}</details>` : ''}
  </div>`;
}
function vrProgramar(id) {
  const s = vrSala(id), r = s?.ronda; if (!r) return;
  if (!UI.vrVisto[r.id]) UI.vrVisto[r.id] = r.de === DB.yo().id ? Date.now() : (Date.now() - new Date(r.f).getTime() > 15000 ? Date.now() - VR_GIRO_MS : Date.now());
  const falta = VR_GIRO_MS - (Date.now() - UI.vrVisto[r.id]);
  clearTimeout(UI.vrTimer); if (falta > 0) UI.vrTimer = setTimeout(() => { if (ruta().nombre === 'vr' && ruta().params[0] === id) refrescar(); }, falta + 50);
}
ACC.vrEmpezar = b => { const s = vrSala(b.dataset.id); if (vrJugadores(s).length < 2) return; s.estado = 'jugando'; vrJugadores(s).forEach(u => u !== DB.yo().id && notificar(u, 'Empezó Verdad o reto', '#/vr/' + s.id)); DB.guardar(); refrescar(); };
ACC.vrGirar = b => {
  const s = vrSala(b.dataset.id), J = vrJugadores(s), n = J.length; if (n < 2) return aviso('Se necesitan al menos 2 personas.');
  const azarI = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  let i = Math.floor(azarI() * n); if (n > 2 && s.ronda && J[i] === s.ronda.elegido && azarI() < 0.6) i = (i + 1 + Math.floor(azarI() * (n - 1))) % n;
  if (s.ronda) (s.historial = s.historial || []).push({ u: s.ronda.elegido, tipo: s.ronda.tipo, p: s.ronda.pregunta, resp: s.ronda.respuesta || '', paso: !!s.ronda.paso });
  const actual = ((s.angulo || 0) % 360 + 360) % 360, destino = (i / n) * 360, delta = ((destino - actual) % 360 + 360) % 360;
  s.anguloPrev = s.angulo || 0; s.angulo = (s.angulo || 0) + 360 * (4 + Math.floor(azarI() * 3)) + delta;
  s.ronda = { id: uid('r'), elegido: J[i], de: DB.yo().id, f: new Date().toISOString(), tipo: null, pregunta: null, estado: 'eligiendo' };
  UI.vrVisto[s.ronda.id] = Date.now(); DB.guardar(); refrescar(); vrProgramar(s.id);
};
ACC.vrElegir = b => {
  const s = vrSala(b.dataset.id), t = b.dataset.t, r = s.ronda; if (!r || r.elegido !== DB.yo().id || r.tipo) return;
  const base = s.mazos.flatMap(k => VR_MAZOS[k].tipo === t ? VR_MAZOS[k].l : []), propias = (s.propias || []).filter(p => p.tipo === t).map(p => p.t);
  let pool = [...propias, ...base].filter(p => !(s.usadas || []).includes(p)); if (!pool.length) { s.usadas = (s.usadas || []).filter(p => ![...propias, ...base].includes(p)); pool = [...propias, ...base]; }
  if (!pool.length) return aviso(t === 'reto' ? 'No hay retos en esta sala. Agrega uno abajo.' : 'No hay verdades en esta sala. Agrega una abajo.');
  const fresh = pool.filter(p => propias.includes(p)), elegir = fresh.length && Math.random() < 0.5 ? fresh : pool;
  r.tipo = t; r.pregunta = elegir[Math.floor(Math.random() * elegir.length)]; r.estado = 'respondiendo'; (s.usadas = s.usadas || []).push(r.pregunta);
  DB.guardar(); refrescar();
};
FORMS.vrResponder = d => { const s = vrSala(d.id), r = s?.ronda; if (!r || r.elegido !== DB.yo().id) return; r.respuesta = String(d.t || '').trim().slice(0, 200); r.estado = 'hecho'; DB.guardar(); refrescar(); };
ACC.vrHecho = b => { const s = vrSala(b.dataset.id), r = s?.ronda; if (!r || r.elegido !== DB.yo().id) return; r.estado = 'hecho'; r.paso = !!b.dataset.paso; DB.guardar(); refrescar(); };
FORMS.vrPropia = d => { const s = vrSala(d.id); const t = String(d.t || '').trim(); if (!s || !t) return; (s.propias = s.propias || []).push({ id: uid('vp'), tipo: d.tipo === 'reto' ? 'reto' : 'verdad', t: t.slice(0, 160), de: DB.yo().id }); DB.guardar(); aviso('Agregada a la sala'); refrescar(); };
ACC.vrTerminar = b => { const s = vrSala(b.dataset.id); if (!confirm('¿Terminar la sala para todos?')) return; s.estado = 'terminada'; DB.guardar(); ir('#/vr'); };
ACC.vrSalir = b => { const s = vrSala(b.dataset.id), yo = DB.yo().id; s.aceptados = (s.aceptados || []).filter(x => x !== yo); s.rechazados = [...new Set([...(s.rechazados || []), yo])]; if (s.ronda && s.ronda.elegido === yo && s.ronda.estado !== 'hecho') { s.ronda.estado = 'hecho'; s.ronda.paso = true; s.ronda.elegido = s.host; } DB.guardar(); ir('#/vr'); };
