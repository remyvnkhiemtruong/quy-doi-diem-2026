// --- PWA Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}

// --- Dark Mode ---
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
  }
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    let theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  });
}

// --- Snapshot (html2canvas) ---
function takeSnapshot(elementId) {
  const el = document.getElementById(elementId);
  if(!el) return;
  const btn = el.querySelector('.snapshot-btn');
  if(btn) btn.style.display = 'none';
  const isDark = document.body.classList.contains('dark');
  
  html2canvas(el, {
    backgroundColor: isDark ? '#1A2235' : '#FFFFFF',
    scale: 2
  }).then(canvas => {
    if(btn) btn.style.display = '';
    const link = document.createElement('a');
    link.download = 'ket-qua-quy-doi-diem.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    if(btn) btn.style.display = '';
    console.error('Snapshot failed', err);
  });
}

// --- TABS LOGIC ---
document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ==========================================
// --- TAB 1: ĐGNL ↔ THPT LOGIC ---
// ==========================================


let stateDGNL = {
  exam: "hcm",
  mode: "gnl",
  subject: "A00",
  score: null
};

const subjectGrid = document.getElementById('subjectGrid');
if (subjectGrid) {
  Object.keys(SUBJECT_NAMES).forEach(code => {
    const btn = document.createElement('div');
    btn.className = 'subject-btn' + (code === stateDGNL.subject ? ' active' : '');
    btn.dataset.subject = code;
    btn.innerHTML = `<span class="code">${code}</span><span class="subj-name">${SUBJECT_NAMES[code]}</span>`;
    btn.addEventListener('click', () => {
      stateDGNL.subject = code;
      document.querySelectorAll('#subjectGrid .subject-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tableSubjectName').textContent = code + ' — ' + SUBJECT_NAMES[code];
      renderTableDGNL();
      computeDGNL();
    });
    subjectGrid.appendChild(btn);
  });
}

document.querySelectorAll('#examSwitch button').forEach(btn => {
  btn.addEventListener('click', () => {
    stateDGNL.exam = btn.dataset.exam;
    document.querySelectorAll('#examSwitch button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Hide A01 if HSA is selected
    const a01Btn = document.querySelector('#subjectGrid .subject-btn[data-subject="A01"]');
    if(a01Btn) {
      if(stateDGNL.exam === 'hsa') {
        a01Btn.style.display = 'none';
        if(stateDGNL.subject === 'A01') {
          // Switch to A00
          stateDGNL.subject = 'A00';
          document.querySelectorAll('#subjectGrid .subject-btn').forEach(b => b.classList.remove('active'));
          document.querySelector('#subjectGrid .subject-btn[data-subject="A00"]').classList.add('active');
          document.getElementById('tableSubjectName').textContent = 'A00 — ' + SUBJECT_NAMES['A00'];
        }
      } else {
        a01Btn.style.display = '';
      }
    }

    updateInputLabelsDGNL();
    renderTableDGNL();
    computeDGNL();
  });
});

document.querySelectorAll('#modeSwitch button').forEach(btn => {
  btn.addEventListener('click', () => {
    stateDGNL.mode = btn.dataset.mode;
    document.querySelectorAll('#modeSwitch button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateInputLabelsDGNL();
    computeDGNL();
  });
});

function updateInputLabelsDGNL(){
  const label = document.getElementById('inputFieldLabel');
  const unit = document.getElementById('unitLabel');
  const hint = document.getElementById('scoreHint');
  const resultLabel = document.getElementById('resultLabel');
  const scoreInput = document.getElementById('scoreInput');
  const examName = stateDGNL.exam === 'hsa' ? 'ĐHQGHN (HSA)' : 'ĐHQG-HCM';
  const maxScore = stateDGNL.exam === 'hsa' ? 150 : 1200;

  if(stateDGNL.mode === 'gnl'){
    label.textContent = `Bước 4 — Nhập điểm ĐGNL (thang ${maxScore})`;
    unit.textContent = `/ ${maxScore}`;
    hint.textContent = `Nhập điểm thi Đánh giá năng lực ${examName} (thang điểm ${maxScore}).`;
    resultLabel.textContent = 'Điểm THPT tương đương';
    if(scoreInput) scoreInput.placeholder = stateDGNL.exam === 'hsa' ? "VD: 100" : "VD: 850";
  } else {
    label.textContent = 'Bước 4 — Nhập điểm THPT (thang 30)';
    unit.textContent = '/ 30';
    hint.textContent = 'Nhập tổng điểm 3 môn thi tốt nghiệp THPT theo tổ hợp đã chọn (thang điểm 30).';
    resultLabel.textContent = 'Điểm ĐGNL tương đương';
    if(scoreInput) scoreInput.placeholder = "VD: 24.5";
  }
}

const scoreInput = document.getElementById('scoreInput');
if (scoreInput) {
  scoreInput.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    stateDGNL.score = isNaN(v) ? null : v;
    computeDGNL();
  });
}

function findBracketByGNL(rows, score){
  for(const r of rows){
    if(score <= r.gnlHigh && score >= r.gnlLow) return r;
  }
  if(score > rows[0].gnlHigh) return rows[0];
  if(score < rows[rows.length-1].gnlLow) return rows[rows.length-1];
  return null;
}
function findBracketByTHPT(rows, score){
  for(const r of rows){
    if(score <= r.thptHigh && score >= r.thptLow) return r;
  }
  if(score > rows[0].thptHigh) return rows[0];
  if(score < rows[rows.length-1].thptLow) return rows[rows.length-1];
  return null;
}

function interpolate(x, xHigh, xLow, yHigh, yLow){
  if(xHigh === xLow) return (yHigh+yLow)/2;
  const frac = (xHigh - x) / (xHigh - xLow);
  const clamped = Math.min(1, Math.max(0, frac));
  return yHigh - clamped * (yHigh - yLow);
}

const HSA_TOP = [
  { hsa: 129, top: 0.03 },
  { hsa: 117, top: 0.5 },
  { hsa: 114, top: 1 },
  { hsa: 111, top: 2 },
  { hsa: 108, top: 3 },
  { hsa: 105, top: 5 },
  { hsa: 100, top: 10 },
  { hsa: 93, top: 20 },
  { hsa: 88, top: 30 },
  { hsa: 83, top: 40 },
  { hsa: 79, top: 50 },
  { hsa: 75, top: 60 },
  { hsa: 70, top: 70 },
  { hsa: 66, top: 80 },
  { hsa: 60, top: 90 },
  { hsa: 19, top: 100 }
];

function getHsaTop(score) {
  if (score >= 129) return 0.03;
  if (score <= 19) return 100;
  for (let i = 0; i < HSA_TOP.length - 1; i++) {
    const p1 = HSA_TOP[i];
    const p2 = HSA_TOP[i+1];
    if (score <= p1.hsa && score >= p2.hsa) {
      return p1.top + (score - p1.hsa) * (p2.top - p1.top) / (p2.hsa - p1.hsa);
    }
  }
  return 100;
}

function computeDGNL(){
  const emptyState = document.getElementById('emptyState');
  const resultContent = document.getElementById('resultContent');

  if(stateDGNL.score === null || isNaN(stateDGNL.score)){
    if(emptyState) {
      emptyState.style.display = 'block';
      emptyState.textContent = 'Nhập điểm hợp lệ để xem kết quả quy đổi.';
      emptyState.style.color = '';
    }
    if(resultContent) resultContent.style.display = 'none';
    return;
  }
  
  let maxScore = stateDGNL.mode === 'gnl' ? (stateDGNL.exam === 'hsa' ? 150 : 1200) : 30;
  if(stateDGNL.score < 0 || stateDGNL.score > maxScore) {
    if(emptyState) {
      emptyState.style.display = 'block';
      emptyState.textContent = '❌ Điểm không hợp lệ! Vui lòng nhập điểm từ 0 đến ' + maxScore;
      emptyState.style.color = 'var(--seal)';
    }
    if(resultContent) resultContent.style.display = 'none';
    return;
  }
  
  if(emptyState) emptyState.style.display = 'none';
  if(resultContent) resultContent.style.display = 'block';

  let rangeText, unit;

  if(stateDGNL.exam === 'hcm') {
    if (!DATA || !DATA[stateDGNL.subject]) return;
    const rows = DATA[stateDGNL.subject];
    let bracket, estimated;
    if(stateDGNL.mode === 'gnl'){
      bracket = findBracketByGNL(rows, stateDGNL.score);
      estimated = interpolate(stateDGNL.score, bracket.gnlHigh, bracket.gnlLow, bracket.thptHigh, bracket.thptLow);
      rangeText = `Khoảng tương ứng: ${bracket.thptLow.toFixed(2)} – ${bracket.thptHigh.toFixed(2)} điểm THPT (nhóm phân vị ${bracket.pv}%), ứng với ĐGNL ${bracket.gnlLow} – ${bracket.gnlHigh}.`;
      unit = '/30';
      document.getElementById('resultValue').innerHTML = estimated.toFixed(2) + '<sup>' + unit + '</sup>';
    } else {
      bracket = findBracketByTHPT(rows, stateDGNL.score);
      estimated = interpolate(stateDGNL.score, bracket.thptHigh, bracket.thptLow, bracket.gnlHigh, bracket.gnlLow);
      rangeText = `Khoảng tương ứng: ${bracket.gnlLow} – ${bracket.gnlHigh} điểm ĐGNL (nhóm phân vị ${bracket.pv}%), ứng với THPT ${bracket.thptLow.toFixed(2)} – ${bracket.thptHigh.toFixed(2)}.`;
      unit = '/1200';
      document.getElementById('resultValue').innerHTML = Math.round(estimated) + '<sup>' + unit + '</sup>';
    }
    document.getElementById('resultRange').textContent = rangeText;
    document.getElementById('pvBadge').textContent = 'Nhóm phân vị ' + bracket.pv + '%';
    document.getElementById('rulerMarker').style.left = bracket.pv + '%';
    document.getElementById('rulerMarker').dataset.pv = bracket.pv + '%';
    document.getElementById('rulerCaption').textContent = `Vị trí ước lượng: thí sinh này thuộc nhóm cao hơn khoảng ${100-bracket.pv}% thí sinh dự thi ĐGNL ĐHQG-HCM năm 2026.`;
    renderTableDGNL(bracket.pv);
  } else {
    // HSA logic
    if (!DATA_HSA || !DATA_HSA[stateDGNL.subject]) return;
    const hsaMap = DATA_HSA[stateDGNL.subject];
    let estimated, hsaVal, thptVal, activeHsa;
    
    if(stateDGNL.mode === 'gnl'){
      hsaVal = Math.round(stateDGNL.score);
      if(hsaVal < 19) hsaVal = 19; // Bound min
      if(hsaVal > 150) hsaVal = 150; // Bound max
      
      // Attempt to find exact or nearest in the map
      if(hsaMap[hsaVal] !== undefined) {
        thptVal = hsaMap[hsaVal];
      } else {
        // If > max mapped value, use the highest available
        let maxMappedHsa = Math.max(...Object.keys(hsaMap).map(Number));
        if(hsaVal >= maxMappedHsa) {
          thptVal = hsaMap[maxMappedHsa];
          hsaVal = maxMappedHsa;
        } else {
           thptVal = 8.25; // fallback
        }
      }
      activeHsa = hsaVal;
      unit = '/30';
      document.getElementById('resultValue').innerHTML = thptVal.toFixed(2) + '<sup>' + unit + '</sup>';
      rangeText = `Điểm HSA ${hsaVal} tương đương với ${thptVal.toFixed(2)} điểm THPT tổ hợp ${stateDGNL.subject}.`;
    } else {
      // From THPT to HSA
      let targetTHPT = stateDGNL.score;
      let closestHSA = 19;
      let minDiff = 999;
      for (const [key, value] of Object.entries(hsaMap)) {
        let diff = Math.abs(value - targetTHPT);
        if (diff < minDiff) {
          minDiff = diff;
          closestHSA = Number(key);
        }
      }
      activeHsa = closestHSA;
      thptVal = hsaMap[closestHSA];
      unit = '/150';
      document.getElementById('resultValue').innerHTML = closestHSA + '<sup>' + unit + '</sup>';
      rangeText = `Điểm THPT ${targetTHPT} gần nhất với mức quy đổi ${thptVal.toFixed(2)}, tương đương điểm ĐGNL HSA là ${closestHSA}.`;
    }

    let topPercent = getHsaTop(activeHsa);
    let percentile = 100 - topPercent;
    let topText = topPercent < 1 ? '< 1' : topPercent.toFixed(1);

    document.getElementById('resultRange').textContent = rangeText;
    document.getElementById('pvBadge').textContent = `Tốp ${topText}%`;
    document.getElementById('rulerMarker').style.left = percentile + '%';
    document.getElementById('rulerMarker').dataset.pv = topText + '%';
    document.getElementById('rulerCaption').textContent = `Vị trí ước lượng: điểm HSA này thuộc Tốp ${topText}% thí sinh có điểm cao nhất (tương đương vượt qua ${percentile.toFixed(1)}% thí sinh).`;
    
    renderTableDGNL(activeHsa);
  }
}

function buildTicksDGNL(){
  const wrap = document.getElementById('rulerTicks');
  if(!wrap) return;
  wrap.innerHTML = '';
  for(let i=0;i<=10;i++){
    const s = document.createElement('span');
    wrap.appendChild(s);
  }
}

function renderTableDGNL(highlightPv){
  const tbody = document.getElementById('tableBody');
  const theadRow = document.getElementById('tableHeadRow');
  if(!tbody || !theadRow) return;

  if (stateDGNL.exam === 'hcm') {
    theadRow.innerHTML = `
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);" title="Tỷ lệ phần trăm thí sinh có điểm thấp hơn mức này">Phân vị <span style="cursor:help;opacity:0.6">(?)</span></th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">ĐGNL cao nhất</th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">ĐGNL thấp nhất</th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">THPT cao nhất</th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">THPT thấp nhất</th>
    `;
    if (!DATA || !DATA[stateDGNL.subject]) return;
    const rows = DATA[stateDGNL.subject];
    tbody.innerHTML = rows.map(r => `
      <tr class="${r.pv === highlightPv ? 'active-hl' : ''}" data-pv="${r.pv}" style="${r.pv === highlightPv ? 'background:var(--seal-soft); font-weight:600;' : ''}">
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${r.pv}%</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${r.gnlHigh}</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${r.gnlLow}</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${r.thptHigh.toFixed(2)}</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${r.thptLow.toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    theadRow.innerHTML = `
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">Tốp (%) ước lượng</th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">Điểm HSA</th>
      <th style="padding:10px 15px; border-bottom:1px solid var(--line);">Điểm THPT (${stateDGNL.subject})</th>
    `;
    if (!DATA_HSA || !DATA_HSA[stateDGNL.subject]) return;
    const hsaMap = DATA_HSA[stateDGNL.subject];
    const keys = Object.keys(hsaMap).map(Number).sort((a,b) => b-a);
    
    tbody.innerHTML = keys.map(k => {
      let thpt = hsaMap[k];
      let top = getHsaTop(k);
      let topText = top < 1 ? '< 1' : top.toFixed(1);
      let isHighlight = (k === highlightPv); // highlightPv is acting as activeHsa here
      
      return `
      <tr class="${isHighlight ? 'active-hl' : ''}" data-hsa="${k}" style="${isHighlight ? 'background:var(--seal-soft); font-weight:600;' : ''}">
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${topText}%</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${k}</td>
        <td style="padding:8px 15px; border-bottom:1px solid var(--line);">${thpt.toFixed(2)}</td>
      </tr>
      `;
    }).join('');
  }
}

if(document.getElementById('tableSubjectName')) {
  document.getElementById('tableSubjectName').textContent = stateDGNL.subject + ' — ' + SUBJECT_NAMES[stateDGNL.subject];
  updateInputLabelsDGNL();
  buildTicksDGNL();
  renderTableDGNL();
  computeDGNL();
}

// ==========================================
// --- TAB 2: KHỐI THI LOGIC ---
// ==========================================

function removeDiacritics(str){
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function normalizeForSearch(str){
  return removeDiacritics(str).toLowerCase().replace(/đ/g, 'd').replace(/\s+/g, '');
}

function buildCombobox(containerId, onSelect){
  const el = document.getElementById(containerId);
  if(!el) return;
  const input = el.querySelector('.combo-input');
  const panel = el.querySelector('.combo-panel');
  let selected = null;

  function render(query){
    panel.innerHTML = '';
    const q = normalizeForSearch(query);
    const order = SUBJECTS && SUBJECTS.order ? SUBJECTS.order : (typeof DB !== 'undefined' ? DB.order : []);
    const subjectsData = SUBJECTS && SUBJECTS.subjects ? SUBJECTS.subjects : (typeof DB !== 'undefined' ? DB.subjects : {});
    
    let results = order.filter(code => {
      const name = subjectsData[code] ? subjectsData[code].name : '';
      return normalizeForSearch(code).includes(q) || normalizeForSearch(name).includes(q);
    });

    if(results.length === 0){
      panel.innerHTML = '<div class="combo-empty">Không tìm thấy tổ hợp phù hợp.</div>';
      return;
    }
    
    let html = '';
    results.forEach(code => {
      const name = subjectsData[code].name;
      html += `<div class="combo-item" data-code="${code}">
                 <span class="code">${code}</span>
                 <span class="name">${name}</span>
               </div>`;
    });
    panel.innerHTML = html;
  }

  input.addEventListener('focus', () => { render(''); panel.classList.add('open'); });
  input.addEventListener('input', () => { render(input.value); panel.classList.add('open'); });
  document.addEventListener('click', (e) => {
    if(!el.contains(e.target)) panel.classList.remove('open');
  });
  panel.addEventListener('click', (e) => {
    const item = e.target.closest('.combo-item');
    if(!item) return;
    const code = item.dataset.code;
    selected = code;
    const subjectsData = SUBJECTS && SUBJECTS.subjects ? SUBJECTS.subjects : (typeof DB !== 'undefined' ? DB.subjects : {});
    input.value = code + ' — ' + subjectsData[code].name;
    panel.classList.remove('open');
    onSelect(code);
  });

  return {
    get: () => selected,
    set: (code) => {
      selected = code;
      const subjectsData = SUBJECTS && SUBJECTS.subjects ? SUBJECTS.subjects : (typeof DB !== 'undefined' ? DB.subjects : {});
      input.value = code + ' — ' + subjectsData[code].name;
    }
  };
}

function percentileFromScore(points, score){
  if(score <= points[0][1]){
    const [pv0,s0] = points[0], [pv1,s1] = points[1];
    const pv = pv0 - (s0 - score) * (pv1-pv0)/(s1-s0);
    return Math.max(0, pv);
  }
  if(score >= points[points.length-1][1]){
    const [pv0,s0] = points[points.length-2], [pv1,s1] = points[points.length-1];
    const pv = pv1 + (score - s1) * (pv1-pv0)/(s1-s0);
    return Math.min(100, pv);
  }
  for(let i=0;i<points.length-1;i++){
    const [pv0,s0] = points[i], [pv1,s1] = points[i+1];
    if(score >= s0 && score <= s1){
      if(s1 === s0) return pv0;
      const frac = (score - s0)/(s1-s0);
      return pv0 + frac*(pv1-pv0);
    }
  }
  return null;
}

function scoreFromPercentile(points, pv){
  if(pv <= points[0][0]){
    const [pv0,s0] = points[0], [pv1,s1] = points[1];
    return s0 - (pv0-pv)*(s1-s0)/(pv1-pv0);
  }
  if(pv >= points[points.length-1][0]){
    const [pv0,s0] = points[points.length-2], [pv1,s1] = points[points.length-1];
    return s1 + (pv-pv1)*(s1-s0)/(pv1-pv0);
  }
  for(let i=0;i<points.length-1;i++){
    const [pv0,s0] = points[i], [pv1,s1] = points[i+1];
    if(pv >= pv0 && pv <= pv1){
      if(pv1 === pv0) return s0;
      const frac = (pv-pv0)/(pv1-pv0);
      return s0 + frac*(s1-s0);
    }
  }
  return null;
}

function rulerHTML(pv){
  return `
    <div class="ruler-wrap">
      <div class="ruler">
        <div class="ruler-track"></div>
        <div class="ruler-marker" style="left:${Math.min(100,Math.max(0,pv))}%" data-pv="${pv.toFixed(1)}%"></div>
      </div>
      <div class="ruler-labels"><span>0% (thấp nhất)</span><span>100% (cao nhất)</span></div>
    </div>`;
}

// TOOL A
let stateA = { code: null };
const comboA = buildCombobox('comboA', (code) => { stateA.code = code; computeA(); });
const scoreAEl = document.getElementById('scoreA');
if(scoreAEl) scoreAEl.addEventListener('input', computeA);

function computeA(){
  const box = document.getElementById('resultA');
  if(!box) return;
  const score = parseFloat(document.getElementById('scoreA').value);
  if(score === null || isNaN(score)) {
    box.innerHTML = '<div class="empty-state">Chọn khối thi và nhập điểm để xem phân vị.</div>';
    return;
  }
  if(score < 0 || score > 30) {
    box.innerHTML = '<div class="empty-state" style="color:var(--seal)">❌ Điểm không hợp lệ! Vui lòng nhập điểm từ 0 đến 30</div>';
    return;
  }
  const subjectsData = SUBJECTS && SUBJECTS.subjects ? SUBJECTS.subjects : (typeof DB !== 'undefined' ? DB.subjects : {});
  const subj = subjectsData[stateA.code];
  const pv = percentileFromScore(subj.p, score);
  box.innerHTML = `
    <div class="result-head">
      <div>
        <div class="result-label">Phân vị ước lượng</div>
        <div class="result-value">${pv.toFixed(1)}<sup>%</sup></div>
      </div>
      <span class="badge">${stateA.code} · ${subj.name}</span>
    </div>
    <p class="result-desc">Điểm ${score} ở khối ${stateA.code} cao hơn khoảng ${pv.toFixed(1)}% thí sinh dự thi tổ hợp này.</p>
    ${rulerHTML(pv)}
    ${subj.count ? `<p class="stat-line" style="margin-top:10px;font-size:14px;color:var(--ink-light)">Số thí sinh dự thi đủ 3 môn tổ hợp ${stateA.code}: ${subj.count.toLocaleString('vi-VN')}.</p>` : ''}
  `;
}

// TOOL B
let stateB = { src: null, dst: null };
const comboSrc = buildCombobox('comboSrc', (code) => { stateB.src = code; computeB(); });
const comboDst = buildCombobox('comboDst', (code) => { stateB.dst = code; computeB(); });
const scoreSrcEl = document.getElementById('scoreSrc');
if(scoreSrcEl) scoreSrcEl.addEventListener('input', computeB);

function computeB(){
  const box = document.getElementById('resultB');
  if(!box) return;
  const score = parseFloat(document.getElementById('scoreSrc').value);
  if(!stateB.src || !stateB.dst || score === null || isNaN(score)){
    box.innerHTML = '<div class="empty-state">Chọn đủ khối nguồn, điểm và khối đích để xem điểm quy đổi.</div>';
    return;
  }
  if(score < 0 || score > 30){
    box.innerHTML = '<div class="empty-state" style="color:var(--seal)">❌ Điểm không hợp lệ! Vui lòng nhập điểm từ 0 đến 30</div>';
    return;
  }
  const subjectsData = SUBJECTS && SUBJECTS.subjects ? SUBJECTS.subjects : (typeof DB !== 'undefined' ? DB.subjects : {});
  const srcSubj = subjectsData[stateB.src];
  const dstSubj = subjectsData[stateB.dst];
  const pv = percentileFromScore(srcSubj.p, score);
  const eq = scoreFromPercentile(dstSubj.p, pv);
  box.innerHTML = `
    <div class="result-head">
      <div>
        <div class="result-label">Điểm tương đương ở ${stateB.dst}</div>
        <div class="result-value">${eq.toFixed(2)}<sup>/30</sup></div>
      </div>
      <span class="badge">Phân vị ${pv.toFixed(1)}%</span>
    </div>
    <p class="result-desc">Điểm ${score} ở khối ${stateB.src} (${srcSubj.name}) tương đương phân vị ${pv.toFixed(1)}%, ứng với khoảng ${eq.toFixed(2)} điểm ở khối ${stateB.dst} (${dstSubj.name}).</p>
    ${rulerHTML(pv)}
  `;
}

// ==========================================
// --- LOCAL STORAGE HISTORY LOGIC ---
// ==========================================
function saveHistory() {
  const hist = {
    dgnlMode: stateDGNL.mode,
    dgnlSubject: stateDGNL.subject,
    dgnlScore: stateDGNL.score,
    aCode: stateA.code,
    aScore: document.getElementById('scoreA') ? document.getElementById('scoreA').value : '',
    bSrc: stateB.src,
    bDst: stateB.dst,
    bScore: document.getElementById('scoreSrc') ? document.getElementById('scoreSrc').value : ''
  };
  localStorage.setItem('diem2026_history', JSON.stringify(hist));
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('diem2026_history');
    if (!saved) return;
    const hist = JSON.parse(saved);

    // Restore DGNL
    if(hist.dgnlMode) {
      stateDGNL.mode = hist.dgnlMode;
      const btn = document.querySelector(`#modeSwitch button[data-mode="${hist.dgnlMode}"]`);
      if(btn) {
        document.querySelectorAll('#modeSwitch button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateInputLabelsDGNL();
      }
    }
    if(hist.dgnlSubject) {
      stateDGNL.subject = hist.dgnlSubject;
      const btn = document.querySelector(`#subjectGrid .subject-btn[data-subject="${hist.dgnlSubject}"]`);
      if(btn) {
        document.querySelectorAll('#subjectGrid .subject-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tb = document.getElementById('tableSubjectName');
        if(tb) tb.textContent = hist.dgnlSubject + ' — ' + SUBJECT_NAMES[hist.dgnlSubject];
        renderTableDGNL();
      }
    }
    if(hist.dgnlScore !== null && hist.dgnlScore !== undefined && !isNaN(hist.dgnlScore)) {
      stateDGNL.score = hist.dgnlScore;
      const el = document.getElementById('scoreInput');
      if(el) el.value = hist.dgnlScore;
    }
    computeDGNL();

    // Restore Tool A
    if(hist.aCode) {
      stateA.code = hist.aCode;
      comboA.set(hist.aCode);
    }
    if(hist.aScore) {
      const el = document.getElementById('scoreA');
      if(el) el.value = hist.aScore;
    }
    computeA();

    // Restore Tool B
    if(hist.bSrc) {
      stateB.src = hist.bSrc;
      comboSrc.set(hist.bSrc);
    }
    if(hist.bDst) {
      stateB.dst = hist.bDst;
      comboDst.set(hist.bDst);
    }
    if(hist.bScore) {
      const el = document.getElementById('scoreSrc');
      if(el) el.value = hist.bScore;
    }
    computeB();

  } catch(e) {
    console.error('Failed to load history', e);
  }
}

document.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT') {
    saveHistory();
  }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('.combo-item') || e.target.closest('button') || e.target.closest('.subject-btn')) {
    setTimeout(saveHistory, 100);
  }
});

// Initialize
window.addEventListener('DOMContentLoaded', loadHistory);
