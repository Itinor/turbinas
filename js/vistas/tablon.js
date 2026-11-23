/* Tablón: trabajos, PDFs, fotos y notas, como un corcho; también en lista ordenada */
'use strict';
UI.tablon = { vista: 'corcho', filtro: 'todo' };
const COLORES_NOTA = { amarillo: '#FFF3A6', rosa: '#FFD6E0', azul: '#DCE8FB', verde: '#DCF5E3' };
const COLOR_CHINCHE = ['#E2453C', '#1D5FD1', '#FFC93C', '#4B1F7A', '#14632F'];
function giro(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return { r: ((h % 13) + 13) % 13 - 6, c: COLOR_CHINCHE[((h >> 3) % 5 + 5) % 5], dx: ((h >> 5) % 9 + 9) % 9 }; }
function pesoBonito(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

VISTAS.tablon = {
  titulo: ([id]) => { const t = id && DB.estado.tablones.find(x => x.id === id); return t ? t.nombre : 'Tablón'; },
  nav: 'tablon', get atras() { return ruta().params[0] ? '#/tablon' : null; },
  render([id]) {
    if (!id) return listaTablones();
    const t = DB.estado.tablones.find(x => x.id === id);
    if (!DB.tablonVisible(t)) return '<p class="vacio">Este tablón no existe o es de un grupo en el que no estás. <a href="#/tablon">Volver</a></p>';
    const U = UI.tablon, todos = DB.itemsTablon(id), items = todos.filter(x => U.filtro === 'todo' || (U.filtro === 'foto' ? x.tipo === 'foto' || esImagen(x) : U.filtro === 'archivo' ? x.tipo === 'archivo' && !esImagen(x) : x.tipo === U.filtro));
    const barra = `<div class="entre"><div class="pestanas" style="flex:1">${[['todo', 'Todo'], ['evento', 'Eventos'], ['archivo', 'Archivos'], ['foto', 'Fotos'], ['nota', 'Notas']].map(([k, n]) => `<button class="pastilla${U.filtro === k ? ' on' : ''}" data-a="filtroTablon" data-f="${k}">${n}</button>`).join('')}</div>
      <button class="btn3" style="min-height:40px;padding:0 12px;flex:none" data-a="vistaTablon">${U.vista === 'corcho' ? 'Ver ordenado' : 'Ver tablón'}</button></div>`;
    const vacio = `<p class="peq vacio-corcho">${DB.puedeFijar(t) ? 'Todavía no hay nada aquí.' : 'Aquí aparecerá lo que publique la universidad.'}</p>`;
    const cuerpo = U.vista === 'corcho' ? corcho(items, vacio) : `<div class="pila" style="gap:10px">${items.map(filaTablon).join('') || '<p class="vacio">Todavía no hay nada aquí.</p>'}</div>`;
    return `<div class="pila">${DB.puedeFijar(t) ? `<button class="btn ancho" data-a="nuevoEnTablon" data-t="${t.id}">${icono('mas', 18)}Fijar algo en este tablón</button>` : ''}${t.chat ? `<a class="insignia i-morado" style="align-self:flex-start;text-decoration:none" href="#/chat/${t.chat}">Tablón del grupo · solo lo ven sus integrantes</a>` : ''}${barra}${cuerpo}
      ${DB.puedeFijar(t) ? `<button class="fab-tablon" data-a="nuevoEnTablon" data-t="${t.id}" aria-label="Fijar algo en el tablón">${icono('mas', 26)}</button>` : ''}</div>`;
  },
  montar() { cargarArchivosTablon(); }
};
function listaTablones() {
  const ts = DB.misTablones(), fijos = ['tb_uni', 'tb_eventos', 'tb_general'];
  return `<div class="pila" style="gap:22px">${ts.map(t => { const its = DB.itemsTablon(t.id), n = its.length;
    return `<section class="pila" style="gap:8px"><div class="entre"><span><h2 style="font-size:19px">${esc(t.nombre)}${t.oficial ? ' <span class="insignia i-morado" style="vertical-align:middle">Oficial</span>' : ''}</h2><span class="mini gris">${esc(t.desc || (t.chat ? 'Tablón de tu grupo' : ''))}${n ? ` · ${n} ${n === 1 ? 'cosa' : 'cosas'}` : ''}</span></span><span class="fila" style="flex-wrap:nowrap;gap:4px">${DB.puedeFijar(t) ? `<button class="btn" style="min-height:40px;padding:0 12px" data-a="nuevoEnTablon" data-t="${t.id}">${icono('mas', 16)}Fijar</button>` : ''}${fijos.includes(t.id) ? '' : botonEliminar('tablon', t.id)}</span></div>
      <a href="#/tablon/${t.id}" class="vista-corcho" aria-label="Abrir el tablón ${esc(t.nombre)}">${collage(its, `<span class="peq vacio-corcho">${t.oficial && !DB.esAdmin() ? 'Aquí aparecerá lo que publique la universidad.' : 'Vacío. Sé el primero en fijar algo.'}</span>`, true)}${n > 9 ? `<span class="mas-corcho">Ver las ${n} →</span>` : ''}</a></section>`; }).join('')}
    <button class="btn3 ancho" data-a="nuevoTablon">${icono('mas', 18)}Nuevo tablón</button></div>`;
}
function corcho(items, vacio, preview) {
  const alto = { nota: 150, archivo: 190, foto: 215, evento: 175 }, cols = [12, 12], tag = preview ? 'span' : 'button'; let html = '';
  items.forEach(it => {
    const g = giro(it.id), c = cols[0] <= cols[1] ? 0 : 1, top = cols[c];
    cols[c] += ((it.tipo === 'foto' || esImagen(it)) && it.archivo?.w ? Math.min(330, Math.max(120, 70 + 180 * it.archivo.h / it.archivo.w)) : alto[it.tipo]) + 14;
    html += `<${tag} class="pin-tablon tipo-${it.tipo}" style="left:calc(${c * 50}% + ${6 + g.dx}px);top:${top}px;transform:rotate(${g.r}deg);${it.tipo === 'nota' ? `background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo}` : ''}" ${preview ? '' : `data-a="verTablonItem" data-id="${it.id}" aria-label="${esc(it.titulo || it.texto.slice(0, 40))}"`}>
      <span class="chinche" style="background:${it.fijado ? '#E2453C' : g.c}"></span>${it.fijado ? '<span class="mini" style="position:absolute;right:6px;top:4px;font-weight:800;color:#B42318">FIJADO</span>' : ''}
      ${it.tipo === 'nota' ? `<span class="letra-nota">${esc(it.texto)}</span>`
        : it.tipo === 'evento' ? `<span class="evento-pin"><span class="fecha-pin"><b>${new Date(it.cuando).getDate()}</b><span>${new Date(it.cuando).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span></span><b class="peq" style="display:block;margin-top:6px;line-height:1.2">${esc(it.titulo)}</b><span class="mini" style="color:#6B6280">${new Date(it.cuando).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}${it.lugar ? ' · ' + esc(it.lugar) : ''}</span>${(it.apuntados || []).length ? `<span class="mini" style="display:block;font-weight:800;color:#14632F">${it.apuntados.length} ${it.apuntados.length === 1 ? 'va' : 'van'}</span>` : ''}</span>`
        : it.tipo === 'foto' || esImagen(it) ? `<span class="foto-pin" data-idb="${esc(it.archivo.clave)}" data-como="fondo" style="${it.archivo?.w ? `aspect-ratio:${it.archivo.w}/${it.archivo.h}` : ''}"></span><b class="peq" style="display:block;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || (it.tipo === 'foto' ? 'Foto' : it.archivo.nombre))}</b>`
        : `<span class="doc-pin">${icono('archivo', 30)}<span class="mini" style="font-weight:800">${esc((it.archivo.nombre.split('.').pop() || '').toUpperCase().slice(0, 4))}</span></span><b class="peq" style="display:block;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || it.archivo.nombre)}</b>`}
      <span class="mini" style="color:#6B6280">@${esc(DB.usuario(it.autor)?.usuario || '')}</span></${tag}>`;
  });
  return `<div class="corcho" style="height:${Math.max(560, Math.max(...cols) + 90)}px">${html || vacio}</div>`;
}
function filaTablon(it) {
  const quien = `@${esc(DB.usuario(it.autor)?.usuario || '')} · ${hace(it.fecha)}`;
  if (it.tipo === 'evento') return `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left" data-a="verTablonItem" data-id="${it.id}"><span class="fecha-pin" style="flex:none"><b>${new Date(it.cuando).getDate()}</b><span>${new Date(it.cuando).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span></span><span style="flex:1;min-width:0"><b>${esc(it.titulo)}</b><br><span class="mini gris">${new Date(it.cuando).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}${it.lugar ? ' · ' + esc(it.lugar) : ''} · ${(it.apuntados || []).length} ${(it.apuntados || []).length === 1 ? 'va' : 'van'}</span></span></button>`;
  if (it.tipo === 'nota') return `<button class="tarjeta" style="text-align:left;border:0;background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo}" data-a="verTablonItem" data-id="${it.id}">${it.fijado ? '<span class="mini" style="font-weight:800;color:#B42318">FIJADO · </span>' : ''}<b>${esc(it.texto)}</b><br><span class="mini gris">${quien}</span></button>`;
  return `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left" data-a="verTablonItem" data-id="${it.id}">
    ${it.tipo === 'foto' || esImagen(it) ? `<span class="foto-pin" style="width:64px;height:64px;flex:none" data-idb="${esc(it.archivo.clave)}" data-como="fondo"></span>` : `<span class="doc-pin" style="width:52px;height:64px;flex:none">${icono('archivo', 22)}</span>`}
    <span style="flex:1;min-width:0">${it.fijado ? '<span class="mini" style="font-weight:800;color:#B42318">FIJADO · </span>' : ''}<b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || (it.tipo === 'foto' ? 'Foto' : it.archivo.nombre))}</b><span class="mini gris">${quien}${it.archivo?.peso ? ' · ' + pesoBonito(it.archivo.peso) : ''}</span></span></button>`;
}
/* los archivos viven en este celular (IndexedDB) hasta conectar el servidor */
async function cargarArchivosTablon() {
  for (const el of $$('[data-idb]')) {
    if (el.dataset.listo) continue; el.dataset.listo = '1';
    const blob = await ARCHIVOS.leer(el.dataset.idb).catch(() => null);
    if (!blob) { el.classList.add('sin-archivo'); el.textContent = 'Solo en el celular de quien lo subió'; continue; }
    const url = URL.createObjectURL(blob);
    if (el.dataset.como === 'fondo') { el.style.backgroundImage = `url('${url}')`; if (!el.style.aspectRatio) { const im = new Image(); im.onload = () => { el.style.aspectRatio = im.naturalWidth + '/' + im.naturalHeight; }; im.src = url; } } else el.src = url;
  }
}
function reducirFoto(archivo, max = 1400) {
  return new Promise((ok, mal) => { const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => { const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? ok(b) : mal(new Error('foto')), 'image/jpeg', 0.85); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('foto')); }; img.src = url; });
}
ACC.filtroTablon = b => { UI.tablon.filtro = b.dataset.f; refrescar(); };
ACC.vistaTablon = () => { UI.tablon.vista = UI.tablon.vista === 'corcho' ? 'lista' : 'corcho'; refrescar(); };
ACC.nuevoTablon = () => abrirHoja(`<form class="pila" data-form="nuevoTablon"><h2>Nuevo tablón</h2><label class="oculto" for="ntb">Nombre</label><input id="ntb" name="nombre" required maxlength="50" placeholder="Ej. Física II · Grupo 3"><button class="btn ancho">Crear</button></form>`);
FORMS.nuevoTablon = d => { const r = DB.crearTablon(d.nombre); if (r.error) return aviso(r.error); cerrarHoja(); ir('#/tablon/' + r.ok.id); };
UI.nuevoTab = { tipo: 'archivo', color: 'amarillo' };
ACC.nuevoEnTablon = b => { const t = DB.estado.tablones.find(x => x.id === b.dataset.t); UI.nuevoTab.tablon = t.id; UI.nuevoTab.archivo = null; UI.nuevoTab.archivos = []; if (t.tipoDefecto) UI.nuevoTab.tipo = t.tipoDefecto; hojaNuevoTablon(); };
function hojaNuevoTablon() {
  const N = UI.nuevoTab;
  abrirHoja(`<form class="pila" data-form="fijarTablon"><h2>Fijar en el tablón</h2>
    <div class="rejilla2" style="grid-template-columns:repeat(4,1fr)">${[['evento', 'Evento'], ['archivo', 'Archivo'], ['foto', 'Foto'], ['nota', 'Nota']].map(([k, n]) => `<button type="button" class="pastilla${N.tipo === k ? ' on' : ''}" data-a="tipoTablon" data-t="${k}">${n}</button>`).join('')}</div>
    ${N.tipo === 'evento' ? `<div><label class="campo" for="tet">¿Qué quieres hacer?</label><input id="tet" name="titulo" required maxlength="80" placeholder="Torneo de fut, conferencia, salida…"></div>
      <div class="rejilla2"><div><label class="campo" for="tec">Cuándo</label><input id="tec" name="cuando" type="datetime-local" required></div><div><label class="campo" for="tel">Dónde</label><input id="tel" name="lugar" maxlength="80" placeholder="Explanada"></div></div>
      <div><label class="campo" for="ted">Detalles <span class="mini gris">(opcional)</span></label><textarea id="ted" name="texto" maxlength="400" rows="3"></textarea></div>`
      : N.tipo === 'nota' ? `<label class="oculto" for="tnt">Nota</label><textarea id="tnt" name="texto" required maxlength="400" rows="4" placeholder="Ej. Entrega del reporte el viernes"></textarea>
      <div class="fila">${Object.entries(COLORES_NOTA).map(([k, c]) => `<button type="button" class="pastilla${N.color === k ? ' on' : ''}" style="${N.color === k ? '' : `background:${c}`}" data-a="colorTablon" data-c="${k}">${k}</button>`).join('')}</div>`
      : `<label class="tarjeta" style="border:2px dashed var(--linea);display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;cursor:pointer;text-align:center">${icono(N.tipo === 'foto' ? 'camara' : 'subir', 28)}<b style="color:var(--moradoTxt)" id="tabArchivo">${N.archivos?.length ? N.archivos.map(a => esc(a.nombre)).join(', ') : N.tipo === 'foto' ? 'Elegir foto' : 'Elegir archivo (PDF, Word, etc.)'}</b><span class="mini gris">Hasta 5 a la vez · 10 MB cada uno</span><input type="file" class="oculto" multiple accept="${N.tipo === 'foto' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*'}" data-cambio="archivoTablon"></label>
      <div><label class="campo" for="ttt">Título <span class="mini gris">(opcional)</span></label><input id="ttt" name="titulo" maxlength="80" placeholder="${N.tipo === 'foto' ? 'Lo que vimos el martes' : 'Práctica 4 · Ley de Ohm'}"></div>`}
    <button class="btn ancho">Fijar</button></form>`);
}
ACC.tipoTablon = b => { UI.nuevoTab.tipo = b.dataset.t; UI.nuevoTab.archivo = null; UI.nuevoTab.archivos = []; hojaNuevoTablon(); };
ACC.colorTablon = b => { UI.nuevoTab.color = b.dataset.c; const t = $('#tnt')?.value; hojaNuevoTablon(); if (t) $('#tnt').value = t; };
CAMBIOS.archivoTablon = async el => {
  const fs = [...el.files]; if (!fs.length) return; if (fs.length > 5) return aviso('Máximo 5 a la vez.'); if (fs.some(f => f.size > 10 * 1024 * 1024)) return aviso('Cada uno puede pesar máximo 10 MB.');
  const N = UI.nuevoTab, et = $('#tabArchivo'); if (et) et.textContent = 'Cargando…'; N.archivos = [];
  for (const f of fs) {
    try {
      const esImg = /^image\//.test(f.type), blob = N.tipo === 'foto' || (esImg && !/gif/.test(f.type)) ? await reducirFoto(f) : f, clave = 'tab_' + uid('f');
      await ARCHIVOS.guardar(clave, blob);
      const a = { clave, nombre: f.name.slice(0, 120), peso: blob.size, mime: blob.type || f.type };
      if (/^image\//.test(a.mime)) { try { const bm = await createImageBitmap(blob); a.w = bm.width; a.h = bm.height; bm.close?.(); } catch {} }
      N.archivos.push(a);
    } catch { aviso('No pudimos leer ' + f.name); }
  }
  N.archivo = N.archivos[0] || null; if (et) et.textContent = N.archivos.map(a => a.nombre).join(', ') || 'Elegir de nuevo';
};
FORMS.fijarTablon = d => { const N = UI.nuevoTab, lista = (N.tipo === 'archivo' || N.tipo === 'foto') ? (N.archivos?.length ? N.archivos : [null]) : [null]; let r;
  for (const arch of lista) { r = DB.fijarEnTablon({ tablon: N.tablon, tipo: N.tipo, titulo: d.titulo, texto: d.texto, color: N.color, archivo: arch, cuando: d.cuando ? new Date(d.cuando).toISOString() : null, lugar: d.lugar }); if (r.error) return aviso(r.error); }
  N.archivo = null; N.archivos = []; cerrarHoja(); aviso(lista.length > 1 ? `${lista.length} fijados` : 'Fijado'); refrescar(); };
ACC.verTablonItem = b => {
  DB.verTablonItem(b.dataset.id);
  const it = DB.estado.tablonItems.find(x => x.id === b.dataset.id); if (!it) return; const mio = it.autor === DB.yo().id || DB.esAdmin();
  abrirHoja(`<div class="pila"><span class="mini gris">@${esc(DB.usuario(it.autor)?.usuario || '')} · ${hace(it.fecha)}</span>
    ${it.tipo === 'evento' ? `<div class="fila" style="flex-wrap:nowrap"><span class="fecha-pin"><b>${new Date(it.cuando).getDate()}</b><span>${new Date(it.cuando).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span></span><span><h2>${esc(it.titulo)}</h2><span class="peq gris">${new Date(it.cuando).toLocaleString('es-MX', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}${it.lugar ? ' · ' + esc(it.lugar) : ''}</span></span></div>${it.texto ? `<p style="margin:0;white-space:pre-wrap">${esc(it.texto)}</p>` : ''}
      <button class="${(it.apuntados || []).includes(DB.yo().id) ? 'btn3' : 'btn'} ancho" data-a="apuntarseTablon" data-id="${it.id}">${(it.apuntados || []).includes(DB.yo().id) ? 'Ya no voy' : 'Me apunto'}</button><p class="peq gris" style="margin:0">${(it.apuntados || []).length ? 'Van: ' + it.apuntados.map(u => '@' + esc(DB.usuario(u)?.usuario || '')).join(', ') : 'Nadie se ha apuntado todavía.'}</p>`
      : it.tipo === 'nota' ? `<div style="background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo};border-radius:14px;padding:16px;white-space:pre-wrap;font-size:17px">${esc(it.texto)}</div>`
      : it.tipo === 'foto' || esImagen(it) ? `<h2>${esc(it.titulo || (it.tipo === 'foto' ? 'Foto' : it.archivo.nombre))}</h2><img alt="${esc(it.titulo || 'Foto del tablón')}" data-idb="${esc(it.archivo.clave)}" style="width:100%;border-radius:14px;background:var(--suave);min-height:120px">`
      : `<h2 style="overflow-wrap:anywhere">${esc(it.titulo || it.archivo.nombre)}</h2><p class="peq gris" style="margin:0">${esc(it.archivo.nombre)} · ${pesoBonito(it.archivo.peso)}</p>`}
    ${it.tipo === 'archivo' || it.tipo === 'foto' ? `<div class="rejilla2"><button class="btn2" data-a="abrirArchivoTablon" data-id="${it.id}">Ver</button><button class="btn3" data-a="abrirArchivoTablon" data-id="${it.id}" data-bajar="1">${icono('descargar', 18)}Descargar</button></div>` : ''}
    <div class="fila">${mio ? `<button class="btn3" data-a="fijarArriba" data-id="${it.id}">${it.fijado ? 'Quitar de arriba' : 'Fijar arriba'}</button>` : ''}${it.autor !== DB.yo().id ? `<button class="btn3" style="color:var(--malTxt)" data-a="abrirReporte" data-tipo="tablon" data-ref="${it.id}">${icono('bandera', 16)}Reportar</button>` : ''}${botonEliminar('tablonItem', it.id)}</div></div>`);
  cargarArchivosTablon();
};
ACC.abrirArchivoTablon = async b => {
  const it = DB.estado.tablonItems.find(x => x.id === b.dataset.id); if (!it?.archivo) return;
  if (b.dataset.bajar) return ACC.visorBajar({ dataset: { c: it.archivo.clave, n: it.archivo.nombre } });
  VISOR.abrir(it.archivo);
};
ACC.fijarArriba = b => { DB.fijarArriba(b.dataset.id); cerrarHoja(); refrescar(); };

ACC.apuntarseTablon = b => { DB.apuntarseTablon(b.dataset.id); refrescar(); ACC.verTablonItem(b); };

function esImagen(it) { return it.tipo === 'archivo' && (/^image\//.test(it.archivo?.mime || '') || /\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(it.archivo?.nombre || '')); }

/* portada de un tablón como collage: lo que más interacción tiene queda encima y más al centro */
function collage(items, vacio) {
  if (!items.length) return `<div class="corcho" style="height:100%">${vacio}</div>`;
  const top = items.slice().sort((a, b) => DB.interaccion(b) - DB.interaccion(a) || b.fecha.localeCompare(a.fecha)).slice(0, 9);
  const n = top.length, html = top.map((it, i) => {
    const g = giro(it.id), h2 = (g.dx * 37 + i * 11) % 100;
    /* el más visto al centro; los demás alrededor, un poco más chicos */
    const ancho = i === 0 ? 48 : 40 - Math.min(10, i);
    const left = i === 0 ? 26 : ((i % 2 ? 2 : 56) + (h2 % 12));
    const topPx = i === 0 ? 40 : 6 + ((Math.floor((i - 1) / 2) * 70) + (h2 % 30)) % 200;
    const z = 100 - i, img = it.tipo === 'foto' || esImagen(it);
    return `<span class="pin-tablon tipo-${it.tipo}" style="left:${left}%;top:${topPx}px;width:${ancho}%;max-width:none;z-index:${z};transform:rotate(${g.r * 1.4}deg);${it.tipo === 'nota' ? `background:${COLORES_NOTA[it.color] || COLORES_NOTA.amarillo}` : ''}"><span class="chinche" style="background:${g.c}"></span>
      ${it.tipo === 'nota' ? `<span class="letra-nota">${esc(it.texto)}</span>`
        : img ? `<span class="foto-pin" data-idb="${esc(it.archivo.clave)}" data-como="fondo" style="${it.archivo?.w ? `aspect-ratio:${it.archivo.w}/${it.archivo.h};` : ''}max-height:170px"></span>`
        : it.tipo === 'evento' ? `<span class="evento-pin"><span class="fecha-pin"><b>${new Date(it.cuando).getDate()}</b><span>${new Date(it.cuando).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '')}</span></span><b class="peq" style="display:block;margin-top:6px;line-height:1.2">${esc(it.titulo)}</b></span>`
        : `<span class="doc-pin" style="height:70px">${icono('archivo', 26)}</span><b class="peq" style="display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.titulo || it.archivo.nombre)}</b>`}</span>`;
  }).join('');
  return `<div class="corcho" style="height:100%">${html}</div>`;
}
