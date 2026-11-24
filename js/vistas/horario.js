'use strict';
const DIAS_H = [['lu', 'Lunes'], ['ma', 'Martes'], ['mi', 'Miércoles'], ['ju', 'Jueves'], ['vi', 'Viernes'], ['sa', 'Sábado']];
function diasDeClase(t) { const s = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); return DIAS_H.filter(([k]) => new RegExp('\\b' + k).test(s)).map(([k]) => k); }
DB.puedeVerHorario = function (dueno, quien = DB.yo()?.id) { const u = DB.usuario(dueno); if (!u) return false; if (dueno === quien) return true; return u.horarioVis === 'elegidos' && (u.horarioCompartido || []).includes(quien); };

VISTAS.horario = {
  titulo: ([n]) => n ? 'Horario de @' + n : 'Mi horario', nav: 'perfil', get atras() { const n = ruta().params[0]; return n ? '#/perfil/' + n : '#/perfil'; },
  render([n]) {
    const yo = DB.yo(), u = n ? DB.porUsuario(n) : yo; if (!u) return '<p class="vacio">No encontramos ese horario.</p>';
    const mio = u.id === yo.id;
    if (!DB.puedeVerHorario(u.id)) return `<div class="tarjeta" style="text-align:center">${avatar(u.id, true)}<h2 style="margin-top:10px">@${esc(u.usuario)}</h2><p class="gris">Su horario es privado.</p></div>`;
    const foto = u.horarioFoto, clases = normalizarHorario(u);
    return `<div class="pila">
      <section class="tarjeta"><div class="entre"><h2>Foto del horario</h2>${mio ? `<label class="btn3" style="cursor:pointer;min-height:40px;padding:0 12px">${icono('camara', 16)}${foto ? 'Cambiar' : 'Subir'}<input type="file" accept="image/*,.pdf" class="oculto" data-cambio="fotoHorario"></label>` : ''}</div>
        ${foto ? (/pdf/.test(foto.mime || '') ? `<button class="adj-doc" style="margin-top:10px;max-width:none;width:100%" data-a="abrirAdjunto" data-c="${esc(foto.clave)}" data-n="${esc(foto.nombre)}">${icono('archivo', 26)}<b>${esc(foto.nombre)}</b></button>` : `<button class="adj-foto" style="max-width:none;width:100%;margin:10px 0 0" data-a="abrirAdjunto" data-c="${esc(foto.clave)}" data-n="${esc(foto.nombre)}" data-img="1" aria-label="Ver horario en grande"><img alt="Horario" data-idb="${esc(foto.clave)}" style="max-height:none;object-fit:contain"></button>`)
          + (mio ? `<button class="btn3" style="margin-top:8px;min-height:38px;color:var(--malTxt)" data-a="quitarFotoHorario">Quitar foto</button>` : '')
          : `<p class="peq gris" style="margin:6px 0 0">${mio ? 'Sube una foto o captura de tu horario.' : 'No ha subido foto.'}</p>`}</section>
      <section class="tarjeta"><div class="entre"><h2>Mi semana</h2>${mio ? `<span class="fila" style="gap:6px"><button class="btn3" style="min-height:40px;padding:0 12px" data-a="leerHorario">${icono('subir', 16)}Leer de PDF o foto</button><button class="btn" style="min-height:40px;padding:0 12px" data-a="nuevaClase">${icono('mas', 16)}Agregar clase</button></span>`.replace('<span class="fila" style="gap:6px">', `<span class="fila" style="gap:6px"><button class="btn" style="min-height:40px;padding:0 12px" data-a="ofertaHoja">${icono('lupa', 16)}Buscar mi grupo</button>`) + `` : ''}</div>
        ${clases.length ? tablaHorario(clases, mio, verHuecos()) : `<p class="peq gris" style="margin:6px 0 0">${mio ? 'Agrega tus clases con su día y hora de inicio y fin, y se arma tu horario solo.' : 'Sin clases registradas.'}</p>`}</section>
      ${clases.some(c => (c.sesiones || []).length) ? resumenHorario(clases, mio) : ''}
      ${mio ? `<section class="tarjeta"><h2>¿Quién lo puede ver?</h2>
        <div class="pestanas" style="margin-top:8px"><button class="pastilla${u.horarioVis !== 'elegidos' ? ' on' : ''}" data-a="visHorario" data-v="yo">Solo yo</button><button class="pastilla${u.horarioVis === 'elegidos' ? ' on' : ''}" data-a="visHorario" data-v="elegidos">Personas que elijo</button></div>
        ${u.horarioVis === 'elegidos' ? `<div style="margin-top:10px">${(u.horarioCompartido || []).map(id => DB.usuario(id)).filter(Boolean).map(p => `<div class="entre" style="padding:6px 0;border-bottom:1px solid var(--linea)"><span class="fila" style="flex-wrap:nowrap">${avatar(p.id)}<span>@${esc(p.usuario)}</span></span><button class="icono-btn" data-a="dejarCompartir" data-u="${p.id}" aria-label="Quitar a @${esc(p.usuario)}">${icono('cerrar', 18)}</button></div>`).join('') || '<p class="peq gris" style="margin:0">Todavía no lo compartes con nadie.</p>'}
          <button class="btn3" style="margin-top:8px" data-a="elegirCompartir">${icono('mas', 16)}Elegir personas</button></div>` : ''}</section>` : ''}
    </div>`;
  },
  montar() { cargarArchivosTablon(); }
};
function filaClase(c, mio) { return `<div class="entre" style="padding:8px 10px;border-radius:12px;background:var(--suave);margin-top:6px"><span><b class="peq">${esc(c.hora || '')} · ${esc(c.materia)}</b><br><span class="mini gris">${esc(c.dias)}${c.salon ? ' · ' + esc(c.salon) : ''}</span></span>${mio ? `<button class="icono-btn" data-a="quitarClase" data-i="${c.i}" aria-label="Quitar ${esc(c.materia)}">${icono('cerrar', 18)}</button>` : ''}</div>`; }
CAMBIOS.fotoHorario = async el => {
  const f = el.files[0]; el.value = ''; if (!f) return; if (f.size > 10 * 1024 * 1024) return aviso('Máximo 10 MB.');
  try { const img = /^image\//.test(f.type), blob = img ? await reducirFoto(f, 2000) : f, clave = 'horario_' + uid('f'); await ARCHIVOS.guardar(clave, blob);
    DB.yo().horarioFoto = { clave, nombre: f.name.slice(0, 120), mime: blob.type || f.type }; DB.guardar(); aviso('Horario guardado'); refrescar(); }
  catch { aviso('No se pudo subir.'); }
};
ACC.quitarFotoHorario = () => { DB.yo().horarioFoto = null; DB.guardar(); refrescar(); };
ACC.visHorario = b => { DB.yo().horarioVis = b.dataset.v; DB.guardar(); refrescar(); };
ACC.dejarCompartir = b => { const u = DB.yo(); u.horarioCompartido = (u.horarioCompartido || []).filter(x => x !== b.dataset.u); DB.guardar(); refrescar(); };
ACC.elegirCompartir = () => {
  const u = DB.yo(), ya = new Set(u.horarioCompartido || []), gente = Object.values(DB.estado.usuarios).filter(p => p.id !== u.id && p.id !== 'u_equipo' && !p.suspendido).sort((a, b) => (u.amigos.includes(b.id) - u.amigos.includes(a.id)) || a.usuario.localeCompare(b.usuario));
  abrirHoja(`<form class="pila" data-form="compartirHorario"><h2>¿Con quién lo compartes?</h2><div class="pila" style="gap:4px;max-height:50vh;overflow:auto">${gente.map(p => `<label class="fila" style="flex-wrap:nowrap;padding:6px 4px;border-bottom:1px solid var(--linea)"><input type="checkbox" name="u_${p.id}" ${ya.has(p.id) ? 'checked' : ''}> ${avatar(p.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span>@${esc(p.usuario)}${u.amigos.includes(p.id) ? ' <span class="mini gris">· amigo</span>' : ''}</span></label>`).join('')}</div><button class="btn ancho">Guardar</button></form>`);
};
FORMS.compartirHorario = d => { const u = DB.yo(), antes = new Set(u.horarioCompartido || []); u.horarioCompartido = Object.keys(d).filter(k => k.startsWith('u_')).map(k => k.slice(2)); u.horarioCompartido.filter(id => !antes.has(id)).forEach(id => notificar(id, `@${u.usuario} compartió su horario contigo`, '#/horario/' + u.usuario)); DB.guardar(); cerrarHoja(); aviso('Listo'); refrescar(); };

ENTRADAS.colorLibre = el => { const r = el.closest('label')?.querySelector('input[type=radio]'); if (r) r.checked = true; const p = $('#puntoLibre'); if (p) p.style.background = el.value; };

const textoSobre = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return '#1B1530'; const n = parseInt(m[1], 16), l = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; return l < 0.55 ? '#fff' : '#1B1530'; };
const COLORES_CLASE = ['#E9DDF7', '#DCE8FB', '#DCF5E3', '#FFF1C7', '#FFE1D6', '#FCE1EC', '#D9F2F2', '#ECE7DF'];
const minutos = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const hhmm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

function normalizarHorario(u) {
  const l = u.horario || []; let cambio = false;
  const nuevo = l.map((c, i) => { if (c.sesiones) return c; cambio = true; const ini = c.hora || '07:00', fin = hhmm(minutos(ini) + 60);
    return { id: uid('cl'), materia: c.materia, salon: c.salon || '', color: COLORES_CLASE[i % COLORES_CLASE.length], sesiones: diasDeClase(c.dias).map(d => ({ d, ini, fin })) }; });
  if (cambio && u.id === DB.yo()?.id) { u.horario = nuevo; DB.guardar(); }
  return nuevo;
}
function tablaHorario(clases, mio, huecos) {
  const ses = clases.flatMap(c => (c.sesiones || []).map(s => ({ ...s, c })));
  if (!ses.length) return '<p class="peq gris">Tus clases no tienen días.</p>';
  const dias = DIAS_H.filter(([k], i) => i < 5 || ses.some(s => s.d === k));
  const ini = Math.floor(Math.min(...ses.map(s => minutos(s.ini))) / 60) * 60, fin = Math.ceil(Math.max(...ses.map(s => minutos(s.fin))) / 60) * 60;
  const pxMin = 1.1, alto = (fin - ini) * pxMin, horas = []; for (let m = ini; m <= fin; m += 60) horas.push(m);
  return `<div class="horario-tabla" style="--cols:${dias.length}">
    <div class="ht-cab"><span>Hora</span>${dias.map(([, n]) => `<span>${n.slice(0, 3)}</span>`).join('')}</div>
    <div class="ht-cuerpo" style="height:${alto}px">
      <div class="ht-horas">${horas.map(m => `<span style="top:${(m - ini) * pxMin}px">${hhmm(m)}</span>`).join('')}</div>
      ${dias.map(([k]) => `<div class="ht-dia">${horas.slice(1).map(m => `<i style="top:${(m - ini) * pxMin}px"></i>`).join('')}${huecos ? huecosDia(ses.filter(s => s.d === k)).filter(h => h.b - h.a >= 30).map(h => `<div class="ht-hueco" style="top:${(h.a - ini) * pxMin}px;height:${(h.b - h.a) * pxMin - 2}px"><span>${durTxt(h.b - h.a)}</span></div>`).join('') : ''}${carriles(ses.filter(s => s.d === k)).map(s => { const a = minutos(s.ini), b = Math.max(minutos(s.fin), a + 15);
        return `<button class="ht-clase${s.encima ? ' encima' : ''}" style="top:${(a - ini) * pxMin}px;height:${(b - a) * pxMin - 2}px;left:calc(${s.lane / s.lanes * 100}% + 2px);right:auto;width:calc(${100 / s.lanes}% - 4px);z-index:${s.encima ? 3 : 1};background:${s.c.color || COLORES_CLASE[0]};color:${textoSobre(s.c.color || COLORES_CLASE[0])}" data-a="verClase" data-id="${s.c.id}" ${mio ? '' : 'data-solover="1"'} title="${esc(s.c.materia)} ${s.ini}–${s.fin}"><b${(b - a) * pxMin < 40 ? ' style="-webkit-line-clamp:1"' : ''}>${esc(s.c.materia)}</b>${(b - a) * pxMin < 40 ? '' : `<span>${s.ini}–${s.fin}${s.c.salon ? ' · ' + esc(s.c.salon) : ''}</span>`}</button>`; }).join('')}</div>`).join('')}
    </div></div>`;
}

const esLibre = c => /^(receso|descanso|comida|almuerzo|libre|hueco)\b/i.test(String(c.materia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
const durTxt = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };
const verHuecos = () => { try { return localStorage.getItem('cdu_huecos') !== '0'; } catch { return true; } };

function bloquesDia(ses) {
  const l = ses.filter(s => !esLibre(s.c || {})).map(s => [minutos(s.ini), Math.max(minutos(s.fin), minutos(s.ini))]).sort((a, b) => a[0] - b[0]), r = [];
  l.forEach(([a, b]) => { const u = r.at(-1); if (u && a <= u[1]) u[1] = Math.max(u[1], b); else r.push([a, b]); });
  return r;
}
function huecosDia(ses) { const b = bloquesDia(ses); return b.slice(1).map((x, i) => ({ a: b[i][1], b: x[0] })); }
function statsDia(ses) {
  const b = bloquesDia(ses); if (!b.length) return null;
  const clase = b.reduce((a, [x, y]) => a + y - x, 0), huecos = huecosDia(ses), muertas = huecos.reduce((a, h) => a + h.b - h.a, 0);
  return { entra: b[0][0], sale: b.at(-1)[1], clase, muertas, huecos, campus: b.at(-1)[1] - b[0][0], mayor: huecos.sort((x, y) => (y.b - y.a) - (x.b - x.a))[0] || null };
}
function resumenHorario(clases, mio) {
  const ses = clases.flatMap(c => (c.sesiones || []).map(s => ({ ...s, c }))), modo = UI.resHorario || 'semana';
  const dias = DIAS_H.map(([k, n]) => ({ k, n, st: statsDia(ses.filter(s => s.d === k)) })).filter(d => d.st);
  if (!dias.length) return '';
  const tot = f => dias.reduce((a, d) => a + d.st[f], 0), muertas = tot('muertas'), clase = tot('clase'), campus = tot('campus');
  const mayor = dias.filter(d => d.st.mayor).sort((a, b) => (b.st.mayor.b - b.st.mayor.a) - (a.st.mayor.b - a.st.mayor.a))[0];
  const pesado = [...dias].sort((a, b) => b.st.campus - a.st.campus)[0], ligero = [...dias].sort((a, b) => a.st.campus - b.st.campus)[0];
  const temprano = [...dias].sort((a, b) => a.st.entra - b.st.entra)[0], tarde = [...dias].sort((a, b) => b.st.sale - a.st.sale)[0];
  const dato = (n, t, sub = '') => `<div class="res-dato"><b>${n}</b><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const pct = campus ? Math.round(muertas / campus * 100) : 0;
  return `<section class="tarjeta"><div class="entre"><h2>${mio ? 'Tu semana en números' : 'Su semana en números'}</h2>
      <label class="fila peq" style="flex-wrap:nowrap;gap:6px"><input type="checkbox" data-cambio="verHuecos" ${verHuecos() ? 'checked' : ''}> Marcar huecos</label></div>
    <div class="pestanas" style="margin-top:8px"><button class="pastilla${modo === 'semana' ? ' on' : ''}" data-a="resHorario" data-v="semana">Semana</button><button class="pastilla${modo === 'dia' ? ' on' : ''}" data-a="resHorario" data-v="dia">Por día</button></div>
    ${modo === 'semana' ? `<div class="res-grid">
      ${dato(durTxt(muertas), 'horas muertas', `${pct}% del tiempo que pasas en la uni`)}
      ${dato(durTxt(clase), 'de clase')}
      ${dato(durTxt(campus), 'en la uni', 'de la primera a la última clase')}
      ${dato(dias.length, dias.length === 1 ? 'día con clase' : 'días con clase')}
      ${mayor ? dato(durTxt(mayor.st.mayor.b - mayor.st.mayor.a), 'hueco más largo', `${mayor.n} ${hhmm(mayor.st.mayor.a)}–${hhmm(mayor.st.mayor.b)}`) : dato('0', 'huecos', 'todo seguido')}
      ${dato(hhmm(temprano.st.entra), 'entrada más temprana', temprano.n)}
      ${dato(hhmm(tarde.st.sale), 'salida más tarde', tarde.n)}
      ${dias.length > 1 ? dato(pesado.n, 'día más largo', durTxt(pesado.st.campus) + ' en la uni') : ''}
      ${dias.length > 1 ? dato(ligero.n, 'día más corto', durTxt(ligero.st.campus) + ' en la uni') : ''}
    </div>` : `<div class="res-tabla"><div class="res-fila res-cab"><span>Día</span><span>Horario</span><span>Clase</span><span>Muertas</span></div>
      ${dias.map(d => `<div class="res-fila"><span><b>${d.n.slice(0, 3)}</b></span><span>${hhmm(d.st.entra)}–${hhmm(d.st.sale)}</span><span>${durTxt(d.st.clase)}</span><span class="${d.st.muertas >= 120 ? 'res-mal' : ''}">${d.st.muertas ? durTxt(d.st.muertas) : '—'}</span></div>
        ${d.st.huecos.length ? `<p class="mini gris" style="margin:-2px 0 6px">Huecos: ${d.st.huecos.slice().sort((a, b) => a.a - b.a).map(h => `${hhmm(h.a)}–${hhmm(h.b)} (${durTxt(h.b - h.a)})`).join(' · ')}</p>` : ''}`).join('')}
      <div class="res-fila res-tot"><span><b>Total</b></span><span></span><span>${durTxt(clase)}</span><span>${durTxt(muertas)}</span></div></div>`}
    <p class="mini gris" style="margin:8px 0 0">Horas muertas = tiempo libre entre una clase y la siguiente del mismo día. Las clases llamadas “Receso” o “Comida” cuentan como libre.</p>
  </section>`;
}
ACC.resHorario = b => { UI.resHorario = b.dataset.v; refrescar(); };
CAMBIOS.verHuecos = el => { try { localStorage.setItem('cdu_huecos', el.checked ? '1' : '0'); } catch {} refrescar(); };

function hojaClase(c) {
  const filas = c?.sesiones?.length ? agrupar(c.sesiones) : [{ dias: [], ini: '07:00', fin: '09:00' }];
  UI.claseFilas = filas.length; UI.claseEdit = c?.id || null;
  abrirHoja(`<form class="pila" data-form="guardarClase"><h2>${c ? 'Editar clase' : 'Agregar clase'}</h2>
    <div><label class="campo" for="cm">Materia</label><input id="cm" name="materia" required maxlength="60" value="${esc(c?.materia || '')}" placeholder="Cálculo II, Receso…"></div>
    <div><label class="campo" for="cs">Salón <span class="mini gris">(opcional)</span></label><input id="cs" name="salon" maxlength="30" value="${esc(c?.salon || '')}"></div>${c?.salon && salonEnMapaValido(c.salon) ? `<button type="button" class="btn3" style="align-self:flex-start;min-height:36px" data-a="salonEnMapa" data-s="${esc(c.salon)}">${icono('mapa', 16)}Ver salón en el mapa</button>` : ''}
    <div><span class="campo">Color</span><div class="fila" style="gap:6px">${COLORES_CLASE.map((col, i) => `<label style="cursor:pointer"><input type="radio" name="color" value="${col}" class="oculto" ${(c?.color || COLORES_CLASE[normalizarHorario(DB.yo()).length % COLORES_CLASE.length]) === col ? 'checked' : ''}><span class="punto-color" style="background:${col}"></span></label>`).join('')}${(() => { const act = c?.color && !COLORES_CLASE.includes(c.color) ? c.color : ''; return `<label style="cursor:pointer;position:relative" title="Cualquier color"><input type="radio" name="color" value="libre" class="oculto" ${act ? 'checked' : ''}><span class="punto-color rueda" id="puntoLibre" style="${act ? `background:${act}` : ''}"></span><input type="color" name="colorLibre" value="${act || '#7C4DCC'}" data-entrada="colorLibre" aria-label="Elegir cualquier color" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"></label>`; })()}</div></div>
    <div><span class="campo">¿Cuándo?</span><div id="filasClase" class="pila" style="gap:8px">${filas.map((f, i) => filaSesion(i, f)).join('')}</div>
      <button type="button" class="btn3" style="margin-top:8px;min-height:40px" data-a="otraFilaClase">${icono('mas', 16)}Otro horario (otros días u otra hora)</button></div>
    <button class="btn ancho">Guardar</button>${c ? `<button type="button" class="btn-peligro ancho" data-a="quitarClaseId" data-id="${c.id}">Quitar clase</button>` : ''}</form>`);
}
function agrupar(ses) { const m = new Map(); ses.forEach(s => { const k = s.ini + '|' + s.fin; if (!m.has(k)) m.set(k, { dias: [], ini: s.ini, fin: s.fin }); m.get(k).dias.push(s.d); }); return [...m.values()]; }
function filaSesion(i, f) {
  return `<div class="tarjeta" style="box-shadow:none;border:1.5px solid var(--linea);padding:10px"><div class="fila" style="gap:4px">${DIAS_H.map(([k, n]) => `<label class="dia-chip"><input type="checkbox" name="d${i}_${k}" ${f.dias.includes(k) ? 'checked' : ''}><span>${n.slice(0, 2)}</span></label>`).join('')}</div>
    <div class="fila" style="flex-wrap:nowrap;margin-top:8px;gap:8px"><label class="peq" for="i${i}">De</label><input id="i${i}" name="i${i}" type="time" required value="${f.ini}" style="flex:1"><label class="peq" for="f${i}">a</label><input id="f${i}" name="f${i}" type="time" required value="${f.fin}" style="flex:1"></div></div>`;
}
ACC.nuevaClase = () => hojaClase(null);
ACC.otraFilaClase = () => { const n = UI.claseFilas++; $('#filasClase').insertAdjacentHTML('beforeend', filaSesion(n, { dias: [], ini: '07:00', fin: '08:00' })); };
ACC.verClase = b => { const u = b.dataset.solover ? null : DB.yo(), c = (u ? normalizarHorario(u) : []).find(x => x.id === b.dataset.id); if (c) return hojaClase(c);
  const cl = Object.values(DB.estado.usuarios).flatMap(x => x.horario || []).find(x => x.id === b.dataset.id); if (cl) abrirHoja(`<h2>${esc(cl.materia)}</h2>${cl.profe ? `<p class="peq" style="margin:0">${esc(cl.profe)}${cl.grupo ? ` · <span class="gris">${esc(cl.grupo)}</span>` : ''}</p>` : ''}${cl.salon ? `<p class="peq gris">Salón ${esc(cl.salon)}${salonEnMapaValido(cl.salon) ? `</p><button type="button" class="btn3" style="min-height:36px" data-a="salonEnMapa" data-s="${esc(cl.salon)}">${icono('mapa', 16)}Ver salón en el mapa</button><p style="margin:0">` : ''}</p>` : ''}${agrupar(cl.sesiones || []).map(f => `<p class="peq" style="margin:4px 0">${f.dias.map(d => DIAS_H.find(x => x[0] === d)[1]).join(', ')} · ${f.ini}–${f.fin}</p>`).join('')}`); };
FORMS.guardarClase = d => {
  const ses = [];
  for (let i = 0; i < UI.claseFilas; i++) { if (!d['i' + i]) continue; const ini = d['i' + i], fin = d['f' + i];
    if (minutos(fin) <= minutos(ini)) return aviso('La hora de fin tiene que ser después de la de inicio.');
    DIAS_H.forEach(([k]) => { if (d[`d${i}_${k}`]) ses.push({ d: k, ini, fin }); }); }
  if (!ses.length) return aviso('Marca al menos un día.');
  const u = DB.yo(), l = normalizarHorario(u), datos = { materia: d.materia.trim().slice(0, 60), salon: (d.salon || '').trim().slice(0, 30), color: (d.color === 'libre' && /^#[0-9a-f]{6}$/i.test(d.colorLibre || '') ? d.colorLibre : d.color !== 'libre' && d.color) || COLORES_CLASE[l.length % COLORES_CLASE.length], sesiones: ses };
  const i = l.findIndex(x => x.id === UI.claseEdit); if (i >= 0) l[i] = { ...l[i], ...datos }; else l.push({ id: uid('cl'), ...datos });
  u.horario = l; DB.guardar(); cerrarHoja(); aviso('Guardado'); refrescar();
};
ACC.quitarClaseId = b => { const u = DB.yo(); u.horario = normalizarHorario(u).filter(x => x.id !== b.dataset.id); DB.guardar(); cerrarHoja(); refrescar(); };

function carriles(l) {
  const o = l.map(s => ({ ...s, a: minutos(s.ini), b: minutos(s.fin), lane: 0, lanes: 1, encima: false })).sort((x, y) => (y.b - y.a) - (x.b - x.a));
  o.forEach((s, i) => { if (o.slice(0, i).some(x => x.a <= s.a && s.b <= x.b)) s.encima = true; });
  const base = o.filter(s => !s.encima).sort((x, y) => x.a - y.a), fines = [];
  base.forEach(s => { let k = fines.findIndex(f => f <= s.a); if (k < 0) { k = fines.length; fines.push(0); } fines[k] = s.b; s.lane = k; });
  base.forEach(s => { const sol = base.filter(x => x.a < s.b && s.a < x.b); s.lanes = Math.max(...sol.map(x => x.lane)) + 1; });
  return o;
}
