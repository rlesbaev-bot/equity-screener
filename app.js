const API_URL = 'https://functions.yandexcloud.net/d4e3ehsvbv2cm4ra8bcn'; // < ÇÀÌÅÍÈÒÅ
const AUTH_TOKEN = 'xWsdsK9mP2vL8nQ4wR7tY1uB4556sderzFgt'; // < ÇÀÌÅÍÈÒÅ (äîëæåí ñîâïàäàòü ñ SECRET_TOKEN)

const DEFAULT_WATCHLIST = {
  "SBER": ["Ñáåðáàíê", "Ñáåð", "Sberbank"],
  "LKOH": ["Ëóêîéë", "Lukoil"],
  "GAZP": ["Ãàçïðîì", "Gazprom"],
  "YNDX": ["ßíäåêñ", "Yandex"],
  "GMKN": ["Íîðíèêåëü", "Íîðèëüñêèé íèêåëü", "Nornickel"],
  "ROSN": ["Ðîñíåôòü", "Rosneft"],
  "NVTK": ["Íîâàòýê", "Novatek"],
  "MTSS": ["ÌÒÑ", "Mobile TeleSystems"],
  "MGNT": ["Ìàãíèò", "Magnit"],
  "PLZL": ["Ïîëþñ", "Polyus"]
};

const STORAGE_DAYS = 7;

const CATEGORY_LABELS = {
  monetary_policy: 'ÄÊÏ ÖÁ', dividends: 'Äèâèäåíäû', earnings: 'Îò÷¸òíîñòü',
  regulation_tax: 'Ðåãóëÿòîðèêà', sanctions_geopolitics: 'Ñàíêöèè',
  operational: 'Îïåðàöèîííûå', market_noise: 'Øóì'
};

function getWatchlist() {
  const stored = localStorage.getItem('watchlist');
  return stored ? JSON.parse(stored) : DEFAULT_WATCHLIST;
}

function getAlerts() {
  const stored = localStorage.getItem('alerts');
  return stored ? JSON.parse(stored) : [];
}

function saveAlerts(alerts) {
  const cutoff = Date.now() - STORAGE_DAYS * 24 * 60 * 60 * 1000;
  const fresh = alerts.filter(a => new Date(a.analyzedAt).getTime() > cutoff);
  localStorage.setItem('alerts', JSON.stringify(fresh));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'òîëüêî ÷òî';
  if (mins < 60) return `${mins} ìèí íàçàä`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ÷ íàçàä`;
  const days = Math.floor(hours / 24);
  return `${days} äí íàçàä`;
}

async function fetchAnalysis() {
  const watchlist = getWatchlist();
  const existingAlerts = getAlerts();
  const existingHashes = existingAlerts.map(a => a.hash).filter(Boolean);

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Auth-Token': AUTH_TOKEN
    },
    body: JSON.stringify({ watchlist, existingHashes })
  });

  if (resp.status === 403) throw new Error('Íåâåðíûé òîêåí äîñòóïà');
  if (resp.status === 429) throw new Error('Ñëèøêîì ÷àñòûå çàïðîñû, ïîäîæäèòå ìèíóòó');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.json();
}

async function runScreening() {
  const statusBar = document.getElementById('statusBar');
  const alertsList = document.getElementById('alertsList');
  
  statusBar.style.display = 'block';
  statusBar.className = 'status-bar';
  statusBar.innerHTML = '<span class="spinner"></span>Àíàëèçèðóåì íîâîñòè...';
  
  try {
    const data = await fetchAnalysis();
    
    const existing = getAlerts();
    const existingHashes = new Set(existing.map(a => a.hash));
    const newAlerts = data.alerts.filter(a => !existingHashes.has(a.hash));
    const merged = [...newAlerts, ...existing];
    saveAlerts(merged);
    
    if (data.summary) {
      localStorage.setItem('lastSummary', JSON.stringify({
        summary: data.summary,
        portfolioScore: data.portfolioScore,
        updatedAt: new Date().toISOString()
      }));
    }
    
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (data.errors && data.errors.length > 0) {
      statusBar.className = 'status-bar partial';
      statusBar.textContent = `? Îáíîâëåíî â ${now}. Îøèáîê àíàëèçà: ${data.errors.length}`;
    } else {
      statusBar.className = 'status-bar';
      statusBar.textContent = `? Îáíîâëåíî â ${now}. Íîâûõ íîâîñòåé: ${newAlerts.length}`;
    }
    
    document.getElementById('lastUpdate').textContent = `Îáíîâëåíî ${timeAgo(new Date().toISOString())}`;
    renderSummary();
    renderAlerts();
    
  } catch (e) {
    console.error('Screening error:', e);
    const cached = getAlerts();
    if (cached.length > 0) {
      statusBar.style.display = 'block';
      statusBar.className = 'status-bar offline';
      statusBar.textContent = `? Íåò ñâÿçè. Ïîêàçàíû äàííûå, îáíîâë¸ííûå ${timeAgo(cached[0].analyzedAt)}`;
      renderSummary();
      renderAlerts();
    } else {
      statusBar.className = 'status-bar error';
      statusBar.textContent = `? Îøèáêà: ${e.message}. Íàæìèòå «??» ÷òîáû ïîâòîðèòü.`;
      alertsList.innerHTML = '<div class="empty">Íåò äàííûõ. Ïðîâåðüòå ñîåäèíåíèå è ïîâòîðèòå.</div>';
    }
  }
}

function renderSummary() {
  const summaryDiv = document.getElementById('summary');
  const scoreDiv = document.getElementById('portfolioScore');
  const tickersDiv = document.getElementById('summaryTickers');
  
  const stored = localStorage.getItem('lastSummary');
  if (!stored) { summaryDiv.style.display = 'none'; return; }
  
  const { summary, portfolioScore, updatedAt } = JSON.parse(stored);
  
  if (Date.now() - new Date(updatedAt).getTime() > 24 * 60 * 60 * 1000) {
    summaryDiv.style.display = 'none'; return;
  }
  
  summaryDiv.style.display = 'flex';
  const scoreClass = portfolioScore > 1 ? 'pos' : portfolioScore < -1 ? 'neg' : 'neu';
  scoreDiv.className = `summary-score ${scoreClass}`;
  scoreDiv.textContent = `${portfolioScore > 0 ? '+' : ''}${portfolioScore}`;
  
  tickersDiv.innerHTML = Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .map(([ticker, score]) => {
      const cls = score > 1 ? 'pos' : score < -1 ? 'neg' : 'neu';
      return `<span class="summary-ticker ${cls}">${ticker} ${score > 0 ? '+' : ''}${score}</span>`;
    }).join('');
}

function renderAlerts() {
  const allAlerts = getAlerts();
  const filterTicker = document.getElementById('filterTicker').value;
  const filterCat = document.getElementById('filterCategory').value;
  const filterSig = document.getElementById('filterSignificance').value;

  let filtered = allAlerts;
  if (filterTicker !== 'all') filtered = filtered.filter(a => a.ticker === filterTicker);
  if (filterCat !== 'all') filtered = filtered.filter(a => a.category === filterCat);
  if (filterSig === 'significant') filtered = filtered.filter(a => Math.abs(a.score) >= 3);

  const container = document.getElementById('alertsList');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">Íåò íîâîñòåé ïî çàäàííûì ôèëüòðàì</div>';
    return;
  }

  container.innerHTML = filtered.map(a => {
    const scoreClass = a.score > 2 ? 'pos' : a.score < -2 ? 'neg' : 'neu';
    const cardClass = a.score > 2 ? 'positive' : a.score < -2 ? 'negative' : 'neutral';
    const catLabel = CATEGORY_LABELS[a.category] || a.category;
    const dateStr = a.date ? new Date(a.date).toLocaleString('ru-RU') : '';

    return `
      <div class="alert-card ${cardClass}">
        <div class="alert-top">
          <span class="ticker">${a.ticker}</span>
          <span class="score ${scoreClass}">${a.score > 0 ? '+' : ''}${a.score}</span>
        </div>
        <div class="badges">
          <span class="category-badge">${catLabel}</span>
          <span class="source-badge">${a.source}</span>
        </div>
        <div class="news-title"><a href="${a.newsLink}" target="_blank">${a.newsTitle}</a></div>
        <div class="reason">${a.reason}</div>
        <div class="source-line">${dateStr} · ${timeAgo(a.analyzedAt)}</div>
      </div>
    `;
  }).join('');

  const tickerSelect = document.getElementById('filterTicker');
  const uniqueTickers = [...new Set(allAlerts.map(a => a.ticker))].sort();
  const currentValue = tickerSelect.value;
  tickerSelect.innerHTML = '<option value="all">Âñå òèêåðû</option>' +
    uniqueTickers.map(t => `<option value="${t}">${t}</option>`).join('');
  tickerSelect.value = currentValue;
}

document.getElementById('btnRefresh').addEventListener('click', runScreening);
document.getElementById('filterTicker').addEventListener('change', renderAlerts);
document.getElementById('filterCategory').addEventListener('change', renderAlerts);
document.getElementById('filterSignificance').addEventListener('change', renderAlerts);
document.getElementById('btnSettings').addEventListener('click', () => {
  window.location.href = 'settings.html';
});

const cached = getAlerts();
if (cached.length > 0) {
  renderSummary();
  renderAlerts();
  document.getElementById('lastUpdate').textContent = 
    `Äàííûå çà ${timeAgo(cached[0].analyzedAt)} · íàæìèòå ?? äëÿ îáíîâëåíèÿ`;
}
