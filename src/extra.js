/* ============ weekly check-in (how a coach runs a review) ============ */
var CI_Q=[
 ["prot","Protein days on target (of 7)",["0–2","3–4","5–6","7"]],
 ["sleep","Average sleep",["under 6 h","6–7 h","7–8 h","8 h +"]],
 ["steps","Step target hit",["rarely","some days","most days"]],
 ["energy","Energy and hunger",["hungry, tired","ok","strong"]],
 ["conf","How sure are you about next week's habit?",["not very","fairly","very"]]
];
var ciDraft=null, ciWeek=0;
function planWeek(){ var p=where(); return p.state==="in"?p.w:(p.state==="after"?12:1); }
function weekAdh(w){ var n=0,pl=planned(w); for(var d=0;d<7;d++){ if(countable(sched(w,d))&&st.done[key(w,d)]) n++; } return {n:n,pl:pl}; }
function trendInfo(){
  var pts=series("weight"); if(pts.length<2) return null;
  var last=pts[pts.length-1], from=pts[0], win=last.x-21*86400000;
  for(var i=0;i<pts.length;i++){ if(pts[i].x>=win){ from=pts[i]; break; } }
  var days=(last.x-from.x)/86400000; if(days<1) return null;
  var rate=(last.y-from.y)/(days/7), bp=series("belly"), bd=null;
  if(bp.length>1){ var b0=bp[0], b1=bp[bp.length-1]; for(var j=0;j<bp.length;j++){ if(bp[j].x>=last.x-21*86400000){ b0=bp[j]; break; } } bd=b1.y-b0.y; }
  return {days:days,rate:rate,bd:bd};
}
var HABITS={
 sleep:["Sleep first","Phone away at 10:30 pm, lights out by 11:00. Aim for 7 hours or more.","Short sleep cut the share of weight lost as fat in a small 14-day study."],
 show:["Show up","Do 5 of 6 sessions. A short, light session beats a skipped one.","A plan you skip does nothing. Fix attendance before touching food."],
 protein:["Protein first","Put a protein food in every meal until you hit 140 g on 6 of 7 days.","Protein is the food habit with the clearest support for keeping muscle."],
 steps:["Walk after meals","Walk 10 minutes after lunch and after dinner, every day.","Steps are the easiest activity to add without hurting your lifting."],
 sleep2:["Sleep to 7 hours","Move bedtime 30 minutes earlier. Keep the same wake time.","You are close. Half an hour more sleep is the next gain."],
 protein2:["Protein every day","Hit your protein on all 7 days, weekends too.","Weekends are where the weekly average usually slips."],
 hold:["Keep going","Same habits. Add 1 rep, or the smallest weight step, on your lifts.","Everything is on track. Do not fix what works."]
};
function coachSays(ci,adh,tr){
  var k;
  if(ci.sleep===0) k="sleep"; else if(adh.n/adh.pl<0.67) k="show"; else if(ci.prot<=1) k="protein"; else if(ci.steps===0) k="steps"; else if(ci.sleep===1) k="sleep2"; else if(ci.prot===2) k="protein2"; else k="hold";
  var h=HABITS[k], cal;
  var stalled=tr&&tr.days>=18&&tr.rate>-0.2&&(tr.bd==null||tr.bd>-0.1), fast=tr&&tr.rate<-0.7;
  if(ci.energy===0||fast) cal="Eat about 150 kcal more (a banana and chana). You are low on energy or losing fast.";
  else if(k!=="hold") cal="Do not change calories this week. Fix the habit first, then judge the numbers.";
  else if(stalled) cal="Weight is flat and your habits are solid. Cut 100–150 kcal, or add 1,000 steps a day.";
  else cal="Hold calories at 2,100.";
  var small=ci.conf===0?" You said you are not very sure, so make it smaller: do it on 4 days, not 7.":"";
  return {key:k,title:h[0],habit:h[1]+small,why:h[2],cal:cal};
}
function renderCheckin(){
  var w=planWeek(); if(ciWeek!==w||!ciDraft){ ciWeek=w; ciDraft=JSON.parse(JSON.stringify(st.checks[w]||{})); }
  var adh=weekAdh(w), tr=trendInfo(), ready=CI_Q.every(function(q){ return ciDraft[q[0]]!=null; });
  var h='<h3>Weekly check-in · week '+w+'</h3><div class="ci"><p class="small mute">One minute, once a week. Coaches review the same few things, then change one thing. Answer honestly. Nobody is grading you.</p>';
  h+='<div class="cifacts mono"><span>sessions <b>'+adh.n+'/'+adh.pl+'</b></span>'+(tr?'<span>weight <b>'+(tr.rate>0?'+':'')+n2(tr.rate)+' kg/wk</b></span>':'<span>weight <b>needs 2 entries</b></span>')+(tr&&tr.bd!=null?'<span>belly <b>'+(tr.bd>0?'+':'')+n2(tr.bd)+' in</b></span>':'')+'</div>';
  CI_Q.forEach(function(q){ h+='<div class="ciq"><label>'+q[1]+'</label><div class="cset">'+q[2].map(function(o,i){ return '<button type="button" class="cb" data-ci="'+q[0]+'|'+i+'" aria-pressed="'+(ciDraft[q[0]]===i?'true':'false')+'">'+esc(o)+'</button>'; }).join("")+'</div></div>'; });
  if(ready){ var r=coachSays(ciDraft,adh,tr);
    h+='<div class="cires"><span class="tag">NEXT WEEK: ONE HABIT</span><b>'+esc(r.title)+'</b><p>'+esc(r.habit)+'</p><p class="small">'+esc(r.why)+'</p><p class="cical"><b>Calories:</b> '+esc(r.cal)+'</p><div class="row"><button type="button" class="pri" data-cisave="1">Save check-in</button>'+(st.checks[w]?'<span class="small">Saved for this week. Saving again updates it.</span>':'')+'</div></div>';
  } else h+='<p class="small mute" style="margin-top:14px">Answer all five to get your one habit for next week.</p>';
  h+='</div>';
  var hist=Object.keys(st.checks).map(Number).sort(function(a,b){ return b-a; }).slice(0,4);
  if(hist.length) h+='<div class="cihist mono small">'+hist.map(function(k){ var c=st.checks[k]; return '<div><b>W'+pad(k)+'</b> <span>'+esc(c.title||"")+'</span></div>'; }).join("")+'</div>';
  $("checkin").innerHTML=h;
}
function habitHTML(){
  var f=st.focus||{title:"Protein first",habit:"Put a protein food in every meal until you hit 140 g on 6 of 7 days."};
  return '<div><h3>This week\'s one habit</h3><div class="habit"><b>'+esc(f.title)+'</b><p>'+esc(f.habit)+'</p><p class="small" style="margin-top:8px"><a href="#progress">Do the weekly check-in</a></p></div></div>';
}
function qwHTML(){
  var pts=series("weight"), last=pts.length?pts[pts.length-1]:null;
  return '<div><h3>Weigh in</h3><form id="qw" class="qw" novalidate><label for="qwv">Morning weight, kg</label><div class="row"><input id="qwv" type="number" inputmode="decimal" step="0.1" placeholder="'+(last?n1(last.y):"82.0")+'" style="max-width:160px"><button class="pri" type="submit">Save</button></div><p class="small mute" id="qwm">'+(last?'Last: '+n1(last.y)+' kg on '+dateLabel(last.d)+'. Judge the weekly average, not one day.':'Weigh every morning, after the toilet, before food.')+'</p></form></div>';
}
function upsertToday(field,val){
  var date=todayStr(), ex=null; for(var j=0;j<st.log.length;j++){ if(st.log[j].date===date&&!st.log[j].base){ ex=st.log[j]; break; } }
  if(ex) ex[field]=val; else { var r={id:String(Math.random()).slice(2,10),date:date}; r[field]=val; st.log.push(r); }
  save();
}

/* ============ eat: protein anchors ============ */
var ANCH=[["Chicken breast, 150 g raw",34],["Soya chunks, 60 g raw",31],["Fish (rohu), 150 g raw",25],["Paneer, 100 g",18],["Dal, 150 g cooked",9],["Whole egg",6.3],["Milk, 200 ml",6.2],["Roasted chana, 30 g",5.7],["Curd, 150 g",4.7]];
function renderAnchors(){
  var el=$("anch"); if(!el) return;
  el.innerHTML=ANCH.map(function(a){ return '<div class="vr"><span>'+esc(a[0])+'</span><div class="vt"><i style="width:'+Math.min(100,a[1]/36*100)+'%"></i><b style="left:'+(35/36*100)+'%"></b></div><span class="n">'+String(a[1]).replace(/\.0$/,"")+'</span></div>'; }).join("");
}

/* ============ guide ============ */
var LEVERS=[
 {t:"Show up",pro:"Coaches plan around what you will actually do. A plan you skip is worth nothing.",move:"Do 5 of 6 sessions. A light session beats a skipped one.",tag:"STUDY · WEAK",
  ev:["People who track and stick with a plan lose more weight across every review I found, but the evidence is rated weak.","Habits took a median of about 66 days to form, with a very wide range, and one missed day did not break them (Lally 2010, as summarised). Exercise habits took longer. Expect to need all 12 weeks."],
  links:[["Burke 2011 review","https://pubmed.ncbi.nlm.nih.gov/21185970/"],["Lally 2010, summary","https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit"]]},
 {t:"Track it, daily",pro:"Dietitians ask clients to self-monitor: food, weight or activity.",move:"Weigh in on Today every morning. Judge the weekly average, never one day.",tag:"STUDY · WEAK",
  ev:["Self-monitoring was consistently linked to greater weight loss in 22 studies (15 diet, 6 self-weighing, 1 exercise). The authors rated the evidence weak."],
  links:[["Burke 2011 review","https://pubmed.ncbi.nlm.nih.gov/21185970/"]]},
 {t:"One habit at a time",pro:"Habit-based coaches, such as Precision Nutrition, add one small habit every few weeks instead of changing everything at once.",move:"The weekly check-in picks one habit. Ignore the rest until it sticks.",tag:"PRACTICE",
  ev:["This is coaching practice from the company's own materials in my search results. I found no trial that tests it."],
  links:[["Precision Nutrition","https://www.precisionnutrition.com/"]]},
 {t:"Protein at every meal",pro:"Dietitians set a daily protein number, then spread it across the day.",move:"Aim for about 35 g in each main meal. See the protein anchors on Eat.",tag:"STUDY",
  ev:["ISSN: 1.4–2.0 g per kg a day, ideally spread across the day every 3–4 hours."],
  links:[["ISSN position stand","https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5477153/"]]},
 {t:"Lift to 1–3 reps short",pro:"Strength coaches use reps in reserve: stop with a few reps left, add reps, then add weight.",move:"Add a rep each session. Add weight when every set hits the top of the range.",tag:"STUDY · MIXED",
  ev:["Muscle growth improves as sets get closer to failure, but lifters misjudge how many reps they have left, so treat '1–3 left' as a rough guide."],
  links:[["NSCA summary","https://www.nsca.com/education/articles/nsca-coach/using-intensity-based-on-sets-and-repetitions-over-50-years-of-experience-a-brief-overview-of-load-setting-and-programming-strategy/"]]},
 {t:"Sleep 7 hours",pro:"Sleep is a standard question in a weekly review.",move:"Phone away at 10:30 pm, lights out at 11:00.",tag:"STUDY · SMALL",
  ev:["In a 14-day study of 10 adults on the same diet, 5.5 hours of sleep instead of 8.5 cut fat lost from about 1.4 kg to 0.6 kg and raised lean mass lost. It is a very small study."],
  links:[["Nedeltcheva 2010, full text","https://www.paulogentil.com/pdf/Insufficient%20Sleep%20Undermines%20Dietary%20Efforts%20to%20Reduce%20Adiposity.pdf"]]},
 {t:"Walk after meals",pro:"A step target is the easiest activity to add for a desk worker, and it does not hurt lifting recovery.",move:"6,000 steps now, 8,000 plus later, and 10 minutes after lunch and dinner.",tag:"PRACTICE",
  ev:["I did not find a study for the 10-minute post-meal walk in this search. This is practice and general activity guidance, not a proven number."],links:[]},
 {t:"Talk it through",pro:"Dietitians use motivational interviewing: open questions about why you want this and how sure you are.",move:"The check-in asks how sure you are. If you say 'not very', the habit shrinks.",tag:"STUDY",
  ev:["A dietitian workgroup review rated motivational interviewing as strongly improving adherence. A meta-analysis summarised by StatPearls found about 1.5 kg more weight loss than usual care."],
  links:[["Spahn 2010 review","https://www.cdrnet.org/vault/2459/web/files/Spahn%202010.pdf"],["StatPearls summary","https://www.ncbi.nlm.nih.gov/sites/books/NBK618378/"]]},
 {t:"Change the plan slowly",pro:"Pros do not change calories after one bad weigh-in. They wait for a trend and fix habits first.",move:"Wait about 3 weeks of data. The Progress tab then tells you what to adjust.",tag:"MY RULE",
  ev:["My rule, based on normal day-to-day weight swings. No trial cited."],links:[]}
];
var guideSub="matters", mattersDone=false;
function renderMatters(){
  if(mattersDone) return; mattersDone=true;
  var h='<p class="mute" style="max-width:62ch;margin-bottom:6px">Coaches and dietitians do not start with the perfect plan. They start with what you will do every week, then change one thing at a time. Ranked by how much each should matter for you, in my judgement.</p>';
  LEVERS.forEach(function(l,i){
    h+='<div class="lever"><div class="rk">'+(i+1)+'</div><div><h3>'+esc(l.t)+' <span class="etag">'+esc(l.tag)+'</span></h3><p class="pro">'+esc(l.pro)+'</p><p class="move">Your move: '+esc(l.move)+'</p>'+l.ev.map(function(e){ return '<p class="ev">'+esc(e)+'</p>'; }).join("")+(l.links.length?'<p class="ev">'+l.links.map(function(k){ return '<a href="'+k[1]+'">'+esc(k[0])+'</a>'; }).join(" · ")+'</p>':'')+'</div></div>';
  });
  $("g-matters").innerHTML=h;
}
function renderGuide(){
  ["matters","apps","proof"].forEach(function(s){ $("g-"+s).classList.toggle("on",s===guideSub); var b=document.querySelector('[data-sub="'+s+'"]'); if(b) b.setAttribute("aria-selected",s===guideSub?"true":"false"); });
  if(guideSub==="matters") renderMatters();
  if(guideSub==="apps"){ renderTest(); renderWTest(); }
}
