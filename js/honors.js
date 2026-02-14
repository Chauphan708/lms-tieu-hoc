/* ============================================
   Honors Module — Bảng Tuyên Dương Tuần/Tháng
   Dữ liệu được tổng hợp từ kết quả làm bài (results)
   và danh sách tuyên dương thủ công (honors)
   ============================================ */

const Honors = (() => {

    // ---- Lấy ngày đầu tuần (Thứ 2) và cuối tuần (CN) ----
    const getWeekRange = (date = new Date()) => {
        const d = new Date(date);
        const day = d.getDay();
        const diffToMon = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { start: monday, end: sunday };
    };

    // ---- Lấy ngày đầu tháng và cuối tháng ----
    const getMonthRange = (date = new Date()) => {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    };

    // ---- Tổng hợp top N học sinh theo khoảng thời gian ----
    const getTopStudents = (state, range, n = 5) => {
        const { start, end } = range;
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // Lọc kết quả trong khoảng thời gian
        const filteredResults = state.results.filter(r => {
            const d = r.ngayLam;
            return d >= startStr && d <= endStr;
        });

        // Tổng hợp theo học sinh
        const studentMap = {};
        filteredResults.forEach(r => {
            if (!studentMap[r.hocSinhId]) {
                studentMap[r.hocSinhId] = { totalScore: 0, totalCorrect: 0, totalDone: 0 };
            }
            studentMap[r.hocSinhId].totalScore += r.diemDat;
            studentMap[r.hocSinhId].totalCorrect += r.dungSai ? 1 : 0;
            studentMap[r.hocSinhId].totalDone += 1;
        });

        // Sắp xếp và lấy top N
        return Object.entries(studentMap)
            .map(([id, data]) => {
                const user = state.users.find(u => u.id === id);
                if (!user) return null;
                return {
                    id,
                    hoTen: user.hoTen,
                    avatar: user.avatar || '😊',
                    lop: user.lop || '',
                    ...data,
                    accuracy: data.totalDone ? Math.round((data.totalCorrect / data.totalDone) * 100) : 0
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, n);
    };

    // ---- Render bảng tuyên dương ----
    const renderHonorsBoard = (container, state, currentUser, callbacks) => {
        const weekRange = getWeekRange();
        const monthRange = getMonthRange();
        const weeklyTop = getTopStudents(state, weekRange, 5);
        const monthlyTop = getTopStudents(state, monthRange, 5);
        const isTA = currentUser.role === 'gv' || currentUser.role === 'admin';

        // Tuyên dương thủ công
        const manualHonors = (state.honors || []).sort((a, b) =>
            new Date(b.thoiGian) - new Date(a.thoiGian)
        );

        const weekLabel = `${weekRange.start.toLocaleDateString('vi-VN')} — ${weekRange.end.toLocaleDateString('vi-VN')}`;
        const monthLabel = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

        container.innerHTML = `
      <div class="header-bar">
        <h1>🏅 Bảng Tuyên Dương</h1>
        ${isTA ? '<button class="btn btn-primary btn-sm" onclick="Honors.showAddHonorModal()">+ Tuyên dương HS</button>' : ''}
      </div>

      <!-- Tabs -->
      <div class="honors-tabs animate-fadeIn">
        <button class="honors-tab active" onclick="Honors.switchTab('tuan', this)">📅 Tuần này</button>
        <button class="honors-tab" onclick="Honors.switchTab('thang', this)">📆 Tháng này</button>
        <button class="honors-tab" onclick="Honors.switchTab('manual', this)">🌟 Tuyên dương đặc biệt</button>
      </div>

      <!-- Tab: Tuần -->
      <div class="honors-tab-content active" id="honors-tab-tuan">
        <div class="honors-period-label">📅 Tuần: ${weekLabel}</div>
        ${weeklyTop.length ? renderPodium(weeklyTop) : '<div class="empty-state"><div class="empty-emoji">📭</div><h3>Chưa có dữ liệu tuần này</h3><p>Các em hãy cố gắng làm bài tập nhé!</p></div>'}
        ${weeklyTop.length > 3 ? renderRankingTable(weeklyTop.slice(3)) : ''}
      </div>

      <!-- Tab: Tháng -->
      <div class="honors-tab-content" id="honors-tab-thang">
        <div class="honors-period-label">📆 ${monthLabel}</div>
        ${monthlyTop.length ? renderPodium(monthlyTop) : '<div class="empty-state"><div class="empty-emoji">📭</div><h3>Chưa có dữ liệu tháng này</h3><p>Các em hãy cố gắng làm bài tập nhé!</p></div>'}
        ${monthlyTop.length > 3 ? renderRankingTable(monthlyTop.slice(3)) : ''}
      </div>

      <!-- Tab: Tuyên dương thủ công -->
      <div class="honors-tab-content" id="honors-tab-manual">
        ${manualHonors.length ? `
          <div class="honors-manual-grid">
            ${manualHonors.map(h => {
            const student = state.users.find(u => u.id === h.hocSinhId);
            const creator = state.users.find(u => u.id === h.createdBy);
            return `
                <div class="honor-card animate-fadeIn">
                  <div class="honor-card-badge">${h.loai === 'tuan' ? '📅 Tuần' : '📆 Tháng'}</div>
                  <div class="honor-card-avatar">${student ? student.avatar : '😊'}</div>
                  <div class="honor-card-name">${student ? student.hoTen : 'Không rõ'}</div>
                  <div class="honor-card-title">🏆 ${h.tieuDe}</div>
                  <div class="honor-card-reason">${h.lyDo}</div>
                  <div class="honor-card-meta">
                    <span>📅 ${h.thoiGian}</span>
                    ${creator ? `<span>👩‍🏫 ${creator.hoTen}</span>` : ''}
                  </div>
                  ${isTA ? `<button class="btn btn-danger btn-sm honor-delete" onclick="Honors.deleteHonor('${h.id}')">🗑</button>` : ''}
                </div>`;
        }).join('')}
          </div>
        ` : '<div class="empty-state"><div class="empty-emoji">🌟</div><h3>Chưa có tuyên dương đặc biệt</h3></div>'}
      </div>

      <div id="honors-modal-area"></div>
    `;
    };

    // ---- Render bục vinh danh (podium) ----
    const renderPodium = (students) => {
        const top3 = students.slice(0, 3);
        // Sắp xếp hiển thị: #2, #1, #3 (1 ở giữa)
        const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
        const medals = ['🥈', '🥇', '🥉'];
        const heights = ['120px', '160px', '100px'];
        const podiumColors = ['linear-gradient(180deg, #C0C0C0 0%, #A8A8A8 100%)', 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)', 'linear-gradient(180deg, #CD7F32 0%, #A0522D 100%)'];

        if (top3.length < 3) {
            // Nếu chưa đủ 3 HS, render danh sách đơn giản
            return `<div class="honors-simple-list">
        ${top3.map((s, i) => `
          <div class="honors-simple-item">
            <span class="honors-rank">${['🥇', '🥈', '🥉'][i]}</span>
            <span class="honors-avatar">${s.avatar}</span>
            <span class="honors-name">${s.hoTen}</span>
            <span class="honors-score">⭐ ${s.totalScore} điểm</span>
            <span class="honors-accuracy">${s.accuracy}% đúng</span>
          </div>
        `).join('')}
      </div>`;
        }

        return `
      <div class="podium-container animate-fadeIn">
        ${podiumOrder.map((s, i) => `
          <div class="podium-item podium-${i === 0 ? 'second' : i === 1 ? 'first' : 'third'}">
            <div class="podium-avatar-wrap">
              <div class="podium-medal">${medals[i]}</div>
              <div class="podium-avatar">${s.avatar}</div>
            </div>
            <div class="podium-name">${s.hoTen}</div>
            <div class="podium-class">${s.lop}</div>
            <div class="podium-score">⭐ ${s.totalScore} điểm</div>
            <div class="podium-accuracy">${s.accuracy}% đúng · ${s.totalDone} bài</div>
            <div class="podium-stand" style="height:${heights[i]}; background:${podiumColors[i]}">
              <span class="podium-rank">${i === 0 ? '2' : i === 1 ? '1' : '3'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    };

    // ---- Render bảng xếp hạng từ vị trí thứ 4 ----
    const renderRankingTable = (students) => {
        return `
      <div class="section-header" style="margin-top:24px;">
        <h2>📊 Bảng xếp hạng tiếp theo</h2>
      </div>
      <table class="data-table animate-fadeInUp">
        <thead><tr><th>Hạng</th><th></th><th>Họ tên</th><th>Lớp</th><th>Tổng điểm</th><th>Tỷ lệ đúng</th><th>Số bài</th></tr></thead>
        <tbody>${students.map((s, i) => `
          <tr>
            <td><strong>${i + 4}</strong></td>
            <td>${s.avatar}</td>
            <td><strong>${s.hoTen}</strong></td>
            <td>${s.lop}</td>
            <td>⭐ ${s.totalScore}</td>
            <td>${s.accuracy}%</td>
            <td>${s.totalDone}</td>
          </tr>
        `).join('')}</tbody>
      </table>
    `;
    };

    // ---- Chuyển tab ----
    const switchTab = (tabId, btn) => {
        document.querySelectorAll('.honors-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.honors-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(`honors-tab-${tabId}`);
        if (target) target.classList.add('active');
    };

    // ---- Modal thêm tuyên dương ----
    const showAddHonorModal = () => {
        const area = document.getElementById('honors-modal-area');
        if (!area) return;
        // Lấy danh sách HS từ App
        const students = (typeof App !== 'undefined' && App._getState)
            ? App._getState().users.filter(u => u.role === 'hs')
            : [];

        area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()">
        <div class="modal" onclick="event.stopPropagation()">
          <h2>🌟 Tuyên dương học sinh <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
          <div class="form-group">
            <label>🎓 Chọn học sinh</label>
            <select id="honor-student-select">
              ${students.map(s => `<option value="${s.id}">${s.avatar} ${s.hoTen} (${s.lop || 'N/A'})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>🏆 Tiêu đề tuyên dương</label>
            <input id="honor-title" placeholder="VD: Học sinh xuất sắc tuần 7">
          </div>
          <div class="form-group">
            <label>📝 Lý do</label>
            <input id="honor-reason" placeholder="VD: Đạt điểm cao nhất lớp">
          </div>
          <div class="form-group">
            <label>📅 Loại</label>
            <select id="honor-type">
              <option value="tuan">📅 Tuyên dương tuần</option>
              <option value="thang">📆 Tuyên dương tháng</option>
            </select>
          </div>
          <button class="btn btn-primary btn-full" onclick="Honors.addHonor()">🌟 Tuyên dương</button>
        </div>
      </div>
    `;
    };

    // ---- Thêm tuyên dương — gọi callback từ App ----
    const addHonor = () => {
        const studentId = document.getElementById('honor-student-select').value;
        const title = document.getElementById('honor-title').value.trim();
        const reason = document.getElementById('honor-reason').value.trim();
        const type = document.getElementById('honor-type').value;

        if (!title) { showToast('Vui lòng nhập tiêu đề', 'error'); return; }
        if (typeof App !== 'undefined' && App.addHonorEntry) {
            App.addHonorEntry(studentId, title, reason, type);
        }
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
    };

    // ---- Xóa tuyên dương ----
    const deleteHonor = (id) => {
        if (typeof App !== 'undefined' && App.deleteHonorEntry) {
            App.deleteHonorEntry(id);
        }
    };

    return {
        renderHonorsBoard, switchTab,
        showAddHonorModal, addHonor, deleteHonor,
        getWeekRange, getMonthRange, getTopStudents
    };
})();
