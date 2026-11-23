/* Lee un horario desde un PDF (texto con posiciones, vía pdf.js) o una imagen (OCR con Tesseract.js)
   y lo convierte en clases con día, hora de inicio y fin. Antes de guardar siempre se muestra para corregir. */
'use strict';
const LECTOR_HORARIO = (() => {
  const DIAS = [['lu', /^lun(es)?\.?$/i], ['ma', /^mar(tes)?\.?$/i], ['mi', /^mi[eé](rcoles)?\.?$/i], ['ju', /^jue(ves)?\.?$/i], ['vi', /^vie(rnes)?\.?$/i], ['sa', /^s[aá]b(ado)?\.?$/i]];
  const sinAc = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const H = t => { const m = /^(\d{1,2})(?::|\.|h)?(\d{2})?$/.exec(String(t).trim()); if (!m) return null; const h = +m[1], mi = +(m[2] || 0); return h <= 23 && mi < 60 ? h * 60 + mi : null; };
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  /* busca rangos tipo "07:00 - 09:00", "7-9", "07:00 a 09:00" dentro de un texto */
  /* el OCR confunde O↔0, l/I↔1, S↔5 junto a números */
  const arreglarNum = t => String(t).replace(/(?<=\d|:)[oO]|[oO](?=\d|:)/g, '0').replace(/(?<=\d|:)[lI|]|[lI|](?=\d{1}:)/g, '1').replace(/(?<=\d:)[sS]|[sS](?=\d:)/g, '5').replace(/(\d)\s*[:;.,]\s*(\d{2})/g, '$1:$2');
  function rangos(t) {
    t = arreglarNum(t); const out = [], re = /(\d{1,2}(?:[:.]\d{2})?)\s*(?:-|–|—|a|hrs?\.?\s*a)\s*(\d{1,2}(?:[:.]\d{2})?)/gi; let m;
    while ((m = re.exec(t))) { let a = H(m[1].replace('.', ':')), b = H(m[2].replace('.', ':')); if (a == null || b == null) continue; if (b <= a && b + 720 > a && b < 13 * 60) b += 720; if (a < 6 * 60) a += 720, b += b < a ? 720 : 0; if (b > a && b - a <= 6 * 60) out.push([a, b]); }
    return out;
  }
  const horaSola = t => { const m = /^(\d{1,2})[:.](\d{2})$/.exec(arreglarNum(String(t)).trim()); return m ? H(m[1] + ':' + m[2]) : null; };

  /* tokens: [{t, x, y, w, h}] en cualquier escala; y crece hacia abajo */
  const NOMBRES = { lu: 'lunes', ma: 'martes', mi: 'miercoles', ju: 'jueves', vi: 'viernes', sa: 'sabado' };
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  /* el OCR a veces corta o cambia una letra del encabezado ("iernes", "Miercoies") */
  const esDia = (t, d, re) => { if (re.test(sinAc(t))) return true; const w = sinAc(t).toLowerCase().replace(/[^a-z]/g, ''), n = NOMBRES[d]; return w.length >= 5 && (lev(w, n) <= 1 || (n.endsWith(w) && w.length >= n.length - 2)); };
  function interpretar(tokens) {
    tokens = tokens.filter(k => String(k.t).trim()).map(k => ({ ...k, t: String(k.t).trim(), cx: k.x + (k.w || 0) / 2, cy: k.y + (k.h || 0) / 2 }));
    if (!tokens.length) return [];
    const alto = tokens.map(k => k.h || 10).sort((a, b) => a - b)[Math.floor(tokens.length / 2)] || 10;
    /* encabezados de días (todos en el mismo renglón) */
    let cab = []; DIAS.forEach(([d, re]) => { const k = tokens.filter(x => esDia(x.t, d, re)).sort((a, b) => a.y - b.y)[0]; if (k) cab.push({ d, x: k.cx, y: k.cy, k }); });
    if (cab.length >= 3) { const ym = cab.map(c => c.y).sort((a, b) => a - b)[Math.floor(cab.length / 2)]; cab = cab.filter(c => Math.abs(c.y - ym) < alto * 2); }
    if (cab.length < 3) return [];
    /* si falta un día que el OCR no leyó, se deduce por la separación entre columnas */
    const idx = d => DIAS.findIndex(x => x[0] === d);
    { const n = cab.length, sx = cab.reduce((a, c) => a + idx(c.d), 0), sy = cab.reduce((a, c) => a + c.x, 0), sxx = cab.reduce((a, c) => a + idx(c.d) ** 2, 0), sxy = cab.reduce((a, c) => a + idx(c.d) * c.x, 0), b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n, ym = cab[0].y;
      const hasta = Math.max(...cab.map(c => idx(c.d))), minX = Math.min(...cab.map(c => c.k.x)) - b * hasta;
      if (b > alto * 2) for (let i = 0; i <= hasta; i++) if (!cab.some(c => idx(c.d) === i)) { const x = a + b * i; if (x > minX && x > 0) cab.push({ d: DIAS[i][0], x, y: ym, k: { x: x - alto * 2, y: ym, w: alto * 4, h: alto, cx: x, cy: ym, t: '' }, falso: true }); } }
    cab.sort((a, b) => a.x - b.x);
    const yCab = Math.max(...cab.map(c => c.y)), anchoCol = (cab.at(-1).x - cab[0].x) / Math.max(1, cab.length - 1);
    /* otros encabezados del mismo renglón (Clave, Materia, Grupo, Fechas…) */
    const otrosCab = tokens.filter(k => Math.abs(k.cy - yCab) < alto * 0.8 && /[a-z]{3,}/i.test(k.t) && !cab.some(c => c.k === k) && !cab.some(c => Math.abs(c.x - k.cx) < anchoCol * 0.3));
    const cabIzq = otrosCab.filter(k => k.cx < cab[0].x).sort((a, b) => a.cx - b.cx), cabDer = otrosCab.filter(k => k.cx > cab.at(-1).x).sort((a, b) => a.cx - b.cx);
    const izq = cabIzq.length ? Math.max((cabIzq.at(-1).cx + cab[0].x) / 2, cabIzq.at(-1).x + cabIzq.at(-1).w) : cab[0].k.x - Math.min(anchoCol * 0.25, alto * 2.5);
    const der = cabDer.length ? (cab.at(-1).x + cabDer[0].cx) / 2 : cab.at(-1).x + anchoCol * 0.75;
    const debajo = tokens.filter(k => k.cy > yCab + alto * 0.6 && !cab.some(c => c.k === k));
    /* filas por altura */
    const filas = []; debajo.sort((a, b) => a.cy - b.cy).forEach(k => { const f = filas.find(f => Math.abs(f.y - k.cy) < alto * 0.7); if (f) { f.k.push(k); f.y = (f.y + k.cy) / 2; } else filas.push({ y: k.cy, k: [k] }); });
    /* junta palabras de la misma frase (el OCR da palabra por palabra) para que un nombre largo no caiga en otra columna */
    const limites = cab.slice(1).map((c, i) => (c.x + cab[i].x) / 2);
    const colIdx = x => x < izq ? -1 : limites.filter(l => x >= l).length;
    filas.forEach(f => { f.k.sort((a, b) => a.x - b.x); const unidas = [];
      f.k.forEach(k => { const u = unidas.at(-1), hueco = u ? k.x - (u.x + u.w) : Infinity;
        if (u && hueco < alto * 0.9 && (colIdx(u.x) === colIdx(k.x + k.w) || hueco < alto * 0.35)) { u.t += ' ' + k.t; u.w = k.x + k.w - u.x; u.h = Math.max(u.h, k.h); u.cx = u.x + u.w / 2; }
        else unidas.push({ ...k }); });
      f.k = unidas; });
    const colDe = k => { if (k.x < izq) return 'izq'; const i = colIdx(k.x + Math.min(k.w, anchoCol * 0.5) / 2); if (i < 0) return 'izq'; if (k.cx > der) return null; return cab[i].d; };
    const celdas = filas.map(f => { const c = { y: f.y, izq: [], dias: {} }; f.k.sort((a, b) => a.x - b.x).forEach(k => { const col = colDe(k); if (col === 'izq') c.izq.push(k.t); else if (col) (c.dias[col] = c.dias[col] || []).push(k.t); }); return { ...c, izqT: c.izq.join(' '), diasT: Object.fromEntries(Object.entries(c.dias).map(([d, v]) => [d, v.join(' ')])) }; });
    for (const [d] of DIAS) for (let i = 0; i < celdas.length - 1; i++) {
      const a1 = celdas[i].diasT[d], b1 = celdas[i + 1].diasT[d]; if (!a1 || !b1) continue;
      if (Math.abs(celdas[i + 1].y - celdas[i].y) < alto * 1.9 && !rangos(a1).length && /\d{1,2}[:.]\d{2}\s*(-|–|a)?\s*$/.test(arreglarNum(a1)) && /^\s*(-|–|a)\s*\d{1,2}[:.]\d{2}/.test(arreglarNum(b1)) || (Math.abs(celdas[i + 1].y - celdas[i].y) < alto * 1.9 && !rangos(a1).length && /\d{1,2}[:.]\d{2}\s*(-|–|a)\s*$/.test(arreglarNum(a1)) && /^\s*\d{1,2}[:.]\d{2}/.test(arreglarNum(b1)))) { celdas[i].diasT[d] = a1 + ' - ' + b1.replace(/^\s*(-|–|a)\s*/, ''); delete celdas[i + 1].diasT[d]; }
    }
    /* nombres de materia en dos renglones: si un renglón solo tiene texto a la izquierda y el siguiente también, se juntan */
    for (let i = 0; i < celdas.length - 1; i++) { const c = celdas[i], n = celdas[i + 1]; if (c.izqT && !Object.keys(c.diasT).length && n.izqT && /^[a-záéíóúñ]/i.test(n.izqT) && !rangos(n.izqT).length && Math.abs(n.y - c.y) < alto * 1.8) { n.izqT = c.izqT + ' ' + n.izqT; c.izqT = ''; } }
    /* hora suelta dentro de un día (ej. "11:00" o "11"): se toma como inicio y dura 1 h (se puede corregir al revisar) */
    const horaEnCelda = t => { const x = arreglarNum(t).trim(), m = /^(\d{1,2})(?:[:.](\d{2}))?\s*(?:hrs?\.?|am|pm)?$/i.exec(x.split(/\s+/)[0] + (/^\d{1,2}$/.test(x.split(/\s+/)[0]) && /^(hrs?|am|pm)/i.test(x.split(/\s+/)[1] || '') ? ' ' + x.split(/\s+/)[1] : '')); if (!m) return null; let h = +m[1]; if (h > 23) return null; if (/pm/i.test(x) && h < 12) h += 12; if (h < 6) h += 12; return h * 60 + (+m[2] || 0); };
    const conRango = celdas.filter(c => Object.values(c.diasT).some(t => rangos(t).length || horaEnCelda(t) != null)).length;
    const horasIzq = celdas.filter(c => rangos(c.izqT).length || horaSola(c.izq[0] || '') != null).length;
    const clases = new Map(), add = (materia, d, a, b, salon = '') => { materia = materia.replace(/\s+/g, ' ').trim(); if (!materia || materia.length < 2) return; const k = materia.toLowerCase(); if (!clases.has(k)) clases.set(k, { materia, salon, sesiones: [] }); const c = clases.get(k); if (!c.sesiones.some(s => s.d === d && s.ini === fmt(a))) c.sesiones.push({ d, ini: fmt(a), fin: fmt(b) }); if (salon && !c.salon) c.salon = salon; };
    if (conRango >= horasIzq) {
      /* formato lista: cada fila es una materia y en cada día viene su rango de horas */
      const salonDe = t => arreglarNum(t).replace(/(\d{1,2}(?:[:.]\d{2})?)\s*(?:-|–|—|a)\s*(\d{1,2}(?:[:.]\d{2})?)/g, '').replace(/^\s*\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?/i, '').replace(/hrs?\.?/gi, '').replace(/\s*-\s*/g, '-').replace(/^-+|-+$/g, '').trim().slice(0, 20);
      /* filas altas (horas y salón en dos renglones, nombre centrado): se buscan columnas "ancla" con un dato por fila
         (clave, grupo, tipo, fecha) y cada palabra se asigna a la fila cuyo centro le queda más cerca */
      const anclas = (() => {
        const cands = tokens.filter(k => k.cy > yCab + alto * 0.6 && (k.cx < izq || k.cx > der) && /\w/.test(k.t)); let mejor = null;
        const grupos = []; cands.forEach(k => { const g = grupos.find(g => Math.abs(g.x - k.cx) < alto * 2.5); if (g) g.k.push(k); else grupos.push({ x: k.cx, k: [k] }); });
        grupos.forEach(g => { const ys = g.k.map(k => k.cy).sort((a, b) => a - b); if (ys.length < 2) return; const gaps = ys.slice(1).map((y, i) => y - ys[i]); if (Math.min(...gaps) < alto * 2.4) return; if (g.k.some(k => k.h > alto * 1.6)) return; if (!mejor || ys.length > mejor.length) mejor = ys; });
        return mejor;
      })();
      if (anclas && anclas.length >= 2) {
        const paso = (anclas.at(-1) - anclas[0]) / (anclas.length - 1);
        const fila = cy => { if (cy < anclas[0] - paso * 0.6 || cy > anclas.at(-1) + paso * 0.6) return -1; let b = 0; anclas.forEach((a, i) => { if (Math.abs(a - cy) < Math.abs(anclas[b] - cy)) b = i; }); return b; };
        /* columna de la materia: entre el encabezado "Materia" y el siguiente; si no hay, todo lo de la izquierda que no parezca clave/grupo/tipo */
        const iM = cabIzq.findIndex(k => /materia|asignatura|curso|nombre|unidad/i.test(sinAc(k.t)));
        const esNombre = iM >= 0 ? k => k.cx > (iM > 0 ? cabIzq[iM - 1].x + cabIzq[iM - 1].w + alto : -1e9) && k.x < (cabIzq[iM + 1] ? cabIzq[iM + 1].x - alto * 0.5 : izq)
          : k => k.cx < izq && !/\d/.test(k.t) && !/^(teor[ií]a|laboratorio|pr[aá]ctica)$/i.test(sinAc(k.t));
        const unir = l => { l.sort((a, b) => a.cy - b.cy); const lin = []; l.forEach(k => { const u = lin.find(u => Math.abs(u.y - k.cy) < alto * 0.6); if (u) u.k.push(k); else lin.push({ y: k.cy, k: [k] }); }); return lin.sort((a, b) => a.y - b.y).map(u => u.k.sort((a, b) => a.x - b.x).map(k => k.t).join(' ')).join(' '); };
        const filasA = anclas.map(() => ({ nom: [], dias: {} }));
        tokens.filter(k => k.cy > yCab + alto * 0.6 && !cab.some(c => c.k === k)).forEach(k => { const f = fila(k.cy); if (f < 0) return;
          if (k.cx < izq) { if (esNombre(k) && /[a-záéíóúñ]/i.test(k.t)) filasA[f].nom.push(k); return; }
          if (k.cx > der) return; const i = colIdx(k.cx); if (i < 0 || !cab[i]) return; (filasA[f].dias[cab[i].d] = filasA[f].dias[cab[i].d] || []).push(k); });
        filasA.forEach(f => { const nombre = unir(f.nom).replace(/[:;|]+/g, ' ').replace(/\s+/g, ' ').trim(); if (!nombre) return;
          Object.entries(f.dias).forEach(([d, l]) => { const t = unir(l), rs = rangos(t); (rs.length ? rs : horaEnCelda(t) != null ? [[horaEnCelda(t), horaEnCelda(t) + 60]] : []).forEach(([a, b]) => add(nombre, d, a, b, salonDe(t))); }); });
        if (clases.size) return [...clases.values()].filter(c => c.sesiones.length);
      }
      let ultima = '';
      celdas.forEach(c => { const nombre = c.izqT.replace(/\b\d{3,}\b/g, '').trim() || ultima; let algo = false;
        Object.entries(c.diasT).forEach(([d, t]) => (rangos(t).length ? rangos(t) : horaEnCelda(t) != null ? [[horaEnCelda(t), horaEnCelda(t) + 60, true]] : []).forEach(([a, b]) => { const salon = arreglarNum(t).replace(/(\d{1,2}(?:[:.]\d{2})?)\s*(?:-|–|—|a)\s*(\d{1,2}(?:[:.]\d{2})?)/g, '').replace(/^\s*\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?/i, '').replace(/hrs?\.?/gi, '').trim(); add(nombre, d, a, b, salon.slice(0, 20)); algo = true; }));
        if (c.izqT && !algo) ultima = c.izqT; else if (algo) ultima = nombre; });
    } else {
      /* formato cuadrícula: a la izquierda las horas, en cada día el nombre de la materia */
      const conHora = celdas.map(c => { const r = rangos(c.izqT)[0]; return { ...c, a: r ? r[0] : horaSola(c.izq[0] || ''), b: r ? r[1] : null }; });
      const marcas = conHora.filter(c => c.a != null);
      conHora.forEach((c, i) => {
        let a = c.a, b = c.b;
        if (a == null) { const prev = marcas.filter(m => m.y < c.y).at(-1); if (!prev) return; a = prev.a; b = prev.b; }
        if (b == null) { const sig = marcas.find(m => m.y > c.y + alto * 0.3); b = sig ? sig.a : a + 60; }
        Object.entries(c.diasT).forEach(([d, t]) => { if (!/[a-záéíóúñ]{3,}/i.test(t)) return; add(t.slice(0, 60), d, a, b); });
      });
      /* une bloques seguidos de la misma materia */
      clases.forEach(c => { const por = {}; c.sesiones.forEach(s => (por[s.d] = por[s.d] || []).push(s)); c.sesiones = Object.values(por).flatMap(l => { l.sort((x, y) => x.ini.localeCompare(y.ini)); const r = []; l.forEach(s => { const u = r.at(-1); if (u && u.fin >= s.ini) { if (s.fin > u.fin) u.fin = s.fin; } else r.push({ ...s }); }); return r; }); });
    }
    return [...clases.values()].filter(c => c.sesiones.length);
  }

  async function tokensDePdf(blob) {
    const lib = await VISOR.cargarPdfjs(), doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise, out = [];
    for (let n = 1; n <= Math.min(doc.numPages, 3); n++) {
      const pg = await doc.getPage(n), vp = pg.getViewport({ scale: 1 }), tc = await pg.getTextContent(), off = (n - 1) * (vp.height + 50);
      tc.items.forEach(it => { const [, , , d, e, f] = it.transform, h = Math.abs(d) || 10; out.push({ t: it.str, x: e, y: off + vp.height - f - h, w: it.width, h }); });
    }
    return out;
  }
  let tesseract = null;
  async function cargarTesseract() {
    if (window.Tesseract) return window.Tesseract;
    if (!tesseract) tesseract = new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = () => ok(window.Tesseract); s.onerror = () => { tesseract = null; mal(new Error('tesseract')); }; document.head.appendChild(s); });
    return tesseract;
  }
  /* segunda pasada: escala de grises, más grande y con los renglones oscuros (encabezados de color) invertidos */
  async function mejorarImagen(blob) {
    const bmp = await createImageBitmap(blob), f = bmp.width < 2000 ? 2 : 1, cv = document.createElement('canvas'); cv.width = bmp.width * f; cv.height = bmp.height * f;
    const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(bmp, 0, 0, cv.width, cv.height);
    const im = cx.getImageData(0, 0, cv.width, cv.height), d = im.data, W = cv.width;
    for (let i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    for (let y = 0; y < cv.height; y++) { let s = 0, n = 0; for (let x = 0; x < W; x += 7) { s += d[(y * W + x) * 4]; n++; } if (s / n < 110) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; d[o] = d[o + 1] = d[o + 2] = 255 - d[o]; } }
    cx.putImageData(im, 0, 0);
    return { img: await new Promise(r => cv.toBlob(r, 'image/png')), f };
  }
  async function tokensDeImagen(blob, avance, mejorar) {
    let f = 1; if (mejorar) { try { const m = await mejorarImagen(blob); blob = m.img; f = m.f; } catch (e) { console.warn(e); } }
    const T = await cargarTesseract(), r = await T.recognize(blob, 'spa', { logger: m => m.status === 'recognizing text' && avance?.(Math.round(m.progress * 100)) });
    return (r.data.words || []).filter(w => w.confidence > 10).map(w => ({ t: w.text, x: w.bbox.x0 / f, y: w.bbox.y0 / f, w: (w.bbox.x1 - w.bbox.x0) / f, h: (w.bbox.y1 - w.bbox.y0) / f }));
  }
  const sesionesDe = c => c.reduce((a, x) => a + x.sesiones.length, 0);
  /* lee la imagen dos veces (tal cual y mejorada) y se queda con la lectura que encontró más clases */
  async function leerImagen(img, avance) {
    const t1 = await tokensDeImagen(img, p => avance?.(Math.round(p / 2))), c1 = interpretar(t1);
    let t2 = [], c2 = []; try { t2 = await tokensDeImagen(img, p => avance?.(50 + Math.round(p / 2)), true); c2 = interpretar(t2); } catch (e) { console.warn(e); }
    return sesionesDe(c2) > sesionesDe(c1) ? { clases: c2, tokens: t2 } : { clases: c1, tokens: t1.length ? t1 : t2 };
  }
  /* convierte las páginas del PDF en imagen (para cuando el horario viene como dibujo o foto dentro del PDF) */
  async function pdfAImagenes(blob) {
    const lib = await VISOR.cargarPdfjs(), doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise, out = [];
    for (let n = 1; n <= Math.min(doc.numPages, 2); n++) { const pg = await doc.getPage(n), v = pg.getViewport({ scale: 2.5 }), cv = document.createElement('canvas'); cv.width = v.width; cv.height = v.height; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); await pg.render({ canvasContext: cx, viewport: v }).promise; out.push(await new Promise(r => cv.toBlob(r, 'image/png'))); }
    return out;
  }
  async function leer(blob, nombre, avance) {
    const esPdf = /pdf/.test(blob.type) || /\.pdf$/i.test(nombre || '');
    if (esPdf) {
      const tt = await tokensDePdf(blob), c1 = interpretar(tt);
      if (c1.length) return { clases: c1, tokens: tt.length, texto: tt.map(k => k.t).join(' ').slice(0, 600) };
      /* el horario no venía como texto: se lee la página como imagen */
      avance?.(0); let clases = [], todo = [];
      for (const img of await pdfAImagenes(blob)) { const r = await leerImagen(img, avance); todo = todo.concat(r.tokens); r.clases.forEach(c => { const y = clases.find(x => x.materia.toLowerCase() === c.materia.toLowerCase()); if (y) c.sesiones.forEach(s => y.sesiones.some(z => z.d === s.d && z.ini === s.ini) || y.sesiones.push(s)); else clases.push(c); }); }
      return { clases, tokens: todo.length, texto: todo.map(k => k.t).join(' ').slice(0, 600) };
    }
    const r = await leerImagen(blob, avance);
    return { clases: r.clases, tokens: r.tokens.length, texto: r.tokens.map(k => k.t).join(' ').slice(0, 600) };
  }
  return { leer, interpretar, rangos };
})();
if (typeof module !== 'undefined') module.exports = LECTOR_HORARIO;

/* ---------- pantalla: leer y revisar antes de guardar ---------- */
if (typeof ACC !== 'undefined') {
  ACC.leerHorario = () => abrirHoja(`<div class="pila"><h2>Leer mi horario</h2><p class="peq gris" style="margin:0">Sube el <b>PDF</b> de tu horario (lo más confiable) o una <b>captura</b> clara. Antes de guardar te mostramos lo que leímos para que lo corrijas.</p>
    <label class="btn ancho" style="cursor:pointer">${icono('subir', 18)}Elegir PDF o imagen<input type="file" accept=".pdf,image/*" class="oculto" data-cambio="archivoLeerHorario"></label>
    ${DB.yo().horarioFoto ? `<button class="btn3 ancho" data-a="leerFotoHorario">Usar la ${/pdf/.test(DB.yo().horarioFoto.mime || '') ? 'que' : 'foto que'} ya subiste</button>` : ''}<p class="mini gris" id="leyendo" style="margin:0"></p></div>`);
  const procesar = async (blob, nombre) => {
    const e = $('#leyendo'); if (e) e.textContent = /pdf/.test(blob.type) || /\.pdf$/i.test(nombre) ? 'Leyendo el PDF…' : 'Leyendo la imagen (la primera vez tarda un poco)…';
    try { const r = await LECTOR_HORARIO.leer(blob, nombre, p => { const x = $('#leyendo'); if (x) x.textContent = `Leyendo la imagen… ${p}%`; });
      if (!r.clases.length) { const x = $('#leyendo'); if (x) x.innerHTML = (r.tokens ? 'Leímos texto pero no encontramos los días (Lunes, Martes…) para armar el horario.' : 'No pudimos leer texto en el archivo. Prueba con el PDF o una captura más clara.') + (r.texto ? `<details style="margin-top:8px"><summary>Ver lo que leímos</summary><p class="mini" style="white-space:pre-wrap">${esc(r.texto)}</p></details>` : ''); return; }
      UI.leido = r.clases; revisarLeido(); }
    catch (err) { console.warn(err); const x = $('#leyendo'); if (x) x.textContent = 'No se pudo leer (revisa tu internet).'; }
  };
  CAMBIOS.archivoLeerHorario = el => { const f = el.files[0]; el.value = ''; if (f) procesar(f, f.name); };
  ACC.leerFotoHorario = async () => { const f = DB.yo().horarioFoto, b = await ARCHIVOS.leer(f.clave).catch(() => null); if (!b) return aviso('No se pudo abrir el archivo.'); procesar(b, f.nombre); };
  const NOMBRES = { lu: 'Lun', ma: 'Mar', mi: 'Mié', ju: 'Jue', vi: 'Vie', sa: 'Sáb' };
  function revisarLeido() {
    const l = UI.leido;
    abrirHoja(`<form class="pila" data-form="guardarLeido"><h2>Esto leímos</h2><p class="peq gris" style="margin:0">Corrige los nombres, quita lo que no sea clase y guarda.</p>
      ${l.map((c, i) => `<div class="tarjeta" style="box-shadow:none;border:1.5px solid var(--linea);padding:10px"><div class="fila" style="flex-wrap:nowrap"><label class="oculto" for="lm${i}">Materia</label><input id="lm${i}" name="m${i}" value="${esc(c.materia)}" style="flex:1"><label class="fila peq" style="flex-wrap:nowrap"><input type="checkbox" name="usar${i}" checked> Usar</label></div>
        <p class="mini gris" style="margin:6px 0 0">${c.sesiones.map(s => `${NOMBRES[s.d]} ${s.ini}–${s.fin}`).join(' · ')}${c.salon ? ' · ' + esc(c.salon) : ''}</p></div>`).join('')}
      <label class="fila peq"><input type="checkbox" name="reemplazar" ${(DB.yo().horario || []).length ? '' : 'checked'}> Reemplazar las clases que ya tengo</label>
      <button class="btn ancho">Guardar en mi horario</button></form>`);
  }
  FORMS.guardarLeido = d => {
    const u = DB.yo(), base = d.reemplazar ? [] : normalizarHorario(u), nuevas = UI.leido.map((c, i) => d['usar' + i] ? { id: uid('cl'), materia: (d['m' + i] || c.materia).trim().slice(0, 60), salon: c.salon || '', color: COLORES_CLASE[(base.length + i) % COLORES_CLASE.length], sesiones: c.sesiones } : null).filter(Boolean);
    u.horario = base.concat(nuevas); DB.guardar(); cerrarHoja(); aviso(`${nuevas.length} clases agregadas. Tócalas para ajustar lo que haga falta.`); refrescar();
  };
}
