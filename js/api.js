/* طبقة البيانات: Google Apps Script بدل قاعدة بيانات claude.ai */
window.MustahalAPI = (function(){
  const url = () => (window.MUSTAHAL_API||'').trim();
  const auth = { get pin(){ try{return localStorage.getItem('mustahal.pin')||''}catch{return ''} }, set pin(v){ try{localStorage.setItem('mustahal.pin',v)}catch{} },
                 get admin(){ try{return localStorage.getItem('mustahal.admin')||''}catch{return ''} }, set admin(v){ try{localStorage.setItem('mustahal.admin',v)}catch{} } };
  async function getAll(){ const r=await fetch(url(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'all',pin:auth.pin,admin:auth.admin})}); const j=await r.json(); if(!j.ok) throw new Error(j.error||'error'); return j.data; }
  async function getPublic(){ const r=await fetch(url()+'?action=public&t='+Date.now(),{cache:'no-store'}); const j=await r.json(); if(!j.ok) throw new Error(j.error||'error'); return j.boards||[]; }
  async function write(action,col,id,data){ const r=await fetch(url(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,col,id,data,pin:auth.pin,admin:auth.admin})}); const j=await r.json(); if(!j.ok){ const e=new Error(j.error||'error'); e.code=j.error; throw e; } return j; }
  /* نفس شكل db.doc(...).set/update/delete الذي تستخدمه الصفحات */
  const db={ doc(path){ const [col,id]=path.split('/'); return { set:d=>write('set',col,id,d), update:d=>write('update',col,id,d), delete:()=>write('delete',col,id,{}) }; } };
  return { db, auth, getAll, getPublic, configured: ()=>!!url() };
})();
