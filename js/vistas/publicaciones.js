'use strict';
const VIS_POST = [['todos', 'Todos', 'mundo'], ['carrera', 'Mi carrera', 'profe'], ['amigos', 'Amigos', 'grupo']];
DB.puedeVerPost = function (p, yo = DB.yo()) {
  if (!p || p.autor === yo.id || DB.esAdmin()) return true;
  if (p.vis === 'amigos') return DB.sonAmigos(p.autor, yo.id);
  if (p.vis === 'carrera') return String(yo.carrera || '').toLowerCase().trim() === String(p.carrera || '').toLowerCase().trim();
  return true;
};
const _feedViejo = DB.feed.bind(DB);
DB.feed = function () { return _feedViejo().filter(p => DB.puedeVerPost(p)); };
const menciones = t => [...new Set([...String(t || '').matchAll(/(^|[^\w.])@([a-z0-9._]{3,20})/gi)].map(m => m[2].toLowerCase().replace(/\.$/, '')))].map(n => DB.porUsuario(n)).filter(Boolean);
function avisarMenciones(t, link, que, post, quien = DB.yo()) { menciones(t).forEach(u => { if (u.id !== quien.id && (!post || DB.puedeVerPost(post, u))) notificar(u.id, `@${quien.usuario} te mencionó en ${que}`, link); }); }
function textoConMenciones(t) { return esc(t).replace(/(^|[^\w.])@([a-z0-9._]{3,20})/gi, (m, a, n) => { const u = DB.porUsuario(n.replace(/\.$/, '')); return u ? `${a}<a class="mencion" href="#/perfil/${esc(u.usuario)}">@${esc(u.usuario)}</a>${n.endsWith('.') ? '.' : ''}` : m; }); }
DB.publicar = function (texto, extra = {}) {
  texto = String(texto || '').trim().slice(0, 1000); const fotos = (extra.fotos || []).slice(0, 4); if (!texto && !fotos.length) return null;
  const yo = DB.yo(), p = { id: uid('post'), autor: yo.id, texto, fecha: new Date().toISOString(), likes: [], comentarios: [], fotos, vis: extra.vis || 'todos', carrera: yo.carrera || '' };
  DB.estado.posts.push(p); avisarMenciones(texto, '#/post/' + p.id, 'una publicación', p); DB.guardar(); return p;
};
const _comentarViejo = DB.comentar.bind(DB);
DB.comentar = function (id, texto) { _comentarViejo(id, texto); avisarMenciones(texto, '#/post/' + id, 'un comentario', DB.estado.posts.find(x => x.id === id)); DB.guardar(); };

UI.nuevoPost = { fotos: [], vis: 'todos' };
function compositorPost() {
  const N = UI.nuevoPost;
  abrirHoja(`<form class="pila" data-form="publicarPost" style="gap:10px"><h2>Nueva publicación</h2>
    <label class="oculto" for="npTxt">Texto</label><textarea id="npTxt" name="texto" maxlength="1000" placeholder="¿Qué está pasando? Usa @ para mencionar a alguien" style="min-height:110px" data-entrada="npTexto">${esc(N.texto || '')}</textarea><div id="npSug"></div>
    <div id="npFotos" class="np-fotos">${fotosCompositor()}</div>
    <div class="entre" style="gap:8px;flex-wrap:wrap"><label class="btn3" style="cursor:pointer;min-height:40px">${icono('camara', 18)}Fotos <span class="mini gris">(hasta 4)</span><input type="file" accept="image/*" multiple class="oculto" data-cambio="npFotos"></label>
      <div class="pestanas" role="group" aria-label="Quién lo ve">${VIS_POST.map(([k, n, ic]) => `<button type="button" class="pastilla${N.vis === k ? ' on' : ''}" data-a="npVis" data-v="${k}">${icono(ic, 14)} ${n}</button>`).join('')}</div></div>
    <button class="btn ancho">Publicar</button></form>`);
  setTimeout(() => $('#npTxt')?.focus(), 80);
}
function fotosCompositor() { return UI.nuevoPost.fotos.map((f, i) => `<div class="np-foto"><img src="${f.url}" alt=""><button type="button" class="icono-btn" data-a="npQuitarFoto" data-i="${i}" aria-label="Quitar foto">${icono('cerrar', 16)}</button></div>`).join(''); }
ACC.nuevoPost = () => compositorPost();
ACC.npVis = b => { UI.nuevoPost.vis = b.dataset.v; $$('[data-a=npVis]').forEach(x => x.classList.toggle('on', x === b)); };
ACC.npQuitarFoto = b => { const f = UI.nuevoPost.fotos.splice(+b.dataset.i, 1)[0]; if (f) URL.revokeObjectURL(f.url); $('#npFotos').innerHTML = fotosCompositor(); };
CAMBIOS.npFotos = async el => {
  const fs = [...el.files].filter(f => /^image\//.test(f.type)); el.value = ''; const N = UI.nuevoPost;
  for (const f of fs.slice(0, 4 - N.fotos.length)) { try { const b = await reducirFoto(f, 1600), dim = await new Promise(ok => { const im = new Image(), u = URL.createObjectURL(b); im.onload = () => ok({ w: im.naturalWidth, h: im.naturalHeight, url: u }); im.onerror = () => ok({ w: 0, h: 0, url: u }); im.src = u; }); N.fotos.push({ blob: b, ...dim }); } catch { aviso('No se pudo leer ' + f.name); } }
  if (fs.length > 4) aviso('Máximo 4 fotos.'); const c = $('#npFotos'); if (c) c.innerHTML = fotosCompositor();
};
ENTRADAS.npTexto = el => { UI.nuevoPost.texto = el.value; const m = el.value.slice(0, el.selectionStart).match(/@([a-z0-9._]{1,20})$/i), s = $('#npSug'); if (!s) return;
  if (!m) { s.innerHTML = ''; return; } const q = m[1].toLowerCase(), l = Object.values(DB.estado.usuarios).filter(u => !u.suspendido && u.id !== 'u_equipo' && u.usuario.startsWith(q)).slice(0, 5);
  s.innerHTML = l.length ? `<div class="fila" style="gap:6px">${l.map(u => `<button type="button" class="pastilla" data-a="npMencion" data-u="${esc(u.usuario)}">@${esc(u.usuario)}</button>`).join('')}</div>` : ''; };
ACC.npMencion = b => { const t = $('#npTxt'), pos = t.selectionStart, antes = t.value.slice(0, pos).replace(/@([a-z0-9._]{0,20})$/i, '@' + b.dataset.u + ' '); t.value = antes + t.value.slice(pos); UI.nuevoPost.texto = t.value; t.focus(); t.setSelectionRange(antes.length, antes.length); $('#npSug').innerHTML = ''; };
FORMS.publicarPost = async (d, f) => {
  const N = UI.nuevoPost, texto = String(d.texto || '').trim(); if (!texto && !N.fotos.length) return aviso('Escribe algo o agrega una foto.');
  const b = f.querySelector('button.btn.ancho'); b.disabled = true; b.textContent = N.fotos.length ? 'Subiendo fotos…' : 'Publicando…';
  const fotos = [];
  for (const x of N.fotos) { try { const clave = 'post_' + uid('f'); await ARCHIVOS.guardar(clave, x.blob); fotos.push({ clave, w: x.w, h: x.h }); } catch {} }
  const p = DB.publicar(texto, { fotos, vis: N.vis }); N.fotos.forEach(x => URL.revokeObjectURL(x.url)); UI.nuevoPost = { fotos: [], vis: N.vis };
  cerrarHoja(); if (p) aviso(N.vis === 'todos' ? 'Publicado' : N.vis === 'carrera' ? 'Publicado para tu carrera' : 'Publicado para tus amigos'); refrescar(); };
function fotosPost(p) {
  const l = p.fotos || []; if (!l.length) return '';
  return `<div class="post-fotos n${l.length}">${l.map((f, i) => `<button class="adj-foto" data-a="abrirAdjunto" data-c="${esc(f.clave)}" data-n="Foto ${i + 1}" data-img="1" aria-label="Ver foto ${i + 1}" style="${l.length === 1 && f.w ? `aspect-ratio:${f.w}/${f.h}` : ''}"><img alt="" data-idb="${esc(f.clave)}"></button>`).join('')}</div>`;
}
VISTAS.post = {
  titulo: 'Publicación', nav: 'inicio', atras: '#/inicio',
  render([id]) { const p = DB.estado.posts.find(x => x.id === id); if (!p || p.oculto || !DB.puedeVerPost(p)) return '<p class="vacio">Esta publicación ya no está disponible.</p>'; UI.comentarios[p.id] = true; return `<div class="pila">${tarjetaPost(p)}</div>`; },
  montar() { cargarArchivosTablon(); }
};
