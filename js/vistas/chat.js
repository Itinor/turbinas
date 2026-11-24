'use strict';
VISTAS.chat = {
  titulo: ([id]) => { if (!id) return 'Chat'; const c = DB.estado.chats.find(x => x.id === id); return c ? tituloChat(c) : 'Chat'; },
  nav: 'chat', get atras() { return ruta().params[0] ? '#/chat' : null; },
  render([id]) {
    if (id) return vistaConversacion(id);
    const chats = DB.misChats(), fila = c => { const ult = DB.visibles(c).at(-1), n = DB.sinLeer(c), otro = c.miembros.find(m => m !== DB.yo().id);
      return `<a href="#/chat/${c.id}" class="fila" style="flex-wrap:nowrap;padding:10px 4px;text-decoration:none;color:inherit;border-bottom:1px solid var(--linea)">
        ${c.tipo === 'grupo' ? `<span class="avatar" style="border-radius:14px;background:var(--suave);color:var(--moradoTxt)">${esc(c.nombre.slice(0, 2).toUpperCase())}</span>` : avatar(otro).replace('<a ', '<span ').replace('</a>', '</span>')}
        <span style="flex:1"><b>${esc(tituloChat(c))}</b><br><span class="peq gris" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ult ? (ult.u === DB.yo().id ? 'Tú: ' : c.tipo === 'grupo' ? esc(nombreVisible(ult.u)) + ': ' : '') + (ult.borrado ? '<i>Mensaje eliminado</i>' : ult.sistema ? 'salió del grupo' : ult.e ? vistaPrevia(c, ult) : ult.adjunto && !ult.t ? (esImagenAdj(ult.adjunto) ? 'Foto' : 'Archivo: ' + esc(ult.adjunto.nombre)) : esc(ult.t)) : 'Sin mensajes'}</span></span>
        <span style="text-align:right"><span class="mini gris">${ult ? hace(ult.f) : ''}</span><br>${n ? `<span class="insignia" style="background:var(--g-accion);color:#1B1530">${n}</span>` : ''}</span></a>`; };
    const yoId = DB.yo().id, grupos = chats.filter(c => c.tipo === 'grupo'), sols = chats.filter(c => DB.esSolicitud(c) && c.solicitud.de !== yoId), dms = chats.filter(c => c.tipo === 'dm' && !sols.includes(c));
    return `<div class="pila"><form data-form="buscarPersona" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bpers">Escribir a alguien</label><input id="bpers" name="q" placeholder="Escribe a alguien: @usuario" autocomplete="off"><button class="btn2">Abrir</button></form>
      ${sols.length ? `<section class="tarjeta" style="padding:6px 12px"><p class="etiqueta gris" style="margin:8px 4px">Solicitudes de mensaje · ${sols.length}</p>${sols.map(fila).join('')}<p class="mini gris" style="margin:6px 4px 10px">Son personas que no son tus amigas. No saben si ya leíste su mensaje hasta que aceptes.</p></section>` : ''}
      <section class="tarjeta" style="padding:6px 12px"><p class="etiqueta gris" style="margin:8px 4px">Grupos de materia</p>${grupos.map(fila).join('') || '<p class="vacio">Sin grupos.</p>'}<button class="btn3 ancho" style="margin:10px 0" data-a="nuevoGrupo">${icono('mas', 18)}Crear grupo</button></section>
      <section class="tarjeta" style="padding:6px 12px"><p class="etiqueta gris" style="margin:8px 4px">Mensajes directos</p>${dms.map(fila).join('') || '<p class="vacio">Aún no tienes conversaciones.</p>'}</section></div>`;
  },
  montar([id]) { if (id) { const c0 = DB.estado.chats.find(x => x.id === id); if (!(DB.esSolicitud(c0) && c0.solicitud.de !== DB.yo().id)) DB.marcarLeido(id); const m = $('#mensajes'); if (m) m.scrollTop = m.scrollHeight; cargarArchivosTablon().then(() => { const m2 = $('#mensajes'); if (m2) m2.scrollTop = m2.scrollHeight; }); } }
};
function tituloChat(c) { if (c.tipo === 'grupo') return c.nombre; return nombreVisible(c.miembros.find(m => m !== DB.yo().id)); }
function vistaConversacion(id) {
  const c = DB.estado.chats.find(x => x.id === id), yo = DB.yo().id;
  if (!c || !c.miembros.includes(yo)) return '<p class="vacio">No encontramos esta conversación.</p>';
  const fijado = c.fijado && DB.estado.agenda.find(a => a.id === c.fijado);
  return `<div class="pila" style="gap:10px">
    ${c.tipo === 'dm' ? (() => { const o = DB.usuario(c.miembros.find(m => m !== yo)); return o ? `<a href="#/perfil/${esc(o.usuario)}" class="tarjeta fila" style="flex-wrap:nowrap;padding:10px 12px;text-decoration:none;color:inherit">${avatar(o.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span style="flex:1;min-width:0"><b>${esc(nombreVisible(o.id))}</b><br><span class="mini gris">@${esc(o.usuario)} · Ver perfil</span><br><span class="mini" style="color:${CRIPTO.estadoVerif(o.id) === 'cambio' ? 'var(--malTxt)' : 'var(--okTxt)'}">${icono('candado', 12)} Cifrado de punta a punta${CRIPTO.estadoVerif(o.id) === 'si' ? ' · verificado' : CRIPTO.estadoVerif(o.id) === 'cambio' ? ' · su llave cambió' : ''}</span></span>${icono('atras', 18, 'style="transform:rotate(180deg)"')}</a>` : ''; })() : ''}
    <div class="entre">${(() => { const o = c.tipo === 'dm' && DB.usuario(c.miembros.find(m => m !== yo)), can = o?.cancion; if (!can) return `<span class="mini gris">${c.tipo === 'grupo' ? `${c.miembros.length} integrantes` : ''}</span>`;
      return can.archivo ? `<button class="pastilla fila" style="gap:8px;padding:0 12px 0 6px;max-width:70%" data-a="playPerfil" data-src="${esc(can.archivo)}" data-u="${o.id}"><span class="vinilo chico${REPRO.sonando(can.archivo) ? ' girando' : ''}" style="width:30px;height:30px" data-vinilo="${esc(can.archivo)}" aria-hidden="true"><span class="etiqueta-disco" style="width:12px;height:12px;${can.portada && /^data:image\/(jpeg|png|webp);base64,/.test(can.portada) ? `background:#4B1F7A url('${can.portada}') center/cover` : ''}"></span></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(can.titulo)}</span></button>`
        : can.enlace ? `<a class="pastilla" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:inherit" href="${esc(can.enlace)}" target="_blank" rel="noopener noreferrer">${icono('musica', 16)}<span>${esc(can.titulo)}</span></a>` : ''; })()}<button class="btn3" style="min-height:38px;padding:0 12px" data-a="menuChat" data-id="${c.id}">${icono('puntos', 18)}Opciones</button></div>
    ${bannerSolicitud(c)}
    ${fijado ? `<a href="#/agenda" class="insignia i-amarillo" style="align-self:center;text-decoration:none">Fijado: ${esc(fijado.titulo)} · ${fechaBonita(fijado.fecha)}</a>` : ''}
    <div id="mensajes" class="tarjeta pila" style="gap:8px;max-height:60vh;overflow-y:auto">${DB.visibles(c).map(m => { const mio = m.u === yo; if (m.sistema) return `<p class="mini gris" style="align-self:center;margin:0">${esc(nombreVisible(m.u))} salió del grupo</p>`; return `<div style="align-self:${mio ? 'flex-end' : 'flex-start'};max-width:80%">${!mio && c.tipo === 'grupo' ? `<div class="mini gris" style="margin:0 0 2px 6px">${esc(nombreVisible(m.u))}</div>` : ''}${m.borrado ? `<div style="border:1px dashed var(--linea);padding:8px 13px;border-radius:18px" class="peq gris"><i>Mensaje eliminado</i></div>` : (() => { const x = m.e ? CRIPTO.leer(c, m) : null; if (m.e && (!x || x.error)) return `<div style="border:1px dashed var(--linea);padding:8px 13px;border-radius:18px" class="peq gris">${icono('candado', 14)} <i>${x?.error ? esc(x.error) : CRIPTO.listo() ? 'Descifrando…' : 'Mensaje cifrado'}</i></div>`; if (x) m = { ...m, t: x.t, adjunto: x.adjunto && !(DB.esSolicitud(c) && c.solicitud.de !== yo) ? x.adjunto : null, adjOculto: !!x.adjunto && DB.esSolicitud(c) && c.solicitud.de !== yo, llaveDistinta: x.llaveDistinta, firmaMala: x.firma === 'mala' }; return ''; })() || `<div ${mio || DB.esAdmin() ? `data-a="menuMsg" data-id="${c.id}" data-i="${m.i}" role="button" tabindex="0" title="Opciones del mensaje" ` : ''}style="cursor:${mio || DB.esAdmin() ? 'pointer' : 'auto'};background:${mio ? 'var(--g-marca)' : 'var(--suave)'};color:${mio ? '#fff' : 'inherit'};padding:9px 13px;border-radius:18px;white-space:pre-wrap;overflow-wrap:anywhere">${m.adjunto ? burbujaAdjunto(m.adjunto, mio) : ''}${m.adjOculto ? '<i class="peq gris">Archivo oculto hasta que aceptes</i><br>' : ''}${m.t ? esc(m.t) : ''}</div>${m.firmaMala ? '<div class="mini" style="color:var(--malTxt);margin:2px 6px 0">La firma de este mensaje no coincide: no confíes en él</div>' : ''}${m.llaveDistinta ? '<div class="mini" style="color:var(--malTxt);margin:2px 6px 0">Enviado con una llave que ya no es la de su cuenta</div>' : ''}`}<div class="mini gris" style="text-align:${mio ? 'right' : 'left'};margin:2px 6px 0">${hace(m.f)}</div></div>`; }).join('') || '<p class="vacio">Escribe el primer mensaje.</p>'}</div>
    ${zonaEnvio(c)}
    ${c.tipo === 'dm' ? `<button class="btn3" style="align-self:flex-start;color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-chat="${c.id}" data-ref="${c.miembros.find(m => m !== yo)}" data-quien="${c.miembros.find(m => m !== yo)}">${icono('bandera', 16)}Reportar conversación</button>` : ''}</div>`;
}

function vistaPrevia(c, m) { const x = CRIPTO.leer(c, m); if (!x || x.error) return '<i>Mensaje cifrado</i>'; return x.t ? esc(x.t) : x.adjunto ? (esImagenAdj(x.adjunto) ? 'Foto' : 'Archivo: ' + esc(x.adjunto.nombre)) : ''; }
function zonaEnvio(c) {
  const u = DB.yo();
  if (!CRIPTO.listo()) return `<form class="tarjeta pila" style="gap:8px;background:var(--suave);box-shadow:none" data-form="desbloquearChats">
      <b class="fila" style="gap:6px">${icono('candado', 18)}${u.cripto ? 'Abre tus chats en este dispositivo' : u.clave ? 'Activa el cifrado de tus chats' : 'Crea una contraseña para tus chats'}</b>
      <p class="peq gris" style="margin:0">${u.cripto ? 'Tus mensajes van cifrados de punta a punta. Escribe tu contraseña para leerlos aquí.' : u.clave ? 'A partir de ahora tus mensajes van cifrados de punta a punta: solo tú y con quien hablas los pueden leer. Confirma tu contraseña para crear tus llaves.' : 'Tus mensajes van cifrados de punta a punta. Esta contraseña protege tu llave; la vas a necesitar para abrir tus chats en otro dispositivo. No se puede recuperar.'}</p>
      <label class="oculto" for="dc1">Contraseña</label><input id="dc1" name="clave" type="password" required minlength="${u.cripto || u.clave ? 1 : 8}" autocomplete="${u.cripto || u.clave ? 'current-password' : 'new-password'}" placeholder="Contraseña">
      ${u.cripto || u.clave ? '' : '<label class="oculto" for="dc2">Repite la contraseña</label><input id="dc2" name="clave2" type="password" required minlength="8" autocomplete="new-password" placeholder="Repite la contraseña">'}
      <button class="btn">${u.cripto ? 'Abrir chats' : 'Activar'}</button></form>`;
  const nm = DB.puedeMandar(c);
  if (nm === 'aceptar') return '';
  if (nm === 'rechazada') return '<p class="peq gris tarjeta" style="margin:0;box-shadow:none;background:var(--suave)">No aceptó tu solicitud. Ya no puedes escribirle por aquí.</p>';
  if (nm === 'espera') return `<p class="peq gris tarjeta" style="margin:0;box-shadow:none;background:var(--suave)">Ya mandaste ${REGLAS_MSG.maxSolicitud} mensajes. Espera a que ${esc(nombreVisible(c.miembros.find(m => m !== u.id)))} acepte tu solicitud para seguir escribiendo.</p>`;
  if (nm) return '';
  const sol = DB.esSolicitud(c);
  const firmaAviso = CRIPTO.puedeFirmar() ? '' : `<form class="tarjeta fila" style="gap:8px;background:var(--suave);box-shadow:none;flex-wrap:nowrap" data-form="desbloquearChats"><span class="peq" style="flex:1">${icono('candado', 16)} Escribe tu contraseña una vez para firmar tus mensajes.</span><label class="oculto" for="fc1">Contraseña</label><input id="fc1" name="clave" type="password" required autocomplete="current-password" placeholder="Contraseña" style="max-width:150px"><button class="btn2">Listo</button></form>`;
  const faltan = CRIPTO.sinLlave(c).filter(m => m !== u.id);
  if (faltan.length && c.tipo === 'dm') return `<div class="tarjeta pila" style="gap:8px;background:var(--suave);box-shadow:none"><b class="fila" style="gap:6px">${icono('candado', 18)}Esperando a ${esc(nombreVisible(faltan[0]))}</b><p class="peq gris" style="margin:0">Todavía no activa sus chats cifrados. En cuanto entre a la app con su contraseña, ya pueden escribirse.</p><button class="btn3" data-a="avisarCifrado" data-id="${c.id}">Avisarle</button></div>`;
  return `${firmaAviso}${sol ? `<p class="mini gris" style="margin:0">Es una solicitud: hasta que acepte, solo texto y máximo ${REGLAS_MSG.maxSolicitud} mensajes.</p>` : ''}${faltan.length ? `<p class="mini gris" style="margin:0">${faltan.map(nombreVisible).map(esc).join(', ')} todavía no activa el cifrado y no verá los mensajes nuevos hasta que lo haga.</p>` : ''}
    <form class="fila" style="flex-wrap:nowrap" data-form="enviarMsg"><input type="hidden" name="id" value="${c.id}">${sol ? '' : `<label class="icono-btn" style="cursor:pointer;flex:none" title="Enviar foto o archivo" aria-label="Enviar foto o archivo">${icono('clip', 22)}<input type="file" class="oculto" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip" multiple data-cambio="adjuntoChat" data-id="${c.id}"></label>`}<label class="oculto" for="msg">Mensaje</label><input id="msg" name="t" maxlength="1000" placeholder="Escribe un mensaje…" autocomplete="off"><button class="btn2" aria-label="Enviar">${icono('enviar', 18)}</button></form>`;
}
FORMS.desbloquearChats = async (d, f) => {
  const u = DB.yo(), b = f.querySelector('button');
  if (!u.cripto && !u.clave) { if (d.clave !== d.clave2) return aviso('Las contraseñas no coinciden.'); const r = revisarFuerza(d.clave, u); if (r) return aviso(r); }
  else if (!await CRIPTO.revisarClave(u, d.clave)) return aviso('Contraseña incorrecta.');
  b.disabled = true; b.textContent = 'Abriendo…';
  try { await CRIPTO.abrirConClave(u, d.clave); aviso('Chats cifrados listos'); } catch (e) { console.warn(e); aviso('No se pudo abrir. Intenta otra vez.'); }
  refrescar();
};
ACC.avisarCifrado = b => { const c = DB.estado.chats.find(x => x.id === b.dataset.id); CRIPTO.sinLlave(c).filter(m => m !== DB.yo().id).forEach(m => notificar(m, `@${DB.yo().usuario} quiere escribirte. Entra a Chat y activa tus mensajes cifrados.`, '#/chat/' + c.id)); DB.guardar(); aviso('Le avisamos'); };

function datoSensible(t) {
  const s = String(t).toLowerCase(), dig = s.replace(/[\s-]/g, '');
  if (/\b(contrase(ñ|n)a|password|passwd|clave de acceso|nip|cvv|cvc|c[oó]digo de verificaci[oó]n|c[oó]digo de seguridad|token)\b/.test(s)) return 'una contraseña o un código';
  if (/\d{18}/.test(dig) && /clabe|\d{18}/.test(s.replace(/[\s-]/g, ''))) return 'una CLABE';
  if (/(?:^|\D)\d{15,16}(?:\D|$)/.test(dig)) return 'un número de tarjeta';
  if (/\b\d{6}\b/.test(s) && /c[oó]digo|whats|sms|verific/.test(s)) return 'un código de verificación';
  return null;
}
FORMS.enviarMsg = async (d, f, forzar) => {
  const t = String(d.t || '').trim(); if (!t) return;
  const sens = !forzar && datoSensible(t);
  if (sens) { UI.pendienteMsg = d; return abrirHoja(`<h2>¿Seguro que lo mandas?</h2><p class="gris">Parece que el mensaje lleva ${sens}. Aunque el chat va cifrado, nadie de Itinor ni de la uni te va a pedir contraseñas, NIP ni códigos por mensaje. Si alguien te los pide, es un engaño.</p><div class="pila"><button class="btn3 ancho" data-a="cerrarHoja">No mandarlo</button><button class="btn-peligro ancho" data-a="enviarIgual">Mandarlo de todos modos</button></div>`); }
  const c = DB.estado.chats.find(x => x.id === d.id); if (!c) return;
  const nm = DB.puedeMandar(c); if (nm) { refrescar(); return aviso('Ahora no puedes mandar mensajes aquí.'); }
  try { const e = await CRIPTO.cifrarMensaje(c, { t: t.slice(0, 1000) }); if (!DB.enviarCifrado(c.id, e)) return aviso('No se pudo enviar.'); }
  catch (err) { console.warn(err); return aviso('No se pudo cifrar el mensaje.'); }
  if ($('#msg')) $('#msg').value = ''; refrescar(); const m = $('#mensajes'); if (m) m.scrollTop = m.scrollHeight; $('#msg')?.focus();
};
ACC.enviarIgual = () => { const d = UI.pendienteMsg; UI.pendienteMsg = null; cerrarHoja(); if (d) FORMS.enviarMsg(d, null, true); };

ACC.codigoSeguridad = async b => {
  const otro = b.dataset.u, cod = await CRIPTO.codigo(DB.yo().id, otro);
  if (!cod) return aviso('Todavía no tiene llaves de cifrado.');
  const est = CRIPTO.estadoVerif(otro);
  abrirHoja(`<h2>Código de seguridad</h2><p class="peq gris">Junto con ${esc(nombreVisible(otro))}, abran esta pantalla en persona (o por videollamada) y comparen los números. Si son iguales, sus mensajes solo los pueden leer ustedes dos.</p>
    <p class="codigo-seg">${cod.split(' ').map(x => `<span>${x}</span>`).join('')}</p>
    ${est === 'cambio' ? '<p class="peq" style="color:var(--malTxt)"><b>Su llave cambió</b> desde que la verificaste. Puede que haya entrado desde una cuenta nueva o reiniciado su cuenta. Vuelvan a comparar el código.</p>' : ''}
    <div class="pila">${est === 'si' ? `<p class="peq" style="color:var(--okTxt);margin:0"><b>Verificado</b></p><button class="btn3 ancho" data-a="verificarLlave" data-u="${otro}" data-no="1">Quitar verificación</button>` : `<button class="btn ancho" data-a="verificarLlave" data-u="${otro}">Coinciden: marcar como verificado</button>`}<button class="btn3 ancho" data-a="cerrarHoja">Cerrar</button></div>`);
};
ACC.verificarLlave = b => { CRIPTO.marcarVerificado(b.dataset.u, !b.dataset.no); cerrarHoja(); aviso(b.dataset.no ? 'Verificación quitada' : 'Verificado'); refrescar(); };
ACC.bloquearChats = async () => { await CRIPTO.olvidar(); cerrarHoja(); aviso('Chats bloqueados en este dispositivo'); refrescar(); };
FORMS.buscarPersona = d => { const u = DB.porUsuario(d.q.trim()); if (!u || u.id === DB.yo().id) return aviso('No encontramos a ese usuario'); abrirChatCon(u.id); };
function abrirChatCon(id) {
  const c = DB.chatCon(id), n = nombreVisible(id);
  const msj = { verificar: 'Para escribirle a alguien que no es tu amigo, primero verifícate como estudiante.', pausa: 'Por reportes, por ahora solo puedes escribirles a tus amigos.', limite: 'Ya escribiste a muchas personas nuevas. Espera un rato para mandar más solicitudes.', rechazada: `${n} no aceptó tu solicitud.`, privacidad: `${n} solo recibe mensajes de ciertas personas.`, no: `No puedes escribirle a ${n}.` };
  if (!c || c.error) { const r = c?.error || 'no'; if (r === 'verificar') return pedirVerificacion(); return aviso(msj[r] || msj.no); }
  ir('#/chat/' + c.id);
}
function bannerSolicitud(c) {
  if (!DB.esSolicitud(c)) return '';
  const yo = DB.yo().id, otro = c.miembros.find(m => m !== yo);
  if (c.solicitud.de === yo) return `<p class="mini gris" style="align-self:center;margin:0">${c.solicitud.no ? 'No aceptó tu solicitud' : 'Solicitud enviada · esperando a que acepte'}</p>`;
  return `<div class="tarjeta pila" style="gap:8px;background:var(--suave);box-shadow:none"><b>${esc(nombreVisible(otro))} quiere escribirte</b><p class="peq gris" style="margin:0">No es tu amigo. No sabrá que viste su mensaje hasta que aceptes. Las fotos y archivos se quedan ocultos mientras tanto.</p>
    <div class="fila"><button class="btn2" data-a="solicitudMsg" data-id="${c.id}" data-que="si">Aceptar</button><button class="btn3" data-a="solicitudMsg" data-id="${c.id}" data-que="no">Rechazar</button><button class="btn3" style="color:var(--malTxt)" data-a="bloquearDesdeChat" data-u="${otro}" data-id="${c.id}">Bloquear</button><button class="btn3" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-chat="${c.id}" data-ref="${otro}" data-quien="${otro}">Reportar</button></div></div>`;
}
ACC.solicitudMsg = b => { if (b.dataset.que === 'si') { DB.aceptarSolicitud(b.dataset.id); DB.marcarLeido(b.dataset.id); aviso('Solicitud aceptada'); return refrescar(); } DB.rechazarSolicitud(b.dataset.id); aviso('Solicitud rechazada'); ir('#/chat'); };
ACC.bloquearDesdeChat = b => abrirHoja(`<h2>¿Bloquear a ${esc(nombreVisible(b.dataset.u))}?</h2><p class="gris">Ya no podrá escribirte, ver tu perfil ni tus publicaciones. No le avisamos.</p><div class="pila"><button class="btn-peligro ancho" data-a="confirmarBloqueoChat" data-u="${b.dataset.u}">Bloquear</button><button class="btn3 ancho" data-a="abrirReporte" data-tipo="usuario" data-chat="${b.dataset.id || ''}" data-ref="${b.dataset.u}" data-quien="${b.dataset.u}">Bloquear y reportar</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.confirmarBloqueoChat = b => { DB.bloquear(b.dataset.u); cerrarHoja(); aviso('Bloqueaste a ' + nombreVisible(b.dataset.u)); ir('#/chat'); };

function hojaPrueba(b) {
  const c = DB.estado.chats.find(x => x.id === b.dataset.chat), otro = b.dataset.ref;
  if (!c || !CRIPTO.listo()) return false;
  const msgs = DB.visibles(c).filter(m => m.u === otro && m.e && !m.borrado && CRIPTO.prueba(c, m)).slice(-15);
  if (!msgs.length) return false;
  abrirHoja(`<form class="pila" data-form="reportePrueba" style="gap:10px"><h2>¿Quieres mandar mensajes como prueba?</h2>
    <p class="peq gris" style="margin:0">Marca los mensajes que muestran el problema. Solo el admin los podrá leer, y puede comprobar que de verdad los mandó ${esc(nombreVisible(otro))}. El resto del chat sigue privado.</p>
    <input type="hidden" name="ref" value="${esc(otro)}"><input type="hidden" name="chat" value="${esc(c.id)}"><input type="hidden" name="motivo" value="${esc(b.dataset.m)}">
    <div class="pila" style="gap:6px;max-height:45vh;overflow:auto">${msgs.map(m => { const x = CRIPTO.leer(c, m); return `<label class="fila tarjeta" style="flex-wrap:nowrap;gap:10px;box-shadow:none;background:var(--suave);padding:10px;cursor:pointer"><input type="checkbox" name="p_${m.i}" value="${m.i}" style="width:20px;height:20px;flex:none"><span style="flex:1;min-width:0;overflow-wrap:anywhere"><span class="peq">${x?.t ? esc(x.t) : x?.adjunto ? 'Archivo: ' + esc(x.adjunto.nombre) : ''}</span><br><span class="mini gris">${hace(m.f)}</span></span></label>`; }).join('')}</div>
    <button class="btn ancho">Enviar reporte</button><p class="mini gris" style="margin:0;text-align:center">Si no marcas ninguno, se manda el reporte sin mensajes.</p></form>`);
  return true;
}
FORMS.reportePrueba = async (d, f) => {
  const c = DB.estado.chats.find(x => x.id === d.chat), idx = Object.keys(d).filter(k => k.startsWith('p_')).map(k => +d[k]);
  const vis = DB.visibles(c), items = idx.map(i => vis.find(m => m.i === i)).filter(Boolean).map(m => CRIPTO.prueba(c, m)).filter(Boolean);
  const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Enviando…';
  const id = uid('rep'); let extra = { id, chat: c.id };
  if (items.length) {
    try { extra.prueba = await CRIPTO.sellarPrueba(id, CONFIG.adminPrincipal, items); extra.nPruebas = items.length; }
    catch (e) { console.warn(e); aviso('No pudimos adjuntar los mensajes; el reporte se manda sin ellos.'); }
  }
  DB.reportar('usuario', d.ref, d.motivo, extra);
  graciasReporte(d.ref, true);
};
function graciasReporte(quien, ofrecerBloqueo) {
  const bloq = ofrecerBloqueo && quien && !DB.yo().bloqueados.includes(quien);
  abrirHoja(`<div class="pila" style="align-items:center;text-align:center"><span style="width:56px;height:56px;border-radius:50%;background:var(--okBg);color:var(--okTxt);display:grid;place-items:center">${icono('ok', 26)}</span><h2>Gracias por avisar</h2><p class="gris" style="margin:0">Lo revisamos. ${quien ? esc(nombreVisible(quien)) + ' no sabrá que fuiste tú.' : ''}</p>${bloq ? `<button class="btn-peligro ancho" data-a="confirmarBloqueoChat" data-u="${quien}">Bloquear también</button>` : ''}<button class="btn2 ancho" data-a="cerrarHoja">Listo</button></div>`);
}
ACC.escribirA = b => abrirChatCon(b.dataset.u);
ACC.nuevoGrupo = () => abrirHoja(`<form class="pila" data-form="crearGrupo"><h2>Nuevo grupo</h2><div><label class="campo" for="gn">Nombre</label><input id="gn" name="nombre" required maxlength="50" placeholder="Física II · Equipo 4"></div><div><label class="campo" for="gm">Integrantes</label><input id="gm" name="miembros" placeholder="@vale.a, @pedro.g"></div><button class="btn ancho">Crear</button></form>`);
FORMS.crearGrupo = d => {
  const ids = [...new Set((d.miembros || '').split(/[,\s]+/).map(n => DB.porUsuario(n)?.id).filter(Boolean))].filter(i => DB.puedeEscribir(i));
  const c = { id: uid('ch'), tipo: 'grupo', nombre: d.nombre.trim().slice(0, 50), miembros: [DB.yo().id, ...ids], mensajes: [], fijado: null };
  DB.estado.chats.push(c); DB.guardar(); cerrarHoja(); ir('#/chat/' + c.id);
};
ACC.menuChat = b => { const c = DB.estado.chats.find(x => x.id === b.dataset.id), otro = c.miembros.find(m => m !== DB.yo().id);
  abrirHoja(`<h2>${esc(tituloChat(c))}</h2><div class="pila">
    ${c.tipo === 'grupo' ? `<button class="btn2 ancho" data-a="chatAccion" data-que="tablon" data-id="${c.id}">${icono('tablon', 18)}Tablón del grupo</button>` : ''}
    ${c.tipo === 'dm' ? `<button class="btn3 ancho" data-a="codigoSeguridad" data-u="${otro}">${icono('candado', 18)}Código de seguridad</button>
    <button class="btn3 ancho" style="color:var(--malTxt)" data-a="bloquearDesdeChat" data-u="${otro}" data-id="${c.id}">${icono('bloquear', 18)}Bloquear a ${esc(nombreVisible(otro))}</button>
    <button class="btn3 ancho" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-chat="${c.id}" data-ref="${otro}" data-quien="${otro}">${icono('bandera', 18)}Reportar</button>` : ''}
    <button class="btn3 ancho" data-a="bloquearChats">Bloquear chats en este dispositivo</button>
    <button class="btn3 ancho" data-a="chatAccion" data-que="vaciar" data-id="${c.id}">Vaciar chat</button>
    ${c.tipo === 'grupo' ? `<button class="btn-peligro ancho" data-a="chatAccion" data-que="salir" data-id="${c.id}">Salir del grupo</button>` : `<button class="btn-peligro ancho" data-a="chatAccion" data-que="quitar" data-id="${c.id}">Eliminar chat</button>`}
    <p class="mini gris" style="margin:0">${c.tipo === 'grupo' ? 'Vaciar solo borra los mensajes para ti. Al salir ya no recibes mensajes del grupo.' : 'Solo se borra para ti. Si te vuelve a escribir, la conversación reaparece desde cero.'}</p>
    <button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`); };
ACC.chatAccion = b => { const id = b.dataset.id, q = b.dataset.que; cerrarHoja();
  if (q === 'tablon') { const t = DB.tablonDeChat(id); return ir('#/tablon/' + t.id); }
  if (q === 'vaciar') { DB.vaciarChat(id); aviso('Chat vaciado'); return refrescar(); }
  if (q === 'quitar') DB.quitarChat(id); else DB.salirGrupo(id);
  aviso(q === 'quitar' ? 'Chat eliminado' : 'Saliste del grupo'); ir('#/chat'); };
ACC.menuMsg = b => abrirHoja(`<h2>Mensaje</h2><div class="pila"><button class="btn-peligro ancho" data-a="borrarMsg" data-id="${b.dataset.id}" data-i="${b.dataset.i}">Eliminar para todos</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.borrarMsg = b => { DB.borrarMensaje(b.dataset.id, +b.dataset.i); cerrarHoja(); refrescar(); };

function esImagenAdj(a) { return /^image\//.test(a.mime || '') || /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(a.nombre || ''); }
function burbujaAdjunto(a, mio) {
  if (esImagenAdj(a)) return `<button class="adj-foto" data-a="abrirAdjunto" data-c="${esc(a.clave)}" data-n="${esc(a.nombre)}" data-img="1" aria-label="Ver foto"><img alt="Foto enviada" data-idb="${esc(a.clave)}"></button>`;
  return `<button class="adj-doc${mio ? ' mio' : ''}" data-a="abrirAdjunto" data-c="${esc(a.clave)}" data-n="${esc(a.nombre)}" data-m="${esc(a.mime || '')}">${icono('archivo', 26)}<span style="min-width:0;text-align:left"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.nombre)}</b><span class="mini" style="opacity:.8">${pesoBonito(a.peso)} · Toca para ver</span></span></button>`;
}
CAMBIOS.adjuntoChat = async el => {
  const fs = [...el.files], id = el.dataset.id; el.value = ''; if (!fs.length) return;
  if (fs.length > 5) return aviso('Máximo 5 archivos a la vez.');
  const c0 = DB.estado.chats.find(x => x.id === id); if (DB.puedeMandar(c0) || DB.esSolicitud(c0)) return aviso('No puedes mandar archivos hasta que acepte tu solicitud.');
  if (fs.some(f => f.size > 10 * 1024 * 1024)) return aviso('Cada archivo puede pesar máximo 10 MB.');
  aviso(fs.length > 1 ? `Enviando ${fs.length} archivos…` : 'Enviando…');
  let texto = $('#msg')?.value || ''; if (datoSensible(texto)) { texto = ''; aviso('Mandamos el archivo sin el texto: parecía llevar un dato sensible.'); }
  for (const f of fs) {
    try { const img = /^image\//.test(f.type), blob = img && !/gif/.test(f.type) ? await reducirFoto(f, 1600) : f, clave = 'chat_' + uid('f');
      const c = DB.estado.chats.find(x => x.id === id), k = await CRIPTO.guardarArchivoCifrado(clave, blob);
      DB.enviarCifrado(id, await CRIPTO.cifrarMensaje(c, { t: texto.trim().slice(0, 1000), adjunto: { clave, nombre: f.name.slice(0, 120), peso: blob.size, mime: blob.type || f.type, ...k } })); texto = ''; }
    catch { aviso('No se pudo enviar ' + f.name); }
  }
  if ($('#msg') && !datoSensible($('#msg').value)) $('#msg').value = ''; refrescar(); const m = $('#mensajes'); if (m) m.scrollTop = m.scrollHeight;
};
ACC.abrirAdjunto = b => VISOR.abrir({ clave: b.dataset.c, nombre: b.dataset.n, mime: b.dataset.img ? 'image/jpeg' : (b.dataset.m || '') });
