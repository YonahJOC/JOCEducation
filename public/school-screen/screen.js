"use strict";(()=>{var w="Asia/Jerusalem";function y(s,e=w){let t=new Intl.DateTimeFormat("en-CA",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(s),n=a=>{var c;return((c=t.find(r=>r.type===a))==null?void 0:c.value)??""};return`${n("year")}-${n("month")}-${n("day")}`}function q(s){return Math.min(72,Math.floor(900/Math.max(1,s.trim().length)))}function L(s,e){let t=Math.max(1,Math.round(e));return s.map(n=>{let a=Math.max(0,Math.round(n.hours));return{label:n.label,hours:a,reached:a>=t,over:Math.max(0,a-t)}})}var Z={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function i(s){return String(s??"").replace(/[&<>"']/g,e=>Z[e])}var d=(s,e="")=>`<span class="ss-ms ${e}">${i(s)}</span>`;function $(s){return s&&/^(https:\/\/|\/api\/school-screen\/image\/)/.test(s)?i(s):""}function k(s){return s&&s.trimStart().startsWith("<svg")?s:""}function M(s){if(!s)return null;let e=new Date(s);if(Number.isNaN(e.getTime()))return null;let t=n=>new Intl.DateTimeFormat("en-US",{timeZone:w,...n}).format(e);return{dow:t({weekday:"short"}),day:t({day:"numeric"}),mon:t({month:"short"})}}function C(s){let e=s.trim().split(/\s+/);return e.length<2?["",s.trim()]:[e.slice(0,-1).join(" "),e[e.length-1]]}var N='<div class="ss-dot ss-dot-a"></div><div class="ss-dot ss-dot-b"></div>';function A(s){return`<div class="ss-photo"><img src="${$(s.imageUrl)}" alt="" /></div>`}function K(s,e){let t=M(s.startsAt),n=q(s.title);return`<div class="ss-fl ss-fl-event">
  <div class="ss-fl-img">${s.imageUrl?`<img src="${$(s.imageUrl)}" alt="" />`:""}</div>
  ${t?`<div class="ss-sticker"><div class="ss-st-dow">${i(t.dow)}</div><div class="ss-st-day">${i(t.day)}</div><div class="ss-st-mon">${i(t.mon)}</div></div>`:""}
  ${s.ambassadors?`<div class="ss-amb"><div class="ss-amb-ic">${d("waving_hand")}</div><div><div class="ss-amb-k">Ask our ambassadors</div><div class="ss-amb-n">${i(s.ambassadors)}</div></div></div>`:""}
  <div class="ss-fl-panel">
    ${N}
    <div class="ss-kicker">${d("celebration")}${i(s.line||`Coming up at ${e}`)}</div>
    <div class="ss-ev-title" style="font-size:${n}px">${i(s.title)}</div>
    <div class="ss-bar"></div>
    <div class="ss-pills">
      ${s.time?`<div class="ss-pill">${d("schedule")}${i(s.time)}</div>`:""}
      ${s.place?`<div class="ss-pill">${d("location_on")}${i(s.place)}</div>`:""}
    </div>
    ${s.qrSvg?`<div class="ss-ev-qr">${k(s.qrSvg)}</div>`:""}
  </div>
</div>`}function X(s,e){let[t,n]=C(s.title),a=M(s.startsAt);return`<div class="ss-fl ss-fl-program ${e?"ss-blue":"ss-orange"}">
  <div class="ss-bubble"></div><div class="ss-bubble-2"></div>
  ${a?`<div class="ss-sticker ss-sticker-sm"><div class="ss-st-k">${i(s.line&&s.line.length<=10?s.line:"Starts")}</div><div class="ss-st-big">${i(`${a.mon} ${a.day}`)}</div></div>`:""}
  <div class="ss-pg-icon">${d(s.icon||"volunteer_activism")}</div>
  <div class="ss-pg-title">${t?`<div class="ss-pg-small">${i(t)}</div>`:""}<div class="ss-pg-big">${i(n)}</div></div>
  ${s.line&&!(a&&s.line.length<=10)?`<div class="ss-pg-line">${i(s.line)}</div>`:""}
  ${s.qrSvg?`<div class="ss-pg-qr"><div class="ss-pg-qr-l">${i(s.qrLabel||"Scan to join")}</div><div class="ss-qrbox">${k(s.qrSvg)}</div></div>`:""}
</div>`}function Y(s){let[e,t]=C(s.title);return`<div class="ss-fl ss-fl-banner">
  <div class="ss-bn-img">${s.imageUrl?`<img src="${$(s.imageUrl)}" alt="" />`:""}</div>
  <div class="ss-bn-panel">
    ${N}
    <div class="ss-bn-grid">
      <div class="ss-bn-text">
        <div class="ss-kicker">${d("celebration")}${i(s.line||"Join the team")}</div>
        <div class="ss-bn-title">${e?`<div class="ss-bn-small">${i(e)}</div>`:""}<div class="ss-bn-big">${i(t)}</div></div>
      </div>
      ${s.qrSvg?`<div class="ss-bn-qr"><div class="ss-qrbox ss-qrbox-w">${k(s.qrSvg)}</div><div class="ss-bn-qr-l">${i(s.qrLabel||"Scan to join")}</div></div>`:""}
    </div>
    <div class="ss-pills">
      ${s.time?`<div class="ss-pill">${d("schedule")}${i(s.time)}</div>`:""}
      ${s.place?`<div class="ss-pill">${d("location_on")}${i(s.place)}</div>`:""}
    </div>
  </div>
</div>`}function j(s,e,t=0){return s.template==="EVENT"?K(s,e):s.template==="BANNER"?Y(s):X(s,t%2===1)}function H(s,e,t,n){let a=Array.from({length:n},(c,r)=>`<div class="ss-cdot${r===t?" on":""}"></div>`).join("");return`<div class="ss-cap-head"><div class="ss-cap-k">${d("photo_camera")}${i(s)} students in action</div><div class="ss-cdots">${a}</div></div>
<div class="ss-cap-t">${i(e)}</div>`}function I(s,e){let t=s.text.length>95?34:40;return`<div class="ss-so-head">
  <div class="ss-so-k">${d("campaign")}Chesed shout-out</div>
  ${e?`<div class="ss-so-topic">${d("today")}${i(e)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:${t}px">\u201C${i(s.text)}\u201D</div>
  ${s.from?`<div class="ss-so-from">${i(s.from)}</div>`:""}
</div>`}function U(s){return`<div class="ss-so-head">
  <div class="ss-so-k">${d("campaign")}Chesed shout-out</div>
  ${s?`<div class="ss-so-topic">${d("today")}${i(s)}</div>`:""}
</div>
<div class="ss-so-body">
  <div class="ss-so-text" style="font-size:40px">Who made a difference to you this week?</div>
  <div class="ss-so-from">Scan the code and tell everyone.</div>
</div>`}function R(s,e,t){let n=L(t,e),a=n.reduce((r,x)=>r+x.hours,0),c=r=>r.toLocaleString("en-US");return`<div class="ss-gr-head">
  <div class="ss-gr-k">${d("flag")}${i(s)} goal: ${c(e)} hours per grade</div>
  <div class="ss-gr-total"><div class="ss-gr-num">${c(a)}</div><div class="ss-gr-of">of ${c(e*n.length)} hours</div></div>
</div>
<div class="ss-gr-tiles">${n.map(r=>`<div class="ss-tile${r.reached?" on":""}">
  <div class="ss-tile-h"><div class="ss-tile-l">${i(r.label)}</div>${r.reached?d("rocket_launch"):""}</div>
  <div class="ss-tile-n">${c(r.hours)}</div>
  <div class="ss-tile-s">${r.reached?`Bonus round \xB7 +${c(r.over)}`:"hours"}</div>
</div>`).join("")}</div>`}function O(s,e=40){if(s.length===0)return"";let t=n=>`<div class="ss-mq-card"><div class="ss-mq-name">${i(n.name)}</div><div class="ss-mq-h"><div class="ss-mq-n">${n.hours.toLocaleString("en-US")}</div><div class="ss-mq-u">hrs</div></div></div>`;return`<div class="ss-mq-track" style="animation-duration:${e}s">${[...s,...s].map(t).join("")}</div>`}var B=new URLSearchParams(location.search),m=B.has("demo"),J=B.has("debug"),F=decodeURIComponent(location.pathname.split("/").filter(Boolean)[1]??""),ss=5*6e4,es=8e3,G=`joc-school-screen:${F}`,ts=Date.now(),o={data:null,etag:"",fetchedAt:null,offline:!1,error:"",slide:0,shout:0,countFrom:0},l=s=>document.querySelector(s);document.getElementById("app").innerHTML=`
<div class="ss-stage">
  <div class="ss-canvas" id="canvas">
    <div class="ss-hdr">
      <div class="ss-logo" id="logo"></div>
      <div class="ss-name"><div class="ss-name-t" id="name"></div><div class="ss-name-s" id="stats"></div></div>
      <div class="ss-ded" id="ded"></div>
      <div class="ss-clock-box"><div class="ss-clock" id="clock"></div><div class="ss-date" id="date"></div><div class="ss-hdate" id="hdate"></div></div>
    </div>
    <div class="ss-mid" id="mid">
      <div class="ss-slides" id="slides"><div id="track"></div><div class="ss-cap" id="cap"></div></div>
      <div class="ss-right">
        <div class="ss-so" id="so">
          <div class="ss-so-content" id="soContent"></div>
          <div class="ss-so-qr" id="soQr"><div class="ss-so-qr-l">Scan to share yours</div><div class="ss-so-qr-box" id="soQrBox"></div></div>
        </div>
        <div class="ss-gr" id="grades"></div>
      </div>
    </div>
    <div class="ss-band">
      <div class="ss-band-logo"><img src="/brand/joc-wordmark.png" alt="Just One Chesed" /></div>
      <div class="ss-sect" id="themeSect">
        <div class="ss-sect-ic"><span class="ss-ms">menu_book</span></div>
        <div class="ss-sect-txt"><div class="ss-k" id="schoolsLearning"></div><div class="ss-theme" id="theme"></div><div class="ss-theme-he" dir="rtl" id="themeHe"></div></div>
      </div>
      <div class="ss-around" id="around"><div class="ss-k" id="aroundK"></div><div class="ss-mq" id="mq"></div></div>
      <div class="ss-world" id="world"><span class="ss-ms">public</span><div><div class="ss-world-n" id="worldN"></div><div class="ss-world-l">hours of chesed worldwide</div></div></div>
    </div>
  </div>
</div>
<div class="ss-offline ss-hide" id="offline"></div>
${J?'<div class="ss-debug" id="debug"></div>':""}`;var S=0;function u(){let s=document.documentElement,e=s.clientWidth||window.innerWidth,t=s.clientHeight||window.innerHeight;if(!e||!t)return;let n=Math.min(e/1920,t/1080);n>0&&n!==S&&(S=n,l("#canvas").style.transform=`scale(${n})`)}window.addEventListener("resize",u);window.addEventListener("load",u);u();var is=window.setInterval(u,1e3);window.setTimeout(()=>window.clearInterval(is),12e3);var f={};function p(s,e){f[s]!==e&&(f[s]=e,l(`#${s}`).innerHTML=e)}function g(s,e){l(`#${s}`).classList.toggle("ss-hide",!e)}function z(s){let e=o.countFrom?Math.min(1,(Date.now()-o.countFrom)/2e3):1;return Math.round(s*(1-Math.pow(1-e,3))).toLocaleString("en-US")}function ns(s){let e=s.photos.map(n=>({kind:"photo",html:A(n),caption:n.caption||"Chesed in action"})),t=0;for(let n of s.flyers)e.push({kind:"flyer",html:j(n,s.school.short,n.template==="PROGRAM"?t++:0)});return e}function W(){let s=new Date;l("#clock").textContent=s.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}),l("#date").textContent=s.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});let e="";try{e=new Intl.DateTimeFormat("en-u-ca-hebrew",{day:"numeric",month:"long",year:"numeric"}).format(s)}catch{}l("#hdate").textContent=e}function Q(s){let e=[];s.stats.acts!=null&&e.push(`${z(s.stats.acts)} acts of chesed`),s.stats.hours!=null&&e.push(`${z(s.stats.hours)} hours this year`),l("#stats").textContent=e.join(" \xB7 "),g("world",s.worldHours!=null),s.worldHours!=null&&(l("#worldN").textContent=z(s.worldHours))}function b(){var D,E;let s=o.data;if(W(),!s)return;let e=s.school.short;p("logo",s.school.logoUrl?`<img src="${i(s.school.logoUrl)}" alt="${i(e)} logo" />`:`<div class="ss-logo-l">${i(e.slice(0,2).toUpperCase())}</div>`),p("name",`${i(e)} <span>Chesed</span>`),Q(s),g("ded",!!s.dedication),s.dedication&&p("ded",`<div class="ss-ded-t">Today\u2019s chesed is dedicated to a refuah shleima for <span class="ss-ded-he" dir="rtl">${i(s.dedication.hebrewName)}</span></div>
<div class="ss-ded-s">${i(s.dedication.text||"Sponsor a day \xB7 dedications@justonechesed.org")}</div>`);let t=ns(s),n=t.map(h=>h.html).join("");f.track!==n&&(f.track=n,l("#track").innerHTML=t.map((h,v)=>`<div class="ss-slide" data-i="${v}">${h.html}</div>`).join("")),g("slides",t.length>0),l("#mid").classList.toggle("ss-solo",t.length===0);let a=t.length?o.slide%t.length:0;document.querySelectorAll("#track .ss-slide").forEach((h,v)=>h.classList.toggle("on",v===a));let c=s.photos.length,r=((D=t[a])==null?void 0:D.kind)==="photo";l("#cap").classList.toggle("on",r),r&&p("cap",H(e,t[a].caption??"",a,c));let x=((E=s.theme)==null?void 0:E.topic)??null;if(s.shoutOuts.length?p("soContent",I(s.shoutOuts[o.shout%s.shoutOuts.length],x)):p("soContent",U(x)),g("soQr",!!s.shoutOutQrSvg),p("soQrBox",s.shoutOutQrSvg??""),g("grades",!!(s.grades&&s.grades.rows.length)),s.grades&&s.grades.rows.length){let h=new Date().toLocaleDateString("en-US",{month:"long"});p("grades",R(h,s.grades.goal,s.grades.rows))}g("themeSect",!!s.theme),s.theme&&(l("#schoolsLearning").textContent=s.networkSchools>1?`${s.networkSchools} schools learning`:"This cycle",l("#theme").textContent=s.theme.en,l("#themeHe").textContent=s.theme.he??""),g("around",s.network.length>0),s.network.length&&(l("#aroundK").textContent="Around JOC schools \xB7 this year",p("mq",O(s.network,Math.max(30,s.network.length*7)))),os()}function os(){var e;if(!J)return;let s=o.fetchedAt?Math.round((Date.now()-o.fetchedAt.getTime())/1e3):null;l("#debug").textContent=[`school: ${F}${m?" (demo)":""}`,`data: ${s===null?"none yet":`${s}s old`} \xB7 version ${((e=o.data)==null?void 0:e.version)??"-"}`,`scale: ${S.toFixed(3)} \xB7 slide ${o.slide}`,o.error?`last error: ${o.error}`:""].filter(Boolean).join(`
`)}function as(){try{let s=localStorage.getItem(G);return s?JSON.parse(s):null}catch{return null}}function rs(){try{localStorage.setItem(G,JSON.stringify({data:o.data,etag:o.etag}))}catch{}}async function T(){try{let s=`/api/school-screen/${encodeURIComponent(F)}${m?"?demo=1":""}`,e=await fetch(s,{cache:"no-store",headers:o.etag&&o.data?{"if-none-match":o.etag}:{}});if(e.status===304)o.fetchedAt=new Date;else if(e.ok){let t=!o.data;o.data=await e.json(),o.etag=e.headers.get("etag")??"",o.fetchedAt=new Date,t&&(o.countFrom=Date.now(),requestAnimationFrame(V)),m||rs()}else throw new Error(`HTTP ${e.status}`);o.offline=!1,o.error=""}catch(s){o.offline=!0,o.error=s instanceof Error?s.message:String(s)}g("offline",o.offline),b()}var _=y(new Date);function ls(){Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jerusalem",hour:"numeric",hourCycle:"h23"}).format(new Date))===3&&Date.now()-ts>60*6e4&&location.reload();let e=y(new Date);e!==_&&(_=e,T())}if(!m){let s=as();s!=null&&s.data&&(o.data=s.data,o.etag=s.etag)}b();T();window.setInterval(T,ss);window.setInterval(()=>{o.slide+=1,o.slide%2===0&&(o.shout+=1),b()},es);window.setInterval(W,15e3);window.setInterval(ls,6e4);function V(){o.data&&(Q(o.data),Date.now()-o.countFrom<2100&&requestAnimationFrame(V))}var P;(P=document.fonts)==null||P.ready.then(()=>{for(let s of Object.keys(f))delete f[s];b()});})();
