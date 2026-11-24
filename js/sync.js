'use strict';
const SYNC = (() => {
  const CFG = CONFIG.supabase || {};
  const activo = !!(CFG.url && CFG.clave);
  const CLAVE_META = 'cdu_sync_v1';

  const COLS = ['posts', 'propuestas', 'rankings', 'eventos', 'ventas', 'chats', 'agenda', 'niveles', 'profes', 'notifs', 'reportes', 'libro', 'jugadas', 'bitacora', 'tablones', 'tablonItems', 'lugares', 'lugaresPend', 'profesPend', 'escuchas', 'triviaPro', 'dirProfes', 'salasVR'];
  const MAPAS = ['usuarios'];
  const LOCALES = ['sesion', 'version', 'semilla'];

  const SUB = {
    chats: { mensajes: 'a', leido: 'm', vaciado: 'm', quitado: 'm' },
    posts: { comentarios: 'a', likes: 'p' },
    propuestas: { apuestas: 'a', votos: 'm', apuntados: 'p', aclaraciones: 'a' },
    rankings: { votos: 'm' },
    profes: { opiniones: 'a' },
    tablonItems: { apuntados: 'p', vieron: 'p' },
    salasVR: { aceptados: 'p', rechazados: 'p', propias: 'a', historial: 'a' },
    usuarios: { amigos: 'p', solicitudes: 'p', notitas: 'a' }
  };
  let meta = { url: '', cursor: 0, hechos: {}, campos: {} }, listo = false, subiendo = false, otraVez = false, temporizador = null, sondeo = null, pendientes = {}, pintarLuego = false;

  const estable = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(estable).join(',') + ']' : '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + estable(v[k])).join(',') + '}';
  const hash = s => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36); };
  const enc = encodeURIComponent, dec = decodeURIComponent;
  const cab = extra => ({ apikey: CFG.clave, 'Content-Type': 'application/json', ...extra });
  const guardarMeta = () => { try { localStorage.setItem(CLAVE_META, JSON.stringify(meta)); } catch {} };
  const ordenar = arr => arr.sort((a, b) => String(a.f || a.fecha || '').localeCompare(String(b.f || b.fecha || '')) || String(a.id).localeCompare(String(b.id)));

  function filas() {
    const R = new Map();
    const item = (col, it, id) => {
      const subs = SUB[col] || {}, padre = {};
      Object.keys(it).forEach(k => { if (!(k in subs)) padre[k] = it[k]; });
      R.set(enc(col) + '/' + enc(id), { col, datos: padre });
      Object.entries(subs).forEach(([f, t]) => {
        const v = it[f]; if (v == null) return; const base = enc(col) + '/' + enc(id) + '/' + enc(f) + '/';
        if (t === 'a' && Array.isArray(v)) v.forEach(el => { if (el && typeof el === 'object') { if (!el.id) el.id = uid('e'); R.set(base + enc(el.id), { col, datos: el }); } });
        else if (t === 'p' && Array.isArray(v)) v.forEach(x => R.set(base + enc(String(x)), { col, datos: { v: x } }));
        else if (t === 'm' && typeof v === 'object') Object.entries(v).forEach(([k, x]) => R.set(base + enc(k), { col, datos: { v: x } }));
      });
    };
    COLS.forEach(col => (E[col] || []).forEach(it => { if (!it || typeof it !== 'object') return; if (!it.id) it.id = uid('x'); item(col, it, it.id); }));
    MAPAS.forEach(col => Object.entries(E[col] || {}).forEach(([id, it]) => item(col, it, id)));
    Object.keys(E).forEach(k => { if (!COLS.includes(k) && !MAPAS.includes(k) && !LOCALES.includes(k)) R.set('meta/' + enc(k), { col: 'meta', datos: { v: E[k] } }); });
    return R;
  }

  function buscar(col, id) { if (MAPAS.includes(col)) return E[col]?.[id]; return (E[col] || []).find(x => x.id === id); }
  const esPerfil = k => k.startsWith('usuarios/') && k.split('/').length === 2;
  const camposDe = d => { const o = {}; Object.keys(d || {}).forEach(f => { o[f] = hash(estable(d[f])); }); return o; };
  const idDe = x => x && typeof x === 'object' ? (x.id || x.archivo || x.enlace || x.clave || estable(x)) : estable(x);
  function fusionar(loc, rem, base) {
    const M = { ...rem };
    new Set([...Object.keys(loc || {}), ...Object.keys(rem || {})]).forEach(f => {
      const hl = hash(estable(loc?.[f])), hr = hash(estable(rem?.[f])), hb = base?.[f];
      if (hl === hr) return;
      if (hb !== undefined && hl === hb) { M[f] = rem?.[f]; return; }
      if (hb !== undefined && hr === hb) { M[f] = loc?.[f]; return; }
      if (Array.isArray(loc?.[f]) && Array.isArray(rem?.[f]) && hb === undefined) { const vistos = new Set(rem[f].map(idDe)); M[f] = [...rem[f], ...loc[f].filter(x => !vistos.has(idDe(x)))]; return; }
      if (rem?.[f] === undefined) M[f] = loc?.[f];
    });
    if (Array.isArray(M.canciones)) M.canciones = M.canciones.slice(0, 8);
    return M;
  }
  function aplicar(fila) {
    const seg = fila.k.split('/').map(dec), [col, id, f, el] = seg;
    if (col === 'meta') { if (fila.borrado) delete E[id]; else E[id] = fila.datos?.v; return true; }
    if (!COLS.includes(col) && !MAPAS.includes(col)) return false;
    const subs = SUB[col] || {};
    if (seg.length === 2) {
      const viejo = buscar(col, id);
      if (fila.borrado) {
        if (!viejo) return false;
        if (MAPAS.includes(col)) delete E[col][id]; else E[col] = E[col].filter(x => x.id !== id);
        const pref = enc(col) + '/' + enc(id) + '/'; Object.keys(meta.hechos).forEach(k => { if (k.startsWith(pref)) meta.hechos[k] = 'X'; });
        return true;
      }
      const nuevo = { ...fila.datos };
      Object.entries(subs).forEach(([sf, t]) => { nuevo[sf] = viejo?.[sf] ?? (t === 'm' ? {} : []); });
      if (MAPAS.includes(col)) { E[col] = E[col] || {}; E[col][id] = nuevo; }
      else { E[col] = E[col] || []; const i = E[col].findIndex(x => x.id === id); if (i >= 0) E[col][i] = nuevo; else E[col].push(nuevo); }
      (pendientes[col + '/' + id] || []).forEach(aplicar); delete pendientes[col + '/' + id];
      return true;
    }
    const it = buscar(col, id);
    if (!it) { (pendientes[col + '/' + id] = pendientes[col + '/' + id] || []).push(fila); return false; }
    const t = subs[f]; if (!t) return false;
    if (t === 'a') { const a = it[f] = it[f] || []; const i = a.findIndex(x => String(x.id) === el); if (fila.borrado) { if (i >= 0) a.splice(i, 1); } else { if (i >= 0) a[i] = fila.datos; else a.push(fila.datos); ordenar(a); } }
    else if (t === 'p') { const a = it[f] = it[f] || []; const v = fila.datos?.v ?? el; const i = a.findIndex(x => String(x) === el); if (fila.borrado) { if (i >= 0) a.splice(i, 1); } else if (i < 0) a.push(v); }
    else { const m = it[f] = it[f] || {}; if (fila.borrado) delete m[el]; else m[el] = fila.datos?.v; }
    return true;
  }

  async function bajar(desde) {
    const todas = []; let ultimo = desde;
    for (let vuelta = 0; vuelta < 200; vuelta++) {
      const r = await fetch(`${CFG.url}/rest/v1/objetos?select=k,col,datos,borrado,seq&seq=gt.${Math.max(0, ultimo)}&order=seq.asc&limit=1000`, { headers: cab() });
      if (!r.ok) throw new Error('bajar ' + r.status + ' ' + (await r.text()).slice(0, 200));
      const l = await r.json(); todas.push(...l); if (l.length) ultimo = l.at(-1).seq; if (l.length < 1000) break;
    }
    return todas;
  }
  async function enviar(lote) {
    for (let i = 0; i < lote.length; i += 400) {
      const r = await fetch(`${CFG.url}/rest/v1/objetos?on_conflict=k`, { method: 'POST', headers: cab({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(lote.slice(i, i + 400)) });
      if (!r.ok) throw new Error('subir ' + r.status + ' ' + (await r.text()).slice(0, 200));
    }
  }

  async function subir() {
    if (!activo || !listo) return;
    if (subiendo) { otraVez = true; return; }
    subiendo = true;
    try {
      const R = filas(), lote = [], nuevos = {};
      R.forEach((v, k) => { const h = hash(estable(v.datos)); if (meta.hechos[k] !== h) { lote.push({ k, col: v.col, datos: v.datos, borrado: false }); nuevos[k] = h; } });
      Object.keys(meta.hechos).forEach(k => { if (!R.has(k) && meta.hechos[k] !== 'X') { lote.push({ k, col: k.split('/')[0], datos: null, borrado: true }); nuevos[k] = 'X'; } });
      if (lote.length) { await enviar(lote); Object.assign(meta.hechos, nuevos); lote.forEach(f => { if (esPerfil(f.k)) { if (f.borrado) delete meta.campos[f.k]; else meta.campos[f.k] = camposDe(f.datos); } }); guardarMeta(); }
      estado('ok');
    } catch (e) { console.warn('[sync]', e); estado('error'); }
    subiendo = false;
    if (otraVez) { otraVez = false; setTimeout(subir, 50); }
  }

  async function traer() {
    if (!activo || !listo || subiendo) return;
    try {
      const l = await bajar(meta.cursor - 200); let cambio = false, fusiono = false;
      const locales = filas();
      l.sort((a, b) => a.k.split('/').length - b.k.split('/').length || a.seq - b.seq).forEach(f => {
        const h = f.borrado ? 'X' : hash(estable(f.datos));
        meta.cursor = Math.max(meta.cursor, f.seq);
        if (meta.hechos[f.k] === h) return;
        const loc = locales.get(f.k), hl = loc ? hash(estable(loc.datos)) : 'X';
        if (hl !== (meta.hechos[f.k] ?? 'X') && hl !== h) {
          if (!esPerfil(f.k) || f.borrado || !loc) return;
          const M = fusionar(loc.datos, f.datos, meta.campos[f.k]);
          if (aplicar({ ...f, datos: M })) { meta.hechos[f.k] = h; meta.campos[f.k] = camposDe(f.datos); cambio = true; fusiono = true; }
          return;
        }
        if (aplicar(f)) { meta.hechos[f.k] = h; if (esPerfil(f.k)) meta.campos[f.k] = camposDe(f.datos); cambio = true; }
      });
      guardarMeta();
      if (cambio) { DB.guardarSoloLocal(); repintar(); if (fusiono) programar(); }
      estado('ok');
    } catch (e) { console.warn('[sync]', e); estado('error'); }
  }

  function repintar() {
    const r = ruta(), escribiendo = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName), hoja = document.getElementById('velo');
    if (['juego', 'herramientas', 'redes', 'comprar-ramitas', 'editar-perfil'].includes(r.nombre) || escribiendo || hoja || document.querySelector('.principal iframe')) { pintarLuego = true; actualizarChip?.(); return; }
    pintarLuego = false; const y = scrollY; pintar(); scrollTo(0, y);
  }
  function estado(e) { document.documentElement.dataset.sync = e; }

  async function iniciar() {
    if (!activo) return;
    try { meta = JSON.parse(localStorage.getItem(CLAVE_META) || 'null') || meta; } catch {}
    if (meta.url !== CFG.url) meta = { url: CFG.url, cursor: 0, hechos: {}, campos: {} };
    meta.campos = meta.campos || {};
    const tapa = document.createElement('div'); tapa.className = 'tapa-sync'; tapa.innerHTML = `<div>${castor(64)}<p>Conectando…</p></div>`; document.body.appendChild(tapa);
    const quitarTapa = () => tapa.remove();
    const limite = setTimeout(() => { quitarTapa(); aviso('Sin conexión: lo que hagas se sube cuando vuelva el internet.'); }, 9000);
    try {
      const l = await bajar(0);
      if (!meta.cursor) {
        if (l.length) {
          const sesion = E.sesion, vacio = datosIniciales(); COLS.forEach(c => vacio[c] = []); MAPAS.forEach(c => vacio[c] = {});
          E = vacio; E.version = DB.VERSION; E.sesion = sesion; meta.hechos = {};
          l.sort((a, b) => a.k.split('/').length - b.k.split('/').length || a.seq - b.seq).forEach(f => { if (aplicar(f)) { meta.hechos[f.k] = f.borrado ? 'X' : hash(estable(f.datos)); if (esPerfil(f.k) && !f.borrado) meta.campos[f.k] = camposDe(f.datos); } meta.cursor = Math.max(meta.cursor, f.seq); });
          if (E.sesion && !E.usuarios[E.sesion]) E.sesion = null;
          DB.completar();
        }
        listo = true; guardarMeta(); DB.guardarSoloLocal();
        await subir();
      } else {
        listo = true; await traer(); await subir();
      }
      DB.alEntrar(); pintar();
    } catch (e) { console.warn('[sync]', e); estado('error'); listo = true; aviso('No se pudo conectar con el servidor. Revisa tu internet.'); }
    clearTimeout(limite); quitarTapa();
    sondeo = setInterval(() => { if (!document.hidden) traer(); }, 3000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) traer(); });
    document.addEventListener('focusout', () => setTimeout(() => { if (pintarLuego) repintar(); }, 300));
    document.addEventListener('click', () => setTimeout(() => { if (pintarLuego) repintar(); }, 400));
  }
  function programar() { if (!activo) return; clearTimeout(temporizador); temporizador = setTimeout(subir, 250); }

  async function subirArchivo(clave, blob) {
    if (!activo) return false;
    try { const r = await fetch(`${CFG.url}/storage/v1/object/archivos/${clave.split('/').map(enc).join('/')}`, { method: 'POST', headers: { apikey: CFG.clave, 'Content-Type': blob.type || 'application/octet-stream', 'x-upsert': 'true' }, body: blob }); if (!r.ok) console.warn('[sync] archivo', r.status, await r.text()); return r.ok; }
    catch (e) { console.warn('[sync] archivo', e); return false; }
  }
  async function bajarArchivo(clave) {
    if (!activo) return null;
    try { const r = await fetch(`${CFG.url}/storage/v1/object/public/archivos/${clave.split('/').map(enc).join('/')}`); return r.ok ? await r.blob() : null; } catch { return null; }
  }
  return { activo, iniciar, programar, subir, traer, subirArchivo, bajarArchivo, get listo() { return listo; } };
})();
