/* Perfil, editar perfil, ajustes, verificación, notificaciones y ramitas */
'use strict';
const SERVICIOS = [[/spotify\.com/, 'Spotify', 'i-verde'], [/music\.apple\.com/, 'Apple Music', 'i-rojo'], [/music\.youtube\.com|youtube\.com|youtu\.be/, 'YouTube Music', 'i-rojo'], [/soundcloud\.com/, 'SoundCloud', 'i-naranja'], [/deezer\.com/, 'Deezer', 'i-morado']];
const servicioDe = url => SERVICIOS.find(([r]) => r.test(url)) || [null, 'Enlace', 'i-azul'];
const urlSegura = u => /^https:\/\/[^\s"'<>]+$/i.test(u || '') ? u : null;
const embedSpotify = u => { const m = /open\.spotify\.com\/(track|playlist|album)\/([A-Za-z0-9]+)/.exec(u || ''); return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null; };
let audioPerfil = null;

VISTAS.perfil = {
  titulo: ([n]) => n ? '@' + n : 'Mi perfil', nav: 'perfil',
  render([n]) {
    const yo = DB.yo(), u = n ? DB.porUsuario(n) : yo;
    if (!u) return '<p class="vacio">No encontramos ese perfil.</p>';
    const mio = u.id === yo.id;
    if (!DB.verPerfil(u.id)) return `<div class="tarjeta" style="text-align:center">${avatar(u.id, true)}<h2 style="margin-top:10px">@${esc(u.usuario)}</h2><p class="gris">Este perfil es privado.</p></div>`;
    const [rango, grad] = rangoReputacion(u.reputacion), amigo = DB.sonAmigos(u.id, yo.id) && !mio;
    const ins = u.insignias.filter(i => !u.ocultas.includes(i));
    const sp = u.cancion?.enlace && embedSpotify(u.cancion.enlace);
    const stats = [[E_aportes(u), 'Aportes'], [u.amigos.length, 'Amigos'], [u.racha.dias || 0, 'Racha']];
    return `<div class="pila">
      <section class="tarjeta" style="text-align:center;padding:0;overflow:hidden">
        <div style="height:84px;background:var(--g-banda);position:relative">${mio ? `<a class="icono-btn" href="#/ajustes" aria-label="Ajustes" style="position:absolute;right:6px;top:6px;color:#fff">${icono('ajustes')}</a>` : ''}</div>
        <div style="margin-top:-50px"><span class="marco" style="background:${grad}">${avatar(u.id, true)}</span></div>
        <div style="padding:8px 16px 18px"><h2 style="font-size:22px">@${esc(u.usuario)}</h2><p class="peq gris" style="margin:4px 0 0">${esc(subNombre(u.id))}</p>
          ${u.bio ? `<p style="margin:10px 0 0">${esc(u.bio)}</p>` : ''}
          <span class="insignia i-morado" style="margin-top:10px">Reputación ${rango} · ${u.reputacion} pts</span>
          <div class="fila" style="justify-content:center;margin-top:12px">${mio ? '<a class="btn3" href="#/editar-perfil">Editar perfil</a>' : `<button class="${amigo ? 'btn3' : 'btn2'}" data-a="amigo" data-u="${u.id}">${amigo ? 'Amigos' : 'Agregar amigo'}</button>${DB.puedeEscribir(u.id) ? `<button class="btn3" data-a="escribirA" data-u="${u.id}">Escribir</button>` : ''}<button class="icono-btn" data-a="menuPerfil" data-u="${u.id}" aria-label="Más opciones">${icono('puntos')}</button>`}</div></div></section>
      ${ins.length ? `<div class="fila">${ins.map(i => `<span class="insignia ${INSIGNIAS[i].clase}">${INSIGNIAS[i].texto}</span>`).join('')}</div>` : ''}
      ${u.cancion ? `<section class="tarjeta" style="background:#1B1530;color:#fff;border:0"><div class="fila" style="flex-wrap:nowrap"><span style="width:52px;height:52px;border-radius:12px;background:var(--g-marca);display:grid;place-items:center;flex:none;color:var(--amarillo)">${icono('musica', 24)}</span>
        <span style="flex:1"><span class="etiqueta" style="color:var(--amarillo)">Canción del perfil</span><br><b>${esc(u.cancion.titulo)}</b><br><span class="mini" style="color:#C9C2DA">${esc(u.cancion.artista || '')}</span></span>
        ${u.cancion.archivo ? `<button class="icono-btn" style="background:var(--g-accion);color:#1B1530;border-radius:50%;width:48px;height:48px" data-a="playPerfil" data-src="${esc(u.cancion.archivo)}" aria-label="Reproducir canción">${icono('play', 20)}</button>` : ''}</div>
        ${sp ? `<iframe title="Reproductor de Spotify" src="${sp}" width="100%" height="80" style="border:0;border-radius:12px;margin-top:10px" allow="encrypted-media"></iframe>` : u.cancion.enlace && urlSegura(u.cancion.enlace) ? `<a class="btn3" style="margin-top:10px" href="${esc(u.cancion.enlace)}" target="_blank" rel="noopener">Escuchar</a>` : ''}</section>` : ''}
      ${u.playlists.length ? `<section class="tarjeta"><h2 style="margin-bottom:8px">${mio ? 'Mis playlists' : 'Sus playlists'}</h2>${u.playlists.map(p => { const [, s, c] = servicioDe(p.url); const href = urlSegura(p.url); return `<a ${href ? `href="${esc(href)}" target="_blank" rel="noopener"` : ''} class="fila" style="flex-wrap:nowrap;padding:8px 0;border-bottom:1px solid var(--linea);text-decoration:none;color:inherit"><span style="width:40px;height:40px;border-radius:10px;background:var(--g-marca);flex:none"></span><b class="peq" style="flex:1">${esc(p.nombre)}</b><span class="insignia ${c}">${s}</span></a>`; }).join('')}</section>` : ''}
      <div class="rejilla3">${stats.map(([v, t]) => `<div class="tarjeta" style="text-align:center;padding:12px 6px"><b style="font-family:Sora,sans-serif;font-size:22px">${v}</b><br><span class="mini gris">${t}</span></div>`).join('')}</div>
      ${mio ? `<a href="#/ramitas" class="tarjeta entre" style="text-decoration:none;color:inherit"><span><h2>Tus ramitas</h2><span class="mini gris">Ver movimientos</span></span><b style="font-family:Sora,sans-serif;font-size:28px;color:var(--moradoTxt)">${numero(DB.saldo())}</b></a>
        ${yo.verificado !== 'si' ? `<a href="#/verificar" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit;border:2px solid var(--azul)">${icono('ok', 22, 'style="color:var(--azulTxt)"')}<span><b>${yo.verificado === 'pendiente' ? 'Revisando tu documento' : 'Verifica que eres estudiante'}</b><br><span class="mini gris">Para votar, opinar y usar predicciones</span></span></a>` : ''}` : ''}
      <p class="mini gris" style="text-align:center">Proyecto independiente, creado por y para estudiantes. No afiliado ni administrado por la universidad.</p></div>`;
  },
  montar([n]) {
    const u = n ? DB.porUsuario(n) : DB.yo();
    if (u && u.id !== DB.yo().id && u.cancion?.archivo && DB.yo().ajustes.musicaAuto) reproducir(u.cancion.archivo, true);
  }
};
function E_aportes(u) { return DB.estado.posts.filter(p => p.autor === u.id).length + DB.estado.propuestas.filter(p => p.autor === u.id).length + DB.estado.rankings.filter(r => r.autor === u.id).length; }
function reproducir(src, auto) {
  if (audioPerfil && !audioPerfil.paused && audioPerfil.dataset.src === src) { audioPerfil.pause(); return; }
  audioPerfil?.pause(); audioPerfil = new Audio(src); audioPerfil.dataset.src = src;
  audioPerfil.addEventListener('timeupdate', () => { if (audioPerfil.currentTime > 30) audioPerfil.pause(); });
  audioPerfil.play().catch(() => { if (!auto) aviso('No se pudo reproducir la canción'); });
}
window.addEventListener('hashchange', () => audioPerfil?.pause());
ACC.playPerfil = b => reproducir(b.dataset.src);
ACC.amigo = b => { DB.alternarAmigo(b.dataset.u); refrescar(); };
ACC.menuPerfil = b => abrirHoja(`<div class="pila" style="gap:8px">${DB.esAdmin() ? `<button class="btn-peligro ancho" data-a="suspender" data-u="${b.dataset.u}">${DB.usuario(b.dataset.u).suspendido ? 'Reactivar cuenta' : 'Suspender cuenta (admin)'}</button>` : ''}<button class="btn3 ancho" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="usuario" data-ref="${b.dataset.u}" data-quien="${b.dataset.u}">${icono('bandera', 18)}Reportar perfil</button><button class="btn3 ancho" data-a="bloquear" data-u="${b.dataset.u}">${icono('bloquear', 18)}Bloquear</button><button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);

/* ---------- Editar perfil (los cambios se marcan en amarillo) ---------- */
VISTAS['editar-perfil'] = {
  titulo: 'Editar perfil', nav: 'perfil', atras: '#/perfil',
  render() {
    const u = DB.yo(), bloque = (t, contenido, extra = '') => `<section class="tarjeta campo-edit" ${extra}><div class="entre" style="margin-bottom:8px"><b>${t}</b><span class="insignia cambiado-tag" style="background:var(--g-accion);color:#1B1530;display:none">Cambiado</span></div>${contenido}</section>`;
    return `<form class="pila" data-form="guardarPerfil" id="formPerfil">
      <div style="text-align:center"><span class="marco" style="background:${rangoReputacion(u.reputacion)[1]}">${avatar(u.id, true)}</span><p class="mini gris">El marco ${rangoReputacion(u.reputacion)[0]} se gana con reputación</p></div>
      ${bloque('Nombre de usuario', `<label class="oculto" for="eu">Nombre de usuario</label><input id="eu" name="usuario" required pattern="[a-zA-Z0-9._]{3,20}" value="${esc(u.usuario)}" data-orig="${esc(u.usuario)}">`)}
      ${bloque('Nombre real', `<label class="oculto" for="en">Nombre real</label><input id="en" name="nombre" required value="${esc(u.nombre)}" data-orig="${esc(u.nombre)}"><label class="campo" for="ev" style="margin-top:10px">Lo ven</label><select id="ev" name="nombreVis" data-orig="${u.nombreVis}">${[['todos', 'Todos'], ['amigos', 'Amigos'], ['elegidos', 'Quien yo elija'], ['yo', 'Solo yo']].map(([k, t]) => `<option value="${k}" ${u.nombreVis === k ? 'selected' : ''}>${t}</option>`).join('')}</select><label class="campo" for="ee" style="margin-top:10px">Si eliges "Quien yo elija"</label><input id="ee" name="nombreElegidos" placeholder="@vale.a, @pedro.g" value="${esc((u.nombreElegidos || []).map(i => '@' + DB.usuario(i)?.usuario).join(', '))}" data-orig="${esc((u.nombreElegidos || []).map(i => '@' + DB.usuario(i)?.usuario).join(', '))}">`)}
      ${bloque('Sobre mí', `<label class="oculto" for="eb">Sobre mí</label><textarea id="eb" name="bio" maxlength="160" data-orig="${esc(u.bio)}">${esc(u.bio)}</textarea>`)}
      ${bloque('Carrera y generación', `<p style="margin:0">${esc(u.carrera)}${u.gen ? ' · Gen ' + u.gen : ''}</p><p class="mini gris" style="margin:4px 0 0">Se cambia desde Ajustes o subiendo tu horario.</p>`)}
      ${bloque('Canción del perfil', `<label class="campo" for="ct">Título</label><input id="ct" name="cTitulo" maxlength="60" value="${esc(u.cancion?.titulo || '')}" data-orig="${esc(u.cancion?.titulo || '')}"><label class="campo" for="ca" style="margin-top:8px">Artista</label><input id="ca" name="cArtista" maxlength="60" value="${esc(u.cancion?.artista || '')}" data-orig="${esc(u.cancion?.artista || '')}"><label class="campo" for="cl" style="margin-top:8px">Enlace de Spotify, Apple Music o YouTube</label><input id="cl" name="cEnlace" type="url" placeholder="https://open.spotify.com/track/…" value="${esc(u.cancion?.enlace || '')}" data-orig="${esc(u.cancion?.enlace || '')}"><p class="mini gris">Con un enlace de canción de Spotify aparece su reproductor en tu perfil.</p>`)}
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
  const cancion = d.cTitulo.trim() ? { titulo: d.cTitulo.trim(), artista: d.cArtista.trim(), enlace: urlSegura(d.cEnlace.trim()) || '', archivo: u.cancion?.archivo || '' } : null;
  DB.actualizarPerfil({ usuario: nuevo, nombre: d.nombre.trim(), nombreVis: d.nombreVis, nombreElegidos: (d.nombreElegidos || '').split(/[,\s]+/).map(x => DB.porUsuario(x)?.id).filter(Boolean), bio: d.bio.trim(), cancion, playlists, ocultas: u.insignias.filter(i => !d['ins_' + i]) });
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
        <form data-form="ajusteCarrera" class="pila" style="gap:8px"><div class="rejilla2"><div><label class="campo" for="ac">Carrera</label><select id="ac" name="carrera">${CARRERAS.map(c => `<option ${u.carrera === c.nombre ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div><div><label class="campo" for="as">Semestre <span class="mini gris">(opcional)</span></label><select id="as" name="semestre"><option value="">—</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => `<option ${u.semestre == s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div><button class="btn3">Guardar</button></form>
        <div class="entre" style="margin-top:10px"><span>Verificación</span>${u.verificado === 'si' ? '<b style="color:var(--okTxt)">Verificado</b>' : `<a href="#/verificar">${u.verificado === 'pendiente' ? 'En revisión' : 'Verificarme'}</a>`}</div></section>
      <section class="tarjeta"><h2>Mi horario</h2><p class="mini gris" style="margin:2px 0 10px">Con tu horario te avisamos de exámenes y tus retos salen de tus materias.</p>
        ${u.horario.map((h, i) => `<div class="entre" style="padding:8px 10px;border-radius:12px;background:var(--suave);margin-bottom:6px"><span><b class="peq">${esc(h.materia)}</b><br><span class="mini gris">${esc(h.dias)} · ${esc(h.hora)} · ${esc(h.salon)}</span></span><button class="icono-btn" data-a="quitarClase" data-i="${i}" aria-label="Quitar ${esc(h.materia)}">${icono('cerrar', 18)}</button></div>`).join('') || '<p class="peq gris">Aún no cargas tu horario.</p>'}
        <form data-form="agregarClase" class="pila" style="gap:6px;margin-top:8px"><div class="rejilla2"><label class="oculto" for="hm">Materia</label><input id="hm" name="materia" required placeholder="Materia"><label class="oculto" for="hd">Días</label><input id="hd" name="dias" required placeholder="Lun y Mié"></div><div class="rejilla2"><label class="oculto" for="hh">Hora</label><input id="hh" name="hora" type="time" required><label class="oculto" for="hs">Salón</label><input id="hs" name="salon" placeholder="Salón"></div><div class="rejilla2"><button class="btn3">Agregar a mano</button><label class="btn3" style="cursor:pointer">Subir foto<input type="file" accept="image/*,.pdf" class="oculto" data-cambio="subirHorario"></label></div></form></section>
      <section class="tarjeta"><h2>Privacidad</h2>${seg('escribir', 'Quién puede escribirme', [['todos', 'Todos'], ['amigos', 'Amigos'], ['nadie', 'Nadie']])}${seg('perfil', 'Quién ve mi perfil', [['todos', 'Todos'], ['amigos', 'Amigos'], ['nadie', 'Solo yo']])}${seg('venta', 'Mi compraventa por defecto', [['todos', 'Todos'], ['amigos', 'Amigos'], ['elegidos', 'Elegidos']])}</section>
      <section class="tarjeta"><h2>Música y apariencia</h2>${sw('musicaAuto', 'Reproducir música al abrir perfiles')}${sw('oscuro', 'Modo oscuro')}</section>
      <section class="tarjeta"><h2 style="margin-bottom:8px">Personas bloqueadas</h2>${u.bloqueados.map(i => `<div class="entre" style="padding:6px 0"><span>${esc(nombreVisible(i))}</span><button class="btn3" data-a="desbloquear" data-u="${i}">Desbloquear</button></div>`).join('') || '<p class="peq gris" style="margin:0">Nadie.</p>'}</section>
      <section class="tarjeta pila" style="gap:8px">${DB.esAdmin() ? '<a class="btn2" href="#/admin">Panel de administración</a>' : ''}${(CONFIG.cuentasEquipo || []).some(c => c.id === DB.yo().id) ? '<button class="btn2" data-a="cambiarCuenta">Cambiar de cuenta (equipo)</button>' : ''}<button class="btn3" data-a="cerrarSesion">Cerrar sesión</button><button class="btn-peligro" data-a="reiniciarDatos">Borrar datos de prueba de este navegador</button></section></div>`;
  }
};
ACC.privacidad = b => { DB.yo().privacidad[b.dataset.k] = b.dataset.v; if (b.dataset.k === 'venta') UI.cvVis = b.dataset.v; DB.guardar(); refrescar(); };
ACC.interruptor = b => { const a = DB.yo().ajustes; a[b.dataset.k] = !a[b.dataset.k]; DB.guardar(); DB.alEntrar(); refrescar(); };
ACC.desbloquear = b => { DB.desbloquear(b.dataset.u); refrescar(); };
ACC.quitarClase = b => { DB.yo().horario.splice(+b.dataset.i, 1); DB.guardar(); refrescar(); };
FORMS.agregarClase = d => { DB.yo().horario.push({ materia: d.materia.trim(), dias: d.dias.trim(), hora: d.hora, salon: d.salon.trim() }); DB.guardar(); refrescar(); };
FORMS.ajusteCarrera = d => { DB.actualizarPerfil({ carrera: d.carrera, semestre: d.semestre ? Number(d.semestre) : null }); aviso('Guardado'); };
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
      ${[['correo', 'Correo institucional', 'Recomendado · listo en 1 minuto'], ['credencial', 'Credencial o tira de materias', 'Lo revisa el equipo · hasta 24 h']].map(([k, t, d]) => `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left;box-shadow:none;border:2px solid ${V.metodo === k ? 'var(--morado)' : 'var(--linea)'}" data-a="metodoVerif" data-m="${k}" aria-pressed="${V.metodo === k}"><span style="width:20px;height:20px;border-radius:50%;border:2px solid var(--morado);display:grid;place-items:center;flex:none"><span style="width:10px;height:10px;border-radius:50%;background:${V.metodo === k ? 'var(--morado)' : 'transparent'}"></span></span><span><b>${t}</b><br><span class="mini gris">${d}</span></span></button>`).join('')}
      ${V.metodo === 'correo' ? (V.codigo ? `<form class="tarjeta pila" data-form="codigoVerif"><label class="campo" for="vc">Código que te llegó a ${esc(V.correo)}</label><input id="vc" name="c" required inputmode="numeric" pattern="[0-9]{6}" placeholder="6 dígitos" style="letter-spacing:.3em;font-size:20px"><button class="btn2 ancho">Verificar</button><button type="button" class="btn3" data-a="otroCorreo">Usar otro correo</button></form>`
        : `<form class="tarjeta pila" data-form="correoVerif"><label class="campo" for="vco">Tu correo de la universidad</label><input id="vco" name="correo" type="email" required placeholder="matricula@uni.edu.mx"><button class="btn2 ancho">Enviar código</button></form>`)
        : `<label class="tarjeta" style="border:2px dashed var(--linea);display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;cursor:pointer;text-align:center">${icono('camara', 30)}<b style="color:var(--moradoTxt)">Tomar o subir foto de tu credencial</b><span class="mini gris">Tapa tu foto y tu CURP si quieres; solo necesitamos nombre, matrícula y vigencia. Se borra al revisarla.</span><input type="file" accept="image/*,.pdf" class="oculto" data-cambio="credencial"></label>`}
      <section class="tarjeta"><h2 style="margin-bottom:6px">Qué se desbloquea</h2>${['Opinar y calificar profesores', 'Votar en rankings y encuestas', 'Predicciones con ramitas'].map(t => `<p class="fila peq" style="margin:6px 0">${icono('ok', 18, 'style="color:var(--okTxt)"')}${t}</p>`).join('')}<p class="mini gris" style="margin:6px 0 0">Sin verificar puedes ver, publicar y jugar.</p></section></div>`;
  }
};
ACC.metodoVerif = b => { UI.verif.metodo = b.dataset.m; refrescar(); };
ACC.otroCorreo = () => { UI.verif.codigo = null; refrescar(); };
FORMS.correoVerif = d => { UI.verif.correo = d.correo; UI.verif.codigo = String(Math.floor(100000 + Math.random() * 900000)); aviso('Versión de prueba: tu código es ' + UI.verif.codigo + '. En la real llega por correo.'); refrescar(); };
FORMS.codigoVerif = d => { if (d.c !== UI.verif.codigo) return aviso('Ese código no coincide'); DB.verificarCorreo(UI.verif.correo); UI.verif.codigo = null; aviso('¡Listo, ya estás verificado!'); refrescar(); };
CAMBIOS.credencial = el => { if (el.files[0]) { DB.enviarCredencial(el.files[0].name); aviso('Recibido. Te avisamos cuando lo revisemos.'); refrescar(); } };

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
const NOMBRE_MOV = { regalo: 'Regalo', diario: 'Regalo del día', reto: 'Reto académico', juego: 'Juego diario', racha: 'Premio de racha', apuesta: 'Predicción', ganancia: 'Acertaste una predicción', devolucion: 'Devolución', premio: 'Premio', casino: 'Ruleta y tragamonedas' };
VISTAS.ramitas = {
  titulo: 'Tus ramitas', nav: 'perfil', atras: '#/perfil',
  render() {
    const movs = DB.movimientos(DB.yo().id).slice(0, 60);
    return `<div class="pila"><section class="tarjeta" style="text-align:center;background:var(--g-marca);color:#fff;border:0"><span class="etiqueta">Saldo</span><b style="display:block;font-family:Sora,sans-serif;font-size:48px">${numero(DB.saldo())}</b><span class="peq" style="opacity:.9">ramitas · se ganan participando, no se compran ni se cambian por dinero</span></section>
      <section class="tarjeta"><h2 style="margin-bottom:6px">Movimientos</h2>${movs.map(m => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span><span class="peq">${esc(NOMBRE_MOV[m.tipo] || m.tipo)}</span><br><span class="mini gris">${hace(m.f)}</span></span><b style="color:${m.monto >= 0 ? 'var(--okTxt)' : 'var(--malTxt)'}">${m.monto >= 0 ? '+' : MENOS}${Math.abs(m.monto)}</b></div>`).join('')}</section></div>`;
  }
};

ACC.suspender = b => { const u = DB.usuario(b.dataset.u); DB.suspender(u.id, !u.suspendido); cerrarHoja(); aviso(u.suspendido ? 'Cuenta suspendida: ya no puede entrar y sus publicaciones se ocultan' : 'Cuenta reactivada'); refrescar(); };

ACC.cambiarCuenta = () => FORMS.entrarAdmin({ clave: CONFIG.claveAdmin });
