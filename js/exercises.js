/* ============================================
   Exercises Module - 5 Exercise Types
   ============================================ */

const Exercises = (() => {
  let currentExercises = [];
  let currentIndex = 0;
  let answers = [];
  let startTime = null;
  let timerInterval = null;

  const start = (exercises, containerId) => {
    currentExercises = exercises;
    currentIndex = 0;
    answers = [];
    startTime = Date.now();
    renderQuestion(containerId);
    startTimer(containerId);
  };

  const startTimer = (containerId) => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      const el = document.querySelector(`#${containerId} .exercise-timer`);
      if (el) el.textContent = `⏱ ${m}:${s}`;
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
  };

  const renderQuestion = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ex = currentExercises[currentIndex];
    const total = currentExercises.length;
    const num = currentIndex + 1;

    const typeNames = {
      'trac-nghiem': '📝 Trắc nghiệm',
      'keo-tha': '🖐 Kéo thả',
      'noi-cot': '🔗 Nối cột',
      'sap-xep': '📋 Sắp xếp',
      'tu-luan': '✍️ Tự luận ngắn'
    };

    let questionHtml = '';
    switch (ex.dang) {
      case 'trac-nghiem':
        questionHtml = renderMultipleChoice(ex);
        break;
      case 'keo-tha':
        questionHtml = renderDragDrop(ex);
        break;
      case 'noi-cot':
        questionHtml = renderMatching(ex);
        break;
      case 'sap-xep':
        questionHtml = renderSorting(ex);
        break;
      case 'tu-luan':
        questionHtml = renderShortAnswer(ex);
        break;
    }

    container.innerHTML = `
      <div class="exercise-container animate-fadeIn">
        <div class="exercise-header">
          <span class="exercise-type-badge">${typeNames[ex.dang] || ex.dang}</span>
          <span class="exercise-progress">Câu ${num}/${total}</span>
        </div>
        <div class="question-text">${ex.cauHoi}</div>
        ${ex.hinhAnh ? `<div class="question-image"><img src="${ex.hinhAnh}" alt="Hình minh họa" onerror="this.parentElement.style.display='none'"></div>` : ''}
        <div class="question-body">${questionHtml}</div>
        <div class="exercise-footer">
          <span class="exercise-timer">⏱ 00:00</span>
          <div style="display:flex; gap:10px;">
            ${currentIndex > 0 ? '<button class="btn btn-secondary btn-sm" onclick="Exercises.prev(\'' + containerId + '\')">⬅ Trước</button>' : ''}
            ${currentIndex < total - 1
        ? '<button class="btn btn-primary btn-sm" onclick="Exercises.next(\'' + containerId + '\')">Tiếp ➡</button>'
        : '<button class="btn btn-success btn-sm" onclick="Exercises.submit(\'' + containerId + '\')">✅ Nộp bài</button>'
      }
          </div>
        </div>
      </div>
    `;

    // Initialize drag-drop or sorting
    if (ex.dang === 'keo-tha') initDragDrop(container);
    if (ex.dang === 'sap-xep') initSorting(container);
    if (ex.dang === 'noi-cot') initMatching(container);
  };

  // ---- Multiple Choice ----
  const renderMultipleChoice = (ex) => {
    const data = typeof ex.duLieu === 'string' ? JSON.parse(ex.duLieu) : ex.duLieu;
    const options = ['A', 'B', 'C', 'D'];
    const selected = answers[currentIndex] || '';
    return `<div class="mc-options">
      ${options.map(opt => `
        <div class="mc-option ${selected === opt ? 'selected' : ''}" onclick="Exercises.selectMC('${opt}')">
          <span class="option-letter">${opt}</span>
          <span>${data['dapAn' + opt] || ''}</span>
        </div>
      `).join('')}
    </div>`;
  };

  const selectMC = (opt) => {
    answers[currentIndex] = opt;
    document.querySelectorAll('.mc-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.mc-option')[['A', 'B', 'C', 'D'].indexOf(opt)]?.classList.add('selected');
    document.querySelectorAll('.mc-option')[['A', 'B', 'C', 'D'].indexOf(opt)]?.querySelector('.option-letter')?.classList.add('selected');
  };

  // ---- Drag & Drop ----
  const renderDragDrop = (ex) => {
    const data = typeof ex.duLieu === 'string' ? JSON.parse(ex.duLieu) : ex.duLieu;
    const items = data.items || [];
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return `
      <div class="drag-drop-zone" id="drag-source">
        ${shuffled.map((item, i) => `
          <div class="drag-item" draggable="true" data-value="${item}" data-index="${i}">${item}</div>
        `).join('')}
      </div>
      <p style="text-align:center; font-weight:700; color:var(--text-medium); margin: 12px 0;">⬇ Kéo vào ô bên dưới theo đúng thứ tự ⬇</p>
      <div class="drop-zone" id="drop-target"></div>
    `;
  };

  const initDragDrop = (container) => {
    const items = container.querySelectorAll('.drag-item');
    const dropZone = container.querySelector('#drop-target');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.dataset.value);
        e.target.classList.add('dragging');
      });
      item.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
      item.addEventListener('click', () => {
        // Mobile: tap to move
        const clone = item.cloneNode(true);
        clone.addEventListener('click', () => {
          item.style.display = '';
          clone.remove();
          updateDragAnswer(container);
        });
        dropZone.appendChild(clone);
        item.style.display = 'none';
        updateDragAnswer(container);
      });
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('over');
      const value = e.dataTransfer.getData('text/plain');
      const sourceItem = container.querySelector(`.drag-item[data-value="${value}"]`);
      if (sourceItem && sourceItem.parentElement.id === 'drag-source') {
        const clone = sourceItem.cloneNode(true);
        clone.addEventListener('click', () => {
          sourceItem.style.display = '';
          clone.remove();
          updateDragAnswer(container);
        });
        dropZone.appendChild(clone);
        sourceItem.style.display = 'none';
        updateDragAnswer(container);
      }
    });
  };

  const updateDragAnswer = (container) => {
    const dropped = container.querySelectorAll('#drop-target .drag-item');
    answers[currentIndex] = Array.from(dropped).map(el => el.dataset.value);
  };

  // ---- Matching ----
  const renderMatching = (ex) => {
    const data = typeof ex.duLieu === 'string' ? JSON.parse(ex.duLieu) : ex.duLieu;
    const cotA = data.cotA || [];
    const cotB = [...(data.cotB || [])].sort(() => Math.random() - 0.5);
    return `
      <div class="matching-container">
        <div class="matching-col" id="match-left">
          ${cotA.map((item, i) => `
            <div class="matching-item" data-side="left" data-value="${item}" data-index="${i}">${item}</div>
          `).join('')}
        </div>
        <div class="matching-lines">↔</div>
        <div class="matching-col" id="match-right">
          ${cotB.map((item, i) => `
            <div class="matching-item" data-side="right" data-value="${item}" data-index="${i}">${item}</div>
          `).join('')}
        </div>
      </div>
      <div id="match-pairs" style="margin-top:14px; text-align:center; font-size:0.85rem; color:var(--text-medium);"></div>
    `;
  };

  let matchSelection = { left: null, right: null };
  let matchPairs = {};

  const initMatching = (container) => {
    matchSelection = { left: null, right: null };
    matchPairs = {};
    answers[currentIndex] = {};

    container.querySelectorAll('.matching-item').forEach(item => {
      item.addEventListener('click', () => {
        const side = item.dataset.side;
        const value = item.dataset.value;

        // Deselect same side
        container.querySelectorAll(`.matching-item[data-side="${side}"]`).forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        matchSelection[side] = value;

        // If both selected, make a pair
        if (matchSelection.left && matchSelection.right) {
          matchPairs[matchSelection.left] = matchSelection.right;

          // Mark matched
          container.querySelectorAll('.matching-item').forEach(el => {
            if (el.dataset.value === matchSelection.left || el.dataset.value === matchSelection.right) {
              el.classList.remove('selected');
              el.classList.add('matched');
            }
          });

          answers[currentIndex] = { ...matchPairs };

          // Show pairs
          const pairsEl = container.querySelector('#match-pairs');
          if (pairsEl) {
            pairsEl.innerHTML = Object.entries(matchPairs).map(([k, v]) =>
              `<span class="tag tag-green" style="margin:4px;">${k} ↔ ${v}</span>`
            ).join('');
          }

          matchSelection = { left: null, right: null };
        }
      });
    });
  };

  // ---- Sorting ----
  const renderSorting = (ex) => {
    const data = typeof ex.duLieu === 'string' ? JSON.parse(ex.duLieu) : ex.duLieu;
    const items = [...(data.items || [])].sort(() => Math.random() - 0.5);
    return `
      <div class="sort-list" id="sort-list">
        ${items.map((item, i) => `
          <div class="sort-item" draggable="true" data-value="${item}" data-index="${i}">
            <span class="sort-handle">☰</span>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
      <p style="text-align:center; margin-top:10px; font-size:0.82rem; color:var(--text-medium);">
        Kéo thả hoặc click ▲▼ để sắp xếp
      </p>
    `;
  };

  const initSorting = (container) => {
    const list = container.querySelector('#sort-list');
    if (!list) return;

    let draggedItem = null;

    list.querySelectorAll('.sort-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        updateSortAnswer(list);
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== item) {
          const rect = item.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          if (e.clientY < mid) {
            list.insertBefore(draggedItem, item);
          } else {
            list.insertBefore(draggedItem, item.nextSibling);
          }
        }
      });
    });

    updateSortAnswer(list);
  };

  const updateSortAnswer = (list) => {
    const items = list.querySelectorAll('.sort-item');
    answers[currentIndex] = Array.from(items).map(el => el.dataset.value);
  };

  // ---- Short Answer ----
  const renderShortAnswer = (ex) => {
    const prevAnswer = answers[currentIndex] || '';
    return `
      <input type="text" class="short-answer-input" placeholder="Nhập câu trả lời của em..." 
        value="${prevAnswer}" oninput="Exercises.updateShortAnswer(this.value)">
    `;
  };

  const updateShortAnswer = (val) => {
    answers[currentIndex] = val;
  };

  // ---- Navigation ----
  const next = (containerId) => {
    if (currentIndex < currentExercises.length - 1) {
      currentIndex++;
      renderQuestion(containerId);
    }
  };

  const prev = (containerId) => {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion(containerId);
    }
  };

  // ---- Submit & Grade ----
  const submit = (containerId) => {
    stopTimer();
    const results = currentExercises.map((ex, i) => {
      const data = typeof ex.duLieu === 'string' ? JSON.parse(ex.duLieu) : ex.duLieu;
      const answer = answers[i];
      let correct = false;

      switch (ex.dang) {
        case 'trac-nghiem':
          correct = answer === data.dapAnDung;
          break;
        case 'keo-tha':
          correct = JSON.stringify(answer) === JSON.stringify(data.dapAnDung);
          break;
        case 'noi-cot':
          correct = answer && data.dapAnDung && JSON.stringify(answer) === JSON.stringify(data.dapAnDung);
          break;
        case 'sap-xep':
          correct = JSON.stringify(answer) === JSON.stringify(data.dapAnDung);
          break;
        case 'tu-luan':
          correct = answer && data.dapAnDung &&
            answer.trim().toLowerCase() === data.dapAnDung.trim().toLowerCase();
          break;
      }

      return {
        cauHoi: ex.cauHoi,
        dang: ex.dang,
        cauTraLoi: answer,
        dapAnDung: data.dapAnDung,
        dungSai: correct,
        diemDat: correct ? (ex.diem || 10) : 0,
        giaiThich: data.giaiThich || ''
      };
    });

    const totalScore = results.reduce((sum, r) => sum + r.diemDat, 0);
    const maxScore = currentExercises.reduce((sum, ex) => sum + (ex.diem || 10), 0);
    const pct = Math.round((totalScore / maxScore) * 100);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    const emoji = pct >= 80 ? '🌟' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚';
    const text = pct >= 80 ? 'Xuất sắc! Giỏi lắm!' : pct >= 60 ? 'Tốt lắm! Cố gắng thêm nhé!' : pct >= 40 ? 'Cố gắng hơn nữa nhé!' : 'Cần ôn tập thêm, em ơi!';
    const xp = Math.round(pct * 0.5);

    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="exercise-container">
        <div class="result-feedback">
          <div class="result-emoji">${emoji}</div>
          <div class="result-score">${totalScore}/${maxScore}</div>
          <div class="result-text">${text}</div>
          <div class="xp-earned">⭐ +${xp} XP</div>
        </div>
        <div style="margin-top: 28px;">
          <div class="section-header">
            <h2>📋 Chi tiết từng câu</h2>
          </div>
          ${results.map((r, i) => `
            <div class="question-result ${r.dungSai ? 'correct-result' : 'incorrect-result'}">
              <div class="qr-header">
                <span class="qr-question">Câu ${i + 1}: ${r.cauHoi}</span>
                <span class="tag ${r.dungSai ? 'tag-green' : 'tag-red'}">${r.dungSai ? '✓ Đúng' : '✗ Sai'}</span>
              </div>
              <div class="qr-details">
                <div>Trả lời: <strong>${formatAnswer(r.cauTraLoi)}</strong></div>
                <div>Đáp án đúng: <strong>${formatAnswer(r.dapAnDung)}</strong></div>
                ${r.giaiThich ? `<div style="margin-top:6px; color:var(--primary); font-weight:600;">💡 ${r.giaiThich}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center; margin-top:24px;">
          <button class="btn btn-primary" onclick="App.navigateTo('subjects')">📚 Quay lại môn học</button>
        </div>
      </div>
    `;

    // Save results to state
    if (typeof App !== 'undefined' && App.saveExerciseResult) {
      App.saveExerciseResult(results, totalScore, maxScore, elapsed, xp);
    }
  };

  const formatAnswer = (ans) => {
    if (!ans) return '(chưa trả lời)';
    if (Array.isArray(ans)) return ans.join(' → ');
    if (typeof ans === 'object') return Object.entries(ans).map(([k, v]) => `${k}↔${v}`).join(', ');
    return ans;
  };

  return {
    start, next, prev, submit,
    selectMC, updateShortAnswer
  };
})();
