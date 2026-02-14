/* ============================================
   Gamification Module
   ============================================ */

const Gamification = (() => {
    // Badge definitions
    const BADGES = [
        { id: 'first_exercise', name: 'Bước Đầu', icon: '🎯', desc: 'Hoàn thành bài tập đầu tiên', condition: (s) => s.totalExercises >= 1 },
        { id: 'five_exercises', name: 'Chăm Chỉ', icon: '📝', desc: 'Hoàn thành 5 bài tập', condition: (s) => s.totalExercises >= 5 },
        { id: 'ten_exercises', name: 'Siêu Sao', icon: '⭐', desc: 'Hoàn thành 10 bài tập', condition: (s) => s.totalExercises >= 10 },
        { id: 'perfect_score', name: 'Hoàn Hảo', icon: '💯', desc: 'Đạt 100% một bài', condition: (s) => s.hasPerfect },
        { id: 'streak3', name: 'Kiên Trì', icon: '🔥', desc: 'Streak 3 ngày liên tục', condition: (s) => s.streak >= 3 },
        { id: 'streak7', name: 'Bất Khuất', icon: '💪', desc: 'Streak 7 ngày liên tục', condition: (s) => s.streak >= 7 },
        { id: 'high_scorer', name: 'Cao Thủ', icon: '🏆', desc: 'Tổng điểm trên 500', condition: (s) => s.totalXP >= 500 },
        { id: 'explorer', name: 'Nhà Thám Hiểm', icon: '🧭', desc: 'Làm bài ở 3 môn khác nhau', condition: (s) => s.subjectsCount >= 3 },
        { id: 'speed', name: 'Nhanh Như Chớp', icon: '⚡', desc: 'Hoàn thành bài trong < 2 phút', condition: (s) => s.hasFastFinish },
        { id: 'improved', name: 'Tiến Bộ', icon: '📈', desc: 'Điểm bài sau cao hơn bài trước', condition: (s) => s.hasImproved },
        { id: 'all_types', name: 'Đa Năng', icon: '🌈', desc: 'Làm đủ 5 dạng bài tập', condition: (s) => s.typesCount >= 5 },
        { id: 'level5', name: 'Nhà Vô Địch', icon: '👑', desc: 'Đạt Level 5', condition: (s) => s.level >= 5 },
    ];

    // XP to Level conversion
    const getLevel = (xp) => {
        const levels = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000];
        for (let i = levels.length - 1; i >= 0; i--) {
            if (xp >= levels[i]) return { level: i + 1, currentXP: xp - levels[i], nextXP: (levels[i + 1] || levels[i] + 500) - levels[i] };
        }
        return { level: 1, currentXP: 0, nextXP: 50 };
    };

    // Calculate streak from dates
    const calcStreak = (dates) => {
        if (!dates.length) return 0;
        const sorted = [...new Set(dates.map(d => d.split('T')[0]))].sort().reverse();
        let streak = 1;
        const today = new Date().toISOString().split('T')[0];
        if (sorted[0] !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (sorted[0] !== yesterday) return 0;
        }
        for (let i = 1; i < sorted.length; i++) {
            const diff = (new Date(sorted[i - 1]) - new Date(sorted[i])) / 86400000;
            if (diff === 1) streak++;
            else break;
        }
        return streak;
    };

    // Evaluate which badges are earned
    const evaluateBadges = (stats) => {
        return BADGES.map(badge => ({
            ...badge,
            earned: badge.condition(stats)
        }));
    };

    // Render gamification dashboard
    const renderDashboard = (containerId, stats) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const levelInfo = getLevel(stats.totalXP);
        const badges = evaluateBadges(stats);
        const earnedCount = badges.filter(b => b.earned).length;
        const pct = Math.min(100, Math.round((levelInfo.currentXP / levelInfo.nextXP) * 100));

        container.innerHTML = `
      <div class="animate-fadeIn">
        <!-- Level & XP -->
        <div class="stat-card" style="margin-bottom:24px; text-align:center;">
          <div style="font-size:3rem; margin-bottom:8px;">🏅</div>
          <div style="font-size:1.5rem; font-weight:900; color:var(--primary);">Level ${levelInfo.level}</div>
          <div class="level-bar" style="margin: 14px auto; max-width: 400px;">
            <div class="level-bar-fill" style="width: ${pct}%;">${pct}%</div>
          </div>
          <div class="level-info" style="max-width: 400px; margin: 0 auto;">
            <span>${levelInfo.currentXP} XP</span>
            <span>${levelInfo.nextXP} XP để lên Level ${levelInfo.level + 1}</span>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">${stats.totalXP}</div>
            <div class="stat-label">Tổng XP</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${stats.streak}</div>
            <div class="stat-label">Ngày Streak</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏅</div>
            <div class="stat-value">${earnedCount}/${BADGES.length}</div>
            <div class="stat-label">Huy hiệu</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${stats.totalExercises}</div>
            <div class="stat-label">Bài đã làm</div>
          </div>
        </div>

        <!-- Badges -->
        <div class="section-header">
          <h2>🏆 Bộ sưu tập Huy hiệu</h2>
        </div>
        <div class="badges-grid">
          ${badges.map(b => `
            <div class="badge-card ${b.earned ? '' : 'locked'}">
              <div class="badge-icon">${b.icon}</div>
              <div class="badge-name">${b.name}</div>
              <div class="badge-desc">${b.desc}</div>
            </div>
          `).join('')}
        </div>

        <!-- Leaderboard -->
        <div class="section-header" style="margin-top:28px;">
          <h2>🏆 Bảng xếp hạng</h2>
        </div>
        <div class="leaderboard-list" id="leaderboard-list">
          ${renderLeaderboard(stats.leaderboard || [])}
        </div>
      </div>
    `;
    };

    const renderLeaderboard = (data) => {
        if (!data.length) return '<div class="empty-state"><div class="empty-emoji">🏆</div><h3>Chưa có dữ liệu</h3></div>';
        return data.map((item, i) => `
      <div class="leaderboard-item ${i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : ''}">
        <span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
        <span class="lb-avatar">${item.avatar || '😊'}</span>
        <span class="lb-name">${item.hoTen}</span>
        <span class="lb-xp">⭐ ${item.xp} XP</span>
      </div>
    `).join('');
    };

    return { BADGES, getLevel, calcStreak, evaluateBadges, renderDashboard, renderLeaderboard };
})();
