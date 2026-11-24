'use strict';

function seccionHorarioPerfil(u, mio) {
  if (!DB.puedeVerHorario(u.id)) return '';
  const clases = normalizarHorario(u), hay = clases.some(c => (c.sesiones || []).length);
  if (!hay) return mio ? `<a href="#/horario" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit;border:1.5px dashed var(--linea);box-shadow:none">${icono('agenda', 22)}<span style="flex:1"><b>Arma tu horario</b><br><span class="mini gris">Aparece aquí en tu perfil. Tú decides quién lo ve.</span></span></a>` : '';
  const plegado = horarioPlegado(), n = clases.filter(c => (c.sesiones || []).length).length, dias = new Set(clases.flatMap(c => (c.sesiones || []).map(x => x.d))).size;
  return `<section class="tarjeta"><div class="entre"><h2 class="titulo-plegable" data-dbl="plegarHorarioPerfil" title="Doble clic para ${plegado ? 'expandir' : 'contraer'}">${mio ? 'Mi horario' : 'Su horario'}</h2><a class="btn3" style="min-height:36px;padding:0 12px" href="#/horario${mio ? '' : '/' + esc(u.usuario)}">${mio ? 'Editar' : 'Ver completo'}</a></div>
    <p class="mini gris" style="margin:2px 0 0">${n} materia${n === 1 ? '' : 's'} · ${dias} día${dias === 1 ? '' : 's'}${mio ? ` · ${u.horarioVis === 'elegidos' && (u.horarioCompartido || []).length ? `lo ven ${u.horarioCompartido.length} persona${u.horarioCompartido.length > 1 ? 's' : ''} que elegiste` : 'solo tú lo ves'}` : ''}</p>
    ${plegado ? '' : `<div style="margin-top:10px">${tablaHorario(clases, false, false)}</div>`}</section>`;
}
const horarioPlegado = () => { try { return localStorage.getItem('itinor_horario_plegado') === '1'; } catch { return false; } };
document.addEventListener('dblclick', e => { const el = e.target.closest?.('[data-dbl]'); if (!el) return; e.preventDefault(); window.getSelection?.()?.removeAllRanges(); ACC[el.dataset.dbl]?.(el); });
ACC.plegarHorarioPerfil = () => { try { localStorage.setItem('itinor_horario_plegado', horarioPlegado() ? '0' : '1'); } catch {} refrescar(); };

function menuCancion(i) {
  const u = DB.yo(), c = DB.canciones(u)[+i]; if (!c?.archivo) return;
  const es = u.fondoMusica === c.archivo;
  abrirHoja(`<h2>${esc(c.titulo)}</h2><p class="peq gris">La música de fondo suena a volumen moderado cuando alguien entra a tu perfil y se detiene cuando se va. Cada quien la puede apagar en sus ajustes.</p>
    <div class="pila"><button class="btn ancho" data-a="fondoCancion" data-i="${i}">${es ? 'Quitar de fondo' : 'Poner de fondo en mi perfil'}</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
}
ACC.fondoCancion = b => { const u = DB.yo(), c = DB.canciones(u)[+b.dataset.i]; u.fondoMusica = u.fondoMusica === c.archivo ? null : c.archivo; DB.guardar(); cerrarHoja(); aviso(u.fondoMusica ? 'Ahora suena de fondo en tu perfil' : 'Tu perfil ya no tiene música de fondo'); refrescar(); };
document.addEventListener('contextmenu', e => { const el = e.target.closest?.('[data-menu-cancion]'); if (!el) return; e.preventDefault(); menuCancion(el.dataset.menuCancion); });
(() => { let t = null, x0 = 0, y0 = 0;
  document.addEventListener('pointerdown', e => { const el = e.target.closest?.('[data-menu-cancion]'); if (!el || e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; t = setTimeout(() => { t = null; menuCancion(el.dataset.menuCancion); }, 550); });
  const cancelar = () => { clearTimeout(t); t = null; };
  document.addEventListener('pointerup', cancelar); document.addEventListener('pointercancel', cancelar);
  document.addEventListener('pointermove', e => { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancelar(); });
})();

const PAPELES = ['#FFF3A6', '#FFD3E2', '#CDEBFF', '#D5F5D0', '#FFFFFF'];
const MAX_NOTITAS = 40, MAX_POR_PERSONA = 3;
DB.puedeDejarNotita = function (dueno, quien = DB.yo()?.id) {
  const u = DB.usuario(dueno); if (!u || dueno === quien) return false;
  if ((u.bloqueados || []).includes(quien)) return false;
  const p = u.privacidad?.notitas || 'todos'; return p === 'todos' || (p === 'amigos' && DB.sonAmigos(dueno, quien));
};
function capaNotitas(u, mio) {
  const l = (u.notitas || []).filter(n => DB.usuario(n.de));
  const notas = UI.ocultarNotitas ? '' : l.map(n => `<button class="notita" data-a="verNotita" data-u="${u.id}" data-id="${esc(n.id)}" style="left:${Math.max(0, Math.min(88, +n.x || 0))}%;top:${Math.max(0, +n.y || 0)}px;background:${PAPELES.includes(n.color) ? n.color : PAPELES[0]};--rot:${Math.max(-180, Math.min(180, +n.rot || 0))}deg" aria-label="Notita de @${esc(DB.usuario(n.de)?.usuario || '')}">${n.img && /^data:image\/png;base64,/.test(n.img) ? `<img src="${n.img}" alt="">` : `<span>${esc(n.t || '')}</span>`}</button>`).join('');
  return `<div class="capa-notitas" aria-label="Notitas">${notas}</div>`;
}
function barraNotitas(u, mio) {
  const l = (u.notitas || []).filter(n => DB.usuario(n.de)), puede = !mio && DB.puedeDejarNotita(u.id);
  if (!puede && !l.length) return '';
  return `<div class="notitas-barra fila">${puede ? `<button class="btn" style="min-height:40px" data-a="dejarNotita" data-u="${u.id}">${icono('lapiz', 16)}Dejar notita</button>` : ''}${l.length ? `<button class="btn3" style="min-height:40px" data-a="ocultarNotitas">${UI.ocultarNotitas ? 'Ver' : 'Ocultar'} notitas · ${l.length}</button>` : ''}${mio && l.length ? `<button class="btn3" style="min-height:40px" data-a="limpiarNotitas" title="Alt + L">Limpiar</button>` : ''}</div>`;
}
function montarNotitas() {  }
ACC.ocultarNotitas = () => { UI.ocultarNotitas = !UI.ocultarNotitas; refrescar(); };

ACC.dejarNotita = b => {
  if (!DB.puedeDejarNotita(b.dataset.u)) return aviso('No puedes dejar notitas en este perfil.');
  UI.colocando = b.dataset.u; document.body.classList.add('colocando-notita'); aviso('Toca donde quieras pegar tu notita');
};
document.addEventListener('click', e => {
  if (!UI.colocando) return; const raiz = $('#perfilRaiz'); if (!raiz) { UI.colocando = null; document.body.classList.remove('colocando-notita'); return; }
  if (e.target.closest('.notitas-barra')) return;
  e.preventDefault(); e.stopPropagation();
  const r = raiz.getBoundingClientRect(), x = Math.max(0, Math.min(88, (e.clientX - r.left) / r.width * 100 - 6)), y = Math.max(0, e.clientY - r.top - 40);
  const dueno = UI.colocando; UI.colocando = null; document.body.classList.remove('colocando-notita');
  hojaNotita(dueno, x, y);
}, true);
function hojaNotita(dueno, x, y) {
  UI.notita = { dueno, x, y, modo: 'dibujar', color: PAPELES[0], tinta: '#1B1530', rot: 0 };
  abrirHoja(`<form class="pila" data-form="pegarNotita"><h2>Tu notita para @${esc(DB.usuario(dueno).usuario)}</h2>
    <div class="pestanas"><button type="button" class="pastilla on" data-a="modoNotita" data-m="dibujar">Dibujar</button><button type="button" class="pastilla" data-a="modoNotita" data-m="escribir">Escribir</button></div>
    <div id="zonaNotita"><canvas id="lienzoNotita" width="480" height="480" class="lienzo-notita" style="background:${PAPELES[0]}"></canvas>
      <div class="entre" style="margin-top:6px"><span class="fila" style="gap:6px">${['#1B1530', '#C0262D', '#1D5FD0', '#14803C'].map((c, i) => `<button type="button" class="punto-color${i ? '' : ' on'}" style="background:${c}" data-a="tintaNotita" data-c="${c}" aria-label="Tinta"></button>`).join('')}</span><button type="button" class="btn3" style="min-height:36px" data-a="borrarLienzo">Borrar</button></div></div>
    <div id="zonaTexto" hidden><label class="oculto" for="ntx">Texto</label><textarea id="ntx" name="t" maxlength="140" rows="4" placeholder="Algo bonito… o algo estúpido"></textarea></div>
    <div><span class="campo">Papel</span><div class="fila" style="gap:6px">${PAPELES.map((c, i) => `<button type="button" class="punto-color${i ? '' : ' on'}" style="background:${c};border:1px solid var(--linea)" data-a="papelNotita" data-c="${c}" aria-label="Papel"></button>`).join('')}</div></div>
    <div><label class="campo fila" for="nrot" style="gap:10px">Orientación <span id="notaPrev" class="nota-prev" aria-hidden="true"></span><span class="mini gris" id="nrotv">0°</span></label><div class="fila" style="flex-wrap:nowrap;gap:8px"><input id="nrot" type="range" min="-180" max="180" step="5" value="0" data-entrada="rotNotita" style="flex:1"><button type="button" class="btn3" style="min-height:36px;padding:0 10px" data-a="rotNotita" data-v="-90">↺</button><button type="button" class="btn3" style="min-height:36px;padding:0 10px" data-a="rotNotita" data-v="90">↻</button><button type="button" class="btn3" style="min-height:36px;padding:0 10px" data-a="rotNotita" data-v="0">Derecha</button></div></div>
    <button class="btn ancho">Pegar notita</button></form>`);
  prepararLienzo();
}
function prepararLienzo() {
  const cv = $('#lienzoNotita'); if (!cv) return; const cx = cv.getContext('2d'); cx.lineCap = cx.lineJoin = 'round'; let dibujando = false, ult = null; UI.notita.trazos = 0;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => { dibujando = true; ult = pos(e); cv.setPointerCapture(e.pointerId); UI.notita.trazos++; });
  cv.addEventListener('pointermove', e => { if (!dibujando) return; const p = pos(e), pr = e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5;
    cx.strokeStyle = UI.notita.tinta; cx.lineWidth = 3 + pr * 8; cx.beginPath(); cx.moveTo(...ult); cx.lineTo(...p); cx.stroke(); ult = p; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => { dibujando = false; }));
}
ACC.modoNotita = b => { UI.notita.modo = b.dataset.m; $$('[data-a=modoNotita]').forEach(x => x.classList.toggle('on', x === b)); $('#zonaNotita').hidden = b.dataset.m !== 'dibujar'; $('#zonaTexto').hidden = b.dataset.m !== 'escribir'; if (b.dataset.m === 'escribir') $('#ntx')?.focus(); };
ACC.tintaNotita = b => { UI.notita.tinta = b.dataset.c; $$('[data-a=tintaNotita]').forEach(x => x.classList.toggle('on', x === b)); };
ACC.papelNotita = b => { UI.notita.color = b.dataset.c; const np = $('#notaPrev'); if (np) np.style.background = b.dataset.c; $$('[data-a=papelNotita]').forEach(x => x.classList.toggle('on', x === b)); const cv = $('#lienzoNotita'); if (cv) cv.style.background = b.dataset.c; };
function girarNotita(v) { v = Math.max(-180, Math.min(180, Math.round(v / 5) * 5)); UI.notita.rot = v; const r = $('#nrot'); if (r) r.value = v; const t = $('#nrotv'); if (t) t.textContent = v + '°'; const p = $('#notaPrev'); if (p) p.style.transform = `rotate(${v}deg)`; }
ENTRADAS.rotNotita = el => girarNotita(+el.value);
ACC.rotNotita = b => girarNotita(+b.dataset.v === 0 ? 0 : (((UI.notita.rot + +b.dataset.v + 180) % 360 + 360) % 360) - 180);
ACC.borrarLienzo = () => { const cv = $('#lienzoNotita'); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); UI.notita.trazos = 0; };
FORMS.pegarNotita = d => {
  const n = UI.notita, u = DB.usuario(n.dueno), yo = DB.yo().id; if (!u || !DB.puedeDejarNotita(u.id)) return;
  let img = null, t = '';
  if (n.modo === 'dibujar') { if (!n.trazos) return aviso('Dibuja algo primero.');
    const cv = $('#lienzoNotita'), ch = document.createElement('canvas'); ch.width = ch.height = 200; ch.getContext('2d').drawImage(cv, 0, 0, 200, 200); img = ch.toDataURL('image/png'); }
  else { t = String(d.t || '').trim().slice(0, 140); if (!t) return aviso('Escribe algo.'); }
  u.notitas = u.notitas || [];
  const mias = u.notitas.filter(x => x.de === yo);
  if (mias.length >= MAX_POR_PERSONA) u.notitas = u.notitas.filter(x => x !== mias[0]);
  if (u.notitas.length >= MAX_NOTITAS) u.notitas.shift();
  u.notitas.push({ id: uid('nt'), de: yo, x: Math.round(n.x * 10) / 10, y: Math.round(n.y), color: n.color, rot: n.rot, t, img, f: new Date().toISOString() });
  notificar(u.id, `@${DB.yo().usuario} te dejó una notita en tu perfil`, '#/perfil');
  DB.guardar(); cerrarHoja(); aviso('Notita pegada'); refrescar();
};
ACC.verNotita = b => {
  const u = DB.usuario(b.dataset.u), n = (u?.notitas || []).find(x => x.id === b.dataset.id); if (!n) return;
  const yo = DB.yo().id, puedeQuitar = u.id === yo || n.de === yo || DB.esAdmin();
  abrirHoja(`<div class="notita-grande" style="background:${PAPELES.includes(n.color) ? n.color : PAPELES[0]}">${n.img ? `<img src="${n.img}" alt="Dibujo">` : `<p>${esc(n.t)}</p>`}</div>
    <p class="peq gris" style="text-align:center">De <a href="#/perfil/${esc(DB.usuario(n.de)?.usuario || '')}">@${esc(DB.usuario(n.de)?.usuario || '')}</a> · ${hace(n.f)}</p>
    <div class="pila">${puedeQuitar ? `<button class="btn-peligro ancho" data-a="quitarNotita" data-u="${u.id}" data-id="${esc(n.id)}">Quitar notita</button>` : ''}${u.id === yo && n.de !== yo ? `<button class="btn3 ancho" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-ref="${n.de}" data-quien="${n.de}">${icono('bandera', 16)}Reportar</button>` : ''}<button class="btn3 ancho" data-a="cerrarHoja">Cerrar</button></div>`);
};
ACC.quitarNotita = b => { const u = DB.usuario(b.dataset.u); u.notitas = (u.notitas || []).filter(x => x.id !== b.dataset.id); DB.guardar(); cerrarHoja(); refrescar(); };
ACC.limpiarNotitas = () => { const u = DB.yo(); if (!(u.notitas || []).length) return aviso('No tienes notitas.'); if (!confirm('¿Quitar todas las notitas de tu perfil?')) return; u.notitas = []; DB.guardar(); aviso('Perfil limpio'); refrescar(); };

document.addEventListener('keydown', e => { if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) { const r = ruta(); if (r.nombre === 'perfil' && (!r.params[0] || r.params[0] === DB.yo()?.usuario)) { e.preventDefault(); ACC.limpiarNotitas(); } } if (e.key === 'Escape' && UI.colocando) { UI.colocando = null; document.body.classList.remove('colocando-notita'); } });

const AYUDA = [
  ['candado', 'Chats cifrados', `<p>Tus mensajes y archivos van <b>cifrados de punta a punta</b>: se cifran en tu celular y solo se descifran en el de la otra persona. El servidor solo guarda texto revuelto; ni el admin los puede leer.</p>
    <ul><li>La primera vez en cada dispositivo te pedimos tu contraseña para abrir tus chats.</li><li><b>Código de seguridad:</b> en Opciones del chat. Compárenlo en persona; si coincide, márquenlo como verificado. Si su llave cambia, te avisamos.</li><li><b>Bloquear chats en este dispositivo:</b> úsalo en computadoras prestadas o de la uni.</li><li>Si olvidas tu contraseña, nadie puede recuperar tus mensajes viejos. Así funciona el cifrado de verdad.</li></ul>`],
  ['bandera', 'Seguridad: la capa 8', `<p>La mayoría de los hackeos no rompen el cifrado: engañan a la persona. Reglas de la madriguera:</p>
    <ul><li>Nadie de Itinor ni de la uni te va a pedir tu contraseña, NIP, códigos de verificación ni datos de tarjeta. Nunca.</li><li>Si un mensaje lleva prisa, miedo o premio ("tu cuenta se cierra hoy", "ganaste"), desconfía.</li><li>No reutilices la contraseña de tu correo de la uni ni la del banco. Usa una frase larga.</li><li>Antes de abrir un archivo de alguien que no conoces, pregúntale por otro medio.</li><li>Cierra sesión en computadoras que no son tuyas.</li><li>Si ves algo raro, repórtalo desde el perfil o el chat.</li></ul>
    <p class="peq gris">Si intentas mandar algo que parece contraseña, NIP o tarjeta, la app te pregunta antes de enviarlo.</p>`],
  ['agenda', 'Horario', `<ul><li><b>Agregar clase:</b> materia, días y hora de inicio y fin. Puedes poner varios horarios por materia.</li><li><b>Color:</b> elige de la paleta o toca la rueda de colores para el que quieras.</li><li><b>Buscar mi grupo:</b> escribe tu grupo (como 3G2) y agrega todas sus materias con horario, salón y profesor de un toque. También puedes buscar una materia suelta, una clave o un profesor.</li><li><b>Leer de PDF o foto:</b> intenta leer tu horario de la uni; revisa lo que leyó antes de guardar.</li><li><b>Tu semana en números:</b> horas de clase, horas muertas, hueco más largo… y "Marcar huecos" los pinta en el horario.</li><li><b>En tu perfil:</b> dale doble clic (o doble toque) al título "Mi horario" para contraerlo o expandirlo.</li><li><b>Quién lo ve:</b> solo tú o las personas que elijas. Si lo pueden ver, también aparece en tu perfil.</li></ul>`],
  ['musica', 'Música del perfil', `<ul><li>Sube hasta 8 canciones o enlaces de YouTube, Spotify o Apple Music desde Editar perfil.</li><li><b>Música de fondo:</b> en tu perfil, haz <b>clic derecho</b> sobre una canción (en el celular, <b>mantén presionado</b>) y elige "Poner de fondo". El volumen será moderado cuando ingresen a tu perfil.</li><li>Si no quieres oír la música de fondo de otros: Ajustes → "No reproducir la música de fondo de otros perfiles".</li><li>El reproductor de abajo tiene modos: aleatorio, en orden, por fecha de subida y repetir.</li></ul>`],
  ['lapiz', 'Notitas', `<ul><li>En el perfil de alguien toca <b>Dejar notita</b> y luego toca el lugar exacto donde la quieres pegar.</li><li>Puedes <b>dibujarla</b> con el dedo, el mouse o un lápiz táctil (con lápiz, la presión cambia el grosor) o <b>escribirla</b>, y girarla a la orientación que quieras (de cabeza, de lado…).</li><li>Máximo ${MAX_POR_PERSONA} notitas tuyas por perfil; si pegas otra, se quita tu más vieja.</li><li><b>En tu perfil:</b> toca una notita para verla, quitarla o reportarla. <b>Limpiar</b> (o <b>Alt + L</b> en la computadora) quita todas.</li><li>Decide quién te puede dejar notitas en Ajustes → Privacidad.</li></ul>`],
  ['rayo', 'Ramitas y juegos', `<ul><li>Las ramitas son puntos de la app, no dinero.</li><li>Los juegos diarios dan ramitas y mantienen tu racha; los de "Para relajarse" son libres y sin ramitas.</li></ul>`]
];
VISTAS.ayuda = {
  titulo: 'Ayuda', nav: 'pregunta',
  render() { return `<div class="pila"><p class="gris" style="margin:0">Cómo funciona cada cosa. Toca un tema para abrirlo.</p>
    ${AYUDA.map(([ic, t, html], i) => `<details class="tarjeta ayuda"${i === 0 && !UI.ayudaVista ? ' open' : ''}><summary class="fila" style="flex-wrap:nowrap">${icono(ic, 20)}<b style="flex:1">${t}</b></summary><div class="ayuda-cuerpo">${html}</div></details>`).join('')}</div>`; },
  montar() { UI.ayudaVista = true; }
};
