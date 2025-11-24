// app.js — Unique solution for internship task
// Features:
// - fetch with exponential backoff (3 attempts)
// - skeleton UI while loading
// - cache response in localStorage with TTL (5 minutes)
// - offline fallback to cached data
// - search with debounce
// - reload button

const API = 'https://jsonplaceholder.typicode.com/users';
const CACHE_KEY = 'users_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

const usersEl = document.getElementById('users');
const statusEl = document.getElementById('status');
const reloadBtn = document.getElementById('reloadBtn');
const searchInput = document.getElementById('searchInput');

function setStatus(text, cls='') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + cls;
}

function escapeHtml(s='') {
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

function skeletons(count=6) {
  usersEl.innerHTML = '';
  for (let i=0;i<count;i++){
    const div = document.createElement('div');
    div.className = 'user-card skeleton';
    div.innerHTML = `<div class="line"></div><div class="line" style="width:60%"></div>`;
    usersEl.appendChild(div);
  }
}

// simple exponential backoff fetch
async function fetchWithRetry(url, attempts = 3, delay = 500) {
  let i = 0;
  while (i < attempts) {
    try {
      const res = await fetch(url, {cache: 'no-store'});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      i++;
      if (i >= attempts) throw err;
      // wait
      await new Promise(r => setTimeout(r, delay));
      delay *= 2; // exponential
    }
  }
}

// save cache (data is plain array)
function saveCache(data) {
  const payload = {ts: Date.now(), data};
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch(e){}
}

// load cache if fresh
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return obj.data || null;
  } catch (e) { return null; }
}

function formatAddress(addr={}) {
  return `${addr.street || ''} ${addr.suite || ''}, ${addr.city || ''} ${addr.zipcode || ''}`.trim();
}

function createCard(user) {
  const card = document.createElement('article');
  card.className = 'user-card';
  const address = formatAddress(user.address || {});
  card.innerHTML = `
    <h3>${escapeHtml(user.name)}</h3>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a></p>
    <p class="address"><strong>Address:</strong> ${escapeHtml(address)}</p>
    <div class="actions">
      <button class="small-btn copy" data-email="${escapeHtml(user.email)}">Copy Email</button>
      <button class="small-btn map" data-map="${encodeURIComponent(address)}">Open on Map</button>
    </div>
  `;

  card.querySelector('.copy').addEventListener('click', async (e) => {
    const email = e.currentTarget.dataset.email;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(email);
        e.currentTarget.textContent = 'Copied ✓';
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch {
      e.currentTarget.textContent = 'Copy failed';
    }
    setTimeout(()=> e.currentTarget.textContent = 'Copy Email', 1200);
  });

  card.querySelector('.map').addEventListener('click', (e) => {
    const q = e.currentTarget.dataset.map;
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
  });

  return card;
}

function renderUsers(users) {
  usersEl.innerHTML = '';
  if (!users || users.length === 0) {
    usersEl.innerHTML = `<div class="user-card empty">No users found.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  users.forEach(u => frag.appendChild(createCard(u)));
  usersEl.appendChild(frag);
}

async function fetchAndDisplay({useCacheIfOffline=true} = {}) {
  setStatus('Loading users...', 'loading');
  usersEl.setAttribute('aria-busy','true');
  skeletons(6);

  // if offline and allow cache, fallback early
  if (!navigator.onLine && useCacheIfOffline) {
    const cached = loadCache();
    if (cached) {
      setStatus('Offline — showing cached data', 'error');
      renderUsers(cached);
      usersEl.setAttribute('aria-busy','false');
      return cached;
    } else {
      setStatus('Offline and no cached data available.', 'error');
      usersEl.innerHTML = `<div class="user-card error">You are offline and no cached data available.</div>`;
      usersEl.setAttribute('aria-busy','false');
      return null;
    }
  }

  try {
    const res = await fetchWithRetry(API, 3, 600);
    const users = await res.json();
    saveCache(users);
    setStatus(`Loaded ${users.length} users.`);
    renderUsers(users);
    usersEl.setAttribute('aria-busy','false');
    return users;
  } catch (err) {
    console.error('Fetch failed', err);
    // try cached fallback
    const cached = loadCache();
    if (cached) {
      setStatus('Network error — showing cached data', 'error');
      renderUsers(cached);
    } else {
      setStatus('Failed to load users. Check network and try again.', 'error');
      usersEl.innerHTML = `<div class="user-card error">Error: ${escapeHtml(err.message)}</div>`;
    }
    usersEl.setAttribute('aria-busy','false');
    return null;
  }
}

// Simple debounce utility
function debounce(fn, ms=300){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=> fn(...args), ms); };
}

// client-side filter
function filterAndRender(allUsers, query) {
  if (!allUsers) return;
  const q = query.trim().toLowerCase();
  if (!q) { renderUsers(allUsers); return; }
  const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(q));
  renderUsers(filtered);
}

let cachedUsers = null;

// initial run
window.addEventListener('DOMContentLoaded', async () => {
  cachedUsers = await fetchAndDisplay();
});

// reload button
reloadBtn.addEventListener('click', async () => {
  cachedUsers = await fetchAndDisplay({useCacheIfOffline:false});
});

// search with debounce (filters cachedUsers)
searchInput.addEventListener('input', debounce((e) => {
  if (!cachedUsers) return;
  filterAndRender(cachedUsers, e.target.value);
}, 250));

// handle online/offline to update status
window.addEventListener('online', () => setStatus('Back online — data may be stale. Click Reload to refresh.'));
window.addEventListener('offline', () => setStatus('You are offline — cached data may be shown.', 'error'));
