/* Chat: grupos de materia y mensajes directos */
'use strict';
VISTAS.chat = {
  titulo: ([id]) => { if (!id) return 'Chat'; const c = DB.estado.chats.find(x => x.id === id); return c ? tituloChat(c) : 'Chat'; },
  nav: 'chat', get atras() { return ruta().params[0] ? '#/chat' : null; },
  render([id]) {
    if (id) return vistaConversacion(id);
    const chats = DB.misChats(), fila = c => { const ult = DB.visibles(c).at(-1), n = DB.sinLeer(c), otro = c.miembros.find(m => m !== DB.yo().id);
      return `<a href="#/chat/${c.id}" class="fila" style="flex-wrap:nowrap;padding:10px 4px;text-decoration:none;color:inherit;border-bottom:1px solid var(--linea)">
        ${c.tipo === 'grupo' ? `<span class="avatar" style="border-radius:14px;background:var(--suave);color:var(--moradoTxt)">${esc(c.nombre.slice(0, 2).toUpperCase())}</span>` : avatar(otro).replace('<a ', '<span ').replace('</a>', '</span>')}
        <span style="flex:1"><b>${esc(tituloChat(c))}</b><br><span class="peq gris" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ult ? (ult.u === DB.yo().id ? 'Tú: ' : c.tipo === 'grupo' ? esc(nombreVisible(ult.u)) + ': ' : '') + (ult.borrado ? '<i>Mensaje eliminado</i>' : ult.sistema ? 'salió del grupo' : esc(ult.t)) : 'Sin mensajes'}</span></span>
        <span style="text-align:right"><span class="mini gris">${ult ? hace(ult.f) : ''}</span><br>${n ? `<span class="insignia" style="background:var(--g-accion);color:#1B1530">${n}</span>` : ''}</span></a>`; };
    const grupos = chats.filter(c => c.tipo === 'grupo'), dms = chats.filter(c => c.tipo === 'dm');
    return `<div class="pila"><form data-form="buscarPersona" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bpers">Escribir a alguien</label><input id="bpers" name="q" placeholder="Escribe a alguien: @usuario" autocomplete="off"><button class="btn2">Abrir</button></form>
      <section class="tarjeta" style="padding:6px 12px"><p class="etiqueta gris" style="margin:8px 4px">Grupos de materia</p>${grupos.map(fila).join('') || '<p class="vacio">Sin grupos.</p>'}<button class="btn3 ancho" style="margin:10px 0" data-a="nuevoGrupo">${icono('mas', 18)}Crear grupo</button></section>
      <section class="tarjeta" style="padding:6px 12px"><p class="etiqueta gris" style="margin:8px 4px">Mensajes directos</p>${dms.map(fila).join('') || '<p class="vacio">Aún no tienes conversaciones.</p>'}</section></div>`;
  },
  montar([id]) { if (id) { DB.marcarLeido(id); const m = $('#mensajes'); if (m) m.scrollTop = m.scrollHeight; } }
};
function tituloChat(c) { if (c.tipo === 'grupo') return c.nombre; return nombreVisible(c.miembros.find(m => m !== DB.yo().id)); }
function vistaConversacion(id) {
  const c = DB.estado.chats.find(x => x.id === id), yo = DB.yo().id;
  if (!c || !c.miembros.includes(yo)) return '<p class="vacio">No encontramos esta conversación.</p>';
  const fijado = c.fijado && DB.estado.agenda.find(a => a.id === c.fijado);
  return `<div class="pila" style="gap:10px">
    <div class="entre">${(() => { const o = c.tipo === 'dm' && DB.usuario(c.miembros.find(m => m !== yo)), can = o?.cancion; if (!can) return `<span class="mini gris">${c.tipo === 'grupo' ? `${c.miembros.length} integrantes` : ''}</span>`;
      return can.archivo ? `<button class="pastilla fila" style="gap:8px;padding:0 12px 0 6px;max-width:70%" data-a="playPerfil" data-src="${esc(can.archivo)}" data-u="${o.id}"><span class="vinilo chico${REPRO.sonando(can.archivo) ? ' girando' : ''}" style="width:30px;height:30px" data-vinilo="${esc(can.archivo)}" aria-hidden="true"><span class="etiqueta-disco" style="width:12px;height:12px;${can.portada && /^data:image\/(jpeg|png|webp);base64,/.test(can.portada) ? `background:#4B1F7A url('${can.portada}') center/cover` : ''}"></span></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(can.titulo)}</span></button>`
        : can.enlace ? `<a class="pastilla" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:inherit" href="${esc(can.enlace)}" target="_blank" rel="noopener noreferrer">${icono('musica', 16)}<span>${esc(can.titulo)}</span></a>` : ''; })()}<button class="btn3" style="min-height:38px;padding:0 12px" data-a="menuChat" data-id="${c.id}">${icono('puntos', 18)}Opciones</button></div>
    ${fijado ? `<a href="#/agenda" class="insignia i-amarillo" style="align-self:center;text-decoration:none">Fijado: ${esc(fijado.titulo)} · ${fechaBonita(fijado.fecha)}</a>` : ''}
    <div id="mensajes" class="tarjeta pila" style="gap:8px;max-height:60vh;overflow-y:auto">${DB.visibles(c).map(m => { const mio = m.u === yo; if (m.sistema) return `<p class="mini gris" style="align-self:center;margin:0">${esc(nombreVisible(m.u))} salió del grupo</p>`; return `<div style="align-self:${mio ? 'flex-end' : 'flex-start'};max-width:80%">${!mio && c.tipo === 'grupo' ? `<div class="mini gris" style="margin:0 0 2px 6px">${esc(nombreVisible(m.u))}</div>` : ''}${m.borrado ? `<div style="border:1px dashed var(--linea);padding:8px 13px;border-radius:18px" class="peq gris"><i>Mensaje eliminado</i></div>` : `<div ${mio || DB.esAdmin() ? `data-a="menuMsg" data-id="${c.id}" data-i="${m.i}" role="button" tabindex="0" title="Opciones del mensaje" ` : ''}style="cursor:${mio || DB.esAdmin() ? 'pointer' : 'auto'};background:${mio ? 'var(--g-marca)' : 'var(--suave)'};color:${mio ? '#fff' : 'inherit'};padding:9px 13px;border-radius:18px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.t)}</div>`}<div class="mini gris" style="text-align:${mio ? 'right' : 'left'};margin:2px 6px 0">${hace(m.f)}</div></div>`; }).join('') || '<p class="vacio">Escribe el primer mensaje.</p>'}</div>
    <form class="fila" style="flex-wrap:nowrap" data-form="enviarMsg"><input type="hidden" name="id" value="${c.id}"><label class="oculto" for="msg">Mensaje</label><input id="msg" name="t" required maxlength="1000" placeholder="Escribe un mensaje…" autocomplete="off"><button class="btn2" aria-label="Enviar">${icono('enviar', 18)}</button></form>
    ${c.tipo === 'dm' ? `<button class="btn3" style="align-self:flex-start;color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-ref="${c.miembros.find(m => m !== yo)}" data-quien="${c.miembros.find(m => m !== yo)}">${icono('bandera', 16)}Reportar conversación</button>` : ''}</div>`;
}
FORMS.enviarMsg = d => { DB.enviar(d.id, d.t); refrescar(); const m = $('#mensajes'); if (m) m.scrollTop = m.scrollHeight; $('#msg')?.focus(); };
FORMS.buscarPersona = d => { const u = DB.porUsuario(d.q.trim()); if (!u || u.id === DB.yo().id) return aviso('No encontramos a ese usuario'); abrirChatCon(u.id); };
function abrirChatCon(id) { const c = DB.chatCon(id); if (!c) return aviso(`${nombreVisible(id)} solo recibe mensajes de ciertas personas`); ir('#/chat/' + c.id); }
ACC.escribirA = b => abrirChatCon(b.dataset.u);
ACC.nuevoGrupo = () => abrirHoja(`<form class="pila" data-form="crearGrupo"><h2>Nuevo grupo</h2><div><label class="campo" for="gn">Nombre</label><input id="gn" name="nombre" required maxlength="50" placeholder="Física II · Equipo 4"></div><div><label class="campo" for="gm">Integrantes</label><input id="gm" name="miembros" placeholder="@vale.a, @pedro.g"></div><button class="btn ancho">Crear</button></form>`);
FORMS.crearGrupo = d => {
  const ids = [...new Set((d.miembros || '').split(/[,\s]+/).map(n => DB.porUsuario(n)?.id).filter(Boolean))].filter(i => DB.puedeEscribir(i));
  const c = { id: uid('ch'), tipo: 'grupo', nombre: d.nombre.trim().slice(0, 50), miembros: [DB.yo().id, ...ids], mensajes: [], fijado: null };
  DB.estado.chats.push(c); DB.guardar(); cerrarHoja(); ir('#/chat/' + c.id);
};
ACC.menuChat = b => { const c = DB.estado.chats.find(x => x.id === b.dataset.id), otro = c.miembros.find(m => m !== DB.yo().id);
  abrirHoja(`<h2>${esc(tituloChat(c))}</h2><div class="pila">
    <button class="btn3 ancho" data-a="chatAccion" data-que="vaciar" data-id="${c.id}">Vaciar chat</button>
    ${c.tipo === 'grupo' ? `<button class="btn-peligro ancho" data-a="chatAccion" data-que="salir" data-id="${c.id}">Salir del grupo</button>` : `<button class="btn-peligro ancho" data-a="chatAccion" data-que="quitar" data-id="${c.id}">Eliminar chat</button>`}
    <p class="mini gris" style="margin:0">${c.tipo === 'grupo' ? 'Vaciar solo borra los mensajes para ti. Al salir ya no recibes mensajes del grupo.' : 'Solo se borra para ti. Si te vuelve a escribir, la conversación reaparece desde cero.'}</p>
    <button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`); };
ACC.chatAccion = b => { const id = b.dataset.id, q = b.dataset.que; cerrarHoja();
  if (q === 'vaciar') { DB.vaciarChat(id); aviso('Chat vaciado'); return refrescar(); }
  if (q === 'quitar') DB.quitarChat(id); else DB.salirGrupo(id);
  aviso(q === 'quitar' ? 'Chat eliminado' : 'Saliste del grupo'); ir('#/chat'); };
ACC.menuMsg = b => abrirHoja(`<h2>Mensaje</h2><div class="pila"><button class="btn-peligro ancho" data-a="borrarMsg" data-id="${b.dataset.id}" data-i="${b.dataset.i}">Eliminar para todos</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.borrarMsg = b => { DB.borrarMensaje(b.dataset.id, +b.dataset.i); cerrarHoja(); refrescar(); };
