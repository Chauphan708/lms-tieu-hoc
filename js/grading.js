/* ============================================
   Grading Module - Chấm bài bằng AI
   ============================================ */

const Grading = (() => {

  // ---- Render Dashboard (Teacher) ----
  const renderTeacherGrading = (container, state, currentUser) => {
    const gradings = state.gradings || [];
    const classes = state.classes.filter(c => c.giaoVienId === currentUser.id);

    container.innerHTML = `
      <div class="header-bar">
        <h1>🖊️ Chấm bài AI</h1>
        <button class="btn btn-primary btn-sm" onclick="Grading.showGradingModal()">+ Chấm bài mới</button>
      </div>

      <!-- Filters (Optional - for now simple list) -->
      <div style="margin-bottom:16px;">
        <span style="color:var(--text-medium);">Danh sách bài đã chấm: <strong>${gradings.length}</strong> bài</span>
      </div>

      <!-- List -->
      <div class="grading-list animate-fadeIn">
        ${gradings.length ? gradings.map(g => renderGradingItem(g, state)).join('')
        : '<div class="empty-state"><div class="empty-emoji">📝</div><h3>Chưa có bài chấm nào</h3></div>'}
      </div>

      <div id="grading-modal-area"></div>
    `;
  };

  const renderGradingItem = (g, state) => {
    const student = state.users.find(u => u.id === g.studentId);
    const subject = state.subjects.find(s => s.tenMon === g.subject) || { icon: '📚', mauSac: '#ccc' }; // Fallback

    return `
      <div class="grading-card" onclick="Grading.showGradingDetail('${g.id}')" style="display:flex;align-items:center;padding:12px;background:white;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:8px;cursor:pointer;transition:all 0.2s;">
        <div style="width:40px;height:40px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:12px;">
           ${student ? student.avatar : '👤'}
        </div>
        <div style="flex:1;">
          <div style="font-weight:600;">${student ? student.hoTen : 'Học sinh?'} <span style="font-weight:normal;color:#666;font-size:0.9em;">(${g.subject})</span></div>
          <div style="font-size:0.85rem;color:var(--text-medium);">${new Date(g.timestamp).toLocaleString('vi-VN')}</div>
        </div>
        <div style="text-align:right;">
          ${g.score !== null ? `<span style="font-size:1.2rem;font-weight:bold;color:var(--primary);">${g.score}đ</span>` : '<span style="font-size:1.5rem;">👍</span>'}
          <button class="btn btn-danger btn-sm" style="margin-left:8px;" onclick="event.stopPropagation(); Grading.deleteGrading('${g.id}')">🗑</button>
        </div>
      </div>
    `;
  };

  // ---- Render Student View ----
  const renderStudentGrading = (container, state, currentUser) => {
    const myGradings = (state.gradings || []).filter(g => g.studentId === currentUser.id);

    container.innerHTML = `
      <div class="header-bar">
        <h1>📝 Kết quả học tập</h1>
      </div>

      <div class="grading-list animate-fadeIn">
        ${myGradings.length ? myGradings.map(g => renderGradingItem(g, state)).join('')
        : '<div class="empty-state"><div class="empty-emoji">🎒</div><h3>Chưa có bài được chấm</h3></div>'}
      </div>
       <div id="grading-modal-area"></div>
    `;
  };

  // ---- Show Detail Modal ----
  const showGradingDetail = (gradingId) => {
    // Need access to state. Can pass via function or assume App.state is available globally or passed down.
    // Better to fetch from App if possible, but module should be somewhat standalone.
    // Let's rely on App calling a setup or passing state implicitly via `render`. 
    // But for click handlers, we need state access. 
    // Simple solution: Access `App.state` if available, or store local reference.
    if (typeof App === 'undefined') return;
    const state = App.state;
    const g = state.gradings.find(x => x.id === gradingId);
    if (!g) return;

    const area = document.getElementById('grading-modal-area');
    area.innerHTML = `
           <div class="modal-overlay show" onclick="this.remove()">
             <div class="modal" onclick="event.stopPropagation()" style="max-width:600px;max-height:90vh;overflow-y:auto;">
                <h2>📝 Chi tiết bài chấm <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
                
                <img src="${g.imageUrl}" style="max-width:100%;border-radius:8px;border:1px solid #ddd;margin-bottom:16px;">
                
                ${g.score !== null ? `<div style="text-align:center;font-size:2rem;font-weight:bold;color:var(--primary);margin-bottom:16px;">${g.score} điểm</div>` : ''}
                
                <div class="form-group">
                   <label>💬 Nhận xét</label>
                   <div style="background:#f9f9f9;padding:12px;border-radius:8px;">${g.feedback}</div>
                </div>

                ${g.suggestions && g.suggestions.length ? `
                <div class="form-group">
                   <label>💡 Gợi ý / Sửa lỗi</label>
                   <ul style="padding-left:20px;margin-top:4px;">
                      ${g.suggestions.map(s => `<li>${s}</li>`).join('')}
                   </ul>
                </div>` : ''}

             </div>
           </div>`;
  };

  // ---- Show Grading Modal (Creation) ----
  const showGradingModal = () => {
    if (typeof App === 'undefined') return;
    const state = App.state;

    const classes = state.classes; // Admin sees all? Let's assume Teacher for now as per req.
    // Assuming logged in as Teacher
    // We need to pick Class -> Student

    const modalHtml = `
      <div class="modal-overlay show" onclick="this.remove()">
        <div class="modal" onclick="event.stopPropagation()" style="max-width:700px">
          <h2>🖊️ Chấm bài mới <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
             <div class="form-group">
                <label>Lớp học</label>
                <select id="grade-class-select" onchange="Grading.onClassChange()">
                   <option value="">-- Chọn lớp --</option>
                   ${classes.map(c => `<option value="${c.id}">${c.tenLop}</option>`).join('')}
                </select>
             </div>
             <div class="form-group">
                <label>Học sinh</label>
                <select id="grade-student-select" disabled>
                   <option value="">-- Chọn HS --</option>
                </select>
             </div>
          </div>

          <div class="form-group">
             <label>Môn học</label>
            <input id="grade-subject" placeholder="VD: Toán, Tiếng Việt">
          </div>
          
           <div class="form-group">
             <label>📸 Ảnh bài làm</label>
             <input type="file" id="grade-file-input" accept="image/*" onchange="Grading.handleImagePreview(this)">
             <div id="grade-image-preview-area" style="margin-top:8px;text-align:center;min-height:100px;border:2px dashed #ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:#aaa;">Preview ảnh tại đây</span>
             </div>
          </div>
          
          <div class="form-group">
              <label>⚙️ Tùy chọn chấm</label>
              <div style="display:flex;gap:16px;">
                  <label style="cursor:pointer;"><input type="radio" name="grade-mode" value="score" checked> Ghi điểm (0-10)</label>
                  <label style="cursor:pointer;"><input type="radio" name="grade-mode" value="comment"> Chỉ nhận xét</label>
              </div>
          </div>

          <div class="form-group">
             <label>📝 Ghi chú thêm cho AI (Tùy chọn)</label>
             <textarea id="grade-notes" rows="2" placeholder="VD: Chú ý lỗi chính tả, bỏ qua bài 3..."></textarea>
          </div>

          <div style="display:flex;gap:12px;margin-bottom:16px;">
             <button class="btn btn-primary btn-full" onclick="Grading.analyzeWithAI()" id="btn-analyze-ai">🤖 Phân tích (AI)</button>
          </div>

          <!-- Result Area -->
          <div id="grading-result-form" style="display:none;border-top:1px solid #eee;padding-top:16px;">
             <div class="form-group" id="grade-score-group">
                <label>Điểm số</label>
                <input type="number" id="grade-result-score" step="0.5" max="10">
             </div>
             <div class="form-group">
                <label>Nhận xét</label>
                <textarea id="grade-result-feedback" rows="3"></textarea>
             </div>
             <div class="form-group">
                <label>Gợi ý / Sửa lỗi (Mỗi dòng 1 ý)</label>
                <textarea id="grade-result-suggestions" rows="3"></textarea>
             </div>
             <button class="btn btn-success btn-full" onclick="Grading.saveGrading()">💾 Lưu kết quả</button>
          </div>

        </div>
      </div>`;

    const area = document.getElementById('grading-modal-area');
    area.innerHTML = modalHtml;
  };

  const onClassChange = () => {
    const classId = document.getElementById('grade-class-select').value;
    const studentSelect = document.getElementById('grade-student-select');

    if (!classId) {
      studentSelect.innerHTML = '<option value="">-- Chọn HS --</option>';
      studentSelect.disabled = true;
      return;
    }

    // Get students in this class
    // Need to access App.getStudentsInClass logic. 
    // We can replicate logic: search state.classStudents, then map to users.
    const state = App.state;
    const studentIds = state.classStudents.filter(cs => cs.classId === classId).map(cs => cs.studentId);
    const students = state.users.filter(u => studentIds.includes(u.id) && u.role === 'hs');

    studentSelect.innerHTML = '<option value="">-- Chọn HS --</option>' +
      students.map(s => `<option value="${s.id}">${s.hoTen} (${s.username})</option>`).join('');
    studentSelect.disabled = false;
  };

  let currentBase64Image = null; // Store for submission

  const handleImagePreview = (input) => {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        currentBase64Image = e.target.result; // Data URL
        document.getElementById('grade-image-preview-area').innerHTML = `
                   <img src="${currentBase64Image}" style="max-width:100%;max-height:300px;border-radius:4px;">
                `;
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  const analyzeWithAI = async () => {
    if (!currentBase64Image) { showToast('Vui lòng chọn ảnh bài làm!', 'error'); return; }

    const studentId = document.getElementById('grade-student-select').value;
    const subject = document.getElementById('grade-subject').value;
    if (!studentId || !subject) { showToast('Vui lòng chọn HS và nhập môn học', 'error'); return; }

    const mode = document.querySelector('input[name="grade-mode"]:checked').value;
    const includeScore = (mode === 'score');
    const notes = document.getElementById('grade-notes').value;
    const state = App.state;
    const student = state.users.find(u => u.id === studentId);

    const btn = document.getElementById('btn-analyze-ai');
    const originalText = btn.innerText;
    btn.innerText = '⏳ Đang phân tích...';
    btn.disabled = true;

    // Strip data:image/...;base64, prefix for Gemini API
    const base64Data = currentBase64Image.split(',')[1];

    const result = await AI.analyzeImage(base64Data, {
      subject: subject,
      studentName: student ? student.hoTen : 'Học sinh',
      includeScore: includeScore,
      additionalNotes: notes
    });

    btn.innerText = originalText;
    btn.disabled = false;

    if (result) {
      document.getElementById('grading-result-form').style.display = 'block';

      if (includeScore) {
        document.getElementById('grade-score-group').style.display = 'block';
        document.getElementById('grade-result-score').value = result.diem || '';
      } else {
        document.getElementById('grade-score-group').style.display = 'none';
        document.getElementById('grade-result-score').value = '';
      }

      document.getElementById('grade-result-feedback').value = result.nhanXet || '';
      document.getElementById('grade-result-suggestions').value = (result.goiY || []).join('\n');

      // Auto scroll to result
      document.getElementById('grading-result-form').scrollIntoView({ behavior: 'smooth' });
    }
  };

  const saveGrading = () => {
    const studentId = document.getElementById('grade-student-select').value;
    const subject = document.getElementById('grade-subject').value;
    const mode = document.querySelector('input[name="grade-mode"]:checked').value;

    const scoreVal = document.getElementById('grade-result-score').value;
    const score = (mode === 'score' && scoreVal !== '') ? parseFloat(scoreVal) : null;

    const feedback = document.getElementById('grade-result-feedback').value;
    const suggestionsText = document.getElementById('grade-result-suggestions').value;
    const suggestions = suggestionsText.split('\n').filter(s => s.trim() !== '');

    if (typeof App !== 'undefined' && App.createGradingEntry) {
      App.createGradingEntry({
        studentId, subject, imageUrl: currentBase64Image,
        score, feedback, suggestions
      });
    }

    document.querySelector('.modal-overlay').remove();
  };

  const deleteGrading = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài chấm này? Ảnh bài làm sẽ bị xóa vĩnh viễn.')) {
      if (typeof App !== 'undefined' && App.deleteGradingEntry) {
        App.deleteGradingEntry(id);
      }
    }
  };

  return {
    renderTeacherGrading, renderStudentGrading,
    showGradingModal, showGradingDetail,
    onClassChange, handleImagePreview, analyzeWithAI, saveGrading,
    deleteGrading
  };

})();
