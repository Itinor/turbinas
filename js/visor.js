/* Visor de documentos: ver fotos, PDF, Word, PowerPoint, Excel y texto sin descargarlos. */
'use strict';
const VISOR = {
  pdfjs: null,
  async cargarPdfjs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (!this.pdfjs) this.pdfjs = new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = () => { this.pdfjs = null; mal(new Error('pdfjs')); }; document.head.appendChild(s); });
    return this.pdfjs;
  },
  tipo(nombre, mime) { const n = String(nombre || '').toLowerCase(), m = String(mime || '');
    if (/^image\//.test(m) || /\.(png|jpe?g|gif|webp|bmp|heic)$/.test(n)) return 'imagen';
    if (/pdf/.test(m) || n.endsWith('.pdf')) return 'pdf';
    if (/\.(docx?|pptx?|xlsx?)$/.test(n) || /officedocument|msword|ms-excel|ms-powerpoint/.test(m)) return 'office';
    if (/^text\//.test(m) || /\.(txt|csv|md|json)$/.test(n)) return 'texto';
    if (/^audio\//.test(m) || /\.(mp3|m4a|wav|ogg)$/.test(n)) return 'audio';
    if (/^video\//.test(m) || /\.(mp4|mov|webm)$/.test(n)) return 'video';
    return 'otro'; },
  async abrir({ clave, nombre, mime }) {
    const t = this.tipo(nombre, mime);
    abrirHoja(`<div class="entre" style="gap:8px"><b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${esc(nombre || 'Archivo')}</b><button class="btn3" style="min-height:40px;padding:0 12px" data-a="visorBajar" data-c="${esc(clave)}" data-n="${esc(nombre || 'archivo')}">${icono('descargar', 16)}Descargar</button><button class="icono-btn" data-a="cerrarHoja" aria-label="Cerrar">${icono('cerrar', 20)}</button></div><div class="visor-cuerpo" id="visor" style="margin-top:8px"><p class="peq gris" style="text-align:center;padding:30px 0">Abriendo…</p></div>`);
    $('#velo .hoja')?.classList.add('grande');
    const caja = () => $('#visor');
    if (t === 'office') {
      if (typeof SYNC !== 'undefined' && SYNC.activo) { const pub = `${CONFIG.supabase.url}/storage/v1/object/public/archivos/${clave.split('/').map(encodeURIComponent).join('/')}`; caja().innerHTML = `<iframe title="${esc(nombre)}" src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pub)}"></iframe>`; }
      else caja().innerHTML = '<p class="peq gris" style="text-align:center;padding:30px 0">Este tipo de archivo se puede ver cuando está conectado el servidor. Descárgalo para abrirlo.</p>';
      return;
    }
    const blob = await ARCHIVOS.leer(clave).catch(() => null);
    if (!caja()) return;
    if (!blob) { caja().innerHTML = '<p class="peq gris" style="text-align:center;padding:30px 0">No se pudo abrir. Revisa tu internet.</p>'; return; }
    const url = URL.createObjectURL(blob);
    if (t === 'imagen') caja().innerHTML = `<img src="${url}" alt="${esc(nombre)}" style="display:block;max-width:100%;margin:0 auto;border-radius:8px">`;
    else if (t === 'audio') caja().innerHTML = `<audio src="${url}" controls style="width:100%;margin-top:30px"></audio>`;
    else if (t === 'video') caja().innerHTML = `<video src="${url}" controls playsinline style="width:100%;max-height:75vh;border-radius:8px;background:#000"></video>`;
    else if (t === 'texto') caja().innerHTML = `<pre>${esc((await blob.text()).slice(0, 200000))}</pre>`;
    else if (t === 'pdf') {
      try {
        const lib = await this.cargarPdfjs(), doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const c = caja(); if (!c) return; c.innerHTML = `<p class="mini gris" style="text-align:center;margin:0 0 6px">${doc.numPages} página${doc.numPages > 1 ? 's' : ''}</p>`;
        const ancho = Math.min(c.clientWidth - 16, 900), max = Math.min(doc.numPages, 60);
        for (let n = 1; n <= max; n++) { if (!caja()) return; const pg = await doc.getPage(n), v0 = pg.getViewport({ scale: 1 }), esc2 = ancho / v0.width * (window.devicePixelRatio || 1), v = pg.getViewport({ scale: esc2 }), cv = document.createElement('canvas'); cv.width = v.width; cv.height = v.height; c.appendChild(cv); await pg.render({ canvasContext: cv.getContext('2d'), viewport: v }).promise; }
        if (doc.numPages > max) c.insertAdjacentHTML('beforeend', `<p class="peq gris" style="text-align:center">Se muestran las primeras ${max} páginas. Descárgalo para ver todo.</p>`);
      } catch (e) { const c = caja(); if (c) c.innerHTML = `<iframe title="${esc(nombre)}" src="${url}"></iframe>`; }
    }
    else caja().innerHTML = '<p class="peq gris" style="text-align:center;padding:30px 0">Este tipo de archivo no tiene vista previa. Descárgalo para abrirlo.</p>';
  }
};
ACC.visorBajar = async b => { const blob = await ARCHIVOS.leer(b.dataset.c).catch(() => null); if (!blob) return aviso('No se pudo descargar.'); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = b.dataset.n; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); };
