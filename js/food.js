import {S,save,uid,esc,r1,fkcal,bookFood,recentFoods} from './state.js';
import {sheet,closeSheet,toast,el,$,confirm2,rerender} from './ui.js';
import {searchBasics,score} from './basics.js';

const OFF_FIELDS='code,product_name,product_name_de,brands,nutriments,quantity';
function offToFood(pr){const n=pr.nutriments||{};const q=(pr.quantity||'').toLowerCase();
  return{id:uid(),name:pr.product_name_de||pr.product_name||'',brand:pr.brands||'',barcode:pr.code||'',unit:/ml|\bl\b|liter/.test(q)?'ml':'g',
    p:+n.proteins_100g||0,c:+n.carbohydrates_100g||0,f:+n.fat_100g||0,kcal:Math.round(+n['energy-kcal_100g']||0)||null}}
async function offBarcode(code){const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`);if(!r.ok)return null;const j=await r.json();return j.status===1&&j.product?offToFood(j.product):null}
async function offSearch(q){const r=await fetch(`https://de.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=12&fields=${OFF_FIELDS}`);if(!r.ok)return[];const j=await r.json();return(j.products||[]).map(offToFood).filter(f=>f.name&&(f.p||f.c||f.f))}

export const foodRow=(f,src)=>`<button class="food" data-x="pick" data-id="${f.id||''}" data-src="${src===undefined?'':src}"><div class="grow"><div class="fn">${esc(f.name)}</div><div class="fb">${esc(f.brand||'')}</div></div><div class="fm num">${fkcal(f)} kcal · P ${r1(f.p)} <span class="tiny">/100 ${f.unit||'g'}</span></div></button>`;

export function searchSheet(day){
  let offCache=[],basicCache=[],t=null;
  sheet(`<h3>Lebensmittel suchen</h3><input id="fq" placeholder="z. B. Ei, Hähnchenbrust, Skyr" autocapitalize="off" autocorrect="off"><div id="fres" class="mt2"></div>`,
    {pick:b=>{const src=b.dataset.src;const f=src.startsWith('b')?Object.assign({id:uid()},basicCache[+src.slice(1)]):src!==''?offCache[+src]:S.foods.find(x=>x.id===b.dataset.id);amountSheet(day,f)},fnew:()=>foodForm(day,{name:el('fq').value.trim()})});
  const inp=el('fq'),res=el('fres');setTimeout(()=>inp.focus(),50);
  const local=q=>S.foods.map(f=>[score(f,q),f]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const sec=(title,rows)=>rows.length?`<div class="tiny mt3 mb2">${title}</div>${rows.join('')}`:'';
  const draw=(l,b,o,loading)=>{res.innerHTML=sec('Meine Produkte',l.map(f=>foodRow(f)))+sec('Grundnahrungsmittel',b.map((f,i)=>foodRow(f,'b'+i)))+(loading?'<div class="muted mt3" style="padding:8px 0">Suche Markenprodukte…</div>':sec('Markenprodukte (Open Food Facts)',o.map((f,i)=>foodRow(f,i))))+(!l.length&&!b.length&&!o.length&&!loading&&inp.value.length>1?'<div class="muted" style="padding:12px 0">Nichts gefunden.</div><button class="btn sm" data-x="fnew">Manuell anlegen</button>':'')};
  inp.oninput=()=>{const q=inp.value.trim();clearTimeout(t);offCache=[];basicCache=q.length>1?searchBasics(q):[];draw(local(q),basicCache,[],q.length>1);if(q.length<2)return;
    t=setTimeout(async()=>{try{let o=await offSearch(q);o=o.map(f=>[score(f,q),f]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);if(inp.value.trim()!==q)return;offCache=o;draw(local(q),basicCache,o,false)}catch(e){draw(local(q),basicCache,[],false)}},500)};
  draw(recentFoods().slice(0,8),[],[],false);
}
export function foodForm(day,f){
  f=Object.assign({id:uid(),name:'',brand:'',barcode:'',unit:'g',p:0,c:0,f:0,kcal:null},f);
  sheet(`<h3>${f.barcode&&!f.name?'Produkt nicht gefunden':'Produkt'}</h3>${f.barcode?`<div class="tiny mb2">Barcode ${esc(f.barcode)}</div>`:''}
  <div class="field"><label class="f">Name</label><input id="ffn" value="${esc(f.name)}"></div>
  <div class="field"><label class="f">Marke (optional)</label><input id="ffb" value="${esc(f.brand)}"></div>
  <div class="tiny mb2">Nährwerte pro 100 <span id="ffu">${f.unit}</span> <button class="btn ghost xs" data-x="unit">g / ml wechseln</button></div>
  <div class="grid4"><div><label class="f">Protein</label><input type="number" inputmode="decimal" id="ffp" value="${f.p||''}"></div><div><label class="f">Carbs</label><input type="number" inputmode="decimal" id="ffc" value="${f.c||''}"></div><div><label class="f">Fett</label><input type="number" inputmode="decimal" id="fff" value="${f.f||''}"></div><div><label class="f">kcal</label><input type="number" inputmode="decimal" id="ffk" value="${f.kcal||''}" placeholder="auto"></div></div>
  <div class="grid2 mt4"><button class="btn" data-x="close">Abbrechen</button><button class="btn primary" data-x="save">Speichern & Menge</button></div>
  ${S.foods.some(x=>x.id===f.id)?'<button class="btn ghost danger wide mt2" data-x="del">Produkt löschen</button>':''}`,{
    unit:()=>{f.unit=f.unit==='g'?'ml':'g';el('ffu').textContent=f.unit},close:closeSheet,
    del:()=>{S.foods=S.foods.filter(x=>x.id!==f.id);save();closeSheet();rerender()},
    save:()=>{f.name=el('ffn').value.trim();f.brand=el('ffb').value.trim();['p','c','f'].forEach(k=>f[k]=+el('ff'+k).value||0);f.kcal=+el('ffk').value||null;if(!f.name){toast('Name fehlt');return}amountSheet(day,f)}});
}
export function amountSheet(day,f){
  f=Object.assign({id:uid(),unit:'g'},f);
  const draw=()=>{const a=+el('fam').value||100,m=k=>f[k]*a/100;el('fcalc').innerHTML=`<div><b>${Math.round(fkcal(f)*a/100)}</b><small>kcal</small></div><div><b>${r1(m('p'))}</b><small>Protein</small></div><div><b>${r1(m('c'))}</b><small>Carbs</small></div><div><b>${r1(m('f'))}</b><small>Fett</small></div>`};
  sheet(`<h3>${esc(f.name)}</h3><div class="tiny mb3">${esc(f.brand||'')}${f.brand?' · ':''}pro 100 ${f.unit}: ${fkcal(f)} kcal · P ${r1(f.p)} · C ${r1(f.c)} · F ${r1(f.f)}</div>
  <div class="amt"><input type="number" inputmode="decimal" id="fam" value="100"><span>${f.unit}</span></div>
  <div class="mt2">${[50,100,150,200,250,300,500].map(v=>`<button class="chip" data-x="q" data-v="${v}">${v}</button>`).join('')}</div>
  <div class="calc" id="fcalc"></div>
  <div class="grid2"><button class="btn" data-x="edit">Bearbeiten</button><button class="btn primary" data-x="add">Hinzufügen</button></div>`,{
    q:b=>{el('fam').value=b.dataset.v;draw()},edit:()=>foodForm(day,f),
    add:()=>{const amt=+el('fam').value;if(!amt){toast('Menge eingeben');return}bookFood(day,f,amt);closeSheet();rerender();toast('Hinzugefügt')}});
  draw();const inp=el('fam');inp.oninput=draw;setTimeout(()=>{inp.focus();inp.select()},50);
}
let scanStop=null;
export function scanSheet(day){
  sheet(`<h3>Barcode scannen</h3><div id="scan"><video id="scv" playsinline muted autoplay></video><div class="frame"></div></div><div class="muted mt3 mb3" id="scmsg">Kamera wird gestartet…</div><button class="btn wide" data-x="close">Abbrechen</button>`,{close:()=>{stop();closeSheet()},_close:()=>stop()});
  const msg=el('scmsg'),vid=el('scv');let done=false;
  const stop=()=>{if(scanStop){scanStop();scanStop=null}};
  const found=async code=>{if(done)return;done=true;stop();msg.textContent='Gefunden: '+code+' – suche Produkt…';
    const known=S.foods.find(x=>x.barcode===code);if(known){amountSheet(day,known);return}
    try{const f=await offBarcode(code);f?amountSheet(day,f):foodForm(day,{barcode:code})}catch(e){foodForm(day,{barcode:code})}};
  (async()=>{try{
    if('BarcodeDetector'in window){const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});vid.srcObject=st;const det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});
      const iv=setInterval(async()=>{try{const r=await det.detect(vid);if(r.length)found(r[0].rawValue)}catch(e){}},300);scanStop=()=>{clearInterval(iv);st.getTracks().forEach(t=>t.stop())}}
    else{if(!window.ZXing)await new Promise((ok,err)=>{const sc=document.createElement('script');sc.src='zxing.min.js';sc.onload=ok;sc.onerror=err;document.head.appendChild(sc)});
      const reader=new ZXing.BrowserMultiFormatReader();await reader.decodeFromConstraints({video:{facingMode:'environment'}},vid,res=>{if(res)found(res.getText())});scanStop=()=>reader.reset()}
    msg.textContent='Barcode ins Feld halten';
  }catch(e){msg.textContent='Kamera nicht verfügbar: '+e.message}})();
}
export function mealTotals(m){return m.items.reduce((a,it)=>{const f=S.foods.find(x=>x.id===it.foodId);if(!f)return a;return{p:a.p+f.p*it.amount/100,kcal:a.kcal+Math.round(fkcal(f)*it.amount/100)}},{p:0,kcal:0})}
export function mealsSheet(day){
  const items=S.macros[day]||[];
  const draw=()=>sheet(`<h3>Mahlzeiten</h3>
    ${S.meals.length?`<div class="list mb3">${S.meals.map(m=>{const t=mealTotals(m);return`<div class="item"><div class="grow"><div style="font-weight:600">${esc(m.name)}</div><div class="tiny num">${m.items.length} Produkte · ${t.kcal} kcal · P ${r1(t.p)}</div></div><button class="btn sm primary" data-x="book" data-id="${m.id}">Buchen</button><button class="btn ghost sm" data-x="del" data-id="${m.id}">✕</button></div>`}).join('')}</div>`:'<div class="muted mb3">Noch keine Mahlzeiten gespeichert.</div>'}
    ${items.filter(i=>i.foodId).length?`<div class="tiny mb2">Aus den Einträgen dieses Tages eine Mahlzeit speichern:</div><input id="mlname" placeholder="Name, z. B. Frühstück" class="mb2">${items.map((i,idx)=>i.foodId?`<label class="row" style="padding:6px 0"><input type="checkbox" data-idx="${idx}" checked style="width:22px;height:22px"><span class="grow">${esc(i.n)} <span class="tiny">${i.amount} ${i.unit}</span></span></label>`:'').join('')}<button class="btn wide mt2" data-x="save">Als Mahlzeit speichern</button>`:'<div class="tiny">Tipp: Buche die Produkte eines Frühstücks wie gewohnt, dann hier als Mahlzeit speichern – ab dann mit einem Tipp.</div>'}
    <button class="btn ghost wide mt2" data-x="close">Schließen</button>`,{
    close:closeSheet,del:b=>{S.meals=S.meals.filter(m=>m.id!==b.dataset.id);save();draw()},
    book:b=>{const m=S.meals.find(x=>x.id===b.dataset.id);let n=0;m.items.forEach(it=>{const f=S.foods.find(x=>x.id===it.foodId);if(f){bookFood(day,f,it.amount);n++}});closeSheet();rerender();toast(n+' Produkte gebucht')},
    save:()=>{const name=el('mlname').value.trim();if(!name){toast('Name fehlt');return}const sel=[...document.querySelectorAll('#sheet input[type=checkbox]:checked')].map(c=>items[+c.dataset.idx]).map(i=>({foodId:i.foodId,amount:i.amount}));if(!sel.length)return;S.meals.push({id:uid(),name,items:sel});save();toast('Mahlzeit gespeichert');draw()}});
  draw();
}
