/* Generador de ejercicios de Cálculo por plantillas */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R = (rng,a,b)=>a+Math.floor(rng()*(b-a+1));
const RNZ = (rng,a,b)=>{let v=0;while(v===0)v=R(rng,a,b);return v;};
const gcd = (a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
function fr(n,d){if(d<0){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
const neg = s=>MENOS+s;
function num(v){return v<0?neg(String(-v)):String(v);}
function frHtml(f){const s=f.n<0?MENOS:'';const n=Math.abs(f.n);return f.d===1?s+n:`${s}<span class="fr"><span>${n}</span><span>${f.d}</span></span>`;}
function xp(p){return p===0?'':p===1?'x':`x<sup>${p}</sup>`;}
/* coeficiente (entero o fracción) delante de un cuerpo; sin signo si abs */
function coef(c,body,abs){const f=typeof c==='number'?{n:c,d:1}:c;const sg=f.n<0&&!abs?MENOS:'';const n=Math.abs(f.n);
  if(!body)return sg+(f.d===1?n:frHtml({n,d:f.d}));
  if(f.d===1)return sg+(n===1?'':n)+body;return sg+frHtml({n,d:f.d})+body;}
/* une términos [c, cuerpo] con signos */
function suma(ts){let out='';ts.filter(t=>(typeof t[0]==='number'?t[0]:t[0].n)!==0).forEach((t,i)=>{const v=typeof t[0]==='number'?t[0]:t[0].n;
  if(i===0)out+=coef(t[0],t[1]);else out+=(v<0?` ${MENOS} `:' + ')+coef(t[0],t[1],true);});return out||'0';}
const sen = b=>`sen(${b===1?'':b}x)`, cos = b=>`cos(${b===1?'':b}x)`;
const lin = (a,b)=>`${a===1?'':a===-1?MENOS:num(a)}x ${b<0?MENOS:'+'} ${Math.abs(b)}`;

const NIVELES = ['Muy fácil','Fácil','Difícil','Muy difícil'];
const PREMIO = {'Muy fácil':3,'Fácil':5,'Difícil':20,'Muy difícil':40};

const T = [
{ id:'deriv-poli', nivel:'Muy fácil', tema:'Derivadas', titulo:'Derivada de un polinomio', gen(r){
  const a=R(r,2,9),n=R(r,2,5),b=RNZ(r,-9,9),c=R(r,-9,9);
  return { pregunta:'¿Cuál es la derivada?', expr:'f(x) = '+suma([[a,xp(n)],[b,'x'],[c,'']]),
    ok:suma([[a*n,xp(n-1)],[b,'']]),
    malas:[suma([[a,xp(n-1)],[b,'']]), suma([[a*n,xp(n)],[b,'']]), suma([[a*n,xp(n-1)]]), suma([[a*n,xp(n-1)],[b,'x']])],
    porque:`Baja el exponente y réstale 1: (${a}x<sup>${n}</sup>)′ = ${a*n}${xp(n-1)}. La derivada de ${num(b)}x es ${num(b)} y la de una constante es 0.`,
    check:{k:'deriv',f:x=>a*x**n+b*x+c,df:x=>a*n*x**(n-1)+b} };}},
{ id:'lim-directo', nivel:'Muy fácil', tema:'Límites', titulo:'Límite por sustitución', gen(r){
  const a=RNZ(r,-6,9),b=RNZ(r,-9,9),k=R(r,2,8);const L=a*k+b;
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→${k}</sub> (${lin(a,b)})`,
    ok:num(L), malas:[num(a+b),num(a*k-b),num(k+b),num(L+a)],
    porque:`La función es continua, así que basta sustituir x = ${k}: ${num(a)}·${k} ${b<0?MENOS:'+'} ${Math.abs(b)} = ${num(L)}.`,
    check:{k:'lim',g:x=>a*x+b,at:k,L} };}},
{ id:'deriv-seno', nivel:'Fácil', tema:'Derivadas', titulo:'Derivada del seno', gen(r){
  const a=R(r,2,9),b=R(r,2,7);
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${a}${sen(b)}`,
    ok:`${a*b}${cos(b)}`, malas:[`${a}${cos(b)}`,`${MENOS}${a*b}${cos(b)}`,`${a*b}${sen(b)}`,`${a}${cos(b)}${b}`],
    porque:`(sen u)′ = cos u · u′. Aquí u = ${b}x, así que se multiplica por ${b}: ${a}·${b} = ${a*b}.`,
    check:{k:'deriv',f:x=>a*Math.sin(b*x),df:x=>a*b*Math.cos(b*x)} };}},
{ id:'int-potencia', nivel:'Fácil', tema:'Integrales', titulo:'Integral de una potencia', gen(r){
  const a=R(r,2,12),n=R(r,1,5);
  return { pregunta:'Resuelve la integral', expr:`∫ ${a}${xp(n)} dx`,
    ok:coef(fr(a,n+1),xp(n+1))+' + C',
    malas:[coef(a*n,xp(n-1))+' + C', coef(fr(a,n),xp(n+1))+' + C', coef(a,xp(n+1))+' + C', coef(fr(a,n+1),xp(n))+' + C'],
    porque:`Súmale 1 al exponente y divide entre el nuevo exponente: ${a}·x<sup>${n+1}</sup>/${n+1}. No olvides la constante C.`,
    check:{k:'anti',f:x=>a*x**n,F:x=>a/(n+1)*x**(n+1)} };}},
{ id:'lim-factor', nivel:'Fácil', tema:'Límites', titulo:'Límite con factorización', gen(r){
  const k=R(r,3,9);
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→${k}</sub> <span class="fr"><span>x<sup>2</sup> ${MENOS} ${k*k}</span><span>x ${MENOS} ${k}</span></span>`,
    ok:String(2*k), malas:[String(k),String(k*k),'No existe','0'],
    porque:`Sustituir da 0/0. Factoriza: x<sup>2</sup> ${MENOS} ${k*k} = (x ${MENOS} ${k})(x + ${k}). Se cancela (x ${MENOS} ${k}) y queda x + ${k} → ${2*k}.`,
    check:{k:'lim',g:x=>(x*x-k*k)/(x-k),at:k,L:2*k} };}},
{ id:'deriv-producto', nivel:'Difícil', tema:'Derivadas', titulo:'Regla del producto', gen(r){
  const n=R(r,2,4),b=R(r,2,5);
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${xp(n)} · ${sen(b)}`,
    ok:`${coef(n,xp(n-1))}${sen(b)} + ${coef(b,xp(n))}${cos(b)}`,
    malas:[`${coef(n*b,xp(n-1))}${cos(b)}`, `${coef(n,xp(n-1))}${sen(b)} ${MENOS} ${coef(b,xp(n))}${cos(b)}`, `${coef(n,xp(n-1))}${cos(b)} + ${coef(b,xp(n))}${sen(b)}`, `${coef(n,xp(n-1))}${sen(b)} + ${xp(n)}${cos(b)}`],
    porque:`(u·v)′ = u′·v + u·v′. Con u = ${xp(n)} y v = ${sen(b)}: u′ = ${coef(n,xp(n-1))}, v′ = ${b}${cos(b)}.`,
    check:{k:'deriv',f:x=>x**n*Math.sin(b*x),df:x=>n*x**(n-1)*Math.sin(b*x)+b*x**n*Math.cos(b*x)} };}},
{ id:'deriv-cadena', nivel:'Difícil', tema:'Derivadas', titulo:'Regla de la cadena', gen(r){
  const a=R(r,2,5),b=RNZ(r,-7,7),n=R(r,3,6);const u=`(${lin(a,b)})`;
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${u}<sup>${n}</sup>`,
    ok:`${n*a}${u}<sup>${n-1}</sup>`, malas:[`${n}${u}<sup>${n-1}</sup>`,`${n*a}${u}<sup>${n}</sup>`,`${a}${u}<sup>${n-1}</sup>`,`${n*a}x${u}<sup>${n-1}</sup>`],
    porque:`Deriva la potencia y multiplica por la derivada de lo de adentro: ${n}·${u}<sup>${n-1}</sup>·${a} = ${n*a}${u}<sup>${n-1}</sup>.`,
    check:{k:'deriv',f:x=>(a*x+b)**n,df:x=>n*a*(a*x+b)**(n-1)} };}},
{ id:'int-definida', nivel:'Difícil', tema:'Integrales', titulo:'Integral definida', gen(r){
  const a=R(r,1,6),b=RNZ(r,-5,8),k=R(r,1,5);const v=fr(a*k*k+2*b*k,2);
  return { pregunta:'Calcula el valor', expr:`∫<sub>0</sub><sup>${k}</sup> (${lin(a,b)}) dx`,
    ok:frHtml(v), malas:[num(a*k+b), num(a*k*k+b*k), frHtml(fr(a*k*k,2)), frHtml(fr(a*k*k-2*b*k,2))],
    porque:`Antiderivada: ${coef(fr(a,2),'x<sup>2</sup>')} ${b<0?MENOS:'+'} ${Math.abs(b)}x. Evalúa en ${k} y en 0 y resta: ${frHtml(v)}.`,
    check:{k:'defint',f:x=>a*x+b,lo:0,hi:k,V:v.n/v.d} };}},
{ id:'deriv-exp', nivel:'Muy difícil', tema:'Derivadas', titulo:'Cadena con exponencial', gen(r){
  const a=R(r,2,4),b=RNZ(r,-5,5);const ex=suma([[a,xp(2)],[b,'x']]);const E=`e<sup>${ex}</sup>`;
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${E}`,
    ok:`(${suma([[2*a,'x'],[b,'']])})${E}`, malas:[E,`(${ex})${E}`,`${coef(2*a,'x')}${E}`,`(${suma([[a,'x'],[b,'']])})${E}`],
    porque:`(e<sup>u</sup>)′ = e<sup>u</sup>·u′. Aquí u = ${ex}, así que u′ = ${suma([[2*a,'x'],[b,'']])}.`,
    check:{k:'deriv',f:x=>Math.exp(a*x*x+b*x),df:x=>(2*a*x+b)*Math.exp(a*x*x+b*x)} };}},
{ id:'lim-lhopital', nivel:'Muy difícil', tema:'Límites', titulo:'Límite trigonométrico', gen(r){
  let a=R(r,2,9),b=R(r,2,9);while(a===b)b=R(r,2,9);const L=fr(a,b);
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→0</sub> <span class="fr"><span>${sen(a)}</span><span>${b}x</span></span>`,
    ok:frHtml(L), malas:[frHtml(fr(b,a)),'1','0','No existe'],
    porque:`Da 0/0. Usa sen(u)/u → 1, o L'Hôpital: ${a}cos(${a}x)/${b} → ${frHtml(L)} cuando x → 0.`,
    check:{k:'lim',g:x=>Math.sin(a*x)/(b*x),at:0,L:L.n/L.d} };}},
{ id:'int-partes', nivel:'Muy difícil', tema:'Integrales', titulo:'Integración por partes', gen(r){
  const a=R(r,2,5);const E=`e<sup>${a}x</sup>`;
  return { pregunta:'Resuelve la integral', expr:`∫ x${E} dx`,
    ok:`${E}(${coef(fr(1,a),'x')} ${MENOS} ${frHtml(fr(1,a*a))}) + C`,
    malas:[`${E}(${coef(fr(1,a),'x')} + ${frHtml(fr(1,a*a))}) + C`, `${E}(x ${MENOS} ${frHtml(fr(1,a))}) + C`, `${coef(fr(1,a),'x')}${E} + C`, `${coef(fr(1,2),'x<sup>2</sup>')}${E} + C`],
    porque:`Partes con u = x, dv = ${E}dx: v = ${E}/${a}. Queda x${E}/${a} ${MENOS} ∫${E}/${a} dx = ${E}(x/${a} ${MENOS} 1/${a*a}) + C.`,
    check:{k:'anti',f:x=>x*Math.exp(a*x),F:x=>Math.exp(a*x)*(x/a-1/(a*a))} };}}
];

function shuffle(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function crear(tid,seed){const t=T.find(x=>x.id===tid);const rng=mulberry32(seed);const p=t.gen(rng);
  let malas=[...new Set(p.malas)].filter(m=>m!==p.ok);
  const V=p.check.L!==undefined?p.check.L:p.check.V;
  for(const dlt of [1,-1,2,-2,3,-3,5,-5]){if(malas.length>=3||V===undefined)break;const c=num(Math.round(V)+dlt);if(c!==p.ok&&!malas.includes(c))malas.push(c);}
  malas=malas.slice(0,3);
  const opciones=shuffle([p.ok,...malas],rng);
  return {id:`${tid}#${seed}`,plantilla:tid,nivel:t.nivel,tema:t.tema,titulo:t.titulo,premio:PREMIO[t.nivel],pregunta:p.pregunta,expr:p.expr,opciones,correcta:opciones.indexOf(p.ok),porque:p.porque,check:p.check};}
const aTexto = h=>{h=h.replace(/<span class="fr"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g,'($1)/($2)');let o;do{o=h;h=h.replace(/<sup>([^<]*)<\/sup>/g,'^($1)');}while(o!==h);return h.replace(/<sub>(.*?)<\/sub>/g,'_($1)').replace(/<[^>]+>/g,'');};
if(typeof module!=='undefined')module.exports={T,crear,aTexto,NIVELES,PREMIO};
