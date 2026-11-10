(() => {
  const c = window.SCHOOL_CONFIG || {};
  const ready = c.supabaseUrl && c.supabaseAnonKey && !c.supabaseUrl.includes("YOUR_") && !c.supabaseAnonKey.includes("YOUR_");
  const client = ready && window.supabase ? window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey) : null;
  const $ = id => document.getElementById(id);
  const loginPanel=$("loginPanel"), dashboard=$("dashboard"), loginStatus=$("loginStatus"), status=$("dashboardStatus");
  const say=(el,msg)=>{el.textContent=msg;};
  if(!client){$("loginBtn").disabled=true;say(loginStatus,"The shared publishing service is not connected. Please check the website configuration.");return;}

  async function refreshSession(){
    const {data:{session}}=await client.auth.getSession();
    loginPanel.classList.toggle("hidden",!!session);dashboard.classList.toggle("hidden",!session);
    if(session) loadMyItems();
  }
  $("loginBtn").addEventListener("click",async()=>{
    $("loginBtn").disabled=true;say(loginStatus,"Signing in…");
    const {error}=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    $("loginBtn").disabled=false;
    if(error){say(loginStatus,error.message);return;}
    await refreshSession();
  });
  $("logoutBtn").addEventListener("click",async()=>{await client.auth.signOut();await refreshSession();});

  async function uploadImage(file){
    if(!file)return null;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Choose a JPG, PNG or WEBP image.");
    if(file.size>5*1024*1024)throw new Error("Image must be 5 MB or smaller.");
    const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
    const path=Date.now()+"-"+crypto.randomUUID()+"-"+safeName;
    const {error}=await client.storage.from("school-media").upload(path,file,{upsert:false});
    if(error)throw error;
    return {path,url:client.storage.from("school-media").getPublicUrl(path).data.publicUrl};
  }

  $("galleryForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;say(status,"Uploading photograph…");
    let uploaded=null;
    try{
      uploaded=await uploadImage($("galleryImage").files[0]);
      const {error}=await client.from("school_gallery").insert({
        title:$("galleryTitle").value.trim(),
        caption:$("galleryCaption").value.trim(),
        image_url:uploaded.url,
        storage_path:uploaded.path,
        published:$("galleryPublish").checked
      });
      if(error)throw error;
      $("galleryForm").reset();$("galleryPublish").checked=true;
      say(status,"Photograph uploaded successfully. It will appear in the public gallery if published.");
      loadMyItems();
    }catch(err){
      if(uploaded?.path) await client.storage.from("school-media").remove([uploaded.path]);
      say(status,"Could not upload photograph: "+err.message);
    }finally{btn.disabled=false;}
  });

  $("newsForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;say(status,"Saving news…");
    try{
      const uploaded=await uploadImage($("newsImage").files[0]);
      const {error}=await client.from("school_news").insert({title:$("newsTitle").value.trim(),body:$("newsBody").value.trim(),image_url:uploaded?.url || null,published:$("newsPublish").checked});
      if(error)throw error;
      $("newsForm").reset();$("newsPublish").checked=true;say(status,"News saved successfully.");loadMyItems();
    }catch(err){say(status,"Could not save news: "+err.message);}finally{btn.disabled=false;}
  });

  $("eventForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;say(status,"Saving programme…");
    try{
      const {error}=await client.from("school_events").insert({title:$("eventTitle").value.trim(),description:$("eventDescription").value.trim(),event_date:$("eventDate").value,venue:$("eventVenue").value.trim(),published:$("eventPublish").checked});
      if(error)throw error;
      $("eventForm").reset();$("eventPublish").checked=true;say(status,"Programme saved successfully.");loadMyItems();
    }catch(err){say(status,"Could not save programme: "+err.message);}finally{btn.disabled=false;}
  });

  async function loadMyItems(){
    const [n,e,g]=await Promise.all([
      client.from("school_news").select("id,title,published,created_at").order("created_at",{ascending:false}).limit(20),
      client.from("school_events").select("id,title,published,event_date").order("event_date",{ascending:true}).limit(20),
      client.from("school_gallery").select("id,title,published,storage_path,created_at").order("created_at",{ascending:false}).limit(30)
    ]);
    const list=$("myItems");
    if(n.error||e.error||g.error){list.textContent="Unable to load content list. Check that gallery-setup.sql has been run in Supabase.";return;}
    const rows=[
      ...(n.data||[]).map(x=>({...x,kind:"News"})),
      ...(e.data||[]).map(x=>({...x,kind:"Programme"})),
      ...(g.data||[]).map(x=>({...x,kind:"Gallery photograph"}))
    ];
    list.innerHTML="<h2>Recent website content</h2>"+(rows.length?rows.map(x=>`<div class="admin-item"><span><strong>${escapeHtml(x.kind)}:</strong> ${escapeHtml(x.title)} <small>· ${x.published?"Published":"Draft"}</small></span><button data-id="${x.id}" data-kind="${x.kind}" data-path="${escapeHtml(x.storage_path||"")}">Delete</button></div>`).join(""):"<p>No content has been added yet.</p>");
    list.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>removeItem(b.dataset.kind,b.dataset.id,b.dataset.path)));
  }
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function removeItem(kind,id,path){
    if(!confirm("Delete this item from the school website?"))return;
    const table=kind==="News"?"school_news":kind==="Programme"?"school_events":"school_gallery";
    const {error}=await client.from(table).delete().eq("id",id);
    if(error){say(status,"Could not delete item: "+error.message);return;}
    if(kind==="Gallery photograph"&&path){
      const {error:storageError}=await client.storage.from("school-media").remove([path]);
      if(storageError)say(status,"Gallery record deleted, but its stored image could not be removed: "+storageError.message);
      else say(status,"Gallery photograph deleted.");
    }else say(status,"Item deleted.");
    loadMyItems();
  }
  client.auth.onAuthStateChange(()=>refreshSession());
  refreshSession();
})();