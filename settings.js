const TICKER_DICTIONARY = {
  "SBER": ["Ñáåðáàíê", "Ñáåð", "Sberbank"], "LKOH": ["Ëóêîéë", "Lukoil"],
  "GAZP": ["Ãàçïðîì", "Gazprom"], "YNDX": ["ßíäåêñ", "Yandex"],
  "GMKN": ["Íîðíèêåëü", "Íîðèëüñêèé íèêåëü", "Nornickel"], "ROSN": ["Ðîñíåôòü", "Rosneft"],
  "NVTK": ["Íîâàòýê", "Novatek"], "MTSS": ["ÌÒÑ", "Mobile TeleSystems"],
  "MGNT": ["Ìàãíèò", "Magnit"], "PLZL": ["Ïîëþñ", "Polyus"],
  "TATN": ["Òàòíåôòü", "Tatneft"], "BANE": ["Áàøíåôòü", "Bashneft"],
  "SIBN": ["Ãàçïðîì íåôòü", "Gazprom Neft"], "CHMF": ["Ñåâåðñòàëü", "Severstal"],
  "NLMK": ["ÍËÌÊ"], "MMKK": ["ÌÌÊ", "Ìàãíèòîãîðñêèé ìåòàëëóðãè÷åñêèé"],
  "ALRS": ["Àëðîñà", "Alrosa"], "PHOR": ["ÔîñÀãðî", "PhosAgro"],
  "VTBR": ["ÂÒÁ", "Áàíê ÂÒÁ"], "TCSG": ["Òèíüêîôô", "TCS Group", "Ò-Áàíê"],
  "MOEX": ["Ìîñáèðæà", "Moscow Exchange"], "VKCO": ["VK", "ÂÊîíòàêòå"],
  "OZON": ["Ozon", "Îçîí"], "FIVE": ["X5 Group", "Ïÿò¸ðî÷êà", "Ïåðåêð¸ñòîê"],
  "AFLT": ["Àýðîôëîò"], "RTKM": ["Ðîñòåëåêîì"], "HYDR": ["ÐóñÃèäðî"],
  "IRAO": ["Èíòåð ÐÀÎ"], "RUAL": ["Ðóñàë", "Rusal"], "SMLT": ["Ñàìîë¸ò", "Ñàìîëåò"]
};

const DEFAULT_WATCHLIST = {
  "SBER": ["Ñáåðáàíê", "Ñáåð", "Sberbank"], "LKOH": ["Ëóêîéë", "Lukoil"],
  "GAZP": ["Ãàçïðîì", "Gazprom"], "YNDX": ["ßíäåêñ", "Yandex"],
  "GMKN": ["Íîðíèêåëü", "Íîðèëüñêèé íèêåëü", "Nornickel"], "ROSN": ["Ðîñíåôòü", "Rosneft"],
  "NVTK": ["Íîâàòýê", "Novatek"], "MTSS": ["ÌÒÑ", "Mobile TeleSystems"],
  "MGNT": ["Ìàãíèò", "Magnit"], "PLZL": ["Ïîëþñ", "Polyus"]
};

function getWatchlist() {
  const stored = localStorage.getItem('watchlist');
  return stored ? JSON.parse(stored) : DEFAULT_WATCHLIST;
}

function renderWatchlist() {
  const watchlist = getWatchlist();
  const container = document.getElementById('watchlistContainer');
  container.innerHTML = '';
  const entries = Object.entries(watchlist);
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-list">Ñïèñîê ïóñò. Äîáàâüòå òèêåðû âûøå.</div>';
    return;
  }
  entries.forEach(([ticker, keywords]) => {
    const item = document.createElement('div');
    item.className = 'watchlist-item';
    item.innerHTML = `
      <input type="text" value="${ticker}" class="ticker-input" maxlength="10">
      <input type="text" value="${keywords.join(', ')}" class="keywords-input" placeholder="Êëþ÷åâûå ñëîâà ÷åðåç çàïÿòóþ">
      <button class="remove-btn">?</button>
    `;
    container.appendChild(item);
    item.querySelector('.remove-btn').addEventListener('click', () => {
      item.remove();
      updateEmptyState();
    });
  });
}

function updateEmptyState() {
  const container = document.getElementById('watchlistContainer');
  if (container.querySelectorAll('.watchlist-item').length === 0) {
    container.innerHTML = '<div class="empty-list">Ñïèñîê ïóñò. Äîáàâüòå òèêåðû âûøå.</div>';
  }
}

function quickAddTicker() {
  const input = document.getElementById('quickTickerInput');
  const feedback = document.getElementById('quickAddFeedback');
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) { feedback.style.color = '#c62828'; feedback.textContent = 'Ââåäèòå òèêåð'; return; }
  const existing = document.querySelectorAll('.ticker-input');
  for (const el of existing) {
    if (el.value.toUpperCase() === ticker) {
      feedback.style.color = '#f57f17'; feedback.textContent = `Òèêåð ${ticker} óæå â ñïèñêå`; return;
    }
  }
  const keywords = TICKER_DICTIONARY[ticker] || [ticker];
  const isKnown = TICKER_DICTIONARY[ticker] !== undefined;
  const container = document.getElementById('watchlistContainer');
  const emptyMsg = container.querySelector('.empty-list');
  if (emptyMsg) emptyMsg.remove();
  const item = document.createElement('div');
  item.className = 'watchlist-item';
  item.innerHTML = `
    <input type="text" value="${ticker}" class="ticker-input" maxlength="10">
    <input type="text" value="${keywords.join(', ')}" class="keywords-input" placeholder="Êëþ÷åâûå ñëîâà ÷åðåç çàïÿòóþ">
    <button class="remove-btn">?</button>
  `;
  container.appendChild(item);
  item.querySelector('.remove-btn').addEventListener('click', () => { item.remove(); updateEmptyState(); });
  if (isKnown) {
    feedback.style.color = '#2e7d32';
    feedback.textContent = `? ${ticker} äîáàâëåí ñ àâòî-êëþ÷àìè: ${keywords.join(', ')}`;
  } else {
    feedback.style.color = '#f57f17';
    feedback.textContent = `? ${ticker} äîáàâëåí. Òèêåð íå â ñëîâàðå — ïðîâåðüòå êëþ÷åâûå ñëîâà.`;
  }
  input.value = '';
}

function saveWatchlist() {
  const items = document.querySelectorAll('.watchlist-item');
  const watchlist = {};
  const errors = [];
  items.forEach(item => {
    const ticker = item.querySelector('.ticker-input').value.trim().toUpperCase();
    const keywordsStr = item.querySelector('.keywords-input').value.trim();
    if (!ticker) { errors.push('Ïðîïóùåí òèêåð'); return; }
    if (!keywordsStr) { errors.push(`${ticker}: íå óêàçàíû êëþ÷åâûå ñëîâà`); return; }
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) { errors.push(`${ticker}: êëþ÷åâûå ñëîâà ïóñòûå`); return; }
    if (watchlist[ticker]) { errors.push(`Äóáëèêàò: ${ticker}`); return; }
    watchlist[ticker] = keywords;
  });
  const statusEl = document.getElementById('status');
  if (Object.keys(watchlist).length === 0) {
    statusEl.className = 'status error'; statusEl.textContent = '? Äîáàâüòå õîòÿ áû îäèí òèêåð'; return;
  }
  if (errors.length > 0) {
    statusEl.className = 'status error';
    statusEl.innerHTML = '? Îøèáêè:<br>' + errors.map(e => `• ${e}`).join('<br>'); return;
  }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  statusEl.className = 'status success';
  statusEl.textContent = `? Ñîõðàíåíî. Òèêåðîâ: ${Object.keys(watchlist).length}`;
  setTimeout(() => { window.location.href = 'index.html'; }, 1000);
}

function resetToDefault() {
  if (!confirm('Ñáðîñèòü watchlist ê äåôîëòíîìó ñïèñêó?')) return;
  localStorage.setItem('watchlist', JSON.stringify(DEFAULT_WATCHLIST));
  renderWatchlist();
  document.getElementById('status').className = 'status success';
  document.getElementById('status').textContent = '? Ñáðîøåíî';
}

document.getElementById('quickAddBtn').addEventListener('click', quickAddTicker);
document.getElementById('quickTickerInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') quickAddTicker();
});
document.getElementById('quickTickerInput').addEventListener('input', (e) => {
  const ticker = e.target.value.trim().toUpperCase();
  const hint = document.getElementById('quickAddHint');
  if (!ticker) { hint.innerHTML = '?? Äëÿ ïîïóëÿðíûõ òèêåðîâ êëþ÷åâûå ñëîâà ïîäñòàâÿòñÿ àâòîìàòè÷åñêè.'; return; }
  if (TICKER_DICTIONARY[ticker]) {
    hint.innerHTML = `<span class="known">? ${ticker} åñòü â ñëîâàðå</span> — êëþ÷è ïîäñòàâÿòñÿ`;
  } else {
    hint.innerHTML = `<span class="unknown">? ${ticker} íå â ñëîâàðå</span> — äîáàâüòå êëþ÷è âðó÷íóþ`;
  }
});
document.getElementById('saveBtn').addEventListener('click', saveWatchlist);
document.getElementById('resetBtn').addEventListener('click', resetToDefault);

renderWatchlist();
