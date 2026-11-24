'use strict';
UI.agendaDia = null;
const TIPO_AG = { Examen: ['i-amarillo', '#F5B700'], Entrega: ['i-azul', '#1D5FD1'], Proyecto: ['i-morado', '#4B1F7A'], Evento: ['i-verde', '#15803D'] };
VISTAS.agenda = {
  titulo: 'Agenda', nav: 'agenda',
  render() {
    const yo = DB.yo().id, todos = DB.miAgenda(), hoy = fechaLocal();
    const semana = []; for (let i = 0; i < 7; i++) semana.push(sumarDias(hoy, i));
    const dia = UI.agendaDia, lista = todos.filter(a => dia ? a.fecha === dia : diasHasta(a.fecha) >= -1);
    const prox = todos.find(a => !(a.hechoPor || {})[yo] && diasHasta(a.fecha) >= 0);
    return `<div class="pila">
      <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">${semana.map(f => { const d = new Date(f + 'T12:00:00'), hay = todos.some(a => a.fecha === f), on = dia === f;
        return `<button class="tarjeta" style="padding:8px 0;text-align:center;box-shadow:none;${on ? 'background:var(--g-marca);color:#fff;border-color:transparent' : ''}" data-a="agendaDia" data-f="${f}" aria-pressed="${on}"><span class="mini">${d.toLocaleDateString('es-MX', { weekday: 'short' }).slice(0, 2)}</span><br><b>${d.getDate()}</b><br><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${hay ? (on ? '#fff' : 'var(--naranja)') : 'transparent'}"></span></button>`; }).join('')}</div>
      ${prox && !dia ? `<section class="tarjeta" style="border:2px solid var(--amarillo)"><div class="fila" style="flex-wrap:nowrap"><span style="width:64px;height:64px;border-radius:18px;background:var(--g-accion);color:#1B1530;display:grid;place-items:center;text-align:center;line-height:1;flex:none"><span><b style="font-family:Sora,sans-serif;font-size:26px">${diasHasta(prox.fecha)}</b><br><span class="mini" style="font-weight:800">${diasHasta(prox.fecha) === 1 ? 'día' : 'días'}</span></span></span>
        <span><span class="etiqueta" style="color:#8A5A00">${esc(prox.tipo)}</span><br><b style="font-family:Sora,sans-serif;font-size:18px">${esc(prox.titulo)}</b><br><span class="peq gris">${fechaBonita(prox.fecha)}${prox.hora ? ' · ' + esc(prox.hora) : ''}${prox.lugar ? ' · ' + esc(prox.lugar) : ''}</span></span></div>
        <div class="rejilla2" style="margin-top:12px"><button class="btn3" data-a="compartirAg" data-id="${prox.id}">Compartir en un grupo</button><a class="btn3" href="#/propuestas/nueva">Armar sesión de estudio</a></div></section>` : ''}
      <div class="entre"><h2>${dia ? fechaBonita(dia) : 'Próximos'}</h2><button class="btn" data-a="nuevoRecordatorio">${icono('mas', 18)}Recordatorio</button></div>
      ${lista.map(a => { const h = !!(a.hechoPor || {})[yo], [cls, col] = TIPO_AG[a.tipo] || TIPO_AG.Proyecto, d = diasHasta(a.fecha), mio = a.u === yo;
        return `<div class="tarjeta fila" style="flex-wrap:nowrap;padding:10px 12px">
          <button class="icono-btn" data-a="hechoAg" data-id="${a.id}" aria-pressed="${h}" aria-label="Marcar como hecho" style="width:30px;height:30px;border-radius:9px;border:2px solid ${col};background:${h ? col : 'transparent'};color:#fff">${h ? icono('ok', 16) : ''}</button>
          <span style="flex:1"><b style="text-decoration:${h ? 'line-through' : 'none'}">${esc(a.titulo)}</b><br><span class="mini gris">${fechaBonita(a.fecha)}${a.hora ? ' · ' + esc(a.hora) : ''} · ${d === 0 ? 'hoy' : d < 0 ? 'ya pasó' : 'faltan ' + d + ' d'}${a.compartidoEn ? ' · compartido' : ''}${!mio ? ' · de ' + esc(nombreVisible(a.u)) : ''}</span></span>
          <span class="insignia ${cls}">${esc(a.tipo)}</span>${mio ? `<button class="icono-btn" data-a="menuAg" data-id="${a.id}" aria-label="Opciones">${icono('puntos', 18)}</button>` : ''}</div>`; }).join('') || '<p class="vacio">Nada por aquí. ¡Disfruta!</p>'}
      <section class="tarjeta fila" style="flex-wrap:nowrap;background:#DCE8FB;border:0;color:#12397F">${icono('campana', 22, 'style="flex:none"')}<span class="peq">Te avisamos 7, 3 y 1 día antes de cada examen o entrega. Para un proyecto largo, te sugerimos empezar 2 semanas antes.</span></section></div>`;
  }
};
ACC.agendaDia = b => { UI.agendaDia = UI.agendaDia === b.dataset.f ? null : b.dataset.f; refrescar(); };
ACC.hechoAg = b => { DB.alternarHecho(b.dataset.id); refrescar(); };
ACC.nuevoRecordatorio = () => abrirHoja(`<form class="pila" data-form="nuevoRec"><h2>Nuevo recordatorio</h2>
  <div><label class="campo" for="at">¿Qué es?</label><input id="at" name="titulo" required maxlength="100" placeholder="Examen de Cálculo II"></div>
  <div class="rejilla2"><div><label class="campo" for="ati">Tipo</label><select id="ati" name="tipo">${Object.keys(TIPO_AG).map(t => `<option>${t}</option>`).join('')}</select></div><div><label class="campo" for="af">Fecha</label><input id="af" name="fecha" type="date" required min="${fechaLocal()}" value="${UI.agendaDia || sumarDias(fechaLocal(), 7)}"></div></div>
  <div class="rejilla2"><div><label class="campo" for="ah">Hora</label><input id="ah" name="hora" type="time"></div><div><label class="campo" for="al">Lugar</label><input id="al" name="lugar" maxlength="40" placeholder="C-204"></div></div>
  <button class="btn ancho">Guardar</button></form>`);
FORMS.nuevoRec = d => { DB.agregarRecordatorio(d); cerrarHoja(); aviso('Recordatorio guardado'); refrescar(); };
ACC.compartirAg = b => { const grupos = DB.misChats().filter(c => c.tipo === 'grupo'); if (!grupos.length) return aviso('Primero crea un grupo en Chat'); abrirHoja(`<h2 style="margin-bottom:10px">¿En qué grupo?</h2><div class="pila" style="gap:8px">${grupos.map(c => `<button class="btn3 ancho" data-a="compartirEn" data-id="${b.dataset.id}" data-c="${c.id}">${esc(c.nombre)}</button>`).join('')}</div>`); };
ACC.compartirEn = b => { DB.compartirRecordatorio(b.dataset.id, b.dataset.c); cerrarHoja(); aviso('Compartido: a todos del grupo les llegará el aviso'); refrescar(); };
ACC.menuAg = b => abrirHoja(`<div class="pila" style="gap:8px"><button class="btn3 ancho" data-a="compartirAg" data-id="${b.dataset.id}">Compartir en un grupo</button><button class="btn-peligro ancho" data-a="borrarAg" data-id="${b.dataset.id}">Borrar</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.borrarAg = b => { DB.borrarRecordatorio(b.dataset.id); cerrarHoja(); refrescar(); };
