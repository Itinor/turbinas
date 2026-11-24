'use strict';
const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const EDIF_ING = [
  { id: 'D', nombre: 'Edificio D', desc: 'Aulas 16 a 39', tipo: 'aulas', color: '#E9DDF7', borde: '#4B1F7A',
    pisos: [{ n: 'Planta baja', alas: [rango(16, 21), rango(22, 27)] }, { n: 'Planta alta', alas: [rango(28, 33), rango(34, 39)] }],
    puntos: ['1118,1186 1488,1088 1511,1148 1148,1254', '1473,1020 1911,974 1918,1057 1503,1103', '1470,1080 1500,1060 1520,1110 1490,1125'], et: [1316, 1172] },
  { id: 'E', nombre: 'Edificio E', desc: 'Aulas 40 a 63', tipo: 'aulas', color: '#DCE8FB', borde: '#174EAD',
    pisos: [{ n: 'Planta baja', alas: [rango(40, 45), rango(46, 51)] }, { n: 'Planta alta', alas: [rango(52, 57), rango(58, 63)] }],
    puntos: ['1216,1473 1571,1329 1594,1443 1254,1556', '1571,1299 2017,1261 2017,1337 1601,1397', '1560,1320 1600,1300 1615,1420 1575,1440'], et: [1409, 1468] },
  { id: 'C', nombre: 'Edificio C', desc: 'Laboratorios', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', niveles: [
      { n: 'Segundo nivel', cuartos: ['Laboratorio de Sensores Remotos', 'Aula', 'Laboratorio de Cómputo 7', 'Sanitarios'] },
      { n: 'Primer nivel', cuartos: ['Laboratorio de Química', 'Laboratorio de Física', 'Laboratorio de Cómputo 5', 'Laboratorio de Cómputo 6', 'Laboratorio de Automática', 'Oficina de Mantenimiento', 'Laboratorio de Electrónica', 'Laboratorio de Redes', 'Laboratorio de Cómputo 4', 'Laboratorio de Matemáticas y Sistemas Dinámicos', 'Cubículo', 'Cubículo', 'Comedor de Personal', 'Laboratorio Isotópico', 'Clubes Estudiantiles', 'Laboratorio de Simulación y Aleado Mecánico'] },
      { n: 'Planta baja', cuartos: ['Coordinación de Laboratorios Servicio Externo', 'Coordinación de Laboratorios Académicos', 'Oficina', 'Papelería', 'Gimnasio', 'Laboratorio de Cómputo 3', 'Consultorio Médico', 'Laboratorio de Cómputo 2', 'Sanitarios', 'Deportes (exterior)'] },
      { n: 'Sótano 1', dudoso: true, cuartos: ['Laboratorio de Fotogrametría', 'Laboratorio de Geología', 'Laboratorio de Sanitaria', 'Laboratorio de Hidráulica', 'Laboratorio de Cómputo 1', 'Aula de Posgrado'] },
      { n: 'Sótano 2', cuartos: ['Laboratorio de Mineralogía', 'Laboratorio de Metalurgia', 'Laboratorio de Geofísica', 'Almacén de Deportes', 'Laboratorio de Topografía', 'Sanitarios', 'Laboratorio de Materiales', 'Patio de Pruebas', 'Tanques de Gas de Laboratorios', 'Laboratorio de Máquinas y Herramientas', 'Laboratorio de Resonancia Magnética'] }],
    puntos: ['750,1306 990,1544 750,1806 630,1930 394,1700 560,1530'], et: [775, 1700] },
  { id: 'B', nombre: 'Edificio B', desc: 'Edificio de Posgrado', tipo: 'otro', color: '#FFF1C7', borde: '#8A5A00', niveles: [
      { n: 'Planta baja', cuartos: ['Oficina', 'Laboratorio de Cómputo', 'Laboratorio de Cómputo 11', 'Laboratorio de Cómputo 10', 'Laboratorio de Cómputo 9', 'Salón 1', 'Salón 2', 'Salón 3', 'Salón 4', 'Audiovisual 1', 'Escaleras', 'Sanitarios'] }],
    puntos: ['1090,1646 1180,1710 850,2186 760,2050'], et: [970, 1910] },
  { id: 'A', nombre: 'Edificio A', desc: 'Cubículos de Maestros', tipo: 'otro', color: '#FFE1D6', borde: '#B45309', puntos: ['1380,1960 1450,2000 1230,2300 1150,2250'], et: [1300, 2130] },
  { id: 'ADM', nombre: 'Edificio Administrativo', desc: 'Dirección y servicios escolares', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: ['1571,2092 1888,1979 1941,2130 1654,2266'], et: [1745, 2140], corto: 'Administrativo' },
  { id: 'BIB', nombre: 'Biblioteca', desc: 'Biblioteca DES de las Ingenierías', tipo: 'otro', color: '#FCE1EC', borde: '#A3245E', puntos: ['2130,1767 2311,1654 2447,1835 2296,1986'], et: [2290, 1822], corto: 'Biblioteca' },
  { id: 'CAF', nombre: 'Cafetería', desc: 'Cafetería central', tipo: 'otro', color: '#FFD3E2', borde: '#A3245E', puntos: ['2356,823 2591,823 2591,1012 2356,1012'], et: [2473, 918], corto: 'Cafetería' },
  { id: 'MAQ', nombre: 'Laboratorio de Máquinas y Herramientas', desc: 'Talleres', tipo: 'lab', color: '#DCF5E3', borde: '#14632F', puntos: ['386,1970 470,1880 586,1980 500,2080'], et: [486, 1980], corto: 'Máquinas' },
  { id: 'AUD', nombre: 'Auditorio Aguilera Baca', desc: 'Auditorio Fernando Aguilera Baca', tipo: 'otro', color: '#ECE7DF', borde: '#6B5B4B', puntos: ['1790,1639 1828,1594 1903,1624 2039,1616 2039,1730 1843,1730 1843,1669'], et: [1950, 1690], corto: 'Auditorio' },
  { id: 'PLZ', nombre: 'Plaza del Estudiante', desc: 'Punto de reunión', tipo: 'otro', color: '#FFF6DA', borde: '#8A5A00', puntos: ['2175,831 2349,823 2349,1065 2190,1072'], et: [2262, 960], corto: 'Plaza' },
  { id: 'CAN', nombre: 'Cancha', desc: 'Cancha deportiva', tipo: 'otro', color: '#DCF5E3', borde: '#14632F', puntos: ['2017,846 2145,846 2145,1065 2017,1065'], et: [2081, 955], corto: 'Cancha' },
  { id: 'AER', nombre: 'Aerópago', desc: 'Visión de los Aerópagos · punto de reunión', tipo: 'otro', color: '#DCE8FB', borde: '#174EAD', puntos: ['2402,1889 2466,1915 2492,1979 2466,2043 2402,2069 2338,2043 2312,1979 2338,1915'], et: [2402, 1979], corto: 'Aerópago' }
];
const PUNTOS_INTERES = [['1', 'Hangar (Edificio C)'], ['2', 'Gimnasio de pesas (Edificio C)'], ['3', 'Oficina de deportes (Edificio C)'], ['4', 'Árbol de estructuras'], ['5', 'Salón de seminarios (Administrativo)'], ['6', 'Auditorio Aguilera Baca'], ['7', 'Aerópago'], ['8', 'Plaza del Estudiante']];
const PUNTOS_REUNION = [['1', 'Edificio Administrativo', 1018, 692], ['2a', 'Audiovisual 1 y 2 de Posgrado', 680, 578], ['2b', 'Audiovisual 3 de Posgrado', 557, 757], ['3', 'Explanada de Laboratorios', 508, 568], ['4', 'Lobby de Laboratorios', 586, 606], ['5', 'Área de Cafetería', 1166, 218], ['6', 'Asta Bandera', 617, 438], ['7', 'Área de Biblioteca', 1162, 632], ['8', 'Visión de los Aerópagos', 1275, 792], ['9', 'Sala de Maestros', 705, 490], ['10', 'Plaza del Estudiante', 1088, 252]];
UI.ing = { sel: null, salon: null };
const edifDeSalon = n => EDIF_ING.find(e => e.pisos?.some(p => p.alas.some(a => a.includes(n))));
function numeroSalon(t) { const m = String(t || '').match(/(?:^|[^\d])(\d{1,3})(?!\d)/); if (!m) return null; const n = +m[1]; return edifDeSalon(n) ? n : null; }
function formaEdif(e, on) {
  const st = `fill="${e.color}" stroke="${e.borde}" stroke-width="3"`;
  if (e.formas) return e.formas.map(f => `<rect x="${f.c[0] - f.w / 2}" y="${f.c[1] - f.h / 2}" width="${f.w}" height="${f.h}" rx="${f.h / 2.2}" transform="rotate(${f.r} ${f.c[0]} ${f.c[1]})" ${st}/>`).join('') + (e.puente ? `<rect x="${e.puente[0] - e.puente[2] / 2}" y="${e.puente[1] - e.puente[3] / 2}" width="${e.puente[2]}" height="${e.puente[3]}" transform="rotate(${e.puente[4]} ${e.puente[0]} ${e.puente[1]})" ${st}/>` : '');
  return [].concat(e.puntos).map(p => `<polygon points="${p}" stroke-linejoin="round" ${st}/>`).join('');
}
function svgIngenieria() {
  const S = UI.ing, T = (x, y, t, tam = 34, color = '#1B1530', extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Inter,sans-serif" font-weight="800" font-size="${tam}" fill="${color}" ${extra}>${t}</text>`;
  const edifs = EDIF_ING.map(e => { const on = S.sel === e.id, letra = e.id.length === 1;
    return `<g class="edif-ing${on ? ' on' : ''}" data-a="ingEdif" data-dbl="ingPlano" data-id="${e.id}" role="button" tabindex="0" aria-label="${esc(e.nombre)}" style="cursor:pointer">${formaEdif(e, on)}<text x="${e.et[0]}" y="${e.et[1]}" text-anchor="middle" dominant-baseline="middle" font-family="Sora,sans-serif" font-weight="900" font-size="${letra ? 84 : 38}" fill="${e.borde}" pointer-events="none" paint-order="stroke" stroke="${e.color}" stroke-width="8">${letra ? e.id : esc(e.corto || e.nombre)}</text></g>`; }).join('');
  const poli = (l, f, st = 'none', w = 0, extra = '') => l.map(p => `<polygon points="${p}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`).join('');
  const estac = poli(['996,830 1253,649 1253,574 2982,559 2945,755 2340,747 2008,702 1903,763 1510,800 1283,846 996,982', '370,1510 377,1691 498,1600 483,1480 687,1299 770,1253 690,1240 560,1330', '1283,1661 1510,1556 1691,1631 1706,1782 1585,1857 1480,2100 1400,2340 1370,2445 1300,2300 1390,2000 1300,1870', '2325,1555 2840,1780 3095,1960 3125,2250 2050,2475 1950,2430 2175,2265 2460,2175 2325,2040 2145,2010'], '#D9D3CB', '#B8AFA4', 3);
  const verde = poli(['996,1057 1208,845 1887,755 1963,845 1963,1359 2234,1313 2250,1419 2144,1600 1963,1872 1812,1812 1706,1616 1525,1510 1253,1600 1193,1434 1057,1253', '695,2265 1042,1737 1148,1676 1283,1661 1510,2008 1374,2446'], '#D8EBC0');
  const quim = poli(['2711,770 2862,808 2719,1095 2640,1042', '3005,687 3232,740 3300,850 3300,1150 3110,1290 2832,1180 2950,950', '2560,1250 2610,1235 3260,1730 3230,1790', '2350,1430 2400,1410 3100,1940 3060,2000', '1888,1949 2077,1949 2077,2160 1888,2160'], '#E4E1EA', '#B9B3C6', 3);
  const sub = poli(['506,1580 660,1460 774,1600 630,1740', '820,1480 900,1400 974,1474 900,1550', '650,1850 720,1780 774,1870 720,1930'], '#B8EFD0', '#14632F', 2, 'pointer-events="none"') + poli(['1752,1979 1918,1896 1934,1979 1775,2024'], '#F7F1E6', '#6B5B4B', 2, 'pointer-events="none"');
  const pines = [['1', 640, 1600], ['2', 712, 1855], ['3', 897, 1475], ['4', 1548, 1246], ['4', 1122, 2024], ['5', 1845, 1965], ['6', 1929, 1600], ['7', 2402, 1920], ['8', 2262, 900]].map(([n, x, y]) => `<g pointer-events="none"><circle cx="${x}" cy="${y}" r="30" fill="#F08A5D" stroke="#fff" stroke-width="6"/>${T(x, y + 2, n, 34, '#fff')}</g>`).join('');
  const est = [['Alumnos', 1431, 740], ['Alumnos', 2620, 640], ['Personal', 521, 1400], ['Docentes', 1522, 1740], ['Docentes', 2408, 2215], ['Docentes', 1532, 2340]].map(([t, x, y]) => `<g pointer-events="none"><circle cx="${x - 120}" cy="${y}" r="30" fill="#fff" stroke="#C0262D" stroke-width="7"/>${T(x - 120, y + 2, 'E', 34)}${T(x + 20, y + 2, t, 34, '#5E4F40')}</g>`).join('');
  return `<svg viewBox="180 540 3120 1960" width="100%" style="display:block;min-width:760px;touch-action:manipulation" role="img" aria-label="Croquis de la Facultad de Ingeniería">
    <rect x="180" y="540" width="3120" height="1960" fill="#E6F2F2"/>
    ${verde}${estac}${quim}
    ${T(2950, 1500, 'Facultad de', 40, '#7A738C')}${T(2950, 1550, 'Ciencias Químicas', 40, '#7A738C')}
    ${edifs}${sub}${pines}${est}
    ${T(1950, 2470, 'Entrada principal', 36)}
    <g transform="translate(260 2380)" font-family="Inter,sans-serif" font-size="30" font-weight="700" fill="#5E5873" pointer-events="none"><circle cx="0" cy="0" r="22" fill="#F08A5D"/><text x="34" y="10">Puntos de interés (lista abajo)</text><circle cx="560" cy="0" r="22" fill="#fff" stroke="#C0262D" stroke-width="6"/><text x="594" y="10">Estacionamiento</text></g>
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
    <details class="tarjeta" open><summary class="peq" style="cursor:pointer"><b>Puntos de interés</b></summary><ol class="peq" style="margin:8px 0 0;padding-left:24px">${PUNTOS_INTERES.map(([n, t]) => `<li>${esc(t)}</li>`).join('')}</ol></details>
    <p class="mini gris" style="margin:0">Croquis sin medidas reales, basado en el mapa oficial de la facultad.</p>`;
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
