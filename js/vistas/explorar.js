/* Explorar: mapa del campus, profesores y eventos */
'use strict';
UI.salon = 'C-204';
VISTAS.explorar = {
  titulo: 'Explorar', nav: 'explorar',
  render(params) {
    const tab = params[0] || 'mapa';
    const tabs = [['mapa', 'Mapa'], ['profesores', 'Profesores'], ['eventos', 'Eventos']].map(([k, t]) => `<a class="pastilla${tab === k ? ' on' : ''}" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/explorar/${k}">${t}</a>`).join('') + `<a class="pastilla" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/compraventa">Compraventa</a>`;
    let cuerpo = '';
    if (tab === 'mapa') {
      const s = SALONES.find(x => x.clave === UI.salon) || SALONES[0];
      cuerpo = `<form data-form="buscarSalon" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bs">Buscar salón</label><input id="bs" name="q" list="salones" value="${esc(UI.salon)}" placeholder="Ej. C-204"><datalist id="salones">${SALONES.map(x => `<option value="${x.clave}">`).join('')}</datalist><button class="btn2">Buscar</button></form>
        <div class="mapa" role="img" aria-label="Mapa del campus con el edificio ${esc(s.edificio)} marcado">${EDIFICIOS_MAPA.map(e => `<div class="ed${e.n === s.edificio ? ' on' : ''}" style="left:${e.x}%;top:${e.y}%;width:${e.w}%;height:${e.h}%;background:${e.c}">${e.n}</div>`).join('')}</div>
        <div class="tarjeta"><h2>${esc(s.clave)}</h2><p style="margin:6px 0 0">${esc(s.piso)}. ${esc(s.como)}</p><p class="mini gris" style="margin:8px 0 0">Mapa de ejemplo: cuando tengamos el plano real se reemplaza aquí.</p></div>`;
    } else if (tab === 'profesores') {
      const q = (UI.qProfe || '').toLowerCase();
      const lista = DB.estado.profes.filter(p => !q || p.nombre.toLowerCase().includes(q) || p.materias.join(' ').toLowerCase().includes(q));
      cuerpo = `<label class="oculto" for="bp">Buscar profesor</label><input id="bp" type="search" placeholder="Busca un profe o una materia" value="${esc(UI.qProfe || '')}" data-entrada="qProfe">
        <a class="btn3" href="#/rankings">Ver rankings de profesores</a>
        <div class="pila" style="gap:10px" id="listaProfes">${lista.map(p => { const c = DB.calificacion(p); return `<a href="#/profe/${p.id}" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit"><span class="avatar" style="background:var(--suave);color:var(--moradoTxt)">${esc(p.nombre.split(' ').pop()[0])}</span><span style="flex:1"><b>${esc(p.nombre)}</b><br><span class="mini gris">${esc(p.materias.join(' · '))}</span></span><span style="text-align:right"><b style="font-family:Sora,sans-serif;font-size:18px">${c ? c.toFixed(1) : '—'}</b><br><span class="mini gris">${p.opiniones.length} opiniones</span></span></a>`; }).join('') || '<p class="vacio">No encontramos a nadie con ese nombre.</p>'}</div>`;
    } else {
      cuerpo = DB.estado.eventos.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => { const on = DB.estado.interesEventos[DB.yo().id + ':' + e.id]; const d = new Date(e.fecha + 'T12:00:00'); return `<article class="tarjeta fila" style="flex-wrap:nowrap;align-items:flex-start">
        <span style="width:58px;border-radius:14px;background:var(--avisoBg);color:var(--avisoTxt);text-align:center;padding:8px 0;flex:none"><span class="mini" style="font-weight:800;text-transform:uppercase">${d.toLocaleDateString('es-MX', { month: 'short' })}</span><br><b style="font-family:Sora,sans-serif;font-size:22px">${d.getDate()}</b></span>
        <span style="flex:1"><b>${esc(e.titulo)}</b><br><span class="mini gris">${esc(e.lugar)} · ${esc(e.hora)}</span><br>
        <span class="fila" style="margin-top:8px"><button class="reaccion${on ? ' on' : ''}" data-a="interesEvento" data-id="${e.id}" aria-pressed="${!!on}">Me interesa · ${e.interesados}</button><button class="reaccion" data-a="eventoAgenda" data-id="${e.id}">Agregar a mi agenda</button></span></span></article>`; }).join('');
    }
    return `<div class="pila"><div class="pestanas">${tabs}</div>${cuerpo}</div>`;
  }
};
ENTRADAS.qProfe = el => { UI.qProfe = el.value; const pos = el.selectionStart; refrescar(); const n = $('#bp'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } };
FORMS.buscarSalon = d => { const s = SALONES.find(x => x.clave.toLowerCase() === d.q.trim().toLowerCase()); if (!s) { aviso('No encontramos ese salón. ¿Lo agregas tú? Pronto podrás proponerlo.'); return; } UI.salon = s.clave; refrescar(); };
ACC.interesEvento = b => { DB.interesEvento(b.dataset.id); refrescar(); };
ACC.eventoAgenda = b => { const e = DB.estado.eventos.find(x => x.id === b.dataset.id); DB.agregarRecordatorio({ titulo: e.titulo, tipo: 'Evento', fecha: e.fecha, hora: e.hora, lugar: e.lugar }); aviso('Agregado a tu agenda'); };

/* Ficha de un profesor */
VISTAS.profe = {
  titulo: 'Profesor', nav: 'explorar', atras: '#/explorar/profesores',
  render([id]) {
    const p = DB.estado.profes.find(x => x.id === id); if (!p) return '<p class="vacio">No encontramos a este profesor.</p>';
    const c = DB.calificacion(p), prom = k => p.opiniones.length ? (p.opiniones.reduce((s, o) => s + o[k], 0) / p.opiniones.length).toFixed(1) : '—';
    const mia = p.opiniones.find(o => o.u === DB.yo().id) || {};
    const estrellas = (name, v) => `<div class="fila" role="radiogroup" aria-label="${name}">${[1, 2, 3, 4, 5].map(n => `<label class="pastilla${(mia[name] || 0) == n ? ' on' : ''}" style="display:inline-grid;place-items:center;cursor:pointer;min-width:44px"><input class="oculto" type="radio" name="${name}" value="${n}" ${(mia[name] || 0) == n ? 'checked' : ''} required>${n}</label>`).join('')}</div>`;
    const motivos = ['Explica muy claro', 'Califica justo', 'Siempre resuelve dudas', 'Clases dinámicas', 'Llega tarde seguido', 'No explica cómo califica', 'Exámenes fuera del temario', 'Cambia fechas sin avisar', 'Muchas tareas sin retroalimentación'];
    return `<div class="pila">
      <div class="tarjeta"><div class="entre"><div><h1 style="font-size:24px">${esc(p.nombre)}</h1><p class="gris" style="margin:4px 0 0">${esc(p.area)} · ${esc(p.materias.join(', '))}</p></div><b style="font-family:Sora,sans-serif;font-size:34px;color:var(--moradoTxt)">${c ? c.toFixed(1) : '—'}</b></div>
        <div class="rejilla3" style="margin-top:14px">${[['claridad', 'Explica claro'], ['justo', 'Califica justo'], ['puntual', 'Puntual']].map(([k, t]) => `<div style="background:var(--suave);border-radius:12px;padding:10px;text-align:center"><b style="font-size:20px">${prom(k)}</b><br><span class="mini gris">${t}</span></div>`).join('')}</div>
        <p class="mini gris" style="margin:10px 0 0">${p.opiniones.length} opiniones · lo más mencionado: ${esc(DB.motivoFrecuente(p) || '—')}</p></div>
      <form class="tarjeta pila" data-form="opinar"><input type="hidden" name="id" value="${p.id}"><h2>Tu opinión</h2>
        <div><span class="campo">Explica claro</span>${estrellas('claridad')}</div><div><span class="campo">Califica justo</span>${estrellas('justo')}</div><div><span class="campo">Puntual</span>${estrellas('puntual')}</div>
        <div><label class="campo" for="mo">Lo que más destacarías</label><select id="mo" name="motivo">${motivos.map(m => `<option ${mia.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <label class="fila peq"><input type="checkbox" name="cursada" required> Llevé la materia con este profe</label>
        <button class="btn">${mia.u ? 'Actualizar opinión' : 'Enviar opinión'}</button></form>
    </div>`;
  }
};
document.addEventListener('change', e => { if (e.target.type === 'radio' && e.target.closest('[role=radiogroup]')) { e.target.closest('[role=radiogroup]').querySelectorAll('label').forEach(l => l.classList.toggle('on', l.contains(e.target))); } });
FORMS.opinar = d => { const r = DB.opinar(d.id, { claridad: +d.claridad, justo: +d.justo, puntual: +d.puntual, motivo: d.motivo }); if (r.error === 'verificar') return pedirVerificacion(); aviso('Gracias, tu opinión cuenta'); refrescar(); };
