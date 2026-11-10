(() => {
  const c = window.SCHOOL_CONFIG || {};
  const ready = c.supabaseUrl && c.supabaseAnonKey && !c.supabaseUrl.includes("YOUR_") && !c.supabaseAnonKey.includes("YOUR_");
  const client = ready && window.supabase ? window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey) : null;
  const $ = id => document.getElementById(id);
  const loginPanel=$("loginPanel"), dashboard=$("dashboard"), loginStatus=$("loginStatus"), status=$("dashboardStatus");
  const say=(el,msg)=>{el.textContent=msg;};
  if(!client){$("loginBtn").disabled=true;say(loginStatus,"The shared publishing service is not connected yet. Follow README.md to configure Supabase, then reload this page.");return;}

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
    if(!file.type.startsWith("image/"))throw new Error("Please choose an image file.");
    if(file.size>5*1024*1024)throw new Error("Image must be 5 MB or smaller.");
    const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
    const path=Date.now()+"-"+crypto.randomUUID()+"-"+safeName;
    const {error}=await client.storage.from("school-media").upload(path,file,{upsert:false});
    if(error)throw error;
    return client.storage.from("school-media").getPublicUrl(path).data.publicUrl;
  }
  $("newsForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;say(status,"Saving news…");
    try{
      const image_url=await uploadImage($("newsImage").files[0]);
      const {error}=await client.from("school_news").insert({title:$("newsTitle").value.trim(),body:$("newsBody").value.trim(),image_url,published:$("newsPublish").checked});
      if(error)throw error;$("newsForm").reset();$("newsPublish").checked=true;say(status,"News saved successfully.");loadMyItems();
    }catch(err){say(status,"Could not save news: "+err.message);}finally{btn.disabled=false;}
  });
  $("eventForm").addEventListener("submit",async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;say(status,"Saving programme…");
    try{
      const {error}=await client.from("school_events").insert({title:$("eventTitle").value.trim(),description:$("eventDescription").value.trim(),event_date:$("eventDate").value,venue:$("eventVenue").value.trim(),published:$("eventPublish").checked});
      if(error)throw error;$("eventForm").reset();$("eventPublish").checked=true;say(status,"Programme saved successfully.");loadMyItems();
    }catch(err){say(status,"Could not save programme: "+err.message);}finally{btn.disabled=false;}
  });
  async function loadMyItems(){
    const [n,e]=await Promise.all([client.from("school_news").select("id,title,published,created_at").order("created_at",{ascending:false}).limit(20),client.from("school_events").select("id,title,published,event_date").order("event_date",{ascending:true}).limit(20)]);
    const list=$("myItems");
    if(n.error||e.error){list.textContent="Unable to load your content list.";return;}
    list.innerHTML="<h2>Recent news and programmes</h2>"+[...(n.data||[]).map(x=>({...x,kind:"News"})),...(e.data||[]).map(x=>({...x,kind:"Programme"}))].map(x=>`<div class="admin-item"><span><strong>${escapeHtml(x.kind)}:</strong> ${escapeHtml(x.title)} <small>· ${x.published?"Published":"Draft"}</small></span><button data-id="${x.id}" data-kind="${x.kind}">Delete</button></div>`).join("");
    list.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>removeItem(b.dataset.kind,b.dataset.id)));
  }
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function removeItem(kind,id){
    if(!confirm("Delete this item from the school website?"))return;
    const table=kind==="News"?"school_news":"school_events";
    const {error}=await client.from(table).delete().eq("id",id);
    if(error)say(status,"Could not delete item: "+error.message);else{say(status,"Item deleted.");loadMyItems();}
  }
  client.auth.onAuthStateChange(()=>refreshSession());
  refreshSession();
})();