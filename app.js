(() => {
  const config = window.SCHOOL_CONFIG || {};
  const configured = config.supabaseUrl && config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_") && !config.supabaseAnonKey.includes("YOUR_");
  const db = configured && window.supabase ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const newsEl = document.getElementById("newsList");
  const eventsEl = document.getElementById("eventsList");
  document.getElementById("year").textContent = new Date().getFullYear();

  const menuButton = document.getElementById("menuToggle");
  const menu = document.getElementById("mainNav");
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "×" : "☰";
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateText = value => value ? new Date(value + (String(value).length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-GH",{day:"numeric",month:"short",year:"numeric"}) : "Date to be announced";

  async function loadContent() {
    if (!db) {
      newsEl.innerHTML = '<div class="empty-state">School news will appear here when the website is connected to its shared publishing database.</div>';
      eventsEl.innerHTML = '<div class="empty-state dark-empty">Upcoming programmes and events will appear here after the school publishing database is connected.</div>';
      return;
    }
    const [newsResult, eventResult, galleryResult] = await Promise.all([
      db.from("school_news").select("*").eq("published", true).order("created_at", {ascending:false}).limit(6),
      db.from("school_events").select("*").eq("published", true).order("event_date", {ascending:true}).limit(8),
      db.from("school_gallery").select("id,title,caption,image_url,created_at").eq("published", true).order("created_at", {ascending:false}).limit(18)
    ]);
    if (newsResult.error) newsEl.innerHTML = '<div class="empty-state">News could not be loaded. Please try again later.</div>';
    else renderNews(newsResult.data || []);
    if (eventResult.error) eventsEl.innerHTML = '<div class="empty-state dark-empty">Programmes could not be loaded at this time.</div>';
    else renderEvents(eventResult.data || []);
    if (galleryResult.error) {
      document.getElementById("galleryGrid").innerHTML = '<div class="empty-state">The photo gallery is being set up. Please check again soon.</div>';
    } else renderGallery(galleryResult.data || []);
  }

  function renderNews(items) {
    if (!items.length) { newsEl.innerHTML = '<div class="empty-state">There are no published news updates yet. Please check back soon.</div>'; return; }
    newsEl.innerHTML = items.map(item => `
      <article class="news-card">
        ${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy">` : '<div class="gallery-placeholder" style="height:190px"><span>✦</span><strong>School update</strong></div>'}
        <div class="news-card-body"><div class="card-meta">${dateText(item.created_at?.slice(0,10))}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml((item.body || "").slice(0,145))}${(item.body || "").length > 145 ? "…" : ""}</p></div>
      </article>`).join("");
  }
  function renderEvents(items) {
    if (!items.length) { eventsEl.innerHTML = '<div class="empty-state dark-empty">No upcoming programmes have been announced yet.</div>'; return; }
    eventsEl.innerHTML = items.map(item => `
      <article class="event-row"><div class="event-date">${dateText(item.event_date)}</div>
      <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p></div>
      <div class="event-place">${escapeHtml(item.venue || "School venue to be confirmed")}</div></article>`).join("");
  }
  function renderGallery(items) {
    const grid = document.getElementById("galleryGrid");
    if (!items.length) {
      grid.innerHTML = '<div class="gallery-placeholder"><span>✦</span><strong>School photographs will appear here</strong></div>';
      return;
    }
    grid.innerHTML = items.map(item => `
      <figure class="gallery-placeholder" style="margin:0;overflow:hidden;position:relative">
        <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" loading="lazy" style="width:100%;height:100%;min-height:220px;object-fit:cover;display:block">
        <figcaption style="position:absolute;left:0;right:0;bottom:0;padding:18px;color:white;background:linear-gradient(transparent,rgba(10,40,25,.82))">
          <strong>${escapeHtml(item.title)}</strong>${item.caption ? `<span style="display:block;font-size:12px;margin-top:4px">${escapeHtml(item.caption)}</span>` : ""}
        </figcaption>
      </figure>`).join("");
  }
  loadContent();
})();