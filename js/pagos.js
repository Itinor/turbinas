/* Pagos — APAGADO.
   Basado en tu archivo "metodo-de-pago.html" (validación Luhn, CVV, PayPal, transferencia),
   mejorado y adaptado. Mientras CONFIG.pagosActivos sea false, ningún usuario lo ve: solo el
   admin puede abrir la vista previa en #/metodos-pago (no hay botón hacia ella).

   IMPORTANTE para cuando se active:
   - Nunca guardar el número completo de la tarjeta ni el CVV. Aquí solo se guarda marca,
     últimos 4 dígitos y vencimiento. El cobro real lo debe hacer un procesador
     (Mercado Pago, Stripe, Conekta, etc.), que convierte la tarjeta en un "token".
   - Validar en el servidor también; la validación de aquí es solo para avisar errores al escribir. */
'use strict';
const PAGOS = {
  soloDigitos: v => String(v || '').replace(/\D/g, ''),
  luhn(numero) {
    const n = this.soloDigitos(numero); if (n.length < 12 || n.length > 19) return false;
    let suma = 0, doble = false;
    for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (doble) { d *= 2; if (d > 9) d -= 9; } suma += d; doble = !doble; }
    return suma % 10 === 0;
  },
  marca(numero) {
    const n = this.soloDigitos(numero);
    if (/^4/.test(n)) return 'Visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'American Express';
    return 'Tarjeta';
  },
  cvvValido(cvv, numero) { const c = this.soloDigitos(cvv); return this.marca(numero) === 'American Express' ? c.length === 4 : c.length === 3; },
  /* acepta MM/AA o MM/AAAA; vence al terminar el mes */
  vencimientoValido(txt, hoy = new Date()) {
    const m = String(txt || '').trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/); if (!m) return false;
    const mes = +m[1], anio = m[2].length === 2 ? 2000 + +m[2] : +m[2]; if (mes < 1 || mes > 12) return false;
    return new Date(anio, mes, 1) > hoy && anio <= hoy.getFullYear() + 20;
  },
  correoValido: c => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(c || '').trim()),
  /* CLABE interbancaria (México): 18 dígitos, el último es dígito verificador con pesos 3,7,1 */
  clabeValida(clabe) {
    const n = this.soloDigitos(clabe); if (n.length !== 18) return false;
    const pesos = [3, 7, 1]; let s = 0; for (let i = 0; i < 17; i++) s += (+n[i] * pesos[i % 3]) % 10;
    return (10 - (s % 10)) % 10 === +n[17];
  },
  validar(d) {
    if (d.metodo === 'tarjeta') {
      if (!this.luhn(d.numero)) return 'El número de tarjeta no es válido.';
      if (!this.vencimientoValido(d.vence)) return 'La fecha de vencimiento no es válida (MM/AA).';
      if (!this.cvvValido(d.cvv, d.numero)) return 'El CVV no es válido.';
      if (String(d.titular || '').trim().length < 3) return 'Escribe el nombre como aparece en la tarjeta.';
    } else if (d.metodo === 'paypal') { if (!this.correoValido(d.correo)) return 'El correo de PayPal no es válido.'; }
    else if (d.metodo === 'transferencia') { if (!this.clabeValida(d.clabe)) return 'La CLABE no es válida (18 dígitos).'; }
    else return 'Elige un método.';
    return null;
  },
  /* lo único que se guarda: nunca el número completo ni el CVV */
  resumen(d) {
    if (d.metodo === 'tarjeta') return { id: uid('mp'), metodo: 'tarjeta', marca: this.marca(d.numero), ultimos: this.soloDigitos(d.numero).slice(-4), vence: d.vence.trim(), titular: d.titular.trim().slice(0, 60) };
    if (d.metodo === 'paypal') return { id: uid('mp'), metodo: 'paypal', correo: d.correo.trim().replace(/^(.).*(@.*)$/, '$1•••$2') };
    return { id: uid('mp'), metodo: 'transferencia', ultimos: this.soloDigitos(d.clabe).slice(-4) };
  },
  /* paquetes de ramitas pensados para cuando se active (precios de ejemplo) */
  paquetes: [{ ramitas: 100, mxn: 10 }, { ramitas: 550, mxn: 50 }, { ramitas: 1200, mxn: 100 }],
  compradoHoy(u = DB.yo()) { const hoy = fechaLocal(); return DB.movimientos(u.id).filter(m => m.tipo === 'compra' && fechaLocal(new Date(m.f)) === hoy).reduce((s, m) => s + m.monto, 0); },
  /* compra de prueba: valida los datos como si fuera real, pero no cobra nada */
  comprarDemo(i, d) {
    if (!CONFIG.pagosDemo) return { error: 'Las compras no están disponibles.' };
    const p = this.paquetes[i]; if (!p) return { error: 'Elige un paquete.' };
    if (this.compradoHoy() + p.ramitas > REGLAS.maxCompraDia) return { error: `Por hoy puedes comprar hasta ${REGLAS.maxCompraDia - this.compradoHoy()} ramitas más.` };
    if (d.metodo === 'guardado') { if (!(DB.yo().metodosPago || []).some(m => m.id === d.guardado)) return { error: 'Elige un método guardado.' }; }
    else if (d.metodo !== 'prueba') { const err = this.validar(d); if (err) return { error: err }; if (d.guardar) DB.yo().metodosPago = (DB.yo().metodosPago || []).concat(this.resumen(d)).slice(-3); }
    mover(DB.yo().id, p.ramitas, 'compra', `paquete ${p.ramitas} · $${p.mxn} MXN (prueba, sin cobro)`);
    DB.guardar(); return { ok: p };
  },
  guardarMetodo(d) {
    const err = this.validar(d); if (err) return { error: err };
    const u = DB.yo(); u.metodosPago = (u.metodosPago || []).concat(this.resumen(d)).slice(-3); DB.guardar(); return { ok: true };
  },
  quitarMetodo(id) { const u = DB.yo(); u.metodosPago = (u.metodosPago || []).filter(m => m.id !== id); DB.guardar(); },
  /* cobro: aquí se conectaría el procesador. Mientras esté apagado, no hace nada. */
  async comprar(paquete, metodoId) {
    if (!CONFIG.pagosActivos) return { error: 'Los pagos no están activos.' };
    return { error: 'Falta conectar el procesador de pagos.' };
  }
};
if (typeof window !== 'undefined') window.PAGOS = PAGOS;
if (typeof module !== 'undefined') module.exports = PAGOS;

if (typeof VISTAS !== 'undefined') {
  UI.pagoMetodo = 'tarjeta';
  VISTAS['metodos-pago'] = {
    titulo: 'Métodos de pago', atras: '#/perfil/ramitas', soloAdmin: !CONFIG.pagosActivos,
    render() {
      const u = DB.yo(), m = UI.pagoMetodo, guardados = u.metodosPago || [];
      return `<div class="pila">${CONFIG.pagosActivos ? '' : '<p class="insignia i-naranja" style="align-self:flex-start">Vista previa · apagado para los usuarios</p>'}
        ${guardados.length ? `<section class="tarjeta"><h2>Guardados</h2>${guardados.map(g => `<div class="entre" style="padding:8px 0;border-bottom:1px solid var(--linea)"><span>${g.metodo === 'tarjeta' ? `${esc(g.marca)} •••• ${g.ultimos} <span class="mini gris">vence ${esc(g.vence)}</span>` : g.metodo === 'paypal' ? `PayPal ${esc(g.correo)}` : `Transferencia •••• ${g.ultimos}`}</span><button class="icono-btn" style="color:var(--malTxt)" data-a="quitarMetodo" data-id="${g.id}" aria-label="Quitar">${icono('basura', 18)}</button></div>`).join('')}</section>` : ''}
        <form class="tarjeta pila" data-form="guardarMetodo" autocomplete="off"><h2>Agregar método</h2>
          <div class="rejilla3">${[['tarjeta', 'Tarjeta'], ['paypal', 'PayPal'], ['transferencia', 'Transferencia']].map(([k, n]) => `<button type="button" class="pastilla${m === k ? ' on' : ''}" data-a="pagoMetodo" data-m="${k}">${n}</button>`).join('')}</div>
          ${m === 'tarjeta' ? `<div><label class="campo" for="tn">Número de tarjeta</label><input id="tn" name="numero" inputmode="numeric" maxlength="23" placeholder="1234 5678 9012 3456" data-entrada="formatoTarjeta" required><p class="mini gris" id="tMarca" style="margin:4px 0 0"></p></div>
            <div class="rejilla2"><div><label class="campo" for="tv">Vence</label><input id="tv" name="vence" inputmode="numeric" maxlength="7" placeholder="MM/AA" required></div><div><label class="campo" for="tc">CVV</label><input id="tc" name="cvv" type="password" inputmode="numeric" maxlength="4" required></div></div>
            <div><label class="campo" for="tt">Titular</label><input id="tt" name="titular" maxlength="60" placeholder="Como aparece en la tarjeta" required></div>`
          : m === 'paypal' ? `<div><label class="campo" for="pc">Correo de PayPal</label><input id="pc" name="correo" type="email" required></div>`
          : `<div><label class="campo" for="cl">CLABE interbancaria</label><input id="cl" name="clabe" inputmode="numeric" maxlength="22" placeholder="18 dígitos" required></div>`}
          <input type="hidden" name="metodo" value="${m}"><p class="mini gris" style="margin:0">Solo guardamos la marca y los últimos 4 dígitos. Nunca el número completo ni el CVV.</p>
          <button class="btn ancho">Guardar método</button></form></div>`;
    }
  };
  ACC.pagoMetodo = b => { UI.pagoMetodo = b.dataset.m; refrescar(); };
  ACC.quitarMetodo = b => { PAGOS.quitarMetodo(b.dataset.id); refrescar(); };
  ENTRADAS.formatoTarjeta = el => { const n = PAGOS.soloDigitos(el.value).slice(0, 19); el.value = n.replace(/(\d{4})(?=\d)/g, '$1 '); const t = $('#tMarca'); if (t) t.textContent = n.length >= 2 ? PAGOS.marca(n) + (n.length >= 13 ? (PAGOS.luhn(n) ? ' · número válido' : ' · revisa el número') : '') : ''; };
  FORMS.guardarMetodo = (d, f) => { const r = PAGOS.guardarMetodo(d); if (r.error) return aviso(r.error); f.reset(); aviso('Método guardado'); refrescar(); };
}

if (typeof VISTAS !== 'undefined') {
  UI.compra = { paquete: 1, metodo: 'prueba' };
  VISTAS['comprar-ramitas'] = {
    titulo: 'Comprar ramitas', nav: 'perfil', atras: '#/ramitas',
    render() {
      if (!CONFIG.pagosDemo && !CONFIG.pagosActivos) return '<p class="vacio">Las compras no están disponibles.</p>';
      const C = UI.compra, g = DB.yo().metodosPago || [], m = C.metodo;
      return `<div class="pila">${CONFIG.pagosActivos ? '' : '<p class="insignia i-naranja" style="align-self:flex-start">Modo prueba · no se cobra nada</p>'}
        <section class="tarjeta"><h2 style="margin-bottom:8px">Paquete</h2><div class="pila" style="gap:8px">${PAGOS.paquetes.map((p, i) => `<button class="tarjeta entre" style="box-shadow:none;padding:12px 14px;border:2px solid ${C.paquete === i ? 'var(--morado)' : 'var(--linea)'}" data-a="compraPaquete" data-i="${i}" aria-pressed="${C.paquete === i}"><b style="font-family:Sora,sans-serif;font-size:20px">${numero(p.ramitas)} ${icono('rayo', 16)}</b><span>$${p.mxn} MXN</span></button>`).join('')}</div></section>
        <form class="tarjeta pila" data-form="pagarRamitas" autocomplete="off"><h2>Pago</h2>
          <div class="pestanas">${[...(g.length ? [['guardado', 'Guardado']] : []), ['tarjeta', 'Tarjeta'], ['paypal', 'PayPal'], ['transferencia', 'Transferencia'], ['prueba', 'Sin datos (prueba)']].map(([k, n]) => `<button type="button" class="pastilla${m === k ? ' on' : ''}" data-a="compraMetodo" data-m="${k}">${n}</button>`).join('')}</div>
          ${m === 'guardado' ? `<div class="pila" style="gap:6px">${g.map((x, i) => `<label class="tarjeta fila" style="box-shadow:none;padding:10px 12px;border:1.5px solid var(--linea)"><input type="radio" name="guardado" value="${x.id}" ${i === 0 ? 'checked' : ''}> ${x.metodo === 'tarjeta' ? `${esc(x.marca)} •••• ${x.ultimos}` : x.metodo === 'paypal' ? 'PayPal ' + esc(x.correo) : 'Transferencia •••• ' + x.ultimos}</label>`).join('')}</div>`
          : m === 'tarjeta' ? `<div><label class="campo" for="tn">Número de tarjeta</label><input id="tn" name="numero" inputmode="numeric" maxlength="23" placeholder="1234 5678 9012 3456" data-entrada="formatoTarjeta" required><p class="mini gris" id="tMarca" style="margin:4px 0 0"></p></div>
            <div class="rejilla2"><div><label class="campo" for="tv">Vence</label><input id="tv" name="vence" inputmode="numeric" maxlength="7" placeholder="MM/AA" required></div><div><label class="campo" for="tc">CVV</label><input id="tc" name="cvv" type="password" inputmode="numeric" maxlength="4" required></div></div>
            <div><label class="campo" for="tt">Titular</label><input id="tt" name="titular" maxlength="60" required></div><label class="fila peq"><input type="checkbox" name="guardar"> Guardar tarjeta (solo marca y últimos 4)</label>`
          : m === 'paypal' ? `<div><label class="campo" for="pc">Correo de PayPal</label><input id="pc" name="correo" type="email" required></div><label class="fila peq"><input type="checkbox" name="guardar"> Guardar</label>`
          : m === 'transferencia' ? `<div><label class="campo" for="cl">CLABE</label><input id="cl" name="clabe" inputmode="numeric" maxlength="22" placeholder="18 dígitos" required></div><label class="fila peq"><input type="checkbox" name="guardar"> Guardar</label>`
          : '<p class="peq gris" style="margin:0">Se te agregan las ramitas sin pedir datos.</p>'}
          <input type="hidden" name="metodo" value="${m}"><button class="btn ancho">Pagar $${PAGOS.paquetes[C.paquete].mxn} MXN</button></form></div>`;
    }
  };
  ACC.compraPaquete = b => { UI.compra.paquete = +b.dataset.i; refrescar(); };
  ACC.compraMetodo = b => { UI.compra.metodo = b.dataset.m; refrescar(); };
  FORMS.pagarRamitas = d => { const r = PAGOS.comprarDemo(UI.compra.paquete, d); if (r.error) return aviso(r.error); actualizarChip(); aviso(`+${numero(r.ok.ramitas)} ramitas.${CONFIG.pagosActivos ? '' : ' No se cobró nada.'}`); ir('#/ramitas'); };
}
