/* ============ train: program timeline, week list, session detail, volume heatmap ============ */
var volOpen=null;
function sessionSets(id,w){ var n=0; S[id].items.forEach(function(it){ n+=setsFor(it,w); }); return n; }
function phaseName(w){ return w<=2?"Learn":w<=7?"Build":w===8?"Deload":"Build+"; }
function phaseNote(w){ return w<=2?"2 sets per exercise, easy effort":w<=7?"3 sets per exercise":w===8?"lighter recovery week":"3 sets, a 4th on laggers"; }
var CLSVAR={P:"push",Q:"pull",L:"legs",R:"mute"};
function ensureSel(){ if(!sel){ var p0=where(); sel=(p0.state==="in")?{w:p0.w,d:p0.d}:{w:1,d:0}; } }
function renderGrid(){
  ensureSel(); var p=where(), w=sel.w, h="", k, d;
  for(k=1;k<=12;k++){
    var dn=0, pl=planned(k); for(d=0;d<7;d++){ if(countable(sched(k,d))&&st.done[key(k,d)]) dn++; }
    h+='<button type="button" class="tlw'+(k===w?' sel':'')+(p.state==="in"&&p.w===k?' cur':'')+(dn===pl?' full':'')+'" data-wk="'+k+'" aria-label="Week '+k+', '+dn+' of '+pl+' sessions done"><div class="bar"><i style="height:'+(dn/pl*100)+'%"></i></div><span>'+k+'</span></button>';
  }
  $("tl").innerHTML=h;
  var ph=[["Learn",1,2],["Build",3,7],["Lite",8,8],["Build+",9,12]];
  $("tlph").innerHTML=ph.map(function(x){ return '<span class="'+(w>=x[1]&&w<=x[2]?'on':'')+'" style="grid-column:'+x[1]+'/'+(x[2]+1)+'">'+x[0]+'</span>'; }).join("");
  $("wktitle").textContent="Week "+w+" · "+phaseName(w);
  $("wksub").textContent=phaseNote(w)+(p.state==="in"&&p.w===w?" · this week":"");
  $("wkprev").disabled=w<=1; $("wknext").disabled=w>=12;
  var L="";
  for(d=0;d<7;d++){
    var id=sched(w,d), s=S[id], dt=addDays(startMon(),(w-1)*7+d), kk=key(w,d), isDone=!!st.done[kk], cnt=countable(id);
    var isToday=p.state==="in"&&p.w===w&&p.d===d, past=(p.state==="in"&&(w<p.w||(w===p.w&&d<p.d)))||p.state==="after";
    var stat=isDone?'<span class="dstat done">Done</span>':isToday?'<span class="dstat today">Today</span>':(cnt&&past)?'<span class="dstat missed">Missed</span>':'';
    var sub=esc(s.focus)+(cnt?' · '+s.items.length+' exercises · '+sessionSets(id,w)+' sets':'');
    L+='<button type="button" class="dayrow'+(cnt?'':' rest')+(sel.d===d?' sel':'')+'" data-sel="'+w+'-'+d+'" aria-label="'+DAYS[d]+': '+esc(s.name)+'"><span class="dbadge" style="--c:var(--'+CLSVAR[s.cls]+')">'+(cnt?LAB[s.cls]:'REST')+'</span><span class="dmain"><small class="dd">'+DS[d]+' '+dm(dt)+'</small><b>'+esc(s.name)+'</b><small>'+sub+'</small></span>'+stat+'</button>';
  }
  $("weeklist").innerHTML=L;
}
function renderDetail(){
  ensureSel();
  var dl=$("detail"); dl.className="detail card sess c-"+S[sched(sel.w,sel.d)].cls; dl.innerHTML=sessionHTML(sel.w,sel.d,true); renderVol(sel.w);
}
function renderVol(w){
  var per={}, d; GROUPS.forEach(function(g){ per[g[0]]={days:[0,0,0,0,0,0,0],ex:[]}; });
  for(d=0;d<7;d++){ var id=sched(w,d); S[id].items.forEach(function(it){ var o=per[it[7]], n=setsFor(it,w); o.days[d]+=n; o.ex.push([d,S[id].name,it[0],n]); }); }
  var cols=[0,1,2,3,4,5], selD=sel?sel.d:-1;
  var h='<table class="vmx"><thead><tr><th></th>'+cols.map(function(c){ return '<th class="'+(selD===c?'on':'')+'">'+DS[c]+'</th>'; }).join("")+'<th>Week</th></tr></thead><tbody>';
  GROUPS.forEach(function(g){
    var o=per[g[0]], tot=0; o.days.forEach(function(n){ tot+=n; });
    var cls=tot<6?"low":tot<10?"mid":"ok", open=volOpen===g[0];
    h+='<tr class="vrow'+(open?' open':'')+'" data-vm="'+g[0]+'" tabindex="0" role="button" aria-expanded="'+open+'" aria-label="'+g[1]+': '+tot+' sets this week. Tap for the exercises."><td class="m">'+g[1]+'</td>'+
      cols.map(function(c){ var n=o.days[c]; return '<td class="c"><span class="vcell'+(n>=2?' hi':'')+(selD===c?' col':'')+'" style="--a:'+(n?Math.min(.85,.25+n*.18).toFixed(2):0)+'">'+(n||'·')+'</span></td>'; }).join("")+
      '<td class="tot"><span class="dot s-'+cls+'"></span><b>'+tot+'</b></td></tr>';
    if(open) h+='<tr class="vdet"><td colspan="8">'+(o.ex.length?o.ex.map(function(e){ return '<div><b>'+DS[e[0]]+'</b> '+esc(e[2])+' <span class="mono">'+e[3]+' sets</span></div>'; }).join(""):'No direct sets for this muscle.')+'</td></tr>';
  });
  h+='</tbody></table><div class="vleg"><span><i class="dot s-low"></i>low, under 6</span><span><i class="dot s-mid"></i>building, 6–9</span><span><i class="dot s-ok"></i>on target, 10 or more</span></div>';
  $("vol").innerHTML=h; $("voltitle").textContent="Sets per muscle · week "+w;
}

/* ============ progress charts: week axis, moving average, expected-pace band, scrub tooltip ============ */
function movAvg(pts){ return pts.map(function(p){ var s=0,n=0; pts.forEach(function(q){ if(q.x<=p.x&&q.x>=p.x-6*86400000){ s+=q.y; n++; } }); return {x:p.x,y:s/n,d:p.d}; }); }
function niceTicks(mn,mx,count){
  var span=Math.max(mx-mn,0.0001), raw=span/count, mag=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)), err=raw/mag, step=mag*(err>=5?5:err>=2?2:1);
  var a=Math.ceil(mn/step)*step, t=[]; for(var v=a;v<=mx+1e-9;v+=step) t.push(+v.toFixed(6)); return t;
}
function weekOf(x){ return Math.floor((x-startMon().getTime())/(7*86400000))+1; }
function chart2(o){
  var W=Math.max(280,Math.floor(o.el.clientWidth||340)), H=236, L=40, R=12, T=16, B=30;
  var pts=o.pts, base=pts[0], avg=movAvg(pts), DAY=86400000;
  var lastX=Math.max(pts[pts.length-1].x,Date.now());
  var x0=base.x, x1=Math.min(lastX+21*DAY,Math.max(startMon().getTime()+84*DAY,lastX));
  if(x1-x0<28*DAY) x1=x0+28*DAY;
  var wk=function(x){ return (x-x0)/(7*DAY); };
  var ys=pts.map(function(p){return p.y;}).concat((o.refs||[]).map(function(r){return r.y;}));
  if(o.band){ ys.push(base.y-o.band[1]*wk(x1)); ys.push(base.y-o.band[0]*wk(x1)); }
  var mn=Math.min.apply(null,ys), mx=Math.max.apply(null,ys), pad=(mx-mn)*0.1||0.5; mn-=pad; mx+=pad;
  var X=function(x){ return L+(x-x0)/(x1-x0)*(W-L-R); }, Y=function(y){ return T+(1-(y-mn)/(mx-mn))*(H-T-B); };
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(o.name)+' over the program">';
  niceTicks(mn,mx,4).forEach(function(v){ var y=Y(v); s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"/><text x="'+(L-6)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end">'+n1(v).replace(/\.0$/,"")+'</text>'; });
  if(o.band){
    var xa=X(x0), xb=X(x1), poly=xa+","+Y(base.y).toFixed(1)+" "+xb+","+Y(base.y-o.band[0]*wk(x1)).toFixed(1)+" "+xb+","+Y(base.y-o.band[1]*wk(x1)).toFixed(1);
    s+='<polygon class="band" points="'+poly+'"/><text class="bt" x="'+(W-R-4)+'" y="'+(Y(base.y-o.band[1]*wk(x1))+14).toFixed(1)+'" text-anchor="end">'+esc(o.bandLabel)+'</text>';
  }
  (o.refs||[]).forEach(function(r){ var y=Y(r.y); s+='<line class="rf" x1="'+L+'" x2="'+(W-R)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"/><text class="bt" x="'+(W-R)+'" y="'+(y-5).toFixed(1)+'" text-anchor="end">'+esc(r.label)+'</text>'; });
  var k0=weekOf(x0), k1=weekOf(x1), n=k1-k0+1, stepW=Math.max(1,Math.ceil(n/6));
  for(var k=Math.max(1,k0);k<=k1;k+=stepW){ var xx=startMon().getTime()+(k-1)*7*DAY; if(xx>=x0&&xx<=x1) s+='<line class="gl v" x1="'+X(xx).toFixed(1)+'" x2="'+X(xx).toFixed(1)+'" y1="'+T+'" y2="'+(H-B)+'"/><text x="'+X(xx).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle">W'+k+'</text>'; }
  var tx=Date.now(); if(tx>=x0&&tx<=x1) s+='<line class="today" x1="'+X(tx).toFixed(1)+'" x2="'+X(tx).toFixed(1)+'" y1="'+T+'" y2="'+(H-B)+'"/>';
  pts.forEach(function(p){ s+='<circle class="pt" cx="'+X(p.x).toFixed(1)+'" cy="'+Y(p.y).toFixed(1)+'" r="3"/>'; });
  var lineSrc=o.avg?avg:pts;
  if(lineSrc.length>1) s+='<path class="ln" pathLength="1" d="'+lineSrc.map(function(p,i){ return (i?"L":"M")+X(p.x).toFixed(1)+" "+Y(p.y).toFixed(1); }).join(" ")+'"/>';
  var lp=lineSrc[lineSrc.length-1], lx=X(lp.x), ly=Y(lp.y);
  s+='<circle class="last" cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="6"/>';
  s+='<g class="scrub" hidden><line class="sl" y1="'+T+'" y2="'+(H-B)+'"/><circle class="sp" r="6"/></g><rect class="hit" x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(H-T-B)+'"/></svg><div class="tip" hidden></div>';
  o.el.innerHTML=s;
  var svg=o.el.querySelector("svg"), tip=o.el.querySelector(".tip"), g=svg.querySelector(".scrub"), sl=g.querySelector(".sl"), sp=g.querySelector(".sp");
  function show(e){
    var r=svg.getBoundingClientRect(), px=(e.clientX-r.left)*(W/r.width), best=null, bd=1e12;
    pts.forEach(function(p,i){ var dx=Math.abs(X(p.x)-px); if(dx<bd){ bd=dx; best=i; } });
    var p=pts[best], a=avg[best], cx=X(p.x), cy=Y(p.y);
    g.hidden=false; sl.setAttribute("x1",cx); sl.setAttribute("x2",cx); sp.setAttribute("cx",cx); sp.setAttribute("cy",cy);
    var dlt=p.y-base.y;
    tip.innerHTML='<b>'+n2(p.y)+' '+o.unit+'</b><span>'+dateLabel(p.d)+(weekOf(p.x)>=1?' · Week '+weekOf(p.x):' · before start')+'</span><span>'+(best===0?'baseline':(dlt>0?'+':'')+n2(dlt)+' '+o.unit+' vs baseline')+(o.avg&&pts.length>1?' · avg '+n2(a.y):'')+'</span>';
    tip.hidden=false; var tw=tip.offsetWidth, left=cx*(r.width/W)-tw/2; left=Math.max(4,Math.min(r.width-tw-4,left)); tip.style.left=left+"px";
  }
  function hide(){ g.hidden=true; tip.hidden=true; }
  svg.addEventListener("pointermove",show); svg.addEventListener("pointerdown",show); svg.addEventListener("pointerleave",hide);
  return {avgLast:lp,base:base,band:o.band,wk:wk};
}
function chartHead(title,val,unit,chipText,chipCls){
  return '<div class="chh"><div><span class="ct">'+title+'</span><b class="cv">'+val+' <small>'+unit+'</small></b></div>'+(chipText?'<span class="pace '+chipCls+'">'+chipText+'</span>':'')+'</div>';
}
function renderCharts(){
  var box=$("charts"), pane=$("p-charts"); if(!pane||!pane.classList.contains("on")) return;
  var wp=series("weight"), bp=series("belly");
  box.innerHTML='<div class="ch" id="ch1"></div><div class="ch" id="ch2"></div>';
  function one(id,pts,opt,headFn){
    var el=$(id);
    if(!pts.length){ el.innerHTML=chartHead(opt.name,"–",opt.unit,"","")+'<div class="empty">Log your first '+opt.name.toLowerCase()+' on the Log tab, or weigh in on Today.</div>'; return; }
    el.innerHTML=chartHead(opt.name,"…",opt.unit,"","")+'<div class="cw"></div><p class="small mute chn">'+opt.note+'</p>';
    var info=chart2({el:el.querySelector(".cw"),name:opt.name,unit:opt.unit,pts:pts,refs:opt.refs,band:opt.band,bandLabel:opt.bandLabel,avg:opt.avg});
    var h=headFn(info,pts); el.querySelector(".chh").outerHTML=h;
  }
  one("ch1",wp,{name:"Weight",unit:"kg",band:[0.25,0.5],bandLabel:"expected loss 0.25–0.5 kg/week",avg:true,note:"Line is the 7-day average. Dots are single weigh-ins. Touch or hover the chart to read a day."},function(info,pts){
    var last=info.avgLast, d=last.y-info.base.y, spanD=(last.x-info.base.x)/86400000;
    var chip="",cls="";
    if(spanD>=7){ var hi=info.base.y-0.25*info.wk(last.x), lo=info.base.y-0.5*info.wk(last.x); if(last.y>hi+0.15){ chip="Behind pace"; cls="amber"; } else if(last.y<lo-0.15){ chip="Faster than pace"; cls="blue"; } else { chip="On pace"; cls="green"; } }
    else { chip="Too early to judge"; cls="grey"; }
    return chartHead("Weight",n1(last.y),"kg · "+(pts.length>1?(d>0?'+':'')+n2(d)+' since baseline':'baseline'),chip,cls);
  });
  one("ch2",bp,{name:"Belly",unit:"in",refs:[{y:35.4,label:"90 cm risk line"},{y:33.5,label:"85 cm target"}],note:"Measured level with the navel, midway between rib and hip bone. Weekly is enough.",avg:false},function(info,pts){
    var last=pts[pts.length-1], d=last.y-pts[0].y, to=last.y-35.4;
    return chartHead("Belly",n2(last.y),"in · "+(pts.length>1?(d>0?'+':'')+n2(d)+' since baseline':'baseline'),to>0?n1(to)+' in to the 90 cm line':'Below the 90 cm line',to>0?'amber':'green');
  });
}
