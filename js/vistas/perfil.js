/* Perfil, editar perfil, ajustes, verificación, notificaciones y ramitas */
'use strict';
const SERVICIOS = [[/spotify\.com/, 'Spotify', 'i-verde'], [/music\.apple\.com/, 'Apple Music', 'i-rojo'], [/music\.youtube\.com|youtube\.com|youtu\.be/, 'YouTube Music', 'i-rojo'], [/soundcloud\.com/, 'SoundCloud', 'i-naranja'], [/deezer\.com/, 'Deezer', 'i-morado']];
const servicioDe = url => SERVICIOS.find(([r]) => r.test(url)) || [null, 'Enlace', 'i-azul'];
const urlSegura = u => /^https:\/\/[^\s"'<>]+$/i.test(u || '') ? u : null;
const embedSpotify = u => { const m = /open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/.exec(u || ''); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null; };

VISTAS.perfil = {
  titulo: ([n]) => n ? '@' + n : 'Mi perfil', nav: 'perfil',
  render([n]) {
    const yo = DB.yo(), u = n ? DB.porUsuario(n) : yo;
    if (!u) return '<p class="vacio">No encontramos ese perfil.</p>';
    const mio = u.id === yo.id;
    if (!DB.verPerfil(u.id)) return `<div class="tarjeta" style="text-align:center">${avatar(u.id, true)}<h2 style="margin-top:10px">@${esc(u.usuario)}</h2><p class="gris">Este perfil es privado.</p></div>`;
    const [rango, grad] = rangoReputacion(u.reputacion), amigo = DB.sonAmigos(u.id, yo.id) && !mio;
    const ins = u.insignias.filter(i => !u.ocultas.includes(i));
    const stats = [[E_aportes(u), 'Aportes'], [u.amigos.length, 'Amigos'], [u.racha.dias || 0, 'Racha']];
    return `<div class="pila">
      <section class="tarjeta" style="text-align:center;padding:0;overflow:hidden">
        <div style="height:56px;background:var(--g-banda);position:relative">${mio ? `<a class="icono-btn" href="#/ajustes" aria-label="Ajustes" style="position:absolute;right:4px;top:4px;color:#fff;min-width:44px;min-height:44px">${icono('ajustes', 20)}</a>` : ''}</div>
        <div style="margin-top:-46px;position:relative;z-index:1"><span class="marco" style="background:${grad}">${avatar(u.id, true)}</span></div>
        <div style="padding:8px 16px 18px"><h2 style="font-size:22px">@${esc(u.usuario)}</h2><p class="peq gris" style="margin:4px 0 0">${esc(subNombre(u.id))}</p>
          ${u.bio ? `<p style="margin:10px 0 0">${esc(u.bio)}</p>` : ''}
          <span class="insignia i-morado" style="margin-top:10px">Reputación ${rango} · ${u.reputacion} pts</span>
          <div class="fila" style="justify-content:center;margin-top:12px">${mio ? '<a class="btn3" href="#/editar-perfil">Editar perfil</a>' : `<button class="${amigo ? 'btn3' : 'btn2'}" data-a="amigo" data-u="${u.id}">${amigo ? 'Amigos' : 'Agregar amigo'}</button>${DB.puedeEscribir(u.id) ? `<button class="btn3" data-a="escribirA" data-u="${u.id}">Escribir</button>` : ''}<button class="icono-btn" data-a="menuPerfil" data-u="${u.id}" aria-label="Más opciones">${icono('puntos')}</button>`}</div></div></section>
      ${ins.length ? `<div class="fila">${ins.map(i => `<span class="insignia ${INSIGNIAS[i].clase}">${INSIGNIAS[i].texto}</span>`).join('')}</div>` : ''}
      ${seccionCanciones(u, mio)}
      ${(() => { const R = u.redes || {}, filas = [['instagram', 'Instagram', R.instagram], ['tiktok', 'TikTok', R.tiktok], ['youtube', 'YouTube', R.youtube && (R.youtube.match(/\/(@[\w.-]+)/)?.[1]?.slice(1) || 'canal')]].filter(x => x[2]); if (!filas.length) return '';
        return `<section class="tarjeta"><h2 style="margin-bottom:8px">${mio ? 'Mis redes' : 'Sus redes'}</h2><div class="pila" style="gap:8px">${filas.map(([k, n, h]) => { const nd = (R.destacadas || []).filter(x => embedRed(x)?.red === k).length; return `<a href="#/redes/${esc(u.usuario)}/${k}" class="fila" style="flex-wrap:nowrap;min-height:56px;padding:8px 12px;border-radius:14px;border:1px solid var(--linea);text-decoration:none;color:inherit"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;background:${k === 'instagram' ? 'var(--suave);color:var(--moradoTxt)' : k === 'youtube' ? '#FFE1E1;color:#B42318' : '#DCE8FB;color:#174EAD'}">${icono(k, 22)}</span><span style="flex:1"><b>${n}</b><br><span class="mini gris">@${esc(h)}${nd ? ` · ${nd} destacada${nd > 1 ? 's' : ''}` : ''}</span></span>${icono('atras', 18, 'style="transform:rotate(180deg);color:var(--gris)"')}</a>`; }).join('')}</div></section>`; })()}
      ${u.playlists.length ? `<section class="tarjeta"><h2 style="margin-bottom:8px">${mio ? 'Mis playlists' : 'Sus playlists'}</h2>${u.playlists.map(p => { const [, s, c] = servicioDe(p.url); const href = urlSegura(p.url); return `<a ${href ? `href="${esc(href)}" target="_blank" rel="noopener"` : ''} class="fila" style="flex-wrap:nowrap;padding:8px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit"><span style="width:40px;height:40px;border-radius:10px;background:var(--g-marca);flex:none"></span><b class="peq" style="flex:1">${esc(p.nombre)}</b><span class="insignia ${c}">${s}</span></a>`; }).join('')}</section>` : ''}
      <div class="rejilla3">${stats.map(([v, t]) => `<div class="tarjeta" style="text-align:center;padding:12px 6px"><b style="font-family:Sora,sans-serif;font-size:22px">${v}</b><br><span class="mini gris">${t}</span></div>`).join('')}</div>
      ${mio ? `<a href="#/ramitas" class="tarjeta entre" style="text-decoration:none;color:inherit"><span><h2>Tus ramitas</h2><span class="mini gris">Ver movimientos</span></span><b style="font-family:Sora,sans-serif;font-size:28px;color:var(--moradoTxt)">${numero(DB.saldo())}</b></a>
        ${yo.verificado !== 'si' ? `<a href="#/verificar" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit;border:2px solid var(--azul)">${icono('ok', 22, 'style="color:var(--azulTxt)"')}<span><b>${yo.verificado === 'pendiente' ? 'Revisando tu documento' : 'Verifica que eres estudiante'}</b><br><span class="mini gris">Para votar, opinar y usar predicciones</span></span></a>` : ''}` : ''}</div>`;
  },
  montar([n]) {
    const u = n ? DB.porUsuario(n) : DB.yo();
    if (u && u.id !== DB.yo().id && u.cancion?.archivo && DB.yo().ajustes.musicaAuto) { if (!REPRO.sonando(u.cancion.archivo)) reproducir(u.cancion.archivo, true, u.id); }
  }
};
function E_aportes(u) { return DB.estado.posts.filter(p => p.autor === u.id).length + DB.estado.propuestas.filter(p => p.autor === u.id).length + DB.estado.rankings.filter(r => r.autor === u.id).length; }
function reproducir(src, auto, dueno) { const u = DB.usuario(dueno) || Object.values(DB.estado.usuarios).find(x => DB.canciones(x).some(c => c.archivo === src)); const c = u && DB.canciones(u).find(x => x.archivo === src); return REPRO.alternar(c || { archivo: src, titulo: 'Canción' }, u?.id, auto); }
ACC.playPerfil = b => reproducir(b.dataset.src, false, b.dataset.u);
ACC.amigo = b => { DB.alternarAmigo(b.dataset.u); refrescar(); };
ACC.menuPerfil = b => abrirHoja(`<div class="pila" style="gap:8px">${DB.esAdmin() ? `<button class="btn-peligro ancho" data-a="suspender" data-u="${b.dataset.u}">${DB.usuario(b.dataset.u).suspendido ? 'Reactivar cuenta' : 'Suspender cuenta (admin)'}</button>` : ''}<button class="btn3 ancho" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-ref="${b.dataset.u}" data-quien="${b.dataset.u}">${icono('bandera', 18)}Reportar perfil</button><button class="btn3 ancho" data-a="bloquear" data-u="${b.dataset.u}">${icono('bloquear', 18)}Bloquear</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);

/* ---------- Editar perfil (los cambios se marcan en amarillo) ---------- */
VISTAS['editar-perfil'] = {
  titulo: 'Editar perfil', nav: 'perfil', atras: '#/perfil',
  render() {
    const u = DB.yo(), bloque = (t, contenido, extra = '') => `<section class="tarjeta campo-edit" ${extra}><div class="entre" style="margin-bottom:8px"><b>${t}</b><span class="insignia cambiado-tag" style="background:var(--g-accion);color:#1B1530;display:none">Cambiado</span></div>${contenido}</section>`;
    return `<form class="pila" data-form="guardarPerfil" id="formPerfil">
      <div style="text-align:center"><span class="marco" style="background:${rangoReputacion(u.reputacion)[1]}">${avatar(u.id, true)}</span><p class="mini gris">El marco ${rangoReputacion(u.reputacion)[0]} se gana con reputación</p></div>
      ${bloque('Foto de perfil', `<div class="fila"><label class="btn3" style="cursor:pointer">${icono('camara', 18)}Subir foto<input type="file" accept="image/*" class="oculto" data-cambio="fotoPerfil"></label>${u.foto ? '<button type="button" class="btn3" style="color:var(--malTxt)" data-a="quitarFoto">Quitar foto</button>' : ''}</div><p class="mini gris" style="margin:6px 0 0">La que quieras. Se recorta en cuadrado.</p><input type="hidden" name="foto" value="" data-orig="">`)}
      ${bloque('Nombre de usuario', `<label class="oculto" for="eu">Nombre de usuario</label><input id="eu" name="usuario" required pattern="[a-zA-Z0-9._]{3,20}" value="${esc(u.usuario)}" data-orig="${esc(u.usuario)}">`)}
      ${bloque('Nombre real', `<label class="oculto" for="en">Nombre real</label><input id="en" name="nombre" required value="${esc(u.nombre)}" data-orig="${esc(u.nombre)}"><label class="campo" for="ev" style="margin-top:10px">Lo ven</label><select id="ev" name="nombreVis" data-orig="${u.nombreVis}">${[['todos', 'Todos'], ['amigos', 'Amigos'], ['elegidos', 'Quien yo elija'], ['yo', 'Solo yo']].map(([k, t]) => `<option value="${k}" ${u.nombreVis === k ? 'selected' : ''}>${t}</option>`).join('')}</select><label class="campo" for="ee" style="margin-top:10px">Si eliges "Quien yo elija"</label><input id="ee" name="nombreElegidos" placeholder="@vale.a, @pedro.g" value="${esc((u.nombreElegidos || []).map(i => '@' + DB.usuario(i)?.usuario).join(', '))}" data-orig="${esc((u.nombreElegidos || []).map(i => '@' + DB.usuario(i)?.usuario).join(', '))}">`)}
      ${bloque('Sobre mí', `<label class="oculto" for="eb">Sobre mí</label><textarea id="eb" name="bio" maxlength="160" data-orig="${esc(u.bio)}">${esc(u.bio)}</textarea>`)}
      ${bloque('Carrera y generación', `<p style="margin:0">${esc(u.carrera)}${u.gen ? ' · Gen ' + u.gen : ''}</p><p class="mini gris" style="margin:4px 0 0">Se cambia desde Ajustes o subiendo tu horario.</p>`)}
      ${bloque('Canciones', `<div id="listaCanciones">${listaCancionesEdit()}</div><div class="rejilla2" style="margin-top:10px"><label class="btn3" style="cursor:pointer">${icono('musica', 18)}Subir archivo<input type="file" accept="audio/*,video/*" class="oculto" data-cambio="audioSubir"></label><button type="button" class="btn3" data-a="cancionEnlace">${icono('mas', 18)}Agregar enlace</button></div><p class="mini gris" style="margin:6px 0 0">Archivos tuyos (MP3, M4A, video…) o enlaces de YouTube, Spotify o Apple Music. Hasta 8.</p>`)}
      ${bloque('Mis redes', `<div class="pila" style="gap:8px"><div><label class="campo" for="rig">Instagram</label><div class="fila" style="flex-wrap:nowrap"><span class="pastilla" style="display:grid;place-items:center">@</span><input id="rig" name="redIg" maxlength="30" pattern="[A-Za-z0-9._]{1,30}" autocapitalize="off" value="${esc(u.redes?.instagram || '')}" data-orig="${esc(u.redes?.instagram || '')}"></div></div>
        <div><label class="campo" for="rtt">TikTok</label><div class="fila" style="flex-wrap:nowrap"><span class="pastilla" style="display:grid;place-items:center">@</span><input id="rtt" name="redTt" maxlength="30" pattern="[A-Za-z0-9._]{1,30}" autocapitalize="off" value="${esc(u.redes?.tiktok || '')}" data-orig="${esc(u.redes?.tiktok || '')}"></div></div>
        <div><label class="campo" for="ryt">YouTube <span class="mini gris">(enlace de tu canal)</span></label><input id="ryt" name="redYt" type="url" placeholder="https://www.youtube.com/@tucanal" value="${esc(u.redes?.youtube || '')}" data-orig="${esc(u.redes?.youtube || '')}"></div>
        <div><span class="campo">Publicaciones destacadas <span class="mini gris">(enlaces de Instagram, TikTok o YouTube)</span></span><div class="pila" style="gap:6px">${[0, 1, 2].map(i => `<label class="oculto" for="rd${i}">Destacada ${i + 1}</label><input id="rd${i}" name="dest${i}" type="url" placeholder="https://www.instagram.com/p/…" value="${esc(u.redes?.destacadas?.[i] || '')}" data-orig="${esc(u.redes?.destacadas?.[i] || '')}">`).join('')}</div></div></div>`)}
      ${bloque('Playlists', `<div class="pila" style="gap:6px">${[0, 1, 2].map(i => { const p = u.playlists[i] || {}; return `<div class="rejilla2"><label class="oculto" for="pn${i}">Nombre</label><input id="pn${i}" name="pn${i}" placeholder="Nombre" maxlength="50" value="${esc(p.nombre || '')}" data-orig="${esc(p.nombre || '')}"><label class="oculto" for="pu${i}">Enlace</label><input id="pu${i}" name="pu${i}" type="url" placeholder="https://…" value="${esc(p.url || '')}" data-orig="${esc(p.url || '')}"></div>`; }).join('')}</div>`)}
      ${bloque('Insignias que se muestran', `<div class="fila">${u.insignias.map(i => `<label class="insignia ${INSIGNIAS[i].clase}" style="cursor:pointer;display:inline-flex;gap:6px;align-items:center"><input type="checkbox" name="ins_${i}" ${u.ocultas.includes(i) ? '' : 'checked'} data-orig="${u.ocultas.includes(i) ? '' : 'on'}">${INSIGNIAS[i].texto}</label>`).join('') || '<span class="gris peq">Aún no tienes insignias.</span>'}</div>`)}
      <button class="btn ancho" id="btnGuardar">Guardar</button></form>`;
  }
};
document.addEventListener('input', e => marcarCambios(e.target));
document.addEventListener('change', e => marcarCambios(e.target));
function marcarCambios(el) {
  const f = el.closest?.('#formPerfil'); if (!f) return; let n = 0;
  $$('.campo-edit', f).forEach(sec => { const cambio = $$('[data-orig]', sec).some(i => (i.type === 'checkbox' ? (i.checked ? 'on' : '') : i.value) !== i.dataset.orig); sec.style.borderLeft = cambio ? '5px solid var(--amarillo)' : ''; $('.cambiado-tag', sec).style.display = cambio ? 'inline-block' : 'none'; if (cambio) n++; });
  $('#btnGuardar').textContent = n ? `Guardar (${n})` : 'Guardar';
}
FORMS.guardarPerfil = d => {
  const u = DB.yo(), nuevo = d.usuario.toLowerCase();
  if (nuevo !== u.usuario && !DB.usuarioDisponible(nuevo)) return aviso('Ese nombre de usuario ya está ocupado');
  const playlists = [0, 1, 2].map(i => ({ nombre: (d['pn' + i] || '').trim(), url: (d['pu' + i] || '').trim(), servicio: servicioDe(d['pu' + i] || '')[1] })).filter(p => p.nombre && urlSegura(p.url));
  if (d.foto === 'quitar') u.foto = null; else if (d.foto) u.foto = d.foto;
  if (d.foto === 'quitar') u.foto = null; else if (d.foto) u.foto = d.foto;
  u.redes = { instagram: (d.redIg || '').trim().replace(/^@/, '').slice(0, 30), tiktok: (d.redTt || '').trim().replace(/^@/, '').slice(0, 30), youtube: /^https:\/\/(www\.|m\.)?youtube\.com\/(@[\w.-]+|channel\/[\w-]+|c\/[\w.-]+|user\/[\w.-]+)\/?$/.test((d.redYt || '').trim()) ? d.redYt.trim() : '', destacadas: [d.dest0, d.dest1, d.dest2].map(x => (x || '').trim()).filter(x => embedRed(x)) };
  DB.actualizarPerfil({ usuario: nuevo, nombre: d.nombre.trim(), nombreVis: d.nombreVis, nombreElegidos: (d.nombreElegidos || '').split(/[,\s]+/).map(x => DB.porUsuario(x)?.id).filter(Boolean), bio: d.bio.trim(), playlists, ocultas: u.insignias.filter(i => !d['ins_' + i]) });
  aviso('Perfil actualizado'); ir('#/perfil');
};

/* ---------- Ajustes ---------- */
VISTAS.ajustes = {
  titulo: 'Ajustes', nav: 'perfil', atras: '#/perfil',
  render() {
    const u = DB.yo(), seg = (k, t, ops) => `<div style="padding:8px 0;border-bottom:1px solid var(--linea)"><div class="peq" style="margin-bottom:6px">${t}</div><div class="rejilla3" style="background:var(--suave);border-radius:12px;padding:3px">${ops.map(([v, n]) => `<button class="pastilla${u.privacidad[k] === v ? ' on' : ''}" style="border:0" data-a="privacidad" data-k="${k}" data-v="${v}">${n}</button>`).join('')}</div></div>`;
    const sw = (k, t) => `<button class="entre ancho" style="min-height:52px;border:0;background:transparent;border-bottom:1px solid var(--linea);padding:0;text-align:left" data-a="interruptor" data-k="${k}" role="switch" aria-checked="${!!u.ajustes[k]}"><span>${t}</span><span style="width:46px;height:28px;border-radius:999px;background:${u.ajustes[k] ? 'var(--g-marca)' : 'var(--linea)'};position:relative;flex:none"><span style="position:absolute;top:4px;left:${u.ajustes[k] ? '22px' : '4px'};width:20px;height:20px;border-radius:50%;background:#fff"></span></span></button>`;
    return `<div class="pila">
      <section class="tarjeta"><h2 style="margin-bottom:8px">Tu cuenta</h2>
        <form data-form="ajusteCarrera" class="pila" style="gap:8px"><div><label class="campo" for="ac">Carrera</label><input id="ac" name="carrera" list="listaCarreras" maxlength="80" placeholder="Escribe tu carrera" value="${esc(u.carrera === 'Sin carrera' ? '' : u.carrera)}">${datalistCarreras()}</div><div class="rejilla2"><div><label class="campo" for="as">Semestre <span class="mini gris">(opcional)</span></label><input id="as" name="semestre" type="number" min="1" max="16" inputmode="numeric" value="${u.semestre || ''}"></div><div><label class="campo" for="ag">Generación <span class="mini gris">(opcional)</span></label><input id="ag" name="gen" type="number" min="1990" max="2040" inputmode="numeric" placeholder="2024" value="${u.gen || ''}"></div></div><button class="btn3">Guardar</button></form>
        <div class="entre" style="margin-top:10px"><span>Verificación</span>${u.verificado === 'si' ? '<b style="color:var(--okTxt)">Verificado</b>' : `<a href="#/verificar">${u.verificado === 'pendiente' ? 'En revisión' : 'Verificarme'}</a>`}</div></section>
      <section class="tarjeta"><h2>Mi horario</h2><p class="mini gris" style="margin:2px 0 10px">Con tu horario te avisamos de exámenes y tus retos salen de tus materias.</p>
        ${u.horario.map((h, i) => `<div class="entre" style="padding:8px 10px;border-radius:12px;background:var(--suave);margin-bottom:6px"><span><b class="peq">${esc(h.materia)}</b><br><span class="mini gris">${esc(h.dias)} · ${esc(h.hora)} · ${esc(h.salon)}</span></span><button class="icono-btn" data-a="quitarClase" data-i="${i}" aria-label="Quitar ${esc(h.materia)}">${icono('cerrar', 18)}</button></div>`).join('') || '<p class="peq gris">Aún no cargas tu horario.</p>'}
        <form data-form="agregarClase" class="pila" style="gap:6px;margin-top:8px"><div class="rejilla2"><label class="oculto" for="hm">Materia</label><input id="hm" name="materia" required placeholder="Materia"><label class="oculto" for="hd">Días</label><input id="hd" name="dias" required placeholder="Lun y Mié"></div><div class="rejilla2"><label class="oculto" for="hh">Hora</label><input id="hh" name="hora" type="time" required><label class="oculto" for="hs">Salón</label><input id="hs" name="salon" placeholder="Salón"></div><div class="rejilla2"><button class="btn3">Agregar a mano</button><label class="btn3" style="cursor:pointer">Subir foto<input type="file" accept="image/*,.pdf" class="oculto" data-cambio="subirHorario"></label></div></form></section>
      <section class="tarjeta"><h2>Privacidad</h2>${seg('escribir', 'Quién puede escribirme', [['todos', 'Todos'], ['amigos', 'Amigos'], ['nadie', 'Nadie']])}${seg('perfil', 'Quién ve mi perfil', [['todos', 'Todos'], ['amigos', 'Amigos'], ['nadie', 'Solo yo']])}${seg('venta', 'Mi compraventa por defecto', [['todos', 'Todos'], ['amigos', 'Amigos'], ['elegidos', 'Elegidos']])}</section>
      <section class="tarjeta"><h2>Música y apariencia</h2>${sw('musicaAuto', 'Reproducir música al abrir perfiles')}${sw('oscuro', 'Modo oscuro')}</section>
      <section class="tarjeta"><h2 style="margin-bottom:8px">Personas bloqueadas</h2>${u.bloqueados.map(i => `<div class="entre" style="padding:6px 0"><span>${esc(nombreVisible(i))}</span><button class="btn3" data-a="desbloquear" data-u="${i}">Desbloquear</button></div>`).join('') || '<p class="peq gris" style="margin:0">Nadie.</p>'}</section>
      <section class="tarjeta pila" style="gap:8px">${DB.esAdmin() ? '<a class="btn2" href="#/admin">Panel de administración</a>' : ''}${(CONFIG.cuentasEquipo || []).some(c => c.id === DB.yo().id) ? '<button class="btn2" data-a="cambiarCuenta">Cambiar de cuenta (equipo)</button>' : ''}<button class="btn3" data-a="cerrarSesion">Cerrar sesión</button>${SYNC.activo ? '' : `<button class="btn-peligro" data-a="reiniciarDatos">Borrar datos de prueba de este navegador</button>`}</section></div>`;
  }
};
ACC.privacidad = b => { DB.yo().privacidad[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'venta') UI.cvVis = b.dataset.v; DB.guardar(); refrescar(); };
ACC.interruptor = b => { const a = DB.yo().ajustes; a[b.dataset.k] = !a[b.dataset.k]; DB.guardar(); DB.alEntrar(); refrescar(); };
ACC.desbloquear = b => { DB.desbloquear(b.dataset.u); refrescar(); };
ACC.quitarClase = b => { DB.yo().horario.splice(+b.dataset.i, 1); DB.guardar(); refrescar(); };
FORMS.agregarClase = d => { DB.yo().horario.push({ materia: d.materia.trim(), dias: d.dias.trim(), hora: d.hora, salon: d.salon.trim() }); DB.guardar(); refrescar(); };
FORMS.ajusteCarrera = d => { DB.actualizarPerfil({ carrera: d.carrera.trim().slice(0, 80) || 'Sin carrera', semestre: d.semestre ? Number(d.semestre) : null, gen: d.gen ? Number(d.gen) : null }); aviso('Guardado'); };
function datalistCarreras() { return `<datalist id="listaCarreras">${CARRERAS.map(c => `<option value="${esc(c.nombre)}">`).join('')}</datalist>`; }
CAMBIOS.subirHorario = el => { if (el.files[0]) { const u = DB.yo(); if (u.verificado !== 'si') DB.enviarCredencial(el.files[0].name); aviso('Recibido. Lo revisamos y cargamos tus materias.'); refrescar(); } };
ACC.cerrarSesion = () => { UI.salioManual = true; DB.salir(); UI.reg.paso = 0; ir('#/bienvenida'); };
ACC.reiniciarDatos = () => abrirHoja(`<h2>¿Borrar todo?</h2><p class="gris">Se borran las cuentas y publicaciones de prueba guardadas en este navegador y vuelven los datos de ejemplo.</p><div class="pila"><button class="btn-peligro ancho" data-a="confirmarReinicio">Sí, borrar</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
ACC.confirmarReinicio = () => { DB.reiniciar(); UI.reg.paso = 0; cerrarHoja(); ir('#/bienvenida'); };

/* ---------- Verificación ---------- */
UI.verif = { metodo: 'correo', codigo: null, correo: '' };
VISTAS.verificar = {
  titulo: 'Verificación', nav: 'perfil', atras: '#/perfil',
  render() {
    const u = DB.yo(), V = UI.verif;
    if (u.verificado === 'si') return `<div class="tarjeta" style="text-align:center"><span style="width:60px;height:60px;border-radius:50%;background:var(--okBg);color:var(--okTxt);display:inline-grid;place-items:center">${icono('ok', 28)}</span><h2 style="margin-top:10px">Ya estás verificado</h2><a class="btn" style="margin-top:12px" href="#/inicio">Volver</a></div>`;
    return `<div class="pila"><div style="text-align:center">${castor(72)}<h1>Confirma que eres estudiante</h1><p class="gris">Así sabemos que quien vota y opina de verdad estudia aquí.</p></div>
      ${u.verificado === 'pendiente' ? '<p class="tarjeta peq" style="background:var(--avisoBg);color:var(--avisoTxt);border:0">Ya recibimos tu documento y lo estamos revisando. Si quieres, verifícate al instante con tu correo.</p>' : ''}
      ${[['correo', 'Correo institucional', 'Recomendado · listo en 1 minuto'], ['credencial', 'Documento oficial', 'Credencial, boleta, horario, constancia o kárdex · lo revisa el equipo']].map(([k, t, d]) => `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left;box-shadow:none;border:2px solid ${V.metodo === k ? 'var(--morado)' : 'var(--linea)'}" data-a="metodoVerif" data-m="${k}" aria-pressed="${V.metodo === k}"><span style="width:20px;height:20px;border-radius:50%;border:2px solid var(--morado);display:grid;place-items:center;flex:none"><span style="width:10px;height:10px;border-radius:50%;background:${V.metodo === k ? 'var(--morado)' : 'transparent'}"></span></span><span><b>${t}</b><br><span class="mini gris">${d}</span></span></button>`).join('')}
      ${V.metodo === 'correo' ? (V.codigo ? `<form class="tarjeta pila" data-form="codigoVerif"><label class="campo" for="vc">Código que te llegó a ${esc(V.correo)}</label><input id="vc" name="c" required inputmode="numeric" pattern="[0-9]{6}" placeholder="6 dígitos" style="letter-spacing:.3em;font-size:20px"><button class="btn2 ancho">Verificar</button><button type="button" class="btn3" data-a="otroCorreo">Usar otro correo</button></form>`
        : `<form class="tarjeta pila" data-form="correoVerif"><label class="campo" for="vco">Tu correo de la universidad</label><input id="vco" name="correo" type="email" required placeholder="a123456@${esc((CONFIG.dominiosUni || ['uach.mx'])[0])}"><p class="mini gris" style="margin:4px 0 0">Tiene que ser tu correo de la universidad (@${esc((CONFIG.dominiosUni || []).join(', @'))}).</p><button class="btn2 ancho">Enviar código</button></form>`)
        : `<label class="tarjeta" style="border:2px dashed var(--linea);display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;cursor:pointer;text-align:center">${icono('camara', 30)}<b style="color:var(--moradoTxt)">Tomar o subir foto o PDF</b><span class="mini gris">Tapa lo que no sea necesario (CURP, dirección). Solo necesitamos tu nombre, matrícula y que sea de este periodo. Se borra al revisarlo.</span><input type="file" accept="image/*,.pdf" class="oculto" data-cambio="credencial"></label><div><label class="campo" for="vtd">¿Qué documento es?</label><select id="vtd" data-cambio="tipoDoc">${['Credencial de la universidad', 'Boleta de calificaciones', 'Horario', 'Constancia de estudios', 'Kárdex o tira de materias', 'Otro documento oficial'].map(t => `<option ${UI.verif.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`}
      <section class="tarjeta"><h2 style="margin-bottom:6px">Qué se desbloquea</h2>${['Opinar y calificar profesores', 'Predicciones con ramitas'].map(t => `<p class="fila peq" style="margin:6px 0">${icono('ok', 18, 'style="color:var(--okTxt)"')}${t}</p>`).join('')}<p class="mini gris" style="margin:6px 0 0">Sin verificar puedes ver, publicar, votar y jugar.</p></section></div>`;
  }
};
ACC.metodoVerif = b => { UI.verif.metodo = b.dataset.m; refrescar(); };
ACC.otroCorreo = () => { UI.verif.codigo = null; refrescar(); };
FORMS.correoVerif = d => { if (!DB.correoInstitucional(d.correo)) return aviso(`Usa tu correo de la universidad (@${(CONFIG.dominiosUni || []).join(', @')}). Si no tienes, sube un documento.`); UI.verif.correo = d.correo; UI.verif.codigo = String(Math.floor(100000 + Math.random() * 900000)); aviso('Versión de prueba: tu código es ' + UI.verif.codigo + '. En la real llega por correo.'); refrescar(); };
FORMS.codigoVerif = d => { if (d.c !== UI.verif.codigo) return aviso('Ese código no coincide'); DB.verificarCorreo(UI.verif.correo); UI.verif.codigo = null; aviso('¡Listo, ya estás verificado!'); refrescar(); };
CAMBIOS.tipoDoc = el => { UI.verif.tipo = el.value; };
CAMBIOS.credencial = el => { if (el.files[0]) { DB.enviarCredencial(el.files[0].name, (UI.verif.tipo || 'Credencial de la universidad').toLowerCase()); aviso('Recibido. Te avisamos cuando lo revisemos.'); refrescar(); } };

/* ---------- Notificaciones ---------- */
VISTAS.notificaciones = {
  titulo: 'Notificaciones', nav: 'inicio',
  render() {
    const l = DB.misNotifs();
    const html = `<div class="pila" style="gap:8px">${l.map(n => { const r = n.tipo === 'consentimiento' && DB.estado.rankings.find(x => x.id === n.ref), pend = r && r.consentimiento[DB.yo().id] === null;
      return `<div class="tarjeta" style="padding:12px 14px;${n.leida ? '' : 'border-left:5px solid var(--naranja)'}"><a href="${esc(n.link || '#/inicio')}" style="color:inherit;text-decoration:none">${esc(n.texto)}</a><div class="mini gris" style="margin-top:4px">${hace(n.fecha)}</div>
        ${pend ? `<div class="fila" style="margin-top:8px"><button class="btn2" data-a="consentir" data-id="${r.id}" data-v="1">Acepto aparecer</button><button class="btn3" data-a="consentir" data-id="${r.id}" data-v="0">No acepto</button></div>` : ''}</div>`; }).join('') || '<p class="vacio">No tienes notificaciones.</p>'}</div>`;
    return html;
  },
  montar() { setTimeout(() => { DB.leerNotifs(); const p = $('.campana .punto'); if (p) p.remove(); }, 800); }
};
ACC.consentir = b => { DB.responderConsentimiento(b.dataset.id, b.dataset.v === '1'); aviso(b.dataset.v === '1' ? 'Listo, aparecerás en el ranking' : 'No aparecerás en ese ranking'); refrescar(); };

/* ---------- Ramitas ---------- */
const NOMBRE_MOV = { regalo: 'Regalo', diario: 'Regalo del día', reto: 'Reto académico', juego: 'Juego diario', racha: 'Premio de racha', apuesta: 'Predicción', ganancia: 'Acertaste una predicción', devolucion: 'Devolución', premio: 'Premio', casino: 'Ruleta y tragamonedas', compra: 'Compra de ramitas' };
VISTAS.ramitas = {
  titulo: 'Tus ramitas', nav: 'perfil', atras: '#/perfil',
  render() {
    const movs = DB.movimientos(DB.yo().id).slice(0, 60);
    return `<div class="pila"><section class="tarjeta" style="text-align:center;background:var(--g-marca);color:#fff;border:0"><span class="etiqueta">Saldo</span><b style="display:block;font-family:Sora,sans-serif;font-size:48px">${numero(DB.saldo())}</b></section>${CONFIG.pagosActivos || CONFIG.pagosDemo ? '<a class="btn ancho" href="#/comprar-ramitas">' + icono('mas', 18) + 'Comprar más</a>' : ''}
      <section class="tarjeta"><h2 style="margin-bottom:6px">Movimientos</h2>${movs.map(m => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span><span class="peq">${esc(NOMBRE_MOV[m.tipo] || m.tipo)}</span><br><span class="mini gris">${hace(m.f)}</span></span><b style="color:${m.monto >= 0 ? 'var(--okTxt)' : 'var(--malTxt)'}">${m.monto >= 0 ? '+' : MENOS}${Math.abs(m.monto)}</b></div>`).join('')}</section></div>`;
  }
};

ACC.suspender = b => { const u = DB.usuario(b.dataset.u); DB.suspender(u.id, !u.suspendido); cerrarHoja(); aviso(u.suspendido ? 'Cuenta suspendida: ya no puede entrar y sus publicaciones se ocultan' : 'Cuenta reactivada'); refrescar(); };

ACC.cambiarCuenta = () => FORMS.entrarAdmin({ clave: CONFIG.claveAdmin });

CAMBIOS.fotoPerfil = async el => {
  const f = el.files[0]; if (!f) return; if (!f.type.startsWith('image/')) return aviso('Elige una imagen.');
  try { const url = await reducirImagen(f, 256); const h = $('#formPerfil input[name=foto]'); h.value = url; h.dispatchEvent(new Event('input', { bubbles: true }));
    const av = $('#formPerfil .marco .avatar'); if (av) { av.style.background = `#DDD6EA url('${url}') center/cover`; av.textContent = ''; } aviso('Foto lista. Dale Guardar.'); }
  catch { aviso('No pudimos leer esa imagen.'); }
};
ACC.quitarFoto = () => { const h = $('#formPerfil input[name=foto]'); h.value = 'quitar'; h.dispatchEvent(new Event('input', { bubbles: true })); const av = $('#formPerfil .marco .avatar'); if (av) { av.style.background = '#DCE8FB'; av.textContent = DB.yo().usuario[0].toUpperCase(); } aviso('Se quitará al guardar.'); };
CAMBIOS.audioSubir = async el => {
  const f = el.files[0]; el.value = ''; if (!f) return; if (!/^(audio|video)\//.test(f.type)) return aviso('Elige un archivo de audio o video.'); if (f.size > 40 * 1024 * 1024) return aviso('Máximo 40 MB.');
  const lista = DB.canciones(); if (lista.length >= 8) return aviso('Máximo 8 canciones.');
  aviso('Subiendo…');
  try { const clave = 'cancion_' + DB.yo().id + '_' + Date.now(); await ARCHIVOS.guardar(clave, f);
    const portada = await extraerPortada(f).catch(() => null);
    lista.push({ titulo: f.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Mi canción', artista: '', enlace: '', archivo: 'idb:' + clave, portada });
    DB.guardarCanciones(lista); pintarListaCanciones(); aviso(portada ? 'Canción agregada con su portada' : 'Canción agregada'); }
  catch { aviso('No pudimos guardar el archivo en este celular.'); }
};

/* disco de vinilo; en el centro la portada del archivo si trae */
function vinilo(c) {
  const ok = c?.portada && /^data:image\/(jpeg|png|webp);base64,/.test(c.portada);
  return `<span class="vinilo${REPRO.sonando(c?.archivo) ? ' girando' : ''}" data-vinilo="${esc(c?.archivo || '')}" aria-hidden="true"><span class="etiqueta-disco" style="${ok ? `background:#4B1F7A url('${c.portada}') center/cover` : ''}"></span></span>`;
}
/* lee la portada incrustada en MP3 (ID3v2.2–2.4) o M4A/MP4 (covr); de un video toma un cuadro */
async function extraerPortada(f) {
  if (/^video\//.test(f.type) || /\.(mp4|mov|webm|m4v)$/i.test(f.name || '')) { const v = await cuadroDeVideo(f).catch(() => null); if (v) return v; }
  const buf = new Uint8Array(await f.slice(0, Math.min(f.size, 40 * 1024 * 1024)).arrayBuffer());
  const txt = (b, i, n) => String.fromCharCode(...b.subarray(i, i + n)), u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0, sync = (b, i) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
  let img = null, mime = '';
  if (txt(buf, 0, 3) === 'ID3') {
    const v = buf[3], fl = buf[5], fin = Math.min(buf.length, 10 + sync(buf, 6));
    let tag = buf.subarray(10, fin);
    if (fl & 0x80 && v < 4) { const out = []; for (let k = 0; k < tag.length; k++) { out.push(tag[k]); if (tag[k] === 0xFF && tag[k + 1] === 0) k++; } tag = new Uint8Array(out); }
    let i = 0; if (fl & 0x40) i += v === 4 ? sync(tag, 0) : u32(tag, 0) + 4;
    const largoId = v === 2 ? 3 : 4, cab = v === 2 ? 6 : 10;
    while (i + cab < tag.length && !img) {
      const id = txt(tag, i, largoId); const tam = v === 2 ? (tag[i + 3] << 16) | (tag[i + 4] << 8) | tag[i + 5] : v === 4 ? sync(tag, i + 4) : u32(tag, i + 4);
      if (!/^[A-Z0-9]{3,4}$/.test(id) || tam <= 0 || i + cab + tam > tag.length) break;
      if (id === 'APIC' || id === 'PIC') {
        let j = i + cab; const enc = tag[j++];
        if (id === 'PIC') { mime = txt(tag, j, 3).toLowerCase() === 'png' ? 'image/png' : 'image/jpeg'; j += 3; } else { let k = j; while (tag[k]) k++; mime = txt(tag, j, k - j); j = k + 1; }
        j++;
        if (enc === 1 || enc === 2) { while (j < i + cab + tam && !(tag[j] === 0 && tag[j + 1] === 0)) j += 2; j += 2; } else { while (j < i + cab + tam && tag[j]) j++; j++; }
        img = tag.subarray(j, i + cab + tam);
      }
      i += cab + tam;
    }
  }
  if (!img) for (let i = 0; i < buf.length - 24 && !img; i++) if (buf[i] === 0x63 && buf[i + 1] === 0x6F && txt(buf, i, 4) === 'covr' && txt(buf, i + 8, 4) === 'data') { const tam = u32(buf, i + 4) - 8 - 16; mime = u32(buf, i + 12) === 14 ? 'image/png' : 'image/jpeg'; img = buf.subarray(i + 20, i + 20 + tam); }
  if (!img || img.length < 100) return null;
  if (!/^image\//.test(mime)) mime = img[0] === 0x89 ? 'image/png' : 'image/jpeg';
  return reducirImagen(new Blob([img], { type: mime }), 256);
}
/* toma un cuadro del video (al segundo 1) como portada */
function cuadroDeVideo(f) {
  return new Promise((ok, mal) => { const v = document.createElement('video'), url = URL.createObjectURL(f); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    const fin = r => { URL.revokeObjectURL(url); r(); };
    const t = setTimeout(() => fin(() => mal(new Error('tiempo'))), 8000);
    v.addEventListener('loadedmetadata', () => { if (!v.videoWidth) { clearTimeout(t); fin(() => ok(null)); return; } v.currentTime = Math.min(1, (v.duration || 2) / 2); });
    v.addEventListener('seeked', () => { clearTimeout(t); const c = document.createElement('canvas'), lado = 256, m = Math.min(v.videoWidth, v.videoHeight); c.width = c.height = lado; c.getContext('2d').drawImage(v, (v.videoWidth - m) / 2, (v.videoHeight - m) / 2, m, m, 0, 0, lado, lado); const d = c.toDataURL('image/jpeg', 0.85); fin(() => ok(d)); });
    v.addEventListener('error', () => { clearTimeout(t); fin(() => mal(new Error('video'))); }); });
}

/* redes vinculadas: se ven dentro de la app con el reproductor oficial de cada red */
function embedRed(url) {
  const u = String(url || ''); let m = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]{5,40})/.exec(u); if (m) return { red: 'instagram', src: `https://www.instagram.com/${m[2]}/${m[3]}/embed` };
  m = /^https:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._]+\/video\/(\d{8,25})/.exec(u); if (m) return { red: 'tiktok', src: `https://www.tiktok.com/embed/v2/${m[2]}` };
  m = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(u); if (m) return { red: 'youtube', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  return null;
}
VISTAS.redes = {
  titulo: ([n, red]) => `${red === 'tiktok' ? 'TikTok' : red === 'youtube' ? 'YouTube' : 'Instagram'} de @${n || ''}`, nav: 'perfil', get atras() { return '#/perfil/' + (ruta().params[0] || ''); },
  render([n, red]) {
    const u = DB.porUsuario(n), h = u?.redes?.[red]; if (!u || !h || !['instagram', 'tiktok', 'youtube'].includes(red)) return '<p class="vacio">No encontramos esa red.</p>';
    const des = (u.redes.destacadas || []).map(embedRed).filter(e => e && e.red === red), perfil = red === 'instagram' ? `https://www.instagram.com/${encodeURIComponent(h)}/` : red === 'youtube' ? h : `https://www.tiktok.com/@${encodeURIComponent(h)}`;
    return `<div class="pila"><div class="tarjeta entre" style="padding:12px 14px"><span class="fila" style="flex-wrap:nowrap"><span style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--suave);color:var(--moradoTxt)">${icono(red, 22)}</span><span><b>${red === 'youtube' ? esc(h.replace(/^https:\/\/(www\.)?/, '')) : '@' + esc(h)}</b><br><span class="mini gris">Sigues dentro de Cosas de la uni</span></span></span><a class="btn3" style="min-height:40px;padding:0 12px" href="${perfil}" target="_blank" rel="noopener noreferrer">Abrir app</a></div>
      ${des.map(e => `<div class="tarjeta" style="padding:0;overflow:hidden;border:3px solid var(--amarillo)"><iframe title="Publicación de @${esc(h)}" src="${e.src}" loading="lazy" style="width:100%;height:${red === 'tiktok' ? 740 : red === 'youtube' ? 220 : 620}px;border:0;display:block" allow="encrypted-media; fullscreen" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe></div>`).join('')
        || `<p class="vacio">${DB.yo().usuario === u.usuario ? 'Agrega publicaciones destacadas desde Editar perfil para que se vean aquí.' : 'Todavía no tiene publicaciones destacadas.'}</p>`}</div>`;
  }
};

/* ---------- Canciones del perfil ---------- */
function embedMusica(url) {
  const u = String(url || '');
  let m = /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album|episode)\/([A-Za-z0-9]+)/.exec(u); if (m) return { servicio: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, alto: m[1] === 'track' ? 80 : 352 };
  m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/|music\.youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/.exec(u); if (m) return { servicio: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${m[1]}?loop=1&playlist=${m[1]}`, alto: 200 };
  m = /^https:\/\/music\.apple\.com\/(.+)$/.exec(u); if (m) return { servicio: 'Apple Music', src: `https://embed.music.apple.com/${m[1]}`, alto: /[?&]i=/.test(u) ? 175 : 450 };
  return null;
}
function seccionCanciones(u, mio) {
  const lista = DB.canciones(u); if (!lista.length) return '';
  return `<section class="tarjeta" style="background:#1B1530;color:#fff;border:0;display:flex;flex-direction:column;gap:12px"><span class="etiqueta" style="color:var(--amarillo)">${lista.length > 1 ? 'Canciones' : 'Canción'} del perfil</span>
    ${lista.map((c, i) => { const em = !c.archivo && embedMusica(c.enlace), abierto = UI.embedAbierto === u.id + ':' + i;
      return `<div><div class="fila" style="flex-wrap:nowrap">${c.archivo ? vinilo(c) : `<span class="vinilo" style="width:60px;height:60px" aria-hidden="true"><span class="etiqueta-disco" style="background:${em?.servicio === 'Spotify' ? '#1DB954' : em?.servicio === 'YouTube' ? '#FF3B30' : '#FC3C44'}"></span></span>`}
        <span style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.titulo)}</b><span class="mini" style="color:#C9C2DA">${esc(c.artista || (em ? em.servicio : 'Archivo'))}</span></span>
        ${c.archivo ? `<button class="icono-btn" style="background:#FFC93C;color:#1B1530;border-radius:50%;width:48px;height:48px" data-a="playPerfil" data-src="${esc(c.archivo)}" data-u="${u.id}" data-i="${i}" aria-label="Reproducir o pausar ${esc(c.titulo)}" data-repro="${esc(c.archivo)}">${icono(REPRO.sonando(c.archivo) ? 'pausa' : 'play', 20)}</button>`
          : em ? `<button class="icono-btn" style="background:#FFC93C;color:#1B1530;border-radius:50%;width:48px;height:48px" data-a="abrirEmbed" data-k="${u.id}:${i}" aria-label="${abierto ? 'Ocultar' : 'Escuchar'} ${esc(c.titulo)}">${icono(abierto ? 'cerrar' : 'play', 20)}</button>`
          : urlSegura(c.enlace) ? `<a class="icono-btn" style="background:#FFC93C;color:#1B1530;border-radius:50%;width:48px;height:48px" href="${esc(c.enlace)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${esc(c.titulo)}">${icono('play', 20)}</a>` : ''}</div>
        ${abierto && em ? `<iframe title="${esc(c.titulo)} en ${em.servicio}" src="${em.src}" width="100%" height="${em.alto}" style="border:0;border-radius:12px;margin-top:10px" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>` : ''}</div>`; }).join('')}</section>`;
}
ACC.abrirEmbed = b => { UI.embedAbierto = UI.embedAbierto === b.dataset.k ? null : b.dataset.k; refrescar(); };
function listaCancionesEdit() {
  const l = DB.canciones(); if (!l.length) return '<p class="peq gris" style="margin:0">Todavía no tienes canciones.</p>';
  return l.map((c, i) => `<div class="fila" style="flex-wrap:nowrap;padding:6px 0;border-bottom:1px solid var(--linea)">${c.archivo ? vinilo(c).replace('class="vinilo', 'style="width:40px;height:40px" class="vinilo') : `<span class="pastilla" style="display:grid;place-items:center;min-width:40px;padding:0">${icono('musica', 16)}</span>`}
    <label class="oculto" for="cn${i}">Nombre de la canción ${i + 1}</label><input id="cn${i}" style="flex:1;min-width:0" value="${esc(c.titulo)}" maxlength="60" data-cambio="tituloCancion" data-i="${i}">
    ${i ? `<button type="button" class="icono-btn" data-a="subirCancion" data-i="${i}" aria-label="Poner primero">${icono('atras', 18, 'style="transform:rotate(90deg)"')}</button>` : ''}<button type="button" class="icono-btn" style="color:var(--malTxt)" data-a="quitarCancion" data-i="${i}" aria-label="Quitar">${icono('basura', 18)}</button></div>`).join('');
}
function pintarListaCanciones() { const el = $('#listaCanciones'); if (el) el.innerHTML = listaCancionesEdit(); }
CAMBIOS.tituloCancion = el => { const l = DB.canciones(), c = l[+el.dataset.i]; if (!c) return; c.titulo = el.value.trim().slice(0, 60) || c.titulo; DB.guardarCanciones(l); };
ACC.quitarCancion = b => { const l = DB.canciones(); const c = l.splice(+b.dataset.i, 1)[0]; if (REPRO.src && REPRO.src === c?.archivo) REPRO.parar(); DB.guardarCanciones(l); pintarListaCanciones(); };
ACC.subirCancion = b => { const l = DB.canciones(), i = +b.dataset.i; l.unshift(l.splice(i, 1)[0]); DB.guardarCanciones(l); pintarListaCanciones(); };
ACC.cancionEnlace = () => abrirHoja(`<form class="pila" data-form="cancionEnlace"><h2>Agregar canción por enlace</h2><div><label class="campo" for="ce">Enlace</label><input id="ce" name="enlace" type="url" required placeholder="https://open.spotify.com/track/… · youtube.com/watch?v=… · music.apple.com/…"></div><div><label class="campo" for="cet">Nombre</label><input id="cet" name="titulo" maxlength="60" placeholder="Opcional"></div><div><label class="campo" for="cea">Artista</label><input id="cea" name="artista" maxlength="60" placeholder="Opcional"></div><button class="btn ancho">Agregar</button></form>`);
FORMS.cancionEnlace = d => { const url = urlSegura(d.enlace.trim()); if (!url) return aviso('Ese enlace no es válido.'); const l = DB.canciones(); if (l.length >= 8) return aviso('Máximo 8 canciones.'); const em = embedMusica(url);
  l.push({ titulo: d.titulo.trim() || (em ? 'Canción de ' + em.servicio : 'Mi canción'), artista: d.artista.trim(), enlace: url, archivo: '', portada: null }); DB.guardarCanciones(l); cerrarHoja(); pintarListaCanciones(); aviso(em ? `Agregada. Se escucha con el reproductor de ${em.servicio}.` : 'Agregada como enlace.'); };
