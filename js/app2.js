/* ============================================
   App.js Part 2 - Main App Module
   ============================================ */

const App = (() => {
  let currentUser = null;
  let currentPage = 'dashboard';
  let state = { users: [], subjects: [], lessons: [], exercises: [], results: [], rewards: [], assignments: [], schoolYears: [], classes: [], classStudents: [], honors: [], posts: [], comments: [] };
  let selectedClassId = null;
  let selectedYearId = null;

  const init = async () => {
    // Always load demo data first as fallback
    loadDemoData();
    // Try loading from local storage (persistence for demo mode)
    loadStateFromLocal();

    // Then try Supabase
    try {
      const connected = API.initSupabase();
      if (connected) {
        const data = await API.loadAllData();
        if (data && data.users && data.users.length > 0) {
          state = data;
          console.log('✅ Connected to Supabase');
        } else {
          console.log('⚠️ Supabase connected but no data, using demo/local');
        }
      } else {
        console.log('📦 Using demo/local data (no Supabase credentials)');
      }
    } catch (err) {
      console.warn('Supabase init error, using demo:', err);
    }

    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'lms_state_v2') {
        console.log('🔄 Data changed in another tab, reloading...');
        loadStateFromLocal();
        if (currentPage === 'bulletin') renderBulletinPage(document.getElementById('main-content'));
        if (currentPage === 'honors') renderHonorsPage(document.getElementById('main-content'));
        if (currentUser) navigateTo(currentPage);
      }
    });

    // Check login
    const savedUser = localStorage.getItem('lms_user');
    if (savedUser) { currentUser = JSON.parse(savedUser); showApp(); }
  };

  const loadDemoData = () => {
    state.users = [...DEMO.users];
    state.subjects = [...DEMO.subjects];
    state.lessons = [...DEMO.lessons];
    state.exercises = [...DEMO.exercises];
    state.results = [...DEMO.results];
    state.rewards = [...DEMO.rewards];
    state.assignments = [...(DEMO.assignments || [])];
    state.schoolYears = [...(DEMO.schoolYears || [])];
    state.classes = [...(DEMO.classes || [])];
    state.classStudents = [...(DEMO.classStudents || [])];
    state.honors = [...(DEMO.honors || [])];
    state.posts = [...(DEMO.posts || [])];
    state.comments = [...(DEMO.comments || [])];
    // Auto-select active year
    const activeYear = state.schoolYears.find(y => y.trangThai === 'active');
    if (activeYear) selectedYearId = activeYear.id;
  };

  // ---- Local Storage Persistence (for Demo Mode) ----
  const saveStateToLocal = () => {
    if (API.isConnected()) return; // Don't save if using Supabase
    localStorage.setItem('lms_state_v2', JSON.stringify(state));
  };

  const loadStateFromLocal = () => {
    const saved = localStorage.getItem('lms_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed }; // Merge to ensure all keys exist
        console.log('📂 Loaded state from localStorage');
        return true;
      } catch (e) {
        console.error('Error loading local state:', e);
        return false;
      }
    }
    return false;
  };

  const reloadFromSupabase = async () => {
    if (!API.isConnected()) return;
    const data = await API.loadAllData();
    if (data) { state = data; showToast('Đã đồng bộ dữ liệu! ✅', 'success'); }
  };

  // ---- Login ----
  const handleLogin = async (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    // Try Supabase login first, then demo
    let user = null;
    if (API.isConnected()) {
      user = await API.login(u, p);
    }
    if (!user) {
      user = state.users.find(x => x.username === u && x.password === p);
    }
    // Fallback: Check DEMO users if not found in current state (e.g. Supabase connected but empty)
    if (!user && typeof DEMO !== 'undefined') {
      const demoUser = DEMO.users.find(x => x.username === u && x.password === p);
      if (demoUser) {
        console.log('⚠️ Logging in with DEMO user. Switching to Demo Mode.');
        loadDemoData(); // Restore full demo state
        user = demoUser;
      }
    }
    if (user) {
      currentUser = user;
      localStorage.setItem('lms_user', JSON.stringify(user));
      document.querySelector('.login-error').classList.remove('show');
      showApp();
      showToast(`Chào mừng ${user.hoTen}! 🎉`, 'success');
    } else {
      document.querySelector('.login-error').classList.add('show');
    }
  };

  const logout = () => {
    currentUser = null;
    localStorage.removeItem('lms_user');
    document.querySelector('.login-page').style.display = 'flex';
    document.querySelector('.app-layout').classList.remove('active');
  };

  const showApp = () => {
    document.querySelector('.login-page').style.display = 'none';
    document.querySelector('.app-layout').classList.add('active');
    buildSidebar();
    navigateTo('dashboard');
  };

  // ---- Helper: role checks ----
  const isTeacherOrAdmin = () => currentUser.role === 'gv' || currentUser.role === 'admin';
  const isAdmin = () => currentUser.role === 'admin';

  // ---- Helper: get classes for current user ----
  const getMyClasses = () => {
    if (isAdmin()) return state.classes.filter(c => !selectedYearId || c.namHocId === selectedYearId);
    if (currentUser.role === 'gv') return state.classes.filter(c => c.giaoVienId === currentUser.id && (!selectedYearId || c.namHocId === selectedYearId));
    // HS: classes they belong to
    const myClassIds = state.classStudents.filter(cs => cs.studentId === currentUser.id).map(cs => cs.classId);
    return state.classes.filter(c => myClassIds.includes(c.id));
  };

  const getStudentsInClass = (classId) => {
    const studentIds = state.classStudents.filter(cs => cs.classId === classId).map(cs => cs.studentId);
    return state.users.filter(u => studentIds.includes(u.id) && u.role === 'hs');
  };

  // ---- Sidebar ----
  const buildSidebar = () => {
    const isTA = isTeacherOrAdmin();
    document.getElementById('sidebar-user-name').textContent = currentUser.hoTen;
    const roleLabels = { admin: '🛡️ Quản trị viên', gv: '👩‍🏫 Giáo viên', hs: `👨‍🎓 Học sinh` };
    document.getElementById('sidebar-user-role').textContent = roleLabels[currentUser.role] || '';
    document.getElementById('sidebar-avatar').textContent = currentUser.avatar || '😊';

    let navItems = [];
    if (isAdmin()) {
      navItems = [
        { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
        { id: 'bulletin', icon: '📢', label: 'Bảng tin' },
        { id: 'honors', icon: '🏅', label: 'Tuyên dương' },
        { id: 'classes', icon: '🏫', label: 'Quản lý lớp học' },
        { id: 'subjects', icon: '📚', label: 'Môn học & Bài học' },
        { id: 'create-exercise', icon: '🤖', label: 'Tạo bài tập (AI)' },
        { id: 'assignments', icon: '📋', label: 'Giao bài tập' },
        { id: 'assignments', icon: '📋', label: 'Giao bài tập' },
        { id: 'grading', icon: '🖊️', label: 'Chấm bài AI' },
        { id: 'games', icon: '🎮', label: 'Game Center' },
        { id: 'students', icon: '👨‍🎓', label: 'Quản lý học sinh' },
        { id: 'teachers', icon: '👩‍🏫', label: 'Quản lý giáo viên' },
        { id: 'school-years', icon: '📅', label: 'Năm học' },
        { id: 'analysis', icon: '📈', label: 'Phân tích lớp' },
        { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
      ];
    } else if (currentUser.role === 'gv') {
      navItems = [
        { id: 'dashboard', icon: '📊', label: 'Tổng quan' },
        { id: 'bulletin', icon: '📢', label: 'Bảng tin' },
        { id: 'honors', icon: '🏅', label: 'Tuyên dương' },
        { id: 'classes', icon: '🏫', label: 'Lớp học của tôi' },
        { id: 'subjects', icon: '📚', label: 'Môn học & Bài học' },
        { id: 'create-exercise', icon: '🤖', label: 'Tạo bài tập (AI)' },
        { id: 'assignments', icon: '📋', label: 'Giao bài tập' },
        { id: 'assignments', icon: '📋', label: 'Giao bài tập' },
        { id: 'grading', icon: '🖊️', label: 'Chấm bài AI' },
        { id: 'games', icon: '🎮', label: 'Game Center' },
        { id: 'students', icon: '👨‍🎓', label: 'Quản lý học sinh' },
        { id: 'analysis', icon: '📈', label: 'Phân tích lớp' },
        { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
      ];
    } else {
      navItems = [
        { id: 'dashboard', icon: '🏠', label: 'Trang chủ' },
        { id: 'bulletin', icon: '📢', label: 'Bảng tin' },
        { id: 'honors', icon: '🏅', label: 'Tuyên dương' },
        { id: 'assignments', icon: '📋', label: 'Bài tập được giao' },
        { id: 'grading', icon: '📝', label: 'Kết quả học tập' },
        { id: 'subjects', icon: '📚', label: 'Môn học' },
        { id: 'progress', icon: '📈', label: 'Tiến độ' },
        { id: 'rewards', icon: '🏆', label: 'Điểm thưởng' },
        { id: 'settings', icon: '⚙️', label: 'Cài đặt' },
      ];
    }

    // Year selector for admin/gv
    let yearHtml = '';
    if (isTA && state.schoolYears.length > 0) {
      yearHtml = `<div class="sidebar-section"><label style="font-size:0.75rem;color:var(--text-light);margin-bottom:4px;display:block;">📅 Năm học</label>
        <select class="sidebar-select" onchange="App.selectYear(this.value)">
          ${state.schoolYears.map(y => `<option value="${y.id}" ${y.id === selectedYearId ? 'selected' : ''}>${y.ten} ${y.trangThai === 'archived' ? '(lưu trữ)' : ''}</option>`).join('')}
        </select></div>`;
    }

    // Class selector for admin/gv
    let classHtml = '';
    const myClasses = getMyClasses();
    if (isTA && myClasses.length > 0) {
      classHtml = `<div class="sidebar-section"><label style="font-size:0.75rem;color:var(--text-light);margin-bottom:4px;display:block;">🏫 Lớp đang chọn</label>
        <select class="sidebar-select" onchange="App.selectClass(this.value)">
          <option value="">-- Tất cả lớp --</option>
          ${myClasses.map(c => `<option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>${c.tenLop}</option>`).join('')}
        </select></div>`;
    }

    document.getElementById('nav-items').innerHTML = yearHtml + classHtml +
      navItems.map(n =>
        `<div class="nav-item ${n.id === currentPage ? 'active' : ''}" onclick="App.navigateTo('${n.id}')">
          <span class="nav-icon">${n.icon}</span><span>${n.label}</span>
        </div>`
      ).join('');
  };

  const selectYear = (yearId) => {
    selectedYearId = yearId;
    selectedClassId = null; // reset class when year changes
    buildSidebar();
    navigateTo(currentPage);
  };

  const selectClass = (classId) => {
    selectedClassId = classId || null;
    navigateTo(currentPage);
  };

  // ---- Navigation ----
  const navigateTo = (page) => {
    currentPage = page;
    buildSidebar();
    const main = document.getElementById('main-content');
    const isTA = isTeacherOrAdmin();

    switch (page) {
      case 'dashboard': isTA ? renderTeacherDashboard(main) : renderStudentDashboard(main); break;
      case 'bulletin': renderBulletinPage(main); break;
      case 'honors': renderHonorsPage(main); break;
      case 'subjects': renderSubjects(main); break;
      case 'create-exercise': renderCreateExerciseWithUpload(main); break;
      case 'assignments': isTA ? renderTeacherAssignments(main) : renderStudentAssignments(main); break;
      case 'students': renderStudentManager(main); break;
      case 'classes': renderClassManager(main); break;
      case 'teachers': if (isAdmin()) renderTeacherManager(main); break;
      case 'school-years': if (isAdmin()) renderSchoolYearManager(main); break;
      case 'grading':
        if (isTeacherOrAdmin()) Grading.renderTeacherGrading(main, state, currentUser);
        else Grading.renderStudentGrading(main, state, currentUser);
        break;
      case 'games':
        Games.renderGameCenter(main, state, currentUser);
        break;
      case 'analysis': renderClassAnalysis(main); break;
      case 'settings': renderSettings(main); break;
      default: renderStudentDashboard(main);
    }
  };

  // ---- Student Dashboard ----
  const renderStudentDashboard = (el) => {
    const myResults = state.results.filter(r => r.hocSinhId === currentUser.id);
    const totalDone = myResults.length;
    const correctCount = myResults.filter(r => r.dungSai).length;
    const avgPct = totalDone ? Math.round((correctCount / totalDone) * 100) : 0;
    const dates = myResults.map(r => r.ngayLam);
    const streak = Gamification.calcStreak(dates);
    const xp = myResults.reduce((s, r) => s + r.diemDat, 0) + (streak * 5);
    const levelInfo = Gamification.getLevel(xp);

    el.innerHTML = `
      <div class="header-bar">
        <h1>Chào ${currentUser.hoTen}! ${currentUser.avatar}</h1>
        <div class="header-right">
          <span class="streak-badge">🔥 ${streak} ngày</span>
          <span class="xp-badge">⭐ ${xp} XP · Lv${levelInfo.level}</span>
        </div>
      </div>
      <div class="stats-row animate-fadeIn">
        <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${totalDone}</div><div class="stat-label">Bài đã làm</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${avgPct}%</div><div class="stat-label">Tỷ lệ đúng</div></div>
        <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-value">${streak}</div><div class="stat-label">Ngày streak</div></div>
        <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${xp}</div><div class="stat-label">Tổng XP</div></div>
      </div>
      <div class="section-header"><h2>📚 Môn học của em</h2></div>
      <div class="card-grid animate-fadeInUp">
        ${state.subjects.map(s => {
      const subLessons = state.lessons.filter(l => l.monHocId === s.id);
      const subExercises = state.exercises.filter(e => subLessons.some(l => l.id === e.baiHocId));
      const done = myResults.filter(r => subExercises.some(e => e.id === r.baiTapId)).length;
      const pct = subExercises.length ? Math.round((done / subExercises.length) * 100) : 0;
      return `<div class="card" onclick="App.navigateTo('subjects'); App.showLessons('${s.id}');" style="border-top:4px solid ${s.mauSac}">
            <div class="card-icon">${s.icon}</div>
            <div class="card-title">${s.tenMon}</div>
            <div class="card-desc">${s.moTa}</div>
            <div class="card-progress"><div class="card-progress-bar" style="width:${pct}%"></div></div>
            <div style="font-size:0.78rem; color:var(--text-medium); margin-top:6px;">${done}/${subExercises.length} bài · ${pct}%</div>
          </div>`;
    }).join('')}
      </div>
      <div id="ai-insight-area" style="margin-top:24px;"></div>
    `;
    renderStudentAIInsight(myResults);
  };

  const renderStudentAIInsight = (results) => {
    const area = document.getElementById('ai-insight-area');
    if (!area || results.length < 2) { if (area) area.innerHTML = ''; return; }
    const correct = results.filter(r => r.dungSai).length;
    const pct = Math.round((correct / results.length) * 100);
    const strengths = pct >= 70 ? ['Tỷ lệ đúng cao', 'Duy trì học tập đều đặn'] : ['Kiên trì làm bài'];
    const improve = pct < 70 ? ['Ôn lại các bài sai', 'Đọc kỹ đề trước khi trả lời'] : ['Thử các dạng bài khó hơn'];
    area.innerHTML = `
      <div class="ai-card"><div class="ai-header"><span class="ai-icon">🤖</span><h3>Phân tích của AI</h3></div>
        <div class="ai-content">
          <strong>💪 Điểm mạnh:</strong>
          <div class="strengths-list">${strengths.map(s => `<div class="strength-item">✅ ${s}</div>`).join('')}</div>
          <strong style="display:block;margin-top:14px;">📌 Cần cải thiện:</strong>
          <div class="improve-list">${improve.map(s => `<div class="improve-item">💡 ${s}</div>`).join('')}</div>
        </div>
      </div>`;
  };

  // ---- Teacher Dashboard ----
  const renderTeacherDashboard = (el) => {
    const students = state.users.filter(u => u.role === 'hs');
    const totalResults = state.results.length;
    const correctResults = state.results.filter(r => r.dungSai).length;
    el.innerHTML = `
      <div class="header-bar"><h1>📊 Tổng quan lớp học</h1></div>
      <div class="stats-row animate-fadeIn">
        <div class="stat-card"><div class="stat-icon">👨‍🎓</div><div class="stat-value">${students.length}</div><div class="stat-label">Học sinh</div></div>
        <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${state.subjects.length}</div><div class="stat-label">Môn học</div></div>
        <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${state.exercises.length}</div><div class="stat-label">Bài tập</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-value">${totalResults ? Math.round((correctResults / totalResults) * 100) : 0}%</div><div class="stat-label">Tỷ lệ đúng TB</div></div>
      </div>
      <div class="section-header"><h2>👨‍🎓 Danh sách học sinh</h2></div>
      <table class="data-table animate-fadeInUp">
        <thead><tr><th></th><th>Họ tên</th><th>Lớp</th><th>Bài đã làm</th><th>Tỷ lệ đúng</th><th>XP</th></tr></thead>
        <tbody>${students.map(s => {
      const sr = state.results.filter(r => r.hocSinhId === s.id);
      const sc = sr.filter(r => r.dungSai).length;
      const xp = sr.reduce((sum, r) => sum + r.diemDat, 0);
      return `<tr><td>${s.avatar}</td><td><strong>${s.hoTen}</strong></td><td>${s.lop || ''}</td><td>${sr.length}</td><td>${sr.length ? Math.round((sc / sr.length) * 100) : 0}%</td><td>⭐${xp}</td></tr>`;
    }).join('')}</tbody>
      </table>`;
  };

  // ---- Subjects & Lessons ----
  const renderSubjects = (el) => {
    const isTA = isTeacherOrAdmin();
    el.innerHTML = `
      <div class="header-bar"><h1>📚 Môn học & Bài học</h1>
        ${isTA ? '<button class="btn btn-primary btn-sm" onclick="App.showAddSubjectModal()">+ Thêm môn</button>' : ''}
      </div>
      <div class="card-grid animate-fadeIn" id="subjects-grid">
        ${state.subjects.map(s => `
          <div class="card" onclick="App.showLessons('${s.id}')" style="border-top:4px solid ${s.mauSac}">
            <div class="card-icon">${s.icon}</div><div class="card-title">${s.tenMon}</div><div class="card-desc">${s.moTa}</div>
            <div style="font-size:0.82rem; color:var(--text-medium);">${state.lessons.filter(l => l.monHocId === s.id).length} bài học</div>
          </div>
        `).join('')}
      </div>
      <div id="lessons-area"></div>`;
  };

  const showLessons = (subjectId) => {
    const subject = state.subjects.find(s => s.id === subjectId);
    const lessons = state.lessons.filter(l => l.monHocId === subjectId);
    const isTA = isTeacherOrAdmin();
    const area = document.getElementById('lessons-area');
    area.innerHTML = `
      <div class="section-header" style="margin-top:28px;">
        <h2>${subject.icon} ${subject.tenMon} - Bài học</h2>
        ${isTA ? `<button class="btn btn-primary btn-sm" onclick="App.addLesson('${subjectId}')">+ Thêm bài</button>` : ''}
      </div>
      ${lessons.length ? lessons.map(l => {
      const exs = state.exercises.filter(e => e.baiHocId === l.id);
      return `<div class="card" style="margin-bottom:12px; cursor:default;">
          <div class="card-title">📖 ${l.tieuDe}</div><div class="card-desc">${l.noiDung}</div>
          <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
            ${exs.length ? `<button class="btn btn-primary btn-sm" onclick="App.startExercises('${l.id}')">📝 Làm bài (${exs.length} câu)</button>` : '<span class="tag tag-orange">Chưa có bài tập</span>'}
          </div>
        </div>`;
    }).join('') : '<div class="empty-state"><div class="empty-emoji">📭</div><h3>Chưa có bài học</h3></div>'}
    `;
    area.scrollIntoView({ behavior: 'smooth' });
  };

  const startExercises = (lessonId) => {
    const exs = state.exercises.filter(e => e.baiHocId === lessonId);
    if (!exs.length) { showToast('Chưa có bài tập!', 'info'); return; }
    const main = document.getElementById('main-content');
    main.innerHTML = `<div class="header-bar"><h1>📝 Làm bài tập</h1><button class="btn btn-secondary btn-sm" onclick="App.navigateTo('subjects')">← Quay lại</button></div><div id="exercise-area"></div>`;
    Exercises.start(exs, 'exercise-area');
  };

  const saveExerciseResult = async (results, totalScore, maxScore, time, xp) => {
    for (const r of results) {
      const result = {
        hocSinhId: currentUser.id, baiTapId: r.baiTapId || '', cauTraLoi: r.cauTraLoi,
        dungSai: r.dungSai, diemDat: r.diemDat, thoiGianLam: time,
        ngayLam: new Date().toISOString().split('T')[0], cauHoi: r.cauHoi, dang: r.dang
      };
      state.results.push({ id: 'r' + Date.now() + Math.random().toString(36).substr(2, 4), ...result });
      // Save to Supabase if connected
      if (API.isConnected()) {
        await API.insert('results', API.toDbResult(result));
      } else {
        saveStateToLocal();
      }
    }
    showToast(`+${xp} XP! 🌟`, 'success');
  };

  // ---- Progress (Student) ----
  const renderProgress = (el) => {
    const myResults = state.results.filter(r => r.hocSinhId === currentUser.id);
    const byDate = {};
    myResults.forEach(r => { byDate[r.ngayLam] = (byDate[r.ngayLam] || 0) + r.diemDat; });
    const dates = Object.keys(byDate).sort().slice(-7);
    const maxVal = Math.max(...dates.map(d => byDate[d]), 10);

    const colors = ['#6C5CE7', '#00B894', '#FDCB6E', '#FD79A8', '#74B9FF', '#E17055', '#A29BFE'];
    el.innerHTML = `
      <div class="header-bar"><h1>📈 Tiến độ học tập</h1></div>
      <div class="chart-container animate-fadeIn"><h3>📊 Điểm theo ngày (7 ngày gần nhất)</h3>
        <div class="bar-chart">${dates.map((d, i) => `
          <div class="bar-wrapper">
            <div class="bar-value">${byDate[d]}</div>
            <div class="bar" style="height:${(byDate[d] / maxVal) * 100}%; background:${colors[i % colors.length]};"></div>
            <div class="bar-label">${d.slice(5)}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="section-header"><h2>📋 Lịch sử làm bài</h2></div>
      <table class="data-table animate-fadeInUp">
        <thead><tr><th>Ngày</th><th>Câu hỏi</th><th>Dạng</th><th>Kết quả</th><th>Điểm</th></tr></thead>
        <tbody>${myResults.slice().reverse().map(r => `
          <tr><td>${r.ngayLam}</td><td>${r.cauHoi || '-'}</td>
          <td><span class="tag tag-blue">${r.dang}</span></td>
          <td><span class="tag ${r.dungSai ? 'tag-green' : 'tag-red'}">${r.dungSai ? '✓ Đúng' : '✗ Sai'}</span></td>
          <td>${r.diemDat}</td></tr>
        `).join('')}</tbody>
      </table>`;
  };

  // ---- Rewards (Student) ----
  const renderRewards = (el) => {
    const myResults = state.results.filter(r => r.hocSinhId === currentUser.id);
    const xp = myResults.reduce((s, r) => s + r.diemDat, 0);
    const streak = Gamification.calcStreak(myResults.map(r => r.ngayLam));
    const stats = {
      totalXP: xp, streak, totalExercises: myResults.length,
      hasPerfect: myResults.some(r => r.dungSai && r.diemDat >= 10),
      subjectsCount: new Set(myResults.map(r => r.dang)).size,
      hasFastFinish: myResults.some(r => r.thoiGianLam < 120),
      hasImproved: myResults.length >= 2,
      typesCount: new Set(myResults.map(r => r.dang)).size,
      level: Gamification.getLevel(xp).level,
      leaderboard: getLeaderboard()
    };
    el.innerHTML = `<div class="header-bar"><h1>🏆 Điểm thưởng & Huy hiệu</h1></div><div id="gamification-area"></div>`;
    Gamification.renderDashboard('gamification-area', stats);
  };

  const getLeaderboard = () => {
    return state.users.filter(u => u.role === 'hs').map(u => {
      const r = state.results.filter(x => x.hocSinhId === u.id);
      return { hoTen: u.hoTen, avatar: u.avatar, xp: r.reduce((s, x) => s + x.diemDat, 0) };
    }).sort((a, b) => b.xp - a.xp);
  };



  const generateAI = async () => {
    const subject = document.getElementById('ai-subject').value;
    const grade = document.getElementById('ai-grade').value;
    const type = document.getElementById('ai-type').value;
    const count = parseInt(document.getElementById('ai-count').value);
    const topic = document.getElementById('ai-topic').value;
    if (!topic) { showToast('Vui lòng nhập chủ đề', 'error'); return; }

    document.getElementById('ai-loading').classList.add('show');
    document.getElementById('ai-gen-btn').disabled = true;

    const result = await AI.generateExercises(subject, topic, type, count, grade);
    document.getElementById('ai-loading').classList.remove('show');
    document.getElementById('ai-gen-btn').disabled = false;

    if (result) {
      showToast(`Đã tạo ${result.length} câu hỏi! ✨`, 'success');
      renderAIPreview(result, type);
    }
  };

  const renderAIPreview = (questions, type) => {
    const preview = document.getElementById('ai-preview');
    preview.innerHTML = `
      <div class="section-header"><h2>👀 Xem trước bài tập (${questions.length} câu)</h2>
        <button class="btn btn-success btn-sm" onclick="App.saveAIExercises()">💾 Lưu vào bài học</button>
      </div>
      ${questions.map((q, i) => `
        <div class="card" style="margin-bottom:12px; cursor:default;">
          <div class="card-title">Câu ${i + 1}: ${q.cauHoi}</div>
          <div class="card-desc">Đáp án: <strong>${formatAIAnswer(q, type)}</strong></div>
          ${q.giaiThich ? `<div style="color:var(--primary); font-size:0.82rem; font-weight:600;">💡 ${q.giaiThich}</div>` : ''}
        </div>
      `).join('')}`;
    preview._questions = questions;
    preview._type = type;
  };

  const formatAIAnswer = (q, type) => {
    if (type === 'trac-nghiem') return q.dapAnDung;
    if (type === 'tu-luan') return q.dapAnDung;
    if (type === 'sap-xep') return (q.dapAnDung || []).join(' → ');
    if (type === 'noi-cot') return Object.entries(q.dapAnDung || {}).map(([k, v]) => `${k}↔${v}`).join(', ');
    if (type === 'keo-tha') return (q.dapAnDung || []).join(', ');
    return JSON.stringify(q.dapAnDung);
  };

  const saveAIExercises = () => {
    const preview = document.getElementById('ai-preview');
    if (!preview._questions) return;
    const lesson = state.lessons[0]; // Save to first lesson for demo
    preview._questions.forEach(q => {
      state.exercises.push({
        id: 'e' + Date.now() + Math.random().toString(36).substr(2, 4),
        baiHocId: lesson.id, dang: preview._type, cauHoi: q.cauHoi, diem: 10,
        duLieu: q
      });
    });
    saveStateToLocal();
    showToast(`Đã lưu ${preview._questions.length} câu vào "${lesson.tieuDe}"! ✅`, 'success');
    preview.innerHTML = '<div class="empty-state"><div class="empty-emoji">✅</div><h3>Đã lưu thành công!</h3></div>';
  };

  // ---- Student Manager (Teacher) ----
  const renderStudentManager = (el) => {
    const students = state.users.filter(u => u.role === 'hs');
    el.innerHTML = `
      <div class="header-bar"><h1>👨‍🎓 Quản lý học sinh</h1>
        <button class="btn btn-primary btn-sm" onclick="App.showAddStudentModal()">+ Thêm học sinh</button></div>
      <table class="data-table animate-fadeIn">
        <thead><tr><th></th><th>Họ tên</th><th>Lớp</th><th>Tài khoản</th><th>Mật khẩu</th><th>Thao tác</th></tr></thead>
        <tbody>${students.map(s => `
          <tr><td>${s.avatar}</td><td><strong>${s.hoTen}</strong></td><td>${s.lop || ''}</td><td>${s.username}</td><td>${s.password}</td>
          <td><button class="btn btn-danger btn-sm" onclick="App.deleteStudent('${s.id}')">🗑</button></td></tr>
        `).join('')}</tbody>
      </table>
      <div id="student-modal-area"></div>`;
  };

  const showAddStudentModal = () => {
    const area = document.getElementById('student-modal-area');
    area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()">
        <h2>➕ Thêm học sinh <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="form-group"><label>Họ tên</label><input id="new-hs-name" placeholder="Nguyễn Văn A"></div>
        <div class="form-group"><label>Lớp</label><input id="new-hs-class" placeholder="3A"></div>
        <div class="form-group"><label>Tài khoản</label><input id="new-hs-user" placeholder="nguyenvana"></div>
        <div class="form-group"><label>Mật khẩu</label><input id="new-hs-pass" placeholder="123456"></div>
        <button class="btn btn-primary btn-full" onclick="App.addStudent()">Thêm</button>
      </div></div>`;
  };

  const addStudent = async () => {
    const name = document.getElementById('new-hs-name').value.trim();
    const cls = document.getElementById('new-hs-class').value.trim();
    const user = document.getElementById('new-hs-user').value.trim();
    const pass = document.getElementById('new-hs-pass').value.trim();
    if (!name || !user || !pass) { showToast('Vui lòng điền đầy đủ', 'error'); return; }
    const student = { hoTen: name, username: user, password: pass, role: 'hs', avatar: '😊', lop: cls };
    if (API.isConnected()) {
      const saved = await API.insert('users', API.toDbUser(student));
      if (saved) { state.users.push(API.mapUser(saved)); }
    } else {
      state.users.push({ id: 'hs' + Date.now(), ...student });
      saveStateToLocal();
    }
    document.querySelector('.modal-overlay').remove();
    showToast(`Đã thêm ${name}! ✅`, 'success');
    renderStudentManager(document.getElementById('main-content'));
  };

  const deleteStudent = async (id) => {
    state.users = state.users.filter(u => u.id !== id);
    if (API.isConnected()) { await API.remove('users', id); }
    else { saveStateToLocal(); }
    showToast('Đã xóa học sinh', 'info');
    renderStudentManager(document.getElementById('main-content'));
  };



  const showStudentDetail = (studentId) => {
    const student = state.users.find(u => u.id === studentId);
    const results = state.results.filter(r => r.hocSinhId === studentId);
    const area = document.getElementById('student-detail-area');
    area.innerHTML = `
      <div class="section-header" style="margin-top:24px;"><h2>${student.avatar} Chi tiết: ${student.hoTen}</h2></div>
      ${results.map((r, i) => `
        <div class="question-result ${r.dungSai ? 'correct-result' : 'incorrect-result'}">
          <div class="qr-header"><span class="qr-question">Câu ${i + 1}: ${r.cauHoi || '-'}</span>
            <span class="tag ${r.dungSai ? 'tag-green' : 'tag-red'}">${r.dungSai ? '✓ Đúng' : '✗ Sai'}</span></div>
          <div class="qr-details">Trả lời: <strong>${r.cauTraLoi || '-'}</strong> · Thời gian: ${r.thoiGianLam || 0}s · Ngày: ${r.ngayLam}</div>
        </div>
      `).join('')}
      <div class="ai-card" style="margin-top:16px;"><div class="ai-header"><span class="ai-icon">🤖</span><h3>AI Đánh giá</h3></div>
        <div class="ai-content"><p>Nhấn nút bên dưới để AI phân tích chi tiết (cần Gemini API Key)</p>
          <button class="btn btn-primary btn-sm" style="margin-top:10px;" onclick="App.analyzeWithAI('${studentId}')">🤖 Phân tích bằng AI</button>
          <div id="ai-analysis-result"></div>
        </div>
      </div>`;
    area.scrollIntoView({ behavior: 'smooth' });
  };

  const analyzeWithAI = async (studentId) => {
    const student = state.users.find(u => u.id === studentId);
    const results = state.results.filter(r => r.hocSinhId === studentId);
    const el = document.getElementById('ai-analysis-result');
    el.innerHTML = '<div class="ai-loading show"><div class="spinner"></div><p>AI đang phân tích...</p></div>';
    const analysis = await AI.analyzeStudent(student.hoTen, results, state.subjects.map(s => s.tenMon));
    if (analysis) {
      el.innerHTML = `
        <div style="margin-top:14px;">
          <strong>💪 Điểm mạnh:</strong><div class="strengths-list">${(analysis.diemManh || []).map(s => `<div class="strength-item">✅ ${s}</div>`).join('')}</div>
          <strong style="display:block;margin-top:12px;">📌 Cần cải thiện:</strong><div class="improve-list">${(analysis.canCaiThien || []).map(s => `<div class="improve-item">💡 ${s}</div>`).join('')}</div>
          <strong style="display:block;margin-top:12px;">📝 Nhận xét:</strong><p style="margin-top:6px;">${analysis.nhanXet || ''}</p>
        </div>`;
    } else {
      el.innerHTML = '<p style="color:var(--accent-red);">Không thể phân tích. Kiểm tra API Key.</p>';
    }
  };

  // ---- Settings ----
  const renderSettings = (el) => {
    const connected = API.isConnected();
    el.innerHTML = `
      <div class="header-bar"><h1>⚙️ Cài đặt</h1></div>
      <div class="settings-section animate-fadeIn">
        <h3>🟢 Supabase Database</h3>
        <p style="font-size:0.85rem;color:var(--text-medium);margin-bottom:12px;">Kết nối Supabase để lưu dữ liệu. <a href="https://supabase.com" target="_blank">Tạo tài khoản miễn phí</a></p>
        <div style="margin-bottom:8px;"><span class="tag ${connected ? 'tag-green' : 'tag-orange'}">${connected ? '✅ Đã kết nối' : '⚠ Chưa kết nối (đang dùng demo)'}</span></div>
        <div class="form-group"><label>Supabase URL</label>
          <div class="setting-row"><input type="text" id="supa-url-input" placeholder="https://xxxxx.supabase.co" value="${API.getSupabaseUrl()}"></div></div>
        <div class="form-group"><label>Supabase Anon Key</label>
          <div class="setting-row"><input type="password" id="supa-key-input" placeholder="eyJhbGciOi..." value="${API.getSupabaseKey()}"></div></div>
        <button class="btn btn-primary" onclick="App.connectSupabase()">🔗 Kết nối Supabase</button>
      </div>
      <div class="settings-section">
        <h3>🔑 Gemini AI API Key</h3><p style="font-size:0.85rem;color:var(--text-medium);margin-bottom:12px;">Nhập API key để sử dụng tính năng AI tạo bài tập & phân tích</p>
        <div class="setting-row"><input type="password" id="gemini-key-input" placeholder="AIzaSy..." value="${API.getGeminiKey()}"><button class="btn btn-primary btn-sm" onclick="API.setGeminiKey(document.getElementById('gemini-key-input').value); showToast('Đã lưu API Key! ✅','success')">Lưu</button></div>
      </div>
       <div class="settings-section">
        <h3>🎭 Cấu hình AI (Persona)</h3>
        <p style="font-size:0.85rem;color:var(--text-medium);margin-bottom:12px;">Thiết lập vai trò/tính cách cho AI khi chấm bài (VD: "Cô giáo Thỏ Trắng dịu dàng")</p>
        <div class="setting-row" style="display:block;">
           <textarea id="ai-persona-input" rows="3" style="width:100%;margin-bottom:8px;" placeholder="VD: Bạn là một giáo viên tiểu học vui tính, hay dùng icon...">${localStorage.getItem('lms_ai_persona') || ''}</textarea>
           <button class="btn btn-primary btn-sm" onclick="localStorage.setItem('lms_ai_persona', document.getElementById('ai-persona-input').value); showToast('Đã lưu cấu hình AI! ✅','success')">Lưu cấu hình</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>👤 Tài khoản demo</h3><p style="font-size:0.85rem;color:var(--text-medium);margin-bottom:8px;">Sử dụng để test:</p>
        <table class="data-table"><thead><tr><th>Role</th><th>Username</th><th>Password</th></tr></thead><tbody>
          <tr><td>🛡️ Admin</td><td>admin</td><td>123456</td></tr><tr><td>👩‍🏫 Giáo viên</td><td>giaovien</td><td>123456</td></tr><tr><td>👦 Học sinh</td><td>an123</td><td>111111</td></tr>
        </tbody></table>
      </div>`;
  };

  const connectSupabase = async () => {
    const url = document.getElementById('supa-url-input').value.trim();
    const key = document.getElementById('supa-key-input').value.trim();
    if (!url || !key) { showToast('Vui lòng nhập URL và Key', 'error'); return; }
    API.setSupabaseUrl(url);
    API.setSupabaseKey(key);
    if (API.initSupabase()) {
      const data = await API.loadAllData();
      if (data && data.users.length > 0) {
        state = data;
        showToast('✅ Kết nối Supabase thành công! Dữ liệu đã tải.', 'success');
      } else {
        showToast('⚠️ Kết nối OK nhưng chưa có dữ liệu. Hãy chạy file supabase-schema.sql', 'info');
      }
      renderSettings(document.getElementById('main-content'));
    } else {
      showToast('❌ Không thể kết nối. Kiểm tra URL và Key.', 'error');
    }
  };

  // ---- Helpers ----
  const addLesson = async (subjectId) => {
    const title = prompt('Nhập tên bài học:');
    if (!title) return;
    const lesson = { monHocId: subjectId, tieuDe: title, noiDung: '', thuTu: state.lessons.length + 1 };
    if (API.isConnected()) {
      const saved = await API.insert('lessons', API.toDbLesson(lesson));
      if (saved) { state.lessons.push(API.mapLesson(saved)); }
    } else {
      state.lessons.push({ id: 'l' + Date.now(), ...lesson });
      saveStateToLocal();
    }
    showToast('Đã thêm bài học! ✅', 'success');
    showLessons(subjectId);
  };

  const showAddSubjectModal = async () => {
    const name = prompt('Tên môn học:');
    if (!name) return;
    const icons = ['📐', '📝', '🎨', '🎵', '🏀', '🌱'];
    const subject = { tenMon: name, moTa: '', icon: icons[Math.floor(Math.random() * icons.length)], mauSac: '#6C5CE7' };
    if (API.isConnected()) {
      const saved = await API.insert('subjects', API.toDbSubject(subject));
      if (saved) { state.subjects.push(API.mapSubject(saved)); }
    } else {
      state.subjects.push({ id: 's' + Date.now(), ...subject });
      saveStateToLocal();
    }
    showToast('Đã thêm môn học! ✅', 'success');
    renderSubjects(document.getElementById('main-content'));
  };

  // ---- Mobile sidebar ----
  const toggleSidebar = () => {
    document.querySelector('.sidebar').classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('show');
  };

  // ============================================
  //  FILE UPLOAD FOR EXERCISE CREATION
  // ============================================
  let uploadedFileText = '';

  const handleFileUpload = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'txt') {
        uploadedFileText = await file.text();
      } else if (ext === 'pdf') {
        uploadedFileText = await extractPdfText(file);
      } else if (ext === 'docx' || ext === 'doc') {
        uploadedFileText = await extractDocxText(file);
      } else {
        showToast('Chỉ hỗ trợ .txt, .pdf, .docx', 'error'); return;
      }
      document.getElementById('file-preview-area').innerHTML = `
        <div class="file-preview"><span class="file-icon">📄</span>
          <span class="file-name">${file.name} (${(file.size / 1024).toFixed(1)}KB)</span>
          <span class="file-remove" onclick="App.clearUploadedFile()">✕</span></div>
        <div style="font-size:0.82rem;color:var(--text-medium);max-height:100px;overflow:auto;padding:8px;background:#f9f9f9;border-radius:8px;">
          ${uploadedFileText.substring(0, 500)}${uploadedFileText.length > 500 ? '...' : ''}</div>`;
      showToast('Đã đọc file thành công! ✅', 'success');
    } catch (err) {
      console.error(err); showToast('Lỗi đọc file: ' + err.message, 'error');
    }
  };

  const extractPdfText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      return text;
    }
    return '[PDF.js chưa tải xong, vui lòng thử lại]';
  };

  const extractDocxText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    if (typeof mammoth !== 'undefined') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    return '[Mammoth.js chưa tải, vui lòng thử lại]';
  };

  const clearUploadedFile = () => {
    uploadedFileText = '';
    const area = document.getElementById('file-preview-area');
    if (area) area.innerHTML = '';
    const input = document.getElementById('file-upload-input');
    if (input) input.value = '';
  };

  const generateFromFile = async () => {
    if (!uploadedFileText) { showToast('Vui lòng tải file lên trước', 'error'); return; }
    const type = document.getElementById('ai-type-file').value;
    const count = parseInt(document.getElementById('ai-count-file').value);
    const grade = document.getElementById('ai-grade').value; // Assuming grade is still from the AI tab
    document.getElementById('ai-loading').classList.add('show');
    const prompt = `Dựa vào nội dung sau, hãy tạo ${count} câu hỏi dạng ${type} cho học sinh lớp ${grade}.\n\nNội dung:\n${uploadedFileText.substring(0, 3000)}\n\nTrả về JSON thuần, format giống tạo bài tập thông thường.`;
    const result = await AI.callGemini(prompt);
    document.getElementById('ai-loading').classList.remove('show');
    if (result) {
      try {
        let cleaned = result.trim().replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const questions = JSON.parse(cleaned);
        showToast(`Đã tạo ${questions.length} câu từ file! ✨`, 'success');
        renderAIPreview(questions, type);
      } catch (e) { showToast('Lỗi phân tích phản hồi AI', 'error'); }
    }
  };

  // ============================================
  //  ASSIGNMENT SYSTEM (Teacher)
  // ============================================
  const renderTeacherAssignments = (el) => {
    const now = new Date().toISOString();
    el.innerHTML = `
      <div class="header-bar"><h1>📋 Giao bài tập</h1>
        <button class="btn btn-primary btn-sm" onclick="App.showCreateAssignment()">+ Tạo bài giao</button></div>
      <div id="assignment-list" class="animate-fadeIn">
        ${state.assignments.length ? state.assignments.map(a => {
      const status = a.trangThai === 'expired' ? 'expired' : (new Date(a.batDau) > new Date() ? 'pending' : 'active');
      const statusLabel = { active: '🟢 Đang mở', expired: '🔴 Hết hạn', pending: '🟡 Chưa bắt đầu' };
      const cheDoLabels = { 'dung-sai': 'Xem đúng/sai', 'dung-sai-dap-an': 'Xem đúng/sai + đáp án', 'chi-diem': 'Chỉ xem điểm' };
      const completedCount = state.results.filter(r => a.exerciseIds.includes(r.baiTapId)).length;
      return `<div class="assignment-card ${status}-assignment">
            <div class="assignment-header"><h3>📝 ${a.tieuDe}</h3>
              <span class="tag ${status === 'active' ? 'tag-green' : status === 'expired' ? 'tag-red' : 'tag-orange'}">${statusLabel[status]}</span></div>
            <div class="assignment-meta">
              <span class="meta-item">📅 ${a.batDau.replace('T', ' ')} → ${a.ketThuc.replace('T', ' ')}</span>
              <span class="meta-item">🔄 Làm lại: ${a.soLanLamLai} lần</span>
              <span class="meta-item">👁 ${cheDoLabels[a.cheDoXem] || a.cheDoXem}</span>
              <span class="meta-item">📊 ${completedCount} lượt nộp</span>
            </div>
            <div class="assignment-actions">
              <button class="btn btn-primary btn-sm" onclick="App.showQRCode('${a.id}')">📱 QR Code</button>
              <button class="btn btn-secondary btn-sm" onclick="App.copyAssignmentLink('${a.maLink}')">🔗 Copy link</button>
              <button class="btn btn-danger btn-sm" onclick="App.deleteAssignment('${a.id}')">🗑</button>
            </div></div>`;
    }).join('') : '<div class="empty-state"><div class="empty-emoji">📋</div><h3>Chưa có bài giao</h3></div>'}
      </div>
      <div id="assignment-modal-area"></div>`;
  };

  const showCreateAssignment = () => {
    const area = document.getElementById('assignment-modal-area');
    const exerciseOptions = state.exercises.map(e => `<option value="${e.id}">${e.cauHoi.substring(0, 50)}</option>`).join('');
    const lessonOptions = state.lessons.map(l => `<option value="${l.id}">${l.tieuDe}</option>`).join('');
    area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()" style="max-width:600px">
        <h2>📋 Tạo bài giao mới <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="form-group"><label>Tiêu đề</label><input id="assign-title" placeholder="VD: Bài tập Toán tuần 5"></div>
        <div class="form-group"><label>Chọn bài học</label><select id="assign-lesson">${lessonOptions}</select></div>
        <div class="ai-form-row">
          <div class="form-group"><label>⏰ Bắt đầu</label><input type="datetime-local" id="assign-start"></div>
          <div class="form-group"><label>⏰ Kết thúc</label><input type="datetime-local" id="assign-end"></div>
        </div>
        <div class="ai-form-row">
          <div class="form-group"><label>👁 Chế độ xem kết quả</label>
            <select id="assign-view-mode">
              <option value="dung-sai-dap-an">Xem đúng/sai + đáp án</option>
              <option value="dung-sai">Chỉ xem đúng/sai (không đáp án)</option>
              <option value="chi-diem">Chỉ xem điểm tổng</option>
            </select></div>
          <div class="form-group"><label>🔄 Số lần làm lại</label><input type="number" id="assign-retries" value="1" min="0" max="10"></div>
        </div>
        <button class="btn btn-success btn-full" onclick="App.createAssignment()">✅ Tạo & Giao bài</button>
      </div></div>`;
  };

  const createAssignment = () => {
    const title = document.getElementById('assign-title').value.trim();
    const lessonId = document.getElementById('assign-lesson').value;
    const start = document.getElementById('assign-start').value;
    const end = document.getElementById('assign-end').value;
    const viewMode = document.getElementById('assign-view-mode').value;
    const retries = parseInt(document.getElementById('assign-retries').value);
    if (!title) { showToast('Nhập tiêu đề', 'error'); return; }
    const exs = state.exercises.filter(e => e.baiHocId === lessonId).map(e => e.id);
    if (!exs.length) { showToast('Bài học chưa có bài tập!', 'error'); return; }
    const code = 'BT-' + Date.now().toString(36).toUpperCase();
    state.assignments.push({
      id: 'a' + Date.now(), tieuDe: title, baiHocId: lessonId, exerciseIds: exs,
      batDau: start || new Date().toISOString().slice(0, 16), ketThuc: end || '',
      soLanLamLai: retries, cheDoXem: viewMode, trangThai: 'active', maLink: code
    });
    if (!API.isConnected()) saveStateToLocal();
    document.querySelector('.modal-overlay').remove();
    showToast('Đã tạo bài giao! ✅', 'success');
    renderTeacherAssignments(document.getElementById('main-content'));
  };

  const deleteAssignment = (id) => {
    state.assignments = state.assignments.filter(a => a.id !== id);
    if (!API.isConnected()) saveStateToLocal();
    showToast('Đã xóa bài giao', 'info');
    renderTeacherAssignments(document.getElementById('main-content'));
  };

  const showQRCode = (assignmentId) => {
    const a = state.assignments.find(x => x.id === assignmentId);
    if (!a) return;
    const link = window.location.href.split('?')[0] + '?code=' + a.maLink;
    const area = document.getElementById('assignment-modal-area');
    area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()">
        <h2>📱 QR Code - ${a.tieuDe} <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="qr-container"><div id="qr-code-el"></div>
          <div class="qr-link">${link}</div>
          <button class="btn btn-primary btn-sm qr-copy-btn" onclick="navigator.clipboard.writeText('${link}'); showToast('Đã copy! ✅','success')">📋 Copy link</button>
          <div style="margin-top:10px;font-size:0.82rem;color:var(--text-medium);">Mã: <strong>${a.maLink}</strong></div>
        </div></div></div>`;
    setTimeout(() => {
      const el = document.getElementById('qr-code-el');
      if (el && typeof QRCode !== 'undefined') {
        new QRCode(el, { text: link, width: 200, height: 200, colorDark: '#6C5CE7' });
      }
    }, 100);
  };

  const copyAssignmentLink = (code) => {
    const link = window.location.href.split('?')[0] + '?code=' + code;
    navigator.clipboard.writeText(link).then(() => showToast('Đã copy link! ✅', 'success'));
  };

  // ============================================
  //  STUDENT ASSIGNMENTS VIEW
  // ============================================
  const renderStudentAssignments = (el) => {
    const now = new Date();
    const activeAssignments = state.assignments.filter(a => {
      if (a.trangThai === 'expired') return false;
      if (a.ketThuc && new Date(a.ketThuc) < now) return false;
      return true;
    });
    const pastAssignments = state.assignments.filter(a =>
      a.trangThai === 'expired' || (a.ketThuc && new Date(a.ketThuc) < now)
    );
    el.innerHTML = `
      <div class="header-bar"><h1>📋 Bài tập được giao</h1></div>
      <div class="section-header"><h2>🟢 Đang mở</h2></div>
      ${activeAssignments.length ? activeAssignments.map(a => {
      const myAttempts = state.results.filter(r => r.hocSinhId === currentUser.id && a.exerciseIds.includes(r.baiTapId)).length;
      const canRetry = a.soLanLamLai === 0 || myAttempts <= a.soLanLamLai;
      const timeLeft = a.ketThuc ? Math.max(0, Math.floor((new Date(a.ketThuc) - now) / 3600000)) : '∞';
      return `<div class="assignment-card active-assignment">
          <div class="assignment-header"><h3>📝 ${a.tieuDe}</h3>
            <span class="tag tag-green">${canRetry ? '✅ Có thể làm' : '🔒 Hết lượt'}</span></div>
          <div class="assignment-meta">
            <span class="meta-item">⏰ Còn ${timeLeft}h</span>
            <span class="meta-item">📝 ${a.exerciseIds.length} câu</span>
            <span class="meta-item">🔄 Đã làm: ${myAttempts > 0 ? Math.ceil(myAttempts / a.exerciseIds.length) : 0}/${a.soLanLamLai + 1} lượt</span>
          </div>
          ${canRetry ? `<button class="btn btn-primary btn-sm" onclick="App.startAssignment('${a.id}')">📝 Làm bài</button>` : ''}
        </div>`;
    }).join('') : '<div class="empty-state"><div class="empty-emoji">🎉</div><h3>Không có bài tập mới</h3></div>'}
      ${pastAssignments.length ? `<div class="section-header" style="margin-top:24px"><h2>🔴 Đã hết hạn</h2></div>
        ${pastAssignments.map(a => `<div class="assignment-card expired-assignment">
          <div class="assignment-header"><h3>${a.tieuDe}</h3><span class="tag tag-red">Hết hạn</span></div>
        </div>`).join('')}` : ''}`;
  };

  const startAssignment = (assignmentId) => {
    const a = state.assignments.find(x => x.id === assignmentId);
    if (!a) return;
    const exs = state.exercises.filter(e => a.exerciseIds.includes(e.id));
    if (!exs.length) { showToast('Không tìm thấy bài tập!', 'error'); return; }
    const main = document.getElementById('main-content');
    main.innerHTML = `<div class="header-bar"><h1>📝 ${a.tieuDe}</h1>
      <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('assignments')">← Quay lại</button></div>
      <div id="exercise-area"></div>`;
    Exercises.start(exs, 'exercise-area');
  };

  // ============================================
  //  ENHANCED CLASS ANALYSIS (with filters & time)
  // ============================================
  const renderClassAnalysis = (el) => {
    const students = state.users.filter(u => u.role === 'hs');
    el.innerHTML = `
      <div class="header-bar"><h1>📈 Phân tích lớp</h1></div>
      <div class="filter-toolbar animate-fadeIn">
        <div class="filter-group"><label>🔍</label><input type="text" id="filter-name" placeholder="Tìm tên..." oninput="App.applyAnalysisFilters()"></div>
        <div class="filter-group"><label>Sắp xếp:</label>
          <select id="filter-sort" onchange="App.applyAnalysisFilters()">
            <option value="name">Theo tên</option>
            <option value="score-desc">Điểm cao → thấp</option>
            <option value="score-asc">Điểm thấp → cao</option>
            <option value="time-asc">Thời gian ít → nhiều</option>
            <option value="time-desc">Thời gian nhiều → ít</option>
            <option value="count-desc">Số bài nhiều → ít</option>
            <option value="count-asc">Số bài ít → nhiều</option>
          </select></div>
      </div>
      <div id="analysis-cards" class="stats-row animate-fadeIn"></div>
      <div id="student-detail-area"></div>`;
    applyAnalysisFilters();
  };

  const applyAnalysisFilters = () => {
    const nameFilter = (document.getElementById('filter-name')?.value || '').toLowerCase();
    const sortBy = document.getElementById('filter-sort')?.value || 'name';
    let students = state.users.filter(u => u.role === 'hs');
    if (nameFilter) students = students.filter(s => s.hoTen.toLowerCase().includes(nameFilter));

    const enriched = students.map(s => {
      const sr = state.results.filter(r => r.hocSinhId === s.id);
      const sc = sr.filter(r => r.dungSai).length;
      const pct = sr.length ? Math.round((sc / sr.length) * 100) : 0;
      const totalTime = sr.reduce((sum, r) => sum + (r.thoiGianLam || 0), 0);
      return { ...s, results: sr, pct, totalTime, count: sr.length };
    });

    switch (sortBy) {
      case 'score-desc': enriched.sort((a, b) => b.pct - a.pct); break;
      case 'score-asc': enriched.sort((a, b) => a.pct - b.pct); break;
      case 'time-desc': enriched.sort((a, b) => b.totalTime - a.totalTime); break;
      case 'time-asc': enriched.sort((a, b) => a.totalTime - b.totalTime); break;
      case 'count-desc': enriched.sort((a, b) => b.count - a.count); break;
      case 'count-asc': enriched.sort((a, b) => a.count - b.count); break;
      default: enriched.sort((a, b) => a.hoTen.localeCompare(b.hoTen));
    }

    const container = document.getElementById('analysis-cards');
    if (!container) return;
    container.innerHTML = enriched.map(s => {
      const color = s.pct >= 70 ? 'var(--accent-green)' : s.pct >= 40 ? 'var(--accent-orange)' : 'var(--accent-red)';
      const avgTime = s.count ? Math.round(s.totalTime / s.count) : 0;
      return `<div class="stat-card" style="text-align:center; cursor:pointer;" onclick="App.showStudentDetail('${s.id}')">
        <div style="font-size:2rem;">${s.avatar}</div>
        <div style="font-weight:800; margin:6px 0;">${s.hoTen}</div>
        <div style="font-size:1.5rem; font-weight:900; color:${color}">${s.pct}%</div>
        <div class="stat-label">${s.count} bài</div>
        <div class="time-display" style="margin-top:4px;">⏱ TB ${avgTime}s/câu</div>
        <div class="time-display">📊 Tổng: ${s.totalTime}s</div>
      </div>`;
    }).join('');
  };

  // ---- Create Exercise with file upload ----
  const renderCreateExerciseWithUpload = (el) => {
    el.innerHTML = `
      <div class="header-bar"><h1>🤖 Tạo bài tập</h1></div>
      <div class="tabs">
        <button class="tab-btn active" onclick="App.switchCreateTab('ai',this)">✨ AI tạo từ chủ đề</button>
        <button class="tab-btn" onclick="App.switchCreateTab('file',this)">📄 Tạo từ file</button>
      </div>
      <div id="create-tab-ai">
        <div class="ai-generator animate-fadeIn">
          <h3>✨ AI Tạo Bài Tập Tự Động</h3>
          <div class="ai-form-row">
            <div class="form-group"><label>Môn học</label>
              <select id="ai-subject">${state.subjects.map(s => `<option value="${s.tenMon}">${s.icon} ${s.tenMon}</option>`).join('')}</select></div>
            <div class="form-group"><label>Lớp</label>
              <select id="ai-grade"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div>
          </div>
          <div class="ai-form-row">
            <div class="form-group"><label>Dạng bài</label>
              <select id="ai-type"><option value="trac-nghiem">📝 Trắc nghiệm</option><option value="keo-tha">🖐 Kéo thả</option><option value="noi-cot">🔗 Nối cột</option><option value="sap-xep">📋 Sắp xếp</option><option value="tu-luan">✍️ Tự luận ngắn</option></select></div>
            <div class="form-group"><label>Số câu</label><input type="number" id="ai-count" value="3" min="1" max="10"></div>
          </div>
          <div class="ai-form-row full"><div class="form-group"><label>Chủ đề</label><input type="text" id="ai-topic" placeholder="VD: Phép cộng trong phạm vi 100"></div></div>
          <button class="btn btn-primary" onclick="App.generateAI()" id="ai-gen-btn">🤖 Tạo bài tập</button>
          <div class="ai-loading" id="ai-loading"><div class="spinner"></div><p>AI đang tạo bài tập...</p></div>
        </div>
      </div>
      <div id="create-tab-file" style="display:none;">
        <div class="ai-generator animate-fadeIn">
          <h3>📄 Tạo bài tập từ File</h3>
          <p style="font-size:0.85rem;color:var(--text-medium);margin-bottom:14px;">Upload file Word (.docx), PDF hoặc Text (.txt) — AI sẽ đọc nội dung và tạo bài tập tự động</p>
          <div class="file-upload-zone" id="file-upload-zone" onclick="document.getElementById('file-upload-input').click()">
            <div class="upload-icon">📁</div>
            <div class="upload-text">Click hoặc kéo thả file vào đây</div>
            <div class="upload-hint">Hỗ trợ: .docx, .pdf, .txt (tối đa 5MB)</div>
            <input type="file" id="file-upload-input" accept=".txt,.pdf,.docx,.doc" onchange="App.handleFileUpload(this.files[0])">
          </div>
          <div id="file-preview-area"></div>
          <div class="ai-form-row">
            <div class="form-group"><label>Dạng bài</label>
              <select id="ai-type-file"><option value="trac-nghiem">📝 Trắc nghiệm</option><option value="keo-tha">🖐 Kéo thả</option><option value="noi-cot">🔗 Nối cột</option><option value="sap-xep">📋 Sắp xếp</option><option value="tu-luan">✍️ Tự luận ngắn</option></select></div>
            <div class="form-group"><label>Số câu</label><input type="number" id="ai-count-file" value="5" min="1" max="10"></div>
          </div>
          <button class="btn btn-success" onclick="App.generateFromFile()">📄 Tạo từ file</button>
        </div>
      </div>
      <div id="ai-preview"></div>`;

    // Setup drag & drop
    const zone = document.getElementById('file-upload-zone');
    if (zone) {
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
      });
    }
  };

  const switchCreateTab = (tab, btn) => {
    document.getElementById('create-tab-ai').style.display = tab === 'ai' ? '' : 'none';
    document.getElementById('create-tab-file').style.display = tab === 'file' ? '' : 'none';
    document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
  // ---- Class Management ----
  const renderClassManager = (el) => {
    const myClasses = getMyClasses();
    const yearName = state.schoolYears.find(y => y.id === selectedYearId)?.ten || '';
    const isArchived = state.schoolYears.find(y => y.id === selectedYearId)?.trangThai === 'archived';
    el.innerHTML = `
      <div class="header-bar"><h1>🏫 ${isAdmin() ? 'Quản lý lớp học' : 'Lớp học của tôi'} ${yearName ? `- ${yearName}` : ''}</h1>
        ${!isArchived ? '<button class="btn btn-primary btn-sm" onclick="App.showAddClassModal()">+ Tạo lớp mới</button>' : '<span class="tag tag-orange">💾 Lưu trữ - Chỉ xem</span>'}
      </div>
      ${isArchived ? '<div class="alert-info" style="background:#FFF3CD;padding:12px;border-radius:8px;margin-bottom:16px;">⚠️ Năm học này đã lưu trữ. Bạn chỉ có thể xem, không chỉnh sửa.</div>' : ''}
      <div class="card-grid animate-fadeIn">
        ${myClasses.length ? myClasses.map(c => {
      const students = getStudentsInClass(c.id);
      const gv = state.users.find(u => u.id === c.giaoVienId);
      return `<div class="card" style="border-top:4px solid var(--primary);">
            <div class="card-icon">🏫</div>
            <div class="card-title">${c.tenLop}</div>
            <div class="card-desc">${c.moTa || ''}</div>
            <div style="margin-top:8px;">
              <span class="tag tag-green">👨‍🎓 ${students.length} học sinh</span>
              ${gv ? `<span class="tag" style="background:#eee;">👩‍🏫 ${gv.hoTen}</span>` : ''}
            </div>
            <div style="margin-top:12px; display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="App.showClassStudents('${c.id}')">Xem HS</button>
              ${!isArchived ? `<button class="btn btn-secondary btn-sm" onclick="App.showAddStudentToClass('${c.id}')">+ Thêm HS</button>
              <button class="btn btn-secondary btn-sm" onclick="App.showCopyStudents('${c.id}')">📥 Copy HS</button>
              <button class="btn btn-danger btn-sm" onclick="App.deleteClass('${c.id}')">Xóa</button>` : ''}
            </div>
          </div>`;
    }).join('') : '<div class="empty-state"><div class="empty-emoji">🏫</div><h3>Chưa có lớp học</h3><p>Tạo lớp mới để bắt đầu!</p></div>'}
      </div>
      <div id="class-detail-area"></div>`;
  };

  const showAddClassModal = () => {
    const area = document.getElementById('class-detail-area') || document.getElementById('main-content');
    const gvList = state.users.filter(u => u.role === 'gv');
    area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()">
        <h2>➕ Tạo lớp mới <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="form-group"><label>Tên lớp</label><input id="new-class-name" placeholder="3A"></div>
        <div class="form-group"><label>Mô tả</label><input id="new-class-desc" placeholder="Lớp 3A"></div>
        ${isAdmin() ? `<div class="form-group"><label>Giáo viên phụ trách</label>
          <select id="new-class-gv">${gvList.map(g => `<option value="${g.id}">${g.hoTen}</option>`).join('')}</select></div>` : ''}
        <button class="btn btn-primary btn-full" onclick="App.addClass()">Tạo lớp</button>
      </div></div>`;
  };

  const addClass = async () => {
    const name = document.getElementById('new-class-name').value.trim();
    const desc = document.getElementById('new-class-desc')?.value.trim() || '';
    const gvEl = document.getElementById('new-class-gv');
    const gvId = gvEl ? gvEl.value : currentUser.id;
    if (!name) { showToast('Vui lòng nhập tên lớp', 'error'); return; }
    const cls = { tenLop: name, giaoVienId: gvId, namHocId: selectedYearId, moTa: desc };
    if (API.isConnected()) {
      const saved = await API.insert('classes', API.toDbClass(cls));
      if (saved) state.classes.push(API.mapClass(saved));
    } else {
      state.classes.push({ id: 'c' + Date.now(), ...cls });
      saveStateToLocal();
    }
    document.querySelector('.modal-overlay')?.remove();
    showToast('Đã tạo lớp! ✅', 'success');
    renderClassManager(document.getElementById('main-content'));
  };

  const deleteClass = async (classId) => {
    if (!confirm('Xóa lớp này?')) return;
    state.classes = state.classes.filter(c => c.id !== classId);
    state.classStudents = state.classStudents.filter(cs => cs.classId !== classId);
    if (API.isConnected()) await API.remove('classes', classId);
    else saveStateToLocal();
    showToast('Đã xóa lớp', 'info');
    renderClassManager(document.getElementById('main-content'));
  };

  const showClassStudents = (classId) => {
    const cls = state.classes.find(c => c.id === classId);
    const students = getStudentsInClass(classId);
    const area = document.getElementById('class-detail-area');
    area.innerHTML = `
      <div class="section-header" style="margin-top:24px;"><h2>👨‍🎓 Học sinh lớp ${cls?.tenLop || ''}</h2></div>
      ${students.length ? `<table class="data-table"><thead><tr><th>Avatar</th><th>Họ tên</th><th>Tài khoản</th><th></th></tr></thead><tbody>
        ${students.map(s => `<tr><td>${s.avatar}</td><td>${s.hoTen}</td><td>${s.username}</td>
          <td><button class="btn btn-danger btn-sm" onclick="App.removeStudentFromClass('${classId}','${s.id}')">Xóa</button></td></tr>`).join('')}
      </tbody></table>` : '<p style="color:var(--text-medium);">Chưa có học sinh trong lớp này.</p>'}`;
    area.scrollIntoView({ behavior: 'smooth' });
  };

  const showAddStudentToClass = (classId) => {
    const currentStudentIds = state.classStudents.filter(cs => cs.classId === classId).map(cs => cs.studentId);
    const available = state.users.filter(u => u.role === 'hs' && !currentStudentIds.includes(u.id));
    const area = document.getElementById('class-detail-area');
    area.innerHTML = `
      <div class="section-header" style="margin-top:24px;"><h2>➕ Thêm HS vào lớp</h2></div>
      ${available.length ? available.map(s => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
          <span>${s.avatar} ${s.hoTen} (${s.username})</span>
          <button class="btn btn-primary btn-sm" onclick="App.addStudentToClass('${classId}','${s.id}')">+ Thêm</button>
        </div>`).join('') : '<p style="color:var(--text-medium);">Không có HS nào có thể thêm.</p>'}`;
    area.scrollIntoView({ behavior: 'smooth' });
  };

  const addStudentToClass = async (classId, studentId) => {
    const exists = state.classStudents.find(cs => cs.classId === classId && cs.studentId === studentId);
    if (exists) { showToast('HS đã trong lớp', 'info'); return; }
    const cs = { classId, studentId };
    if (API.isConnected()) {
      const saved = await API.insert('class_students', { class_id: classId, student_id: studentId });
      if (saved) state.classStudents.push(API.mapClassStudent(saved));
    } else {
      state.classStudents.push({ id: 'cs' + Date.now(), ...cs });
      saveStateToLocal();
    }
    showToast('Đã thêm HS! ✅', 'success');
    showAddStudentToClass(classId);
  };

  const removeStudentFromClass = async (classId, studentId) => {
    const cs = state.classStudents.find(c => c.classId === classId && c.studentId === studentId);
    state.classStudents = state.classStudents.filter(c => !(c.classId === classId && c.studentId === studentId));
    if (API.isConnected() && cs) await API.remove('class_students', cs.id);
    else saveStateToLocal();
    showToast('Đã xóa HS khỏi lớp', 'info');
    showClassStudents(classId);
  };

  const showCopyStudents = (targetClassId) => {
    const otherClasses = state.classes.filter(c => c.id !== targetClassId);
    const area = document.getElementById('class-detail-area');
    area.innerHTML = `
      <div class="section-header" style="margin-top:24px;"><h2>📥 Copy danh sách HS từ lớp khác</h2></div>
      <p style="color:var(--text-medium);margin-bottom:12px;">Chọn lớp nguồn để copy HS sang lớp này:</p>
      ${otherClasses.length ? otherClasses.map(c => {
      const students = getStudentsInClass(c.id);
      const yearName = state.schoolYears.find(y => y.id === c.namHocId)?.ten || '';
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">
          <span style="flex:1;">🏫 ${c.tenLop} (${yearName}) — ${students.length} HS</span>
          <button class="btn btn-primary btn-sm" onclick="App.copyStudentsFromClass('${c.id}','${targetClassId}')">Copy →</button>
        </div>`;
    }).join('') : '<p>Không có lớp khác.</p>'}`;
    area.scrollIntoView({ behavior: 'smooth' });
  };

  const copyStudentsFromClass = async (sourceClassId, targetClassId) => {
    const sourceStudents = state.classStudents.filter(cs => cs.classId === sourceClassId);
    let count = 0;
    for (const cs of sourceStudents) {
      const exists = state.classStudents.find(x => x.classId === targetClassId && x.studentId === cs.studentId);
      if (!exists) {
        const newCs = { classId: targetClassId, studentId: cs.studentId };
        if (API.isConnected()) {
          const saved = await API.insert('class_students', { class_id: targetClassId, student_id: cs.studentId });
          if (saved) state.classStudents.push(API.mapClassStudent(saved));
        } else {
          state.classStudents.push({ id: 'cs' + Date.now() + count, ...newCs });
        }
        count++;
      }
    }
    if (!API.isConnected()) saveStateToLocal();
    showToast(`Đã copy ${count} HS! ✅`, 'success');
    renderClassManager(document.getElementById('main-content'));
  };

  // ---- Teacher Management (Admin only) ----
  const renderTeacherManager = (el) => {
    const teachers = state.users.filter(u => u.role === 'gv');
    el.innerHTML = `
      <div class="header-bar"><h1>👩‍🏫 Quản lý giáo viên</h1>
        <button class="btn btn-primary btn-sm" onclick="App.showAddTeacherModal()">+ Thêm GV</button>
      </div>
      ${teachers.length ? `<table class="data-table animate-fadeIn"><thead><tr><th>Avatar</th><th>Họ tên</th><th>Tài khoản</th><th>Số lớp</th><th></th></tr></thead><tbody>
        ${teachers.map(t => {
      const classCount = state.classes.filter(c => c.giaoVienId === t.id).length;
      return `<tr><td>${t.avatar}</td><td><strong>${t.hoTen}</strong></td><td>${t.username}</td><td>${classCount}</td>
            <td><button class="btn btn-danger btn-sm" onclick="App.deleteTeacher('${t.id}')">Xóa</button></td></tr>`;
    }).join('')}
      </tbody></table>` : '<div class="empty-state"><div class="empty-emoji">👩‍🏫</div><h3>Chưa có giáo viên</h3></div>'}`;
  };

  const showAddTeacherModal = () => {
    const area = document.getElementById('main-content');
    area.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()">
        <h2>➕ Thêm giáo viên <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="form-group"><label>Họ tên</label><input id="new-gv-name" placeholder="Nguyễn Văn A"></div>
        <div class="form-group"><label>Tài khoản</label><input id="new-gv-user" placeholder="giaovien2"></div>
        <div class="form-group"><label>Mật khẩu</label><input id="new-gv-pass" value="123456"></div>
        <button class="btn btn-primary btn-full" onclick="App.addTeacher()">Thêm</button>
      </div></div>`);
  };

  const addTeacher = async () => {
    const name = document.getElementById('new-gv-name').value.trim();
    const user = document.getElementById('new-gv-user').value.trim();
    const pass = document.getElementById('new-gv-pass').value.trim();
    if (!name || !user || !pass) { showToast('Vui lòng điền đầy đủ', 'error'); return; }
    const teacher = { hoTen: name, username: user, password: pass, role: 'gv', avatar: '👩‍🏫' };
    if (API.isConnected()) {
      const saved = await API.insert('users', API.toDbUser(teacher));
      if (saved) state.users.push(API.mapUser(saved));
    } else {
      state.users.push({ id: 'gv' + Date.now(), ...teacher });
      saveStateToLocal();
    }
    document.querySelector('.modal-overlay')?.remove();
    showToast(`Đã thêm GV ${name}! ✅`, 'success');
    renderTeacherManager(document.getElementById('main-content'));
  };

  const deleteTeacher = async (id) => {
    if (!confirm('Xóa giáo viên này?')) return;
    state.users = state.users.filter(u => u.id !== id);
    if (API.isConnected()) await API.remove('users', id);
    else saveStateToLocal();
    showToast('Đã xóa GV', 'info');
    renderTeacherManager(document.getElementById('main-content'));
  };

  // ---- School Year Management (Admin only) ----
  const renderSchoolYearManager = (el) => {
    el.innerHTML = `
      <div class="header-bar"><h1>📅 Quản lý năm học</h1>
        <button class="btn btn-primary btn-sm" onclick="App.showAddYearModal()">+ Thêm năm học</button>
      </div>
      <div class="card-grid animate-fadeIn">
        ${state.schoolYears.map(y => {
      const classCount = state.classes.filter(c => c.namHocId === y.id).length;
      const isActive = y.trangThai === 'active';
      return `<div class="card" style="border-top:4px solid ${isActive ? 'var(--primary)' : '#ccc'};">
            <div class="card-icon">📅</div>
            <div class="card-title">${y.ten}</div>
            <div style="margin-top:6px;">
              <span class="tag ${isActive ? 'tag-green' : 'tag-orange'}">${isActive ? '✅ Đang hoạt động' : '💾 Lưu trữ'}</span>
              <span class="tag" style="background:#eee;">🏫 ${classCount} lớp</span>
            </div>
            <div style="margin-top:8px; font-size:0.82rem; color:var(--text-medium);">${y.batDau || ''} → ${y.ketThuc || ''}</div>
            <div style="margin-top:12px; display:flex; gap:6px;">
              ${isActive ? `<button class="btn btn-secondary btn-sm" onclick="App.archiveYear('${y.id}')">Lưu trữ</button>` : `<button class="btn btn-secondary btn-sm" onclick="App.activateYear('${y.id}')">Kích hoạt</button>`}
              <button class="btn btn-danger btn-sm" onclick="App.deleteYear('${y.id}')">Xóa</button>
            </div>
          </div>`;
    }).join('')}
      </div>`;
  };

  const showAddYearModal = () => {
    const main = document.getElementById('main-content');
    main.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay show" onclick="this.remove()"><div class="modal" onclick="event.stopPropagation()">
        <h2>➕ Thêm năm học <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
        <div class="form-group"><label>Tên năm học</label><input id="new-year-name" placeholder="2026-2027"></div>
        <div class="form-group"><label>Ngày bắt đầu</label><input type="date" id="new-year-start"></div>
        <div class="form-group"><label>Ngày kết thúc</label><input type="date" id="new-year-end"></div>
        <button class="btn btn-primary btn-full" onclick="App.addYear()">Tạo năm học</button>
      </div></div>`);
  };

  const addYear = async () => {
    const ten = document.getElementById('new-year-name').value.trim();
    const batDau = document.getElementById('new-year-start').value;
    const ketThuc = document.getElementById('new-year-end').value;
    if (!ten) { showToast('Nhập tên năm học', 'error'); return; }
    const year = { ten, batDau, ketThuc, trangThai: 'active' };
    if (API.isConnected()) {
      const saved = await API.insert('school_years', API.toDbSchoolYear(year));
      if (saved) state.schoolYears.push(API.mapSchoolYear(saved));
    } else {
      state.schoolYears.push({ id: 'sy' + Date.now(), ...year });
      saveStateToLocal();
    }
    document.querySelector('.modal-overlay')?.remove();
    showToast('Đã tạo năm học! ✅', 'success');
    renderSchoolYearManager(document.getElementById('main-content'));
  };

  const archiveYear = async (yearId) => {
    const year = state.schoolYears.find(y => y.id === yearId);
    if (year) year.trangThai = 'archived';
    if (API.isConnected()) await API.update('school_years', yearId, { trang_thai: 'archived' });
    else saveStateToLocal();
    showToast('Năm học đã lưu trữ 💾', 'success');
    renderSchoolYearManager(document.getElementById('main-content'));
  };

  const activateYear = async (yearId) => {
    const year = state.schoolYears.find(y => y.id === yearId);
    if (year) year.trangThai = 'active';
    if (API.isConnected()) await API.update('school_years', yearId, { trang_thai: 'active' });
    else saveStateToLocal();
    showToast('Năm học đã kích hoạt ✅', 'success');
    renderSchoolYearManager(document.getElementById('main-content'));
  };

  const deleteYear = async (yearId) => {
    if (!confirm('Xóa năm học này? Tất cả lớp trong năm sẽ bị xóa.')) return;
    state.schoolYears = state.schoolYears.filter(y => y.id !== yearId);
    state.classes = state.classes.filter(c => c.namHocId !== yearId);
    if (API.isConnected()) await API.remove('school_years', yearId);
    else saveStateToLocal();
    if (selectedYearId === yearId) selectedYearId = state.schoolYears[0]?.id || null;
    showToast('Đã xóa năm học', 'info');
    renderSchoolYearManager(document.getElementById('main-content'));
  };


  // ============================================
  //  HONORS BOARD (Bảng Tuyên Dương)
  // ============================================
  const renderHonorsPage = (el) => {
    Honors.renderHonorsBoard(el, state, currentUser);
  };

  const addHonorEntry = async (studentId, title, reason, type) => {
    const honor = {
      hocSinhId: studentId, tieuDe: title, lyDo: reason, loai: type,
      thoiGian: new Date().toISOString().split('T')[0], createdBy: currentUser.id
    };
    if (API.isConnected()) {
      const saved = await API.insert('honors', API.toDbHonor(honor));
      if (saved) state.honors.push(API.mapHonor(saved));
    } else {
      state.honors.push({ id: 'h' + Date.now(), ...honor });
      saveStateToLocal();
    }
    showToast('Đã tuyên dương học sinh! 🌟', 'success');
    renderHonorsPage(document.getElementById('main-content'));
  };

  const deleteHonorEntry = async (id) => {
    state.honors = state.honors.filter(h => h.id !== id);
    if (API.isConnected()) await API.remove('honors', id);
    else saveStateToLocal();
    showToast('Đã xóa tuyên dương', 'info');
    renderHonorsPage(document.getElementById('main-content'));
  };

  // ============================================
  //  BULLETIN BOARD (Bảng Tin)
  // ============================================
  const renderBulletinPage = (el) => {
    Bulletin.renderBulletinBoard(el, state, currentUser);
  };

  const showPostDetailPage = (postId) => {
    const post = state.posts.find(p => p.id === postId);
    if (!post) { showToast('Không tìm thấy bài đăng', 'error'); return; }
    currentPage = 'bulletin-detail';
    Bulletin.renderPostDetail(document.getElementById('main-content'), post, state, currentUser);
  };

  const createPostEntry = async (title, content, type, pin, scope, targetIds) => {
    const post = {
      tieuDe: title, noiDung: content, tacGiaId: currentUser.id,
      loai: type, ghim: pin,
      phamVi: scope || 'toan-truong',
      doiTuong: targetIds || []
    };

    if (API.isConnected()) {
      const dbPost = API.toDbPost(post);
      const saved = await API.insert('posts', dbPost);
      if (saved) {
        state.posts.push(API.mapPost(saved));
        showToast('Đăng bài thành công! ✅', 'success');
        Bulletin.renderBulletinBoard(document.getElementById('main-content'), state, currentUser);
      }
    } else {
      state.posts.push({
        id: 'p' + Date.now(),
        createdAt: new Date().toISOString(),
        ...post
      });
      saveStateToLocal(); // Persistence for Demo Mode
      showToast('Đăng bài thành công! ✅', 'success');
      Bulletin.renderBulletinBoard(document.getElementById('main-content'), state, currentUser);
    }
  };
  const deletePost = async (id) => {
    state.posts = state.posts.filter(p => p.id !== id);
    state.comments = state.comments.filter(c => c.postId !== id);
    if (API.isConnected()) await API.remove('posts', id);
    else saveStateToLocal();
    showToast('Đã xóa bài đăng', 'info');
    navigateTo('bulletin');
  };

  const togglePinPost = async (id) => {
    const post = state.posts.find(p => p.id === id);
    if (!post) return;
    post.ghim = !post.ghim;
    if (API.isConnected()) await API.update('posts', id, { ghim: post.ghim });
    else saveStateToLocal();
    showToast(post.ghim ? 'Đã ghim bài đăng 📌' : 'Đã bỏ ghim', 'success');
    showPostDetailPage(id);
  };

  const addCommentEntry = async (postId) => {
    const input = document.getElementById('comment-input');
    if (!input) return;
    const content = input.value.trim();
    if (!content) { showToast('Vui lòng nhập bình luận', 'error'); return; }

    const comment = {
      postId, tacGiaId: currentUser.id, noiDung: content,
      createdAt: new Date().toISOString()
    };
    if (API.isConnected()) {
      const saved = await API.insert('comments', API.toDbComment(comment));
      if (saved) state.comments.push(API.mapComment(saved));
    } else {
      state.comments.push({ id: 'cm' + Date.now(), ...comment });
      saveStateToLocal();
    }
    showToast('Đã gửi bình luận! 💬', 'success');
    showPostDetailPage(postId);
  };

  const deleteCommentEntry = async (commentId, postId) => {
    state.comments = state.comments.filter(c => c.id !== commentId);
    if (API.isConnected()) await API.remove('comments', commentId);
    else saveStateToLocal();
    showToast('Đã xóa bình luận', 'info');
    showPostDetailPage(postId);
  };

  // ============================================
  //  GRADING (Connected to Grading Module)
  // ============================================
  const createGradingEntry = (data) => {
    // data: { studentId, subject, imageUrl, score, feedback, suggestions }
    const newGrading = {
      id: 'g' + Date.now(),
      teacherId: currentUser.id,
      timestamp: new Date().toISOString(),
      ...data
    };

    // If connected to Supabase, we would upload image and save to DB here.
    // For Demo/Local:
    state.gradings.push(newGrading);
    saveStateToLocal();
    showToast('Đã lưu kết quả chấm!', 'success');

    // Refresh if currently on grading page
    if (currentPage === 'grading') {
      Grading.renderTeacherGrading(document.getElementById('main-content'), state, currentUser);
    }
  };

  const deleteGradingEntry = (id) => {
    state.gradings = state.gradings.filter(g => g.id !== id);
    // if (API.isConnected()) ... (Future Supabase implementation)
    saveStateToLocal();
    showToast('Đã xóa bài chấm', 'info');
    if (currentPage === 'grading') {
      Grading.renderTeacherGrading(document.getElementById('main-content'), state, currentUser);
    }
  };

  // ---- Settings ----
  const renderSettings = (container) => {
    const supabaseUrl = localStorage.getItem('lms_supabase_url') || '';
    const supabaseKey = localStorage.getItem('lms_supabase_key') || '';
    const geminiKey = localStorage.getItem('lms_gemini_key') || '';

    container.innerHTML = `
      <div class="header-bar">
        <h1>⚙️ Cài đặt Hệ thống</h1>
      </div>
      <div class="card animate-fadeIn" style="max-width: 600px; margin: 0 auto;">
        <h3>🔌 Kết nối API</h3>
        <p class="text-medium">Nhập thông tin kết nối để sử dụng các tính năng nâng cao (Lưu trữ đám mây, Chấm điểm AI).</p>

        <div class="form-group" style="margin-top:20px;">
          <label>Supabase URL</label>
          <input type="text" id="set-sb-url" value="${supabaseUrl}" placeholder="https://xyz.supabase.co">
        </div>
        <div class="form-group">
          <label>Supabase Key (Anon/Public)</label>
          <input type="password" id="set-sb-key" value="${supabaseKey}" placeholder="eyJhbGciOiJIUzI1NiIsInR5...">
        </div>
        <div class="form-group">
          <label>Gemini API Key</label>
          <input type="password" id="set-gemini-key" value="${geminiKey}" placeholder="AIzaSy...">
        </div>
        
        <div style="margin-top:24px; display:flex; gap:10px;">
           <button class="btn btn-primary" onclick="App.saveSettings()">💾 Lưu Cài Đặt</button>
           <button class="btn btn-secondary" onclick="App.testConnection()">🔄 Kiểm tra kết nối</button>
        </div>
        
        <div id="connection-status" style="margin-top:16px; font-weight:bold;"></div>
      </div>
    `;
  };

  const saveSettings = () => {
    const url = document.getElementById('set-sb-url').value.trim();
    const key = document.getElementById('set-sb-key').value.trim();
    const gemini = document.getElementById('set-gemini-key').value.trim();

    if (url) localStorage.setItem('lms_supabase_url', url);
    if (key) localStorage.setItem('lms_supabase_key', key);
    if (gemini) localStorage.setItem('lms_gemini_key', gemini);

    showToast('Đã lưu cài đặt! Vui lòng tải lại trang.', 'success');
    setTimeout(() => window.location.reload(), 1500);
  };

  const testConnection = async () => {
    const status = document.getElementById('connection-status');
    status.textContent = 'Đang kiểm tra...';
    status.style.color = 'orange';

    const url = document.getElementById('set-sb-url').value.trim();
    const key = document.getElementById('set-sb-key').value.trim();

    if (url && key && typeof window.supabase !== 'undefined') {
      try {
        const client = window.supabase.createClient(url, key);
        const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });
        if (!error || (error && error.code !== 'PGRST301')) { // 301 is okay (JWT expired etc, means connection valid)
          status.textContent = '✅ Kết nối Supabase thành công! (Lưu ý: Cần tạo bảng DB)';
          status.style.color = 'green';
        } else {
          status.textContent = '❌ Lỗi Supabase: ' + error.message;
          status.style.color = 'red';
        }
      } catch (e) {
        status.textContent = '❌ Lỗi kết nối: ' + e.message;
        status.style.color = 'red';
      }
    } else {
      status.textContent = '⚠️ Chưa nhập đủ thông tin Supabase hoặc thư viện chưa tải.';
    }
  };

  // ---- Expose internal state for external modules ----
  const _getState = () => state;

  return {
    init, navigateTo, logout, showLessons, startExercises, saveExerciseResult,
    generateAI, saveAIExercises, showAddStudentModal, addStudent, deleteStudent,
    showStudentDetail, analyzeWithAI, addLesson, showAddSubjectModal, toggleSidebar,
    handleFileUpload, clearUploadedFile, generateFromFile, switchCreateTab,
    showCreateAssignment, createAssignment, deleteAssignment, showQRCode, copyAssignmentLink,
    renderStudentAssignments, startAssignment, applyAnalysisFilters, renderTeacherAssignments,
    connectSupabase, reloadFromSupabase,
    selectYear, selectClass,
    showAddClassModal, addClass, deleteClass, showClassStudents, showAddStudentToClass,
    addStudentToClass, removeStudentFromClass, showCopyStudents, copyStudentsFromClass,
    renderTeacherManager, showAddTeacherModal, addTeacher, deleteTeacher,
    showAddYearModal, addYear, archiveYear, activateYear, deleteYear,
    // Honors Board
    addHonorEntry, deleteHonorEntry,
    // Bulletin Board
    showPostDetail: showPostDetailPage, createPostEntry, deletePost, togglePinPost,
    addComment: addCommentEntry, deleteComment: deleteCommentEntry,
    // Grading
    createGradingEntry, deleteGradingEntry,
    // Settings
    renderSettings, saveSettings, testConnection,
    // State accessor
    _getState
  };
})();

// Init on load
document.addEventListener('DOMContentLoaded', App.init);
