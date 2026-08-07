"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {supabase} from "@/lib/supabase";

type Cat={id:string;name:string;group_name:string;sort_order:number};
type Img={id:string;category_id:string;title:string|null;image_url:string;storage_path:string|null;sort_order:number};
const SIZE=6;

function LockIcon({open}:{open:boolean}){
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={open?"M7 10V7a5 5 0 0 1 9.6-1.9":"M7 10V7a5 5 0 0 1 10 0v3"}/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2.8"/></svg>
}
function SunIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>}
function MoonIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/></svg>}
function ImageIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="1.8"/><path d="m5.5 17 4.5-4.5 3.2 3.2 2.1-2.1 3.2 3.4"/></svg>}
function FolderIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z"/></svg>}
function TrashIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>}

export default function CatalogApp(){
 const [cats,setCats]=useState<Cat[]>([]),[imgs,setImgs]=useState<Img[]>([]);
 const [catId,setCatId]=useState(""),[openGroup,setOpenGroup]=useState("");
 const [admin,setAdmin]=useState(false),[login,setLogin]=useState(false),[email,setEmail]=useState(""),[pass,setPass]=useState("");
 const [error,setError]=useState(""),[theme,setTheme]=useState<"dark"|"light">("dark"),[view,setView]=useState<"grid"|"list">("grid");
 const [q,setQ]=useState(""),[page,setPage]=useState(1),[modal,setModal]=useState<number|null>(null),[busy,setBusy]=useState(false);
 const [lockMenu,setLockMenu]=useState(false),[catDialog,setCatDialog]=useState(false),[newCatName,setNewCatName]=useState(""),[newCatGroup,setNewCatGroup]=useState("Özel Günler");
 const lockRef=useRef<HTMLDivElement|null>(null);

 const checkAdmin=useCallback(async()=>{const {data:s}=await supabase.auth.getSession();const u=s.session?.user;if(!u){setAdmin(false);return}const {data}=await supabase.from("admin_users").select("user_id").eq("user_id",u.id).maybeSingle();setAdmin(!!data)},[]);
 const loadCats=useCallback(async()=>{const {data,error}=await supabase.from("categories").select("id,name,group_name,sort_order").eq("is_active",true).order("sort_order");if(error)throw error;const x=data||[];setCats(x);if(!x.length){setCatId("");setOpenGroup("");return}if(!catId||!x.some(c=>c.id===catId)){setCatId(x[0].id);setOpenGroup(x[0].group_name)}},[catId]);
 const loadImgs=useCallback(async()=>{if(!catId){setImgs([]);return}const {data,error}=await supabase.from("images").select("id,category_id,title,image_url,storage_path,sort_order").eq("category_id",catId).eq("is_active",true).order("sort_order").order("created_at",{ascending:false});if(error)throw error;setImgs(data||[])},[catId]);

 useEffect(()=>{setTheme((localStorage.getItem("temas-theme") as any)||"dark");setView((localStorage.getItem("temas-view") as any)||"grid");Promise.all([loadCats(),checkAdmin()]).catch(e=>alert(e.message));const {data:l}=supabase.auth.onAuthStateChange(()=>checkAdmin());return()=>l.subscription.unsubscribe()},[loadCats,checkAdmin]);
 useEffect(()=>{loadImgs().catch(e=>alert(e.message));setPage(1)},[loadImgs]);
 useEffect(()=>{const close=(e:MouseEvent)=>{if(lockRef.current&&!lockRef.current.contains(e.target as Node))setLockMenu(false)};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);

 const groups=useMemo(()=>cats.reduce<Record<string,Cat[]>>((a,c)=>{(a[c.group_name||"Diğer"]??=[]).push(c);return a},{}),[cats]);
 const filtered=useMemo(()=>{const n=q.trim().toLocaleLowerCase("tr-TR");return !n?imgs:imgs.filter(i=>(i.title||"").toLocaleLowerCase("tr-TR").includes(n))},[imgs,q]);
 useEffect(()=>{if(modal===null)return;const h=(e:KeyboardEvent)=>{if(e.key==="Escape")setModal(null);if(e.key==="ArrowLeft")setModal(v=>v===null?null:(v-1+filtered.length)%filtered.length);if(e.key==="ArrowRight")setModal(v=>v===null?null:(v+1)%filtered.length)};document.body.style.overflow="hidden";document.addEventListener("keydown",h);return()=>{document.body.style.overflow="";document.removeEventListener("keydown",h)}},[modal,filtered.length]);

 const active=cats.find(c=>c.id===catId),pages=Math.max(1,Math.ceil(filtered.length/SIZE)),visible=filtered.slice((page-1)*SIZE,page*SIZE);

 async function doLogin(){setError("");setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password:pass});setBusy(false);if(error){setError(error.message);return}await checkAdmin();setLogin(false);setPass("")}
 async function doLogout(){await supabase.auth.signOut();setAdmin(false);setLockMenu(false)}
 async function upload(e:React.ChangeEvent<HTMLInputElement>){if(!admin||!catId)return;const fs=[...(e.target.files||[])];if(!fs.length)return;setBusy(true);try{const {data:u}=await supabase.auth.getUser();for(const f of fs){const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path=`${catId}/${crypto.randomUUID()}-${safe}`;const r=await supabase.storage.from("katalog").upload(path,f,{cacheControl:"3600"});if(r.error)throw r.error;const pub=supabase.storage.from("katalog").getPublicUrl(path).data.publicUrl;const ins=await supabase.from("images").insert({category_id:catId,title:f.name.replace(/\.[^/.]+$/,""),image_url:pub,storage_path:path,file_size:f.size,mime_type:f.type,uploaded_by:u.user?.id||null});if(ins.error)throw ins.error}await loadImgs()}catch(x){alert(x instanceof Error?x.message:"Yükleme başarısız")}finally{setBusy(false);e.target.value=""}}
 async function del(i:Img){if(!admin||!confirm("Bu görsel silinsin mi?"))return;if(i.storage_path){const r=await supabase.storage.from("katalog").remove([i.storage_path]);if(r.error)return alert(r.error.message)}const d=await supabase.from("images").delete().eq("id",i.id);if(d.error)alert(d.error.message);else loadImgs()}
 async function addCat(){if(!admin||!newCatName.trim())return;setBusy(true);const r=await supabase.from("categories").insert({name:newCatName.trim(),group_name:newCatGroup.trim()||"Diğer",sort_order:cats.length*10+10,is_active:true}).select("id,name,group_name,sort_order").single();setBusy(false);if(r.error){alert(r.error.message);return}setCatDialog(false);setNewCatName("");setNewCatGroup("Özel Günler");await loadCats();if(r.data){setCatId(r.data.id);setOpenGroup(r.data.group_name)}}
 async function delCat(c:Cat){if(!admin)return;const ok=confirm(`“${c.name}” kategorisi kaldırılsın mı?\n\nBu işlem kategorideki görselleri silmez.`);if(!ok)return;setBusy(true);const r=await supabase.from("categories").update({is_active:false}).eq("id",c.id);setBusy(false);if(r.error){alert(r.error.message);return}if(catId===c.id)setCatId("");await loadCats()}
 async function downloadPng(i:Img){
  try{
   const r=await fetch(i.image_url,{mode:"cors"});
   if(!r.ok)throw new Error("Görsel alınamadı");
   const blob=await r.blob();
   const bitmap=await createImageBitmap(blob);
   const canvas=document.createElement("canvas");
   canvas.width=bitmap.width;canvas.height=bitmap.height;
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("PNG dönüştürme başlatılamadı");
   ctx.drawImage(bitmap,0,0);bitmap.close();
   const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("PNG oluşturulamadı")),"image/png"));
   const url=URL.createObjectURL(png),a=document.createElement("a");
   const safe=(i.title||"kartpostal").replace(/[\\/:*?"<>|]+/g,"-").trim()||"kartpostal";
   a.href=url;a.download=`${safe}.png`;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(x){alert(x instanceof Error?x.message:"PNG indirme başarısız")}
 }
 function toggleTheme(){const n=theme==="dark"?"light":"dark";setTheme(n);localStorage.setItem("temas-theme",n)}

 return <main className={`app ${theme}`}>
  <aside>
   <div className="brand"><img src="/temas-logo.png" alt="Temaş"/><span>KATALOĞU</span></div>
   <div className="sideTitle"><small>KATEGORİLER</small>{admin&&<div className="addPair" title="Yeni kategori"><span className="passiveIcon"><FolderIcon/></span><button className="plusBtn" onClick={()=>setCatDialog(true)} aria-label="Yeni kategori ekle">+</button></div>}</div>
   {Object.entries(groups).map(([g,list])=><section className={`group ${openGroup===g?"open":""}`} key={g}>
    <button className="groupHead" onClick={()=>setOpenGroup(openGroup===g?"":g)}><span>{g}</span><span className="chev">⌄</span></button>
    <div className="catList">{list.map(c=><div className={`catRow ${catId===c.id?"active":""}`} key={c.id}><button className="catSelect" onClick={()=>setCatId(c.id)}>{c.name}</button>{admin&&<button className="catDelete" onClick={()=>delCat(c)} title="Kategoriyi kaldır" aria-label={`${c.name} kategorisini kaldır`}><TrashIcon/></button>}</div>)}</div>
   </section>)}
  </aside>

  <section className="content">
   <header><div><h1>{active?.name||"Temaş Kataloğu"}</h1><p>Toplam <b>{filtered.length}</b> görsel</p></div>
    <div className="tools">
     <div className="lockWrap" ref={lockRef}><button className={`iconBtn lockBtn ${admin?"unlocked":""}`} onClick={()=>admin?setLockMenu(v=>!v):setLogin(true)} title={admin?"Admin menüsü":"Admin girişi"} aria-label={admin?"Admin menüsü":"Admin girişi"}><LockIcon open={admin}/></button>{admin&&lockMenu&&<div className="lockMenu"><button onClick={doLogout}>Çıkış Yap</button></div>}</div>
     <button className="iconBtn" onClick={toggleTheme} title={theme==="dark"?"Aydınlık mod":"Koyu mod"} aria-label="Tema değiştir">{theme==="dark"?<SunIcon/>:<MoonIcon/>}</button>
     <label className="searchBox"><span>⌕</span><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Ara..."/></label>
     <div className="switch"><button className={view==="grid"?"active":""} onClick={()=>{setView("grid");localStorage.setItem("temas-view","grid")}}>▦</button><button className={view==="list"?"active":""} onClick={()=>{setView("list");localStorage.setItem("temas-view","list")}}>☰</button></div>
     {admin&&<div className="addPair uploadPair" title="Görsel ekle"><span className="passiveIcon"><ImageIcon/></span><label className="plusBtn" aria-label="Görsel ekle">+<input className="fileInput" type="file" accept="image/*" multiple onChange={upload}/></label></div>}
    </div>
   </header>
   {busy&&<p className="busy">İşlem sürüyor…</p>}
   <div className={`gallery ${view}`}>{visible.map((i,idx)=><article key={i.id}><button className="pic" onClick={()=>setModal((page-1)*SIZE+idx)}><img src={i.image_url} alt={i.title||"Katalog görseli"}/></button><footer><span>{i.title||"İsimsiz görsel"}</span><div>{admin&&<button onClick={()=>downloadPng(i)} title="PNG olarak indir" aria-label="PNG olarak indir">⇩</button>}{admin&&<button onClick={()=>del(i)} title="Görseli sil" aria-label="Görseli sil">×</button>}</div></footer></article>)}</div>
   {!visible.length&&<div className="empty">Bu kategoride henüz görsel yok.</div>}
   <nav><button disabled={page===1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length:pages},(_,i)=>i+1).map(n=><button className={page===n?"active":""} onClick={()=>setPage(n)} key={n}>{n}</button>)}<button disabled={page===pages} onClick={()=>setPage(page+1)}>›</button></nav>
  </section>

  {modal!==null&&filtered[modal]&&<div className="modal" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}><button className="close" onClick={()=>setModal(null)}>×</button><button className="prev" onClick={()=>setModal((modal-1+filtered.length)%filtered.length)}>‹</button><img src={filtered[modal].image_url} alt={filtered[modal].title||"Katalog görseli"}/><button className="next" onClick={()=>setModal((modal+1)%filtered.length)}>›</button>{admin&&<button className="mdown" onClick={()=>downloadPng(filtered[modal])}>PNG olarak indir</button>}</div>}

  {login&&<div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setLogin(false)}}><div className="dialog"><h2>Admin Girişi</h2><p className="dialogSub">Yönetim araçlarına erişmek için giriş yapın.</p><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-posta"/><input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doLogin()}} type="password" placeholder="Şifre"/>{error&&<p className="err">{error}</p>}<div><button onClick={()=>setLogin(false)}>İptal</button><button className="primary" disabled={busy} onClick={doLogin}>Giriş Yap</button></div></div></div>}

  {catDialog&&<div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setCatDialog(false)}}><div className="dialog"><h2>Yeni Kategori</h2><p className="dialogSub">Kategori ve bağlı olacağı grup adını belirleyin.</p><input autoFocus value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Kategori adı"/><input value={newCatGroup} onChange={e=>setNewCatGroup(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCat()}} placeholder="Grup adı"/><div><button onClick={()=>setCatDialog(false)}>İptal</button><button className="primary" disabled={busy||!newCatName.trim()} onClick={addCat}>Kategori Ekle</button></div></div></div>}
 </main>
}
