
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?f:v;}catch(e){return f;}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
const when=iso=>{const d=new Date(iso);return isNaN(d)?'':d.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});};
const LIMITS={essential:{revision:1,remake:0},signature:{revision:3,remake:3},concierge:{revision:3,remake:3}};
const PKG_NAME={essential:'Essential',signature:'Signature',concierge:'Concierge'};
const KEY='oncesung:requests';
let type='revision';

/* profile in sidebar */
(function(){const p=get('oncesung:profile',{}),n=(p.name||'').trim();const nm=$('[data-acct-name]'),em=$('[data-acct-email]'),ini=$('[data-acct-initial]');if(nm)nm.textContent=n||'Your account';if(em)em.textContent=p.email||'Saved on this device';if(ini)ini.textContent=n?n[0].toUpperCase():'?';})();

/* songs from saved briefs */
function songs(){const l=get('oncesung:briefs',[]);return (Array.isArray(l)?l:[]).filter(x=>x&&x.id&&x.brief&&x.brief.answers).map(x=>{const a=x.brief.answers;return {id:x.id,title:a.song_title?'“'+a.song_title+'”':(a.recipient?'A song for '+a.recipient:(a.service||'Your song')),sub:a.occasion||''};});}
const sel=$('#rq-song');
function fillSongs(){const s=songs();sel.innerHTML=(s.length?'':'<option value="">Choose a song…</option>')+s.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.title+(x.sub?' · '+x.sub:''))+'</option>').join('')+'<option value="__order">Another order (enter order number)</option>';if(!s.length)sel.value='__order';}
fillSongs();
try{const pk=JSON.parse(sessionStorage.getItem('oncesung:package'));if(LIMITS[pk])$('#rq-package').value=pk;}catch(e){}
if(!LIMITS[$('#rq-package').value])$('#rq-package').value='signature';

function songRef(){if(sel.value==='__order'){const o=$('#rq-order').value.trim();return o?{id:'order:'+o.toUpperCase(),title:'Order '+o.toUpperCase()}:null;}const s=songs().find(x=>x.id===sel.value);return s?{id:s.id,title:s.title}:null;}
function used(songId,t){return get(KEY,[]).filter(r=>r&&r.song&&r.song.id===songId&&r.type===t).length;}

function updateAllow(){
  $('#rq-order-wrap').hidden=sel.value!=='__order';
  const pk=$('#rq-package').value,L=LIMITS[pk],ref=songRef(),note=$('#rq-allow-note');
  const uR=ref?used(ref.id,'revision'):0,uM=ref?used(ref.id,'remake'):0;
  $('#rq-allow').innerHTML='<span class="pill">Minor revisions: <b>'+Math.max(0,L.revision-uR)+' of '+L.revision+' left</b></span><span class="pill">Remakes: <b>'+Math.max(0,L.remake-uM)+' of '+L.remake+' left</b></span>';
  let msg='';
  if(type==='remake'&&L.remake===0)msg='Remakes aren’t included in the Essential package. You can still ask for a minor revision.';
  else if(type==='remake'&&uM>=L.remake)msg='You’ve used all the remakes included in your package for this song. Send a minor revision, or write to us in the conversation below.';
  else if(type==='revision'&&uR>=L.revision)msg='You’ve used all the minor revisions included in your package for this song. You can still reply in the conversation below.';
  note.hidden=!msg;note.textContent=msg;$('#rq-submit').disabled=!!msg;
}
function setType(t){type=t;$$('.rq-tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.type===t)));$$('[data-for]').forEach(d=>d.hidden=d.dataset.for!==t);$('#rq-err').innerHTML='';updateAllow();}
$$('.rq-tab').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.type)));
sel.addEventListener('change',updateAllow);$('#rq-package').addEventListener('change',updateAllow);$('#rq-order').addEventListener('input',updateAllow);
const qp=new URLSearchParams(location.search).get('type');setType(qp==='remake'?'remake':'revision');

const checks=name=>$$('[data-checks="'+name+'"] input:checked').map(i=>i.value);
$('#rq-form').addEventListener('submit',e=>{e.preventDefault();$$('.field-err').forEach(x=>x.classList.remove('field-err'));
  const errs=[],ref=songRef();
  if(!ref){errs.push(sel.value==='__order'?['#rq-order','Enter your order number.']:['#rq-song','Choose the song this request is about.']);}
  const main=type==='revision'?'#rv-details':'#rm-direction';
  if(!$(main).value.trim())errs.push([main,type==='revision'?'Tell us what to change.':'Describe the new version you’d like.']);
  if(errs.length){$('#rq-err').innerHTML='<div class="err-msg" role="alert">'+errs.map(x=>esc(x[1])).join('<br>')+'</div>';errs.forEach(x=>$(x[0]).classList.add('field-err'));$(errs[0][0]).focus();return;}
  const pk=$('#rq-package').value,f={};
  if(type==='revision'){f['What to change']=$('#rv-details').value.trim();const p=checks('rv-parts');if(p.length)f['Parts']=p.join(', ');if($('#rv-times').value.trim())f['Timestamps']=$('#rv-times').value.trim();if($('#rv-keep').value.trim())f['Keep as it is']=$('#rv-keep').value.trim();}
  else{f['New direction']=$('#rm-direction').value.trim();const c=checks('rm-change');if(c.length)f['Change']=c.join(', ');if($('#rm-keep').value.trim())f['Keep']=$('#rm-keep').value.trim();if($('#rm-ref').value.trim())f['Reference']=$('#rm-ref').value.trim();}
  const n=used(ref.id,type)+1;
  const r={id:'r'+Date.now().toString(36),type,song:ref,package:pk,number:n,created:new Date().toISOString(),status:'Sent',fields:f,messages:[]};
  const list=get(KEY,[]);list.unshift(r);
  if(!set(KEY,list)){$('#rq-err').innerHTML='<div class="err-msg" role="alert">This browser could not save your request. Please try again or contact support.</div>';return;}
  e.target.reset();$('#rq-package').value=pk;fillSongs();if(songs().some(s=>s.id===ref.id))sel.value=ref.id;
  $$('#rq-form details').forEach(d=>d.open=false);setType(type);render();
  const t=document.getElementById('t-'+r.id);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
});

function thread(r){const L=LIMITS[r.package]||LIMITS.signature,label=r.type==='remake'?'Remake':'Minor revision';
  const rows=Object.entries(r.fields||{}).map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('');
  const msgs=(r.messages||[]).map(m=>'<div class="msg'+(m.from==='you'?' you':'')+'"><span class="meta">'+(m.from==='you'?'You':'Your songwriter')+' · '+esc(when(m.at))+'</span>'+esc(m.text)+'</div>').join('');
  return '<article class="card pad thread" id="t-'+esc(r.id)+'" data-id="'+esc(r.id)+'"><div class="thread-head"><div><h3>'+esc(label)+' '+esc(r.number)+' of '+esc(r.type==='remake'?L.remake:L.revision)+' · '+esc(r.song.title)+'</h3><div class="xs muted" style="margin-top:4px">'+esc(PKG_NAME[r.package]||'')+' package · sent '+esc(when(r.created))+'</div></div><span class="badge">'+esc(r.status||'Sent')+'</span></div>'
   +'<div class="msgs"><div class="msg you"><span class="meta">You · '+esc(when(r.created))+'</span><b>'+esc(label)+' request</b><dl>'+rows+'</dl></div>'+msgs+'</div>'
   +'<form class="reply" data-reply><label class="sr-only" for="reply-'+esc(r.id)+'">Add a message</label><textarea class="textarea" id="reply-'+esc(r.id)+'" maxlength="1500" placeholder="Add a message about this request…"></textarea><button class="btn btn-ghost btn-sm" type="submit">Send</button></form></article>';}
function render(){const l=get(KEY,[]).filter(r=>r&&r.id&&r.song);$('#rq-count').textContent=l.length?l.length+(l.length===1?' request':' requests'):'';
  $('#threads').innerHTML=l.length?l.map(thread).join(''):'<div class="card pad center" style="margin-top:14px"><p class="muted" style="margin:0">No requests yet. When you send a revision or remake request, the conversation appears here.</p></div>';updateAllow();}
$('#threads').addEventListener('submit',e=>{const f=e.target.closest('[data-reply]');if(!f)return;e.preventDefault();const ta=f.querySelector('textarea'),txt=ta.value.trim();if(!txt){ta.focus();return;}
  const id=f.closest('[data-id]').dataset.id,l=get(KEY,[]),r=l.find(x=>x.id===id);if(!r)return;(r.messages=r.messages||[]).push({from:'you',text:txt,at:new Date().toISOString()});set(KEY,l);render();const t=document.getElementById('reply-'+id);if(t)t.focus();});
render();
})();
