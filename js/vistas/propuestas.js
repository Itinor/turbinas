'use strict';
UI.propTab = 'todas'; UI.apuesta = {};
VISTAS.propuestas = {
  titulo: 'Propuestas', nav: 'propuestas',
  render(params) {
    if (params[0] === 'nueva') return formNuevaPropuesta();
    if (params[0] === 'editar') return formEditarPropuesta(params[1]);
    DB.revisarArbitrajes();
    const t = UI.propTab, lista = DB.estado.propuestas.filter(p => (p.estado === 'abierta' || p.estado === 'congelada' || p.estado === 'disputa' || ((p.estado === 'resuelta' || p.estado === 'anulada') && Date.now() - cierreMs(p.cierre) < 3 * 864e5)) && (t === 'todas' || p.tipo === t))
      .filter(p => !DB.bloqueo(p.autor, DB.yo().id)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const tabs = [['todas', 'Todas'], ['prediccion', 'Predicciones'], ['votacion', 'Votaciones'], ['actividad', 'Actividades']].map(([k, n]) => `<button class="pastilla${t === k ? ' on' : ''}" data-a="propTab" data-t="${k}">${n}</button>`).join('');
    return `<div class="pila"><div class="pestanas">${tabs}<a class="pastilla" style="display:inline-grid;place-items:center;text-decoration:none;color:inherit" href="#/rankings">Rankings</a></div>
      <a class="btn ancho" href="#/propuestas/nueva">${icono('mas', 18)}Proponer algo</a>
      ${lista.map(tarjetaPropuesta).join('') || '<p class="vacio">No hay propuestas abiertas aquí.</p>'}</div>`;
  }
};
function tarjetaPropuesta(p) {
  const yo = DB.yo(), autor = nombreVisible(p.autor), falta = faltaTexto(p.cierre), cerro = !falta;
  const cab = (tag, color) => `<div class="entre"><span class="etiqueta" style="color:${color}">${tag}</span><span class="mini gris">${p.estado === 'resuelta' ? (p.resueltaPor === 'comunidad' ? 'Resuelta por la comunidad' : 'Resuelta') : p.estado === 'anulada' ? 'Anulada · se devolvió todo' : p.estado === 'disputa' ? 'En disputa' : p.estado === 'congelada' ? 'En revisión' : cerro ? (p.tipo === 'prediccion' ? 'Cerrada · por resolver' : 'Cerrada') : (p.tipo === 'actividad' ? 'Es en ' : 'Cierra en ') + falta}</span></div>
    <div class="entre" style="align-items:flex-start"><h2 style="margin:6px 0 2px">${esc(p.titulo)}</h2><span class="fila" style="flex-wrap:nowrap;gap:0">${(p.autor === yo.id || DB.esAdmin()) && (p.estado === 'abierta' || p.estado === 'congelada') ? `<button class="icono-btn" data-a="editarProp" data-id="${p.id}" aria-label="Editar">${icono('lapiz', 18)}</button>` : ''}${botonEliminar('propuesta', p.id)}</span></div><div class="mini gris">Propuesta por ${esc(autor)}${p.editada ? ' · editada' : ''}</div>${(p.aclaraciones || []).map(a => `<div class="peq" style="margin-top:8px;background:var(--avisoBg);border-radius:12px;padding:8px 10px"><b>Aclaración</b> · <span class="mini gris">${hace(a.f)}</span><br>${esc(a.t)}</div>`).join('')}`;
  if (p.tipo === 'prediccion') {
    const total = DB.pozo(p), mio = DB.apostado(p), miOp = p.apuestas.find(a => a.u === yo.id)?.op, sel = UI.apuesta[p.id] || { op: miOp ?? 0, monto: 25 };
    const abierta = p.estado === 'abierta' && !cerro;
    const ops = p.opciones.map((o, i) => { const m = DB.multiplicador(p, i), pct = total ? Math.round(DB.pozoOpcion(p, i) / total * 100) : 0, on = abierta && sel.op === i, gano = p.estado === 'resuelta' && p.ganadora === i;
      return `<button class="tarjeta entre" style="padding:10px 12px;text-align:left;border:2px solid ${gano ? '#15803D' : on ? 'var(--morado)' : 'var(--linea)'};background:${on ? 'var(--suave)' : 'var(--tarjeta)'};box-shadow:none" ${abierta ? `data-a="elegirOp" data-id="${p.id}" data-op="${i}"` : 'disabled'}>
        <span><b>${esc(o)}</b>${gano ? ' <span class="insignia i-verde">Ganó</span>' : ''}<br><span class="mini gris">${pct}% del pozo</span></span><b style="font-family:Sora,sans-serif;font-size:20px;color:${i % 2 ? 'var(--azulTxt)' : 'var(--moradoTxt)'}">${m ? '×' + m.toFixed(2) : '—'}</b></button>`; }).join('');
    const mm = DB.multiplicador({ ...p, apuestas: p.apuestas.concat([{ op: sel.op, monto: sel.monto }]) }, sel.op) || 0;
    return `<article class="tarjeta" style="border:2px solid var(--amarillo)">${cab(DB.esGrande(p) ? 'Predicción grande' : 'Predicción', '#8A5A00')}${DB.esGrande(p) ? `<p class="mini" style="margin:6px 0 0;color:var(--avisoTxt)">Pozo de ${REGLAS.pozoGrande}+ ramitas: el resultado lo verifica el equipo antes de repartir.</p>` : ''}
      <div class="pila" style="gap:8px;margin-top:12px">${ops}</div>
      ${abierta ? `<div style="margin-top:12px" class="peq"><b>¿Cuántas ramitas pones?</b></div><div class="rejilla3" style="margin-top:6px">${[10, 25, 50].map(n => `<button class="pastilla${sel.monto === n ? ' on' : ''}" data-a="elegirMonto" data-id="${p.id}" data-n="${n}">${n}</button>`).join('')}</div>
        <div class="entre" style="margin-top:10px;background:var(--suave);border-radius:14px;padding:10px 12px"><span class="peq">Si aciertas recibes</span><b style="font-family:Sora,sans-serif;font-size:20px;color:var(--moradoTxt)">${Math.floor(sel.monto * mm)} ramitas</b></div>
        <button class="btn2 ancho" style="margin-top:10px" data-a="apostar" data-id="${p.id}">Confirmar predicción</button>` : ''}
      ${cajaArbitraje(p)}
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
    ${t !== 'actividad' ? campoOpciones('op')
      : `<div><label class="campo" for="cu">¿Cuántas personas?</label><input id="cu" name="cupo" type="number" min="2" max="100" value="10"></div>`}
    ${campoDuracion(t, null)}
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
  const r = DB.crearPropuesta({ tipo: UI.nuevaTipo || 'prediccion', titulo: d.titulo, opciones: leerOpciones(d), ...leerDuracion(d), cupo: d.cupo });
  if (r.error === 'verificar') return pedirVerificacion();
  if (r.error) return aviso(r.error);
  aviso(r.nota || 'Publicado'); UI.propTab = 'todas'; ir('#/propuestas');
};

function cajaArbitraje(p) {
  const A = p.arbitraje, yo = DB.yo().id, caja = (html, borde = 'var(--linea)') => `<div style="margin-top:12px;border:1.5px dashed ${borde};border-radius:14px;padding:12px">${html}</div>`;
  if (p.estado === 'resuelta' || p.estado === 'anulada') return A ? caja(`<span class="mini gris">Resultado reportado por ${esc(nombreVisible(A.por))} · ${A.confirman.length} confirmaron${A.disputan.length ? ` · ${A.disputan.length} disputaron y decidió el equipo` : ''}</span>`) : '';
  if (p.estado === 'disputa') return caja(`<b>En disputa</b><p class="peq" style="margin:4px 0 0">Reportaron que ganó <b>${esc(p.opciones[A.op])}</b>, pero alguien no está de acuerdo. El equipo revisa las pruebas y decide. Las ramitas siguen guardadas.</p>`, 'var(--naranja)');
  if (!DB.porArbitrar(p)) return '';
  if (!A) return caja(`<b>¿Cómo terminó?</b><p class="peq" style="margin:4px 0 8px">La predicción ya cerró. Si sabes el resultado, repórtalo con una prueba (foto, link o quién lo anunció).</p><button class="btn2 ancho" data-a="reportarRes" data-id="${p.id}">Reportar resultado</button>`, 'var(--amarillo)');
  const fin = DB.finArbitraje(p), horas = Math.max(0, Math.ceil((fin - Date.now()) / 36e5)), yaOpino = A.por === yo || A.confirman.includes(yo) || A.disputan.some(d => d.u === yo);
  return caja(`<span class="mini gris">Resultado reportado por ${esc(nombreVisible(A.por))} · ${hace(A.fecha)}</span>
    <p style="margin:6px 0"><b>Ganó: ${esc(p.opciones[A.op])}</b></p><p class="peq" style="margin:0 0 8px;overflow-wrap:anywhere">Prueba: ${esc(A.evidencia).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')}</p>
    <div class="fila" style="flex-wrap:nowrap"><div class="barra-prog" style="flex:1"><span style="width:${Math.min(100, Math.round(A.confirman.length / REGLAS.confirmacionesMin * 100))}%"></span></div><span class="mini">${A.confirman.length}/${REGLAS.confirmacionesMin} confirman</span></div>
    <p class="mini gris" style="margin:6px 0 8px">${horas ? `Quedan ${horas} h para disputar.` : 'Se cerró la ventana: si no juntó confirmaciones, lo decide el equipo.'} Si nadie lo disputa, se reparte solo.</p>
    ${yaOpino ? '<p class="peq" style="margin:0;color:var(--okTxt)">Ya diste tu opinión.</p>' : `<div class="rejilla2">${DB.aposto(p) ? '' : `<button class="btn2" data-a="confirmarRes" data-id="${p.id}">Es correcto</button>`}<button class="btn3" style="color:var(--malTxt)" data-a="disputarRes" data-id="${p.id}">No es así</button></div>`}`, 'var(--azul)');
}
ACC.reportarRes = b => { const p = DB.estado.propuestas.find(x => x.id === b.dataset.id); abrirHoja(`<form class="pila" data-form="reportarRes"><input type="hidden" name="id" value="${p.id}"><h2>¿Quién ganó?</h2><p class="peq gris" style="margin:0">${esc(p.titulo)}</p>
  <div class="pila" style="gap:6px">${p.opciones.map((o, i) => `<label class="tarjeta fila" style="padding:10px 12px;box-shadow:none;border:1.5px solid var(--linea)"><input type="radio" name="op" value="${i}" required> ${esc(o)}</label>`).join('')}</div>
  <div><label class="campo" for="ev">Prueba</label><textarea id="ev" name="evidencia" required minlength="8" maxlength="300" rows="3" placeholder="Link a la publicación oficial, foto del marcador o quién lo anunció"></textarea></div>
  <p class="mini gris" style="margin:0">Durante ${REGLAS.horasDisputa} h cualquiera puede disputarlo. Si aciertas ganas ${REGLAS.premioReportar} ramitas.</p><button class="btn ancho">Reportar</button></form>`); };
FORMS.reportarRes = d => { const r = DB.reportarResultado(d.id, d.op, d.evidencia); if (r.error === 'verificar') { cerrarHoja(); return pedirVerificacion(); } if (r.error) return aviso(r.error); cerrarHoja(); aviso('Gracias. Ahora la comunidad lo confirma.'); refrescar(); };
ACC.confirmarRes = b => { const r = DB.confirmarResultado(b.dataset.id); if (r.error === 'verificar') return pedirVerificacion(); if (r.error) return aviso(r.error); aviso(`Confirmado. Si el resultado queda así, ganas ${REGLAS.premioConfirmar} ramitas.`); refrescar(); };
ACC.disputarRes = b => { const p = DB.estado.propuestas.find(x => x.id === b.dataset.id); abrirHoja(`<form class="pila" data-form="disputarRes"><input type="hidden" name="id" value="${p.id}"><h2>¿Qué pasó en realidad?</h2>
  <div><label class="campo" for="dop">Para ti ganó</label><select id="dop" name="op"><option value="">No sé / no se puede saber</option>${p.opciones.map((o, i) => i === p.arbitraje.op ? '' : `<option value="${i}">${esc(o)}</option>`).join('')}</select></div>
  <div><label class="campo" for="dmo">Por qué</label><textarea id="dmo" name="motivo" required minlength="8" maxlength="300" rows="3" placeholder="Pon tu prueba: link, foto o qué viste"></textarea></div>
  <p class="mini gris" style="margin:0">Al disputar, el reparto se pausa y decide el equipo con las pruebas.</p><button class="btn-peligro ancho">Disputar</button></form>`); };
FORMS.disputarRes = d => { const r = DB.disputarResultado(d.id, d.motivo, d.op); if (r.error === 'verificar') { cerrarHoja(); return pedirVerificacion(); } if (r.error) return aviso(r.error); cerrarHoja(); aviso('Disputa enviada. El equipo lo revisa.'); refrescar(); };
ACC.editarProp = b => { const p = DB.estado.propuestas.find(x => x.id === b.dataset.id);
  if (DB.puedeEditar(p)) return ir('#/propuestas/editar/' + p.id);
  abrirHoja(`<form class="pila" data-form="aclarar"><input type="hidden" name="id" value="${p.id}"><h2>Agregar aclaración</h2><p class="peq gris" style="margin:0">Como ya participó gente, la pregunta y las opciones ya no se pueden cambiar (así nadie cambia las reglas con ramitas de por medio). Puedes agregar una aclaración y les llega aviso a todos.</p>
  <div><label class="oculto" for="acl">Aclaración</label><textarea id="acl" name="texto" required minlength="4" maxlength="300" rows="3" placeholder="Ej. Cuenta el resultado oficial publicado por la facultad"></textarea></div><button class="btn ancho">Publicar aclaración</button></form>`); };
FORMS.aclarar = d => { const r = DB.aclarar(d.id, d.texto); if (r.error) return aviso(r.error); cerrarHoja(); aviso('Aclaración publicada'); refrescar(); };
function formEditarPropuesta(id) {
  const p = DB.estado.propuestas.find(x => x.id === id); if (!DB.puedeEditar(p)) return '<p class="vacio">Esta propuesta ya no se puede editar. <a href="#/propuestas">Volver</a></p>';
  return `<form class="pila" data-form="editarProp"><input type="hidden" name="id" value="${p.id}"><h1>Editar propuesta</h1><p class="peq gris" style="margin:0">Puedes cambiarla mientras nadie haya participado.</p>
    <div><label class="campo" for="ept">La pregunta</label><input id="ept" name="titulo" required maxlength="140" value="${esc(p.titulo)}"></div>
    ${p.tipo !== 'actividad' ? campoOpciones('eop', p.opciones)
      : `<div><label class="campo" for="ecu">¿Cuántas personas?</label><input id="ecu" name="cupo" type="number" min="2" max="100" value="${p.cupo}"></div>`}
    <p class="peq gris" style="margin:0">Ahora cierra: ${cierreBonito(p.cierre)}</p>${campoDuracion(p.tipo, p)}
    <button class="btn ancho">Guardar cambios</button><a class="btn3 ancho" href="#/propuestas">Cancelar</a></form>`;
}
FORMS.editarProp = d => { const r = DB.editarPropuesta(d.id, { ...d, ...leerDuracion(d) }); if (r.error) return aviso(r.error); aviso('Cambios guardados'); ir('#/propuestas'); };

const DURACIONES = [[5, '5 min'], [15, '15 min'], [30, '30 min'], [60, '1 hora'], [120, '2 horas'], [180, '3 horas'], [360, '6 horas'], [720, '12 horas'], [1440, '1 día'], [4320, '3 días'], [10080, '1 semana']];
function campoDuracion(tipo, p) {
  const sel = UI.duracion ?? (p ? 'igual' : 4320), otra = sel === 'otra';
  const local = new Date(Date.now() + 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16), minimo = new Date(Date.now() + REGLAS.duracionMin * 6e4 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  return `<div><label class="campo" for="dur">${tipo === 'actividad' ? '¿Cuándo es?' : '¿Cuánto dura?'}</label><select id="dur" name="minutos" data-cambio="duracion">
    ${p ? `<option value="igual" ${sel === 'igual' ? 'selected' : ''}>Dejar como está</option>` : ''}${DURACIONES.map(([m, n]) => `<option value="${m}" ${String(sel) === String(m) ? 'selected' : ''}>${tipo === 'actividad' ? 'En ' + n : n}</option>`).join('')}<option value="otra" ${otra ? 'selected' : ''}>Elegir fecha y hora…</option></select>
    ${otra ? `<input style="margin-top:8px" name="cierreExacto" type="datetime-local" required min="${minimo}" value="${local}" aria-label="Fecha y hora">` : ''}
    <p class="mini gris" style="margin:4px 0 0">Mínimo ${REGLAS.duracionMin} minutos.</p></div>`;
}
function leerDuracion(d) {
  UI.duracion = null;
  if (d.minutos === 'otra') return { cierre: d.cierreExacto ? new Date(d.cierreExacto).toISOString() : null };
  if (d.minutos === 'igual' || !d.minutos) return {};
  return { minutos: +d.minutos };
}
CAMBIOS.duracion = el => { UI.duracion = el.value; const f = el.form, datos = Object.fromEntries(new FormData(f)); refrescar(); const g = $('form[data-form]'); if (g) Object.entries(datos).forEach(([k, v]) => { const i = g.elements[k]; if (i && k !== 'minutos' && k !== 'cierreExacto' && i.type !== 'hidden') i.value = v; }); };
