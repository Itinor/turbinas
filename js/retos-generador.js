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
{ id:'deriv-seno', nivel:'Fácil', tema:'Derivadas', titulo:'Derivada de seno y coseno', gen(r){
  const a=RNZ(r,-12,12),b=R(r,2,12),esCos=r()<0.5;const fx=esCos?cos(b):sen(b),gx=esCos?sen(b):cos(b),k=esCos?-a*b:a*b;
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${coef(a,fx)}`,
    ok:coef(k,gx), malas:[coef(-k,gx),coef(a,gx),coef(k,fx),coef(esCos?a*b:-a*b,fx)],
    porque:esCos?`(cos u)′ = ${MENOS}sen u · u′. Con u = ${b}x: ${num(a)}·(${MENOS}${b}) = ${num(k)}.`:`(sen u)′ = cos u · u′. Aquí u = ${b}x, así que se multiplica por ${b}: ${num(a)}·${b} = ${num(k)}.`,
    check:{k:'deriv',f:x=>a*(esCos?Math.cos(b*x):Math.sin(b*x)),df:x=>esCos?-a*b*Math.sin(b*x):a*b*Math.cos(b*x)} };}},
{ id:'int-potencia', nivel:'Fácil', tema:'Integrales', titulo:'Integral de una potencia', gen(r){
  const a=R(r,2,20),n=R(r,1,8);
  if(r()<0.45){ const c=RNZ(r,-12,12),m=R(r,0,Math.max(0,n-1));
    const expr=suma([[a,xp(n)],[c,xp(m)]]), ok=suma([[fr(a,n+1),xp(n+1)],[fr(c,m+1),xp(m+1)]])+' + C';
    return { pregunta:'Resuelve la integral', expr:`∫ (${expr}) dx`, ok,
      malas:[suma([[a*n,xp(n-1)],[c*m,xp(m-1)]])+' + C', suma([[fr(a,n),xp(n+1)],[fr(c,m||1),xp(m+1)]])+' + C', suma([[a,xp(n+1)],[c,xp(m+1)]])+' + C', suma([[fr(a,n+1),xp(n)],[fr(c,m+1),xp(m)]])+' + C'],
      porque:`Integra término por término: a cada potencia súmale 1 al exponente y divide entre el nuevo exponente. No olvides la C.`,
      check:{k:'anti',f:x=>a*x**n+c*x**m,F:x=>a/(n+1)*x**(n+1)+c/(m+1)*x**(m+1)} }; }
  return { pregunta:'Resuelve la integral', expr:`∫ ${a}${xp(n)} dx`,
    ok:coef(fr(a,n+1),xp(n+1))+' + C',
    malas:[coef(a*n,xp(n-1))+' + C', coef(fr(a,n),xp(n+1))+' + C', coef(a,xp(n+1))+' + C', coef(fr(a,n+1),xp(n))+' + C'],
    porque:`Súmale 1 al exponente y divide entre el nuevo exponente: ${a}·x<sup>${n+1}</sup>/${n+1}. No olvides la constante C.`,
    check:{k:'anti',f:x=>a*x**n,F:x=>a/(n+1)*x**(n+1)} };}},
{ id:'lim-factor', nivel:'Fácil', tema:'Límites', titulo:'Límite con factorización', gen(r){
  const k=RNZ(r,-8,9);
  if(r()<0.65){ let m=RNZ(r,-9,9); while(m===-k) m=RNZ(r,-9,9);
    const num1=suma([[1,'x<sup>2</sup>'],[m-k,'x'],[-m*k,'']]), den=suma([[1,'x'],[-k,'']]), L=k+m;
    return { pregunta:'Calcula el límite', expr:`lim<sub>x→${num(k)}</sub> <span class="fr"><span>${num1}</span><span>${den}</span></span>`,
      ok:num(L), malas:[num(k),num(m),num(L+2*(L===0?1:0)+(L===0?0:-2*k)),'No existe','0'].filter((x,i,a)=>a.indexOf(x)===i&&x!==num(L)).slice(0,4),
      porque:`Sustituir da 0/0. Factoriza: ${num1} = (${den})(${suma([[1,'x'],[m,'']])}). Se cancela (${den}) y queda x ${m<0?MENOS:'+'} ${Math.abs(m)} → ${num(L)}.`,
      check:{k:'lim',g:x=>(x*x+(m-k)*x-m*k)/(x-k),at:k,L} }; }
  const L=3*k*k, den=suma([[1,'x'],[-k,'']]), num1=suma([[1,'x<sup>3</sup>'],[-k*k*k,'']]);
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→${num(k)}</sub> <span class="fr"><span>${num1}</span><span>${den}</span></span>`,
    ok:num(L), malas:[num(k*k),num(2*k*k),num(3*k),'No existe'],
    porque:`Diferencia de cubos: x<sup>3</sup> ${MENOS} a<sup>3</sup> = (x ${MENOS} a)(x<sup>2</sup> + ax + a<sup>2</sup>). Cancela y evalúa: 3·(${num(k)})<sup>2</sup> = ${num(L)}.`,
    check:{k:'lim',g:x=>(x**3-k**3)/(x-k),at:k,L} };}},
{ id:'deriv-producto', nivel:'Difícil', tema:'Derivadas', titulo:'Regla del producto', gen(r){
  const n=R(r,2,6),b=R(r,2,9),c=R(r,1,5),esCos=r()<0.5;const fx=esCos?cos(b):sen(b),gx=esCos?sen(b):cos(b),s2=esCos?-1:1;
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${coef(c,xp(n))} · ${fx}`,
    ok:`${coef(c*n,xp(n-1))}${fx} ${s2<0?MENOS:'+'} ${coef(c*b,xp(n),true)}${gx}`,
    malas:[`${coef(c*n*b,xp(n-1))}${gx}`, `${coef(c*n,xp(n-1))}${fx} ${s2<0?'+':MENOS} ${coef(c*b,xp(n),true)}${gx}`, `${coef(c*n,xp(n-1))}${gx} + ${coef(c*b,xp(n))}${fx}`, `${coef(c*n,xp(n-1))}${fx} ${s2<0?MENOS:'+'} ${coef(c,xp(n),true)}${gx}`],
    porque:`(u·v)′ = u′·v + u·v′. Con u = ${coef(c,xp(n))} y v = ${fx}: u′ = ${coef(c*n,xp(n-1))}, v′ = ${s2<0?MENOS:''}${b}${gx}.`,
    check:{k:'deriv',f:x=>c*x**n*(esCos?Math.cos(b*x):Math.sin(b*x)),df:x=>c*n*x**(n-1)*(esCos?Math.cos(b*x):Math.sin(b*x))+s2*c*b*x**n*(esCos?Math.sin(b*x):Math.cos(b*x))} };}},
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
  const a=RNZ(r,-6,6),b=RNZ(r,-9,9),c=R(r,1,4);const ex=suma([[a,xp(2)],[b,'x']]);const E=`e<sup>${ex}</sup>`;const pre=c===1?'':String(c);
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ${pre}${E}`,
    ok:`${pre}(${suma([[2*a,'x'],[b,'']])})${E}`, malas:[`${pre}${E}`,`${pre}(${ex})${E}`,`${pre}${coef(2*a,'x')}${E}`,`${pre}(${suma([[a,'x'],[b,'']])})${E}`],
    porque:`(e<sup>u</sup>)′ = e<sup>u</sup>·u′. Aquí u = ${ex}, así que u′ = ${suma([[2*a,'x'],[b,'']])}.`,
    check:{k:'deriv',f:x=>c*Math.exp(a*x*x+b*x),df:x=>c*(2*a*x+b)*Math.exp(a*x*x+b*x)} };}},
{ id:'lim-lhopital', nivel:'Muy difícil', tema:'Límites', titulo:'Límite trigonométrico', gen(r){
  let a=R(r,2,12),b=R(r,2,12);while(a===b)b=R(r,2,12);const tipo=R(r,0,2);
  if(tipo===2){ const L=fr(a*a,2*b);
    return { pregunta:'Calcula el límite', expr:`lim<sub>x→0</sub> <span class="fr"><span>1 ${MENOS} ${cos(a)}</span><span>${b}x<sup>2</sup></span></span>`,
      ok:frHtml(L), malas:[frHtml(fr(a,b)),frHtml(fr(a*a,b)),'0','No existe'],
      porque:`Da 0/0. Con L'Hôpital dos veces (o 1 ${MENOS} cos u ≈ u<sup>2</sup>/2): (${a}x)<sup>2</sup>/2 ÷ ${b}x<sup>2</sup> = ${frHtml(L)}.`,
      check:{k:'lim',g:x=>(1-Math.cos(a*x))/(b*x*x),at:0,L:L.n/L.d} }; }
  const fn=tipo===1?`tan(${a}x)`:sen(a), L=fr(a,b);
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→0</sub> <span class="fr"><span>${fn}</span><span>${b}x</span></span>`,
    ok:frHtml(L), malas:[frHtml(fr(b,a)),'1','0','No existe'],
    porque:`Da 0/0. Usa ${tipo===1?'tan':'sen'}(u)/u → 1, o L'Hôpital: el límite vale ${a}/${b} = ${frHtml(L)}.`,
    check:{k:'lim',g:x=>(tipo===1?Math.tan(a*x):Math.sin(a*x))/(b*x),at:0,L:L.n/L.d} };}},
{ id:'int-partes', nivel:'Muy difícil', tema:'Integrales', titulo:'Integración por partes', gen(r){
  const a=RNZ(r,-9,9),tipo=R(r,0,2);
  if(tipo===0){ const E=`e<sup>${a===1?'':a===-1?MENOS:num(a)}x</sup>`;
    return { pregunta:'Resuelve la integral', expr:`∫ x${E} dx`,
      ok:`${E}(${coef(fr(1,a),'x')} ${MENOS} ${frHtml(fr(1,a*a))}) + C`,
      malas:[`${E}(${coef(fr(1,a),'x')} + ${frHtml(fr(1,a*a))}) + C`, `${E}(x ${MENOS} ${frHtml(fr(1,a))}) + C`, `${coef(fr(1,a),'x')}${E} + C`, `${coef(fr(1,2),'x<sup>2</sup>')}${E} + C`],
      porque:`Partes con u = x, dv = ${E}dx: v = ${E}/${num(a)}. Queda x${E}/${num(a)} ${MENOS} ∫${E}/${num(a)} dx.`,
      check:{k:'anti',f:x=>x*Math.exp(a*x),F:x=>Math.exp(a*x)*(x/a-1/(a*a))} }; }
  const b=R(r,2,12), esCos=tipo===2;
  /* ∫x sen(bx) = −x cos(bx)/b + sen(bx)/b² ; ∫x cos(bx) = x sen(bx)/b + cos(bx)/b² */
  const ok=esCos?`${coef(fr(1,b),'x')}${sen(b)} + ${frHtml(fr(1,b*b))}${cos(b)} + C`:`${coef(fr(-1,b),'x')}${cos(b)} + ${frHtml(fr(1,b*b))}${sen(b)} + C`;
  return { pregunta:'Resuelve la integral', expr:`∫ x${esCos?cos(b):sen(b)} dx`, ok,
    malas:esCos?[`${coef(fr(1,b),'x')}${sen(b)} ${MENOS} ${frHtml(fr(1,b*b))}${cos(b)} + C`,`${coef(fr(-1,b),'x')}${sen(b)} + ${frHtml(fr(1,b*b))}${cos(b)} + C`,`${coef(fr(1,2),'x<sup>2</sup>')}${sen(b)} + C`,`x${sen(b)} + ${cos(b)} + C`]
                :[`${coef(fr(1,b),'x')}${cos(b)} + ${frHtml(fr(1,b*b))}${sen(b)} + C`,`${coef(fr(-1,b),'x')}${cos(b)} ${MENOS} ${frHtml(fr(1,b*b))}${sen(b)} + C`,`${coef(fr(-1,2),'x<sup>2</sup>')}${cos(b)} + C`,`${MENOS}x${cos(b)} + ${sen(b)} + C`],
    porque:`Partes con u = x, dv = ${esCos?cos(b):sen(b)}dx: v = ${esCos?'':MENOS}${esCos?sen(b):cos(b)}/${b}. Luego ∫v dx da el término con 1/${b*b}.`,
    check:{k:'anti',f:x=>x*(esCos?Math.cos(b*x):Math.sin(b*x)),F:x=>esCos?x*Math.sin(b*x)/b+Math.cos(b*x)/(b*b):-x*Math.cos(b*x)/b+Math.sin(b*x)/(b*b)} };}},
{ id:'deriv-ln', nivel:'Difícil', tema:'Derivadas', titulo:'Derivada del logaritmo', gen(r){
  const a=R(r,1,9),b=R(r,1,15);const den=suma([[a,'x<sup>2</sup>'],[b,'']]);
  return { pregunta:'¿Cuál es la derivada?', expr:`f(x) = ln(${den})`,
    ok:`<span class="fr"><span>${coef(2*a,'x')}</span><span>${den}</span></span>`,
    malas:[`<span class="fr"><span>1</span><span>${den}</span></span>`,`<span class="fr"><span>${coef(a,'x')}</span><span>${den}</span></span>`,`<span class="fr"><span>${coef(2*a,'x')}</span><span>x</span></span>`,`${coef(2*a,'x')}·ln(${den})`],
    porque:`(ln u)′ = u′/u. Con u = ${den}, u′ = ${coef(2*a,'x')}.`,
    check:{k:'deriv',f:x=>Math.log(a*x*x+b),df:x=>2*a*x/(a*x*x+b)} };}},
{ id:'lim-infinito', nivel:'Fácil', tema:'Límites', titulo:'Límite al infinito', gen(r){
  const a=RNZ(r,-9,9),c=R(r,1,9),b=RNZ(r,-9,9),d=RNZ(r,-9,9),n=R(r,1,3),L=fr(a,c);
  const N=suma([[a,xp(n)],[b,'x'.repeat(n>1?1:0)||'']]),D=suma([[c,xp(n)],[d,'']]);
  return { pregunta:'Calcula el límite', expr:`lim<sub>x→∞</sub> <span class="fr"><span>${N}</span><span>${D}</span></span>`,
    ok:frHtml(L), malas:[frHtml(fr(b||1,d)),'0','∞',frHtml(fr(c,a))].filter(x=>x!==frHtml(L)),
    porque:`Divide arriba y abajo entre x<sup>${n}</sup>: todo lo demás tiende a 0 y queda ${num(a)}/${c} = ${frHtml(L)}.`,
    check:{k:'lim',g:x=>(a*x**n+(n>1?b*x:b))/(c*x**n+d),at:1e6,L:L.n/L.d} };}},
{ id:'int-sustitucion', nivel:'Difícil', tema:'Integrales', titulo:'Integral por sustitución', gen(r){
  const a=R(r,1,6),b=RNZ(r,-9,9),n=R(r,2,6);const u=`(${suma([[a,'x<sup>2</sup>'],[b,'']])})`;
  return { pregunta:'Resuelve la integral', expr:`∫ ${coef(2*a,'x')}${u}<sup>${n}</sup> dx`,
    ok:`${coef(fr(1,n+1),u)}<sup>${n+1}</sup> + C`,
    malas:[`${coef(fr(1,n),u)}<sup>${n+1}</sup> + C`,`${u}<sup>${n+1}</sup> + C`,`${coef(fr(2*a,n+1),u)}<sup>${n+1}</sup> + C`,`${coef(n,u)}<sup>${n-1}</sup> + C`],
    porque:`Sustituye u = ${u.slice(1,-1)}: du = ${coef(2*a,'x')} dx. Queda ∫u<sup>${n}</sup> du = u<sup>${n+1}</sup>/${n+1} + C.`,
    check:{k:'anti',f:x=>2*a*x*(a*x*x+b)**n,F:x=>(a*x*x+b)**(n+1)/(n+1)} };}}
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
