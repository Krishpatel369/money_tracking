const CATS={out:["Food","Travel","Rent","Bills","Shopping","Health","Study","Other"],in:["Salary","Freelance","Gift","Other"]};
const fmt=n=>"₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
let type="out",tx=[];
try{tx=JSON.parse(localStorage.getItem("paisa")||"[]")}catch(e){tx=[]}
const save=()=>{try{localStorage.setItem("paisa",JSON.stringify(tx))}catch(e){}};
const today=new Date().toISOString().slice(0,10);
$("date").value=today;$("mon").value=today.slice(0,7);
let custom={out:[],in:[]};
try{const c=JSON.parse(localStorage.getItem("paisa_cats")||"{}");custom={out:c.out||[],in:c.in||[]}}catch(e){}
const saveCats=()=>{try{localStorage.setItem("paisa_cats",JSON.stringify(custom))}catch(e){}};
function fillCats(sel){
 const list=[...CATS[type].filter(c=>c!=="Other"),...custom[type],"Other"];
 $("cat").innerHTML=list.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")+'<option value="__new__">＋ Add new category…</option>';
 if(sel)$("cat").value=sel;
 $("newcat").hidden=true;
}
$("cat").onchange=()=>{const n=$("cat").value==="__new__";$("newcat").hidden=!n;if(n)$("newcat").focus()};
document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>{type=b.dataset.t;document.querySelectorAll(".seg button").forEach(x=>x.classList.toggle("on",x===b));fillCats()});
fillCats();
$("add").onclick=()=>{
 const a=parseFloat($("amt").value);
 if(!(a>0)){$("amt").focus();return}
 let cat=$("cat").value;
 if(cat==="__new__"){
  const name=$("newcat").value.trim().replace(/\s+/g," ");
  if(!name){$("newcat").focus();return}
  const all=[...CATS.out,...CATS.in,...custom.out,...custom.in];
  const found=all.find(c=>c.toLowerCase()===name.toLowerCase());
  cat=found||name;
  if(!found){custom[type].push(name);saveCats()}
  else if(!CATS[type].includes(found)&&!custom[type].includes(found)){custom[type].push(found);saveCats()}
  $("newcat").value="";
 }
 tx.push({id:Date.now(),type,a,cat,mode:$("mode").value,note:$("note").value.trim(),date:$("date").value||today});
 save();$("amt").value="";$("note").value="";fillCats(cat);render();
};
function esc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function render(){
 const m=$("mon").value,rows=tx.filter(t=>t.date.startsWith(m)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 const inc=rows.filter(t=>t.type==="in").reduce((s,t)=>s+t.a,0),exp=rows.filter(t=>t.type==="out").reduce((s,t)=>s+t.a,0);
 $("inc").textContent=fmt(inc);$("exp").textContent=fmt(exp);$("bal").textContent=fmt(inc-exp);const k=calc(rows);$("bank").textContent=fmt(k.m.Bank);$("cash").textContent=fmt(k.m.Cash);
 const by={};rows.filter(t=>t.type==="out").forEach(t=>by[t.cat]=(by[t.cat]||0)+t.a);
 const ent=Object.entries(by).sort((a,b)=>b[1]-a[1]);
 $("cats").innerHTML=ent.length?ent.map(([c,v])=>`<div class="bar"><div><span>${esc(c)}</span><span>${fmt(v)}</span></div><i style="width:${Math.max(3,v/exp*100)}%"></i></div>`).join(""):'<p class="empty">No spending yet. Add your first expense above.</p>';
 $("list").innerHTML=rows.length?rows.map(t=>`<div class="tx"><div class="m"><b>${esc(t.cat)}</b><span>${t.date} – ${t.mode||"Cash"}${t.note?" – "+esc(t.note):""}</span></div><b class="${t.type}">${t.type==="in"?"+":"−"}${fmt(t.a)}</b><button type="button" aria-label="Delete" data-id="${t.id}">×</button></div>`).join(""):'<p class="empty">Nothing recorded for this month.</p>';
 drawChart(m,rows);
 document.querySelectorAll(".tx button").forEach(b=>b.onclick=()=>{tx=tx.filter(t=>t.id!=b.dataset.id);save();render()});
}

function drawChart(m,rows){
 const el=$("chart"),[Y,M]=m.split("-").map(Number),n=new Date(Y,M,0).getDate();
 if(!rows.length){el.innerHTML='<p class="empty">No data for this month yet.</p>';return}
 const ex=Array(n).fill(0),inc=Array(n).fill(0),bk=Array(n).fill(0);let lastTx=1;
 rows.forEach(t=>{const d=+t.date.slice(8,10)-1;if(d<0||d>=n)return;lastTx=Math.max(lastTx,d+1);if(t.type==="out")ex[d]+=t.a;else inc[d]+=t.a;if(t.mode==="Bank")bk[d]+=t.type==="in"?t.a:-t.a});
 for(let i=1;i<n;i++)bk[i]+=bk[i-1];
 const N=Math.max(2,Math.min(n,Math.max(lastTx,m===today.slice(0,7)?+today.slice(8,10):n)));
 const S=[{k:ex,c:"#dc2626",n:"Expenses"},{k:inc,c:"#2563eb",n:"Added money"},{k:bk,c:"var(--ink)",n:"Bank money"}];
 let lo=Math.min(0,...bk.slice(0,N)),hi=Math.max(1,...ex.slice(0,N),...inc.slice(0,N),...bk.slice(0,N));
 const raw=(hi-lo)/4,p=10**Math.floor(Math.log10(raw)),s=[1,2,2.5,5,10].find(x=>x*p>=raw)*p;
 lo=Math.floor(lo/s)*s;hi=Math.ceil(hi/s)*s;
 const W=420,H=260,L=44,R=12,T=12,B=28,x=i=>L+(W-L-R)*i/(N-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
 const short=v=>{const a=Math.abs(v),g=a>=1e5?(a/1e5)+"L":a>=1e3?(a/1e3)+"k":a;return(v<0?"-":"")+g};
 let g="";
 for(let v=lo;v<=hi+s/2;v+=s)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${short(Math.round(v*100)/100)}</text>`;
 for(let i=0;i<N;i++){const d=i+1;if(d===1||d%5===0||d===N)g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${d}</text>`}
 S.forEach(l=>{
  const pts=l.k.slice(0,N).map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ");
  g+=`<polyline points="${pts}" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="stroke:${l.c}"/>`;
  g+=l.k.slice(0,N).map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${N>16?2:3}" style="fill:${l.c}"><title>Day ${i+1} – ${l.n}: ${fmt(v)}</title></circle>`).join("");
 });
 el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily expenses, added money and bank balance" style="width:100%;height:auto;display:block;font-size:10px;fill:var(--mute)">${g}</svg><p class="msg">Day of month on the bottom. Bank money = running bank balance for the month.</p>`;
}
$("rdate").value=today;
const rs=n=>"Rs. "+Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
function calc(rows){const m={Bank:0,Cash:0};let inc=0,exp=0;rows.forEach(t=>{m[t.mode==="Bank"?"Bank":"Cash"]+=t.type==="in"?t.a:-t.a;if(t.type==="in")inc+=t.a;else exp+=t.a});return{inc,exp,m}}
function catTotals(rows){const by={};rows.filter(t=>t.type==="out").forEach(t=>by[t.cat]=(by[t.cat]||0)+t.a);return Object.entries(by).sort((a,b)=>b[1]-a[1])}
const asc=rows=>rows.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
async function saveFile(fname,blob){
 const url=URL.createObjectURL(blob),l=document.createElement("a");
 l.href=url;l.download=fname;document.body.appendChild(l);l.click();l.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
let cur=null;
function preview(title,sub,rows,fname){
 const pv=$("pv"),say=t=>$("msg").textContent=t;
 if(!rows.length){pv.hidden=true;cur=null;say("No transactions for this period, so there is nothing to preview.");return}
 cur={title,sub,rows,fname};say("");
 const k=calc(rows),cats=catTotals(rows);
 const bars=cats.length?cats.map(([c,v])=>`<div class="bar"><div><span>${esc(c)}</span><span>${fmt(v)}</span></div><i style="width:${Math.max(3,v/k.exp*100)}%"></i></div>`).join(""):'<p class="empty">No spending in this period.</p>';
 const list=asc(rows).map(t=>`<div class="tx"><div class="m"><b>${esc(t.cat)}</b><span>${t.date} – ${t.mode||"Cash"}${t.note?" – "+esc(t.note):""}</span></div><b class="${t.type}">${t.type==="in"?"+":"−"}${fmt(t.a)}</b></div>`).join("");
 pv.innerHTML=`<h2>${title}: ${sub}</h2><div class="bal"><small>Balance</small><b>${fmt(k.inc-k.exp)}</b><div class="row"><div><small>Income</small><br><span class="in">${fmt(k.inc)}</span></div><div><small>Spent</small><br><span class="out">${fmt(k.exp)}</span></div><div><small>In bank</small><br>${fmt(k.m.Bank)}</div><div><small>In cash</small><br>${fmt(k.m.Cash)}</div></div></div><h2>Spending by category</h2>${bars}<h2>Transactions</h2>${list}<button class="add" id="dl" type="button">Download PDF</button>`;
 pv.hidden=false;$("dl").onclick=()=>makePdf(cur);pv.scrollIntoView({behavior:"smooth",block:"start"});
}
async function makePdf(r){
 const say=t=>$("msg").textContent=t;
 if(!window.jspdf){say("The PDF tool did not load. Check your connection and reload.");return}
 const C={bg:[246,243,236],ink:[29,42,36],mute:[107,118,111],line:[226,221,208],inc:[31,122,77],out:[194,65,12],lt:[180,190,184]};
 const doc=new window.jspdf.jsPDF();let y=18;
 const bg=()=>{doc.setFillColor(...C.bg);doc.rect(0,0,210,297,"F")};bg();
 const T=(s,x,yy,size,style,font,col,al)=>{doc.setFont(font||"helvetica",style||"normal");doc.setFontSize(size);doc.setTextColor(...(col||C.ink));doc.text(String(s),x,yy,al?{align:al}:undefined)};
 const need=h=>{if(y+h>285){doc.addPage();bg();y=18}};
 const k=calc(r.rows),cats=catTotals(r.rows);
 T("Paisa Tracker",15,y,20,"bold","times");T(r.title,195,y,11,"bold","helvetica",C.mute,"right");y+=7;
 T(r.sub,15,y,10,"normal","helvetica",C.mute);y+=7;
 doc.setFillColor(...C.ink);doc.roundedRect(15,y,180,44,4,4,"F");
 T("Balance",22,y+9,10,"normal","helvetica",C.lt);
 T(rs(k.inc-k.exp),22,y+22,26,"bold","times",C.bg);
 [["Income",rs(k.inc),[110,231,160]],["Spent",rs(k.exp),[253,186,116]],["In bank",rs(k.m.Bank),C.bg],["In cash",rs(k.m.Cash),C.bg]].forEach((c,i)=>{T(c[0],22+i*44,y+31,8.5,"normal","helvetica",C.lt);T(c[1],22+i*44,y+38,10.5,"bold","helvetica",c[2])});
 y+=56;
 T("Spending by category",15,y,13,"bold","times");y+=8;
 if(!cats.length){T("No spending in this period.",15,y,10,"normal","helvetica",C.mute);y+=8}
 cats.forEach(([c,v])=>{need(12);T(c,15,y,10.5);T(rs(v)+"  ("+Math.round(v/k.exp*100)+"%)",195,y,10.5,"normal","helvetica",C.ink,"right");doc.setFillColor(...C.line);doc.roundedRect(15,y+2.5,180,3,1.5,1.5,"F");doc.setFillColor(...C.out);doc.roundedRect(15,y+2.5,Math.max(3,180*v/k.exp),3,1.5,1.5,"F");y+=12});
 y+=4;need(20);T("Transactions",15,y,13,"bold","times");y+=6;
 asc(r.rows).forEach(t=>{need(12);doc.setDrawColor(...C.line);doc.line(15,y,195,y);y+=6;
  T(t.cat,15,y,10.5,"bold");T((t.type==="in"?"+ ":"- ")+rs(t.a),195,y,10.5,"bold","helvetica",t.type==="in"?C.inc:C.out,"right");
  T(t.date+" - "+(t.mode||"Cash")+(t.note?" - "+t.note.slice(0,60):""),15,y+4.5,8.5,"normal","helvetica",C.mute);y+=8});
 try{await saveFile(r.fname,doc.output("blob"));say("Report ready: "+r.fname)}
 catch(e){say(e&&e.code==="declined"?"Download cancelled.":"Could not save the report. Try again.")}
}
$("dpdf").onclick=()=>{const d=$("rdate").value||today;preview("Daily report",d,tx.filter(t=>t.date===d),"daily-report-"+d+".pdf")};
$("mpdf").onclick=()=>{const m=$("mon").value;const lbl=new Date(m+"-01T00:00:00").toLocaleString("en-IN",{month:"long",year:"numeric"});preview("Monthly report",lbl,tx.filter(t=>t.date.startsWith(m)),"monthly-report-"+m+".pdf")};
$("mon").onchange=render;render();
