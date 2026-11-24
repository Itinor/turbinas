'use strict';
const CRIPTO = (() => {
  const S = crypto.subtle, enc = new TextEncoder(), dec = new TextDecoder(), ITER = 310000;
  const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const deb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const azar = n => crypto.getRandomValues(new Uint8Array(n));
  const ECDH = { name: 'ECDH', namedCurve: 'P-256' }, ECDSA = { name: 'ECDSA', namedCurve: 'P-256' }, FIRMA = { name: 'ECDSA', hash: 'SHA-256' };
  let priv = null, privDe = null, privPub = null, firma = null;
  const pares = new Map(), cache = new Map(), enCurso = new Set();
  const archivos = new Map();

  let _db = null;
  const idb = () => _db || (_db = new Promise((ok, mal) => { const r = indexedDB.open('itinor_llaves', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); }));
  const idbPut = async (k, v) => { const db = await idb(); return new Promise((ok, mal) => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(v, k); t.oncomplete = ok; t.onerror = () => mal(t.error); }); };
  const idbGet = async k => { const db = await idb(); return new Promise((ok, mal) => { const r = db.transaction('k').objectStore('k').get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => mal(r.error); }); };
  const idbDel = async k => { const db = await idb(); return new Promise(ok => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').delete(k); t.oncomplete = ok; t.onerror = ok; }); };

  async function derivar(pass, sal, iter = ITER) {
    const base = await S.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await S.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iter }, base, 512));
    return { verif: b64(bits.slice(0, 32)), envoltura: await S.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']) };
  }
  const iguales = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
  async function revisarClave(u, pass) {
    if (!u || !pass) return false;
    if (u.cripto?.h) { const d = await derivar(pass, deb64(u.cripto.s), u.cripto.i || ITER); return iguales(d.verif, u.cripto.h); }
    return !!u.clave && u.clave === hashClave(pass);
  }
  const huella = jwk => jwk ? jwk.x + '.' + jwk.y : '';
  const soloPub = j => ({ kty: j.kty, crv: j.crv, x: j.x, y: j.y });
  async function nuevaFirma(u, envoltura) {
    const par = await S.generateKey(ECDSA, true, ['sign', 'verify']), pub = await S.exportKey('jwk', par.publicKey), pk8 = await S.exportKey('pkcs8', par.privateKey), iv = azar(12);
    const ct = await S.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode('itinor-firma:' + u.id) }, envoltura, pk8);
    u.cripto.fpub = soloPub(pub); u.cripto.fpriv = { iv: b64(iv), ct: b64(ct) };
    return S.importKey('pkcs8', pk8, ECDSA, false, ['sign']);
  }
  async function abrirFirma(u, envoltura) {
    if (!u.cripto.fpriv) { const k = await nuevaFirma(u, envoltura); DB.guardar(); return k; }
    const pk8 = await S.decrypt({ name: 'AES-GCM', iv: deb64(u.cripto.fpriv.iv), additionalData: enc.encode('itinor-firma:' + u.id) }, envoltura, deb64(u.cripto.fpriv.ct));
    return S.importKey('pkcs8', pk8, ECDSA, false, ['sign']);
  }

  async function crear(u, pass) {
    const sal = azar(16), d = await derivar(pass, sal), par = await S.generateKey(ECDH, true, ['deriveBits']);
    const pub = await S.exportKey('jwk', par.publicKey), pk8 = await S.exportKey('pkcs8', par.privateKey), iv = azar(12);
    const ct = await S.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode('itinor-llave:' + u.id) }, d.envoltura, pk8);
    u.cripto = { v: 1, s: b64(sal), i: ITER, h: d.verif, pub: { kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }, priv: { iv: b64(iv), ct: b64(ct) }, f: new Date().toISOString() };
    const fk = await nuevaFirma(u, d.envoltura);
    delete u.clave; DB.guardar();
    await guardarLocal(u, await S.importKey('pkcs8', pk8, ECDH, false, ['deriveBits']), fk);
  }
  async function abrirConClave(u, pass) {
    if (!u.cripto?.priv) return crear(u, pass);
    const d = await derivar(pass, deb64(u.cripto.s), u.cripto.i || ITER);
    if (!iguales(d.verif, u.cripto.h)) throw new Error('clave');
    const pk8 = await S.decrypt({ name: 'AES-GCM', iv: deb64(u.cripto.priv.iv), additionalData: enc.encode('itinor-llave:' + u.id) }, d.envoltura, deb64(u.cripto.priv.ct));
    const fk = await abrirFirma(u, d.envoltura);
    await guardarLocal(u, await S.importKey('pkcs8', pk8, ECDH, false, ['deriveBits']), fk);
  }
  async function guardarLocal(u, k, fk) { priv = k; firma = fk || null; privDe = u.id; privPub = huella(u.cripto.pub); pares.clear(); cache.clear(); await idbPut(u.id, { k, pub: privPub, fk: firma, fpub: huella(u.cripto.fpub) }).catch(() => {}); }

  async function iniciar() {
    const u = DB.yo(); if (!u) return; if (privDe === u.id && privPub === huella(u.cripto?.pub)) return;
    priv = null; firma = null; privDe = null; pares.clear(); cache.clear();
    const g = await idbGet(u.id).catch(() => null);
    if (g && u.cripto && g.pub === huella(u.cripto.pub)) { priv = g.k; privDe = u.id; privPub = g.pub; if (g.fk && u.cripto.fpub && g.fpub === huella(u.cripto.fpub)) firma = g.fk; }
    else if (g) await idbDel(u.id);
  }
  const listo = () => !!priv && privDe === DB.yo()?.id && privPub === huella(DB.yo()?.cripto?.pub);
  async function olvidar(id = DB.yo()?.id) { priv = null; firma = null; privDe = null; pares.clear(); cache.clear(); if (id) await idbDel(id).catch(() => {}); }

  async function llavePar(otroId, pubJwk) {
    const k = otroId + '|' + huella(pubJwk); if (pares.has(k)) return pares.get(k);
    const p = (async () => {
      const pub = await S.importKey('jwk', { kty: 'EC', crv: 'P-256', x: pubJwk.x, y: pubJwk.y, ext: true }, ECDH, false, []);
      const bits = await S.deriveBits({ name: 'ECDH', public: pub }, priv, 256), base = await S.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
      const ids = [privDe, otroId].sort().join('|');
      return S.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('itinor-par-v1:' + ids), info: enc.encode('mensajes') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    })();
    pares.set(k, p); return p;
  }

  const sinLlave = c => c.miembros.filter(m => !DB.usuario(m)?.cripto?.pub);
  async function cifrarMensaje(c, carga) {
    if (!listo()) throw new Error('bloqueado');
    const mk = azar(32), llave = await S.importKey('raw', mk, 'AES-GCM', false, ['encrypt']), iv = azar(12), aad = enc.encode('itinor-msg:' + c.id + ':' + privDe);
    const ct = await S.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, llave, enc.encode(JSON.stringify(carga)));
    const k = {};
    for (const m of c.miembros) { const pub = DB.usuario(m)?.cripto?.pub; if (!pub) continue; const kiv = azar(12);
      k[m] = { iv: b64(kiv), ct: b64(await S.encrypt({ name: 'AES-GCM', iv: kiv, additionalData: aad }, await llavePar(m, pub), mk)) }; }
    const e = { v: 1, iv: b64(iv), ct: b64(ct), k, pub: { x: DB.yo().cripto.pub.x, y: DB.yo().cripto.pub.y } };
    if (firma && DB.yo().cripto.fpub) { e.sig = b64(await S.sign(FIRMA, firma, textoFirma(c.id, privDe, e.iv, e.ct))); e.fpub = { x: DB.yo().cripto.fpub.x, y: DB.yo().cripto.fpub.y }; }
    return e;
  }
  const textoFirma = (chat, u, iv, ct) => enc.encode('itinor-firma-v1|' + chat + '|' + u + '|' + iv + '|' + ct);
  async function revisarFirma(chat, u, e) {
    if (!e.sig || !e.fpub) return 'sin';
    try { const pub = await S.importKey('jwk', { kty: 'EC', crv: 'P-256', x: e.fpub.x, y: e.fpub.y, ext: true }, ECDSA, false, ['verify']);
      return await S.verify(FIRMA, pub, deb64(e.sig), textoFirma(chat, u, e.iv, e.ct)) ? 'ok' : 'mala'; } catch { return 'mala'; }
  }
  const claveCache = (c, m) => c.id + '|' + m.u + '|' + m.f;
  async function descifrarMensaje(c, m) {
    const e = m.e, mio = e.k?.[privDe]; if (!mio) return { error: 'No se cifró para ti (entraste al chat después).' };
    const aad = enc.encode('itinor-msg:' + c.id + ':' + m.u);
    const mk = await S.decrypt({ name: 'AES-GCM', iv: deb64(mio.iv), additionalData: aad }, await llavePar(m.u, e.pub), deb64(mio.ct));
    const llave = await S.importKey('raw', mk, 'AES-GCM', false, ['decrypt']);
    const carga = JSON.parse(dec.decode(await S.decrypt({ name: 'AES-GCM', iv: deb64(e.iv), additionalData: aad }, llave, deb64(e.ct))));
    if (carga.adjunto?.fk) archivos.set(carga.adjunto.clave, { fk: carga.adjunto.fk, fiv: carga.adjunto.fiv, mime: carga.adjunto.mime });
    const real = DB.usuario(m.u)?.cripto?.pub, firmaEst = await revisarFirma(c.id, m.u, e);
    return { ...carga, llaveDistinta: !!real && (real.x !== e.pub.x || real.y !== e.pub.y), firma: firmaEst, _mk: b64(mk) };
  }

  let repintar = null;
  function leer(c, m) {
    const k = claveCache(c, m); if (cache.has(k)) return cache.get(k);
    if (listo() && !enCurso.has(k)) { enCurso.add(k);
      descifrarMensaje(c, m).catch(() => ({ error: 'No se pudo descifrar.' })).then(r => { cache.set(k, r); enCurso.delete(k); clearTimeout(repintar); repintar = setTimeout(() => typeof refrescar === 'function' && refrescar(), 60); }); }
    return null;
  }

  async function cifrarArchivo(blob) {
    const fk = azar(32), fiv = azar(12), llave = await S.importKey('raw', fk, 'AES-GCM', false, ['encrypt']);
    const ct = await S.encrypt({ name: 'AES-GCM', iv: fiv }, llave, await blob.arrayBuffer());
    return { cifrado: new Blob([ct], { type: 'application/octet-stream' }), fk: b64(fk), fiv: b64(fiv) };
  }
  async function descifrarArchivo(clave, blob) {
    const a = archivos.get(clave), llave = await S.importKey('raw', deb64(a.fk), 'AES-GCM', false, ['decrypt']);
    return new Blob([await S.decrypt({ name: 'AES-GCM', iv: deb64(a.fiv) }, llave, await blob.arrayBuffer())], { type: a.mime || '' });
  }

  const leerOriginal = ARCHIVOS.leer.bind(ARCHIVOS);
  ARCHIVOS.leer = async function (clave) {
    if (!archivos.has(clave)) return leerOriginal(clave);
    const l = await this.leerLocal(clave).catch(() => null); if (l) return l;
    if (typeof SYNC === 'undefined' || !SYNC.activo) return null;
    const b = await SYNC.bajarArchivo(clave); if (!b) return null;
    const plano = await descifrarArchivo(clave, b); this.guardarLocal(clave, plano).catch(() => {}); return plano;
  };
  async function guardarArchivoCifrado(clave, blob) {
    const r = await cifrarArchivo(blob); await ARCHIVOS.guardarLocal(clave, blob);
    if (typeof SYNC !== 'undefined' && SYNC.activo) await SYNC.subirArchivo(clave, r.cifrado);
    archivos.set(clave, { fk: r.fk, fiv: r.fiv, mime: blob.type }); return { fk: r.fk, fiv: r.fiv };
  }

  async function codigo(a, b) {
    const ua = DB.usuario(a), ub = DB.usuario(b); if (!ua?.cripto?.pub || !ub?.cripto?.pub) return null;
    const partes = [[a, ua.cripto.pub], [b, ub.cripto.pub]].sort((x, y) => x[0].localeCompare(y[0])).map(([id, p]) => id + ':' + p.x + ':' + p.y).join('|');
    const h = new Uint8Array(await S.digest('SHA-256', enc.encode('itinor-codigo-v1|' + partes)));
    let n = ''; for (let i = 0; i < 30; i += 5) { const v = ((h[i] << 24) >>> 0) + (h[i + 1] << 16) + (h[i + 2] << 8) + h[i + 3]; n += String(v % 100000).padStart(5, '0') + ' '; }
    return n.trim();
  }
  const VERIF = 'itinor_verificados';
  const verificados = () => { try { return JSON.parse(localStorage.getItem(VERIF) || '{}'); } catch { return {}; } };
  function marcarVerificado(id, si = true) { const v = verificados(), k = DB.yo().id + '>' + id; if (si) v[k] = huella(DB.usuario(id)?.cripto?.pub); else delete v[k]; try { localStorage.setItem(VERIF, JSON.stringify(v)); } catch {} }

  function estadoVerif(id) { const f = verificados()[DB.yo().id + '>' + id]; if (!f) return null; return f === huella(DB.usuario(id)?.cripto?.pub) ? 'si' : 'cambio'; }

  function prueba(c, m) {
    const x = cache.get(claveCache(c, m)); if (!x || x.error || !x._mk || !m.e) return null;
    return { chat: c.id, u: m.u, f: m.f, iv: m.e.iv, ct: m.e.ct, sig: m.e.sig || null, fpub: m.e.fpub || null, mk: x._mk };
  }
  async function sellarPrueba(repId, paraId, items) {
    if (!listo()) throw new Error('bloqueado');
    if (!DB.usuario(paraId)?.cripto?.pub) throw new Error('sin-llave-admin');
    return cifrarMensaje({ id: 'rep:' + repId, miembros: [privDe, paraId] }, { items });
  }
  async function abrirPrueba(r) {
    if (!listo()) throw new Error('bloqueado');
    const carga = await descifrarMensaje({ id: 'rep:' + r.id }, { u: r.por, e: r.prueba });
    const out = [];
    for (const it of carga.items || []) {
      const v = { u: it.u, f: it.f, chat: it.chat };
      try {
        const llave = await S.importKey('raw', deb64(it.mk), 'AES-GCM', false, ['decrypt']);
        const x = JSON.parse(dec.decode(await S.decrypt({ name: 'AES-GCM', iv: deb64(it.iv), additionalData: enc.encode('itinor-msg:' + it.chat + ':' + it.u) }, llave, deb64(it.ct))));
        v.t = x.t || ''; v.adjunto = x.adjunto ? x.adjunto.nombre : null; v.descifra = true;
      } catch { v.descifra = false; }
      v.firma = await revisarFirma(it.chat, it.u, it);
      const real = DB.usuario(it.u)?.cripto?.fpub; v.llaveCuenta = !!(real && it.fpub && real.x === it.fpub.x && real.y === it.fpub.y);
      const ch = DB.estado.chats.find(c => c.id === it.chat), orig = ch?.mensajes.find(m => m.u === it.u && m.f === it.f);
      v.enBase = !!(orig?.e && orig.e.ct === it.ct);
      v.valido = v.descifra && ((v.firma === 'ok' && v.llaveCuenta) || (v.firma === 'sin' && v.enBase));
      out.push(v);
    }
    return { items: out, falsas: carga.items?.length && out.some(v => !v.valido) };
  }
  const puedeFirmar = () => !!firma;

  return { prueba, sellarPrueba, abrirPrueba, puedeFirmar, revisarClave, abrirConClave, iniciar, listo, olvidar, sinLlave, cifrarMensaje, leer, guardarArchivoCifrado, esCifrado: k => archivos.has(k), codigo, marcarVerificado, estadoVerif, ITER };
})();
