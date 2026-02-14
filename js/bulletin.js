/* ============================================
   Bulletin Module — Bảng Tin (Posts & Comments)
   Admin/GV đăng bài, HS/PHHS bình luận
   ============================================ */

const Bulletin = (() => {

  // ---- Các icon theo loại bài đăng ----
  const TYPE_CONFIG = {
    'thong-bao': { icon: '📢', label: 'Thông báo', color: '#6C5CE7' },
    'su-kien': { icon: '🎉', label: 'Sự kiện', color: '#00B894' },
    'tai-lieu': { icon: '📄', label: 'Tài liệu', color: '#FDCB6E' },
    'khac': { icon: '📌', label: 'Khác', color: '#74B9FF' }
  };

  // ---- Định dạng thời gian tương đối ----
  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ---- Render danh sách bài đăng ----
  const renderBulletinBoard = (container, state, currentUser) => {
    const isTA = currentUser.role === 'gv' || currentUser.role === 'admin';
    // Filter posts based on scope
    const visiblePosts = (state.posts || []).filter(post => {
      // Admin sees all
      if (currentUser.role === 'admin') return true;

      // Teacher sees own posts, global posts, and posts targeting their classes
      if (currentUser.role === 'gv') {
        if (post.tacGiaId === currentUser.id) return true; // Own post
        if (!post.phamVi || post.phamVi === 'toan-truong') return true; // Global
        // Check if post targets any class the teacher teaches
        // Logic: Teachers usually manage specific classes. state.classes links class to teacher.
        const myClasses = state.classes.filter(c => c.giaoVienId === currentUser.id).map(c => c.id);
        if (post.doiTuong && post.doiTuong.some(id => myClasses.includes(id))) return true;
        return false;
      }

      // Student sees global posts and posts targeting their class
      if (currentUser.role === 'hs') {
        if (!post.phamVi || post.phamVi === 'toan-truong') return true; // Global
        // Get student's class ID. Student object has 'lop' (name) e.g. "3A". Need to find ID.
        const myClass = state.classes.find(c => c.tenLop === currentUser.lop && c.namHocId === state.schoolYears.find(y => y.trangThai === 'active')?.id);
        if (myClass && post.doiTuong && post.doiTuong.includes(myClass.id)) return true;
        return false;
      }
      return false;
    });

    const posts = visiblePosts.sort((a, b) => {
      if (a.ghim && !b.ghim) return -1;
      if (!a.ghim && b.ghim) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    container.innerHTML = `
      <div class="header-bar">
        <h1>📢 Bảng Tin</h1>
        ${isTA ? '<button class="btn btn-primary btn-sm" onclick="Bulletin.showCreatePostModal()">+ Đăng bài mới</button>' : ''}
      </div>

      <!-- Bộ lọc -->
      <div class="bulletin-filters animate-fadeIn">
        <button class="bulletin-filter active" onclick="Bulletin.filterPosts('all', this)">📋 Tất cả</button>
        <button class="bulletin-filter" onclick="Bulletin.filterPosts('thong-bao', this)">📢 Thông báo</button>
        <button class="bulletin-filter" onclick="Bulletin.filterPosts('su-kien', this)">🎉 Sự kiện</button>
        <button class="bulletin-filter" onclick="Bulletin.filterPosts('tai-lieu', this)">📄 Tài liệu</button>
      </div>

      <!-- Danh sách bài đăng -->
      <div class="bulletin-list animate-fadeIn" id="bulletin-list">
        ${posts.length ? posts.map(post => renderPostCard(post, state, currentUser, isTA)).join('')
        : '<div class="empty-state"><div class="empty-emoji">📭</div><h3>Chưa có bài đăng nào phù hợp</h3></div>'}
      </div>

      <div id="bulletin-modal-area"></div>
    `;
  };

  // ... (renderPostCard, filterPosts, showPostDetail, renderPostDetail unchanged) ...

  const renderPostCard = (post, state, currentUser, isTA) => {
    const author = state.users.find(u => u.id === post.tacGiaId);
    const comments = (state.comments || []).filter(c => c.postId === post.id);
    const typeConf = TYPE_CONFIG[post.loai] || TYPE_CONFIG['khac'];
    const roleLabels = { admin: 'Quản trị viên', gv: 'Giáo viên', hs: 'Học sinh' };

    let scopeLabel = '';
    if (post.phamVi === 'lop-cu-the' && post.doiTuong) {
      const classNames = post.doiTuong.map(cid => {
        const c = state.classes.find(cls => cls.id === cid);
        return c ? c.tenLop : cid;
      }).join(', ');
      scopeLabel = `<span style="font-size:0.75rem;background:#eee;padding:2px 6px;border-radius:4px;margin-left:6px;" title="Chỉ hiển thị cho: ${classNames}">🔒 ${classNames}</span>`;
    }

    return `
      <div class="post-card ${post.ghim ? 'post-pinned' : ''}" data-type="${post.loai}" onclick="Bulletin.showPostDetail('${post.id}')">
        ${post.ghim ? '<div class="post-pin-badge">📌 Đã ghim</div>' : ''}
        <div class="post-header">
          <div class="post-author-info">
            <span class="post-author-avatar">${author ? author.avatar : '😊'}</span>
            <div>
              <div class="post-author-name">${author ? author.hoTen : 'Ẩn danh'} ${scopeLabel}</div>
              <div class="post-author-role">${author ? roleLabels[author.role] || '' : ''}</div>
            </div>
          </div>
          <div class="post-meta-right">
            <span class="post-type-badge" style="background:${typeConf.color}">${typeConf.icon} ${typeConf.label}</span>
            <span class="post-time">${timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <h3 class="post-title">${post.tieuDe}</h3>
        <div class="post-preview">${post.noiDung.substring(0, 150)}${post.noiDung.length > 150 ? '...' : ''}</div>
        <div class="post-footer">
          <span class="post-comment-count">💬 ${comments.length} bình luận</span>
          <span class="post-read-more">Xem chi tiết →</span>
        </div>
      </div>
    `;
  };

  // ---- Modal tạo bài đăng mới ----
  const showCreatePostModal = () => {
    const area = document.getElementById('bulletin-modal-area');
    if (!area) return;

    // Get classes for selection
    // If Admin: All active classes
    // If Teacher: Classes they teach (or all if we want to allow teachers to post to other classes?)
    // Let's restrict teachers to their own classes for now, or allow all if requested. USER said "đăng ở 1 lớp, đăng ở nhiều lớp", implying selection.
    // Let's allow selecting from ALL active classes for flexibility.
    const activeYearId = state.schoolYears.find(y => y.trangThai === 'active')?.id;
    const classes = state.classes.filter(c => c.namHocId === activeYearId);

    area.innerHTML = `
      <div class="modal-overlay show" onclick="this.remove()">
        <div class="modal" onclick="event.stopPropagation()" style="max-width:600px">
          <h2>📝 Đăng bài mới <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></h2>
          <div class="form-group">
            <label>📋 Tiêu đề</label>
            <input id="post-title" placeholder="VD: Thông báo lịch thi giữa kỳ">
          </div>
          
          <div class="form-group">
             <label>👁️ Phạm vi hiển thị</label>
             <div style="display:flex;gap:16px;margin-bottom:8px;">
                <label style="font-weight:normal;cursor:pointer;"><input type="radio" name="post-scope" value="toan-truong" checked onchange="document.getElementById('class-selector').style.display='none'"> 🌐 Toàn trường</label>
                <label style="font-weight:normal;cursor:pointer;"><input type="radio" name="post-scope" value="lop-cu-the" onchange="document.getElementById('class-selector').style.display='block'"> 🔒 Lớp cụ thể</label>
             </div>
             <div id="class-selector" style="display:none;border:1px solid #ddd;padding:10px;border-radius:6px;max-height:150px;overflow-y:auto;">
                ${classes.length ? classes.map(c => `
                    <label style="display:block;margin-bottom:4px;cursor:pointer;">
                        <input type="checkbox" class="post-target-class" value="${c.id}"> ${c.tenLop}
                    </label>
                `).join('') : '<p>Chưa có lớp học nào.</p>'}
             </div>
          </div>

          <div class="form-group">
            <label>📝 Nội dung</label>
            <textarea id="post-content" rows="5" placeholder="Nhập nội dung bài đăng..." style="width:100%;padding:12px 16px;border:2px solid #E8E8F0;border-radius:var(--radius-md);font-size:0.95rem;font-family:inherit;resize:vertical;"></textarea>
          </div>
          <div class="form-group">
            <label>📌 Loại bài đăng</label>
            <select id="post-type">
              <option value="thong-bao">📢 Thông báo</option>
              <option value="su-kien">🎉 Sự kiện</option>
              <option value="tai-lieu">📄 Tài liệu</option>
              <option value="khac">📌 Khác</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="post-pin" style="width:auto;">
            <label for="post-pin" style="margin:0;cursor:pointer;">📌 Ghim bài viết lên đầu</label>
          </div>
          <button class="btn btn-primary btn-full" onclick="Bulletin.createPost()">📢 Đăng bài</button>
        </div>
      </div>
    `;
  };

  // ---- Tạo bài đăng — gọi callback từ App ----
  const createPost = () => {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const type = document.getElementById('post-type').value;
    const pin = document.getElementById('post-pin').checked;

    const scope = document.querySelector('input[name="post-scope"]:checked').value;
    const targetIds = [];
    if (scope === 'lop-cu-the') {
      document.querySelectorAll('.post-target-class:checked').forEach(cb => targetIds.push(cb.value));
      if (targetIds.length === 0) { showToast('Vui lòng chọn ít nhất 1 lớp!', 'error'); return; }
    }

    if (!title || !content) { showToast('Vui lòng nhập tiêu đề và nội dung', 'error'); return; }
    if (typeof App !== 'undefined' && App.createPostEntry) {
      App.createPostEntry(title, content, type, pin, scope, targetIds);
    }
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
  };

  return {
    renderBulletinBoard, renderPostDetail,
    showCreatePostModal, createPost,
    filterPosts, showPostDetail,
    TYPE_CONFIG, timeAgo
  };
})();
