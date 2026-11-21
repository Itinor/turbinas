/* Inicio: recordatorio más cercano, publicar, accesos rápidos y lo que se comenta */
'use strict';
UI.comentarios = {};
VISTAS.inicio = {
  titulo: 'Cosas de la uni', nav: 'inicio',
  render() {
    const yo = DB.yo(), prox = DB.miAgenda().filter(a => !(a.hechoPor || {})[yo.id] && diasHasta(a.fecha) >= 0)[0];
    const pred = DB.estado.propuestas.find(p => p.tipo === 'prediccion' && p.estado === 'abierta');
    const recordatorio = prox ? `<a href="#/agenda" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:inherit;background:var(--avisoBg);border-color:transparent">
      <span style="width:52px;height:52px;border-radius:14px;background:var(--g-accion);color:#1B1530;display:grid;place-items:center;text-align:center;flex:none;line-height:1"><b style="font-size:20px">${diasHasta(prox.fecha)}</b><span class="mini" style="font-weight:700">${diasHasta(prox.fecha) === 1 ? 'día' : 'días'}</span></span>
      <span style="flex:1"><b>${esc(prox.titulo)}</b><br><span class="peq" style="color:var(--avisoTxt)">${fechaBonita(prox.fecha)}${prox.hora ? ' · ' + esc(prox.hora) : ''}${prox.lugar ? ' · ' + esc(prox.lugar) : ''}</span></span>
      <span class="peq" style="font-weight:800;color:var(--avisoTxt)">Agenda</span></a>` : '';
    const accesos = [['profe', 'Profesores', '#/explorar/profesores', '#4B1F7A'], ['mapa', 'Mapa', '#/explorar/mapa', '#1D5FD1'], ['agenda', 'Eventos', '#/explorar/eventos', '#B45309'], ['tienda', 'Compraventa', '#/compraventa', '#4B1F7A']];
    return `<div class="pila">
      ${recordatorio}
      <form class="tarjeta pila" data-form="publicar" style="gap:10px">
        <label class="campo" for="nuevoPost" style="font-family:Sora,sans-serif;font-size:17px;margin:0">¿Qué está pasando?</label>
        <textarea id="nuevoPost" name="texto" maxlength="1000" placeholder="Comparte algo con tu comunidad…" style="min-height:70px"></textarea>
        <div class="fila"><button class="btn">Publicar</button><a class="btn3" href="#/propuestas/nueva">Propuesta</a><a class="btn3" href="#/rankings/nuevo">Ranking</a></div>
      </form>
      <div class="rejilla4">${accesos.map(([i, t, h, c]) => `<a href="${h}" class="tarjeta" style="padding:12px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;color:inherit;font-size:12px;font-weight:700">${icono(i, 22, `style="color:${c}"`)}${t}</a>`).join('')}</div>
      ${pred ? tarjetaPrediccionMini(pred) : ''}
      <a href="#/juegos" class="tarjeta fila" style="flex-wrap:nowrap;text-decoration:none;color:#fff;background:var(--g-marca);border:0">
        <span style="flex:1"><span class="etiqueta">El rincón del castor</span><br><b style="font-family:Sora,sans-serif;font-size:18px">${DB.diarios().trivia ? 'Ya jugaste la trivia de hoy' : 'Trivia del día'}</b><br><span class="peq" style="opacity:.9">${DB.diarios().trivia ? 'Prueba un reto de tu carrera' : 'Acierta 4 de 5 y gana 15 ramitas'}</span></span>
        <span class="btn" style="min-height:42px">Jugar</span></a>
      <div class="seccion"><h2>Lo que se comenta</h2></div>
      ${DB.feed().map(tarjetaPost).join('') || '<p class="vacio">Todavía no hay publicaciones.</p>'}
    </div>`;
  }
};
function tarjetaPrediccionMini(p) {
  const t = DB.pozo(p) || 1, pct = p.opciones.map((_, i) => Math.round(DB.pozoOpcion(p, i) / t * 100));
  return `<a href="#/propuestas" class="tarjeta" style="display:block;text-decoration:none;color:inherit;border:2px solid var(--amarillo)">
    <div class="entre"><span class="etiqueta" style="color:#8A5A00">Predicción abierta</span><span class="mini gris">Cierra ${diasHasta(p.cierre) <= 0 ? 'hoy' : 'en ' + diasHasta(p.cierre) + ' d'}</span></div>
    <b style="display:block;font-family:Sora,sans-serif;margin:6px 0 10px">${esc(p.titulo)}</b>
    <div style="display:flex;height:10px;border-radius:999px;overflow:hidden">${pct.map((v, i) => `<span style="width:${v}%;background:${i % 2 ? '#1D5FD1' : '#4B1F7A'}"></span>`).join('')}</div>
    <div class="entre mini gris" style="margin-top:6px">${p.opciones.map((o, i) => `<span>${esc(o)} ${pct[i]}%</span>`).join('')}</div></a>`;
}
function tarjetaPost(p) {
  const yo = DB.yo(), le = p.likes.includes(yo.id), abiertos = UI.comentarios[p.id];
  const autor = DB.usuario(p.autor), verif = autor?.verificado === 'si';
  return `<article class="tarjeta post">
    <div class="cab">${avatar(p.autor)}<div class="quien"><a href="#/perfil/${esc(autor?.usuario)}" style="color:inherit;text-decoration:none"><b>${esc(nombreVisible(p.autor))}</b></a>${verif ? ' <span class="insignia i-azul" style="padding:2px 7px">Verificado</span>' : ''}<br><span class="mini gris">${esc(autor?.carrera || '')} · ${hace(p.fecha)}</span></div>
      <button class="icono-btn" data-a="menuPost" data-id="${p.id}" aria-label="Más opciones">${icono('puntos')}</button></div>
    <p class="texto">${esc(p.texto)}</p>
    <div class="acciones"><button class="reaccion${le ? ' on' : ''}" data-a="meGusta" data-id="${p.id}" aria-pressed="${le}">Me interesa · ${p.likes.length}</button>
      <button class="reaccion" data-a="verComentarios" data-id="${p.id}" aria-expanded="${!!abiertos}">${p.comentarios.length} comentarios</button></div>
    ${abiertos ? `<div style="margin-top:10px">${p.comentarios.map((c, ci) => `<div class="coment">${avatar(c.autor)}<div style="flex:1"><b class="peq">${esc(nombreVisible(c.autor))}</b> <span class="mini gris">${hace(c.fecha)}</span><br>${esc(c.texto)}</div>${DB.esAdmin() || c.autor === yo.id ? `<button class="icono-btn" style="color:var(--malTxt);width:36px;height:36px" data-a="eliminar" data-tipo="comentario" data-id="${p.id}" data-extra="${ci}" aria-label="Eliminar comentario">${icono('basura', 16)}</button>` : ''}</div>`).join('')}
      <form class="fila" data-form="comentar" style="flex-wrap:nowrap;margin-top:8px"><input type="hidden" name="id" value="${p.id}"><label class="oculto" for="c_${p.id}">Comentario</label><input id="c_${p.id}" name="texto" required maxlength="500" placeholder="Escribe un comentario"><button class="btn2" aria-label="Enviar">${icono('enviar', 18)}</button></form></div>` : ''}
  </article>`;
}
FORMS.publicar = d => { if (!d.texto.trim()) return; DB.publicar(d.texto); aviso('Publicado'); refrescar(); };
FORMS.comentar = d => { DB.comentar(d.id, d.texto); refrescar(); };
ACC.meGusta = b => { DB.meGusta(b.dataset.id); refrescar(); };
ACC.verComentarios = b => { UI.comentarios[b.dataset.id] = !UI.comentarios[b.dataset.id]; refrescar(); };
ACC.menuPost = b => {
  const p = DB.estado.posts.find(x => x.id === b.dataset.id), mio = p.autor === DB.yo().id, n = nombreVisible(p.autor);
  abrirHoja(`<div class="pila" style="gap:8px">${mio || DB.esAdmin() ? `<button class="btn-peligro ancho" data-a="eliminar" data-tipo="post" data-id="${p.id}">${icono('basura', 18)}${mio ? 'Borrar publicación' : 'Eliminar publicación (admin)'}</button>` : ''}
    ${mio ? '' : `<button class="btn3 ancho" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="post" data-ref="${p.id}" data-quien="${p.autor}">${icono('bandera', 18)}Reportar publicación</button>
    <button class="btn3 ancho" data-a="bloquear" data-u="${p.autor}">${icono('bloquear', 18)}Bloquear a ${esc(n)}</button>
    <button class="btn3 ancho" data-a="silenciar" data-u="${p.autor}">${icono('silencio', 18)}Silenciar a ${esc(n)}</button>`}
    <button class="btn3 ancho" data-a="cerrarHoja">Cancelar</button></div>`);
};
ACC.borrarPost = b => { DB.borrarPost(b.dataset.id); cerrarHoja(); aviso('Publicación borrada'); refrescar(); };
ACC.abrirReporte = b => {
  const motivos = ['Acoso o burla hacia alguien', 'Contenido sexual', 'Comparte datos personales de alguien', 'Información falsa', 'Spam o estafa', 'Otra cosa'];
  abrirHoja(`<h2 style="margin-bottom:10px">¿Qué está pasando?</h2><div class="pila" style="gap:8px">${motivos.map(m => `<button class="btn3 ancho" style="justify-content:flex-start" data-a="enviarReporte" data-tipo="${b.dataset.tipo}" data-ref="${b.dataset.ref}" data-quien="${b.dataset.quien || ''}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>`);
};
ACC.enviarReporte = b => { DB.reportar(b.dataset.tipo, b.dataset.ref, b.dataset.m); abrirHoja(`<div class="pila" style="align-items:center;text-align:center"><span style="width:56px;height:56px;border-radius:50%;background:var(--okBg);color:var(--okTxt);display:grid;place-items:center">${icono('ok', 26)}</span><h2>Gracias por avisar</h2><p class="gris" style="margin:0">Lo revisamos. ${b.dataset.quien ? esc(nombreVisible(b.dataset.quien)) + ' no sabrá que fuiste tú.' : ''}</p><button class="btn2 ancho" data-a="cerrarHoja">Listo</button></div>`); };
ACC.bloquear = b => { DB.bloquear(b.dataset.u); cerrarHoja(); aviso('Bloqueaste a ' + nombreVisible(b.dataset.u)); refrescar(); };
ACC.silenciar = b => { DB.silenciar(b.dataset.u); cerrarHoja(); aviso('Ya no verás lo que publica ' + nombreVisible(b.dataset.u)); refrescar(); };
