'use strict';
const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const EDIF_ING = [
  { id: 'D', nombre: 'Edificio D', desc: 'Aulas 16 a 39', tipo: 'aulas', color: '#E9DDF7', borde: '#4B1F7A',
    pisos: [{ n: 'Planta baja', alas: [rango(16, 21), rango(22, 27)] }, { n: 'Planta alta', alas: [rango(28, 33), rango(34, 39)] }],
    puntos: '660,660 865,590 1088,558 1096,614 890,642 680,714', et: [820, 632] },
  { id: 'E', nombre: 'Edificio E', desc: 'Aulas 40 a 63', tipo: 'aulas', color: '#DCE8FB', borde: '#174EAD',
    pisos: [{ n: 'Planta baja', alas: [rango(40, 45), rango(46, 51)] }, { n: 'Planta alta', alas: [rango(52, 57), rango(58, 63)] }],
    puntos: '730,790 918,730 1143,678 1174,698 1166,742 938,792 748,854', et: [880, 772] },
  { id: 'C', nombre: 'Edificio C', desc: 'Laboratorios', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', niveles: [
      { n: 'Segundo nivel', cuartos: ['Laboratorio de Sensores Remotos', 'Aula', 'Laboratorio de Cómputo 7', 'Sanitarios'] },
      { n: 'Primer nivel', cuartos: ['Laboratorio de Química', 'Laboratorio de Física', 'Laboratorio de Cómputo 5', 'Laboratorio de Cómputo 6', 'Laboratorio de Automática', 'Oficina de Mantenimiento', 'Laboratorio de Electrónica', 'Laboratorio de Redes', 'Laboratorio de Cómputo 4', 'Laboratorio de Matemáticas y Sistemas Dinámicos', 'Cubículo', 'Cubículo', 'Comedor de Personal', 'Laboratorio Isotópico', 'Clubes Estudiantiles', 'Laboratorio de Simulación y Aleado Mecánico'] },
      { n: 'Planta baja', cuartos: ['Coordinación de Laboratorios Servicio Externo', 'Coordinación de Laboratorios Académicos', 'Oficina', 'Papelería', 'Gimnasio', 'Laboratorio de Cómputo 3', 'Consultorio Médico', 'Laboratorio de Cómputo 2', 'Sanitarios', 'Deportes (exterior)'] },
      { n: 'Sótano 1', dudoso: true, cuartos: ['Laboratorio de Fotogrametría', 'Laboratorio de Geología', 'Laboratorio de Sanitaria', 'Laboratorio de Hidráulica', 'Laboratorio de Cómputo 1', 'Aula de Posgrado'] },
      { n: 'Sótano 2', cuartos: ['Laboratorio de Mineralogía', 'Laboratorio de Metalurgia', 'Laboratorio de Geofísica', 'Almacén de Deportes', 'Laboratorio de Topografía', 'Sanitarios', 'Laboratorio de Materiales', 'Patio de Pruebas', 'Tanques de Gas de Laboratorios', 'Laboratorio de Máquinas y Herramientas', 'Laboratorio de Resonancia Magnética'] }],
    puntos: '465,765 575,810 615,885 560,960 520,1025 435,1090 380,1050 325,1010 390,870', et: [475, 940] },
  { id: 'B', nombre: 'Edificio B', desc: 'Edificio de Posgrado', tipo: 'otro', color: '#FFF1C7', borde: '#8A5A00', niveles: [
      { n: 'Planta baja', cuartos: ['Oficina', 'Laboratorio de Cómputo', 'Laboratorio de Cómputo 11', 'Laboratorio de Cómputo 10', 'Laboratorio de Cómputo 9', 'Salón 1', 'Salón 2', 'Salón 3', 'Salón 4', 'Audiovisual 1', 'Escaleras', 'Sanitarios'] }],
    puntos: '665,915 720,945 705,975 660,1000 610,1040 560,1170 505,1160 500,1130 560,1050 600,1000 650,960', et: [612, 1035] },
  { id: 'A', nombre: 'Edificio A', desc: 'Cubículos de Maestros', tipo: 'otro', color: '#FFE1D6', borde: '#B45309', puntos: '805,1080 865,1090 850,1120 765,1225 725,1205 740,1190', et: [800, 1150] },
  { id: 'ADM', nombre: 'Edificio Administrativo', desc: 'Dirección y servicios escolares', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: '940,1120 1040,1065 1045,1030 1105,1025 1110,1040 1180,1040 1185,1100 1110,1110 1065,1170 980,1205', et: [1060, 1120], corto: 'Administrativo' },
  { id: 'BIB', nombre: 'Biblioteca', desc: 'Biblioteca DES de las Ingenierías', tipo: 'otro', color: '#FCE1EC', borde: '#A3245E', puntos: '1205,960 1300,905 1365,980 1265,1065', et: [1285, 985], corto: 'Biblioteca' },
  { id: 'CAF', nombre: 'Cafetería', desc: 'Cafetería central', tipo: 'otro', color: '#FFD3E2', borde: '#A3245E', puntos: '1135,490 1200,490 1200,605 1135,605', et: [1168, 548], corto: 'Cafetería' },
  { id: 'MAQ', nombre: 'Laboratorio de Máquinas y Herramientas', desc: 'Talleres', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', puntos: '310,1055 415,1090 395,1145 300,1110', et: [357, 1100], corto: 'Máquinas' },
  { id: 'AUD', nombre: 'Auditorio Fernando Aguilera Baca', desc: 'Auditorio', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: '1040,895 1165,885 1167,930 1045,940', et: [1103,913], corto: 'Auditorio' },
  { id: 'RES', nombre: 'Centro de Resonancia Magnética', desc: '', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: '322,832 368,832 368,878 322,878', et: [345, 855] },
];
const PUNTOS_REUNION = [['1', 'Edificio Administrativo', 1018, 692], ['2a', 'Audiovisual 1 y 2 de Posgrado', 680, 578], ['2b', 'Audiovisual 3 de Posgrado', 557, 757], ['3', 'Explanada de Laboratorios', 508, 568], ['4', 'Lobby de Laboratorios', 586, 606], ['5', 'Área de Cafetería', 1166, 218], ['6', 'Asta Bandera', 617, 438], ['7', 'Área de Biblioteca', 1162, 632], ['8', 'Visión de los Aerópagos', 1275, 792], ['9', 'Sala de Maestros', 705, 490], ['10', 'Plaza del Estudiante', 1088, 252]];
UI.ing = { sel: null, salon: null };
const edifDeSalon = n => EDIF_ING.find(e => e.pisos?.some(p => p.alas.some(a => a.includes(n))));
function numeroSalon(t) { const m = String(t || '').match(/(?:^|[^\d])(\d{1,3})(?!\d)/); if (!m) return null; const n = +m[1]; return edifDeSalon(n) ? n : null; }
function formaEdif(e, on) {
  const st = `fill="${e.color}" stroke="${e.borde}" stroke-width="3"`;
  if (e.formas) return e.formas.map(f => `<rect x="${f.c[0] - f.w / 2}" y="${f.c[1] - f.h / 2}" width="${f.w}" height="${f.h}" rx="${f.h / 2.2}" transform="rotate(${f.r} ${f.c[0]} ${f.c[1]})" ${st}/>`).join('') + (e.puente ? `<rect x="${e.puente[0] - e.puente[2] / 2}" y="${e.puente[1] - e.puente[3] / 2}" width="${e.puente[2]}" height="${e.puente[3]}" transform="rotate(${e.puente[4]} ${e.puente[0]} ${e.puente[1]})" ${st}/>` : '');
  return `<polygon points="${e.puntos}" stroke-linejoin="round" ${st}/>`;
}
function svgIngenieria() {
  const S = UI.ing;
  const edifs = EDIF_ING.map(e => { const on = S.sel === e.id, chico = ['RES'].includes(e.id), letra = e.id.length === 1;
    return `<g class="edif-ing${on ? ' on' : ''}" data-a="ingEdif" data-dbl="ingPlano" data-id="${e.id}" role="button" tabindex="0" aria-label="${esc(e.nombre)}" style="cursor:pointer">${formaEdif(e, on)}${chico ? '' : `<text x="${e.et[0]}" y="${e.et[1]}" text-anchor="middle" dominant-baseline="middle" font-family="Sora,sans-serif" font-weight="900" font-size="${letra ? 48 : 22}" fill="${e.borde}" pointer-events="none" paint-order="stroke" stroke="${e.color}" stroke-width="5">${letra ? e.id : esc(e.corto || e.nombre)}</text>`}</g>`; }).join('');
  const quim = ['1310,475 1430,475 1430,565 1310,565', '1470,445 1575,460 1530,595 1465,590', '1610,420 1720,400 1830,450 1820,690 1700,700 1610,640', '1320,780 1350,760 1520,870 1720,1040 1710,1080 1660,1080 1490,950 1330,830', '1410,690 1440,670 1600,780 1800,920 1790,960 1740,960 1580,830 1420,720'].map(p => `<polygon points="${p}" fill="#E4E1EA" stroke="#B9B3C6" stroke-width="2" stroke-linejoin="round"/>`).join('');
  const estac = ['755,335 900,250 1150,135 1640,215 1600,345 1490,375 1485,428 1270,428 1100,465 980,490 800,450', '340,785 450,670 495,695 390,830', '790,920 980,900 990,980 850,1000', '850,1300 900,1210 1130,1195 1185,1255 1200,1300', '1190,1260 1395,1060 1490,1055 1510,1225'].map(p => `<polygon points="${p}" fill="#DDE3EA" stroke="#9BC48A" stroke-width="3" stroke-dasharray="10 6" stroke-linejoin="round"/>`).join('');
  const caminos = ['M590,700 C620,620 700,580 860,548 L1095,478', 'M600,720 C700,690 760,700 900,650 L1150,630 C1200,640 1215,680 1190,700', 'M640,700 C640,780 660,830 700,850', 'M935,600 L930,700 C950,790 1000,860 1060,900 L1160,985', 'M1160,985 L900,1010 L640,1005 L560,985', 'M590,740 C520,800 470,860 430,930 C380,1010 330,1080 300,1130 C340,1210 420,1250 560,1280 L840,1300', 'M1160,985 C1175,1040 1185,1100 1190,1190', 'M1160,985 C1220,950 1250,900 1265,820 C1270,760 1290,720 1340,690', 'M1280,740 C1360,700 1440,740 1520,800 C1600,860 1660,930 1700,1000', 'M1330,800 C1400,900 1500,1010 1650,1080 C1700,1100 1720,1080 1700,1050', 'M1180,700 C1220,640 1240,600 1290,580', 'M520,690 L620,710', 'M820,860 C900,830 980,840 1060,900'].map(d => `<path d="${d}" fill="none" stroke="#B89C80" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg viewBox="140 110 1940 1250" width="100%" style="display:block;min-width:760px;touch-action:manipulation" role="img" aria-label="Croquis de la Facultad de Ingeniería">
    <rect x="140" y="110" width="1940" height="1250" fill="#E6F0D8"/>
    <path d="M150,520 C300,420 500,260 700,150" fill="none" stroke="#D6D1E2" stroke-width="60"/>
    <path id="circuito" d="M160,1170 C300,1250 600,1320 1000,1335 C1400,1330 1700,1280 2070,1200" fill="none" stroke="#D6D1E2" stroke-width="48"/>
    <path d="M1900,300 C2000,450 2060,700 2060,1180" fill="none" stroke="#D6D1E2" stroke-width="48"/>
    <text font-family="Inter,sans-serif" font-size="26" font-weight="700" fill="#5E5873" dy="9"><textPath href="#circuito" startOffset="42%">Circuito Universitario</textPath></text>
    ${estac}
    <text x="1250" y="290" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="#5F7F55" text-anchor="middle">Estacionamiento</text>
    ${caminos}${quim}
    <text x="1700" y="560" font-family="Inter,sans-serif" font-size="26" font-weight="800" fill="#7A738C" text-anchor="middle">Facultad de</text><text x="1700" y="590" font-family="Inter,sans-serif" font-size="26" font-weight="800" fill="#7A738C" text-anchor="middle">Ciencias Químicas</text>
    ${edifs}
    <g aria-hidden="true" font-family="Inter,sans-serif" font-size="20" font-weight="700" transform="translate(0 -14) scale(1)"><rect x="160" y="1258" width="16" height="16" fill="#DDE3EA" stroke="#9BC48A" stroke-width="2" stroke-dasharray="4 3"/><text x="186" y="1272" fill="#5E5873">Estacionamiento</text><line x1="370" y1="1266" x2="400" y2="1266" stroke="#B89C80" stroke-width="8" stroke-linecap="round"/><text x="410" y="1272" fill="#5E5873">Caminos</text><rect x="520" y="1258" width="16" height="16" fill="#E4E1EA" stroke="#B9B3C6" stroke-width="2"/><text x="546" y="1272" fill="#5E5873">Otra facultad</text></g>
  </svg>`;
}
const quitarAc = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tieneSalones = e => !!(e.pisos || e.niveles);
function panelEdificio(e) {
  if (!e) return '<p class="peq gris" style="margin:0">Toca un edificio para ver qué es. <b>Doble clic</b> (o doble toque) para ver sus salones y laboratorios.</p>';
  const cuantos = e.pisos ? `${e.pisos.length} plantas · ${e.pisos.reduce((a, p) => a + p.alas.flat().length, 0)} salones` : e.niveles ? `${e.niveles.length} nivel${e.niveles.length > 1 ? 'es' : ''} · ${e.niveles.reduce((a, n) => a + n.cuartos.length, 0)} espacios` : '';
  return `<section class="tarjeta entre" style="gap:10px"><span><span class="etiqueta" style="color:${e.borde}">Ingeniería</span><h2 style="margin:4px 0">${esc(e.nombre)}</h2><p class="gris peq" style="margin:0">${esc(e.desc)}${cuantos ? ' · ' + cuantos : ''}</p></span>${tieneSalones(e) ? `<button class="btn" style="flex:none" data-a="ingPlano" data-id="${e.id}">Ver salones</button>` : ''}</section>`;
}
function planoEdificio(e) {
  const S = UI.ing;
  if (e.pisos) return e.pisos.slice().reverse().map(p => `<p class="etiqueta gris" style="margin:14px 0 6px">${p.n}</p><div class="alas-edif una-fila">${p.alas.map(a => `<div class="ala">${a.map(n => `<button class="salon-cel${S.salon === n ? ' on' : ''}" data-a="ingSalon" data-n="${n}">${n}</button>`).join('')}</div>`).join('<span class="escalera" title="Escaleras" aria-label="Escaleras"></span>')}</div>`).join('')
    + (S.salon && edifDeSalon(S.salon) === e ? (() => { const p = e.pisos.find(p => p.alas.some(a => a.includes(S.salon))), ala = p.alas.findIndex(a => a.includes(S.salon)); return `<p class="peq" style="margin:12px 0 0"><b>Salón ${S.salon}</b>: ${p.n.toLowerCase()}, ${ala === 0 ? 'primera' : 'segunda'} mitad (${p.alas[ala][0]} a ${p.alas[ala].at(-1)}).</p>`; })() : '');
  return e.niveles.map(nv => `<p class="etiqueta gris" style="margin:14px 0 6px">${nv.n}${nv.dudoso ? ' <span class="mini" style="text-transform:none">· por confirmar</span>' : ''}</p><div class="cuartos">${nv.cuartos.map((c, i) => { const on = S.cuarto === e.id + '|' + nv.n + '|' + i; return `<button class="cuarto${on ? ' on' : ''}${/sanitario|escalera/i.test(c) ? ' serv' : ''}" data-a="ingCuarto" data-k="${esc(e.id + '|' + nv.n + '|' + i)}"><b>${i + 1}</b><span>${esc(c)}</span></button>`; }).join('')}</div>`).join('');
}
function hojaPlano(e) {
  abrirHoja(`<div class="pila" style="gap:4px"><span class="etiqueta" style="color:${e.borde}">Ingeniería</span><h2 style="margin:0">${esc(e.nombre)}</h2><p class="gris peq" style="margin:0">${esc(e.desc)}${e.pisos ? ' · 6 salones, escaleras y 6 salones en cada planta' : ''}</p><div id="planoIng">${planoEdificio(e)}</div></div>`);
  $('#velo .hoja')?.classList.add('grande');
  setTimeout(() => $('#planoIng .on')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
}
function vistaMapaIng() {
  const S = UI.ing, e = EDIF_ING.find(x => x.id === S.sel);
  return `<form data-form="buscarIng" class="fila" style="flex-wrap:nowrap"><label class="oculto" for="bsi">Buscar salón o edificio</label><input id="bsi" name="q" list="lugaresIng" placeholder="Busca: 21, SA-42, LC9, química, gimnasio…" autocomplete="off"><datalist id="lugaresIng">${EDIF_ING.map(x => `<option value="${esc(x.nombre)}">`).join('')}${[...new Set(TODOS_CUARTOS().map(x => x.c))].filter(c => !/^(sanitarios|escaleras|cubículo|oficina|aula)$/i.test(c)).map(c => `<option value="${esc(c)}">`).join('')}</datalist><button class="btn2">Buscar</button></form>
    <div class="mapa" id="mapaIng">${svgIngenieria()}</div>
    <div id="panelIng">${panelEdificio(e)}</div>
    <details class="tarjeta"><summary class="peq" style="cursor:pointer"><b>Puntos de reunión</b></summary><ol class="peq" style="margin:8px 0 0;padding-left:28px">${PUNTOS_REUNION.map(([n, t]) => `<li value="${parseInt(n)}">${n.length > 1 ? `<b>${n}</b> ` : ''}${esc(t)}</li>`).join('')}</ol></details>
    <p class="mini gris" style="margin:0">Croquis sin medidas reales, basado en el mapa satelital y el letrero del campus.</p>`;
}
ACC.ingEdif = b => { UI.ing.sel = b.dataset.id; UI.ing.salon = null; UI.ing.cuarto = null; $$('.edif-ing').forEach(g => g.classList.toggle('on', g.dataset.id === UI.ing.sel)); const p = $('#panelIng'); if (p) p.innerHTML = panelEdificio(EDIF_ING.find(x => x.id === UI.ing.sel)); };
ACC.ingPlano = b => { const e = EDIF_ING.find(x => x.id === b.dataset.id); if (!e) return; if (UI.ing.sel !== e.id) { UI.ing.salon = null; UI.ing.cuarto = null; } UI.ing.sel = e.id; $$('.edif-ing').forEach(g => g.classList.toggle('on', g.dataset.id === e.id)); const p = $('#panelIng'); if (p) p.innerHTML = panelEdificio(e); if (tieneSalones(e)) hojaPlano(e); };
const repintarPlano = () => { const e = EDIF_ING.find(x => x.id === UI.ing.sel), el = $('#planoIng'); if (e && el) el.innerHTML = planoEdificio(e); };
ACC.ingSalon = b => { UI.ing.salon = +b.dataset.n; repintarPlano(); };
ACC.ingCuarto = b => { UI.ing.cuarto = UI.ing.cuarto === b.dataset.k ? null : b.dataset.k; repintarPlano(); };
const TODOS_CUARTOS = () => EDIF_ING.flatMap(e => (e.niveles || []).flatMap(nv => nv.cuartos.map((c, i) => ({ e, nv, i, c, k: e.id + '|' + nv.n + '|' + i }))));
function buscarCuarto(q) {
  let s = quitarAc(q).replace(/^(sa|salon|aula)[\s-]*/, '').trim();
  const L = TODOS_CUARTOS(), norm = x => quitarAc(x.c);
  let m = s.match(/^lc\s*-?\s*(\d+)$/); if (m) return L.find(x => norm(x) === 'laboratorio de computo ' + m[1]);
  m = s.match(/^s\s*-?\s*(\d)$/); if (m) return L.find(x => x.e.id === 'B' && norm(x) === 'salon ' + m[1]);
  m = s.match(/^a\s*-?\s*(\d)$/); if (m) return L.find(x => norm(x) === 'audiovisual ' + m[1]);
  m = s.match(/^l([a-z]{3,})$/); if (m) { const pref = m[1].slice(0, 4); const r = L.find(x => /^laboratorio/.test(norm(x)) && norm(x).split(/\s+/).slice(2).some(w => w.startsWith(pref))); if (r) return { ...r, aprox: true }; }
  if (s.length >= 3) return L.find(x => norm(x) === s) || L.find(x => norm(x).includes(s));
  return null;
}
FORMS.buscarIng = d => {
  const q = String(d.q || '').trim(); if (!q) return;
  const n = numeroSalon(q);
  if (n && !/^\s*(lc|s|a)\s*-?\s*\d/i.test(q)) { const e = edifDeSalon(n); UI.ing.sel = e.id; UI.ing.salon = n; UI.ing.cuarto = null; refrescar(); hojaPlano(e); return; }
  const c = buscarCuarto(q);
  if (c) { UI.ing.sel = c.e.id; UI.ing.cuarto = c.k; UI.ing.salon = null; refrescar(); hojaPlano(c.e); if (c.aprox) aviso(`Lo más parecido: ${c.c}`); return; }
  const s = quitarAc(q);
  const e = EDIF_ING.find(x => quitarAc(x.nombre + ' ' + x.desc).includes(s)) || EDIF_ING.find(x => x.id.toLowerCase() === s.replace(/^edificio\s*/, ''));
  if (!e) return aviso('No encontramos ese salón o lugar todavía.');
  UI.ing.sel = e.id; UI.ing.salon = null; UI.ing.cuarto = null; refrescar();
};
function irASalon(t) { UI.mapa.vista = 'ing'; ir('#/explorar/mapa'); setTimeout(() => FORMS.buscarIng({ q: t }), 120); return true; }
const salonEnMapaValido = t => !!(numeroSalon(t) || buscarCuarto(t));
ACC.salonEnMapa = b => { cerrarHoja(); irASalon(b.dataset.s); };
