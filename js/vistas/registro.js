/* Crear cuenta / entrar */
'use strict';
UI.reg = { paso: 0, entrada: 'entrar', modo: 'correo', clave: '', contacto: '', doc: null, carrera: null, gen: null, semestre: null, vis: 'amigos', usuario: '', nombre: '' };
VISTAS.bienvenida = {
  render() {
    const r = UI.reg, barras = [0, 1, 2, 3].map(i => `<span style="height:6px;border-radius:999px;background:${i <= r.paso ? 'var(--morado)' : 'var(--linea)'}"></span>`).join('');
    const top = `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:18px">${barras}</div>`;
    if (r.paso === 0 && r.entrada === 'entrar') return `<div class="pila">
      <div style="display:flex;justify-content:center">${castor(92)}</div>
      <h1 style="text-align:center">Bienvenido a Cosas de la uni</h1>
      <div class="rejilla2" style="background:var(--suave);border-radius:14px;padding:4px"><button class="pastilla on" style="border:0">Iniciar sesión</button><button class="pastilla" style="border:0" data-a="regEntrada" data-e="crear">Crear cuenta</button></div>
      <form data-form="iniciarSesion" class="pila">
        <div><label class="campo" for="ic">Correo, número o @usuario</label><input id="ic" name="contacto" required autocomplete="username" autocapitalize="off" placeholder="tucorreo@ejemplo.com"></div>
        <div><label class="campo" for="icl">Contraseña</label><input id="icl" name="clave" type="password" required autocomplete="current-password"></div>
        <button class="btn ancho">Entrar</button></form>
      <p class="peq gris" style="text-align:center;margin:0">¿No tienes cuenta? <a href="#/bienvenida" data-a="regEntrada" data-e="crear">Créala aquí</a></p>
      <div class="tarjeta pila" style="gap:8px"><b>¿Eres del equipo de prueba?</b><span class="peq gris">Pon la clave y elige tu cuenta.</span><button class="btn2" data-a="soyAdmin">Soy admin</button></div>
    </div>`;
    if (r.paso === 0) return top + `<div class="pila">
      <div class="rejilla2" style="background:var(--suave);border-radius:14px;padding:4px"><button class="pastilla" style="border:0" data-a="regEntrada" data-e="entrar">Iniciar sesión</button><button class="pastilla on" style="border:0">Crear cuenta</button></div>
      <div style="display:flex;justify-content:center">${castor(92)}</div>
      <h1 style="text-align:center">Bienvenido a Cosas de la uni</h1>
      <p class="gris" style="text-align:center;margin:0">La vida universitaria, aquí.</p>
      <div class="rejilla2" style="background:var(--suave);border-radius:14px;padding:4px">
        ${['correo', 'numero'].map(m => `<button class="pastilla${r.modo === m ? ' on' : ''}" style="border:0" data-a="regModo" data-m="${m}">${m === 'correo' ? 'Correo' : 'Número'}</button>`).join('')}
      </div>
      <form data-form="regPaso0" class="pila">
        ${r.modo === 'correo' ? `<div><label class="campo" for="rc">Correo</label><input id="rc" name="contacto" type="email" required placeholder="tucorreo@ejemplo.com" value="${esc(r.contacto)}"></div>`
          : `<div><label class="campo" for="rn">Número de celular</label><div class="fila" style="flex-wrap:nowrap"><span class="pastilla" style="display:grid;place-items:center">+52</span><input id="rn" name="contacto" type="tel" required pattern="[0-9 ]{10,14}" placeholder="55 1234 5678" value="${esc(r.contacto)}"></div><p class="mini gris">Te mandaremos un código por SMS.</p></div>`}
        <div><label class="campo" for="rp">Contraseña</label><input id="rp" name="clave" type="password" required minlength="8" placeholder="Mínimo 8 caracteres"></div>
        <button class="btn ancho">Continuar</button>
      </form>
    </div>`;
    if (r.paso === 1) return top + `<div class="pila">
      <div class="entre"><h1>Sube tu horario</h1><span class="insignia i-morado">Opcional</span></div>
      <p class="gris" style="margin:0">Con tu horario, tira de materias o kárdex confirmamos tu carrera y generación, y quedas verificado.</p>
      <label class="tarjeta" style="border:2px dashed var(--linea);display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;cursor:pointer;text-align:center">
        ${icono('subir', 30)}<b style="color:var(--moradoTxt)">${r.doc ? 'Documento: ' + esc(r.doc) : 'Subir foto o PDF'}</b><span class="mini gris">${r.doc ? 'Lo revisamos y te confirmamos. El documento se borra después.' : 'Horario, tira de materias o kárdex'}</span>
        <input type="file" accept="image/*,.pdf" class="oculto" data-cambio="regDoc"></label>
      <form data-form="regPaso1" class="pila">
        <div><label class="campo">Tu carrera</label><div class="fila">${CARRERAS.map(c => `<button type="button" class="pastilla${r.carrera === c.nombre ? ' on' : ''}" data-a="regCarrera" data-c="${esc(c.nombre)}">${esc(c.nombre)}</button>`).join('')}</div></div>
        <div class="rejilla2">
          <div><label class="campo" for="rg">Generación</label><select id="rg" name="gen"><option value="">Prefiero no decir</option>${[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019].map(g => `<option ${r.gen == g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
          <div><label class="campo" for="rs">Semestre <span class="gris mini">(opcional)</span></label><select id="rs" name="semestre"><option value="">—</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => `<option ${r.semestre == s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        </div>
        <button class="btn ancho" ${r.carrera ? '' : 'disabled'}>Continuar</button>
      </form></div>`;
    if (r.paso === 2) {
      const prev = r.vis === 'todos' ? (r.nombre || 'Tu nombre') + ' · ' : '';
      return top + `<form data-form="regPaso2" class="pila">
      <h1>Así te verán</h1>
      <div><label class="campo" for="ru">Nombre de usuario</label>
        <div class="fila" style="flex-wrap:nowrap;border:1px solid var(--linea);border-radius:12px;padding:0 12px;background:var(--tarjeta)"><span class="gris">@</span><input id="ru" name="usuario" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9._]{3,20}" value="${esc(r.usuario)}" style="border:0;padding-left:4px" data-entrada="regUsuario" autocomplete="off"><span id="disp" class="mini" style="font-weight:800"></span></div>
        <p class="mini gris">Letras, números, punto o guion bajo. Puedes cambiarlo después.</p></div>
      <div><label class="campo" for="rr">Nombre real</label><input id="rr" name="nombre" required value="${esc(r.nombre)}" data-entrada="regNombre"></div>
      <div><label class="campo">¿Quién ve tu nombre real?</label><div class="rejilla2">${[['todos', 'Todos'], ['amigos', 'Amigos'], ['elegidos', 'Quien elijas'], ['yo', 'Solo yo']].map(([k, t]) => `<button type="button" class="pastilla${r.vis === k ? ' on' : ''}" data-a="regVis" data-v="${k}">${t}</button>`).join('')}</div></div>
      <p class="mini gris" style="margin:4px 0 0">Vista previa · cómo te ve alguien que no es tu amigo</p>
      <div class="tarjeta fila" style="flex-wrap:nowrap"><span class="avatar">${esc((r.usuario || 'c')[0].toUpperCase())}</span><span><b id="prevU">@${esc(r.usuario || 'tu.usuario')}</b><br><span class="mini gris">${esc(prev)}${esc(r.carrera || '')}${r.gen ? ' · Gen ' + esc(r.gen) : ''}</span></span></div>
      <button class="btn ancho">Crear mi cuenta</button></form>`;
    }
    return `<div class="pila" style="align-items:center;text-align:center;padding-top:30px">${castor(120)}<h1>¡Ya eres parte de la madriguera!</h1>
      <p class="gris">Te regalamos <b>${REGLAS.regaloBienvenida} ramitas</b> para empezar.</p>
      ${DB.yo()?.verificado === 'pendiente' ? '<p class="peq gris">Estamos revisando tu documento. Mientras, puedes verificarte al instante con tu correo de la uni.</p>' : ''}
      <a class="btn3 ancho" href="#/editar-perfil">Arreglar mi perfil</a><a class="btn ancho" href="#/inicio">Entrar</a></div>`;
  },
  montar() { if (UI.reg.paso === 2) revisarUsuario(); }
};
function revisarUsuario() { const el = $('#disp'); if (!el) return; const v = UI.reg.usuario; if (!v) { el.textContent = ''; return; } const ok = DB.usuarioDisponible(v); el.textContent = ok ? 'Disponible' : 'No disponible'; el.style.color = ok ? 'var(--okTxt)' : 'var(--malTxt)'; }
ACC.regModo = b => { UI.reg.modo = b.dataset.m; pintar(); };
ACC.regDemo = b => { DB.entrar(b.dataset.u); ir('#/inicio'); };
ACC.regCarrera = b => { UI.reg.carrera = b.dataset.c; pintar(); };
ACC.regVis = b => { UI.reg.vis = b.dataset.v; pintar(); };
FORMS.regPaso0 = d => { const c = d.contacto.trim(); if (Object.values(DB.estado.usuarios).some(u => String(u.contacto || '').toLowerCase() === c.toLowerCase())) return aviso('Ya hay una cuenta con ese dato. Inicia sesión.'); UI.reg.contacto = c; UI.reg.clave = d.clave; UI.reg.paso = 1; pintar(); };
FORMS.iniciarSesion = d => { const r = DB.iniciarSesion(d.contacto, d.clave); if (r.error) return aviso(r.error); ir('#/inicio'); };
ACC.regEntrada = b => { UI.reg.entrada = b.dataset.e; UI.reg.paso = 0; pintar(); };
FORMS.regPaso1 = d => { if (!UI.reg.carrera) return; UI.reg.gen = d.gen || null; UI.reg.semestre = d.semestre || null; UI.reg.paso = 2; pintar(); };
FORMS.regPaso2 = d => {
  if (!DB.usuarioDisponible(d.usuario)) { aviso('Ese nombre de usuario no está disponible'); return; }
  const r = UI.reg;
  DB.registrar({ usuario: d.usuario, nombre: d.nombre.trim(), nombreVis: r.vis, carrera: r.carrera, gen: r.gen ? Number(r.gen) : null, semestre: r.semestre ? Number(r.semestre) : null, documento: r.doc, contacto: r.contacto, clave: r.clave }); r.clave = '';
  r.paso = 3; location.hash = '#/bienvenida'; pintar();
};
/* entradas en vivo */
document.addEventListener('input', e => {
  const k = e.target.dataset?.entrada; if (!k) return;
  if (k === 'regUsuario') { UI.reg.usuario = e.target.value.toLowerCase(); revisarUsuario(); const p = $('#prevU'); if (p) p.textContent = '@' + (UI.reg.usuario || 'tu.usuario'); }
  if (k === 'regNombre') UI.reg.nombre = e.target.value;
  ENTRADAS[k]?.(e.target);
});
const ENTRADAS = {};
document.addEventListener('change', e => {
  const k = e.target.dataset?.cambio; if (!k) return;
  if (k === 'regDoc') { const f = e.target.files[0]; if (f) { UI.reg.doc = f.name; pintar(); } }
  CAMBIOS[k]?.(e.target);
});
const CAMBIOS = {};

FORMS.regRapido = d => {
  const nombre = d.usuario.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9._]{3,20}$/.test(nombre)) return aviso('Usa de 3 a 20 letras, números, punto o guion bajo.');
  const ya = DB.porUsuario(nombre);
  if (ya) { if (ya.rol === 'admin') return aviso('Ese usuario está reservado.'); DB.entrar(ya.id); return ir('#/inicio'); }
  const u = DB.registrar({ usuario: nombre, nombre, nombreVis: 'nadie', carrera: d.carrera || 'Sin carrera', contacto: 'modo prueba' });
  u.verificado = 'si'; DB.guardar(); aviso(`¡Bienvenido, @${nombre}! Te regalamos ${REGLAS.regaloBienvenida} ramitas.`); ir('#/inicio');
};
ACC.soyAdmin = () => abrirHoja(`<form class="pila" data-form="entrarAdmin"><h2>Entrar como admin</h2><label class="oculto" for="cla">Clave</label><input id="cla" name="clave" type="password" required placeholder="Clave de admin" autocomplete="off"><button class="btn ancho">Entrar</button></form>`);
FORMS.entrarAdmin = d => {
  if (d.clave !== CONFIG.claveAdmin) return aviso('Clave incorrecta');
  const cuentas = (CONFIG.cuentasEquipo || []).filter(c => DB.usuario(c.id));
  if (!cuentas.length) { const a = Object.values(DB.estado.usuarios).find(u => u.rol === 'admin'); cerrarHoja(); DB.entrar(a.id); return ir('#/inicio'); }
  abrirHoja(`<h2>¿Cuál es tu cuenta?</h2><div class="pila" style="gap:8px">${cuentas.map(c => { const u = DB.usuario(c.id); return `<button class="tarjeta fila" style="flex-wrap:nowrap;text-align:left;box-shadow:none;border:1.5px solid var(--linea);padding:10px 12px" data-a="elegirCuenta" data-id="${c.id}">${avatar(c.id).replace('<a ', '<span ').replace('</a>', '</span>')}<span style="flex:1"><b>${esc(c.nombre)}</b><br><span class="mini gris">@${esc(u.usuario)}</span></span>${u.rol === 'admin' ? '<span class="insignia i-morado">Admin</span>' : ''}</button>`; }).join('')}</div>`);
};
ACC.elegirCuenta = b => { cerrarHoja(); DB.entrar(b.dataset.id); aviso(`Hola, ${CONFIG.cuentasEquipo.find(c => c.id === b.dataset.id)?.nombre || ''}`); ir('#/inicio'); };
