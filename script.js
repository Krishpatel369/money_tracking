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

const pad=n=>String(n).padStart(2,"0");
const addDays=(d,k)=>{const t=new Date(d+"T00:00:00Z");t.setUTCDate(t.getUTCDate()+k);return t.toISOString().slice(0,10)};
const range=(a,b)=>{const r=[];for(let d=a;d<=b;d=addDays(d,1))r.push(d);return r};
function series(days,rows){const ex=days.map(()=>0),inc=ex.slice(),bk=ex.slice();rows.forEach(t=>{const i=days.indexOf(t.date);if(i<0)return;if(t.type==="out")ex[i]+=t.a;else inc[i]+=t.a;if(t.mode==="Bank")bk[i]+=t.type==="in"?t.a:-t.a});for(let i=1;i<bk.length;i++)bk[i]+=bk[i-1];return{ex,inc,bk}}
function scale(S){const lo=Math.min(0,...S.bk),hi=Math.max(1,...S.ex,...S.inc,...S.bk),raw=(hi-lo)/4,p=10**Math.floor(Math.log10(raw)),s=[1,2,2.5,5,10].find(x=>x*p>=raw)*p;return{lo:Math.floor(lo/s)*s,hi:Math.ceil(hi/s)*s,s}}
const short=v=>{const a=Math.abs(v),g=a>=1e5?(a/1e5)+"L":a>=1e3?(a/1e3)+"k":a;return(v<0?"-":"")+g};
const showLbl=(d,i,N)=>N<=8||+d.slice(8)===1||+d.slice(8)%5===0||i===N-1;
const LEG='<div class="leg"><span><i style="background:#dc2626"></i>Expenses</span><span><i style="background:#2563eb"></i>Added money</span><span><i style="background:var(--ink)"></i>Bank money</span></div>';
function trim(days,rows){const last=rows.reduce((m,t)=>t.date>m?t.date:m,today),k=days.filter(d=>d<=last);return k.length>=2?k:days.slice(0,2)}
function chartSVG(days,S){
 const N=days.length,{lo,hi,s}=scale(S),W=420,H=260,L=44,R=12,T=12,B=28,x=i=>L+(W-L-R)*i/(N-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
 let g="";
 for(let v=lo;v<=hi+s/2;v+=s)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end">${short(Math.round(v*100)/100)}</text>`;
 days.forEach((d,i)=>{if(showLbl(d,i,N))g+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle">${+d.slice(8)}</text>`});
 [[S.ex,"#dc2626","Expenses"],[S.inc,"#2563eb","Added money"],[S.bk,"var(--ink)","Bank money"]].forEach(([k,c,nm])=>{
  g+=`<polyline points="${k.map((v,i)=>x(i).toFixed(1)+","+y(v).toFixed(1)).join(" ")}" fill="none" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" style="stroke:${c}"/>`;
  g+=k.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${N>16?2:3}" style="fill:${c}"><title>${days[i]} – ${nm}: ${fmt(v)}</title></circle>`).join("");
 });
 return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Expenses, added money and bank balance by day" style="width:100%;height:auto;display:block;font-size:10px;fill:var(--mute)">${g}</svg>`;
}
function drawChart(m,rows){
 const el=$("chart"),[Y,M]=m.split("-").map(Number),n=new Date(Y,M,0).getDate();
 if(!rows.length){el.innerHTML='<p class="empty">No data for this month yet.</p>';return}
 const lastTx=Math.max(1,...rows.map(t=>+t.date.slice(8,10))),N=Math.max(2,Math.min(n,Math.max(lastTx,m===today.slice(0,7)?+today.slice(8,10):n)));
 const days=range(m+"-01",m+"-"+pad(N));
 el.innerHTML=chartSVG(days,series(days,rows))+'<p class="msg">Day of month on the bottom. Bank money = running bank balance for the month.</p>';
}
function pdfChart(doc,T,C,y,days,S){
 const X0=28,X1=192,Y0=y+2,Y1=y+52,N=days.length,{lo,hi,s}=scale(S),x=i=>X0+(X1-X0)*i/(N-1),yy=v=>Y1-(Y1-Y0)*(v-lo)/(hi-lo);
 doc.setLineWidth(.2);doc.setDrawColor(...C.line);
 for(let v=lo;v<=hi+s/2;v+=s){doc.line(X0,yy(v),X1,yy(v));T(short(Math.round(v*100)/100),X0-2,yy(v)+1,7.5,"normal","helvetica",C.mute,"right")}
 days.forEach((d,i)=>{if(showLbl(d,i,N))T(+d.slice(8),x(i),Y1+5,7.5,"normal","helvetica",C.mute,"center")});
 const L=[["Expenses",[220,38,38],S.ex],["Added money",[37,99,235],S.inc],["Bank money",[0,0,0],S.bk]];
 L.forEach(([nm,c,k])=>{doc.setDrawColor(...c);doc.setFillColor(...c);doc.setLineWidth(.6);for(let i=1;i<N;i++)doc.line(x(i-1),yy(k[i-1]),x(i),yy(k[i]));k.forEach((v,i)=>doc.circle(x(i),yy(v),N>16?.6:.9,"F"))});
 L.forEach(([nm,c],i)=>{doc.setDrawColor(...c);doc.setLineWidth(.9);doc.line(X0+i*44,Y1+11,X0+i*44+8,Y1+11);T(nm,X0+i*44+10,Y1+12,8.5)});
 doc.setLineWidth(.2);
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
function preview(title,sub,rows,fname,days){
 const pv=$("pv"),say=t=>$("msg").textContent=t;
 if(!rows.length){pv.hidden=true;cur=null;say("No transactions for this period, so there is nothing to preview.");return}
 cur={title,sub,rows,fname,days};const cs=series(days,tx.filter(t=>days.includes(t.date)));say("");
 const k=calc(rows),cats=catTotals(rows);
 const bars=cats.length?cats.map(([c,v])=>`<div class="bar"><div><span>${esc(c)}</span><span>${fmt(v)}</span></div><i style="width:${Math.max(3,v/k.exp*100)}%"></i></div>`).join(""):'<p class="empty">No spending in this period.</p>';
 const list=asc(rows).map(t=>`<div class="tx"><div class="m"><b>${esc(t.cat)}</b><span>${t.date} – ${t.mode||"Cash"}${t.note?" – "+esc(t.note):""}</span></div><b class="${t.type}">${t.type==="in"?"+":"−"}${fmt(t.a)}</b></div>`).join("");
 pv.innerHTML=`<h2>${title}: ${sub}</h2><div class="bal"><small>Balance</small><b>${fmt(k.inc-k.exp)}</b><div class="row"><div><small>Income</small><br><span class="in">${fmt(k.inc)}</span></div><div><small>Spent</small><br><span class="out">${fmt(k.exp)}</span></div><div><small>In bank</small><br>${fmt(k.m.Bank)}</div><div><small>In cash</small><br>${fmt(k.m.Cash)}</div></div></div><h2>Daily cash &amp; bank flow</h2>${LEG}${chartSVG(days,cs)}<h2>Spending by category</h2>${bars}<h2>Transactions</h2>${list}<button class="add" id="dl" type="button">Download PDF</button>`;
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
 need(84);T("Daily cash & bank flow",15,y,13,"bold","times");y+=2;pdfChart(doc,T,C,y,r.days,series(r.days,tx.filter(t=>r.days.includes(t.date))));y+=76;
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
$("dpdf").onclick=()=>{const d=$("rdate").value||today;preview("Daily report",d,tx.filter(t=>t.date===d),"daily-report-"+d+".pdf",range(addDays(d,-6),d))};
$("wpdf").onclick=()=>{const d=$("rdate").value||today,a=addDays(d,-((new Date(d+"T00:00:00Z").getUTCDay()+6)%7)),all=range(a,addDays(a,6)),rows=tx.filter(t=>all.includes(t.date));preview("Weekly report",a+" to "+all[6],rows,"weekly-report-"+a+".pdf",trim(all,rows))};
$("mpdf").onclick=()=>{const m=$("mon").value,[Y,M]=m.split("-").map(Number),all=range(m+"-01",m+"-"+pad(new Date(Y,M,0).getDate())),rows=tx.filter(t=>t.date.startsWith(m)),lbl=new Date(m+"-01T00:00:00").toLocaleString("en-IN",{month:"long",year:"numeric"});preview("Monthly report",lbl,rows,"monthly-report-"+m+".pdf",trim(all,rows))};
let clr=null;
const askClear=k=>{clr=k;const m=$("mon").value;$("cmsg").textContent=k==="all"?"Delete ALL transactions and custom categories? This cannot be undone.":"Delete all transactions for "+m+"? This cannot be undone.";$("cbtns").hidden=true;$("cconf").hidden=false;$("cno").focus()};
const endClear=t=>{clr=null;$("cconf").hidden=true;$("cbtns").hidden=false;$("cmsg").textContent=t||"Delete saved transactions from this device. This cannot be undone, so download your reports first."};
$("cmon").onclick=()=>askClear("month");
$("call").onclick=()=>askClear("all");
$("cno").onclick=()=>endClear();
$("cyes").onclick=()=>{
 if(clr==="all"){tx=[];custom={out:[],in:[]};saveCats();fillCats()}
 else if(clr==="month"){const m=$("mon").value;tx=tx.filter(t=>!t.date.startsWith(m))}
 else return;
 const all=clr==="all";save();$("pv").hidden=true;cur=null;render();endClear(all?"All data cleared.":"This month's data cleared.");
};
$("mon").onchange=render;render();
