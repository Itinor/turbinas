/* Rankings: profesores por área y rankings propuestos por la comunidad */
'use strict';
UI.rkTab = 'profes'; UI.rkArea = 'Ciencias básicas';
VISTAS.rankings = {
  titulo: 'Rankings', nav: 'rankings',
  render(params) {
    if (params[0] === 'nuevo') return formNuevoRanking();
    const tabs = `<div class="rejilla2" style="background:var(--suave);border-radius:14px;padding:4px">${[['profes', 'Profesores'], ['comunidad', 'Comunidad']].map(([k, t]) => `<button class="pastilla${UI.rkTab === k ? ' on' : ''}" style="border:0" data-a="rkTab" data-t="${k}">${t}</button>`).join('')}</div>`;
    if (UI.rkTab === 'profes') {
      const lista = DB.estado.profes.filter(p => p.area === UI.rkArea && p.opiniones.length >= REGLAS.minOpinionesProfe).map(p => ({ p, c: DB.calificacion(p) })).sort((a, b) => b.c - a.c);
      const mejores = lista.filter(x => x.c >= 3.5).slice(0, 3), peores = lista.filter(x => x.c < 3.5).sort((a, b) => a.c - b.c).slice(0, 3);
      const medalla = ['var(--g-accion)', 'linear-gradient(135deg,#CBD5E1,#F8FAFC)', 'linear-gradient(135deg,#E8C9A6,#D9A06B)'];
      const juntando = DB.estado.profes.filter(p => p.area === UI.rkArea && p.opiniones.length < REGLAS.minOpinionesProfe).sort((a, b) => b.opiniones.length - a.opiniones.length);
      const misPend = (DB.estado.profesPend || []).filter(p => p.por === DB.yo().id || p.apoyos.includes(DB.yo().id));
      const extra = `<section class="tarjeta"><h2>Juntando opiniones</h2><p class="mini gris" style="margin:2px 0 6px">Entran al ranking con ${REGLAS.minOpinionesProfe} opiniones. ¿Llevaste clase con alguno?</p>
        ${juntando.map(p => `<a href="#/profe/${p.id}" class="entre" style="padding:10px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit;flex-wrap:nowrap"><span style="min-width:0"><b>${esc(p.nombre)}</b><br><span class="mini gris">${esc(p.materias.join(', '))}</span><span style="display:block;height:6px;border-radius:9px;background:var(--suave);margin-top:6px;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(p.opiniones.length / REGLAS.minOpinionesProfe * 100)}%;background:var(--g-marca)"></span></span></span><span class="mini" style="white-space:nowrap;margin-left:10px">${p.opiniones.length}/${REGLAS.minOpinionesProfe}</span></a>`).join('') || '<p class="peq gris">Todos los profes de esta área ya están en el ranking.</p>'}</section>
        ${misPend.length ? `<section class="tarjeta"><h2>Tus propuestas</h2>${misPend.map(p => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span><b>${esc(p.nombre)}</b><br><span class="mini gris">${esc(p.area)}${p.apoyos.length ? ` · ${p.apoyos.length + 1} lo propusieron` : ''}</span></span><span class="insignia i-amarillo">En revisión</span></div>`).join('')}</section>` : ''}`;
      return `<div class="pila">${tabs}<button class="btn ancho" data-a="proponerProfe">${icono('mas', 18)}${DB.esAdmin() ? 'Agregar' : 'Proponer'} un profesor</button><div class="pestanas">${AREAS.map(a => `<button class="pastilla${UI.rkArea === a ? ' on' : ''}" data-a="rkArea" data-a2="${esc(a)}">${esc(a)}</button>`).join('')}</div>
        <section class="tarjeta"><h2>Mejor evaluados</h2><p class="mini gris" style="margin:2px 0 6px">${esc(UI.rkArea)} · según los estudiantes</p>
        ${mejores.map((x, i) => `<div class="fila" style="flex-wrap:nowrap;border-bottom:1px solid var(--linea)"><a href="#/profe/${x.p.id}" class="fila" style="flex:1;flex-wrap:nowrap;padding:10px 0;text-decoration:none;color:inherit"><span style="width:30px;height:30px;border-radius:50%;background:${medalla[i]};color:#1B1530;display:grid;place-items:center;font-weight:800;flex:none">${i + 1}</span><span style="flex:1"><b>${esc(x.p.nombre)}</b><br><span class="mini gris">${esc(x.p.materias.join(', '))} · ${x.p.opiniones.length} opiniones</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--okTxt)">${x.c.toFixed(1)}</b></a>${botonEliminar('profe', x.p.id)}</div>`).join('') || '<p class="vacio">Aún no hay suficientes opiniones.</p>'}</section>
        <section class="tarjeta"><h2>Peor evaluados</h2><p class="mini gris" style="margin:2px 0 6px">Con el motivo que más mencionan</p>
        ${peores.map(x => `<div class="fila" style="flex-wrap:nowrap;border-bottom:1px solid var(--linea)"><a href="#/profe/${x.p.id}" style="flex:1;display:block;padding:10px 0;text-decoration:none;color:inherit"><span class="entre"><span><b>${esc(x.p.nombre)}</b><br><span class="mini gris">${esc(x.p.materias.join(', '))} · ${x.p.opiniones.length} opiniones</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--malTxt)">${x.c.toFixed(1)}</b></span><span class="insignia i-rojo" style="margin-top:6px">${esc(DB.motivoFrecuente(x.p))}</span></a>${botonEliminar('profe', x.p.id)}</div>`).join('') || '<p class="vacio">Nadie en esta lista. ¡Bien por el área!</p>'}</section>${extra}</div>`;
    }
    const yo = DB.yo(), lista = DB.estado.rankings.filter(r => DB.rankingVisible(r)).sort((a, b) => Object.keys(b.votos).length - Object.keys(a.votos).length);
    return `<div class="pila">${tabs}<a class="btn ancho" href="#/rankings/nuevo">${icono('mas', 18)}Proponer un ranking</a>
      ${lista.map(r => { const votos = Object.values(r.votos), n = votos.length, mi = r.votos[yo.id], mio = r.autor === yo.id;
        const etiqueta = r.oficial ? '<span class="insignia i-morado">Del equipo</span>' : DB.etapaRanking(r) === 3 ? '<span class="insignia i-verde">Popular</span>' : '<span class="insignia i-amarillo">Nuevo</span>';
        const espera = mio && r.estado !== 'aprobado' ? `<p class="peq" style="margin:8px 0 0;color:var(--avisoTxt)">${r.estado === 'revision' ? 'Lo está revisando el equipo antes de publicarlo.' : r.estado === 'consentimiento' ? 'Esperando a que las personas mencionadas acepten aparecer.' : ''}</p>` : '';
        return `<article class="tarjeta"><div class="entre">${etiqueta}<span class="mini gris">${n} votos</span></div><h2 style="margin:8px 0 10px">${esc(r.titulo)}</h2>
          <div class="pila" style="gap:8px">${r.opciones.map((o, i) => { const c = votos.filter(v => v === i).length, pct = n ? Math.round(c / n * 100) : 0; return `<button class="reaccion${mi === i ? ' on' : ''}" style="border-radius:14px;min-height:48px;text-align:left;padding:8px 12px;display:block" data-a="votarRanking" data-id="${r.id}" data-op="${i}" ${r.estado !== 'aprobado' ? 'disabled' : ''}><span class="entre"><span>${esc(o)}</span><span class="gris">${mi !== undefined ? pct + '%' : ''}</span></span>${mi !== undefined ? `<span class="barra-prog" style="margin-top:6px;display:block"><span style="width:${pct}%"></span></span>` : ''}</button>`; }).join('')}</div>
          ${espera}<div class="entre" style="margin-top:8px"><span class="mini gris">por ${esc(nombreVisible(r.autor))}</span><span class="fila">${mio ? '' : `<button class="icono-btn" data-a="abrirReporte" data-tipo="ranking" data-ref="${r.id}" aria-label="Reportar ranking">${icono('bandera', 18)}</button>`}${botonEliminar('ranking', r.id)}</span></div></article>`; }).join('') || '<p class="vacio">Todavía no hay rankings para ti. ¡Propón el primero!</p>'}</div>`;
  }
};
function formNuevoRanking() {
  return `<form class="pila" data-form="nuevoRanking"><h1>Proponer un ranking</h1>
    <div><label class="campo" for="rt">La pregunta</label><input id="rt" name="titulo" required maxlength="140" placeholder="¿Quién es el más fiestero de la generación?"></div>
    <div><span class="campo">Opciones</span><div class="pila" style="gap:6px">${[0, 1, 2, 3].map(i => `<label class="oculto" for="ro${i}">Opción ${i + 1}</label><input id="ro${i}" name="op${i}" maxlength="60" placeholder="Opción ${i + 1}${i > 1 ? ' (opcional)' : ''}" ${i < 2 ? 'required' : ''}>`).join('')}</div></div>
    <div><label class="campo" for="rm">¿Mencionas a alguien de la red?</label><input id="rm" name="nombrados" placeholder="@pedro.g, @vale.a" autocomplete="off"><p class="mini gris">Les llegará un aviso para que acepten aparecer.</p></div>
    <button class="btn ancho">Publicar</button><a class="btn3 ancho" href="#/rankings">Cancelar</a></form>`;
}
ACC.rkTab = b => { UI.rkTab = b.dataset.t; refrescar(); };
ACC.rkArea = b => { UI.rkArea = b.dataset.a2; refrescar(); };
ACC.votarRanking = b => { const r = DB.votarRanking(b.dataset.id, +b.dataset.op); if (r.error === 'verificar') return pedirVerificacion(); refrescar(); };
FORMS.nuevoRanking = d => {
  const r = DB.crearRanking(d.titulo, [d.op0, d.op1, d.op2, d.op3], (d.nombrados || '').split(/[,\s]+/).filter(Boolean));
  if (r.error) return aviso(r.error);
  aviso(r.ok.estado === 'aprobado' ? 'Publicado. Primero lo verán tus amigos.' : r.ok.estado === 'revision' ? 'Lo revisará el equipo antes de publicarse.' : 'Publicado en cuanto acepten las personas mencionadas.');
  UI.rkTab = 'comunidad'; ir('#/rankings');
};

ACC.proponerProfe = () => abrirHoja(`<form class="pila" data-form="proponerProfe"><h2>${DB.esAdmin() ? 'Agregar' : 'Proponer'} un profesor</h2><p class="peq gris" style="margin:0">${DB.esAdmin() ? 'Se agrega directo.' : 'El equipo lo revisa y, al aprobarlo, todos pueden opinar. Ganas 10 ramitas.'}</p>
  <div><label class="campo" for="ppn">Nombre</label><input id="ppn" name="nombre" required minlength="5" maxlength="60" placeholder="Mtra. Laura García" data-entrada="buscarProfeParecido" autocomplete="off"><p class="mini" id="ppAviso" style="margin:4px 0 0"></p></div>
  <div><label class="campo" for="ppa">Área</label><select id="ppa" name="area">${AREAS.map(a => `<option ${a === UI.rkArea ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
  <div><label class="campo" for="ppm">Materias que da (separadas por coma)</label><input id="ppm" name="materias" required placeholder="Cálculo I, Cálculo II"></div>
  <button class="btn ancho">${DB.esAdmin() ? 'Agregar' : 'Enviar propuesta'}</button></form>`);
ENTRADAS.buscarProfeParecido = el => { const p = DB.profeParecido(el.value), a = $('#ppAviso'); if (a) a.innerHTML = p ? `Ya existe: <a href="#/profe/${p.id}">${esc(p.nombre)}</a>` : ''; };
FORMS.proponerProfe = d => {
  const r = DB.proponerProfe(d);
  if (r.error === 'verificar') { cerrarHoja(); return pedirVerificacion(); }
  if (r.error === 'existe') { cerrarHoja(); aviso('Ese profe ya está. Te llevamos a su ficha.'); location.hash = '#/profe/' + r.id; return; }
  if (r.error === 'repetido') return aviso('Ya lo habías propuesto.');
  if (r.error === 'limite') return aviso('Tienes 5 propuestas en revisión. Espera a que las revisemos.');
  cerrarHoja(); aviso(r.directo ? 'Profesor agregado.' : r.apoyo ? 'Alguien ya lo había propuesto: sumamos tu voto.' : '¡Gracias! Lo revisamos y te avisamos.'); refrescar();
};
