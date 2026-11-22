/* Capa de datos y reglas de la red.
   Hoy guarda todo en el navegador (localStorage). Para pasar a un servidor (Supabase, Firebase…)
   solo hay que reescribir este archivo: las pantallas llaman a DB.* y no tocan el almacenamiento. */
'use strict';
const CLAVE = 'cosasdelauni_v8';
let E = null;

const DB = {
  cargar() {
    try { E = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { E = null; }
    if (!E || E.version !== this.VERSION) { E = datosIniciales(); E.version = this.VERSION; sembrarLibro(); if (!CONFIG.propuestasDemo) limpiarPropuestas(); if (!CONFIG.datosDemo) vaciarDemo(); try { localStorage.removeItem('cdu_sync_v1'); } catch {} this.guardarSoloLocal(); }
    this.completar();
    return E;
  },
  VERSION: 8,
  /* rellena lo que falte (cuentas del equipo, tablones fijos, listas vacías) */
  completar() {
    ['bitacora', 'jugadas', 'lugares', 'lugaresPend', 'profesPend', 'tablones', 'tablonItems', 'notifs', 'reportes', 'libro', 'posts', 'propuestas', 'rankings', 'eventos', 'ventas', 'chats', 'agenda', 'niveles', 'profes'].forEach(k => { if (!Array.isArray(E[k])) E[k] = []; });
    E.usuarios = E.usuarios || {}; asegurarEquipo(); asegurarTablones();
  },
  guardarSoloLocal() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) { console.warn('No se pudo guardar', e); } },
  guardar() { this.guardarSoloLocal(); if (typeof SYNC !== 'undefined') SYNC.programar(); },
  reiniciar() { localStorage.removeItem(CLAVE); E = null; this.cargar(); },
  get estado() { return E; },

  /* ---------- Sesión ---------- */
  yo() { return E.sesion ? E.usuarios[E.sesion] : null; },
  usuario(id) { return E.usuarios[id]; },
  porUsuario(nombre) { return Object.values(E.usuarios).find(u => u.usuario === String(nombre).replace(/^@/, '').toLowerCase()); },
  iniciarSesion(contacto, clave) {
    const c = String(contacto || '').trim().toLowerCase().replace(/\s+/g, ''), u = Object.values(E.usuarios).find(x => String(x.contacto || '').toLowerCase().replace(/\s+/g, '') === c || ('@' + x.usuario) === c || x.usuario === c.replace(/^@/, ''));
    if (!u || !u.clave || u.clave !== hashClave(clave)) return { error: 'Correo, número o contraseña incorrectos.' };
    if (u.equipo) return { error: 'Las cuentas del equipo entran con "Soy admin".' };
    this.entrar(u.id); return { ok: true };
  },
  entrar(id) { E.sesion = id; this.alEntrar(); this.guardar(); },
  salir() { E.sesion = null; this.guardar(); },
  usuarioDisponible(n) { const s = String(n).toLowerCase(); return /^[a-z0-9._]{3,20}$/.test(s) && !this.porUsuario(s); },
  registrar({ usuario, nombre, nombreVis, carrera, gen, semestre, documento, contacto, clave }) {
    const id = uid('u');
    const yoNuevo = { id, usuario: usuario.toLowerCase(), nombre, nombreVis, nombreElegidos: [], carrera, gen: gen || null, semestre: semestre || null,
      verificado: documento ? 'pendiente' : 'no', documento: documento || null, contacto, rol: 'estudiante', bio: '', cancion: null, playlists: [], insignias: [], ocultas: [],
      amigos: [], bloqueados: [], silenciados: [], privacidad: { escribir: 'todos', perfil: 'todos', venta: 'todos' }, ajustes: { musicaAuto: false, oscuro: false },
      horario: [], racha: { dias: 0, ultimo: null, semana: [] }, diarios: { fecha: null }, limites: { fecha: null }, reputacion: 0,
      dispositivo: dispositivoActual(), creado: new Date().toISOString() };
    if (clave) yoNuevo.clave = hashClave(clave);
    E.usuarios[id] = yoNuevo; E.sesion = id;
    mover(id, REGLAS.regaloBienvenida, 'regalo', 'bienvenida');
    if (documento) avisarAdmins(`@${yoNuevo.usuario} subió un documento para verificarse`, '#/admin');
    this.alEntrar(); this.guardar(); return yoNuevo;
  },
  alEntrar() { this.revisarArbitrajes();
    const u = this.yo(); if (!u) return;
    if (u.diarios.regalo !== fechaLocal()) { u.diarios.regalo = fechaLocal(); mover(u.id, REGLAS.regaloDiario, 'diario', 'regalo del día', null, `diario_${u.id}_${fechaLocal()}`); }
    this.miAgenda().forEach(a => { const d = diasHasta(a.fecha); if ([7, 3, 1, 0].includes(d) && !(a.hechoPor || {})[u.id]) { a.avisos = a.avisos || {}; const k = u.id + ':' + d; if (!a.avisos[k]) { a.avisos[k] = true; notificar(u.id, d === 0 ? `Hoy: ${a.titulo}` : `Faltan ${d} ${d === 1 ? 'día' : 'días'}: ${a.titulo}`, '#/agenda'); } } });
    this.guardar();
    if (u.ajustes.oscuro) document.documentElement.dataset.tema = 'oscuro'; else delete document.documentElement.dataset.tema;
  },
  esAdmin() { return this.yo()?.rol === 'admin'; },

  /* ---------- Ramitas ---------- */
  saldo(id = E.sesion) { return E.libro.reduce((s, m) => m.u === id ? s + m.monto : s, 0); },
  movimientos(id) { return E.libro.filter(m => m.u === id).slice().reverse(); },

  /* ---------- Privacidad ---------- */
  sonAmigos(a, b) { return a === b || !!E.usuarios[a]?.amigos.includes(b); },
  bloqueo(a, b) { return !!(E.usuarios[a]?.bloqueados.includes(b) || E.usuarios[b]?.bloqueados.includes(a)); },
  verNombreReal(dueno, quien = E.sesion) {
    const d = E.usuarios[dueno]; if (!d) return false; if (dueno === quien) return true;
    return d.nombreVis === 'todos' || (d.nombreVis === 'amigos' && this.sonAmigos(dueno, quien)) || (d.nombreVis === 'elegidos' && (d.nombreElegidos || []).includes(quien));
  },
  verPerfil(dueno, quien = E.sesion) {
    const d = E.usuarios[dueno]; if (!d || this.bloqueo(dueno, quien)) return false; if (dueno === quien) return true;
    return d.privacidad.perfil === 'todos' || (d.privacidad.perfil === 'amigos' && this.sonAmigos(dueno, quien));
  },
  puedeEscribir(dueno, quien = E.sesion) {
    const d = E.usuarios[dueno]; if (!d || dueno === quien || this.bloqueo(dueno, quien)) return false;
    return d.privacidad.escribir === 'todos' || (d.privacidad.escribir === 'amigos' && this.sonAmigos(dueno, quien));
  },
  alternarAmigo(id) { const yo = this.yo(), o = E.usuarios[id]; if (yo.amigos.includes(id)) { yo.amigos = yo.amigos.filter(x => x !== id); o.amigos = o.amigos.filter(x => x !== yo.id); } else { yo.amigos.push(id); o.amigos.push(yo.id); notificar(id, `@${yo.usuario} te agregó como amigo`, '#/perfil/' + yo.usuario); } this.guardar(); },
  bloquear(id) { const yo = this.yo(); if (!yo.bloqueados.includes(id)) yo.bloqueados.push(id); yo.amigos = yo.amigos.filter(x => x !== id); E.usuarios[id].amigos = E.usuarios[id].amigos.filter(x => x !== yo.id); this.guardar(); },
  desbloquear(id) { const yo = this.yo(); yo.bloqueados = yo.bloqueados.filter(x => x !== id); this.guardar(); },
  silenciar(id) { const yo = this.yo(); if (!yo.silenciados.includes(id)) yo.silenciados.push(id); this.guardar(); },
  /* varias canciones por perfil; la primera también queda como u.cancion */
  canciones(u = this.yo()) { if (!u) return []; if (!u.canciones) u.canciones = u.cancion ? [u.cancion] : []; return u.canciones; },
  guardarCanciones(lista) { const u = this.yo(); u.canciones = lista.slice(0, 8); u.cancion = u.canciones[0] || null; this.guardar(); },
  actualizarPerfil(cambios) { Object.assign(this.yo(), cambios); this.guardar(); },

  /* ---------- Publicaciones ---------- */
  feed() {
    const yo = this.yo();
    return E.posts.filter(p => !p.oculto && !E.usuarios[p.autor]?.suspendido && !this.bloqueo(p.autor, yo.id) && !yo.silenciados.includes(p.autor)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
  publicar(texto) { texto = texto.trim().slice(0, 1000); if (!texto) return; E.posts.push({ id: uid('post'), autor: E.sesion, texto, fecha: new Date().toISOString(), likes: [], comentarios: [] }); this.guardar(); },
  meGusta(id) { const p = E.posts.find(x => x.id === id); const i = p.likes.indexOf(E.sesion); if (i >= 0) p.likes.splice(i, 1); else { p.likes.push(E.sesion); if (p.autor !== E.sesion) notificar(p.autor, `A @${this.yo().usuario} le interesa tu publicación`, '#/inicio'); } this.guardar(); },
  comentar(id, texto) { texto = texto.trim().slice(0, 500); if (!texto) return; const p = E.posts.find(x => x.id === id); p.comentarios.push({ autor: E.sesion, texto, fecha: new Date().toISOString() }); if (p.autor !== E.sesion) notificar(p.autor, `@${this.yo().usuario} comentó tu publicación`, '#/inicio'); this.guardar(); },
  borrarPost(id) { const p = E.posts.find(x => x.id === id); if (p && (p.autor === E.sesion || this.esAdmin())) p.oculto = true; this.guardar(); },

  /* ---------- Reportes ---------- */
  reportar(tipo, ref, motivo) { E.reportes.push({ id: uid('rep'), por: E.sesion, tipo, ref, motivo, fecha: new Date().toISOString(), estado: 'abierto' }); avisarAdmins('Nuevo reporte: ' + motivo, '#/admin'); this.guardar(); },
  resolverReporte(id, accion) {
    const r = E.reportes.find(x => x.id === id); r.estado = accion;
    if (accion === 'quitado') { if (r.tipo === 'post') { const p = E.posts.find(x => x.id === r.ref); if (p) p.oculto = true; } if (r.tipo === 'ranking') { const k = E.rankings.find(x => x.id === r.ref); if (k) k.estado = 'quitado'; } }
    this.guardar();
  },

  /* ---------- Límites diarios (internos) ---------- */
  limites() { const u = this.yo(); if (u.limites.fecha !== fechaLocal()) u.limites = { fecha: fechaLocal(), propuestas: 0, encuestas: 0, apostado: 0, retos: 0 }; return u.limites; },

  /* ---------- Propuestas: predicciones, votaciones y actividades ---------- */
  crearPropuesta({ tipo, titulo, opciones, cierre, minutos, cupo }) {
    if (minutos) { minutos = Math.round(Number(minutos)); if (!(minutos >= REGLAS.duracionMin)) return { error: `La duración mínima es de ${REGLAS.duracionMin} minutos.` }; minutos = Math.min(minutos, REGLAS.duracionMax); cierre = new Date(Date.now() + minutos * 6e4).toISOString(); }
    else if (cierre && cierreMs(cierre) - Date.now() < REGLAS.duracionMin * 6e4) return { error: `Tiene que cerrar al menos en ${REGLAS.duracionMin} minutos.` };
    const L = this.limites();
    if (L.propuestas >= REGLAS.limitePropuestasDia) return { error: `Ya propusiste ${REGLAS.limitePropuestasDia} hoy. Mañana puedes más.` };
    titulo = titulo.trim().slice(0, 140); opciones = (opciones || []).map(o => String(o || '').trim()).filter(Boolean).slice(0, MAX_OPCIONES);
    if (titulo.length < 6) return { error: 'Escribe la pregunta completa.' };
    let nota = '';
    if (tipo === 'prediccion' && TEMAS_PRIVILEGIADOS.test(titulo)) { tipo = 'votacion'; nota = 'Como trata de algo que alguien de dentro podría saber, la publicamos como votación (sin ramitas).'; }
    if ((tipo === 'prediccion' || tipo === 'votacion') && opciones.length < 2) return { error: 'Pon al menos dos opciones.' };
    const p = { id: uid('pr'), tipo, titulo, autor: E.sesion, fecha: new Date().toISOString(), cierre: cierre || sumarDias(fechaLocal(), 3), opciones, apuestas: [], votos: {}, apuntados: tipo === 'actividad' ? [E.sesion] : [], cupo: tipo === 'actividad' ? Math.max(2, Number(cupo) || 10) : 0, estado: 'abierta' };
    E.propuestas.push(p); L.propuestas++; this.bitacora('creó', p); this.guardar(); return { ok: p, nota };
  },
  pozo(p) { return p.apuestas.reduce((s, a) => s + a.monto, 0); },
  pozoOpcion(p, i) { return p.apuestas.filter(a => a.op === i).reduce((s, a) => s + a.monto, 0); },
  multiplicador(p, i) { const t = this.pozo(p), o = this.pozoOpcion(p, i); return o ? (t * (1 - REGLAS.comisionFondo)) / o : null; },
  apostado(p, u = E.sesion) { return p.apuestas.filter(a => a.u === u).reduce((s, a) => s + a.monto, 0); },
  apostar(id, op, monto) {
    const p = E.propuestas.find(x => x.id === id), u = this.yo(), L = this.limites();
    monto = Math.floor(Number(monto));
    if (u.verificado !== 'si') return { error: 'verificar' };
    if (p.estado !== 'abierta' || yaCerro(p)) return { error: 'Esta predicción ya cerró.' };
    if (!(monto > 0)) return { error: 'Elige cuántas ramitas.' };
    const ya = p.apuestas.find(a => a.u === u.id); if (ya && ya.op !== op) return { error: 'Ya apostaste por la otra opción.' };
    if (this.apostado(p) + monto > REGLAS.maxPorPrediccion) return { error: `En esta predicción puedes poner hasta ${REGLAS.maxPorPrediccion - this.apostado(p)} más.` };
    if (L.apostado + monto > REGLAS.maxPrediccionDia) return { error: 'Por hoy ya no puedes poner más ramitas en predicciones.' };
    if (this.saldo() < monto) return { error: 'No te alcanzan las ramitas.' };
    p.apuestas.push({ u: u.id, op, monto, f: new Date().toISOString() }); L.apostado += monto;
    mover(u.id, -monto, 'apuesta', p.id); this.guardar(); return { ok: true };
  },
  votar(id, op) { const p = E.propuestas.find(x => x.id === id); if (yaCerro(p)) return { error: 'Esta votación ya cerró.' }; p.votos[E.sesion] = op; this.guardar(); return { ok: true }; },
  apuntarse(id) { const p = E.propuestas.find(x => x.id === id); const i = p.apuntados.indexOf(E.sesion); if (i >= 0) p.apuntados.splice(i, 1); else if (p.apuntados.length < p.cupo) { p.apuntados.push(E.sesion); if (p.apuntados.length === p.cupo) notificar(p.autor, `"${p.titulo}" ya llenó el cupo`, '#/propuestas'); } this.guardar(); },
  resolver(id, ganadora, como = 'admin') {
    const p = E.propuestas.find(x => x.id === id); if (!p || p.estado === 'resuelta' || p.estado === 'anulada') return;
    p.ganadora = ganadora; p.resueltaPor = como; this.premiarArbitros(p); this.bitacora(como === 'comunidad' ? 'se resolvió por la comunidad' : 'resolvió', p, p.opciones[ganadora]);
    const total = this.pozo(p), ganadores = p.apuestas.filter(a => a.op === ganadora), base = this.pozoOpcion(p, ganadora);
    if (!ganadores.length) { this.anular(id, 'Nadie acertó: se devolvieron las ramitas'); return; }
    const reparto = Math.floor(total * (1 - REGLAS.comisionFondo)); let pagado = 0;
    const porU = {}; ganadores.forEach(a => porU[a.u] = (porU[a.u] || 0) + a.monto);
    Object.entries(porU).forEach(([u, m]) => { const g = Math.floor(reparto * m / base); pagado += g; mover(u, g, 'ganancia', p.id); notificar(u, `Acertaste "${p.titulo}": +${g} ramitas`, '#/propuestas'); });
    mover('FONDO', total - pagado, 'comision', p.id);
    p.estado = 'resuelta'; p.ganadora = ganadora; this.guardar();
  },
  anular(id, motivo = 'La predicción se anuló y se devolvieron las ramitas') {
    const p = E.propuestas.find(x => x.id === id); const porU = {};
    p.apuestas.forEach(a => porU[a.u] = (porU[a.u] || 0) + a.monto);
    Object.entries(porU).forEach(([u, m]) => { mover(u, m, 'devolucion', p.id); notificar(u, `${motivo}: "${p.titulo}"`, '#/propuestas'); });
    p.estado = 'anulada'; p.resueltaPor = p.resueltaPor || 'admin'; this.bitacora('anuló', p, motivo); this.guardar();
  },
  /* ---------- Arbitraje ---------- */
  porArbitrar(p) { return p.tipo === 'prediccion' && p.estado === 'abierta' && yaCerro(p); },
  esGrande(p) { return p.tipo === 'prediccion' && this.pozo(p) >= REGLAS.pozoGrande; },
  bitacora(accion, p, extra = '') { (E.bitacora = E.bitacora || []).push({ f: new Date().toISOString(), u: E.sesion, accion, ref: p.id, titulo: p.titulo, extra: String(extra).slice(0, 200) }); if (E.bitacora.length > 2000) E.bitacora.splice(0, E.bitacora.length - 2000); },
  aposto(p, u = E.sesion) { return p.apuestas.some(a => a.u === u); },
  reportarResultado(id, op, evidencia) {
    const p = E.propuestas.find(x => x.id === id), u = this.yo();
    if (u.verificado !== 'si') return { error: 'verificar' };
    if (!this.porArbitrar(p) || p.arbitraje) return { error: 'Ya no se puede reportar.' };
    evidencia = String(evidencia || '').trim().slice(0, 300); if (evidencia.length < 8) return { error: 'Cuenta cómo lo sabes o pon un link de prueba.' };
    p.arbitraje = { op: +op, por: u.id, evidencia, fecha: new Date().toISOString(), confirman: [], disputan: [] }; this.bitacora('reportó resultado', p, p.opciones[op]);
    new Set(p.apuestas.map(a => a.u)).forEach(x => x !== u.id && notificar(x, `Reportaron que en "${p.titulo}" ganó "${p.opciones[op]}". Tienes ${REGLAS.horasDisputa} h para disputarlo.`, '#/propuestas'));
    this.guardar(); return { ok: true };
  },
  confirmarResultado(id) {
    const p = E.propuestas.find(x => x.id === id), A = p?.arbitraje, u = E.sesion;
    if (!A || p.estado !== 'abierta') return { error: 'No hay resultado que confirmar.' };
    if (this.yo().verificado !== 'si') return { error: 'verificar' };
    if (A.por === u) return { error: 'Tú lo reportaste.' };
    if (this.aposto(p)) return { error: 'Como apostaste, solo puedes disputar. Confirman quienes no apostaron.' };
    if (A.confirman.includes(u) || A.disputan.some(d => d.u === u)) return { error: 'Ya diste tu opinión.' };
    A.confirman.push(u); this.bitacora('confirmó resultado', p); this.guardar(); this.revisarArbitrajes(); return { ok: true };
  },
  disputarResultado(id, motivo, op) {
    const p = E.propuestas.find(x => x.id === id), A = p?.arbitraje, u = E.sesion;
    if (!A || p.estado !== 'abierta') return { error: 'No hay resultado que disputar.' };
    if (this.yo().verificado !== 'si') return { error: 'verificar' };
    motivo = String(motivo || '').trim().slice(0, 300); if (motivo.length < 8) return { error: 'Explica por qué no es correcto.' };
    if (A.por === u || A.confirman.includes(u) || A.disputan.some(d => d.u === u)) return { error: 'Ya diste tu opinión.' };
    A.disputan.push({ u, motivo, op: op === '' || op == null ? null : +op, f: new Date().toISOString() });
    p.estado = 'disputa'; this.bitacora('disputó', p, motivo);
    Object.values(E.usuarios).filter(x => x.rol === 'admin').forEach(x => notificar(x.id, `Disputa en "${p.titulo}": revisa la prueba`, '#/admin'));
    this.guardar(); return { ok: true };
  },
  finArbitraje(p) { return p.arbitraje ? new Date(new Date(p.arbitraje.fecha).getTime() + REGLAS.horasDisputa * 36e5) : null; },
  revisarArbitrajes() {
    let cambio = false;
    E.propuestas.forEach(p => {
      const A = p.arbitraje; if (!A || p.estado !== 'abierta' || A.disputan.length) return;
      if (Date.now() < this.finArbitraje(p).getTime()) return;
      if (A.confirman.length >= REGLAS.confirmacionesMin && !this.esGrande(p)) { this.resolver(p.id, A.op, 'comunidad'); cambio = true; }
      else if (A.confirman.length >= REGLAS.confirmacionesMin && !A.aviso) { A.aviso = true; Object.values(E.usuarios).filter(x => x.rol === 'admin').forEach(x => notificar(x.id, `Predicción grande lista para verificar: "${p.titulo}"`, '#/admin')); cambio = true; }
      else if (!A.aviso) { A.aviso = true; Object.values(E.usuarios).filter(x => x.rol === 'admin').forEach(x => notificar(x.id, `"${p.titulo}" no juntó confirmaciones: decide tú`, '#/admin')); cambio = true; }
    });
    if (cambio) this.guardar();
  },
  premiarArbitros(p) {
    const A = p.arbitraje; if (!A) return;
    if (A.op === p.ganadora) { mover(A.por, REGLAS.premioReportar, 'premio', 'reportar resultado'); mover('FONDO', -REGLAS.premioReportar, 'premio', p.id); }
    A.confirman.forEach(u => { if (A.op === p.ganadora) { mover(u, REGLAS.premioConfirmar, 'premio', 'confirmar resultado'); mover('FONDO', -REGLAS.premioConfirmar, 'premio', p.id); } });
    A.disputan.forEach(d => { if (d.op != null && d.op === p.ganadora) { mover(d.u, REGLAS.premioReportar, 'premio', 'disputa correcta'); mover('FONDO', -REGLAS.premioReportar, 'premio', p.id); } });
  },
  /* ---------- Editar propuestas ---------- */
  puedeEditar(p) { if (!p || (p.autor !== E.sesion && !this.esAdmin())) return false; return p.estado === 'abierta' && !this.tieneParticipacion(p); },
  tieneParticipacion(p) { return p.apuestas.length > 0 || Object.keys(p.votos).length > 0 || p.apuntados.some(u => u !== p.autor); },
  editarPropuesta(id, d) {
    const p = E.propuestas.find(x => x.id === id); if (!this.puedeEditar(p)) return { error: 'Ya participó alguien: solo puedes agregar una aclaración.' };
    const titulo = d.titulo.trim().slice(0, 140); if (titulo.length < 6) return { error: 'Escribe la pregunta completa.' };
    if (p.tipo === 'prediccion' && TEMAS_PRIVILEGIADOS.test(titulo)) return { error: 'Ese tema es de información privilegiada: publícalo como votación.' };
    if (p.tipo !== 'actividad') { const ops = leerOpciones(d).map(o => String(o || '').trim()).filter(Boolean).slice(0, MAX_OPCIONES); if (ops.length < 2) return { error: 'Pon al menos dos opciones.' }; p.opciones = ops; }
    else p.cupo = Math.max(2, Number(d.cupo) || p.cupo);
    if (d.minutos) { const m = Math.round(Number(d.minutos)); if (!(m >= REGLAS.duracionMin)) return { error: `La duración mínima es de ${REGLAS.duracionMin} minutos.` }; p.cierre = new Date(Date.now() + Math.min(m, REGLAS.duracionMax) * 6e4).toISOString(); }
    else if (d.cierre && cierreMs(d.cierre) - Date.now() >= REGLAS.duracionMin * 6e4) p.cierre = d.cierre;
    p.titulo = titulo; p.editada = new Date().toISOString(); this.bitacora('editó', p); this.guardar(); return { ok: true };
  },
  aclarar(id, texto) {
    const p = E.propuestas.find(x => x.id === id); if (!p || (p.autor !== E.sesion && !this.esAdmin())) return { error: 'No puedes.' };
    texto = String(texto || '').trim().slice(0, 300); if (texto.length < 4) return { error: 'Escribe la aclaración.' };
    (p.aclaraciones = p.aclaraciones || []).push({ t: texto, u: E.sesion, f: new Date().toISOString() }); this.bitacora('aclaró', p, texto);
    new Set([...p.apuestas.map(a => a.u), ...Object.keys(p.votos), ...p.apuntados]).forEach(u => u !== E.sesion && notificar(u, `Aclaración en "${p.titulo}"`, '#/propuestas'));
    this.guardar(); return { ok: true };
  },
  congelar(id) { const p = E.propuestas.find(x => x.id === id); p.estado = p.estado === 'congelada' ? 'abierta' : 'congelada'; this.guardar(); },

  /* ---------- Rankings de la comunidad ---------- */
  etapaRanking(r) { const n = Object.keys(r.votos).length, U = REGLAS.umbralRanking; return r.oficial ? 3 : n >= U.generacion ? 3 : n >= U.salon ? 2 : n >= U.amigos ? 1 : 0; },
  rankingVisible(r, quien = E.sesion) {
    if (r.estado === 'quitado' || r.estado === 'rechazado') return false;
    if (r.autor === quien) return true;
    if (r.estado !== 'aprobado') return false;
    const a = E.usuarios[r.autor], q = E.usuarios[quien], et = this.etapaRanking(r);
    if (this.bloqueo(r.autor, quien)) return false;
    if (et === 3) return true;
    if (et === 2) return a.gen === q.gen;
    if (et === 1) return a.gen === q.gen && a.carrera === q.carrera;
    return this.sonAmigos(r.autor, quien) || (!a.amigos.length && a.carrera === q.carrera && a.gen === q.gen);
  },
  crearRanking(titulo, opciones, nombrados) {
    titulo = titulo.trim().slice(0, 140); opciones = opciones.map(o => String(o || '').trim()).filter(Boolean).slice(0, MAX_OPCIONES);
    if (titulo.length < 6 || opciones.length < 2) return { error: 'Escribe la pregunta y al menos dos opciones.' };
    const ids = [...new Set(nombrados.map(n => this.porUsuario(n)?.id).filter(Boolean))];
    const r = { id: uid('rk'), titulo, autor: E.sesion, oficial: this.esAdmin(), opciones, votos: {}, nombrados: ids, consentimiento: {}, fecha: new Date().toISOString(), estado: 'aprobado' };
    if (PALABRAS_REVISION.test(titulo + ' ' + opciones.join(' '))) { r.estado = 'revision'; avisarAdmins('Ranking para revisar: ' + titulo, '#/admin'); }
    else if (ids.length) { r.estado = 'consentimiento'; ids.forEach(i => { r.consentimiento[i] = i === E.sesion ? true : null; if (i !== E.sesion) notificar(i, `@${this.yo().usuario} te incluyó en el ranking "${titulo}". ¿Aceptas aparecer?`, '#/notificaciones', { tipo: 'consentimiento', ref: r.id }); }); this.revisarConsentimiento(r); }
    E.rankings.push(r); this.guardar(); return { ok: r };
  },
  revisarConsentimiento(r) { const v = Object.values(r.consentimiento); if (v.some(x => x === false)) r.estado = 'rechazado'; else if (v.every(x => x === true) && r.estado === 'consentimiento') r.estado = 'aprobado'; },
  responderConsentimiento(id, acepta) { const r = E.rankings.find(x => x.id === id); if (!r) return; r.consentimiento[E.sesion] = acepta; this.revisarConsentimiento(r); notificar(r.autor, `@${this.yo().usuario} ${acepta ? 'aceptó' : 'no aceptó'} aparecer en "${r.titulo}"`, '#/rankings'); this.guardar(); },
  votarRanking(id, op) { const r = E.rankings.find(x => x.id === id); r.votos[E.sesion] = op; this.guardar(); return { ok: true }; },
  moderarRanking(id, estado) { const r = E.rankings.find(x => x.id === id); r.estado = estado; notificar(r.autor, estado === 'aprobado' ? `Tu ranking "${r.titulo}" ya está publicado` : `Tu ranking "${r.titulo}" no se publicó`, '#/rankings'); this.guardar(); },

  /* ---------- Profesores ---------- */
  calificacion(p) { const o = p.opiniones; if (!o.length) return null; return o.reduce((s, x) => s + (x.claridad + x.justo + x.puntual) / 3, 0) / o.length; },
  motivoFrecuente(p) { const c = {}; p.opiniones.forEach(o => { if (o.motivo) c[o.motivo] = (c[o.motivo] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || ''; },
  opinar(id, datos) { if (this.yo().verificado !== 'si') return { error: 'verificar' }; const p = E.profes.find(x => x.id === id); p.opiniones = p.opiniones.filter(o => o.u !== E.sesion); p.opiniones.push({ u: E.sesion, ...datos, fecha: new Date().toISOString() }); this.guardar(); return { ok: true }; },

  /* ---------- Compraventa ---------- */
  ventaVisible(v, quien = E.sesion) { if (v.autor === quien) return true; if (v.estado === 'vendido' || this.bloqueo(v.autor, quien)) return false; return v.vis === 'todos' || (v.vis === 'amigos' && this.sonAmigos(v.autor, quien)) || (v.vis === 'elegidos' && v.elegidos.includes(quien)); },
  publicarVenta(d) { const ids = (d.elegidos || []).map(n => this.porUsuario(n)?.id).filter(Boolean); E.ventas.push({ id: uid('v'), autor: E.sesion, titulo: d.titulo.trim().slice(0, 100), tipo: d.tipo, precio: Number(d.precio) || 0, vis: d.vis, elegidos: ids, fecha: new Date().toISOString() }); this.guardar(); },

  /* ---------- Chat ---------- */
  misChats() { return E.chats.filter(c => c.miembros.includes(E.sesion) && !(c.tipo === 'dm' && this.bloqueo(...c.miembros)) && !(c.quitado?.[E.sesion] && (c.mensajes.at(-1)?.f || '') <= c.quitado[E.sesion])).sort((a, b) => (b.mensajes.at(-1)?.f || '').localeCompare(a.mensajes.at(-1)?.f || '')); },
  chatCon(id) {
    let c = E.chats.find(x => x.tipo === 'dm' && x.miembros.includes(id) && x.miembros.includes(E.sesion));
    if (!c) { if (!this.puedeEscribir(id)) return null; c = { id: uid('ch'), tipo: 'dm', nombre: '', miembros: [E.sesion, id], mensajes: [], fijado: null }; E.chats.push(c); this.guardar(); }
    return c;
  },
  enviar(chatId, texto) { texto = texto.trim().slice(0, 1000); if (!texto) return; const c = E.chats.find(x => x.id === chatId); c.miembros.filter(m => m !== E.sesion && this.sinLeerDe(c, m) === 0).forEach(m => notificar(m, c.tipo === 'grupo' ? `Mensajes nuevos en ${c.nombre}` : `@${this.yo().usuario} te escribió`, '#/chat/' + c.id)); c.mensajes.push({ u: E.sesion, t: texto, f: new Date().toISOString() }); c.leido = c.leido || {}; c.leido[E.sesion] = c.mensajes.length; this.guardar(); },
  visibles(c) { const desde = c.vaciado?.[E.sesion] || 0; return c.mensajes.map((m, i) => ({ ...m, i })).slice(desde); },
  vaciarChat(id) { const c = E.chats.find(x => x.id === id); if (!c) return; c.vaciado = c.vaciado || {}; c.vaciado[E.sesion] = c.mensajes.length; this.marcarLeido(id); },
  quitarChat(id) { const c = E.chats.find(x => x.id === id); if (!c) return; this.vaciarChat(id); c.quitado = c.quitado || {}; c.quitado[E.sesion] = new Date().toISOString(); this.guardar(); },
  salirGrupo(id) { const c = E.chats.find(x => x.id === id); if (!c || c.tipo !== 'grupo') return; c.miembros = c.miembros.filter(m => m !== E.sesion); c.mensajes.push({ u: E.sesion, t: 'salió del grupo', f: new Date().toISOString(), sistema: true }); if (!c.miembros.length) E.chats = E.chats.filter(x => x !== c); this.guardar(); },
  borrarMensaje(id, i) { const c = E.chats.find(x => x.id === id), m = c?.mensajes[i]; if (!m || (m.u !== E.sesion && !this.esAdmin())) return false; m.t = ''; m.borrado = true; this.guardar(); return true; },
  marcarLeido(chatId) { const c = E.chats.find(x => x.id === chatId); c.leido = c.leido || {}; c.leido[E.sesion] = c.mensajes.length; this.guardar(); },
  sinLeerDe(c, u) { const s = E.sesion; E.sesion = u; const n = this.sinLeer(c); E.sesion = s; return n; },
  sinLeer(c) { const v = (c.leido || {})[E.sesion]; const desde = Math.max(v ?? 0, c.vaciado?.[E.sesion] || 0); return c.mensajes.slice(desde).filter(m => m.u !== E.sesion && !m.sistema).length; },

  /* ---------- Agenda ---------- */
  miAgenda() { return E.agenda.filter(a => a.u === E.sesion || (a.compartidoEn && E.chats.find(c => c.id === a.compartidoEn)?.miembros.includes(E.sesion))).sort((a, b) => a.fecha.localeCompare(b.fecha)); },
  agregarRecordatorio(d) { E.agenda.push({ id: uid('ag'), u: E.sesion, titulo: d.titulo.trim().slice(0, 100), tipo: d.tipo, fecha: d.fecha, hora: d.hora || '', lugar: d.lugar || '', hecho: false }); this.guardar(); },
  alternarHecho(id) { const a = E.agenda.find(x => x.id === id); a.hechoPor = a.hechoPor || {}; a.hechoPor[E.sesion] = !a.hechoPor[E.sesion]; this.guardar(); },
  compartirRecordatorio(id, chatId) { const a = E.agenda.find(x => x.id === id), c = E.chats.find(x => x.id === chatId); a.compartidoEn = chatId; c.fijado = a.id; c.mensajes.push({ u: E.sesion, t: `Recordatorio: ${a.titulo} · ${fechaBonita(a.fecha)}${a.hora ? ' ' + a.hora : ''}`, f: new Date().toISOString() }); c.miembros.forEach(m => m !== E.sesion && notificar(m, `Nuevo recordatorio en ${c.nombre}: ${a.titulo}`, '#/agenda')); this.guardar(); },
  borrarRecordatorio(id) { E.agenda = E.agenda.filter(a => !(a.id === id && a.u === E.sesion)); this.guardar(); },

  /* ---------- Croquis del campus ---------- */
  lugares() { const oc = E.lugaresOcultos || []; return LUGARES.filter(l => !oc.includes(l.id)).concat(E.lugares); },
  proponerLugar(d) { E.lugaresPend.push({ id: uid('lg'), nombre: d.nombre.trim().slice(0, 60), como: d.como.trim().slice(0, 200), x: Math.round(d.x), y: Math.round(d.y), tipo: 'salon', zona: d.zona || '', por: E.sesion, fecha: new Date().toISOString() }); avisarAdmins('Lugar propuesto para el mapa: ' + d.nombre, '#/admin'); this.guardar(); },
  moderarLugar(id, ok) { const i = E.lugaresPend.findIndex(l => l.id === id); if (i < 0) return; const l = E.lugaresPend.splice(i, 1)[0]; if (ok) { E.lugares.push(l); const u = E.usuarios[l.por]; if (u) { u.reputacion += 1; mover(u.id, 10, 'premio', 'lugar en el mapa'); } } notificar(l.por, ok ? `"${l.nombre}" ya está en el mapa. +10 ramitas` : `"${l.nombre}" no se agregó al mapa`, '#/explorar/mapa'); this.guardar(); },

  /* ---------- Eliminar contenido (admin o autor) ---------- */
  autorDe(tipo, id) { const L = { post: E.posts, propuesta: E.propuestas, ranking: E.rankings, venta: E.ventas, nivel: E.niveles, tablonItem: E.tablonItems, tablon: E.tablones }[tipo]; return L?.find(x => x.id === id)?.autor; },
  /* Las predicciones con ramitas apostadas nunca se eliminan (ni el admin): así queda constancia de quién apostó y quién ganó */
  conRamitas(id) { const p = E.propuestas.find(x => x.id === id); return !!(p && p.tipo === 'prediccion' && p.apuestas.length); },
  /* con dinero real nadie borra predicciones con ramitas; mientras no, solo el admin (devolviendo lo apostado) */
  protegida(id) { return this.conRamitas(id) && (CONFIG.dineroReal || !this.esAdmin()); },
  puedeEliminar(tipo, id) { if (tipo === 'propuesta' && this.protegida(id)) return false; return this.esAdmin() || (this.autorDe(tipo, id) && this.autorDe(tipo, id) === E.sesion); },
  eliminar(tipo, id, extra) {
    if ((tipo === 'profe' || tipo === 'opinion') && !this.esAdmin()) return false;
    if (!this.puedeEliminar(tipo, id) && !(tipo === 'comentario' && E.posts.find(p => p.id === id)?.comentarios[+extra]?.autor === E.sesion)) return false;
    const quita = k => { E[k] = E[k].filter(x => x.id !== id); };
    if (tipo === 'post') quita('posts');
    else if (tipo === 'comentario') E.posts.find(p => p.id === id)?.comentarios.splice(+extra, 1);
    else if (tipo === 'propuesta') { const p = E.propuestas.find(x => x.id === id); if (p && p.apuestas.length && ['abierta', 'congelada', 'disputa'].includes(p.estado)) this.anular(id, 'El admin quitó la predicción y te devolvió tus ramitas'); if (p) this.bitacora('eliminó', p); quita('propuestas'); }
    else if (tipo === 'ranking') quita('rankings');
    else if (tipo === 'profe') quita('profes');
    else if (tipo === 'tablonItem') quita('tablonItems');
    else if (tipo === 'tablon') { if (['tb_general', 'tb_uni', 'tb_eventos'].includes(id)) return false; quita('tablones'); E.tablonItems = E.tablonItems.filter(x => x.tablon !== id); }
    else if (tipo === 'opinion') E.profes.find(p => p.id === id)?.opiniones.splice(+extra, 1);
    else if (tipo === 'venta') quita('ventas');
    else if (tipo === 'nivel') quita('niveles');
    else if (tipo === 'evento') quita('eventos');
    else if (tipo === 'lugar') { if (E.lugares.some(l => l.id === id)) quita('lugares'); else (E.lugaresOcultos = E.lugaresOcultos || []).push(id); }
    else return false;
    this.guardar(); return true;
  },
  suspender(id, on) { if (!this.esAdmin() || id === E.sesion) return; E.usuarios[id].suspendido = on; if (on) notificar(id, 'Tu cuenta fue suspendida por el equipo', '#/inicio'); this.guardar(); },
  areas() { return E.areas || (E.areas = AREAS.slice()); },
  agregarArea(nombre) { nombre = String(nombre || '').trim().replace(/\s+/g, ' ').slice(0, 40); if (nombre.length < 3) return { error: 'Escribe el nombre del área.' };
    const ya = this.areas().find(a => this.claveNombre(a) === this.claveNombre(nombre)); if (ya) return { ok: ya, ya: true }; this.areas().push(nombre); this.guardar(); return { ok: nombre }; },
  quitarArea(nombre) { if (!this.esAdmin() || E.profes.some(p => p.area === nombre)) return false; E.areas = this.areas().filter(a => a !== nombre); this.guardar(); return true; },
  /* ---------- Tablón ---------- */
  puedeFijar(t) { return this.tablonVisible(t) && (!t.oficial || this.esAdmin()); },
  apuntarseTablon(id) { const it = E.tablonItems.find(x => x.id === id); if (!it) return; it.apuntados = it.apuntados || []; const i = it.apuntados.indexOf(E.sesion); if (i >= 0) it.apuntados.splice(i, 1); else { it.apuntados.push(E.sesion); if (it.autor !== E.sesion) notificar(it.autor, `@${this.yo().usuario} se apuntó a "${it.titulo}"`, '#/tablon/' + it.tablon); } this.guardar(); },
  tablonVisible(t) { if (!t) return false; if (!t.chat) return true; const c = E.chats.find(x => x.id === t.chat); return !!c && (c.miembros.includes(E.sesion) || this.esAdmin()); },
  misTablones() { return E.tablones.filter(t => this.tablonVisible(t)); },
  crearTablon(nombre, chat = null) { nombre = String(nombre || '').trim().slice(0, 50); if (nombre.length < 2) return { error: 'Ponle nombre.' }; const t = { id: uid('tb'), nombre, chat, autor: E.sesion, fecha: new Date().toISOString() }; E.tablones.push(t); this.guardar(); return { ok: t }; },
  tablonDeChat(chatId) { const c = E.chats.find(x => x.id === chatId); if (!c) return null; return E.tablones.find(t => t.chat === chatId) || this.crearTablon(c.nombre, chatId).ok; },
  itemsTablon(id) { return E.tablonItems.filter(x => x.tablon === id && !E.usuarios[x.autor]?.suspendido).sort((a, b) => (b.fijado - a.fijado) || b.fecha.localeCompare(a.fecha)); },
  fijarEnTablon(d) {
    const t = E.tablones.find(x => x.id === d.tablon); if (!this.tablonVisible(t)) return { error: 'No tienes acceso a este tablón.' }; if (!this.puedeFijar(t)) return { error: 'En este tablón solo publica el equipo.' };
    const it = { id: d.id || uid('ti'), tablon: t.id, autor: E.sesion, tipo: d.tipo, titulo: String(d.titulo || '').trim().slice(0, 80), texto: String(d.texto || '').trim().slice(0, 400), color: d.color || 'amarillo', archivo: d.archivo || null, fijado: false, fecha: new Date().toISOString(), cuando: d.cuando || null, lugar: String(d.lugar || '').trim().slice(0, 80), apuntados: [] };
    if (it.tipo === 'evento' && (it.titulo.length < 3 || !it.cuando)) return { error: 'Pon qué es y cuándo.' };
    if (it.tipo === 'nota' && !it.texto) return { error: 'Escribe la nota.' };
    if ((it.tipo === 'archivo' || it.tipo === 'foto') && !it.archivo) return { error: 'Elige un archivo.' };
    E.tablonItems.push(it);
    if (t.chat) { const c = E.chats.find(x => x.id === t.chat); c?.miembros.filter(m => m !== E.sesion).forEach(m => notificar(m, `@${this.yo().usuario} fijó algo en el tablón de ${t.nombre}`, '#/tablon/' + t.id)); }
    this.guardar(); return { ok: it };
  },
  fijarArriba(id) { const it = E.tablonItems.find(x => x.id === id); if (!it || (it.autor !== E.sesion && !this.esAdmin())) return; it.fijado = !it.fijado; this.guardar(); },
  claveNombre(n) { return String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\b(dr|dra|mtro|mtra|maestro|maestra|ing|lic|prof|profa|profe|m\.?\s?c|mc)\b\.?/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim(); },
  profeParecido(nombre) { const k = this.claveNombre(nombre); if (!k) return null; return E.profes.find(p => this.claveNombre(p.nombre) === k) || null; },
  proponerProfe(d) {
    if (this.esAdmin()) { this.crearProfe(d); return { ok: true, directo: true }; }
    if (this.yo().verificado !== 'si') return { error: 'verificar' };
    const ya = this.profeParecido(d.nombre); if (ya) return { error: 'existe', id: ya.id };
    const k = this.claveNombre(d.nombre), pend = E.profesPend.find(p => this.claveNombre(p.nombre) === k);
    if (pend) { if (pend.por === E.sesion || pend.apoyos.includes(E.sesion)) return { error: 'repetido' }; pend.apoyos.push(E.sesion); this.guardar(); return { ok: true, apoyo: true }; }
    if (E.profesPend.filter(p => p.por === E.sesion).length >= 5) return { error: 'limite' };
    E.profesPend.push({ id: uid('pp'), nombre: d.nombre.trim().slice(0, 60), area: d.area, materias: d.materias.split(',').map(m => m.trim()).filter(Boolean).slice(0, 6), por: E.sesion, apoyos: [], fecha: new Date().toISOString() });
    this.guardar(); return { ok: true };
  },
  moderarProfe(id, ok) {
    const i = E.profesPend.findIndex(p => p.id === id); if (i < 0) return; const p = E.profesPend.splice(i, 1)[0];
    let nuevo = null;
    if (ok) { this.agregarArea(p.area); nuevo = { id: uid('p'), nombre: p.nombre, area: this.areas().find(a => this.claveNombre(a) === this.claveNombre(p.area)) || p.area, materias: p.materias, opiniones: [] }; E.profes.push(nuevo); const u = E.usuarios[p.por]; if (u) { u.reputacion += 1; mover(u.id, 10, 'premio', 'profesor propuesto'); } }
    [p.por, ...p.apoyos].forEach(uId => notificar(uId, ok ? `${p.nombre} ya está en Profesores. Deja tu opinión${uId === p.por ? ' · +10 ramitas' : ''}` : `${p.nombre} no se agregó a Profesores`, ok ? `#/profe/${nuevo.id}` : '#/rankings'));
    this.guardar();
  },
  crearProfe(d) { const ar = this.agregarArea(d.area); E.profes.push({ id: uid('p'), nombre: d.nombre.trim().slice(0, 60), area: ar.ok || d.area, materias: d.materias.split(',').map(m => m.trim()).filter(Boolean).slice(0, 6), opiniones: [] }); this.guardar(); },
  crearEvento(d) { E.eventos.push({ id: uid('ev'), titulo: d.titulo.trim().slice(0, 100), fecha: d.fecha, hora: d.hora || '', lugar: d.lugar.trim().slice(0, 60), interesados: 0 }); this.guardar(); },

  /* ---------- Eventos ---------- */
  interesEvento(id) { const k = E.sesion + ':' + id; E.interesEventos[k] = !E.interesEventos[k]; const ev = E.eventos.find(x => x.id === id); ev.interesados += E.interesEventos[k] ? 1 : -1; this.guardar(); },

  /* ---------- Notificaciones ---------- */
  misNotifs() { return E.notifs.filter(n => n.u === E.sesion).slice().reverse(); },
  sinLeerNotifs() { return E.notifs.filter(n => n.u === E.sesion && !n.leida).length; },
  leerNotifs() { E.notifs.forEach(n => { if (n.u === E.sesion) n.leida = true; }); this.guardar(); },

  /* ---------- Juegos, rachas y premios ---------- */
  diarios() { const u = this.yo(); if (u.diarios.fecha !== fechaLocal()) u.diarios = { fecha: fechaLocal(), regalo: u.diarios.regalo }; return u.diarios; },
  completarDiario(cual, premio) {
    const d = this.diarios(); if (d[cual]) return 0; d[cual] = true;
    if (premio) mover(E.sesion, premio, 'juego', cual);
    const u = this.yo(), hoy = fechaLocal();
    if (u.racha.ultimo !== hoy) {
      u.racha.dias = u.racha.ultimo === sumarDias(hoy, -1) ? u.racha.dias + 1 : 1; u.racha.ultimo = hoy;
      u.racha.semana = (u.racha.semana || []).filter(f => diasHasta(f) > -7).concat(hoy);
      if (u.racha.dias % 7 === 0) { mover(u.id, REGLAS.premioRacha7, 'racha', u.racha.dias + ' días'); aviso(`¡Racha de ${u.racha.dias} días! +${REGLAS.premioRacha7} ramitas`); }
    }
    this.guardar(); return premio;
  },
  premioReto(premio, ref) { const L = this.limites(); const dar = Math.max(0, Math.min(premio, REGLAS.topeRetosDia - L.retos)); L.retos += dar; if (dar) mover(E.sesion, dar, 'reto', ref); this.guardar(); return dar; },
  mejoresSemana() {
    const desde = inicioSemana().toISOString(), t = {};
    E.libro.forEach(m => { if (m.f >= desde && (m.tipo === 'reto' || m.tipo === 'juego' || m.tipo === 'racha') && E.usuarios[m.u]) t[m.u] = (t[m.u] || 0) + m.monto; });
    return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([u, pts]) => ({ u: E.usuarios[u], pts }));
  },
  crearNivel(nombre, ids) { E.niveles.push({ id: uid('nv'), nombre: nombre.trim().slice(0, 60), autor: E.sesion, oficial: this.esAdmin(), ids, likes: 0, likers: [], jugadas: 0, nuevo: true }); this.guardar(); },
  gustarNivel(id) { const n = E.niveles.find(x => x.id === id); const i = n.likers.indexOf(E.sesion); if (i >= 0) { n.likers.splice(i, 1); n.likes--; } else { n.likers.push(E.sesion); n.likes++; } this.guardar(); },

  /* ---------- Casino (ruleta y tragamonedas): 1 ramita = 100 créditos ---------- */
  creditos() { return this.yo()?.creditos || 0; },
  jugadaCasino({ juego, apuesta, pago, ev, v }) { const u = this.yo(); if (!u || !(apuesta > 0)) return; (E.jugadas = E.jugadas || []).push({ u: u.id, juego, apuesta: Math.round(apuesta), pago: Math.round(pago || 0), ev: Number(ev) || 0, v: Number(v) || null, f: new Date().toISOString() }); if (E.jugadas.length > 20000) E.jugadas.splice(0, E.jugadas.length - 20000); },
  setCreditos(n) { const u = this.yo(); if (!u) return; u.creditos = Math.max(0, Math.floor(Number(n) || 0)); this.guardar(); },
  comprarCreditos(r) {
    const u = this.yo(), L = this.limites(); r = Math.floor(Number(r));
    if (!(r > 0)) return { error: 'Elige cuántas ramitas cambiar.' };
    if (this.saldo() < r) return { error: 'No te alcanzan las ramitas.' };
    if ((L.casino || 0) + r > REGLAS.maxCasinoDia) return { error: `Por hoy solo puedes cambiar ${Math.max(0, REGLAS.maxCasinoDia - (L.casino || 0))} ramitas más.` };
    L.casino = (L.casino || 0) + r; mover(u.id, -r, 'casino', 'cambio a créditos');
    u.creditos = (u.creditos || 0) + r * REGLAS.creditosPorRamita; this.guardar(); return { ok: r };
  },
  cobrarCreditos() {
    const u = this.yo(), r = Math.floor((u.creditos || 0) / REGLAS.creditosPorRamita);
    if (!r) return { error: `Necesitas al menos ${REGLAS.creditosPorRamita} créditos para cobrar 1 ramita.` };
    u.creditos -= r * REGLAS.creditosPorRamita; mover(u.id, r, 'casino', 'cobro de créditos'); this.guardar(); return { ok: r };
  },

  /* ---------- Verificación ---------- */
  verificarCorreo(correo) { const u = this.yo(); u.verificado = 'si'; u.correoUni = correo; if (!u.insignias.includes('verificado')) u.insignias.push('verificado'); this.guardar(); },
  correoInstitucional(c) { const d = String(c || '').toLowerCase().trim().split('@')[1] || ''; return (CONFIG.dominiosUni || []).some(x => d === x || d.endsWith('.' + x)); },
  enviarCredencial(nombreArchivo, tipo = 'documento') { const u = this.yo(); u.verificado = 'pendiente'; u.documento = nombreArchivo; u.tipoDocumento = tipo; avisarAdmins(`@${u.usuario} envió ${tipo} para verificarse`, '#/admin'); this.guardar(); },
  aprobarVerificacion(id, ok) { const u = E.usuarios[id]; u.verificado = ok ? 'si' : 'no'; u.documento = null; if (ok && !u.insignias.includes('verificado')) u.insignias.push('verificado'); notificar(id, ok ? 'Ya estás verificado como estudiante' : 'No pudimos verificar tu documento; intenta con tu correo de la uni', '#/verificar'); this.guardar(); },

  /* ---------- Panel de administración ---------- */
  alertas() {
    const out = [];
    E.propuestas.filter(p => p.tipo === 'prediccion' && p.estado === 'abierta').forEach(p => {
      // muchas cuentas del mismo grupo apostando fuerte al mismo lado en poco tiempo
      const fuertes = p.apuestas.filter(a => a.monto >= 40);
      const grupos = {}; fuertes.forEach(a => { const u = E.usuarios[a.u]; const k = u.carrera + ' ' + u.gen + '|' + a.op; (grupos[k] = grupos[k] || []).push(a); });
      Object.entries(grupos).forEach(([k, lista]) => { const t = lista.map(a => new Date(a.f).getTime()).sort((x, y) => x - y); let s = { size: 0 };
        for (let i = 0; i < t.length; i++) { let j = i; while (j + 1 < t.length && t[j + 1] - t[i] <= 30 * 60000) j++; if (j - i + 1 > s.size) s = { size: j - i + 1 }; }
        if (s.size >= 3) out.push({ id: 'rapida:' + p.id + k, nivel: 'Alta', titulo: 'Apuestas fuertes de último minuto', detalle: `${s.size} cuentas de ${k.split('|')[0]} apostaron fuerte a "${p.opciones[+k.split('|')[1]]}" en menos de 30 min.`, prop: p.id }); });
    });
    // rachas de aciertos imposibles
    const st = {}; E.propuestas.filter(p => p.estado === 'resuelta').forEach(p => { const vistos = new Set(); p.apuestas.forEach(a => { if (vistos.has(a.u)) return; vistos.add(a.u); st[a.u] = st[a.u] || { n: 0, g: 0 }; st[a.u].n++; if (a.op === p.ganadora) st[a.u].g++; }); });
    Object.entries(st).forEach(([u, s]) => { if (s.n >= 3 && s.g / s.n >= 0.75) out.push({ id: 'racha:' + u, nivel: 'Media', titulo: 'Aciertos fuera de lo normal', detalle: `@${E.usuarios[u].usuario} acertó ${s.g} de ${s.n} predicciones.`, usuario: u }); });
    // cuentas en el mismo dispositivo
    const d = {}; Object.values(E.usuarios).forEach(u => (d[u.dispositivo] = d[u.dispositivo] || []).push(u));
    Object.values(d).forEach(l => { if (l.length >= 3) out.push({ id: 'disp:' + l[0].dispositivo, nivel: 'Media', titulo: 'Varias cuentas en el mismo dispositivo', detalle: l.map(u => '@' + u.usuario).join(', ') + ' entraron desde el mismo teléfono.' }); });
    return out.filter(a => !E.alertasCerradas[a.id]);
  },
  cerrarAlerta(id) { E.alertasCerradas[id] = true; this.guardar(); },
  estadisticasUsuario(id) {
    let n = 0, g = 0; E.propuestas.filter(p => p.estado === 'resuelta').forEach(p => { if (p.apuestas.some(a => a.u === id)) { n++; if (p.apuestas.find(a => a.u === id).op === p.ganadora) g++; } });
    const neto = E.libro.filter(m => m.u === id && (m.tipo === 'apuesta' || m.tipo === 'ganancia' || m.tipo === 'devolucion')).reduce((s, m) => s + m.monto, 0);
    const mismos = Object.values(E.usuarios).filter(u => u.dispositivo === E.usuarios[id].dispositivo && u.id !== id).length;
    return { n, g, neto, mismos };
  },
  economia() {
    const emitidas = ['regalo', 'diario', 'reto', 'juego', 'racha', 'premio', 'compra'], desde7 = Date.now() - 7 * 864e5;
    let entraron = 0, salieron = 0; const dias = {};
    E.libro.forEach(m => { const t = new Date(m.f).getTime(); if (t < desde7) return; const k = m.f.slice(0, 10); dias[k] = dias[k] || { e: 0, s: 0 };
      if (emitidas.includes(m.tipo) && m.u !== 'FONDO') { entraron += m.monto; dias[k].e += m.monto; }
      if (m.tipo === 'comision') { salieron += m.monto; dias[k].s += m.monto; }
      if (m.tipo === 'casino' && E.usuarios[m.u]) { salieron -= m.monto; dias[k].s -= m.monto; } });
    const circulacion = Object.keys(E.usuarios).reduce((s, u) => s + this.saldo(u), 0);
    const enCreditos = Object.values(E.usuarios).reduce((s, u) => s + Math.floor((u.creditos || 0) / REGLAS.creditosPorRamita), 0);
    return { entraron, salieron, dias, circulacion, enCreditos, fondo: this.saldo('FONDO'), enJuego: E.propuestas.filter(p => p.estado === 'abierta' || p.estado === 'congelada').reduce((s, p) => s + this.pozo(p), 0) };
  }
};

/* ---------- funciones internas ---------- */
function mover(u, monto, tipo, ref, fecha, id) {
  if (id && E.libro.some(m => m.id === id)) return;
  E.libro.push({ id: id || uid('m'), f: fecha || new Date().toISOString(), u, monto, tipo, ref: ref || '', disp: E.usuarios[u]?.dispositivo || '' });
}
function notificar(u, texto, link, extra) { if (!E.usuarios[u]) return; E.notifs.push({ id: uid('n'), u, texto, link, fecha: new Date().toISOString(), leida: false, ...extra }); }
function avisarAdmins(texto, link) { Object.values(E.usuarios).filter(u => u.rol === 'admin').forEach(u => notificar(u.id, texto, link)); }
function dispositivoActual() { let d; try { d = localStorage.getItem('cdu_disp'); if (!d) { d = 'disp-' + Math.random().toString(36).slice(2, 8); localStorage.setItem('cdu_disp', d); } } catch (e) { d = 'disp-local'; } return d; }

/* Arma el historial de ejemplo: regalos, apuestas pasadas y predicciones resueltas */
function sembrarLibro() {
  const hace = m => new Date(Date.now() - m * 60000).toISOString();
  Object.values(E.usuarios).forEach(u => mover(u.id, REGLAS.regaloBienvenida + 250, 'regalo', 'bienvenida', u.creado));
  for (let d = 6; d >= 0; d--) Object.keys(E.usuarios).forEach((u, i) => { if ((i + d) % 3 !== 0) mover(u, 20, 'diario', 'regalo del día', hace(60 * 24 * d + i * 7)); if ((i * 3 + d) % 4 === 0) mover(u, 15 + (i % 3) * 10, 'reto', 'retos', hace(60 * 24 * d + 100 + i)); });
  const ap = (pid, u, op, monto, mins) => { const p = E.propuestas.find(x => x.id === pid); p.apuestas.push({ u, op, monto, f: hace(mins) }); mover(u, -monto, 'apuesta', pid, hace(mins)); };
  // historial: jorge acierta casi todo
  ap('pr_robotica', 'u_jorge', 0, 50, 60 * 24 * 11); ap('pr_robotica', 'u_pedro', 1, 30, 60 * 24 * 11); ap('pr_robotica', 'u_diego', 1, 20, 60 * 24 * 11); ap('pr_robotica', 'u_sofia', 1, 25, 60 * 24 * 11);
  ap('pr_voley', 'u_jorge', 1, 40, 60 * 24 * 8); ap('pr_voley', 'u_valeria', 0, 30, 60 * 24 * 8); ap('pr_voley', 'u_sofia', 0, 20, 60 * 24 * 8); ap('pr_voley', 'u_mariana', 1, 20, 60 * 24 * 8);
  ap('pr_posada_asist', 'u_jorge', 0, 50, 60 * 24 * 16); ap('pr_posada_asist', 'u_pedro', 1, 25, 60 * 24 * 16); ap('pr_posada_asist', 'u_valeria', 1, 30, 60 * 24 * 16);
  const sesion = E.sesion; E.sesion = null;
  DB.resolver('pr_robotica', 0); DB.resolver('pr_voley', 1); DB.resolver('pr_posada_asist', 0);
  E.notifs = []; E.sesion = sesion;
  // la predicción abierta: apuestas normales y un bloque sospechoso reciente
  ap('pr_badminton', 'u_diego', 0, 25, 60 * 20); ap('pr_badminton', 'u_pedro', 0, 15, 60 * 18); ap('pr_badminton', 'u_sofia', 0, 30, 60 * 10); ap('pr_badminton', 'u_valeria', 0, 20, 60 * 9); ap('pr_badminton', 'u_mariana', 1, 30, 60 * 6);
  ap('pr_badminton', 'u_jorge', 1, 50, 18); ap('pr_badminton', 'u_luis', 1, 50, 14); ap('pr_badminton', 'u_ana', 1, 50, 9);
}
window.DB = DB; // para que los juegos dentro de la red (iframe) puedan usar las ramitas

function limpiarPropuestas() {
  const ids = new Set(E.propuestas.map(p => p.id));
  E.libro = E.libro.filter(l => !ids.has(l.ref));
  E.propuestas = []; E.bitacora = []; E.posts.forEach(p => { if (p.propuesta) delete p.propuesta; });
  E.notifs = E.notifs.filter(n => !/predicci|propuest/i.test(n.texto));
}

/* crea las cuentas del equipo de prueba si todavía no existen en este navegador */
function asegurarEquipo() {
  let cambio = false;
  (CONFIG.cuentasEquipo || []).forEach(c => {
    const u = E.usuarios[c.id];
    if (u) { if (c.admin && u.rol !== 'admin') { u.rol = 'admin'; cambio = true; } if (!c.admin && u.rol === 'admin' && c.usuario) { u.rol = 'estudiante'; cambio = true; } if (c.usuario && u.equipo && u.usuario !== c.usuario && !Object.values(E.usuarios).some(x => x !== u && x.usuario === c.usuario)) { u.usuario = c.usuario; u.nombre = c.nombre; cambio = true; } if (u.verificado !== 'si') { u.verificado = 'si'; if (!u.insignias.includes('verificado')) u.insignias.push('verificado'); cambio = true; } return; }
    const base = E.usuarios.u_valeria || Object.values(E.usuarios)[0];
    E.usuarios[c.id] = { ...JSON.parse(JSON.stringify(base)), id: c.id, usuario: c.usuario, nombre: c.nombre, nombreVis: 'todos', nombreElegidos: [], carrera: 'Sin carrera', gen: null, semestre: null,
      verificado: 'si', documento: null, contacto: 'equipo de prueba', rol: c.admin ? 'admin' : 'estudiante', bio: '', cancion: null, playlists: [], insignias: ['verificado'], ocultas: [],
      amigos: [], bloqueados: [], silenciados: [], horario: [], racha: { dias: 0, ultimo: null, semana: [] }, diarios: { fecha: null }, limites: { fecha: null }, reputacion: 0, creado: new Date().toISOString(), suspendido: false, equipo: true, dispositivo: 'equipo-' + c.id };
    mover(c.id, REGLAS.regaloBienvenida, 'regalo', 'bienvenida', null, 'bienv_' + c.id); cambio = true;
  });
  if (cambio) DB.guardar();
}

/* hash simple para la demo; con la base de datos real, la contraseña la maneja el servidor (Supabase Auth) */
function hashClave(t) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; t = 'cdu:' + t; for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16); }

/* deja la app en blanco: solo admin, cuenta del equipo oficial y niveles oficiales */
function vaciarDemo() {
  const quedan = new Set(['u_diego', 'u_equipo']);
  Object.keys(E.usuarios).forEach(id => { if (!quedan.has(id)) delete E.usuarios[id]; });
  const a = E.usuarios.u_diego;
  Object.assign(a, { usuario: 'admin', nombre: 'Admin', nombreVis: 'nadie', carrera: 'Sin carrera', gen: null, semestre: null, bio: '', cancion: null, playlists: [], insignias: ['verificado', 'fundador'],
    amigos: [], bloqueados: [], silenciados: [], horario: [], racha: { dias: 0, ultimo: null, semana: [] }, diarios: { fecha: null }, limites: { fecha: null }, reputacion: 0, creado: new Date().toISOString() });
  Object.values(E.usuarios).forEach(u => { u.amigos = []; });
  Object.assign(E, { posts: [], propuestas: [], rankings: [], eventos: [], ventas: [], chats: [], agenda: [], profes: [], profesPend: [], notifs: [], reportes: [], libro: [], bitacora: [], interesEventos: {}, alertasCerradas: {}, lugaresPend: [] });
  E.niveles = E.niveles.filter(n => n.oficial).map(n => ({ ...n, likes: 0, likers: [], jugadas: 0, mejores: [] }));
  Object.keys(E.usuarios).forEach(id => mover(id, REGLAS.regaloBienvenida, 'regalo', 'bienvenida', null, 'bienv_' + id));
}

/* tablones fijos: Universidad (solo el equipo publica), Eventos de alumnos y General */
function asegurarTablones() {
  const base = [{ id: 'tb_uni', nombre: 'Universidad', oficial: true, desc: 'Conferencias, avisos y eventos de la universidad' }, { id: 'tb_eventos', nombre: 'Eventos de alumnos', desc: 'Organiza algo y ve quién se apunta', tipoDefecto: 'evento' }, { id: 'tb_general', nombre: 'General', desc: 'Trabajos, apuntes y lo que sea' }];
  base.forEach((b, i) => { const t = E.tablones.find(x => x.id === b.id); if (t) Object.assign(t, { oficial: !!b.oficial, desc: b.desc, tipoDefecto: b.tipoDefecto || null }); else E.tablones.splice(i, 0, { ...b, chat: null, autor: 'u_diego', fecha: new Date().toISOString() }); });
}
