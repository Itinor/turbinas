/* Propuestas: predicciones con ramitas (pozo compartido), votaciones y actividades */
'use strict';
UI.propTab = 'todas'; UI.apuesta = {};
VISTAS.propuestas = {
  titulo: 'Propuestas', nav: 'propuestas',
  render(params) {
    if (params[0] === 'nueva') return formNuevaPropuesta();
    const t = UI.propTab, lista = DB.estado.propuestas.filter(p => (p.estado === 'abierta' || p.estado === 'congelada' || (p.estado === 'resuelta' && diasHasta(p.cierre) > -3)) && (t === 'todas' || p.tipo === t))
      .filter(p => !DB.bloqueo(p.autor, DB.yo().id)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const tabs = [['todas', 'Todas'], ['prediccion', 'Predicciones'], ['votacion', 'Votaciones'], ['actividad', 'Actividades']].map(([k, n]) => `<button class="pastilla${t === k ? ' on' : ''}" data-a="propTab" data-t="${k}">${n}</button>`).join('');
    return `<div class="pila"><div class="pestanas">${tabs}<a class="pastilla" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/rankings">Rankings</a></div>
      <a class="btn ancho" href="#/propuestas/nueva">${icono('mas', 18)}Proponer algo</a>
      ${lista.map(tarjetaPropuesta).join('') || '<p class="vacio">No hay propuestas abiertas aquí.</p>'}</div>`;
  }
};
function tarjetaPropuesta(p) {
  const yo = DB.yo(), autor = nombreVisible(p.autor), cierra = diasHasta(p.cierre);
  const cab = (tag, color) => `<div class="entre"><span class="etiqueta" style="color:${color}">${tag}</span><span class="mini gris">${p.estado === 'resuelta' ? 'Resuelta' : p.estado === 'congelada' ? 'En revisión' : cierra < 0 ? 'Cerrada' : cierra === 0 ? 'Cierra hoy' : 'Cierra en ' + cierra + ' d'}</span></div>
    <div class="entre" style="align-items:flex-start"><h2 style="margin:6px 0 2px">${esc(p.titulo)}</h2>${botonEliminar('propuesta', p.id)}</div><div class="mini gris">Propuesta por ${esc(autor)}</div>`;
  if (p.tipo === 'prediccion') {
    const total = DB.pozo(p), mio = DB.apostado(p), miOp = p.apuestas.find(a => a.u === yo.id)?.op, sel = UI.apuesta[p.id] || { op: miOp ?? 0, monto: 25 };
    const abierta = p.estado === 'abierta' && cierra >= 0;
    const ops = p.opciones.map((o, i) => { const m = DB.multiplicador(p, i), pct = total ? Math.round(DB.pozoOpcion(p, i) / total * 100) : 0, on = abierta && sel.op === i, gano = p.estado === 'resuelta' && p.ganadora === i;
      return `<button class="tarjeta entre" style="padding:10px 12px;text-align:left;border:2px solid ${gano ? '#15803D' : on ? 'var(--morado)' : 'var(--linea)'};background:${on ? 'var(--suave)' : 'var(--tarjeta)'};box-shadow:none" ${abierta ? `data-a="elegirOp" data-id="${p.id}" data-op="${i}"` : 'disabled'}>
        <span><b>${esc(o)}</b>${gano ? ' <span class="insignia i-verde">Ganó</span>' : ''}<br><span class="mini gris">${pct}% del pozo</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:${i % 2 ? 'var(--azulTxt)' : 'var(--moradoTxt)'}">${m ? '×' + m.toFixed(2) : '—'}</b></button>`; }).join('');
    const mm = DB.multiplicador({ ...p, apuestas: p.apuestas.concat([{ op: sel.op, monto: sel.monto }]) }, sel.op) || 0;
    return `<article class="tarjeta" style="border:2px solid var(--amarillo)">${cab('Predicción', '#8A5A00')}
      <div class="pila" style="gap:8px;margin-top:12px">${ops}</div>
      ${abierta ? `<div style="margin-top:12px" class="peq"><b>¿Cuántas ramitas pones?</b></div><div class="rejilla3" style="margin-top:6px">${[10, 25, 50].map(n => `<button class="pastilla${sel.monto === n ? ' on' : ''}" data-a="elegirMonto" data-id="${p.id}" data-n="${n}">${n}</button>`).join('')}</div>
        <div class="entre" style="margin-top:10px;background:var(--suave);border-radius:14px;padding:10px 12px"><span class="peq">Si aciertas recibes</span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--moradoTxt)">${Math.floor(sel.monto * mm)} ramitas</b></div>
        <button class="btn2 ancho" style="margin-top:10px" data-a="apostar" data-id="${p.id}">Confirmar predicción</button>` : ''}
      <p class="mini gris" style="margin:10px 0 0">Pozo: ${numero(total)} ramitas${mio ? ` · tú pusiste ${mio}` : ''}</p></article>`;
  }
  if (p.tipo === 'votacion') {
    const votos = Object.values(p.votos), n = votos.length, mi = p.votos[yo.id];
    return `<article class="tarjeta">${cab('Votación', 'var(--azulTxt)')}<div class="pila" style="gap:8px;margin-top:12px">${p.opciones.map((o, i) => { const c = votos.filter(v => v === i).length, pct = n ? Math.round(c / n * 100) : 0;
      return `<button class="reaccion${mi === i ? ' on' : ''}" style="border-radius:14px;min-height:50px;text-align:left;padding:8px 12px;display:block" data-a="votar" data-id="${p.id}" data-op="${i}" aria-pressed="${mi === i}"><span class="entre"><span>${esc(o)}</span><span class="gris">${mi !== undefined ? pct + '%' : ''}</span></span>${mi !== undefined ? `<span class="barra-prog" style="margin-top:6px;display:block"><span style="width:${pct}%"></span></span>` : ''}</button>`; }).join('')}</div>
      <p class="mini gris" style="margin:10px 0 0">${n} votos</p></article>`;
  }
  const dentro = p.apuntados.includes(yo.id), lleno = p.apuntados.length >= p.cupo;
  return `<article class="tarjeta">${cab('Actividad · buscando gente', 'var(--moradoTxt)')}
    <div class="fila" style="margin-top:12px;flex-wrap:nowrap"><div class="barra-prog am" style="flex:1"><span style="width:${Math.round(p.apuntados.length / p.cupo * 100)}%"></span></div><b>${p.apuntados.length} / ${p.cupo}</b></div>
    <button class="${dentro ? 'btn3' : 'btn2'}" style="margin-top:12px" data-a="apuntarse" data-id="${p.id}" ${!dentro && lleno ? 'disabled' : ''}>${dentro ? 'Ya no voy' : lleno ? 'Cupo lleno' : 'Me apunto'}</button></article>`;
}
function formNuevaPropuesta() {
  const t = UI.nuevaTipo || 'prediccion';
  return `<form class="pila" data-form="nuevaPropuesta">
    <div class="rejilla3">${[['prediccion', 'Predicción'], ['votacion', 'Votación'], ['actividad', 'Actividad']].map(([k, n]) => `<button type="button" class="pastilla${t === k ? ' on' : ''}" data-a="nuevaTipo" data-t="${k}">${n}</button>`).join('')}</div>
    <p class="peq gris" style="margin:0">${t === 'prediccion' ? 'Algo que pasará y todos podrán comprobar: un torneo, un evento, cuántos van a la posada.' : t === 'votacion' ? 'Pregunta a la comunidad. Sin ramitas de por medio.' : 'Arma algo y busca gente: un partido, un grupo de estudio, una salida.'}</p>
    <div><label class="campo" for="pt">${t === 'actividad' ? '¿Qué quieres organizar?' : 'La pregunta'}</label><input id="pt" name="titulo" required maxlength="140" placeholder="${t === 'actividad' ? 'Fut 7 el viernes después de clases' : '¿Quién gana el torneo de…?'}"></div>
    ${t !== 'actividad' ? `<div><span class="campo">Opciones</span><div class="pila" style="gap:6px">${[0, 1, 2, 3].map(i => `<label class="oculto" for="op${i}">Opción ${i + 1}</label><input id="op${i}" name="op${i}" maxlength="60" placeholder="Opción ${i + 1}${i > 1 ? ' (opcional)' : ''}" ${i < 2 ? 'required' : ''}>`).join('')}</div></div>`
      : `<div><label class="campo" for="cu">¿Cuántas personas?</label><input id="cu" name="cupo" type="number" min="2" max="100" value="10"></div>`}
    <div><label class="campo" for="ci">${t === 'actividad' ? 'Fecha' : 'Cierra el'}</label><input id="ci" name="cierre" type="date" required min="${fechaLocal()}" value="${sumarDias(fechaLocal(), 3)}"></div>
    <button class="btn ancho">Publicar</button><a class="btn3 ancho" href="#/propuestas">Cancelar</a></form>`;
}
ACC.propTab = b => { UI.propTab = b.dataset.t; refrescar(); };
ACC.nuevaTipo = b => { UI.nuevaTipo = b.dataset.t; refrescar(); };
ACC.elegirOp = b => { const id = b.dataset.id; UI.apuesta[id] = { ...(UI.apuesta[id] || { monto: 25 }), op: +b.dataset.op }; refrescar(); };
ACC.elegirMonto = b => { const id = b.dataset.id; UI.apuesta[id] = { ...(UI.apuesta[id] || { op: 0 }), monto: +b.dataset.n }; refrescar(); };
ACC.apostar = b => { const id = b.dataset.id, s = UI.apuesta[id] || { op: 0, monto: 25 }; const r = DB.apostar(id, s.op, s.monto); if (r.error === 'verificar') return pedirVerificacion(); if (r.error) return aviso(r.error); aviso('Listo, tu predicción quedó registrada'); refrescar(); };
ACC.votar = b => { const r = DB.votar(b.dataset.id, +b.dataset.op); if (r.error === 'verificar') return pedirVerificacion(); refrescar(); };
ACC.apuntarse = b => { DB.apuntarse(b.dataset.id); refrescar(); };
FORMS.nuevaPropuesta = d => {
  const r = DB.crearPropuesta({ tipo: UI.nuevaTipo || 'prediccion', titulo: d.titulo, opciones: [d.op0, d.op1, d.op2, d.op3], cierre: d.cierre, cupo: d.cupo });
  if (r.error) return aviso(r.error);
  aviso(r.nota || 'Publicado'); UI.propTab = 'todas'; ir('#/propuestas');
};
