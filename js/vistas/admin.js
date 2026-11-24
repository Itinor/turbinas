'use strict';
UI.admTab = 'moderacion'; UI.admUsuario = null;
VISTAS.admin = {
  titulo: 'Administración', nav: 'admin', soloAdmin: true,
  render() {
    const t = UI.admTab, tabs = [['moderacion', 'Moderación'], ['usuarios', 'Usuarios'], ['contenido', 'Contenido'], ['predicciones', 'Predicciones'], ['alertas', 'Alertas'], ['economia', 'Ramitas'], ['trivia', 'Trivia'], ['directorio', 'Profesores'], ['registro', 'Registro']].map(([k, n]) => `<button class="pastilla${t === k ? ' on' : ''}" data-a="admTab" data-t="${k}">${n}${k === 'alertas' && DB.alertas().length ? ` · ${DB.alertas().length}` : ''}</button>`).join('');
    return `<div class="pila"><div class="pestanas">${tabs}</div>${({ usuarios: admUsuarios, contenido: admContenido, moderacion: admModeracion, predicciones: admPredicciones, alertas: admAlertas, economia: admEconomia, trivia: admTrivia, directorio: admDirectorio, registro: admRegistro })[t]()}</div>`;
  }
};
function admModeracion() {
  const S = DB.estado, rk = S.rankings.filter(r => r.estado === 'revision'), rep = S.reportes.filter(r => r.estado === 'abierto'), ver = Object.values(S.usuarios).filter(u => u.verificado === 'pendiente');
  return `<section class="tarjeta"><h2>Rankings por revisar</h2>${rk.map(r => `<div style="padding:10px 0;border-bottom:1px solid var(--linea)"><div class="mini gris">${esc(nombreVisible(r.autor))} · ${hace(r.fecha)}</div><b>${esc(r.titulo)}</b><div class="fila" style="margin-top:8px"><button class="btn2" data-a="moderar" data-id="${r.id}" data-e="aprobado">Aprobar</button><button class="btn-peligro" data-a="moderar" data-id="${r.id}" data-e="quitado">Quitar</button></div></div>`).join('') || '<p class="peq gris">Nada pendiente.</p>'}</section>
    <section class="tarjeta"><h2>Reportes</h2>${rep.map(r => { const post = r.tipo === 'post' && S.posts.find(p => p.id === r.ref); return `<div style="padding:10px 0;border-bottom:1px solid var(--linea)"><span class="insignia i-rojo">${esc(r.motivo)}</span><div class="peq" style="margin-top:6px">${r.tipo === 'post' ? 'Publicación: ' + esc(post?.texto?.slice(0, 120) || '(borrada)') : r.tipo === 'ranking' ? 'Ranking: ' + esc(S.rankings.find(k => k.id === r.ref)?.titulo || '') : 'Usuario: ' + esc(nombreVisible(r.ref))}</div><div class="mini gris">Reportó ${esc(nombreVisible(r.por))} · ${hace(r.fecha)}</div><div class="fila" style="margin-top:8px">${r.tipo !== 'usuario' ? `<button class="btn-peligro" data-a="resolverRep" data-id="${r.id}" data-e="quitado">Quitar contenido</button>` : ''}<button class="btn3" data-a="resolverRep" data-id="${r.id}" data-e="descartado">Descartar</button></div></div>`; }).join('') || '<p class="peq gris">Sin reportes abiertos.</p>'}</section>
    <section class="tarjeta"><h2>Profesores propuestos</h2>${(S.profesPend || []).map(p => `<div style="padding:10px 0;border-bottom:1px solid var(--linea)"><b>${esc(p.nombre)}</b> <span class="mini gris">· ${esc(p.area)} · por ${esc(nombreVisible(p.por))}${p.apoyos.length ? ` y ${p.apoyos.length} más` : ''}</span><p class="peq" style="margin:4px 0">${esc(p.materias.join(', '))}</p><div class="fila"><button class="btn2" data-a="moderarProfe" data-id="${p.id}" data-ok="1">Aprobar</button><button class="btn3" data-a="moderarProfe" data-id="${p.id}" data-ok="0">Rechazar</button></div></div>`).join('') || '<p class="peq gris">Nada pendiente.</p>'}</section>
    <section class="tarjeta"><h2>Lugares propuestos para el mapa</h2>${(S.lugaresPend || []).map(l => `<div style="padding:10px 0;border-bottom:1px solid var(--linea)"><b>${esc(l.nombre)}</b> <span class="mini gris">· ${esc(ZONAS_CAMPUS.find(z => z.id === l.zona)?.nombre || '')} · por ${esc(nombreVisible(l.por))}</span><p class="peq" style="margin:4px 0">${esc(l.como)}</p><div class="fila"><button class="btn2" data-a="moderarLugar" data-id="${l.id}" data-ok="1">Aprobar</button><button class="btn3" data-a="moderarLugar" data-id="${l.id}" data-ok="0">Rechazar</button></div></div>`).join('') || '<p class="peq gris">Nada pendiente.</p>'}</section>
    <section class="tarjeta"><h2>Verificaciones pendientes</h2>${ver.map(u => `<div class="entre" style="padding:10px 0;border-bottom:1px solid var(--linea)"><span><b>@${esc(u.usuario)}</b><br><span class="mini gris">${esc(u.nombre)} · ${esc(u.carrera)} · ${esc(u.tipoDocumento || 'documento')}: ${esc(u.documento || '')}</span></span><span class="fila"><button class="btn2" data-a="aprobarVer" data-u="${u.id}" data-ok="1">Aprobar</button><button class="btn3" data-a="aprobarVer" data-u="${u.id}" data-ok="0">Rechazar</button></span></div>`).join('') || '<p class="peq gris">Nadie en espera.</p>'}</section>`;
}
function admPredicciones() {
  const preds = DB.estado.propuestas.filter(p => p.tipo === 'prediccion').sort((a, b) => b.fecha.localeCompare(a.fecha));
  return preds.map(p => {
    const total = DB.pozo(p), personas = i => new Set(p.apuestas.filter(a => a.op === i).map(a => a.u)).size;
    const horas = Array(24).fill(0), fin = Math.max(...p.apuestas.map(a => new Date(a.f).getTime()), Date.now() - 864e5);
    p.apuestas.forEach(a => { const h = 23 - Math.floor((fin - new Date(a.f).getTime()) / 36e5); if (h >= 0 && h < 24) horas[h] += a.monto; });
    const mx = Math.max(1, ...horas), media = horas.reduce((s, v) => s + v, 0) / 24;
    return `<section class="tarjeta"><div class="entre"><span class="insignia ${p.estado === 'abierta' ? 'i-verde' : p.estado === 'congelada' || p.estado === 'disputa' ? 'i-naranja' : 'i-morado'}">${p.estado}</span><span class="mini gris">${DB.esGrande(p) ? '<span class="insignia i-amarillo">Grande</span> ' : ''}cierra ${cierreBonito(p.cierre)}</span></div>
      <h2 style="margin:8px 0">${esc(p.titulo)}</h2>
      <div class="rejilla4"><div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">Pozo</span><br><b>${numero(total)}</b></div>${p.opciones.map((o, i) => `<div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">${esc(o)}</span><br><b>${numero(DB.pozoOpcion(p, i))}</b> <span class="mini gris">· ${personas(i)} pers.</span></div>`).join('')}<div style="background:var(--avisoBg);border-radius:12px;padding:10px"><span class="mini" style="color:var(--avisoTxt)">Fondo (${REGLAS.comisionFondo * 100}%)</span><br><b>${Math.round(total * REGLAS.comisionFondo)}</b></div></div>
      <p class="mini gris" style="margin:12px 0 4px">Ramitas apostadas por hora (últimas 24 h con actividad) · naranja = fuera de lo normal</p>
      <div style="display:grid;grid-template-columns:repeat(24,1fr);gap:2px;align-items:end;height:90px;border-bottom:1px solid var(--linea)">${horas.map(v => `<span title="${v}" style="height:${Math.max(2, v / mx * 88)}px;border-radius:3px 3px 0 0;background:${v > media * 3 && v >= 100 ? '#C2410C' : '#6D4BA0'}"></span>`).join('')}</div>
      ${p.arbitraje ? `<div style="margin-top:12px;background:var(--suave);border-radius:12px;padding:10px" class="peq"><b>Reportado:</b> ganó ${esc(p.opciones[p.arbitraje.op])} · por @${esc(DB.usuario(p.arbitraje.por)?.usuario)}${DB.aposto(p, p.arbitraje.por) ? ' <span class="insignia i-naranja">apostó</span>' : ''}<br><span class="gris">Prueba:</span> ${esc(p.arbitraje.evidencia)}<br><b>${p.arbitraje.confirman.length}</b> confirmaron (${p.arbitraje.confirman.map(u => '@' + esc(DB.usuario(u)?.usuario)).join(', ') || 'nadie'})${p.arbitraje.disputan.map(x => `<div style="margin-top:6px;border-left:3px solid var(--naranja);padding-left:8px"><b>Disputa</b> de @${esc(DB.usuario(x.u)?.usuario)}${DB.aposto(p, x.u) ? ' (apostó)' : ''}: ${x.op != null ? `dice que ganó ${esc(p.opciones[x.op])}. ` : ''}${esc(x.motivo)}</div>`).join('')}</div>` : ''}
      ${p.estado === 'abierta' || p.estado === 'congelada' || p.estado === 'disputa' ? `<div class="fila" style="margin-top:12px">${p.opciones.map((o, i) => `<button class="btn2" data-a="resolverPred" data-id="${p.id}" data-op="${i}">Ganó: ${esc(o)}</button>`).join('')}<button class="btn3" data-a="congelarPred" data-id="${p.id}">${p.estado === 'congelada' ? 'Descongelar' : 'Congelar'}</button><button class="btn-peligro" data-a="anularPred" data-id="${p.id}">Anular y devolver</button></div>` : p.estado === 'resuelta' ? `<p class="peq" style="margin:10px 0 0">Ganó: <b>${esc(p.opciones[p.ganadora])}</b></p>` : ''}
      <details style="margin-top:10px"><summary class="peq" style="cursor:pointer">Ver ${p.apuestas.length} apuestas</summary><div class="tabla"><table><thead><tr><th>Usuario</th><th>Opción</th><th class="num">Ramitas</th><th>Cuándo</th></tr></thead><tbody>${p.apuestas.slice().reverse().map(a => `<tr><td><button class="btn3" style="min-height:34px;padding:0 10px" data-a="verUsuarioAdm" data-u="${a.u}">@${esc(DB.usuario(a.u)?.usuario)}</button></td><td>${esc(p.opciones[a.op])}</td><td class="num">${a.monto}</td><td>${hace(a.f)}</td></tr>`).join('')}</tbody></table></div></details></section>`;
  }).join('') + fichaUsuarioAdm();
}
function fichaUsuarioAdm() {
  const id = UI.admUsuario; if (!id) return ''; const u = DB.usuario(id), s = DB.estadisticasUsuario(id);
  const hist = DB.estado.propuestas.filter(p => p.apuestas.some(a => a.u === id)).map(p => { const a = p.apuestas.filter(x => x.u === id), m = a.reduce((t, x) => t + x.monto, 0), op = a[0].op; return `<div class="entre" style="padding:6px 0;border-bottom:1px solid var(--linea)"><span class="peq">${esc(p.titulo)}<br><span class="mini gris">${m} a ${esc(p.opciones[op])}</span></span><b class="peq" style="color:${p.estado !== 'resuelta' ? 'var(--gris)' : p.ganadora === op ? 'var(--okTxt)' : 'var(--malTxt)'}">${p.estado !== 'resuelta' ? 'Pendiente' : p.ganadora === op ? 'Ganó' : 'Perdió'}</b></div>`; }).join('');
  return `<section class="tarjeta" id="fichaUsuario" style="border:2px solid var(--morado)"><div class="entre"><h2>@${esc(u.usuario)}</h2><button class="icono-btn" data-a="verUsuarioAdm" data-u="" aria-label="Cerrar">${icono('cerrar')}</button></div><p class="peq gris" style="margin:4px 0 10px">${esc(u.nombre)} · ${esc(u.carrera)} · Gen ${esc(u.gen)} · verificado: ${esc(u.verificado)}</p>
    <div class="rejilla4"><div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">Aciertos</span><br><b>${s.n ? s.g + '/' + s.n : '—'}</b></div><div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">Neto en predicciones</span><br><b>${s.neto >= 0 ? '+' : ''}${s.neto}</b></div><div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">Saldo</span><br><b>${DB.saldo(id)}</b></div><div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">Cuentas en su dispositivo</span><br><b style="color:${s.mismos ? 'var(--malTxt)' : 'inherit'}">${s.mismos}</b></div></div>
    <h3 style="margin:12px 0 4px">Historial</h3>${hist || '<p class="peq gris">Sin predicciones.</p>'}</section>`;
}
function admAlertas() {
  const l = DB.alertas();
  return l.map(a => `<article class="tarjeta" style="border:1px solid ${a.nivel === 'Alta' ? '#FCA5A5' : '#FDBA74'}"><div class="fila"><span class="insignia ${a.nivel === 'Alta' ? 'i-rojo' : 'i-naranja'}">${a.nivel}</span><b>${esc(a.titulo)}</b></div><p class="peq" style="margin:8px 0">${esc(a.detalle)}</p><div class="fila">${a.prop ? `<button class="btn2" data-a="congelarPred" data-id="${a.prop}">Congelar predicción</button>` : ''}${a.usuario ? `<button class="btn2" data-a="verUsuarioAdmTab" data-u="${a.usuario}">Ver historial</button>` : ''}<button class="btn3" data-a="cerrarAlerta" data-id="${esc(a.id)}">Descartar</button></div></article>`).join('') || '<p class="vacio">Sin alertas. Todo tranquilo.</p>';
}
function admEconomia() {
  const e = DB.economia(), dias = []; for (let i = 6; i >= 0; i--) { const f = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); dias.push([f, e.dias[f] || { e: 0, s: 0 }]); }
  const mx = Math.max(1, ...dias.map(([, d]) => Math.max(d.e, d.s))), sana = e.salieron >= e.entraron * 0.15;
  return `<section class="tarjeta" style="border:2px solid ${sana ? '#15803D' : '#C2410C'}"><b style="color:${sana ? 'var(--okTxt)' : '#C2410C'}">${sana ? 'Economía estable' : 'Están entrando muchas más ramitas de las que salen'}</b><p class="peq" style="margin:6px 0 0">${sana ? 'Lo que se emite y lo que regresa al fondo están balanceados.' : 'Considera bajar regalos o subir la comisión del fondo. Hoy la comisión es ' + REGLAS.comisionFondo * 100 + '%.'}</p></section>
    <div class="rejilla4">${[['Entraron (7 días)', e.entraron], ['Salieron (fondo y casino)', e.salieron], ['En circulación', e.circulacion], ['En juego ahora', e.enJuego + e.enCreditos]].map(([t, v]) => `<div class="tarjeta" style="padding:12px"><span class="mini gris">${t}</span><br><b style="font-family:Sora,sans-serif;font-size:22px">${numero(v)}</b></div>`).join('')}</div>
    <section class="tarjeta"><h2>Entradas y salidas por día</h2><div class="fila mini gris" style="margin:6px 0"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#4B1F7A"></span>Entraron <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#F5B700;margin-left:10px"></span>Salieron</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:130px">${dias.map(([f, d]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="display:flex;gap:2px;align-items:flex-end;height:108px"><span style="width:12px;height:${Math.max(2, d.e / mx * 106)}px;background:#4B1F7A;border-radius:4px 4px 0 0"></span><span style="width:12px;height:${Math.max(2, d.s / mx * 106)}px;background:#F5B700;border-radius:4px 4px 0 0"></span></div><span class="mini gris">${new Date(f + 'T12:00').toLocaleDateString('es-MX', { weekday: 'short' }).slice(0, 2)}</span></div>`).join('')}</div></section>
    <section class="tarjeta"><h2 style="margin-bottom:6px">Reglas de equilibrio</h2>${[['Comisión del Fondo del castor', REGLAS.comisionFondo * 100 + '%'], ['Máximo por predicción', REGLAS.maxPorPrediccion], ['Máximo diario en predicciones', REGLAS.maxPrediccionDia], ['Regalo diario', REGLAS.regaloDiario], ['Tope diario en retos', REGLAS.topeRetosDia], ['Ramitas al casino por día', REGLAS.maxCasinoDia], ['Créditos por ramita', REGLAS.creditosPorRamita], ['Propuestas por día', REGLAS.limitePropuestasDia]].map(([t, v]) => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span class="peq">${t}</span><b>${v}</b></div>`).join('')}</section>`;
}

UI.reg = UI.reg || {}; Object.assign(UI, { regDia: 'hoy', regTipo: 'todo', regQuien: '' });
const TIPOS_REG = [['todo', 'Todo'], ['ramitas', 'Ramitas'], ['propuestas', 'Propuestas'], ['publicaciones', 'Publicaciones'], ['tablon', 'Tablón'], ['casino', 'Casino'], ['musica', 'Música'], ['reportes', 'Reportes'], ['cuentas', 'Cuentas']];
function eventosRegistro() {
  const S = DB.estado, ev = [], nom = id => id === 'FONDO' ? 'Fondo' : '@' + (DB.usuario(id)?.usuario || '?');
  S.libro.forEach(m => ev.push({ f: m.f, tipo: 'ramitas', u: m.u, txt: `${(typeof NOMBRE_MOV !== 'undefined' && NOMBRE_MOV[m.tipo]) || m.tipo}${m.ref ? ' · ' + m.ref : ''}`, monto: m.monto, disp: m.disp }));
  (S.bitacora || []).forEach(b => ev.push({ f: b.f, tipo: 'propuestas', u: b.u, txt: `${b.accion} “${b.titulo}”${b.extra ? ' · ' + b.extra : ''}` }));
  S.posts.forEach(p => { ev.push({ f: p.fecha, tipo: 'publicaciones', u: p.autor, txt: `publicó: “${String(p.texto || '').slice(0, 80)}”` }); (p.comentarios || []).forEach(c => ev.push({ f: c.fecha || p.fecha, tipo: 'publicaciones', u: c.autor, txt: `comentó: “${String(c.texto || '').slice(0, 60)}”` })); });
  (S.tablonItems || []).forEach(t => ev.push({ f: t.fecha, tipo: 'tablon', u: t.autor, txt: `fijó ${t.tipo === 'nota' ? 'una nota' : t.tipo === 'evento' ? 'el evento “' + t.titulo + '”' : '“' + (t.titulo || t.archivo?.nombre || '') + '”'} en ${(S.tablones.find(x => x.id === t.tablon) || {}).nombre || 'un tablón'}` }));
  (S.jugadas || []).forEach(j => ev.push({ f: j.f, tipo: 'casino', u: j.u, txt: `${j.juego}: apostó ${j.apuesta} y le pagó ${j.pago}`, monto: j.pago - j.apuesta, unidad: 'cr.' }));
  (S.escuchas || []).forEach(e => ev.push({ f: e.f, tipo: 'musica', u: e.u, txt: `escuchó “${e.titulo}” de ${nom(e.dueno)}` }));
  S.reportes.forEach(r => ev.push({ f: r.fecha, tipo: 'reportes', u: r.por, txt: `reportó ${r.tipo}: ${r.motivo} (${r.estado})` }));
  Object.values(S.usuarios).forEach(u => u.creado && ev.push({ f: u.creado, tipo: 'cuentas', u: u.id, txt: `se creó la cuenta (${u.contacto || ''})` }));
  return ev.filter(e => e.f).sort((a, b) => b.f.localeCompare(a.f));
}
function filtrarRegistro() {
  const hoy = fechaLocal(), ayer = sumarDias(hoy, -1), d = UI.regDia, q = UI.regQuien.trim().toLowerCase().replace(/^@/, '');
  return eventosRegistro().filter(e => { const dia = fechaLocal(new Date(e.f));
    if (d === 'hoy' && dia !== hoy) return false; if (d === 'ayer' && dia !== ayer) return false; if (d === '7' && dia < sumarDias(hoy, -6)) return false; if (/^\d{4}-\d{2}-\d{2}$/.test(d) && dia !== d) return false;
    if (UI.regTipo !== 'todo' && e.tipo !== UI.regTipo) return false;
    if (q && !String(DB.usuario(e.u)?.usuario || e.u).toLowerCase().includes(q)) return false; return true; });
}
function admRegistro() {
  const l = filtrarRegistro(), sosp = new Set(Object.values(DB.estado.usuarios).filter(u => Object.values(DB.estado.usuarios).filter(v => v.dispositivo === u.dispositivo).length >= 3).map(u => u.id));
  const dias = new Map(); l.slice(0, 400).forEach(e => { const k = fechaLocal(new Date(e.f)); if (!dias.has(k)) dias.set(k, []); dias.get(k).push(e); });
  const etiquetaDia = k => k === fechaLocal() ? 'Hoy' : k === sumarDias(fechaLocal(), -1) ? 'Ayer' : new Date(k + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const color = { ramitas: 'i-amarillo', propuestas: 'i-morado', publicaciones: 'i-azul', tablon: 'i-naranja', casino: 'i-rojo', musica: 'i-verde', reportes: 'i-rojo', cuentas: 'i-morado' };
  return `<section class="tarjeta pila" style="gap:10px"><h2>Registro de actividad</h2>
    <div class="pestanas">${[['hoy', 'Hoy'], ['ayer', 'Ayer'], ['7', '7 días'], ['todo', 'Todo']].map(([k, n]) => `<button class="pastilla${UI.regDia === k ? ' on' : ''}" data-a="regFiltro" data-k="regDia" data-v="${k}">${n}</button>`).join('')}<label class="oculto" for="regFecha">Día</label><input id="regFecha" type="date" max="${fechaLocal()}" value="${/^\d{4}/.test(UI.regDia) ? UI.regDia : ''}" data-cambio="regFecha" style="max-width:160px;min-height:38px"></div>
    <div class="pestanas">${TIPOS_REG.map(([k, n]) => `<button class="pastilla${UI.regTipo === k ? ' on' : ''}" data-a="regFiltro" data-k="regTipo" data-v="${k}">${n}</button>`).join('')}</div>
    <label class="oculto" for="regQuien">Persona</label><input id="regQuien" type="search" placeholder="Filtrar por @usuario" value="${esc(UI.regQuien)}" data-cambio="regQuien" autocomplete="off">
    <p class="mini gris" style="margin:0">${l.length} movimiento${l.length === 1 ? '' : 's'}${l.length > 400 ? ' (se muestran los 400 más recientes)' : ''} · Solo se agregan; nunca se editan ni borran. Los mensajes privados no aparecen.</p></section>
    ${[...dias.entries()].map(([k, evs]) => `<section class="tarjeta"><div class="entre"><h3 style="margin:0;text-transform:capitalize">${etiquetaDia(k)}</h3><span class="mini gris">${evs.length}</span></div>
      ${evs.map(e => `<div class="fila" style="flex-wrap:nowrap;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--linea);${sosp.has(e.u) && e.tipo === 'ramitas' && e.monto < 0 ? 'background:var(--avisoBg)' : ''}"><span class="mini gris" style="min-width:44px">${new Date(e.f).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span><span class="peq" style="flex:1;min-width:0"><b>${e.u === 'FONDO' ? 'Fondo' : '@' + esc(DB.usuario(e.u)?.usuario || '?')}</b> ${esc(e.txt)} <span class="insignia ${color[e.tipo] || ''}" style="font-size:10px">${e.tipo}</span></span>${e.monto != null ? `<b class="peq" style="white-space:nowrap;color:${e.monto >= 0 ? 'var(--okTxt)' : 'var(--malTxt)'}">${e.monto >= 0 ? '+' : MENOS}${numero(Math.abs(e.monto))}${e.unidad ? ' ' + e.unidad : ''}</b>` : ''}</div>`).join('')}</section>`).join('') || '<p class="vacio">No hay movimientos con estos filtros.</p>'}
    <button class="btn3" data-a="copiarRegistro">Copiar lo filtrado (CSV)</button>`;
}
ACC.regFiltro = b => { UI[b.dataset.k] = b.dataset.v; refrescar(); };
CAMBIOS.regFecha = el => { if (el.value) { UI.regDia = el.value; refrescar(); } };
CAMBIOS.regQuien = el => { UI.regQuien = el.value; refrescar(); };
ACC.admTab = b => { UI.admTab = b.dataset.t; refrescar(); };
ACC.moderar = b => { DB.moderarRanking(b.dataset.id, b.dataset.e); refrescar(); };
ACC.resolverRep = b => { DB.resolverReporte(b.dataset.id, b.dataset.e); refrescar(); };
ACC.aprobarVer = b => { DB.aprobarVerificacion(b.dataset.u, b.dataset.ok === '1'); refrescar(); };
ACC.resolverPred = b => { const p = DB.estado.propuestas.find(x => x.id === b.dataset.id); abrirHoja(`<h2>¿Confirmas que ganó "${esc(p.opciones[+b.dataset.op])}"?</h2><p class="gris">Se reparte el pozo entre quienes acertaron y no se puede deshacer.</p><div class="pila"><button class="btn2 ancho" data-a="confirmarResolver" data-id="${p.id}" data-op="${b.dataset.op}">Sí, repartir</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`); };
ACC.confirmarResolver = b => { DB.resolver(b.dataset.id, +b.dataset.op); cerrarHoja(); aviso('Pozo repartido'); refrescar(); };
ACC.anularPred = b => { abrirHoja(`<h2>¿Anular y devolver?</h2><p class="gris">A cada quien se le regresa lo que apostó.</p><div class="pila"><button class="btn-peligro ancho" data-a="confirmarAnular" data-id="${b.dataset.id}">Sí, anular</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`); };
ACC.confirmarAnular = b => { DB.anular(b.dataset.id); cerrarHoja(); refrescar(); };
ACC.congelarPred = b => { DB.congelar(b.dataset.id); aviso('Listo'); refrescar(); };
ACC.cerrarAlerta = b => { DB.cerrarAlerta(b.dataset.id); refrescar(); };
ACC.verUsuarioAdm = b => { UI.admUsuario = b.dataset.u || null; refrescar(); $('#fichaUsuario')?.scrollIntoView({ behavior: 'smooth' }); };
ACC.verUsuarioAdmTab = b => { UI.admTab = 'predicciones'; UI.admUsuario = b.dataset.u; pintar(); $('#fichaUsuario')?.scrollIntoView({ behavior: 'smooth' }); };
ACC.copiarRegistro = () => { const csv = 'fecha,cuenta,tipo,detalle,monto\n' + filtrarRegistro().map(e => [e.f, DB.usuario(e.u)?.usuario || e.u, e.tipo, e.txt, e.monto ?? ''].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'); navigator.clipboard?.writeText(csv).then(() => aviso('Copiado: pégalo en Excel o Sheets'), () => aviso('No se pudo copiar')); };

ACC.moderarLugar = b => { DB.moderarLugar(b.dataset.id, b.dataset.ok === '1'); refrescar(); };

UI.admCont = 'post';
function admContenido() {
  const S = DB.estado, t = UI.admCont;
  const tipos = [['post', 'Publicaciones', S.posts.filter(p => !p.oculto)], ['propuesta', 'Propuestas', S.propuestas], ['ranking', 'Rankings', S.rankings], ['profe', 'Profesores', S.profes], ['venta', 'Compraventa', S.ventas], ['nivel', 'Niveles', S.niveles], ['evento', 'Eventos', S.eventos], ['lugar', 'Mapa', DB.lugares()], ['usuario', 'Usuarios', Object.values(S.usuarios)]];
  const [, , lista] = tipos.find(x => x[0] === t);
  const fila = (titulo, sub, acciones) => `<div class="entre" style="padding:10px 0;border-bottom:1px solid var(--linea);align-items:flex-start"><span style="min-width:0"><b class="peq" style="overflow-wrap:anywhere">${titulo}</b><br><span class="mini gris">${sub}</span></span><span class="fila" style="flex:none">${acciones}</span></div>`;
  const quitar = id => `<button class="btn-peligro" style="min-height:38px;padding:0 12px" data-a="eliminar" data-tipo="${t}" data-id="${esc(id)}">Eliminar</button>`;
  const filas = lista.slice().reverse().map(x => {
    if (t === 'post') return fila(esc(x.texto.slice(0, 90)), `${esc(nombreVisible(x.autor))} · ${hace(x.fecha)} · ${x.comentarios.length} comentarios`, quitar(x.id));
    if (t === 'propuesta') return fila(esc(x.titulo), `${x.tipo} · ${x.estado} · ${esc(nombreVisible(x.autor))}${x.apuestas.length ? ' · pozo ' + DB.pozo(x) : ''}`, DB.protegida(x.id) ? '<span class="insignia i-amarillo">Con ramitas: protegida</span>' : quitar(x.id));
    if (t === 'ranking') return fila(esc(x.titulo), `${x.estado} · ${Object.keys(x.votos).length} votos · ${esc(nombreVisible(x.autor))}`, quitar(x.id));
    if (t === 'profe') return fila(esc(x.nombre), `${esc(x.area)} · ${x.opiniones.length} opiniones · ${DB.calificacion(x)?.toFixed(1) || '—'}`, `<a class="btn3" style="min-height:38px;padding:0 12px" href="#/profe/${x.id}">Ver</a>` + quitar(x.id));
    if (t === 'venta') return fila(esc(x.titulo), `${x.tipo} · ${esc(nombreVisible(x.autor))} · ${hace(x.fecha)}`, quitar(x.id));
    if (t === 'nivel') return fila(esc(x.nombre), `${x.oficial ? 'oficial' : 'comunidad'} · ${x.likes} me gusta · ${esc(nombreVisible(x.autor))}`, quitar(x.id));
    if (t === 'evento') return fila(esc(x.titulo), `${fechaBonita(x.fecha)} · ${esc(x.lugar)}`, quitar(x.id));
    if (t === 'lugar') return fila(esc(x.nombre), x.por ? 'agregado por ' + esc(nombreVisible(x.por)) : 'del croquis oficial', quitar(x.id));
    return fila('@' + esc(x.usuario) + (x.suspendido ? ' · <span style="color:var(--malTxt)">suspendido</span>' : ''), `${esc(x.nombre)} · ${esc(x.carrera)} · ${x.rol}`, x.id === DB.yo().id ? '<span class="mini gris">Tú</span>' : `<a class="btn3" style="min-height:38px;padding:0 12px" href="#/perfil/${esc(x.usuario)}">Ver</a><button class="${x.suspendido ? 'btn2' : 'btn-peligro'}" style="min-height:38px;padding:0 12px" data-a="suspender" data-u="${x.id}">${x.suspendido ? 'Reactivar' : 'Suspender'}</button>`);
  }).join('');
  return `<div class="pestanas">${tipos.map(([k, n, l]) => `<button class="pastilla${t === k ? ' on' : ''}" data-a="admCont" data-t="${k}">${n} · ${l.length}</button>`).join('')}</div><section class="tarjeta">${filas || '<p class="vacio">No hay nada aquí.</p>'}</section>`;
}
ACC.admCont = b => { UI.admCont = b.dataset.t; refrescar(); };
ACC.moderarProfe = b => { DB.moderarProfe(b.dataset.id, b.dataset.ok === '1'); refrescar(); };

UI.admBusca = '';
function admUsuarios() {
  const q = UI.admBusca.trim().toLowerCase().replace(/^@/, ''), S = DB.estado;
  const lista = Object.values(S.usuarios).filter(u => u.id !== 'u_equipo' && (!q || [u.usuario, u.nombre, u.contacto, u.carrera].some(x => String(x || '').toLowerCase().includes(q))));
  const reportesDe = id => reportesContra(id).length;
  const sel = UI.admUsuario && DB.usuario(UI.admUsuario);
  return `<section class="tarjeta pila" style="gap:10px"><label class="oculto" for="admBus">Buscar usuario</label><input id="admBus" type="search" placeholder="Buscar por @usuario, nombre, correo o carrera" value="${esc(UI.admBusca)}" data-entrada="admBuscar" autocomplete="off">
    <div id="admLista" class="pila" style="gap:0">${filasUsuariosAdm(lista, reportesDe)}</div></section>${sel ? fichaCompletaAdm(sel) : ''}`;
}
function filasUsuariosAdm(lista, reportesDe) {
  return lista.slice(0, 60).map(u => `<button class="entre" style="padding:10px 4px;border:0;border-bottom:1px solid var(--linea);background:${UI.admUsuario === u.id ? 'var(--suave)' : 'transparent'};text-align:left;width:100%;font:inherit;color:inherit;cursor:pointer" data-a="abrirFichaAdm" data-u="${u.id}">
    <span class="fila" style="flex-wrap:nowrap">${avatar(u.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span><b>@${esc(u.usuario)}</b>${u.rol === 'admin' ? ' <span class="insignia i-morado">admin</span>' : ''}${u.suspendido ? ' <span class="insignia i-rojo">suspendido</span>' : ''}<br><span class="mini gris">${esc(u.carrera || '')} · ${u.verificado === 'si' ? 'verificado' : u.verificado === 'pendiente' ? 'en revisión' : 'sin verificar'}</span></span></span>
    <span style="text-align:right"><b>${numero(DB.saldo(u.id))}</b><br>${reportesDe(u.id) ? `<span class="insignia i-rojo">${reportesDe(u.id)} reporte${reportesDe(u.id) > 1 ? 's' : ''}</span>` : ''}</span></button>`).join('') || '<p class="peq gris">Nadie coincide.</p>';
}

function reportesContra(id) {
  const S = DB.estado, autorDe = r => r.tipo === 'usuario' ? r.ref : r.tipo === 'post' ? S.posts.find(p => p.id === r.ref)?.autor : r.tipo === 'ranking' ? S.rankings.find(x => x.id === r.ref)?.autor : r.tipo === 'tablon' ? S.tablonItems.find(x => x.id === r.ref)?.autor : r.tipo === 'venta' ? S.ventas.find(x => x.id === r.ref)?.autor : r.quien || null;
  return S.reportes.filter(r => autorDe(r) === id);
}
function graficaLineas(series, alto = 160) {
  const W = 600, H = alto, todos = series.flatMap(s => s.puntos); if (todos.length < 2) return '<p class="peq gris" style="margin:0">Todavía no hay suficientes datos para graficar.</p>';
  const xs = todos.map(p => p[0]), ys = todos.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1, y0 = Math.min(0, ...ys), y1 = Math.max(1, ...ys);
  const X = x => 8 + (x - x0) / ((x1 - x0) || 1) * (W - 16), Y = y => H - 18 - (y - y0) / ((y1 - y0) || 1) * (H - 30);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(series.map(s => s.nombre).join(' y '))}" style="display:block;background:var(--suave);border-radius:12px">
    <line x1="8" x2="${W - 8}" y1="${Y(0)}" y2="${Y(0)}" stroke="#B9AFCB" stroke-dasharray="4 4"/>
    ${series.map(s => `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" ${s.punteada ? 'stroke-dasharray="6 5"' : ''} points="${s.puntos.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>`).join('')}
    <text x="12" y="14" font-size="12" fill="#6B6280">${numero(Math.round(y1))}</text><text x="12" y="${H - 4}" font-size="12" fill="#6B6280">${numero(Math.round(y0))}</text></svg>
    <div class="fila mini" style="margin-top:4px">${series.map(s => `<span class="fila" style="gap:4px"><span style="width:14px;height:3px;background:${s.color};display:inline-block"></span>${esc(s.nombre)}</span>`).join('')}</div>`;
}
function fichaCompletaAdm(u) {
  const S = DB.estado, id = u.id, libro = S.libro.filter(m => m.u === id).sort((a, b) => a.f.localeCompare(b.f));
  let acum = 0; const saldoPts = libro.map(m => [new Date(m.f).getTime(), acum += m.monto]);
  const por = {}; libro.forEach(m => { const k = m.tipo; por[k] = por[k] || { e: 0, s: 0 }; if (m.monto >= 0) por[k].e += m.monto; else por[k].s -= m.monto; });
  const nombres = { regalo: 'Regalos', diario: 'Regalo diario', reto: 'Retos', juego: 'Juegos diarios', racha: 'Rachas', apuesta: 'Puso en predicciones', ganancia: 'Ganó en predicciones', devolucion: 'Devoluciones', premio: 'Premios', casino: 'Ruleta y tragamonedas', compra: 'Compras' };
  const J = (S.jugadas || []).filter(j => j.u === id && (UI.admJuego === 'todo' || j.juego === UI.admJuego)), ap = J.reduce((s, j) => s + j.apuesta, 0), pag = J.reduce((s, j) => s + j.pago, 0), real = pag - ap, esp = J.reduce((s, j) => s + j.apuesta * j.ev, 0);
  const vari = J.reduce((s, j) => s + j.apuesta * j.apuesta * (j.v || (j.juego === 'ruleta' ? 1 : 4)), 0), z = vari ? (real - esp) / Math.sqrt(vari) : 0;
  const st = DB.estadisticasUsuario(id), preds = S.propuestas.filter(p => p.apuestas.some(a => a.u === id));
  const repC = reportesContra(id), repH = S.reportes.filter(r => r.por === id);
  const actividad = [['Publicaciones', S.posts.filter(p => p.autor === id).length], ['Comentarios', S.posts.reduce((n, p) => n + p.comentarios.filter(c => c.autor === id).length, 0)], ['Propuestas', S.propuestas.filter(p => p.autor === id).length], ['Rankings', S.rankings.filter(r => r.autor === id).length], ['Cosas en tablones', (S.tablonItems || []).filter(x => x.autor === id).length], ['Ventas', S.ventas.filter(v => v.autor === id).length], ['Opiniones de profes', S.profes.reduce((n, p) => n + p.opiniones.filter(o => o.u === id).length, 0)], ['Jugadas de casino', J.length]];
  const caja = (t, v, color = '') => `<div style="background:var(--suave);border-radius:12px;padding:10px"><span class="mini gris">${t}</span><br><b style="${color}">${v}</b></div>`;
  return `<section class="tarjeta pila" id="fichaUsuario" style="border:2px solid var(--morado);gap:14px">
    <div class="entre"><span class="fila" style="flex-wrap:nowrap">${avatar(id, true)}<span><h2>@${esc(u.usuario)}</h2><span class="peq gris">${esc(u.nombre || '')} · ${esc(u.carrera || '')}${u.semestre ? ' · ' + u.semestre + '.º' : ''}</span><br><span class="mini gris">Desde ${new Date(u.creado).toLocaleDateString('es-MX')} · ${u.verificado === 'si' ? 'Verificado' + (u.correoUni ? ' con ' + esc(u.correoUni) : '') : u.verificado === 'pendiente' ? 'En revisión (' + esc(u.tipoDocumento || 'documento') + ')' : 'Sin verificar'}${u.contacto ? ' · ' + esc(u.contacto) : ''}</span></span></span>
      <button class="icono-btn" data-a="abrirFichaAdm" data-u="" aria-label="Cerrar">${icono('cerrar')}</button></div>
    ${u.id !== DB.yo().id ? `<button class="${u.suspendido ? 'btn2' : 'btn-peligro'}" style="align-self:flex-start" data-a="suspender" data-u="${id}">${u.suspendido ? 'Reactivar cuenta' : 'Suspender cuenta'}</button>` : ''}
    <div class="rejilla4">${caja('Saldo', numero(DB.saldo(id)))}${caja('Le entró', '+' + numero(libro.filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0)), 'color:var(--okTxt)')}${caja('Le salió', MENOS + numero(-libro.filter(m => m.monto < 0).reduce((s, m) => s + m.monto, 0)), 'color:var(--malTxt)')}${caja('Compró', numero(por.compra?.e || 0))}</div>
    <div><h3 style="margin:0 0 6px">Ramitas en el tiempo</h3>${graficaLineas([{ nombre: 'Saldo', color: '#4B1F7A', puntos: saldoPts }])}</div>
    <div class="tabla"><table><thead><tr><th>De dónde</th><th class="num">Entró</th><th class="num">Salió</th></tr></thead><tbody>${Object.entries(por).map(([k, v]) => `<tr><td>${esc(nombres[k] || k)}</td><td class="num">${v.e ? '+' + numero(v.e) : ''}</td><td class="num">${v.s ? MENOS + numero(v.s) : ''}</td></tr>`).join('') || '<tr><td colspan="3" class="gris">Sin movimientos</td></tr>'}</tbody></table></div>
    <div><div class="entre"><h3 style="margin:0 0 6px">Ruleta y tragamonedas</h3><span class="fila" style="gap:4px">${[['todo', 'Todo'], ['ruleta', 'Ruleta'], ['tragamonedas', 'Tragamonedas']].map(([k, n]) => `<button class="pastilla${UI.admJuego === k ? ' on' : ''}" style="min-height:34px;padding:0 10px;font-size:12px" data-a="admJuego" data-j="${k}">${n}</button>`).join('')}</span></div>${J.length ? `<div class="rejilla4">${caja('Jugadas', numero(J.length))}${caja('Apostó', numero(ap) + ' cr.')}${caja('Resultado', (real >= 0 ? '+' : MENOS) + numero(Math.abs(real)) + ' cr.', real >= 0 ? 'color:var(--okTxt)' : 'color:var(--malTxt)')}${caja('Lo esperado', (esp >= 0 ? '+' : MENOS) + numero(Math.abs(Math.round(esp))) + ' cr.')}</div>
      <p class="peq" style="margin:8px 0">${Math.abs(z) < 2 ? 'Sus resultados <b>concuerdan con la probabilidad</b>.' : z >= 2 ? `<b style="color:var(--avisoTxt)">Le está yendo mejor de lo normal</b> (${z.toFixed(1)} desviaciones). Con pocas jugadas puede ser suerte; si sigue así, revisa.` : `Le está yendo peor de lo normal (${z.toFixed(1)} desviaciones); también puede ser mala racha.`}</p>
      ${graficaCasino(J)}
      <p class="mini gris" style="margin:6px 0 0">Ruleta: ${J.filter(j => j.juego === 'ruleta').length} · Tragamonedas: ${J.filter(j => j.juego === 'tragamonedas').length} · Última: ${hace(J.at(-1).f)}</p>` : '<p class="peq gris" style="margin:0">No ha jugado.</p>'}</div>
    <div><h3 style="margin:0 0 6px">Predicciones</h3><div class="rejilla4">${caja('Participó', preds.length)}${caja('Acertó', st.n ? st.g + '/' + st.n : '—')}${caja('Neto', (st.neto >= 0 ? '+' : MENOS) + numero(Math.abs(st.neto)))}${caja('Mismo celular', st.mismos ? st.mismos + ' cuentas' : 'ninguna', st.mismos >= 2 ? 'color:var(--malTxt)' : '')}</div>
      ${preds.slice(-8).reverse().map(p => { const a = p.apuestas.filter(x => x.u === id), m = a.reduce((t, x) => t + x.monto, 0); return `<div class="entre peq" style="padding:6px 0;border-bottom:1px solid var(--linea)"><span>${esc(p.titulo)}<br><span class="mini gris">${esc(p.opciones[a[0].op])} · ${p.estado}</span></span><b>${m}</b></div>`; }).join('')}</div>
    <div><h3 style="margin:0 0 6px">Reportes en su contra (${repC.length})</h3>${repC.map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--linea)"><span class="insignia i-rojo">${esc(r.motivo)}</span> <span class="mini gris">${esc(r.tipo)} · por @${esc(DB.usuario(r.por)?.usuario || '?')} · ${hace(r.fecha)} · ${r.estado}</span>${(() => { const p = r.tipo === 'post' && S.posts.find(x => x.id === r.ref); return p ? `<p class="peq" style="margin:4px 0 0">“${esc(p.texto.slice(0, 160))}”</p>` : ''; })()}</div>`).join('') || '<p class="peq gris" style="margin:0">Ninguno.</p>'}
      <p class="mini gris" style="margin:8px 0 0">Reportes que él/ella hizo: ${repH.length}</p></div>
    <div><h3 style="margin:0 0 6px">Actividad</h3><div class="rejilla2">${actividad.map(([t, n]) => `<div class="entre peq" style="padding:6px 10px;background:var(--suave);border-radius:10px"><span>${t}</span><b>${n}</b></div>`).join('')}</div></div>
    <p class="mini gris" style="margin:0">Los mensajes privados no se muestran aquí.</p></section>`;
}
ACC.abrirFichaAdm = b => { UI.admUsuario = b.dataset.u || null; refrescar(); if (UI.admUsuario) $('#fichaUsuario')?.scrollIntoView({ behavior: 'smooth' }); };
ENTRADAS.admBuscar = el => { UI.admBusca = el.value; const q = el.value.trim().toLowerCase().replace(/^@/, ''); const l = Object.values(DB.estado.usuarios).filter(u => u.id !== 'u_equipo' && (!q || [u.usuario, u.nombre, u.contacto, u.carrera].some(x => String(x || '').toLowerCase().includes(q)))); const c = $('#admLista'); if (c) c.innerHTML = filasUsuariosAdm(l, id => reportesContra(id).length); };

UI.admJuego = 'todo';
ACC.admJuego = b => { UI.admJuego = b.dataset.j; refrescar(); $('#fichaUsuario')?.scrollIntoView(); };

function graficaCasino(J) {
  if (J.length < 2) return '<p class="peq gris" style="margin:0">Pocas jugadas para graficar.</p>';
  const W = 640, H = 260, n = J.length; let r = 0, e = 0, v = 0; const pts = [[0, 0, 0, 0]];
  J.forEach(j => { r += j.pago - j.apuesta; e += j.apuesta * j.ev; v += j.apuesta * j.apuesta * (j.v || (j.juego === 'ruleta' ? 1 : 4)); pts.push([pts.length, r, e, Math.sqrt(v)]); });
  const ys = pts.flatMap(p => [p[1], p[2] + 2 * p[3], p[2] - 2 * p[3]]), y0 = Math.min(...ys), y1 = Math.max(...ys), X = i => 34 + i / n * (W - 44), Y = y => 14 + (y1 - y) / ((y1 - y0) || 1) * (H - 34);
  const banda = pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[2] + 2 * p[3]).toFixed(1)}`).concat(pts.slice().reverse().map(p => `${X(p[0]).toFixed(1)},${Y(p[2] - 2 * p[3]).toFixed(1)}`)).join(' ');
  const cero = Y(0), area = signo => `<path d="M${X(0)},${cero} ${pts.map(p => `L${X(p[0]).toFixed(1)},${(signo > 0 ? Math.min(Y(p[1]), cero) : Math.max(Y(p[1]), cero)).toFixed(1)}`).join(' ')} L${X(n)},${cero} Z" fill="${signo > 0 ? 'rgba(74,222,128,.35)' : 'rgba(251,113,133,.35)'}"/>`;
  const fuera = pts.filter(p => p[0] > 10 && (p[1] > p[2] + 2 * p[3] || p[1] < p[2] - 2 * p[3])).length;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Resultado acumulado contra lo esperado" style="display:block;background:#0B0814;border-radius:14px">
    <polygon points="${banda}" fill="rgba(124,60,255,.22)"/>${area(1)}${area(-1)}
    <line x1="34" x2="${W - 10}" y1="${cero}" y2="${cero}" stroke="rgba(255,255,255,.35)" stroke-dasharray="4 4"/>
    <polyline fill="none" stroke="#FFD45A" stroke-width="2.5" points="${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ')}"/>
    <polyline fill="none" stroke="#C4B5FD" stroke-width="2" stroke-dasharray="6 5" points="${pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[2]).toFixed(1)).join(' ')}"/>
    <text x="4" y="18" font-size="11" fill="#C9C2DA">${numero(Math.round(y1))}</text><text x="4" y="${H - 22}" font-size="11" fill="#C9C2DA">${numero(Math.round(y0))}</text><text x="${W - 10}" y="${H - 6}" font-size="11" fill="#C9C2DA" text-anchor="end">${n} jugadas</text></svg>
    <div class="fila mini" style="margin-top:6px;gap:12px"><span class="fila" style="gap:4px"><span style="width:14px;height:3px;background:#FFD45A;display:inline-block"></span>Lo que lleva</span><span class="fila" style="gap:4px"><span style="width:14px;height:3px;background:#C4B5FD;display:inline-block"></span>Esperado por probabilidad</span><span class="fila" style="gap:4px"><span style="width:14px;height:10px;background:rgba(124,60,255,.35);display:inline-block"></span>Franja normal</span></div>
    ${fuera > n * 0.2 ? `<p class="peq" style="margin:6px 0 0;color:var(--avisoTxt)"><b>Se sale de la franja normal en ${Math.round(fuera / n * 100)}% de sus jugadas.</b> Revisa.</p>` : ''}`;
}
