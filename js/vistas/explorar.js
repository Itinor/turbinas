/* Explorar: mapa del campus, profesores y eventos */
'use strict';
UI.mapa = { sel: 'auditorio', filtro: 'todos', proponer: false, punto: null };
VISTAS.explorar = {
  titulo: 'Explorar', nav: 'explorar',
  montar(params) { if ((params[0] || 'mapa') !== 'mapa') return; const c = $('#mapaCampus'), l = DB.lugares().find(x => x.id === UI.mapa.sel), svg = c?.querySelector('svg'); if (c && l && svg && svg.clientWidth > c.clientWidth) c.scrollLeft = l.x / 1150 * svg.clientWidth - c.clientWidth / 2; },
  render(params) {
    const tab = params[0] || 'mapa';
    const tabs = [['mapa', 'Mapa'], ['profesores', 'Profesores'], ['eventos', 'Eventos']].map(([k, t]) => `<a class="pastilla${tab === k ? ' on' : ''}" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/explorar/${k}">${t}</a>`).join('') + `<a class="pastilla" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/compraventa">Compraventa</a>`;
    let cuerpo = '';
    if (tab === 'mapa') {
      cuerpo = vistaMapa(params[1]);
    } else if (tab === 'profesores') {
      const q = (UI.qProfe || '').toLowerCase();
      const lista = DB.estado.profes.filter(p => !q || p.nombre.toLowerCase().includes(q) || p.materias.join(' ').toLowerCase().includes(q));
      cuerpo = `<label class="oculto" for="bp">Buscar profesor</label><input id="bp" type="search" placeholder="Busca un profe o una materia" value="${esc(UI.qProfe || '')}" data-entrada="qProfe">
        <div class="fila"><a class="btn3" href="#/rankings">Ver rankings de profesores</a><button class="btn" data-a="proponerProfe">${icono('mas', 18)}${DB.esAdmin() ? 'Agregar' : 'Proponer'} profesor</button></div>
        <div class="pila" style="gap:10px" id="listaProfes">${lista.map(p => { const c = DB.calificacion(p); return `<a href="#/profe/${p.id}" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit"><span class="avatar" style="background:var(--suave);color:var(--moradoTxt)">${esc(p.nombre.split(' ').pop()[0])}</span><span style="flex:1"><b>${esc(p.nombre)}</b><br><span class="mini gris">${esc(p.materias.join(' · '))}</span></span><span style="text-align:right"><b style="font-family:Sora,sans-serif;font-size:18px">${c ? c.toFixed(1) : '—'}</b><br><span class="mini gris">${p.opiniones.length} opiniones</span></span></a>`; }).join('') || '<p class="vacio">No encontramos a nadie con ese nombre.</p>'}</div>`;
    } else {
      cuerpo = (DB.esAdmin() ? '<button class="btn ancho" data-a="nuevoEvento">' + icono('mas', 18) + 'Agregar evento</button>' : '') + DB.estado.eventos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => { const on = DB.estado.interesEventos[DB.yo().id + ':' + e.id]; const d = new Date(e.fecha + 'T12:00:00'); return `<article class="tarjeta fila" style="flex-wrap:nowrap;align-items:flex-start">
        <span style="width:58px;border-radius:14px;background:var(--avisoBg);color:var(--avisoTxt);text-align:center;padding:8px 0;flex:none"><span class="mini" style="font-weight:800;text-transform:uppercase">${d.toLocaleDateString('es-MX', { month: 'short' })}</span><br><b style="font-family:Sora,sans-serif;font-size:22px">${d.getDate()}</b></span>
        <span style="flex:1"><span class="entre" style="align-items:flex-start"><b>${esc(e.titulo)}</b>${botonEliminar('evento', e.id)}</span><br><span class="mini gris">${esc(e.lugar)} · ${esc(e.hora)}</span><br>
        <span class="fila" style="margin-top:8px"><button class="reaccion${on ? ' on' : ''}" data-a="interesEvento" data-id="${e.id}" aria-pressed="${!!on}">Me interesa · ${e.interesados}</button><button class="reaccion" data-a="eventoAgenda" data-id="${e.id}">Agregar a mi agenda</button></span></span></article>`; }).join('');
    }
    return `<div class="pila"><div class="pestanas">${tabs}</div>${cuerpo}</div>`;
  }
};
ENTRADAS.qProfe = el => { UI.qProfe = el.value; const pos = el.selectionStart; refrescar(); const n = $('#bp'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
FORMS.buscarSalon = d => { const q = d.q.trim().toLowerCase(); if (!q) return; const l = DB.lugares().find(x => x.nombre.toLowerCase() === q) || DB.lugares().find(x => x.nombre.toLowerCase().includes(q)); if (!l) { aviso('No está en el mapa todavía. Puedes proponerlo con el botón de abajo.'); return; } UI.mapa.sel = l.id; UI.mapa.filtro = 'todos'; refrescar(); };
ACC.interesEvento = b => { DB.interesEvento(b.dataset.id); refrescar(); };
ACC.eventoAgenda = b => { const e = DB.estado.eventos.find(x => x.id === b.dataset.id); DB.agregarRecordatorio({ titulo: e.titulo, tipo: 'Evento', fecha: e.fecha, hora: e.hora, lugar: e.lugar }); aviso('Agregado a tu agenda'); };

/* Ficha de un profesor */
VISTAS.profe = {
  titulo: 'Profesor', nav: 'explorar', atras: '#/explorar/profesores',
  render([id]) {
    const p = DB.estado.profes.find(x => x.id === id); if (!p) return '<p class="vacio">Este profesor ya no está. <a href="#/explorar/profesores">Volver</a></p>';
    const c = DB.calificacion(p), prom = k => p.opiniones.length ? (p.opiniones.reduce((s, o) => s + o[k], 0) / p.opiniones.length).toFixed(1) : '—';
    const mia = p.opiniones.find(o => o.u === DB.yo().id) || {};
    const estrellas = (name, v) => `<div class="fila" role="radiogroup" aria-label="${name}">${[1, 2, 3, 4, 5].map(n => `<label class="pastilla${(mia[name] || 0) == n ? ' on' : ''}" style="display:inline-grid;place-items:center;cursor:pointer;min-width:44px"><input class="oculto" type="radio" name="${name}" value="${n}" ${(mia[name] || 0) == n ? 'checked' : ''} required>${n}</label>`).join('')}</div>`;
    const motivos = ['Explica muy claro', 'Califica justo', 'Siempre resuelve dudas', 'Clases dinámicas', 'Llega tarde seguido', 'No explica cómo califica', 'Exámenes fuera del temario', 'Cambia fechas sin avisar', 'Muchas tareas sin retroalimentación'];
    return `<div class="pila">
      <div class="tarjeta"><div class="entre"><div><h1 style="font-size:24px">${esc(p.nombre)}</h1><p class="gris" style="margin:4px 0 0">${esc(p.area)} · ${esc(p.materias.join(', '))}</p></div><span class="fila" style="flex-wrap:nowrap"><b style="font-family:Sora,sans-serif;font-size:34px;color:var(--moradoTxt)">${c ? c.toFixed(1) : '—'}</b>${botonEliminar('profe', p.id)}</span></div>
        <div class="rejilla3" style="margin-top:14px">${[['claridad', 'Explica claro'], ['justo', 'Califica justo'], ['puntual', 'Puntual']].map(([k, t]) => `<div style="background:var(--suave);border-radius:12px;padding:10px;text-align:center"><b style="font-size:20px">${prom(k)}</b><br><span class="mini gris">${t}</span></div>`).join('')}</div>
        <p class="mini gris" style="margin:10px 0 0">${p.opiniones.length < REGLAS.minOpinionesProfe ? `<b style="color:var(--avisoTxt)">Le faltan ${REGLAS.minOpinionesProfe - p.opiniones.length} opiniones para entrar al ranking.</b> ` : ''}${p.opiniones.length} opiniones · lo más mencionado: ${esc(DB.motivoFrecuente(p) || '—')}</p></div>
      <form class="tarjeta pila" data-form="opinar"><input type="hidden" name="id" value="${p.id}"><h2>Tu opinión</h2>
        <div><span class="campo">Explica claro</span>${estrellas('claridad')}</div><div><span class="campo">Califica justo</span>${estrellas('justo')}</div><div><span class="campo">Puntual</span>${estrellas('puntual')}</div>
        <div><label class="campo" for="mo">Lo que más destacarías</label><select id="mo" name="motivo">${motivos.map(m => `<option ${mia.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <label class="fila peq"><input type="checkbox" name="cursada" required> Llevé la materia con este profe</label>
        <button class="btn">${mia.u ? 'Actualizar opinión' : 'Enviar opinión'}</button></form>
      ${DB.esAdmin() ? `<section class="tarjeta"><div class="entre"><h2>Opiniones</h2><span class="mini gris">Solo lo ve el admin</span></div>${p.opiniones.map((o, i) => ({ o, i })).reverse().slice(0, 30).map(({ o, i }) => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span class="peq">${esc(o.motivo || 'Sin comentario')} · ${((o.claridad + o.justo + o.puntual) / 3).toFixed(1)}<br><span class="mini gris">${DB.usuario(o.u) ? esc(nombreVisible(o.u)) : 'anónimo'}</span></span><button class="icono-btn" style="color:var(--malTxt)" data-a="eliminar" data-tipo="opinion" data-id="${p.id}" data-extra="${i}" aria-label="Eliminar opinión">${icono('basura', 18)}</button></div>`).join('') || '<p class="peq gris">Sin opiniones.</p>'}${p.opiniones.length > 30 ? `<p class="mini gris">Mostrando las 30 más recientes de ${p.opiniones.length}.</p>` : ''}</section>` : ''}
    </div>`;
  }
};
document.addEventListener('change', e => { if (e.target.type === 'radio' && e.target.closest('[role=radiogroup]')) { e.target.closest('[role=radiogroup]').querySelectorAll('label').forEach(l => l.classList.toggle('on', l.contains(e.target))); } });
FORMS.opinar = d => { const r = DB.opinar(d.id, { claridad: +d.claridad, justo: +d.justo, puntual: +d.puntual, motivo: d.motivo }); if (r.error === 'verificar') return pedirVerificacion(); aviso('Gracias, tu opinión cuenta'); refrescar(); };

/* ---------- Croquis del Campus II ---------- */
const FILTROS_MAPA = [['todos', 'Todo'], ['fing', 'Ingeniería'], ['cya', 'Contaduría'], ['fcq', 'Químicas'], ['estacionamiento', 'Estacionamientos'], ['cafeteria', 'Cafetería']];
function lugarVisible(l) { const f = UI.mapa.filtro; return f === 'todos' || l.zona === f || l.tipo === f; }
function svgCampus() {
  const M = UI.mapa, L = DB.lugares();
  const zonas = ZONAS_CAMPUS.map(z => `<polygon points="${z.puntos}" fill="${z.color}" stroke="${z.borde}" stroke-width="3" stroke-dasharray="10 7" stroke-linejoin="round"/>`).join('');
  const etiquetas = ZONAS_CAMPUS.map(z => `<text x="${z.etiqueta[0]}" y="${z.etiqueta[1]}" text-anchor="middle" font-family="Sora,sans-serif" font-weight="800" font-size="24" fill="${z.borde}" opacity=".85">${esc(z.nombre.replace('Facultad de ', '').replace('Edificio ', ''))}</text>`).join('');
  const marcas = L.filter(l => l.tipo !== 'facultad').map(l => {
    const on = l.id === M.sel, vis = lugarVisible(l), op = vis ? 1 : .18, et = esc(l.nombre);
    if (l.tipo === 'estacionamiento') return `<g data-a="lugar" data-id="${l.id}" role="button" tabindex="0" aria-label="${et}" style="cursor:pointer;opacity:${op}"><ellipse cx="${l.x}" cy="${l.y}" rx="${on ? 70 : 58}" ry="${on ? 36 : 30}" fill="#E7E5EE" stroke="${on ? '#FF9F1C' : '#B9B0CF'}" stroke-width="${on ? 6 : 2}"/><circle cx="${l.x}" cy="${l.y}" r="17" fill="#fff" stroke="#D7263D" stroke-width="5"/><text x="${l.x}" y="${l.y + 8}" text-anchor="middle" font-weight="900" font-size="21" fill="#1B1530" font-family="Inter,sans-serif">E</text></g>`;
    const r = on ? 34 : 27, color = on ? '#FF9F1C' : l.tipo === 'cafeteria' ? '#D9468F' : l.tipo === 'salon' ? '#15803D' : '#4B1F7A';
    const dentro = l.n ? `<text x="${l.x}" y="${l.y - r * 1.25 + 8}" text-anchor="middle" font-weight="900" font-size="${on ? 24 : 19}" fill="#fff" font-family="Sora,sans-serif">${l.n}</text>` : l.tipo === 'cafeteria' ? `<text x="${l.x}" y="${l.y - r * 1.25 + 7}" text-anchor="middle" font-size="${on ? 22 : 17}" fill="#fff" font-weight="900" font-family="Inter,sans-serif">C</text>` : `<circle cx="${l.x}" cy="${l.y - r * 1.25}" r="${r * .32}" fill="#fff"/>`;
    return `<g data-a="lugar" data-id="${l.id}" role="button" tabindex="0" aria-label="${et}" style="cursor:pointer;opacity:${op}"><path d="M${l.x},${l.y} C${l.x - r * .9},${l.y - r * 1.1} ${l.x - r},${l.y - r * 1.6} ${l.x - r},${l.y - r * 1.25} A${r},${r} 0 1 1 ${l.x + r},${l.y - r * 1.25} C${l.x + r},${l.y - r * 1.6} ${l.x + r * .9},${l.y - r * 1.1} ${l.x},${l.y}Z" fill="${color}" stroke="#fff" stroke-width="3"/>${dentro}</g>`;
  }).join('');
  const temporal = M.proponer && M.punto ? `<circle cx="${M.punto.x}" cy="${M.punto.y}" r="14" fill="#15803D" stroke="#fff" stroke-width="4"/>` : '';
  return `<svg viewBox="0 0 1150 970" width="100%" style="display:block;min-width:720px;${M.proponer ? 'cursor:crosshair' : ''}" ${M.proponer ? 'data-a="mapaToque"' : ''} role="img" aria-label="Croquis del Campus II de la UACH">
    ${CONFIG.imagenCroquis ? `<image href="${esc(CONFIG.imagenCroquis)}" width="1150" height="970" preserveAspectRatio="xMidYMid slice"/>` : `    <rect width="1150" height="970" fill="#E3F0CF"/>
    <path d="M0,330 C30,60 300,0 640,0 L705,330 C900,300 1110,380 1150,640 L1150,790 L860,760 L640,790 C420,820 160,780 0,700 Z" fill="#DCD3EC"/>
    <path d="M0,705 C200,790 430,820 640,792 L860,762 L1150,795" fill="none" stroke="#C9BEDF" stroke-width="44" stroke-linecap="round"/>
    <text x="300" y="806" font-family="Inter,sans-serif" font-size="20" font-weight="700" fill="#5E5873" transform="rotate(5 300 806)">Circuito Universitario</text>
    ${zonas}${etiquetas}`}${marcas}${temporal}</svg>`;
}
function vistaMapa(selParam) {
  const M = UI.mapa; if (selParam && DB.lugares().some(l => l.id === selParam)) M.sel = selParam;
  const l = DB.lugares().find(x => x.id === M.sel), zona = l && ZONAS_CAMPUS.find(z => z.id === l.zona);
  const gmaps = l ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(l.nombre + ' UACH Campus II Chihuahua') : '';
  return `<form data-form="buscarSalon" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bs">Buscar lugar</label><input id="bs" name="q" list="lugaresCampus" placeholder="Busca: auditorio, biblioteca, cafetería…" autocomplete="off"><datalist id="lugaresCampus">${DB.lugares().map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist><button class="btn2">Buscar</button></form>
    <div class="pestanas">${FILTROS_MAPA.map(([k, t]) => `<button class="pastilla${M.filtro === k ? ' on' : ''}" data-a="filtroMapa" data-f="${k}">${t}</button>`).join('')}</div>
    ${M.proponer ? `<div class="tarjeta fila" style="flex-wrap:nowrap;background:var(--okBg);border:0;color:var(--okTxt)">${icono('mapa', 22, 'style="flex:none"')}<span class="peq" style="flex:1"><b>Toca el mapa</b> justo donde está el salón o lugar que quieres agregar.</span><button class="btn3" data-a="cancelarPropuesta">Cancelar</button></div>` : ''}
    <div class="mapa" id="mapaCampus">${svgCampus()}</div><p class="mini gris lado-movil-txt" style="margin:-6px 0 0;text-align:center">Desliza el mapa de lado para ver todo el campus</p>
    ${l && !M.proponer ? `<section class="tarjeta"><div class="entre"><span class="etiqueta" style="color:${zona?.borde || 'var(--moradoTxt)'}">${esc(zona?.nombre || 'Campus II')}</span>${l.n ? `<span class="insignia i-naranja">Punto ${l.n}</span>` : l.tipo === 'salon' ? '<span class="insignia i-verde">Agregado por la comunidad</span>' : ''}</div>
      <h2 style="margin:6px 0">${esc(l.nombre)}</h2><p style="margin:0">${esc(l.como)}</p>
      <div class="entre" style="margin-top:12px"><a class="btn3" href="${gmaps}" target="_blank" rel="noopener">Abrir en Google Maps</a>${DB.esAdmin() ? botonEliminar('lugar', l.id) : ''}</div></section>` : ''}
    <button class="btn ancho" data-a="proponerLugar" ${M.proponer ? 'disabled' : ''}>${icono('mas', 18)}Agregar un salón o lugar al mapa</button>
    <p class="mini gris" style="margin:0">Croquis aproximado basado en el mapa oficial "¡Ubícate! con el mapa UACH Campus II". Los salones los va agregando la comunidad y los revisa el equipo.</p>`;
}
ACC.lugar = b => { if (UI.mapa.proponer) return; UI.mapa.sel = b.dataset.id; refrescar(); };
ACC.filtroMapa = b => { UI.mapa.filtro = b.dataset.f; refrescar(); };
ACC.proponerLugar = () => { UI.mapa.proponer = true; UI.mapa.punto = null; refrescar(); $('#mapaCampus')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
ACC.cancelarPropuesta = () => { UI.mapa.proponer = false; UI.mapa.punto = null; refrescar(); };
ACC.mapaToque = (svg, e) => {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  UI.mapa.punto = { x: p.x, y: p.y }; refrescar();
  abrirHoja(`<form class="pila" data-form="enviarLugar"><h2>¿Qué hay aquí?</h2>
    <div><label class="campo" for="ln">Nombre</label><input id="ln" name="nombre" required maxlength="60" placeholder="Ej. Salón 204, Laboratorio de Física"></div>
    <div><label class="campo" for="lz">Edificio o zona</label><select id="lz" name="zona">${ZONAS_CAMPUS.map(z => `<option value="${z.id}" ${z.id === zonaDe(p.x, p.y) ? 'selected' : ''}>${esc(z.nombre)}</option>`).join('')}</select></div>
    <div><label class="campo" for="lc">¿Cómo se llega?</label><textarea id="lc" name="como" required maxlength="200" placeholder="Segundo piso, al fondo a la derecha…"></textarea></div>
    <button class="btn ancho">Enviar para revisión</button><button type="button" class="btn3 ancho" data-a="cancelarPropuesta">Cancelar</button></form>`);
};
FORMS.enviarLugar = d => { const P = UI.mapa.punto; if (!P) return; DB.proponerLugar({ ...d, x: P.x, y: P.y }); UI.mapa.proponer = false; UI.mapa.punto = null; cerrarHoja(); aviso('¡Gracias! Si lo aprueban, te llegan 10 ramitas.'); refrescar(); };
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('g[role=button][data-a]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
function zonaDe(x, y) { for (const z of ZONAS_CAMPUS) { const P = z.puntos.split(' ').map(q => q.split(',').map(Number)); let dentro = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro; } if (dentro) return z.id; } return 'fing'; }
ACC.nuevoEvento = () => abrirHoja(`<form class="pila" data-form="crearEvento"><h2>Nuevo evento</h2><div><label class="campo" for="et">Nombre</label><input id="et" name="titulo" required maxlength="100"></div><div class="rejilla2"><div><label class="campo" for="ef">Fecha</label><input id="ef" name="fecha" type="date" required min="${fechaLocal()}"></div><div><label class="campo" for="eh">Hora</label><input id="eh" name="hora" type="time"></div></div><div><label class="campo" for="el">Lugar</label><input id="el" name="lugar" required maxlength="60" list="lugaresCampusEv"><datalist id="lugaresCampusEv">${DB.lugares().map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist></div><button class="btn ancho">Publicar evento</button></form>`);
FORMS.crearEvento = d => { DB.crearEvento(d); cerrarHoja(); aviso('Evento publicado'); refrescar(); };
ACC.nuevoProfe = () => abrirHoja(`<form class="pila" data-form="crearProfe"><h2>Agregar profesor</h2><div><label class="campo" for="pn">Nombre</label><input id="pn" name="nombre" required maxlength="60" placeholder="Mtra. García"></div><div><label class="campo" for="pa">Área</label><select id="pa" name="area">${AREAS.map(a => `<option>${a}</option>`).join('')}</select></div><div><label class="campo" for="pm">Materias (separadas por coma)</label><input id="pm" name="materias" required placeholder="Cálculo I, Cálculo II"></div><button class="btn ancho">Agregar</button></form>`);
FORMS.crearProfe = d => { DB.crearProfe(d); cerrarHoja(); aviso('Profesor agregado.'); refrescar(); };
