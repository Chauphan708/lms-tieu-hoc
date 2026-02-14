-- ============================================
-- Supabase Schema for LMS Tiểu Học
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users (HS + GV + Admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ho_ten TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hs' CHECK (role IN ('hs', 'gv', 'admin')),
  avatar TEXT DEFAULT '😊',
  lop TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. School Years (Năm học)
CREATE TABLE IF NOT EXISTS school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten TEXT NOT NULL,
  bat_dau DATE,
  ket_thuc DATE,
  trang_thai TEXT DEFAULT 'active' CHECK (trang_thai IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Classes (Lớp học)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten_lop TEXT NOT NULL,
  giao_vien_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nam_hoc_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  mo_ta TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Class Students (HS thuộc lớp — N:N)
CREATE TABLE IF NOT EXISTS class_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(class_id, student_id)
);

-- 5. Subjects (Môn học)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ten_mon TEXT NOT NULL,
  mo_ta TEXT DEFAULT '',
  icon TEXT DEFAULT '📚',
  mau_sac TEXT DEFAULT '#6C5CE7',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lessons (Bài học)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mon_hoc_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  tieu_de TEXT NOT NULL,
  noi_dung TEXT DEFAULT '',
  thu_tu INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Exercises (Bài tập) — có hỗ trợ ảnh
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bai_hoc_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  dang TEXT NOT NULL CHECK (dang IN ('trac-nghiem', 'keo-tha', 'noi-cot', 'sap-xep', 'tu-luan')),
  cau_hoi TEXT NOT NULL,
  hinh_anh TEXT DEFAULT '',
  diem INT DEFAULT 10,
  du_lieu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Assignments (Giao bài)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tieu_de TEXT NOT NULL,
  bai_hoc_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  giao_vien_id UUID REFERENCES users(id) ON DELETE SET NULL,
  exercise_ids UUID[] DEFAULT '{}',
  bat_dau TIMESTAMPTZ DEFAULT NOW(),
  ket_thuc TIMESTAMPTZ,
  so_lan_lam_lai INT DEFAULT 1,
  che_do_xem TEXT DEFAULT 'dung-sai-dap-an' CHECK (che_do_xem IN ('dung-sai-dap-an', 'dung-sai', 'chi-diem')),
  trang_thai TEXT DEFAULT 'active' CHECK (trang_thai IN ('active', 'expired', 'draft')),
  ma_link TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Results (Kết quả làm bài)
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hoc_sinh_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bai_tap_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  cau_tra_loi TEXT DEFAULT '',
  dung_sai BOOLEAN DEFAULT FALSE,
  diem_dat INT DEFAULT 0,
  thoi_gian_lam INT DEFAULT 0,
  ngay_lam DATE DEFAULT CURRENT_DATE,
  cau_hoi TEXT DEFAULT '',
  dang TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Rewards (Điểm thưởng)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hoc_sinh_id UUID REFERENCES users(id) ON DELETE CASCADE,
  loai TEXT DEFAULT 'huy-hieu',
  gia_tri TEXT DEFAULT '',
  mo_ta TEXT DEFAULT '',
  ngay_nhan DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (school app — simplified)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON school_years FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON class_students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON rewards FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Demo Data
-- ============================================

-- Users: 1 Admin + 1 GV + 4 HS
INSERT INTO users (id, ho_ten, username, password, role, avatar, lop) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Quản trị viên', 'admin', '123456', 'admin', '🛡️', ''),
  ('00000000-0000-0000-0000-000000000001', 'Cô Nguyễn Thị Mai', 'giaovien', '123456', 'gv', '👩‍🏫', ''),
  ('00000000-0000-0000-0000-000000000002', 'Nguyễn Văn An', 'an123', '111111', 'hs', '👦', '3A'),
  ('00000000-0000-0000-0000-000000000003', 'Trần Thị Bảo', 'bao123', '222222', 'hs', '👧', '3A'),
  ('00000000-0000-0000-0000-000000000004', 'Lê Minh Châu', 'chau123', '333333', 'hs', '🧒', '3B'),
  ('00000000-0000-0000-0000-000000000005', 'Phạm Đức Dũng', 'dung123', '444444', 'hs', '👦', '3B')
ON CONFLICT (username) DO NOTHING;

-- School Year
INSERT INTO school_years (id, ten, bat_dau, ket_thuc, trang_thai) VALUES
  ('00000000-0000-0000-0003-000000000001', '2025-2026', '2025-09-01', '2026-05-31', 'active')
ON CONFLICT DO NOTHING;

-- Classes: 2 lớp do GV Mai tạo
INSERT INTO classes (id, ten_lop, giao_vien_id, nam_hoc_id, mo_ta) VALUES
  ('00000000-0000-0000-0004-000000000001', '3A', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001', 'Lớp 3A - Cô Mai'),
  ('00000000-0000-0000-0004-000000000002', '3B', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0003-000000000001', 'Lớp 3B - Cô Mai')
ON CONFLICT DO NOTHING;

-- Class Students
INSERT INTO class_students (class_id, student_id) VALUES
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- Subjects
INSERT INTO subjects (id, ten_mon, mo_ta, icon, mau_sac) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Toán', 'Số học, hình học, đo lường', '🔢', '#6C5CE7'),
  ('00000000-0000-0000-0001-000000000002', 'Tiếng Việt', 'Đọc, viết, ngữ pháp', '📖', '#00B894'),
  ('00000000-0000-0000-0001-000000000003', 'Khoa học', 'Tự nhiên, xã hội', '🔬', '#E17055'),
  ('00000000-0000-0000-0001-000000000004', 'Tiếng Anh', 'Từ vựng, ngữ pháp cơ bản', '🌍', '#FDCB6E')
ON CONFLICT DO NOTHING;

-- Lessons
INSERT INTO lessons (id, mon_hoc_id, tieu_de, noi_dung, thu_tu) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'Phép cộng trong phạm vi 1000', 'Học cách cộng các số có 3 chữ số', 1),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000001', 'Phép trừ trong phạm vi 1000', 'Học cách trừ các số có 3 chữ số', 2),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000002', 'Từ đồng nghĩa, trái nghĩa', 'Nhận biết và sử dụng từ đồng nghĩa, trái nghĩa', 1),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000003', 'Hệ Mặt Trời', 'Tìm hiểu về các hành tinh trong hệ Mặt Trời', 1)
ON CONFLICT DO NOTHING;
