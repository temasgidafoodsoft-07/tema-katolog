"use client";

import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {supabase} from "@/lib/supabase";

type Cat={id:string;name:string;group_name:string;sort_order:number};
type Img={id:string;category_id:string;title:string|null;image_url:string;storage_path:string|null;sort_order:number};
const SIZE=6;

function Icon({name}:{name:"lock"|"unlock"|"sun"|"moon"|"search"|"grid"|"list"|"image"|"folder"|"plus"|"trash"|"download"|"eye"}){
 const paths:Record<string,React.ReactNode>={
  lock:<><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M12 14v3"/></>,
  unlock:<><path d="M7 10V7a5 5 0 0 1 9.5-2.2"/><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M12 14v3"/></>,
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon:<path d="M20.5 15.2A8.6 8.6 0 0 1 8.8 3.5 8.7 8.7 0 1 0 20.5 15.2Z"/>,
  search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  grid:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
  list:<><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1" fill="currentColor" stroke="none"/></>,
  image:<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2.5-2.5L20 18"/></>,
  folder:<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>,
  plus:<path d="M12 5v14M5 12h14"/>,
  trash:<><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
  download:<><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></>,
  eye:<><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>
 };
 return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function CatalogApp(){
 const [cats,setCats]=useState<Cat[]>([]),[imgs,setImgs]=useState<Img[]>([]);
 const [catId,setCatId]=useState(""),[openGroup,setOpenGroup]=useState("");
 const [admin,setAdmin]=useState(false),[login,setLogin]=useState(false),[adminMenu,setAdminMenu]=useState(false),[email,setEmail]=useState(""),[pass,setPass]=useState("");
 const [error,setError]=useState(""),[theme,setTheme]=useState<"dark"|"light">("dark"),[view,setView]=useState<"grid"|"list">("grid");
 const [q,setQ]=useState(""),[page,setPage]=useState(1),[modal,setModal]=useState<number|null>(null),[busy,setBusy]=useState(false);
 const [catDialog,setCatDialog]=useState(false),[newCatName,setNewCatName]=useState(""),[newCatGroup,setNewCatGroup]=useState("Özel Günler");
 const [deleteCatTarget,setDeleteCatTarget]=useState<Cat|null>(null),[deleteImgTarget,setDeleteImgTarget]=useState<Img|null>(null);
 const fileRef=useRef<HTMLInputElement>(null);

 const checkAdmin=useCallback(async()=>{const {data:s}=await supabase.auth.getSession();const u=s.session?.user;if(!u){setAdmin(false);return}const {data}=await supabase.from("admin_users").select("user_id").eq("user_id",u.id).maybeSingle();setAdmin(!!data)},[]);
 const loadCats=useCallback(async()=>{const {data,error}=await supabase.from("categories").select("id,name,group_name,sort_order").eq("is_active",true).order("sort_order");if(error)throw error;const x=(data||[]) as Cat[];setCats(x);setCatId(prev=>prev&&x.some(c=>c.id===prev)?prev:(x[0]?.id||""));setOpenGroup(prev=>prev||(x[0]?.group_name||""))},[]);
 const loadImgs=useCallback(async()=>{if(!catId){setImgs([]);return}const {data,error}=await supabase.from("images").select("id,category_id,title,image_url,storage_path,sort_order").eq("category_id",catId).eq("is_active",true).order("sort_order").order("created_at",{ascending:false});if(error)throw error;setImgs((data||[]) as Img[])},[catId]);

 useEffect(()=>{setTheme((localStorage.getItem("temas-theme") as "dark"|"light")||"dark");setView((localStorage.getItem("temas-view") as "grid"|"list")||"grid");Promise.all([loadCats(),checkAdmin()]).catch(e=>alert(e.message));const {data:l}=supabase.auth.onAuthStateChange(()=>checkAdmin());return()=>l.subscription.unsubscribe()},[loadCats,checkAdmin]);
 useEffect(()=>{loadImgs().catch(e=>alert(e.message));setPage(1)},[loadImgs]);

 const groups=useMemo(()=>cats.reduce<Record<string,Cat[]>>((a,c)=>{(a[c.group_name||"Diğer"]??=[]).push(c);return a},{}),[cats]);
 const filtered=useMemo(()=>{const n=q.trim().toLocaleLowerCase("tr-TR");return !n?imgs:imgs.filter(i=>(i.title||"").toLocaleLowerCase("tr-TR").includes(n))},[imgs,q]);
 useEffect(()=>{if(modal===null)return;const h=(e:KeyboardEvent)=>{if(e.key==="Escape")setModal(null);if(e.key==="ArrowLeft")setModal(v=>v===null?null:(v-1+filtered.length)%filtered.length);if(e.key==="ArrowRight")setModal(v=>v===null?null:(v+1)%filtered.length)};document.body.style.overflow="hidden";document.addEventListener("keydown",h);return()=>{document.body.style.overflow="";document.removeEventListener("keydown",h)}},[modal,filtered.length]);

 const active=cats.find(c=>c.id===catId),pages=Math.max(1,Math.ceil(filtered.length/SIZE)),visible=filtered.slice((page-1)*SIZE,page*SIZE);

 async function doLogin(){setError("");setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password:pass});setBusy(false);if(error){setError(error.message);return}await checkAdmin();setLogin(false);setAdminMenu(false);setPass("")}
 async function doLogout(){await supabase.auth.signOut();setAdmin(false);setAdminMenu(false)}
 async function upload(e:React.ChangeEvent<HTMLInputElement>){if(!admin||!catId)return;const fs=[...(e.target.files||[])];if(!fs.length)return;setBusy(true);try{const {data:u}=await supabase.auth.getUser();for(const f of fs){const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path=`${catId}/${crypto.randomUUID()}-${safe}`;const r=await supabase.storage.from("katalog").upload(path,f,{cacheControl:"3600"});if(r.error)throw r.error;const pub=supabase.storage.from("katalog").getPublicUrl(path).data.publicUrl;const ins=await supabase.from("images").insert({category_id:catId,title:f.name.replace(/\.[^/.]+$/,""),image_url:pub,storage_path:path,file_size:f.size,mime_type:f.type,uploaded_by:u.user?.id||null});if(ins.error)throw ins.error}await loadImgs()}catch(x){alert(x instanceof Error?x.message:"Yükleme başarısız")}finally{setBusy(false);e.target.value=""}}
 async function confirmDeleteImg(){const i=deleteImgTarget;if(!admin||!i)return;setBusy(true);try{if(i.storage_path){const r=await supabase.storage.from("katalog").remove([i.storage_path]);if(r.error)throw r.error}const d=await supabase.from("images").delete().eq("id",i.id);if(d.error)throw d.error;setDeleteImgTarget(null);await loadImgs()}catch(x){alert(x instanceof Error?x.message:"Silme başarısız")}finally{setBusy(false)}}
 async function addCat(){if(!admin||!newCatName.trim())return;setBusy(true);try{const r=await supabase.from("categories").insert({name:newCatName.trim(),group_name:newCatGroup.trim()||"Diğer",sort_order:cats.length*10+10,is_active:true});if(r.error)throw r.error;setCatDialog(false);setNewCatName("");await loadCats()}catch(x){alert(x instanceof Error?x.message:"Kategori eklenemedi")}finally{setBusy(false)}}
 async function removeCat(){const c=deleteCatTarget;if(!admin||!c)return;setBusy(true);try{const r=await supabase.from("categories").update({is_active:false}).eq("id",c.id);if(r.error)throw r.error;setDeleteCatTarget(null);if(catId===c.id){const next=cats.find(x=>x.id!==c.id);setCatId(next?.id||"");setOpenGroup(next?.group_name||"")}await loadCats()}catch(x){alert(x instanceof Error?x.message:"Kategori kaldırılamadı")}finally{setBusy(false)}}
 function download(i:Img){const a=document.createElement("a");a.href=i.image_url;a.download=i.title||"kartpostal";a.target="_blank";document.body.appendChild(a);a.click();a.remove()}
 function setThemeAndSave(){const n=theme==="dark"?"light":"dark";setTheme(n);localStorage.setItem("temas-theme",n)}
 function setViewAndSave(v:"grid"|"list"){setView(v);localStorage.setItem("temas-view",v)}

 return <main className={`app ${theme}`}>
  <aside>
   <div className="brand"><div className="brand-mark"><img src="/temas-logo.png" alt="Temaş"/></div><span>KATALOĞU</span></div>
   <div className="side-title"><small>KATEGORİLER</small>{admin&&<div className="side-actions"><span className="static-icon" title="Kategori"><Icon name="folder"/></span><button className="mini-plus" onClick={()=>setCatDialog(true)} aria-label="Kategori ekle" title="Kategori ekle"><Icon name="plus"/></button></div>}</div>
   {Object.entries(groups).map(([g,list])=><section className={`group ${openGroup===g?"open":""}`} key={g}>
    <button className="group-head" onClick={()=>setOpenGroup(openGroup===g?"":g)}><span>{g}</span><span className="chev">⌄</span></button>
    <div className="group-body">{list.map(c=><div className={`cat-row ${catId===c.id?"active":""}`} key={c.id}><button className="cat-select" onClick={()=>setCatId(c.id)}>{c.name}</button>{admin&&<button className="cat-delete" onClick={()=>setDeleteCatTarget(c)} aria-label={`${c.name} kategorisini kaldır`} title="Kategoriyi kaldır"><Icon name="trash"/></button>}</div>)}</div>
   </section>)}
  </aside>

  <section className="content">
   <header>
    <div className="heading"><h1>{active?.name||"Temaş Kataloğu"}</h1><p>Toplam <b>{filtered.length}</b> görsel</p></div>
    <div className="tools">
     <div className="admin-lock-wrap"><button className={`icon-btn lock-btn ${admin?"unlocked":"locked"}`} aria-label={admin?"Admin menüsünü aç":"Admin girişi"} title={admin?"Admin modu":"Admin girişi"} onClick={()=>{if(admin)setAdminMenu(v=>!v);else setLogin(true)}}><Icon name={admin?"unlock":"lock"}/></button>{admin&&adminMenu&&<div className="admin-popover"><button onClick={doLogout}>Çıkış Yap</button></div>}</div>
     <button className="icon-btn" onClick={setThemeAndSave} aria-label="Temayı değiştir" title="Temayı değiştir"><Icon name={theme==="dark"?"sun":"moon"}/></button>
     <label className="search-box"><Icon name="search"/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Ara..."/></label>
     <div className="switch"><button className={view==="grid"?"active":""} onClick={()=>setViewAndSave("grid")} aria-label="Izgara görünümü"><Icon name="grid"/></button><button className={view==="list"?"active":""} onClick={()=>setViewAndSave("list")} aria-label="Liste görünümü"><Icon name="list"/></button></div>
     {admin&&<div className="asset-add"><span className="static-icon asset-icon" title="Görsel"><Icon name="image"/></span><button className="mini-plus asset-plus" onClick={()=>fileRef.current?.click()} aria-label="Görsel ekle" title="Görsel ekle"><Icon name="plus"/></button><input ref={fileRef} className="hidden-file" type="file" accept="image/*" multiple onChange={upload}/></div>}
    </div>
   </header>
   {busy&&<div className="busy">İşlem sürüyor…</div>}

   <div className={`gallery ${view}`}>{visible.map((i,idx)=><article key={i.id}><button className="pic" onClick={()=>setModal((page-1)*SIZE+idx)}><img src={i.image_url} alt={i.title||"Katalog görseli"}/></button><footer><span>{i.title||"İsimsiz görsel"}</span><div>{admin&&<button onClick={()=>download(i)} title="İndir"><Icon name="download"/></button>}<button onClick={()=>setModal((page-1)*SIZE+idx)} title="Görüntüle"><Icon name="eye"/></button>{admin&&<button onClick={()=>setDeleteImgTarget(i)} title="Sil"><Icon name="trash"/></button>}</div></footer></article>)}</div>
   {!visible.length&&<div className="empty">Bu kategoride henüz görsel yok.</div>}
   <nav><button disabled={page===1} onClick={()=>setPage(page-1)}>‹</button>{Array.from({length:pages},(_,i)=>i+1).map(n=><button className={page===n?"active":""} onClick={()=>setPage(n)} key={n}>{n}</button>)}<button disabled={page===pages} onClick={()=>setPage(page+1)}>›</button></nav>
  </section>

  {modal!==null&&filtered[modal]&&<div className="modal" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}><button className="close" onClick={()=>setModal(null)}>×</button><button className="prev" onClick={()=>setModal((modal-1+filtered.length)%filtered.length)}>‹</button><img src={filtered[modal].image_url} alt={filtered[modal].title||"Katalog görseli"}/><button className="next" onClick={()=>setModal((modal+1)%filtered.length)}>›</button>{admin&&<button className="mdown" onClick={()=>download(filtered[modal])}>Görseli indir</button>}</div>}

  {login&&<div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setLogin(false)}}><div className="dialog"><h2>Admin Girişi</h2><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-posta"/><input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doLogin()}} type="password" placeholder="Şifre"/>{error&&<p className="err">{error}</p>}<div className="dialog-actions"><button onClick={()=>setLogin(false)}>İptal</button><button className="primary" disabled={busy} onClick={doLogin}>Giriş Yap</button></div></div></div>}

  {catDialog&&<div className="backdrop" onClick={e=>{if(e.target===e.currentTarget)setCatDialog(false)}}><div className="dialog"><h2>Yeni Kategori</h2><label className="field-label">Kategori adı</label><input autoFocus value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="Örn. 30 Ağustos"/><label className="field-label">Grup</label><input value={newCatGroup} onChange={e=>setNewCatGroup(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCat()}} placeholder="Örn. Millî Bayramlar"/><div className="dialog-actions"><button onClick={()=>setCatDialog(false)}>İptal</button><button className="primary" disabled={busy||!newCatName.trim()} onClick={addCat}>Kategori Ekle</button></div></div></div>}

  {deleteCatTarget&&<div className="backdrop"><div className="dialog confirm-dialog"><div className="confirm-icon"><Icon name="trash"/></div><h2>Kategori kaldırılsın mı?</h2><p><b>{deleteCatTarget.name}</b> katalogdan kaldırılacak. Görseller silinmeyecek.</p><div className="dialog-actions"><button onClick={()=>setDeleteCatTarget(null)}>Vazgeç</button><button className="danger" disabled={busy} onClick={removeCat}>Kaldır</button></div></div></div>}

  {deleteImgTarget&&<div className="backdrop"><div className="dialog confirm-dialog"><div className="confirm-icon"><Icon name="trash"/></div><h2>Görsel silinsin mi?</h2><p>Bu işlem görseli katalogdan ve depolamadan kaldırır.</p><div className="dialog-actions"><button onClick={()=>setDeleteImgTarget(null)}>Vazgeç</button><button className="danger" disabled={busy} onClick={confirmDeleteImg}>Sil</button></div></div></div>}
 </main>
}
